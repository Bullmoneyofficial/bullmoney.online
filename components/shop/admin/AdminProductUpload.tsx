'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Plus, 
  Trash2,
  Loader2,
  ImageIcon,
  GripVertical,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { createSupabaseClient } from '@/lib/supabase';

// ============================================================================
// ADMIN PRODUCT UPLOAD - COMPREHENSIVE PRODUCT FORM
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().min(0).max(1000).default(''),
  short_description: z.string().max(500).default(''),
  base_price: z.number().min(0.01, 'Price must be at least $0.01'),
  compare_at_price: z.number().min(0).optional(),
  category_id: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  variants: z.array(z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    price_modifier: z.number().default(0),
    stock_quantity: z.number().int().min(0).default(0),
    is_active: z.boolean().default(true),
  })).min(1, 'At least one variant is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  is_primary: boolean;
  sort_order: number;
}

export function AdminProductUpload() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      short_description: '',
      base_price: 0,
      is_active: true,
      is_featured: false,
      variants: [
        { sku: '', name: 'Default', stock_quantity: 0, price_modifier: 0, is_active: true }
      ],
    },
  });

  const { fields: variants, append: addVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  const name = watch('name');

  // Auto-generate slug from name
  const generateSlug = useCallback((value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setValue('slug', slug);
  }, [setValue]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Max 5MB.`);
        continue;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const newImages: UploadedImage[] = validFiles.map((file, i) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
      is_primary: images.length === 0 && i === 0,
      sort_order: images.length + i,
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  // Remove image
  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // Ensure there's always a primary image
      if (filtered.length > 0 && !filtered.some(img => img.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  // Set primary image
  const setPrimaryImage = (id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === id,
    })));
  };

  // Upload images to Supabase Storage
  const uploadImagesToStorage = async (productId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      if (!image.file) continue;

      const fileExt = image.file.name.split('.').pop();
      const fileName = `${productId}/${image.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-products')
        .upload(fileName, image.file);

      if (uploadError) {
        console.error('Failed to upload image:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('store-products')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  // Submit form
  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    setSubmitting(true);

    try {
      // Create product first
      const response = await fetch('/api/store/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const { product } = await response.json();

      // Upload images
      await uploadImagesToStorage(product.id);

      // Save image references
      const imageData = images.map((img, i) => ({
        product_id: product.id,
        url: img.url.startsWith('blob:') 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/store-products/${product.id}/${img.id}.${img.file?.name.split('.').pop()}`
          : img.url,
        is_primary: img.is_primary,
        sort_order: i,
      }));

      await fetch('/api/store/admin/products/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, images: imageData }),
      });

      toast.success('Product created successfully');
      router.push('/store/admin/products');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          {/* Basic Info */}
          <section className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl space-y-4">
            <h2 className="text-base md:text-lg font-medium">Basic Information</h2>
            
            <div>
              <label className="block text-sm text-white/60 mb-1.5 md:mb-2">Product Name *</label>
              <input
                {...register('name', {
                  onChange: (e) => generateSlug(e.target.value),
                })}
                className="w-full h-11 md:h-12 px-4 bg-white/5 border border-white/10 rounded-xl
                         focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all text-sm md:text-base"
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-xs md:text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5 md:mb-2">Slug *</label>
              <input
                {...register('slug')}
                className="w-full h-11 md:h-12 px-4 bg-white/5 border border-white/10 rounded-xl
                         focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all font-mono text-xs md:text-sm"
                placeholder="product-url-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-xs md:text-sm text-red-400">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5 md:mb-2">Short Description</label>
              <input
                {...register('short_description')}
                className="w-full h-11 md:h-12 px-4 bg-white/5 border border-white/10 rounded-xl
                         focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all text-sm md:text-base"
                placeholder="Brief product description"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5 md:mb-2">Full Description</label>
              <textarea
                {...register('description')}
                rows={5}
                className="w-full p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl
                         focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all resize-none text-sm md:text-base"
                placeholder="Detailed product description..."
              />
            </div>
          </section>

          {/* Images */}
          <section className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl space-y-4">
            <h2 className="text-base md:text-lg font-medium">Product Images</h2>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2 md:gap-4">
              {/* Uploaded Images */}
              <AnimatePresence mode="popLayout">
                {images.map((image) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`relative aspect-square rounded-lg md:rounded-xl overflow-hidden border-2 transition-colors
                      ${image.is_primary ? 'border-white' : 'border-white/10 hover:border-white/20'}
                    `}
                  >
                    <img
                      src={image.url}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Primary Badge */}
                    {image.is_primary && (
                      <div className="absolute top-1 md:top-2 left-1 md:left-2 px-1.5 md:px-2 py-0.5 md:py-1 bg-white text-black text-[10px] md:text-xs font-medium rounded">
                        Primary
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute top-1 md:top-2 right-1 md:right-2 flex gap-1">
                      {!image.is_primary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(image.id)}
                          className="p-1 md:p-1.5 bg-black/80 rounded-md md:rounded-lg hover:bg-black active:scale-95 transition-all"
                          title="Set as primary"
                        >
                          <Check className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="p-1 md:p-1.5 bg-black/80 rounded-md md:rounded-lg hover:bg-red-500/80 active:scale-95 transition-all"
                        title="Remove"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Upload Button */}
              <label className="aspect-square rounded-lg md:rounded-xl border-2 border-dashed border-white/20 
                             flex flex-col items-center justify-center gap-1 md:gap-2 cursor-pointer
                             hover:border-white/40 hover:bg-white/5 active:scale-95 transition-all">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-5 h-5 md:w-6 md:h-6 text-white/40" />
                <span className="text-xs md:text-sm text-white/40">Add</span>
              </label>
            </div>

            <p className="text-xs text-white/40">
              Upload up to 10 images. Max 5MB each. JPG, PNG, or WebP.
            </p>
          </section>

          {/* Variants */}
          <section className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Variants</h2>
              <button
                type="button"
                onClick={() => addVariant({
                  sku: '',
                  name: '',
                  stock_quantity: 0,
                  price_modifier: 0,
                  is_active: true,
                })}
                className="h-9 px-4 flex items-center gap-2 bg-white/10 rounded-lg text-sm
                         hover:bg-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Variant {index + 1}</span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">SKU *</label>
                      <input
                        {...register(`variants.${index}.sku`)}
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm
                                 focus:outline-none focus:border-white/20"
                        placeholder="SKU-001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Name</label>
                      <input
                        {...register(`variants.${index}.name`)}
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm
                                 focus:outline-none focus:border-white/20"
                        placeholder="Default"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Size</label>
                      <input
                        {...register(`variants.${index}.size`)}
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm
                                 focus:outline-none focus:border-white/20"
                        placeholder="M"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Color</label>
                      <input
                        {...register(`variants.${index}.color`)}
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm
                                 focus:outline-none focus:border-white/20"
                        placeholder="Black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Price Modifier</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`variants.${index}.price_modifier`, { valueAsNumber: true })}
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm
                                 focus:outline-none focus:border-white/20"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        {...register(`variants.${index}.stock_quantity`, { valueAsNumber: true })}
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm
                                 focus:outline-none focus:border-white/20"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <input
                        type="checkbox"
                        {...register(`variants.${index}.is_active`)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5"
                      />
                      <label className="text-sm text-white/60">Active</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.variants && (
              <p className="text-sm text-red-400">{errors.variants.message}</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <section className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <h2 className="text-lg font-medium">Status</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="w-5 h-5 rounded border-white/20 bg-white/5"
                />
                <span className="text-sm">Active (visible in store)</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_featured')}
                  className="w-5 h-5 rounded border-white/20 bg-white/5"
                />
                <span className="text-sm">Featured product</span>
              </label>
            </div>
          </section>

          {/* Pricing */}
          <section className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <h2 className="text-lg font-medium">Pricing</h2>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Base Price *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('base_price', { valueAsNumber: true })}
                  className="w-full h-12 pl-8 pr-4 bg-white/5 border border-white/10 rounded-xl
                           focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="0.00"
                />
              </div>
              {errors.base_price && (
                <p className="mt-1 text-sm text-red-400">{errors.base_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Compare at Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('compare_at_price', { valueAsNumber: true })}
                  className="w-full h-12 pl-8 pr-4 bg-white/5 border border-white/10 rounded-xl
                           focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-white/40">
                Original price to show as crossed out
              </p>
            </div>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 bg-white text-black font-medium rounded-xl
                     hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Product...
              </>
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
