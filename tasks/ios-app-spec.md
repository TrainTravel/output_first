# iOS app — spec & build checklist

**Goal:** App Store listing to validate demand. Capacitor wrap of the existing
React app + minimal native polish. Not a marketing-grade launch; the bar is
"can iOS users find this and does anyone use it after day 7?"

**Decision date:** 2026-05-30
**Status:** planned, not started

---

## 0. Prerequisites (do these once, in this order)

1. **Apple Developer Program enrollment** — `developer.apple.com/programs`
   - Cost: $99/year recurring. Personal account is fine; Organization adds
     1-3 weeks of D-U-N-S verification you don't need yet.
   - Enrolling takes 24-48 h. Start this on day 1; don't wait.

2. **Xcode** (latest stable) — Mac App Store, ~10 GB download.

3. **Bundle ID reserved** — App Store Connect → Identifiers
   - Suggested: `com.traintravel.outputfirst` (match your existing GitHub org)
   - Once reserved, can't easily change without re-submitting.

4. **App icon source asset** — 1024×1024 PNG, no transparency, no rounded
   corners (Apple rounds it). Sage-green palette to match the web app.

5. **Privacy policy URL** — write a 1-page plain-English policy. Must mention:
   - What's collected (journal text, language preferences, optional email)
   - Where it's stored (Supabase, hosted region)
   - That AI processes text (Lovable gateway → Gemini/Claude)
   - That nothing is sold to third parties
   - Host on Vercel/Lovable subdomain or `quietwordsgrow.com/privacy`.

---

## 1. Phase 1 — Capacitor scaffold (1-2 days)

Install + init:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "OutputFirst" "com.traintravel.outputfirst" \
  --web-dir=dist
