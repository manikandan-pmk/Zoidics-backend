"use client";

import axios from "axios";
import {
  Check,
  Eye,
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

type Service = {
  id: number;
  name: string;
  imageUrl: string | null;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ModalType = "create" | "view" | "edit" | null;

export default function ServicesPage() {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("All Services");

  const [modal, setModal] = useState<ModalType>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [serviceName, setServiceName] = useState("");

  const [displayOrder, setDisplayOrder] = useState("0");

  const [isPublished, setIsPublished] = useState(true);

  const [image, setImage] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | GET SERVICES
  |--------------------------------------------------------------------------
  */

 const fetchServices = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await axios.get("/api/services", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    // Axios already parses JSON
    const data = response.data;

    if (!data?.success) {
      throw new Error(
        data?.message || "Failed to fetch services"
      );
    }

    setServices(data.services || []);
  } catch (error) {
    console.error("FETCH SERVICES ERROR:", error);

    if (axios.isAxiosError(error)) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch services"
      );
    } else {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch services"
      );
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchServices();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER SERVICES
  |--------------------------------------------------------------------------
  */

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue || service.name.toLowerCase().includes(searchValue);

      const matchesFilter =
        filter === "All Services" ||
        (filter === "Published" && service.isPublished) ||
        (filter === "Draft" && !service.isPublished);

      return matchesSearch && matchesFilter;
    });
  }, [services, search, filter]);

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setServiceName("");
    setDisplayOrder("0");
    setIsPublished(true);
    setImage(null);
    setImagePreview(null);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN CREATE
  |--------------------------------------------------------------------------
  */

  const openCreateModal = () => {
    resetForm();

    setSelectedService(null);

    setModal("create");
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN VIEW
  |--------------------------------------------------------------------------
  */

  const openViewModal = (service: Service) => {
    setSelectedService(service);

    setError("");
    setSuccess("");

    setModal("view");
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT
  |--------------------------------------------------------------------------
  */

  const openEditModal = (service: Service) => {
    setSelectedService(service);

    setServiceName(service.name);

    setDisplayOrder(String(service.displayOrder));

    setIsPublished(service.isPublished);

    setImage(null);

    setImagePreview(service.imageUrl);

    setError("");
    setSuccess("");

    setModal("edit");
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE MODAL
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (saving) return;

    setModal(null);

    setSelectedService(null);

    resetForm();
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE CHANGE
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
  | CREATE SERVICE
  |--------------------------------------------------------------------------
  */

  const createService = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!serviceName.trim()) {
      setError("Service name is required.");

      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      formData.append("name", serviceName.trim());

      formData.append("isPublished", String(isPublished));

      formData.append("displayOrder", displayOrder);

      if (image) {
        formData.append("image", image);
      }
const response = await axios.post(
  "/api/services",
  formData
);

const data = response.data;

if (!data?.success) {
  throw new Error(
    data?.message || "Failed to create service"
  );
}

      /*
      |--------------------------------------------------------------------------
      | Add new service directly to UI
      |--------------------------------------------------------------------------
      */

      setServices((current) => [...current, data.service]);

      setSuccess("Service created successfully.");

      closeModal();
    } catch (error) {
      console.error("CREATE SERVICE ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to create service",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE SERVICE
  |--------------------------------------------------------------------------
  */

  const updateService = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedService) {
      return;
    }

    if (!serviceName.trim()) {
      setError("Service name is required.");

      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      formData.append("name", serviceName.trim());

      formData.append("isPublished", String(isPublished));

      formData.append("displayOrder", displayOrder);

      if (image) {
        formData.append("image", image);
      }

      const response = await axios.put(
  `/api/services/${selectedService.id}`,
  formData
);

const data = response.data;

if (!data?.success) {
  throw new Error(
    data?.message || "Failed to update service"
  );
}

      /*
      |--------------------------------------------------------------------------
      | Update UI without refresh
      |--------------------------------------------------------------------------
      */

      setServices((current) =>
        current.map((service) =>
          service.id === selectedService.id ? data.service : service,
        ),
      );

      setSelectedService(data.service);

      setSuccess("Service updated successfully.");

      setModal(null);

      resetForm();
    } catch (error) {
      console.error("UPDATE SERVICE ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to update service",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE SERVICE
  |--------------------------------------------------------------------------
  */

  const deleteService = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      setError("");

      const response = await axios.delete(
  `/api/services/${id}`
);

const data = response.data;

if (!data?.success) {
  throw new Error(
    data?.message || "Failed to delete service"
  );
}

      setServices((current) => current.filter((service) => service.id !== id));

      setSuccess("Service deleted successfully.");
    } catch (error) {
      console.error("DELETE SERVICE ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to delete service",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DATE
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
              Services
            </h1>

            <p className="mt-2 text-sm font-medium text-black/50">
              Manage the services displayed on your portfolio website.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#080808] px-6 text-sm font-bold text-white shadow-lg shadow-black/5 transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-[#ffb646]/20 active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Service
          </button>
        </div>

        {/* ==============================================================
            SUCCESS
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

        {/* ==============================================================
            ERROR
        ============================================================== */}

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
              placeholder="Search services..."
              className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-4 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:text-black/30 placeholder:font-medium focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10 sm:w-auto cursor-pointer"
          >
            <option>All Services</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        {/* ==============================================================
            TABLE
        ============================================================== */}

        <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          {/* Table Header */}

          <div className="hidden grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_110px] border-b border-black/10 bg-[#f9f9f9]/50 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-black/40 lg:grid">
            <span>Service</span>

            <span>Image</span>

            <span>Order</span>

            <span>Status</span>

            <span>Actions</span>
          </div>

          {/* Loading */}

          {loading && (
            <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm font-medium text-black/40">
              <Loader2 size={20} className="animate-spin text-[#ff8a24]" />
              Loading services...
            </div>
          )}

          {/* Empty */}

          {!loading && filteredServices.length === 0 && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#ffb646]/10 text-[#ff8a24]">
                <ImagePlus size={24} />
              </div>

              <p className="text-base font-bold text-[#080808]">
                No services found
              </p>

              <p className="mt-2 text-sm font-medium text-black/40">
                Add your first service to display it on your portfolio.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 rounded-xl bg-[#080808] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98]"
              >
                Add Service
              </button>
            </div>
          )}

          {/* Rows */}

          {!loading && filteredServices.length > 0 && (
            <div className="divide-y divide-black/5">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="grid gap-4 px-5 py-5 transition-colors hover:bg-black/[0.01] lg:grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_110px] lg:items-center lg:px-6"
                >
                  {/* Service */}

                  <div className="flex items-center gap-4">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffb646]/10 text-[#ff8a24]">
                        <ImagePlus size={20} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#080808]">
                        {service.name}
                      </p>

                      <p className="mt-1 text-xs font-medium text-black/45">
                        ID #{service.id}
                      </p>
                    </div>
                  </div>

                  {/* Image */}

                  <div className="hidden lg:block">
                    {service.imageUrl ? (
                      <span className="truncate text-xs font-medium text-black/50">
                        {service.imageUrl}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-black/30">
                        No image
                      </span>
                    )}
                  </div>

                  {/* Order */}

                  <p className="hidden text-sm font-medium text-black/60 lg:block">
                    {service.displayOrder}
                  </p>

                  {/* Status */}

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase border ${
                        service.isPublished
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                      }`}
                    >
                      {service.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Actions */}

                  <div className="flex items-center gap-1.5">
                    {/* View */}

                    <button
                      type="button"
                      title="View"
                      onClick={() => openViewModal(service)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                    >
                      <Eye size={17} strokeWidth={2} />
                    </button>

                    {/* Edit */}

                    <button
                      type="button"
                      title="Edit"
                      onClick={() => openEditModal(service)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                    >
                      <Pencil size={16} strokeWidth={2} />
                    </button>

                    {/* Delete */}

                    <button
                      type="button"
                      title="Delete"
                      disabled={deletingId === service.id}
                      onClick={() => deleteService(service.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      {deletingId === service.id ? (
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
          Showing {filteredServices.length} of {services.length} services
        </div>
      </div>

      {/* ================================================================
          CREATE / EDIT MODAL
      ================================================================ */}

      {(modal === "create" || modal === "edit") && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080808]/60 p-3 backdrop-blur-sm sm:p-6 font-['Sora',sans-serif]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <form
            onSubmit={modal === "create" ? createService : updateService}
            className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            {/* Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Portfolio
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#080808] sm:text-xl">
                  {modal === "create" ? "Add Service" : "Edit Service"}
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

            {/* Content */}

            <div className="overflow-y-auto">
              <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_300px]">
                {/* Left */}

                <div className="space-y-6">
                  {/* Name */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Service Name *
                    </label>

                    <input
                      value={serviceName}
                      onChange={(event) => setServiceName(event.target.value)}
                      placeholder="Web Development"
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  {/* Display Order */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Display Order
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={displayOrder}
                      onChange={(event) => setDisplayOrder(event.target.value)}
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />

                    <p className="mt-2 text-[11px] font-medium text-black/45">
                      Smaller numbers appear first.
                    </p>
                  </div>

                  {/* Publish */}

                  <label className="flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-black/10 bg-[#fafafa] p-5 transition-colors hover:border-[#ffb646]/50">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(event) => setIsPublished(event.target.checked)}
                      className="h-5 w-5 accent-[#ff8a24]"
                    />

                    <div>
                      <p className="text-sm font-bold text-[#080808]">
                        Publish Service
                      </p>

                      <p className="mt-1 text-xs font-medium text-black/50">
                        Show this service on the public portfolio.
                      </p>
                    </div>
                  </label>

                  {/* Error */}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-600">
                      {error}
                    </div>
                  )}
                </div>

                {/* Image */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                    Service Image
                  </label>

                  <label className="group relative flex min-h-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-black/15 bg-[#fafafa] transition-all hover:border-[#ffb646] hover:bg-[#ffb646]/5">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Service preview"
                          className="absolute inset-0 h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 flex items-center justify-center bg-[#080808]/50 opacity-0 transition group-hover:opacity-100">
                          <div className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#080808] shadow-lg">
                            <ImagePlus size={18} />
                            Change Image
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#ffb646]/10 text-[#ff8a24]">
                          <ImagePlus size={26} />
                        </div>

                        <p className="text-sm font-bold text-[#080808]">
                          Upload Image
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

            {/* Footer */}

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
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} strokeWidth={2.5} />
                    {modal === "create" ? "Create Service" : "Save Changes"}
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

      {modal === "view" && selectedService && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080808]/60 p-3 backdrop-blur-sm sm:p-6 font-['Sora',sans-serif]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Service
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#080808]">
                  {selectedService.name}
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

            {/* Image */}

            {selectedService.imageUrl && (
              <div className="border-b border-black/10">
                <img
                  src={selectedService.imageUrl}
                  alt={selectedService.name}
                  className="h-[260px] w-full object-cover"
                />
              </div>
            )}

            {/* Details */}

            <div className="space-y-6 overflow-y-auto p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#080808]">
                    {selectedService.name}
                  </h3>

                  <p className="mt-1.5 text-sm font-medium text-black/50">
                    Service ID #{selectedService.id}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase border ${
                    selectedService.isPublished
                      ? "bg-green-50 text-green-600 border-green-100"
                      : "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                  }`}
                >
                  {selectedService.isPublished ? "Published" : "Draft"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                    Display Order
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#080808]">
                    {selectedService.displayOrder}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#080808]">
                    {formatDate(selectedService.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedService)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#080808] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98]"
                >
                  <Pencil size={18} strokeWidth={2} />
                  Edit Service
                </button>

                <button
                  type="button"
                  onClick={() => deleteService(selectedService.id)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3.5 text-sm font-bold text-red-500 transition-all hover:bg-red-50 active:scale-[0.98]"
                >
                  <Trash2 size={18} strokeWidth={2} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
