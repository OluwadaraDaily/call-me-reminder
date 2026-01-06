import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const loginSchema = z.object({
  email: emailSchema,
  rememberMe: z.boolean(),
});

export const signupSchema = z.object({
  email: emailSchema,
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
