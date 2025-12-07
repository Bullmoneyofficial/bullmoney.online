
"use client";

import React, { useEffect, useState } from "react";
import {
  useShop,
  Product,
  HeroConfig,
  Category,
} from "../../app/VIP/ShopContext";

type Props = {
  editing: Product | null;
  clearEditing: () => void;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  visible: boolean;
  buyUrl: string;
};

const emptyProductForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  category: "",
  imageUrl: "",
  visible: true,
  buyUrl: "",
};

type HeroFormState = HeroConfig;

export default function AdminPanel({ editing, clearEditing }: Props) {
  const {
    addProduct,
    updateProduct,
    state: { hero, categories },
    updateHero,
    addCategory,
    deleteCategory,
  } = useShop();

  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);
  const [productError, setProductError] = useState<string | null>(null);

  const [heroForm, setHeroForm] = useState<HeroFormState>(hero);
  const [heroError, setHeroError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // 1. Populate form when 'editing' changes
  useEffect(() => {
    if (editing) {
      setProductForm({
        // FIX: Add || "" fallback to prevent null values from crashing the form
        name: editing.name || "",
        description: editing.description || "",
        price: editing.price ? editing.price.toString() : "",
        category: editing.category || "",
        imageUrl: editing.imageUrl || "", 
        visible: editing.visible,
        buyUrl: editing.buyUrl || "",
      });
    } else {
      setProductForm(emptyProductForm);
      setProductError(null);
    }
  }, [editing]);

  useEffect(() => {
    if (hero) setHeroForm(hero);
  }, [hero]);

  const handleProductChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProductForm((f) => ({ ...f, [name]: value }));
  };

  const handleHeroChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setHeroForm((f) => ({ ...f, [name]: value }));
  };

  const submitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);

    // --- Validation ---
    // FIX: Use optional chaining (?.) to prevent crashing if value is null
    if (!productForm.name?.trim()) {
      setProductError("Product name is required.");
      return;
    }
    if (!productForm.price || Number(productForm.price) <= 0) {
      setProductError("Price must be a positive number.");
      return;
    }
    if (!productForm.imageUrl?.trim()) { // <--- FIXED THIS LINE
      setProductError("Image URL is required.");
      return;
    }
    if (
      productForm.buyUrl?.trim() &&
      !/^https?:\/\//i.test(productForm.buyUrl.trim())
    ) {
      setProductError("Buy now link must start with http:// or https://");
      return;
    }

    // --- Payload Construction ---
    const payload: Omit<Product, "id" | "_id"> = {
      name: productForm.name.trim(),
      description: productForm.description?.trim() || "",
      price: Number(productForm.price),
      category: productForm.category?.trim() || "Uncategorised",
      imageUrl: productForm.imageUrl.trim(),
      visible: productForm.visible,
      buyUrl: productForm.buyUrl?.trim() || undefined,
    };

    // --- FIX: DETECT ID CORRECTLY ---
    const editId = (editing as any)?._id || editing?.id;

    if (editId) {
      console.log("Updating product ID:", editId);
      updateProduct(editId, payload);
    } else {
      console.log("Creating new product");
      addProduct(payload);
    }

    setProductForm(emptyProductForm);
    clearEditing();
  };

  const submitHero = (e: React.FormEvent) => {
    e.preventDefault();
    setHeroError(null);

    if (!heroForm.title?.trim()) {
      setHeroError("Hero title is required.");
      return;
    }
    if (!heroForm.featuredImageUrl?.trim()) {
      setHeroError("Hero featured image URL is required.");
      return;
    }

    updateHero({
      ...heroForm,
      badge: heroForm.badge.trim(),
      title: heroForm.title.trim(),
      subtitle: heroForm.subtitle.trim(),
      primaryCtaLabel: heroForm.primaryCtaLabel.trim(),
      secondaryCtaLabel: heroForm.secondaryCtaLabel.trim(),
      featuredTitle: heroForm.featuredTitle.trim(),
      featuredSubtitle: heroForm.featuredSubtitle.trim(),
      featuredPriceLabel: heroForm.featuredPriceLabel.trim(),
      featuredTagLabel: heroForm.featuredTagLabel.trim(),
      featuredNote: heroForm.featuredNote.trim(),
      featuredImageUrl: heroForm.featuredImageUrl.trim(),
    });
  };

  const submitNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);

    const trimmed = newCategoryName.trim();

    if (!trimmed) {
      setCategoryError("Category name cannot be empty.");
      return;
    }

    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setCategoryError("Category already exists.");
      return;
    }

    addCategory(trimmed);
    setNewCategoryName("");
  };

  return (
    <div className="space-y-8">
      {/* PRODUCT FORM */}
      <div className="rounded-3xl border border-sky-500/40 bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900 p-[1px] shadow-[0_0_45px_rgba(56,189,248,0.4)]">
        <div className="rounded-3xl bg-slate-950 px-5 sm:px-7 py-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-semibold">
                {editing ? "Edit product" : "Create new product"}
              </h3>
              <p className="text-xs text-slate-400">
                Admin changes update the live grid instantly.
              </p>
            </div>

            {editing && (
              <button
                type="button"
                onClick={clearEditing}
                className="text-[11px] px-3 py-1 rounded-full border border-slate-700 bg-slate-900/80 transition-colors hover:bg-slate-800"
              >
                Clear editing
              </button>
            )}
          </div>

          <form onSubmit={submitProduct} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Name
                </label>
                <input
                  name="name"
                  value={productForm.name}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Category
                </label>
                <input
                  name="category"
                  value={productForm.category}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Price (USD)
                </label>
                <input
                  name="price"
                  type="number"
                  min={0}
                  value={productForm.price}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="visible"
                  type="checkbox"
                  checked={productForm.visible}
                  onChange={(e) =>
                    setProductForm((f) => ({
                      ...f,
                      visible: e.target.checked,
                    }))
                  }
                  className="accent-sky-500"
                />
                <label htmlFor="visible" className="text-xs text-slate-300 cursor-pointer">
                  Visible to customers
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Image URL
                </label>
                <input
                  name="imageUrl"
                  value={productForm.imageUrl}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Buy now link (Whop)
                </label>
                <input
                  name="buyUrl"
                  value={productForm.buyUrl}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={productForm.description}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500 resize-none transition-colors"
                />
              </div>
            </div>

            {productError && (
              <div className="sm:col-span-2 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-3 py-2">
                {productError}
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end gap-3 pt-1">
              <button
                type="submit"
                className="text-xs px-5 py-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 font-semibold shadow-[0_0_25px_rgba(56,189,248,0.45)] text-white hover:shadow-[0_0_35px_rgba(56,189,248,0.6)] transition-all"
              >
                {editing ? "Save changes" : "Add product"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* HERO FORM */}
      <div className="rounded-3xl border border-sky-500/30 bg-slate-950 px-5 sm:px-7 py-6">
        <h3 className="text-lg font-semibold mb-4">Hero content</h3>

        <form
          onSubmit={submitHero}
          className="grid gap-4 sm:grid-cols-2 text-sm"
        >
          <div className="space-y-3">
            <input
              name="badge"
              value={heroForm.badge}
              onChange={handleHeroChange}
              placeholder="Badge"
              className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500 transition-colors"
            />
            <input
              name="title"
              value={heroForm.title}
              onChange={handleHeroChange}
              placeholder="Title"
              className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500 transition-colors"
            />
            <textarea
              name="subtitle"
              rows={3}
              value={heroForm.subtitle}
              onChange={handleHeroChange}
              placeholder="Subtitle"
              className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none resize-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="space-y-3">
            <input
              name="featuredTitle"
              value={heroForm.featuredTitle}
              onChange={handleHeroChange}
              placeholder="Featured title"
              className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500 transition-colors"
            />
            <textarea
              name="featuredSubtitle"
              rows={2}
              value={heroForm.featuredSubtitle}
              onChange={handleHeroChange}
              placeholder="Featured subtitle"
              className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none resize-none focus:border-sky-500 transition-colors"
            />
            <input
              name="featuredImageUrl"
              value={heroForm.featuredImageUrl}
              onChange={handleHeroChange}
              placeholder="Featured image URL"
              className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {heroError && (
            <div className="sm:col-span-2 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-3 py-2">
              {heroError}
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="text-xs px-5 py-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 font-semibold text-white hover:shadow-lg transition-all"
            >
              Save hero content
            </button>
          </div>
        </form>
      </div>

      {/* CATEGORIES */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 px-5 sm:px-7 py-6">
        <h3 className="text-lg font-semibold mb-4">Categories</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat: Category) => {
            // Check for _id first (DB standard), then id
            const cid = (cat as any)._id || cat.id; 
            if (!cid) return null;

            return (
              <button
                key={cid}
                type="button"
                onClick={() => deleteCategory(cid)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-red-500/80 text-slate-100 flex items-center gap-2 group transition-colors"
              >
                {cat.name}
                <span className="text-[10px] opacity-80 group-hover:opacity-100">×</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={submitNewCategory} className="flex gap-3">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500 transition-colors"
          />
          <button
            type="submit"
            className="text-xs px-4 py-2 rounded-full bg-slate-800 hover:bg-sky-600 text-white transition-colors"
          >
            Add category
          </button>
        </form>

        {categoryError && (
          <p className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-3 py-2">
            {categoryError}
          </p>
        )}
      </div>
    </div>
  );
}
