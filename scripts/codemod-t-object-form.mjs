#!/usr/bin/env node
/**
 * Codemod: rewrite positional t() / bilingual() calls to a single object argument.
 *
 *   t('fr', 'en', 'es', 'zh-Hans', 'zh-Hant')
 *     → t({ fr: 'fr', en: 'en', es: 'es', 'zh-Hans': 'zh-Hans', 'zh-Hant': 'zh-Hant' })
 *
 * Skips calls that already pass a single ObjectLiteralExpression argument.
 *
 * Discovery is per-file: a file is in scope iff it destructures `t` and/or
 * `bilingual` from a call to `useLanguage()`. Within those files, every
 * CallExpression whose callee is an `Identifier` named `t` or `bilingual`
 * (matching one of the destructured locals) gets rewritten.
 *
 * Why this scope is safe (per repo audit):
 *   - No other top-level identifier named `t` or `bilingual` is ever
 *     called as a function in this codebase. Arrow params like
 *     `thoughts.find(t => t.id)` use `t` as a member-access target,
 *     never `t(...)`.
 *   - `bilingual(...)` only ever refers to the LanguageContext helper.
 *
 * Usage:
 *   node scripts/codemod-t-object-form.mjs            # in-place rewrite
 *   node scripts/codemod-t-object-form.mjs --dry      # print what would change
 *   node scripts/codemod-t-object-form.mjs --verbose  # log every rewrite
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import ts from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const argv = new Set(process.argv.slice(2));
const DRY = argv.has('--dry');
const VERBOSE = argv.has('--verbose');

// File set: every .ts / .tsx under src/ and e2e/.
function listFiles() {
  const out = execSync(
    `find src e2e -type f \\( -name '*.ts' -o -name '*.tsx' \\)`,
    { cwd: ROOT, encoding: 'utf8' },
  );
  return out.trim().split('\n').filter(Boolean).map((p) => join(ROOT, p));
}

const LANG_FIELDS = ['fr', 'en', 'es', 'zh-Hans', 'zh-Hant'];

/**
 * Returns the local names bound to the LanguageContext `t` and `bilingual`
 * via `const { t, bilingual } = useLanguage()` (or aliased like `t: tx`).
 *
 * Returns `{ t: Set<string>, bilingual: Set<string> }`.
 */
function findContextLocals(sourceFile) {
  const result = { t: new Set(), bilingual: new Set() };

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === 'useLanguage' &&
      node.name &&
      ts.isObjectBindingPattern(node.name)
    ) {
      for (const element of node.name.elements) {
        if (!ts.isBindingElement(element)) continue;
        const propName = element.propertyName
          ? (ts.isIdentifier(element.propertyName) ? element.propertyName.text : null)
          : (ts.isIdentifier(element.name) ? element.name.text : null);
        const localName = ts.isIdentifier(element.name) ? element.name.text : null;
        if (!propName || !localName) continue;
        if (propName === 't') result.t.add(localName);
        else if (propName === 'bilingual') result.bilingual.add(localName);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return result;
}

/**
 * Encodes a string literal for source output. We prefer single quotes,
 * escape embedded single quotes, and pass through any backslash escapes
 * by re-reading from the original source range so we don't corrupt
 * Unicode / accented characters.
 */
function getOriginalText(node, sourceFile) {
  return sourceFile.text.slice(node.getStart(sourceFile), node.getEnd());
}

/**
 * Build the object-literal replacement for a positional arg list.
 * Always emits the three required keys; emits zh-Hans / zh-Hant only
 * when the original call passed them. Preserves the exact original
 * source text of each argument expression (template literals, ternaries,
 * variable refs, accented string literals, escapes — all kept verbatim).
 */
function buildObjectLiteral(args, sourceFile) {
  const parts = [];
  const max = Math.min(args.length, LANG_FIELDS.length);
  for (let i = 0; i < max; i++) {
    const key = LANG_FIELDS[i];
    const value = getOriginalText(args[i], sourceFile);
    const renderedKey = key.includes('-') ? `'${key}'` : key;
    parts.push(`${renderedKey}: ${value}`);
  }
  return `{ ${parts.join(', ')} }`;
}

/**
 * One pass over a single file. Collects every rewrite as a
 * { start, end, replacement } edit, then applies them right-to-left.
 */
function rewriteFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    original,
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const locals = findContextLocals(sourceFile);
  if (locals.t.size === 0 && locals.bilingual.size === 0) {
    return { filePath, changes: 0, skipReason: 'no useLanguage destructure' };
  }

  const edits = [];

  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      const isT = locals.t.has(name);
      const isB = locals.bilingual.has(name);
      if (isT || isB) {
        const args = node.arguments;
        // Skip already-converted call: single ObjectLiteralExpression arg.
        const alreadyObject =
          args.length === 1 && ts.isObjectLiteralExpression(args[0]);
        if (!alreadyObject && args.length > 0) {
          // Args must be 1..5 (fr, en, es, zhHans?, zhHant?). Anything else
          // is unexpected — flag and skip rather than guess.
          if (args.length < 1 || args.length > 5) {
            console.warn(
              `[skip arity] ${relative(ROOT, filePath)}:${
                sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
              } — ${name}() has ${args.length} args`,
            );
          } else {
            // Replace the slice from the first arg start to the last arg end
            // (preserving the surrounding `(` / `)` and any trailing comments).
            const start = args[0].getStart(sourceFile);
            const end = args[args.length - 1].getEnd();
            const replacement = buildObjectLiteral(args, sourceFile);
            edits.push({ start, end, replacement });
            if (VERBOSE) {
              const line =
                sourceFile.getLineAndCharacterOfPosition(start).line + 1;
              console.log(
                `[rewrite] ${relative(ROOT, filePath)}:${line} — ${name}(...)`,
              );
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (edits.length === 0) {
    return { filePath, changes: 0 };
  }

  // Apply edits right-to-left so offsets don't shift.
  edits.sort((a, b) => b.start - a.start);
  let text = original;
  for (const e of edits) {
    text = text.slice(0, e.start) + e.replacement + text.slice(e.end);
  }

  if (!DRY) {
    writeFileSync(filePath, text, 'utf8');
  }
  return { filePath, changes: edits.length };
}

function main() {
  const files = listFiles();
  let touched = 0;
  let totalEdits = 0;
  const touchedFiles = [];

  for (const f of files) {
    const r = rewriteFile(f);
    if (r.changes > 0) {
      touched += 1;
      totalEdits += r.changes;
      touchedFiles.push({ file: relative(ROOT, f), changes: r.changes });
    }
  }

  console.log(
    `\n${DRY ? '[DRY] ' : ''}${totalEdits} call sites across ${touched} files`,
  );
  if (VERBOSE || DRY) {
    for (const t of touchedFiles) {
      console.log(`  ${t.changes.toString().padStart(4)} ${t.file}`);
    }
  }
}

main();
