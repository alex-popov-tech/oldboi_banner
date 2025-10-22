export function createLogger(context: string) {
  return {
    log: (message: string) => {
      console.log(`[${context}] ${message}`);
    },
  };
}
