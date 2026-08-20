function errorDetails(error) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status ?? error.response?.status,
    response: error.response?.data,
    stack: error.stack,
  };
}

function toLogLine(payload) {
  const seen = new WeakSet();

  return JSON.stringify(payload, (_key, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }

    if (typeof value === "string" && value.length > 10_000) {
      return `${value.slice(0, 10_000)}… [truncated]`;
    }

    if (value && typeof value === "object") {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }

    return value;
  });
}

export function logError(message, error, context = {}) {
  console.error(toLogLine({
    level: "error",
    message,
    timestamp: new Date().toISOString(),
    context,
    error: errorDetails(error),
  }));
}

export function logInfo(message, context = {}) {
  console.log(toLogLine({
    level: "info",
    message,
    timestamp: new Date().toISOString(),
    context,
  }));
}
