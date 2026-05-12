const colors = {
  reset: '\u001B[0m',
  bright: '\u001B[1m',
  dim: '\u001B[2m',
  underscore: '\u001B[4m',
  blink: '\u001B[5m',
  reverse: '\u001B[7m',
  hidden: '\u001B[8m',

  fg: {
    black: '\u001B[30m',
    red: '\u001B[31m',
    green: '\u001B[32m',
    yellow: '\u001B[33m',
    blue: '\u001B[34m',
    magenta: '\u001B[35m',
    cyan: '\u001B[36m',
    white: '\u001B[37m',
    crimson: '\u001B[38m',
  },
  bg: {
    black: '\u001B[40m',
    red: '\u001B[41m',
    green: '\u001B[42m',
    yellow: '\u001B[43m',
    blue: '\u001B[44m',
    magenta: '\u001B[45m',
    cyan: '\u001B[46m',
    white: '\u001B[47m',
    crimson: '\u001B[48m',
  },
};

function log(message?: string, ...optionalParameters: unknown[]) {
  console.log(
    `[${new Date().toLocaleString()}]`,
    colors.fg.magenta,
    '[LOG]',
    colors.reset,
    message,
    ...optionalParameters,
  );
}

function info(message?: string, ...optionalParameters: unknown[]) {
  console.info(
    `[${new Date().toLocaleString()}]`,
    colors.fg.cyan,
    '[INFO]',
    colors.reset,
    message,
    ...optionalParameters,
  );
}

function warn(message?: string, ...optionalParameters: unknown[]) {
  console.warn(
    `[${new Date().toLocaleString()}]`,
    colors.fg.yellow,
    '[WARN]',
    colors.reset,
    message,
    ...optionalParameters,
  );
}

function error(message?: string, ...optionalParameters: unknown[]) {
  console.error(
    `[${new Date().toLocaleString()}]`,
    colors.fg.red,
    '[ERROR]',
    colors.reset,
    message,
    ...optionalParameters,
  );
}

const logger = {
  log,
  info,
  warn,
  error,
  warning: warn,
};

export { logger };