npm run build
npx cap add ios
npx cap copy ios
npx cap open ios   # opens Xcode
```

Verify on iOS Simulator first (faster iteration), then a real device:

- [ ] App boots, lands on home
- [ ] Auth flow works (anonymous + email signup)
- [ ] Journal flow end-to-end → 'complete' screen
- [ ] Brain Dump save survives a reload
- [ ] Language switching works (chip + settings)
- [ ] Philosopher quote dialog opens

Known fix-ups required:

- **Safe-area insets** — the notch / dynamic island will overlap the header
  chip. Wrap the root in a `pt-[env(safe-area-inset-top)]` (Tailwind v3 syntax
  supports `safe-top` arbitrary), or use Capacitor's `StatusBar.setOverlaysWebView`.
- **Disable double-tap zoom** — meta viewport already disables this in modern
  Capacitor templates, but verify.
- **Keyboard handling** — the WriteScreen textarea will be obscured by the
  iOS keyboard. Install `@capacitor/keyboard` and add
  `KeyboardResize.body` or `KeyboardResize.native` mode.
- **Supabase URL** — already uses absolute URL; no localhost issue.
- **Local-storage data** survives app restarts on iOS Capacitor (it's WKWebView
  persistent storage). Verify by writing, killing the app, reopening.

---

## 2. Phase 2 — Native polish (2-3 days)

These three native APIs are the "not just a wrapped webview" insurance against
App Store guideline 4.2 rejection. Keep additions minimal and additive — they
should fail open if a permission is denied.

### 2.1 Haptics

```bash
npm install @capacitor/haptics
npx cap sync
```

Add to:
- Journal completion (after gratitude save or skip-to-complete)
- Brain Dump thought saved
- Small Wins added
- Philosopher quote dialog opens (subtle)

API: `Haptics.impact({ style: ImpactStyle.Light })` for most; `Medium` for
journal complete.

### 2.2 Local notifications (opt-in daily reminder)

```bash
npm install @capacitor/local-notifications
npx cap sync
```

UX:
- Settings screen → new "Daily reminder" toggle
- When enabled, prompt for permission, schedule a daily notification at a
  user-picked time (default 8pm local). Copy: "*Take 2 minutes for yourself.*"
  Bilingual per active profile.
- When disabled, cancel pending notifications.
- Per CLAUDE.md "no streak anxiety": notification copy should NEVER mention
  streak loss, breaks, or guilt.

### 2.3 Status bar + splash + icon

- `@capacitor/status-bar` — set style: `Style.Light` for the sage palette
- `@capacitor/splash-screen` — show OutputFirst wordmark briefly on launch
- Icon: drop the 1024×1024 source into `App/App/Assets.xcassets/AppIcon.appiconset`
- Splash: 2732×2732 source into `App/App/Assets.xcassets/Splash.imageset`

### 2.4 Optional but cheap

- **Biometric unlock** (Face ID / Touch ID gate on app open) —
  `@capacitor-community/biometric-auth`. Adds a sense of "this is private"
  which fits the journal use case. Skip if it adds friction in user tests.

---

## 3. Phase 3 — Apple compliance (1-2 days)

### 3.1 Sign in with Apple — NOT required today

Current auth: anonymous + email/password only. Apple guideline 4.8 triggers
only when you offer a *third-party social login* (Google, Facebook, GitHub,
etc.). You don't.

**If you add Google/GitHub later:** Sign in with Apple becomes mandatory at
that point. Schedule the integration as part of the same PR — it's
~half a day with Supabase's built-in Apple provider:

```ts
await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: { redirectTo: 'com.traintravel.outputfirst://auth/callback' }
});
```

Requires:
- Apple Developer Console → Identifiers → enable Sign in with Apple capability
- Add Services ID, private key, team ID to Supabase auth providers

### 3.2 Privacy nutrition label (App Store Connect)

Declare under "Data Used to Track You" → **None**.

Declare under "Data Linked to You":
- **Contact Info / Email** (optional sign-up)
- **User Content / Other** (journal text, brain-dump thoughts, gratitude notes)
- **Identifiers / User ID** (Supabase anonymous + authenticated IDs)
- **Usage Data / Product Interaction** (only if you add analytics; default no)

Declare under "Data Not Collected":
- Health, financial, location, contacts, browsing history, search history

Per category, mark: NOT used for tracking, NOT used for ads, USED for app
functionality.

### 3.3 Privacy policy URL — required field

Must be live before submission. See Prerequisites step 5.

### 3.4 App Store listing copy

Draft locally before opening App Store Connect. Don't author in the web UI —
it's slow and you lose work on tab close.

- **Name:** OutputFirst — 30 char max. Already fits.
- **Subtitle:** 30 char max. Suggested: "Bilingual journal for ADHD minds"
- **Promotional text:** 170 char, editable without re-review. Use for limited
  drops ("New: daily quotes from Merleau-Ponty, Dōgen, Borges").
- **Description:** 4000 char. Lead with the problem (blank page + ADHD time
  blindness), then the 3 anchors (Write today, Brain Dump, Thought Garden),
  then the multilingual angle. NO marketing fluff; the spec audience IS the
  target user.
- **Keywords:** 100 char comma-separated. Hot candidates: `journal,ADHD,
  bilingual,french,japanese,mindfulness,reflection,mental health,writing,
  language learning`
- **Support URL:** GitHub Issues link is fine for v1.

### 3.5 Screenshots (required, all device sizes)

iPhone 6.7" (15 Pro Max), 6.5" (XS Max), 5.5" (8 Plus) — 3-10 each.
Use Simulator's `Cmd+S` to grab them. Suggested order:
1. Home with streak + chip in JA
2. Brain Dump with 3-4 thoughts
3. Thought Garden cluster view
4. Reflection screen with a hard emotion
5. Philosopher quote dialog (Merleau-Ponty)

Tools: skip Photoshop overlays for v1. Apple accepts raw simulator caps.

---

## 4. Phase 4 — TestFlight + submit (1 week wall clock)

### 4.1 TestFlight beta

- Archive in Xcode → upload to App Store Connect
- Internal Testing group: just you, no review required
- External Testing group: 5-10 ADHD friends. Apple reviews the FIRST external
  build (1 day usually). Subsequent builds skip review until major changes.
- Beta duration: minimum 7 days. Watch:
  - Day 1: do they actually open it?
  - Day 3: do they complete a journal entry?
  - Day 7: do they come back?
- Collect feedback via TestFlight's built-in form. Don't add in-app feedback
  before launch — adds review complexity.

### 4.2 Submission for review

Pre-submission checklist:

- [ ] App icon present in all required sizes
- [ ] Splash screen displays on launch
- [ ] No crashes on cold start (test on iPhone simulator + real device)
- [ ] All TestFlight feedback addressed or triaged
- [ ] Privacy policy URL live and reachable
- [ ] Privacy nutrition label matches actual data flow
- [ ] App description, keywords, screenshots uploaded
- [ ] Build version and number bumped
- [ ] Demo account credentials provided (if reviewer needs them — anonymous
      sign-in dodges this requirement)
- [ ] Apple Developer fees paid + not lapsing soon

Submit. Review typically takes 1-3 days. Possible outcomes:
- **Approved** — you can release immediately or schedule
- **Rejected** — most common reasons (in declining order):
  1. Privacy nutrition mismatch (fix the label, resubmit)
  2. Guideline 4.2 "minimum functionality" — mitigated by Phase 2 native APIs
  3. Crash on review device (run their reproduction, fix, resubmit)
  4. Missing privacy policy link
  5. Misleading screenshots

If rejected, the reviewer's message is usually actionable. Resubmitting is
fast (back of the queue, but typically still <24 h).

---

## 5. Risk register

| Risk | Probability | Mitigation |
|---|---|---|
| Guideline 4.2 rejection ("wrapped webview") | Medium | Phase 2 native APIs (haptics + notifications). Document them in the review notes. |
| Privacy nutrition mismatch | Medium | Audit data flow before label submission. List every Supabase table you write to, every edge fn that gets text. |
| Apple Developer enrollment delay | Low-Medium | Start enrollment on day 1; don't sequence after building. |
| Capacitor + Supabase auth redirect issues | Low | Use `redirectTo` deep-link scheme registered in `Info.plist`. |
| WebView memory leak on long sessions | Low | Test journal flow + browse + return 20× in a row. |
| Daily notification rejected by user → silent loss | Low | UX: clear opt-in toggle in settings; respect denial. |

---

## 6. Out of scope for v1 (defer to post-launch)

- Apple Health integration (mood / sleep correlation)
- Lock-screen widgets ("Write today" tile) — separate native target, ~3 days
- Push notifications via APNs (need backend; local notifications cover daily
  reminder for v1)
- In-app purchase / subscription (per CLAUDE.md monetization rules; defer
  until value is confirmed)
- iPad layout polish (the phone layout will scale up acceptably for v1)
- macOS / Mac Catalyst build
- Sign in with Apple (only required if you add a 3rd-party social login)
- Localized App Store listings (English only for v1; add fr/es/ja/zh-* after
  validation if those geographies show signal)

---

## 7. Budget / cost summary

| Item | Cost | Recurring? |
|---|---|---|
| Apple Developer Program | $99 | Yearly |
| Build time | ~8-12 days of focused work | One-shot |
| TestFlight | Free | — |
| App Store review | Free | Per submission |
| Privacy policy hosting | $0 (existing) | — |
| Icon/splash design | $0 if DIY, else ~$50-200 | One-shot |
| **Total to first listing** | **~$99 + your time** | — |

---

## 8. Open questions to resolve before starting

1. **Bundle identifier** — confirm `com.traintravel.outputfirst` or pick
   another. Whatever you pick is permanent on the App Store.
2. **App name** — "OutputFirst" works but is generic. Worth A/B-testing
   alternatives during the beta? (e.g. "Quiet Words" tying to the repo name,
   though that's less self-explanatory.)
3. **Subtitle / tagline** — current draft "Bilingual journal for ADHD minds";
   open to alternatives.
4. **Privacy policy hosting** — `quietwordsgrow.com/privacy`? Vercel sub-route?
5. **Demand validation metric** — what does "demand validated" mean to you?
   Suggested: ≥30 day-7 retained users by week 8 post-launch.

---

## 9. References

- [Capacitor + iOS getting started](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — esp. 2.1, 4.2, 4.8, 5.1.1
- [Supabase + Capacitor auth guide](https://supabase.com/docs/guides/auth/social-login/auth-apple) (only relevant when SiwA needed)
- This project's CLAUDE.md — ADHD-friendly UX principles directly inform
  haptic + notification copy decisions
