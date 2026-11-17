import { z } from "zod";

// Shared (client + server) input schemas.

export const emailSchema = z.string().trim().toLowerCase().max(254, "E-mail is too long.").pipe(z.email("Enter a valid e-mail address."));

// No composition rules: any password is accepted. The upper bound only protects the
// server from very long inputs to Argon2. A minimum length can be set in Admin → Settings.
export const passwordSchema = z.string().min(1, "Enter a password.").max(128, "Use at most 128 characters.");

const name = (label: string, max = 120) => z.string().trim().min(2, `${label} is required.`).max(max, `${label} is too long.`);

export const registerSchema = z
  .object({
    fullName: name("Full name"),
    email: emailSchema,
    companyName: name("Company name", 160),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ token: z.string().min(20).max(200), password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const contactSchema = z.object({
  name: name("Name"),
  email: emailSchema,
  company: z.string().trim().max(160).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Subject is required.").max(160),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(4000, "Message is too long."),
  website: z.string().max(0).optional(),
});

export const profileSchema = z.object({ fullName: name("Full name"), companyName: name("Company name", 160) });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "Enter your current password."), newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
