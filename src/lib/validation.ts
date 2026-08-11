import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message must be less than 500 characters"),
});

export const streamSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1, "Category is required"),
});

export const creatorProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  categories: z.array(z.string()).optional(),
});

export const reportSchema = z.object({
  reason: z.enum(["SPAM", "HARASSMENT", "INAPPROPRIATE_CONTENT", "COPYRIGHT", "OTHER"]),
  description: z.string().min(10).max(500),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type StreamInput = z.infer<typeof streamSchema>;
export type CreatorProfileInput = z.infer<typeof creatorProfileSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
