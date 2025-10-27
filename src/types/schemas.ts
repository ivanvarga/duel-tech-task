import { z } from 'zod';

// Helper: Transform sentinel values to null
const transformSentinelToNull = (sentinels: string[]) => {
  return (val: any) => {
    if (sentinels.includes(String(val))) return null;
    return val;
  };
};

const normalizeSocialHandle = (handle: string | null): string | null => {
  if (!handle || handle === null) return null;

  let normalized = handle.trim();

  if (normalized.startsWith('@')) {
    normalized = normalized.substring(1);
  }

  normalized = normalized.toLowerCase();

  return normalized.length > 0 ? normalized : null;
};

/**
 * SOURCE FILE VALIDATION SCHEMAS
 * These schemas validate the incoming JSON files (embedded structure)
 * Used during ETL to parse and transform data into normalized collections
 */

// Task schema (from source files)
export const taskSchema = z.object({
  task_id: z.string().uuid().nullable(),

  platform: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'number' ? null : val)
    .refine(val => val === null || ['TikTok', 'Instagram', 'Facebook'].includes(val))
    .nullable(),

  post_url: z.string()
    .transform(transformSentinelToNull(['broken_link']))
    .nullable()
    .pipe(
      z.string().url({ message: 'post_url must be a valid URL' }).nullable()
    ),

  likes: z.coerce.number()
    .catch(0)
    .transform(val => val < 0 || isNaN(val) ? 0 : val),

  comments: z.coerce.number()
    .catch(0)
    .transform(val => val < 0 || isNaN(val) ? 0 : val),

  shares: z.coerce.number()
    .catch(0)
    .transform(val => val < 0 || isNaN(val) ? 0 : val),

  reach: z.coerce.number()
    .catch(0)
    .transform(val => val < 0 || isNaN(val) ? 0 : val)
});

// Program schema (from source files - embedded in user)
export const programSchema = z.object({
  program_id: z.string().min(1, 'program_id is required and cannot be empty'),

  brand: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'number' ? null : val)
    .nullable(),

  tasks_completed: z.array(taskSchema),

  total_sales_attributed: z.coerce.number().catch(0)
});

export const userSchema = z.object({
  user_id: z.string().uuid('user_id must be a valid UUID'),

  name: z.string()
    .min(1, 'name is required and cannot be empty')
    .refine(val => val !== '???', { message: 'name cannot be ???' }),

  email: z.string()
    .transform(val => val.trim().toLowerCase())
    .pipe(
      z.string()
        .email({ message: 'email must be a valid email address' })
        .refine(val => val !== 'invalid-email', {
          message: 'email cannot be invalid-email'
        })
    ),

  instagram_handle: z.string()
    .nullable()
    .transform(val => normalizeSocialHandle(val)),

  tiktok_handle: z.string()
    .transform(transformSentinelToNull(['#error_handle']))
    .nullable()
    .transform(val => normalizeSocialHandle(val)),

  joined_at: z.string()
    .transform(val => val === 'not-a-date' ? null : val)
    .nullable()
    .transform(val => val ? new Date(val) : null),

  advocacy_programs: z.array(programSchema)
}).superRefine((data: any, ctx: z.RefinementCtx) => {
  // Cross-field validation: Platform tasks require corresponding social handles

  // Collect all platforms used across all programs and tasks
  const platformsUsed = new Set<string>();

  data.advocacy_programs.forEach((program: any) => {
    program.tasks_completed.forEach((task: any) => {
      if (task.platform) {
        platformsUsed.add(task.platform);
      }
    });
  });

  // Business Rule 1: TikTok tasks REQUIRE TikTok handle
  // Rationale: Cannot post to TikTok without a TikTok account (@handle)
  if (platformsUsed.has('TikTok')) {
    if (!data.tiktok_handle || data.tiktok_handle === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tiktok_handle'],
        message: 'tiktok_handle is required when user has completed TikTok tasks'
      });
    }
  }

  // Business Rule 2: Instagram tasks REQUIRE Instagram handle
  // Rationale: Cannot post to Instagram without an Instagram account (@handle)
  if (platformsUsed.has('Instagram')) {
    if (!data.instagram_handle || data.instagram_handle === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['instagram_handle'],
        message: 'instagram_handle is required when user has completed Instagram tasks'
      });
    }
  }
});

export type SourceTask = {
  task_id: string | null;
  platform: string | null;
  post_url: string | null;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
};

export type SourceProgram = {
  program_id: string;
  brand: string | null;
  tasks_completed: SourceTask[];
  total_sales_attributed: number;
};

export type SourceUser = {
  user_id: string;
  name: string;
  email: string;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  joined_at: Date | null;
  advocacy_programs: SourceProgram[];
};
