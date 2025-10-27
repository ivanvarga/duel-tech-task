export const logger = {
  debug: (message: string, ...args: any[]) => {
    console.log(`[DEBUG] ${message}`, ...args);
  },

  info: (message: string | object, ...args: any[]) => {
    if (typeof message === 'object') {
      console.log('[INFO]', JSON.stringify(message, null, 2));
    } else {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  }
};
