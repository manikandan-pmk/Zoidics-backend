"use client";

import axios from "axios";
import {
  Building2,
  Check,
  Eye,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Quote,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

type Testimonial = {
  id: number;
  name: string;
  role: string | null;
  company: string | null;
  message: string;
  imageUrl: string | null;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ModalType = "create" | "view" | "edit" | null;

export default function TestimonialsPage() {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Testimonials");

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isPublished, setIsPublished] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH DATA
  |--------------------------------------------------------------------------
  */

 const fetchTestimonials = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await axios.get("/api/testimonials", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    const data = response.data;

    if (!data?.success) {
      throw new Error(
        data?.message || "Failed to fetch testimonials"
      );
    }

    setTestimonials(data.testimonials || []);
  } catch (error) {
    console.error("FETCH TESTIMONIALS ERROR:", error);

    if (axios.isAxiosError(error)) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch testimonials"
      );
    } else {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch testimonials"
      );
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchTestimonials();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((testimonial) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        testimonial.name.toLowerCase().includes(searchValue) ||
        (testimonial.company &&
          testimonial.company.toLowerCase().includes(searchValue)) ||
        testimonial.message.toLowerCase().includes(searchValue);

      const matchesFilter =
        filter === "All Testimonials" ||
        (filter === "Published" && testimonial.isPublished) ||
        (filter === "Draft" && !testimonial.isPublished);

      return matchesSearch && matchesFilter;
    });
  }, [testimonials, search, filter]);

  /*
  |--------------------------------------------------------------------------
  | MODAL HANDLERS
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setName("");
    setRole("");
    setCompany("");
    setMessage("");
    setDisplayOrder("0");
    setIsPublished(true);
    setImage(null);
    setImagePreview(null);
    setError("");
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedTestimonial(null);
    setModal("create");
  };

  const openViewModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setError("");
    setSuccess("");
    setModal("view");
  };

  const openEditModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setName(testimonial.name);
    setRole(testimonial.role || "");
    setCompany(testimonial.company || "");
    setMessage(testimonial.message);
    setDisplayOrder(String(testimonial.displayOrder));
    setIsPublished(testimonial.isPublished);
    setImage(null);
    setImagePreview(testimonial.imageUrl);

    setError("");
    setSuccess("");
    setModal("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setSelectedTestimonial(null);
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

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!message.trim()) {
      setError("Message is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("role", role.trim());
      formData.append("company", company.trim());
      formData.append("message", message.trim());
      formData.append("isPublished", String(isPublished));
      formData.append("displayOrder", displayOrder);

      if (image) {
        formData.append("image", image);
      }

      const isEditing = modal === "edit" && selectedTestimonial;

const url = isEditing
  ? `/api/testimonials/${selectedTestimonial.id}`
  : "/api/testimonials";

const method = isEditing ? "put" : "post";

const response = await axios({
  method,
  url,
  data: formData,
});

const data = response.data;

      

      if (!response.data || !data.success) {
        throw new Error(
          data.message ||
            `Failed to ${isEditing ? "update" : "create"} testimonial`,
        );
      }

      if (isEditing) {
        setTestimonials((current) =>
          current.map((t) =>
            t.id === selectedTestimonial.id ? data.testimonial : t,
          ),
        );
        setSuccess("Testimonial updated successfully.");
      } else {
        setTestimonials((current) => [data.testimonial, ...current]);
        setSuccess("Testimonial created successfully.");
      }

      closeModal();
    } catch (error) {
      console.error("SUBMIT TESTIMONIAL ERROR:", error);
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

  const deleteTestimonial = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this testimonial?",
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");

     const response = await axios.delete(
  `/api/testimonials/${id}`
);

const data = response.data;

if (!data?.success) {
  throw new Error(
    data?.message || "Failed to delete testimonial"
  );
}

      setTestimonials((current) => current.filter((t) => t.id !== id));
      setSuccess("Testimonial deleted successfully.");

      if (selectedTestimonial?.id === id) {
        closeModal();
      }
    } catch (error) {
      console.error("DELETE TESTIMONIAL ERROR:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete testimonial",
      );
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
              Portfolio
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#080808] md:text-4xl">
              Testimonials
            </h1>
            <p className="mt-2 text-sm font-medium text-black/50">
              Manage client reviews and testimonials for your website.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#080808] px-6 text-sm font-bold text-white shadow-lg shadow-black/5 transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-[#ffb646]/20 active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Testimonial
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
              placeholder="Search testimonials..."
              className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-4 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:text-black/30 placeholder:font-medium focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10 sm:w-auto cursor-pointer"
          >
            <option>All Testimonials</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        {/* ==============================================================
            TABLE
        ============================================================== */}

        <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          {/* Header - Fixed to use standard grid-cols-12 */}
          <div className="hidden lg:grid grid-cols-12 gap-4 border-b border-black/10 bg-[#f9f9f9]/50 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-black/40">
            <span className="col-span-3">Client</span>
            <span className="col-span-4">Message</span>
            <span className="col-span-1">Order</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm font-medium text-black/40">
              <Loader2 size={20} className="animate-spin text-[#ff8a24]" />
              Loading testimonials...
            </div>
          )}

          {!loading && filteredTestimonials.length === 0 && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#ffb646]/10 text-[#ff8a24]">
                <Quote size={24} />
              </div>
              <p className="text-base font-bold text-[#080808]">
                No testimonials found
              </p>
              <p className="mt-2 text-sm font-medium text-black/40">
                Add your first client testimonial to display it on your
                portfolio.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 rounded-xl bg-[#080808] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98]"
              >
                Add Testimonial
              </button>
            </div>
          )}

          {!loading && filteredTestimonials.length > 0 && (
            <div className="divide-y divide-black/5">
              {filteredTestimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-5 py-5 transition-colors hover:bg-black/[0.01] lg:items-center lg:px-6"
                >
                  {/* Client Info */}
                  <div className="col-span-1 lg:col-span-3 flex items-center gap-4">
                    {testimonial.imageUrl ? (
                      <img
                        src={testimonial.imageUrl}
                        alt={testimonial.name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffb646]/10 text-[#ff8a24]">
                        <Building2 size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#080808]">
                        {testimonial.name}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-black/45">
                        {testimonial.role ? `${testimonial.role}` : ""}
                        {testimonial.role && testimonial.company ? " @ " : ""}
                        {testimonial.company ? testimonial.company : ""}
                      </p>
                    </div>
                  </div>

                  {/* Message Extract */}
                  <div className="col-span-1 lg:col-span-4 hidden lg:block">
                    <p className="line-clamp-2 text-xs font-medium text-black/60 italic pr-4">
                      "{testimonial.message}"
                    </p>
                  </div>

                  {/* Order */}
                  <p className="col-span-1 lg:col-span-1 hidden text-sm font-medium text-black/60 lg:block">
                    {testimonial.displayOrder}
                  </p>

                  {/* Status */}
                  <div className="col-span-1 lg:col-span-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase border ${
                        testimonial.isPublished
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                      }`}
                    >
                      {testimonial.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 lg:col-span-2 flex items-center lg:justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openViewModal(testimonial)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                    >
                      <Eye size={17} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(testimonial)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                    >
                      <Pencil size={16} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === testimonial.id}
                      onClick={() => deleteTestimonial(testimonial.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      {deletingId === testimonial.id ? (
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

        <div className="mt-5 px-2 text-xs font-medium text-black/45">
          Showing {filteredTestimonials.length} of {testimonials.length}{" "}
          testimonials
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
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Portfolio
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#080808] sm:text-xl">
                  {modal === "create" ? "Add Testimonial" : "Edit Testimonial"}
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
              <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_300px]">
                {/* Left Form */}
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Client Name *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                        Role
                      </label>
                      <input
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="CEO"
                        className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                        Company
                      </label>
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Testimonial Message *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="Their amazing review here..."
                      className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm font-medium leading-relaxed text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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

                  <label className="flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-black/10 bg-[#fafafa] p-5 transition-colors hover:border-[#ffb646]/50">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="h-5 w-5 accent-[#ff8a24]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#080808]">
                        Publish Testimonial
                      </p>
                      <p className="mt-1 text-xs font-medium text-black/50">
                        Show this review on the public portfolio.
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
                    Client Avatar / Logo
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
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffb646]/10 text-[#ff8a24]">
                          <ImagePlus size={26} />
                        </div>
                        <p className="text-sm font-bold text-[#080808]">
                          Upload Avatar
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
                      Leave unchanged to keep the current avatar.
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
                    {modal === "create" ? "Create Testimonial" : "Save Changes"}
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

      {modal === "view" && selectedTestimonial && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080808]/60 p-3 backdrop-blur-sm sm:p-6 font-['Sora',sans-serif]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-5 bg-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Testimonial
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#080808]">
                  {selectedTestimonial.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-black/40 transition hover:bg-[#080808] hover:text-white"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="overflow-y-auto">
              {/* Top Hero Image Area */}
              {selectedTestimonial.imageUrl && (
                <div className="border-b border-black/10">
                  <img
                    src={selectedTestimonial.imageUrl}
                    alt={selectedTestimonial.name}
                    className="h-[260px] w-full object-cover"
                  />
                </div>
              )}

              {/* Main Content Area */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[#080808]">
                      {selectedTestimonial.name}
                    </h3>
                    <p className="mt-1.5 text-sm font-medium text-black/50">
                      Testimonial ID #{selectedTestimonial.id}
                      {(selectedTestimonial.role ||
                        selectedTestimonial.company) &&
                        " • "}
                      {selectedTestimonial.role && (
                        <span className="text-[#080808] font-bold">
                          {selectedTestimonial.role}
                        </span>
                      )}
                      {selectedTestimonial.role &&
                        selectedTestimonial.company &&
                        " at "}
                      {selectedTestimonial.company && (
                        <span className="text-[#ff8a24] font-bold">
                          {selectedTestimonial.company}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-4 py-1.5 text-[10px] font-bold tracking-wide uppercase border shrink-0 ${
                      selectedTestimonial.isPublished
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                    }`}
                  >
                    {selectedTestimonial.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                {/* Quote Box */}
                <div className="relative rounded-[1.5rem] bg-[#fafafa] border border-black/5 p-6">
                  <Quote
                    size={28}
                    className="absolute top-6 left-6 text-[#ffb646]/30"
                  />
                  <p className="relative z-10 text-sm font-medium leading-loose text-[#080808]/80 indent-10 italic">
                    "{selectedTestimonial.message}"
                  </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Display Order
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#080808]">
                      {selectedTestimonial.displayOrder}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Created
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#080808]">
                      {formatDate(selectedTestimonial.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedTestimonial)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#080808] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98]"
                  >
                    <Pencil size={18} strokeWidth={2} />
                    Edit Testimonial
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTestimonial(selectedTestimonial.id)}
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
