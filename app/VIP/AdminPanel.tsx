"use client";

import React, { useEffect, useState } from "react";
import {
  useShop,
  Product,
  HeroConfig,
  Category,
} from "../../app/VIP/ShopContext";

// --- ICONS (Simple SVGs for the dashboard cards) ---
const IconProduct = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);
const IconHero = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconCategory = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

// --- MODAL COMPONENT ---
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose} // 🎯 Backdrop closure is confirmed
      />
      
      {/* Content */}
      <div className="relative w-full max-w-3xl rounded-3xl border border-sky-500/30 bg-slate-950 p-6 shadow-2xl shadow-sky-500/10 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-slate-100">{title}</h3>
          <button 
            onClick={onClose} // 🎯 Button closure is confirmed
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

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
  } = useShop() as any;

  // --- STATE FOR MODALS ---
  const [activeModal, setActiveModal] = useState<'product' | 'hero' | 'categories' | null>(null);

  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productError, setProductError] = useState<string | null>(null);

  const [heroForm, setHeroForm] = useState<HeroFormState>(hero);
  const [heroError, setHeroError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // 1. Populate form when 'editing' changes AND open modal
  useEffect(() => {
    if (editing) {
      setProductForm({
        name: editing.name || "",
        description: editing.description || "",
        // 🎯 FIX: Format price using Number().toFixed(2) to ensure trailing zeros (e.g., 2.50) are present
        price: editing.price ? Number(editing.price).toFixed(2) : "", 
        category: editing.category || "",
        imageUrl: editing.imageUrl || "", 
        visible: editing.visible,
        buyUrl: editing.buyUrl || "",
      });
      // Automatically open the modal when edit is triggered
      setActiveModal('product');
    } else {
      setProductForm(emptyProductForm);
      setProductError(null);
    }
  }, [editing]);

  useEffect(() => {
    if (hero) setHeroForm(hero);
  }, [hero]);

  // Close modal and clear editing state
  const closeProductModal = () => {
    setActiveModal(null);
    clearEditing();
    setProductForm(emptyProductForm);
  };

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
    if (!productForm.name?.trim()) {
      setProductError("Product name is required.");
      return;
    }
    // Note: Number(productForm.price) will handle both . and , based on locale, but input type="number" forces '.' 
    if (!productForm.price || Number(productForm.price) <= 0) {
      setProductError("Price must be a positive number.");
      return;
    }
    if (!productForm.imageUrl?.trim()) {
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
      // Price is sent as a number
      price: Number(productForm.price),
      category: productForm.category?.trim() || "Uncategorised",
      imageUrl: productForm.imageUrl.trim(),
      visible: productForm.visible,
      buyUrl: productForm.buyUrl?.trim() || undefined,
    };

    const editId = (editing as any)?._id || editing?.id;

    if (editId) {
      updateProduct(editId, payload);
    } else {
      addProduct(payload);
    }

    closeProductModal();
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

    setActiveModal(null);
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
      (c: Category) => c.name.toLowerCase() === trimmed.toLowerCase()
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
      
      {/* --- MAIN ADMIN DASHBOARD (CARDS) --- */}
      {/* 🎯 Mobile layout confirmed: grid-cols-1 stacks vertically, md:grid-cols-3 is for larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
        
        {/* Card 1: Products */}
        <button 
          onClick={() => { clearEditing(); setActiveModal('product'); }}
          className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 text-left hover:border-sky-500/50 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconProduct />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <IconProduct />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Add Product</h3>
          <p className="text-sm text-slate-400">Create new items or edit existing inventory.</p>
        </button>

        {/* Card 2: Hero */}
        <button 
          onClick={() => setActiveModal('hero')}
          className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 text-left hover:border-sky-500/50 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconHero />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <IconHero />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Hero Section</h3>
          <p className="text-sm text-slate-400">Update landing page headlines and featured image.</p>
        </button>

        {/* Card 3: Categories */}
        <button 
          onClick={() => setActiveModal('categories')}
          className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 text-left hover:border-sky-500/50 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] transition-all duration-300"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconCategory />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <IconCategory />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Categories</h3>
          <p className="text-sm text-slate-400">Manage tags and grouping for your products.</p>
        </button>
      </div>

      {/* --- MODAL 1: PRODUCT FORM --- */}
      <Modal 
        isOpen={activeModal === 'product'} 
        onClose={closeProductModal} 
        title={editing ? "Edit Product" : "Create New Product"}
      >
        <form onSubmit={submitProduct} className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5 ml-1">Name</label>
                <input
                  name="name"
                  value={productForm.name}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-sky-500 transition-colors"
                  placeholder="Product Title"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5 ml-1">Category</label>
                <input
                  name="category"
                  value={productForm.category}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-sky-500 transition-colors"
                  placeholder="e.g. VIP Signals"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5 ml-1">Price (USD)</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={productForm.price}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-sky-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 pl-1">
                <input
                  id="visible"
                  type="checkbox"
                  checked={productForm.visible}
                  onChange={(e) => setProductForm((f) => ({ ...f, visible: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-sky-500"
                />
                <label htmlFor="visible" className="text-sm text-slate-300 cursor-pointer select-none">
                  Visible to customers
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5 ml-1">Image URL</label>
                <input
                  name="imageUrl"
                  value={productForm.imageUrl}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-sky-500 transition-colors"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5 ml-1">Buy now link (Whop)</label>
                <input
                  name="buyUrl"
                  value={productForm.buyUrl}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-sky-500 transition-colors"
                  placeholder="https://whop.com/..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5 ml-1">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={productForm.description}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-sky-500 resize-none transition-colors"
                  placeholder="Product details..."
                />
              </div>
            </div>
          </div>

          {productError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-4 py-3">
              {productError}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-2">
            <button
              type="button"
              onClick={closeProductModal}
              className="text-sm px-5 py-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 font-semibold shadow-[0_0_20px_rgba(56,189,248,0.3)] text-white hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all"
            >
              {editing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL 2: HERO FORM --- */}
      <Modal 
        isOpen={activeModal === 'hero'} 
        onClose={() => setActiveModal(null)} 
        title="Edit Hero Content"
      >
        <form onSubmit={submitHero} className="grid gap-5 text-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-sky-400 font-medium text-xs uppercase tracking-wider mb-2">Main Hero</h4>
              <input
                name="badge"
                value={heroForm.badge}
                onChange={handleHeroChange}
                placeholder="Badge Text"
                className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 outline-none focus:border-sky-500 transition-colors"
              />
              <input
                name="title"
                value={heroForm.title}
                onChange={handleHeroChange}
                placeholder="Main Title"
                className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 outline-none focus:border-sky-500 transition-colors"
              />
              <textarea
                name="subtitle"
                rows={3}
                value={heroForm.subtitle}
                onChange={handleHeroChange}
                placeholder="Subtitle"
                className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 outline-none resize-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sky-400 font-medium text-xs uppercase tracking-wider mb-2">Featured Card</h4>
              <input
                name="featuredTitle"
                value={heroForm.featuredTitle}
                onChange={handleHeroChange}
                placeholder="Featured Title"
                className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 outline-none focus:border-sky-500 transition-colors"
              />
              <textarea
                name="featuredSubtitle"
                rows={2}
                value={heroForm.featuredSubtitle}
                onChange={handleHeroChange}
                placeholder="Featured Subtitle"
                className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 outline-none resize-none focus:border-sky-500 transition-colors"
              />
              <input
                name="featuredImageUrl"
                value={heroForm.featuredImageUrl}
                onChange={handleHeroChange}
                placeholder="Featured Image URL"
                className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-3 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {heroError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-4 py-3">
              {heroError}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-sm px-5 py-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 font-semibold shadow-[0_0_20px_rgba(56,189,248,0.3)] text-white hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all"
            >
              Save Hero Content
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL 3: CATEGORIES --- */}
      <Modal 
        isOpen={activeModal === 'categories'} 
        onClose={() => setActiveModal(null)} 
        title="Manage Categories"
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat: Category) => {
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

          <div className="border-t border-slate-800 pt-6">
            <h4 className="text-sm text-slate-300 mb-3">Add New Category</h4>
            <form onSubmit={submitNewCategory} className="flex gap-3">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="flex-1 rounded-2xl bg-slate-900/50 border border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors"
              />
              <button
                type="submit"
                className="text-sm px-5 py-2.5 rounded-full bg-slate-800 hover:bg-sky-600 text-white transition-colors"
              >
                Add
              </button>
            </form>

            {categoryError && (
              <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-4 py-2">
                {categoryError}
              </p>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
}