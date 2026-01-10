// Validation utility functions
import { z } from "zod";

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
};

export const validateUsername = (username: string): { valid: boolean; message?: string } => {
  if (username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters long" };
  }
  if (username.length > 20) {
    return { valid: false, message: "Username must be less than 20 characters long" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, and underscores" };
  }
  return { valid: true };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<[^>]*>/g, "");
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Zod schemas for validation
export const MongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

export const BlogPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  author: z.string().min(1),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
});

export const UpdateBlogPostSchema = BlogPostSchema.partial();

export const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  slug: z.string().optional(),
});

export const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  description: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  inStock: z.boolean().optional(),
  buyUrl: z.string().optional(),
  visible: z.boolean().optional(),
});

export const UpdateProductSchema = ProductSchema.partial();

export const formatValidationError = (error: z.ZodError) => {
  return error.issues.map((err: z.ZodIssue) => ({
    path: err.path.join("."),
    message: err.message,
  }));
};

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  sanitizeInput,
  validateURL,
  MongoIdSchema,
  BlogPostSchema,
  UpdateBlogPostSchema,
  CategorySchema,
  ProductSchema,
  UpdateProductSchema,
  formatValidationError,
};
