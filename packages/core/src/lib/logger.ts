type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const colors: Record<LogLevel, string> = {
  debug: 'gray',
  info: 'dodgerblue',
  warn: 'darkorange',
  error: 'crimson',
};

// Binding keeps the caller's file and line in the browser console instead of this file.
const bindLevel = (level: LogLevel) =>
  console[level].bind(console, `%c${level.toUpperCase()}`, `color: ${colors[level]}; font-weight: bold`);

/** Console logger that prefixes messages with a colored level. */
export const logger = {
  debug: bindLevel('debug'),
  info: bindLevel('info'),
  warn: bindLevel('warn'),
  error: bindLevel('error'),
};
