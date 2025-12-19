import { z } from 'zod';

export const BASE64_REGEX = /^[A-Za-z0-9+/-_]*={0,2}$/;

// generate id schema for ULID
export const UlidSchema = z
  .string()
  .length(26)
  .regex(/^[0-9A-Z]{26}$/, 'Invalid ULID format');

export const datetimeSchema = z
  .union([z.string().datetime(), z.date()])
  .transform(val => (val instanceof Date ? val.toISOString() : val));

export const bigintSchema = z
  .union([z.string(), z.number().nonnegative()])
  .transform(val => {
    const num = typeof val === 'string' ? Number(val) : val;
    if (!Number.isFinite(num)) throw new Error('Invalid number');
    return num;
  })
  .refine(val => Number.isInteger(val) && val >= 0, {
    message: 'Value must be a non-negative integer',
  });
