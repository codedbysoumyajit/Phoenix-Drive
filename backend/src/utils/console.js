import chalk from 'chalk';

/**
 * @description Enum for log levels.
 * Using Object.freeze to make it immutable.
 * @readonly
 * @enum {string}
 */
const LogLevel = Object.freeze({
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
});

/**
 * @description Color mapping for each log level.
 * @type {Record<LogLevel, import('chalk').ColorName>}
 */
const levelColors = {
  [LogLevel.ERROR]: 'red',
  [LogLevel.WARN]: 'yellow',
  [LogLevel.INFO]: 'green',
};

/**
 * @description Internationalization API for consistent date and time formatting.
 */
const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * Validates if the provided log level is a valid LogLevel.
 * @param {string} level The log level to validate.
 * @throws {Error} If the log level is invalid.
 */
function validateLevel(level) {
  if (!Object.values(LogLevel).includes(level)) {
    throw new Error(`Invalid log level: "${level}". Valid levels are: ${Object.values(LogLevel).join(', ')}`);
  }
}

/**
 * Logs a message to the console with a timestamp and specified log level.
 *
 * @export
 * @param {string} message The message to log.
 * @param {LogLevel} [level='info'] The level of the log.
 */
export default function log(message, level = LogLevel.INFO) {
  validateLevel(level);

  const timestamp = dateTimeFormatter.format(new Date());
  const color = levelColors[level];
  const coloredMessage = chalk[color].bold(message);

  console.log(`${timestamp} [${level.toUpperCase()}] ${coloredMessage}`);
}
