type Level = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  requestId?: string;
  [k: string]: unknown;
}

const isProd = import.meta.env.PROD;

function emit(level: Level, msg: string, ctx?: LogContext) {
  if (isProd && (level === 'debug' || level === 'info')) return;

  const entry = { ts: new Date().toISOString(), level, msg, ...ctx };
  const prefix = `[OutputFirst][${level}]`;

  if (level === 'error') console.error(prefix, entry);
  else if (level === 'warn') console.warn(prefix, entry);
  else console.log(prefix, entry);
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit('debug', msg, ctx),
  info:  (msg: string, ctx?: LogContext) => emit('info',  msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => emit('warn',  msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit('error', msg, ctx),
};
