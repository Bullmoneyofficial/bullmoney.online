/**
 * API Input Validation Schemas
 * Uses Zod for runtime type checking and validation
 */

import { z } from 'zod';

// ============================================================================
// USER REGISTRATION
// ============================================================================

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  referralCode: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ============================================================================
// BLOG POSTS
// ============================================================================

export const BlogPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  category: z.string().min(2, 'Category required'),
  tags: z.array(z.string()).max(10, 'Too many tags').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  author: z.string().min(2, 'Author name required'),
  published: z.boolean().default(false),
});

export type BlogPostInput = z.infer<typeof BlogPostSchema>;

export const UpdateBlogPostSchema = BlogPostSchema.partial();

export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostSchema>;

// ============================================================================
// PRODUCTS
// ============================================================================

export const ProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  price: z.number().positive('Price must be positive').max(1000000, 'Price too high'),
  category: z.string().min(2, 'Category required'),
  imageUrl: z.string().url('Invalid image URL'),
  visible: z.boolean().default(true),
  buyUrl: z.string().url('Invalid buy URL').optional(),
  stock: z.number().int().nonnegative('Stock cannot be negative').optional(),
  sku: z.string().max(100, 'SKU too long').optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;

export const UpdateProductSchema = ProductSchema.partial();

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// ============================================================================
// CATEGORIES
// ============================================================================

export const CategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  parent: z.string().optional(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

// ============================================================================
// AFFILIATE
// ============================================================================

export const AffiliateSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name required'),
  company: z.string().max(200, 'Company name too long').optional(),
  website: z.string().url('Invalid website URL').optional(),
  referralSource: z.string().max(200, 'Referral source too long').optional(),
});

export type AffiliateInput = z.infer<typeof AffiliateSchema>;

// ============================================================================
// CONTACT/SUPPORT
// ============================================================================

export const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject required').max(200, 'Subject too long'),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000, 'Message too long'),
  category: z.enum(['general', 'support', 'billing', 'technical', 'partnership']).optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

// ============================================================================
// HERO CONFIGURATION
// ============================================================================

export const HeroConfigSchema = z.object({
  title: z.string().max(200, 'Title too long'),
  subtitle: z.string().max(500, 'Subtitle too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  ctaText: z.string().max(50, 'CTA text too long').optional(),
  ctaUrl: z.string().url('Invalid CTA URL').optional(),
  enabled: z.boolean().default(true),
});

export type HeroConfigInput = z.infer<typeof HeroConfigSchema>;

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// ============================================================================
// ID VALIDATION
// ============================================================================

export const MongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate request body against schema
 * Returns parsed data or throws validation error
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const params = Object.fromEntries(searchParams.entries());

    // Convert numeric strings to numbers
    const processedParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value === 'true') acc[key] = true;
      else if (value === 'false') acc[key] = false;
      else if (!isNaN(Number(value)) && value !== '') acc[key] = Number(value);
      else acc[key] = value;
      return acc;
    }, {} as Record<string, any>);

    const validatedData = schema.parse(processedParams);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Format validation errors for API response
 */
export function formatValidationError(error: z.ZodError): {
  error: string;
  details: Array<{ field: string; message: string }>;
} {
  return {
    error: 'Validation failed',
    details: error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
