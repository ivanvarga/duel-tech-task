// This file has a TypeScript error to test pre-push hook
export const testFunction = (): string => {
  const result: number = "this is a string"; // Type error!
  return result;
};
