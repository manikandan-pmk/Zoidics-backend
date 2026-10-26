"use client";

import axios from "axios";
import {
  CalendarDays,
  Check,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

type Blog = {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ModalType = "create" | "view" | "edit" | null;

export default function BlogsPage() {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Blogs");

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isPublished, setIsPublished] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH DATA
  |--------------------------------------------------------------------------
  */

  const fetchBlogs = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await axios.get("/api/blogs", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    const data = response.data;

    if (!data?.success) {
      throw new Error(
        data?.message || "Failed to fetch blogs"
      );
    }

    setBlogs(data.blogs || []);
  } catch (error) {
    console.error("FETCH BLOGS ERROR:", error);

    if (axios.isAxiosError(error)) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch blogs"
      );
    } else {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch blogs"
      );
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBlogs();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        blog.title.toLowerCase().includes(searchValue) ||
        blog.category.toLowerCase().includes(searchValue) ||
        blog.excerpt.toLowerCase().includes(searchValue);

      const matchesFilter =
        filter === "All Blogs" ||
        (filter === "Published" && blog.isPublished) ||
        (filter === "Draft" && !blog.isPublished);

      return matchesSearch && matchesFilter;
    });
  }, [blogs, search, filter]);

  /*
  |--------------------------------------------------------------------------
  | MODAL HANDLERS
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setExcerpt("");
    setContent("");
    setDisplayOrder("0");
    setIsPublished(true);
    setImage(null);
    setImagePreview(null);
    setError("");
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedBlog(null);
    setModal("create");
  };

  const openViewModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setError("");
    setSuccess("");
    setModal("view");
  };

  const openEditModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setTitle(blog.title);
    setCategory(blog.category);
    setExcerpt(blog.excerpt);
    setContent(blog.content);
    setDisplayOrder(String(blog.displayOrder));
    setIsPublished(blog.isPublished);
    setImage(null);
    setImagePreview(blog.imageUrl);

    setError("");
    setSuccess("");
    setModal("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setSelectedBlog(null);
    resetForm();
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE HANDLER
  |--------------------------------------------------------------------------
  */

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PNG, JPG and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }

    setError("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !title.trim() ||
      !category.trim() ||
      !excerpt.trim() ||
      !content.trim()
    ) {
      setError("Title, Category, Excerpt, and Content are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", category.trim());
      formData.append("excerpt", excerpt.trim());
      formData.append("content", content.trim());
      formData.append("isPublished", String(isPublished));
      formData.append("displayOrder", displayOrder);

      if (image) {
        formData.append("image", image);
      }

      const isEditing = modal === "edit" && selectedBlog;

const url = isEditing
  ? `/api/blogs/${selectedBlog.id}`
  : "/api/blogs";

const response = isEditing
  ? await axios.put(url, formData)
  : await axios.post(url, formData);

const data = response.data;

      if (!response.data || !data.success) {
        throw new Error(
          data.message || `Failed to ${isEditing ? "update" : "create"} blog`,
        );
      }

      if (isEditing) {
        setBlogs((current) =>
          current.map((b) => (b.id === selectedBlog.id ? data.blog : b)),
        );
        setSuccess("Blog updated successfully.");
      } else {
        setBlogs((current) => [data.blog, ...current]);
        setSuccess("Blog created successfully.");
      }

      closeModal();
    } catch (error) {
      console.error("SUBMIT BLOG ERROR:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const deleteBlog = async (id: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this blog?"
  );

  if (!confirmed) return;

  try {
    setDeletingId(id);
    setError("");

    const response = await axios.delete(
      `/api/blogs/${id}`
    );

    const data = response.data;

    if (!data?.success) {
      throw new Error(
        data?.message || "Failed to delete blog"
      );
    }

    setBlogs((current) =>
      current.filter((blog) => blog.id !== id)
    );

    setSuccess("Blog deleted successfully.");

    if (selectedBlog?.id === id) {
      closeModal();
    }
  } catch (error) {
    console.error("DELETE BLOG ERROR:", error);

    if (axios.isAxiosError(error)) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete blog"
      );
    } else {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete blog"
      );
    }
  } finally {
    setDeletingId(null);
  }
};

  /*
  |--------------------------------------------------------------------------
  | UTILS
  |--------------------------------------------------------------------------
  */

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1500px] font-['Sora',sans-serif]">
        {/* ==============================================================
            HEADER
        ============================================================== */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
              Content Management
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#080808] md:text-4xl">
              Blogs
            </h1>
            <p className="mt-2 text-sm font-medium text-black/50">
              Create and manage blog articles for your portfolio website.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#080808] px-6 text-sm font-bold text-white shadow-lg shadow-black/5 transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-[#ffb646]/20 active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} />
            Write Article
          </button>
        </div>

        {/* ==============================================================
            ALERTS
        ============================================================== */}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <Check size={18} />
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && !modal && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ==============================================================
            TOOLBAR
        ============================================================== */}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[425px]">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Search articles..."
              className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-4 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:text-black/30 placeholder:font-medium focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10 sm:w-auto cursor-pointer"
          >
            <option>All Blogs</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        {/* ==============================================================
            TABLE (Using grid-cols-12 for perfect horizontal rows)
        ============================================================== */}

        <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 border-b border-black/10 bg-[#f9f9f9]/50 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-black/40">
            <span className="col-span-4">Article</span>
            <span className="col-span-3">Category</span>
            <span className="col-span-1">Order</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm font-medium text-black/40">
              <Loader2 size={20} className="animate-spin text-[#ff8a24]" />
              Loading blogs...
            </div>
          )}

          {/* Empty */}
          {!loading && filteredBlogs.length === 0 && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#ffb646]/10 text-[#ff8a24]">
                <FileText size={24} />
              </div>
              <p className="text-base font-bold text-[#080808]">
                No blogs found
              </p>
              <p className="mt-2 text-sm font-medium text-black/40">
                Write your first blog article to display it on your portfolio.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 rounded-xl bg-[#080808] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98]"
              >
                Write Article
              </button>
            </div>
          )}

          {/* Rows */}
          {!loading && filteredBlogs.length > 0 && (
            <div className="divide-y divide-black/5">
              {filteredBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-5 py-5 transition-colors hover:bg-black/[0.01] lg:items-center lg:px-6"
                >
                  {/* Article Info */}
                  <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
                    {blog.imageUrl ? (
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#ffb646]/10 text-[#ff8a24]">
                        <FileText size={20} />
                      </div>
                    )}
                    <div className="min-w-0 pr-4">
                      <p className="truncate text-sm font-bold text-[#080808]">
                        {blog.title}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-black/45">
                        {formatDate(blog.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-1 lg:col-span-3 hidden lg:block">
                    <p className="inline-flex rounded-full border border-black/10 bg-[#fafafa] px-3 py-1 text-xs font-medium text-black/60">
                      {blog.category}
                    </p>
                  </div>

                  {/* Order */}
                  <div className="col-span-1 lg:col-span-1 hidden lg:block">
                    <p className="text-sm font-medium text-black/60">
                      {blog.displayOrder}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 lg:col-span-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase border ${
                        blog.isPublished
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                      }`}
                    >
                      {blog.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 lg:col-span-2 flex items-center lg:justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openViewModal(blog)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                    >
                      <Eye size={17} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(blog)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                    >
                      <Pencil size={16} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === blog.id}
                      onClick={() => deleteBlog(blog.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      {deletingId === blog.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} strokeWidth={2} />
                      )}
                    </button>
                    <button
                      type="button"
                      className="hidden h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-black/5 hover:text-[#080808] sm:flex"
                    >
                      <MoreHorizontal size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 px-2 text-xs font-medium text-black/45">
          Showing {filteredBlogs.length} of {blogs.length} blogs
        </div>
      </div>

      {/* ================================================================
          CREATE / EDIT MODAL
      ================================================================ */}

      {(modal === "create" || modal === "edit") && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080808]/60 p-3 backdrop-blur-sm sm:p-6 font-['Sora',sans-serif]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Content
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#080808] sm:text-xl">
                  {modal === "create" ? "Write Article" : "Edit Article"}
                </h2>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-black/40 transition hover:bg-[#080808] hover:text-white disabled:opacity-40"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="overflow-y-auto">
              <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_320px]">
                {/* Left Form */}
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Article Title *
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a catchy title..."
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                        Category *
                      </label>
                      <input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., UI Design, Technology"
                        className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(e.target.value)}
                        className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Short Excerpt *
                    </label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      rows={3}
                      placeholder="A short summary of the article..."
                      className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm font-medium leading-relaxed text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Full Content *
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      placeholder="Write your amazing article here..."
                      className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm font-medium leading-relaxed text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-black/10 bg-[#fafafa] p-5 transition-colors hover:border-[#ffb646]/50">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="h-5 w-5 accent-[#ff8a24]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#080808]">
                        Publish Article
                      </p>
                      <p className="mt-1 text-xs font-medium text-black/50">
                        Make this blog visible on your portfolio.
                      </p>
                    </div>
                  </label>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-600">
                      {error}
                    </div>
                  )}
                </div>

                {/* Right Image */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                    Cover Image
                  </label>
                  <label className="group relative flex min-h-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-black/15 bg-[#fafafa] transition-all hover:border-[#ffb646] hover:bg-[#ffb646]/5">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-[#080808]/50 opacity-0 transition group-hover:opacity-100">
                          <div className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#080808] shadow-lg">
                            <ImagePlus size={18} /> Change Image
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#ffb646]/10 text-[#ff8a24]">
                          <ImagePlus size={26} />
                        </div>
                        <p className="text-sm font-bold text-[#080808]">
                          Upload Cover Image
                        </p>
                        <p className="mt-1.5 text-xs font-medium text-black/45">
                          PNG, JPG or WEBP
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-black/35">
                          Maximum 5MB
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {modal === "edit" && !image && (
                    <p className="mt-3 text-[11px] font-medium text-black/45">
                      Leave unchanged to keep the current image.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-4 border-t border-black/10 bg-white px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={closeModal}
                className="h-12 rounded-xl border border-black/10 bg-white px-8 text-sm font-bold text-[#080808] transition-all hover:bg-black/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#080808] px-8 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} strokeWidth={2.5} />{" "}
                    {modal === "create" ? "Publish Article" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================
          VIEW MODAL
      ================================================================ */}

      {modal === "view" && selectedBlog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080808]/60 p-3 backdrop-blur-sm sm:p-6 font-['Sora',sans-serif]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-5 bg-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Article Preview
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#080808] truncate pr-4">
                  {selectedBlog.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5 text-black/40 transition hover:bg-[#080808] hover:text-white"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="overflow-y-auto">
              {/* Top Hero Image Area */}
              {selectedBlog.imageUrl && (
                <div className="border-b border-black/10">
                  <img
                    src={selectedBlog.imageUrl}
                    alt={selectedBlog.title}
                    className="h-[300px] w-full object-cover"
                  />
                </div>
              )}

              {/* Main Content Area */}
              <div className="p-6 sm:p-8 space-y-8">
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 mb-3 rounded-full bg-[#ffb646]/10 text-[#ff8a24] text-[10px] font-bold uppercase tracking-wider">
                      {selectedBlog.category}
                    </span>
                    <h3 className="text-3xl font-bold text-[#080808] leading-tight">
                      {selectedBlog.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-black/50">
                      <CalendarDays size={16} />
                      <span>{formatDate(selectedBlog.createdAt)}</span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-4 py-1.5 text-[10px] font-bold tracking-wide uppercase border shrink-0 ${
                      selectedBlog.isPublished
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                    }`}
                  >
                    {selectedBlog.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                {/* Excerpt Box */}
                <div className="rounded-[1.25rem] bg-[#fafafa] border-l-4 border-[#ffb646] p-6">
                  <p className="text-base font-bold italic text-[#080808]/80">
                    {selectedBlog.excerpt}
                  </p>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-black/40 mb-3">
                    Full Content
                  </h4>
                  <p className="whitespace-pre-wrap text-[15px] leading-loose text-[#080808]/80 font-medium">
                    {selectedBlog.content}
                  </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Slug
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#080808] truncate">
                      /{selectedBlog.slug}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Display Order
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#080808]">
                      {selectedBlog.displayOrder}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedBlog)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#080808] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98]"
                  >
                    <Pencil size={18} strokeWidth={2} />
                    Edit Article
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlog(selectedBlog.id)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3.5 text-sm font-bold text-red-500 transition-all hover:bg-red-50 active:scale-[0.98]"
                  >
                    <Trash2 size={18} strokeWidth={2} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
