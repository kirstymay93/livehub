import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(500, 'Message is too long'),
});

export const tipSchema = z.object({
  creatorUserId: z.string().min(1, 'Creator ID is required'),
  amount: z.number().int().min(1, 'Tip amount must be at least 1 credit'),
});

export const tipRequestSchema = tipSchema.extend({
  idempotencyKey: z
    .string()
    .trim()
    .min(16, 'Idempotency key must be at least 16 characters')
    .max(128, 'Idempotency key must be at most 128 characters')
    .regex(/^[A-Za-z0-9._:-]+$/, 'Idempotency key contains invalid characters'),
});

export const reportSchema = z.object({
  reportedUserId: z.string().optional(),
  streamId: z.string().optional(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT', 'OTHER']),
  description: z.string().min(1).max(1000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type TipInput = z.infer<typeof tipSchema>;
export type TipRequestInput = z.infer<typeof tipRequestSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
