type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
const threshold = levels[configuredLevel] ?? levels.info;

function write(level: LogLevel, message: string, context?: unknown) {
  if (levels[level] < threshold) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context === undefined ? {} : { context }),
  };
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.info(output);
}

export const logger = {
  debug: (message: string, context?: unknown) => write("debug", message, context),
  info: (message: string, context?: unknown) => write("info", message, context),
  warn: (message: string, context?: unknown) => write("warn", message, context),
  error: (message: string, context?: unknown) => write("error", message, context),
};
