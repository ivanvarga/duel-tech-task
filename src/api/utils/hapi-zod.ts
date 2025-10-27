import { ZodSchema } from 'zod';
import Boom from '@hapi/boom';

/**
 * Convert Zod schema to Hapi validation function
 * Returns the validated value directly (Hapi wraps it automatically)
 */
export const zodValidator = (schema: ZodSchema) => {
  return (value: any) => {
    const result = schema.safeParse(value);

    if (!result.success) {
      throw Boom.badRequest('Validation failed', result.error.errors);
    }

    return result.data;
  };
};
