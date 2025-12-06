"use client";

import React, { useEffect, useState } from "react";
import { useBlog, BlogPost, BlogHeroConfig } from "./BlogContext"; // Ensure BlogHeroConfig is exported in Context

type Props = {
  editing: BlogPost | null;
  clearEditing: () => void;
};

type PostFormState = {
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  visible: boolean;
};

const emptyPostForm: PostFormState = {
  title: "",
  content: "",
  category: "",
  imageUrl: "",
  visible: true,
};

export default function AdminPanel({ editing, clearEditing }: Props) {
  const {
    addPost,
    updatePost,
    state: { categories, hero },
    addCategory,
    deleteCategory,
    updateHero,
  } = useBlog();

  // --- BLOG POST STATE ---
  const [postForm, setPostForm] = useState<PostFormState>(emptyPostForm);
  const [postError, setPostError] = useState<string | null>(null);

  // --- HERO STATE ---
  const [heroForm, setHeroForm] = useState<BlogHeroConfig>(hero);
  const [heroError, setHeroError] = useState<string | null>(null);

  // --- CATEGORY STATE ---
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Sync Form with Editing Post
  useEffect(() => {
    if (editing) {
      setPostForm({
        title: editing.title,
        content: editing.content,
        category: editing.category,
        imageUrl: editing.imageUrl,
        visible: editing.visible,
      });
    } else {
      setPostForm(emptyPostForm);
      setPostError(null);
    }
  }, [editing]);

  // Sync Form with Hero State
  useEffect(() => {
    setHeroForm(hero);
  }, [hero]);

  // --- HANDLERS ---

  const handlePostChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPostForm((f) => ({ ...f, [name]: value }));
  };

  const handleHeroChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setHeroForm((f) => ({ ...f, [name]: value }));
  };

  const submitPost = (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);

    if (!postForm.title.trim()) {
      setPostError("Title is required.");
      return;
    }
    if (!postForm.imageUrl.trim()) {
      setPostError("Image URL is required.");
      return;
    }
    if (!postForm.content.trim()) {
      setPostError("Content is required.");
      return;
    }

    const payload: Omit<BlogPost, "_id"> = {
      title: postForm.title.trim(),
      content: postForm.content.trim(),
      category: postForm.category.trim() || "Uncategorised",
      imageUrl: postForm.imageUrl.trim(),
      visible: postForm.visible,
      createdAt: editing ? editing.createdAt : new Date().toISOString(),
    };

    if (editing?._id) {
      updatePost(editing._id, payload);
    } else {
      addPost(payload);
    }

    setPostForm(emptyPostForm);
    clearEditing();
  };

  const submitHero = (e: React.FormEvent) => {
    e.preventDefault();
    setHeroError(null);

    updateHero({
      ...heroForm,
      badge: heroForm.badge.trim(),
      title: heroForm.title.trim(),
      subtitle: heroForm.subtitle.trim(),
      featuredTitle: heroForm.featuredTitle.trim(),
      featuredSubtitle: heroForm.featuredSubtitle.trim(),
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
      
      {/* 1. BLOG POST FORM */}
      <div className="rounded-3xl border border-sky-500/40 bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900 p-[1px] shadow-[0_0_45px_rgba(56,189,248,0.4)]">
        <div className="rounded-3xl bg-slate-950 px-5 sm:px-7 py-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-semibold">
                {editing ? "Edit Blog Post" : "Create New Blog Post"}
              </h3>
              <p className="text-xs text-slate-400">
                Admin changes update the live blog instantly.
              </p>
            </div>

            {editing && (
              <button
                type="button"
                onClick={clearEditing}
                className="text-[11px] px-3 py-1 rounded-full border border-slate-700 bg-slate-900/80"
              >
                Clear editing
              </button>
            )}
          </div>

          <form onSubmit={submitPost} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Title
                </label>
                <input
                  name="title"
                  value={postForm.title}
                  onChange={handlePostChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={postForm.category}
                  onChange={handlePostChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="Uncategorised">Uncategorised</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Image URL
                </label>
                <input
                  name="imageUrl"
                  value={postForm.imageUrl}
                  onChange={handlePostChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="visible"
                  type="checkbox"
                  checked={postForm.visible}
                  onChange={(e) =>
                    setPostForm((f) => ({ ...f, visible: e.target.checked }))
                  }
                />
                <label htmlFor="visible" className="text-xs text-slate-300">
                  Visible to customers
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-full flex flex-col">
                <label className="block text-xs text-slate-300 mb-1.5">
                  Content (Markdown or Text)
                </label>
                <textarea
                  name="content"
                  value={postForm.content}
                  onChange={handlePostChange}
                  className="flex-1 w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500 resize-none min-h-[150px]"
                />
              </div>
            </div>

            {postError && (
              <div className="sm:col-span-2 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-3 py-2">
                {postError}
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end gap-3 pt-1">
              <button
                type="submit"
                className="text-xs px-5 py-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 font-semibold shadow-[0_0_25px_rgba(56,189,248,0.45)]"
              >
                {editing ? "Save Changes" : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. HERO CONTENT FORM */}
      <div className="rounded-3xl border border-sky-500/30 bg-slate-950 px-5 sm:px-7 py-6">
        <h3 className="text-lg font-semibold mb-4">Edit Hero Content</h3>

        <form onSubmit={submitHero} className="grid gap-4 sm:grid-cols-2 text-sm">
          {/* Left Column: Text */}
          <div className="space-y-3">
             <div>
                <label className="block text-xs text-slate-400 mb-1">Badge</label>
                <input
                  name="badge"
                  value={heroForm.badge}
                  onChange={handleHeroChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-400 mb-1">Main Title</label>
                <input
                  name="title"
                  value={heroForm.title}
                  onChange={handleHeroChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-400 mb-1">Subtitle</label>
                <textarea
                  name="subtitle"
                  rows={2}
                  value={heroForm.subtitle}
                  onChange={handleHeroChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none resize-none focus:border-sky-500"
                />
            </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="block text-xs text-slate-400 mb-1">Primary Button</label>
                  <input
                    name="primaryCtaLabel"
                    value={heroForm.primaryCtaLabel}
                    onChange={handleHeroChange}
                    className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                  />
               </div>
               <div>
                  <label className="block text-xs text-slate-400 mb-1">Secondary Button</label>
                  <input
                    name="secondaryCtaLabel"
                    value={heroForm.secondaryCtaLabel}
                    onChange={handleHeroChange}
                    className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                  />
               </div>
             </div>
          </div>

          {/* Right Column: Featured Card */}
          <div className="space-y-3">
            <div>
                <label className="block text-xs text-slate-400 mb-1">Featured Card Title</label>
                <input
                  name="featuredTitle"
                  value={heroForm.featuredTitle}
                  onChange={handleHeroChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-400 mb-1">Featured Subtitle</label>
                <textarea
                  name="featuredSubtitle"
                  rows={2}
                  value={heroForm.featuredSubtitle}
                  onChange={handleHeroChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none resize-none focus:border-sky-500"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-400 mb-1">Featured Image URL</label>
                <input
                  name="featuredImageUrl"
                  value={heroForm.featuredImageUrl}
                  onChange={handleHeroChange}
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                />
            </div>
             <div className="grid grid-cols-3 gap-2">
               <div>
                  <label className="block text-xs text-slate-400 mb-1">Tag</label>
                  <input
                    name="featuredTagLabel"
                    value={heroForm.featuredTagLabel}
                    onChange={handleHeroChange}
                    className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                  />
               </div>
               <div>
                  <label className="block text-xs text-slate-400 mb-1">Label (Price)</label>
                  <input
                    name="featuredPriceLabel"
                    value={heroForm.featuredPriceLabel}
                    onChange={handleHeroChange}
                    className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                  />
               </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Note</label>
                  <input
                    name="featuredNote"
                    value={heroForm.featuredNote}
                    onChange={handleHeroChange}
                    className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
                  />
               </div>
             </div>
          </div>

          {heroError && (
            <div className="sm:col-span-2 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-3 py-2">
              {heroError}
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              className="text-xs px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700"
            >
              Save Hero Changes
            </button>
          </div>
        </form>
      </div>

      {/* 3. CATEGORY MANAGEMENT */}
      <div className="rounded-3xl border border-sky-500/30 bg-slate-950 px-5 sm:px-7 py-6">
        <h3 className="text-lg font-semibold mb-4">Manage Categories</h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Add Category Form */}
          <div>
            <form onSubmit={submitNewCategory} className="flex gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="flex-1 rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
              >
                Add
              </button>
            </form>
            {categoryError && (
              <p className="mt-2 text-xs text-red-400">{categoryError}</p>
            )}
          </div>

          {/* Category List */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div
                key={c._id || c.name}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs"
              >
                <span>{c.name}</span>
                <button
                  onClick={() => deleteCategory(c._id!)}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 hover:bg-red-500/80 text-slate-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <span className="text-xs text-slate-500 italic">
                No categories yet.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}