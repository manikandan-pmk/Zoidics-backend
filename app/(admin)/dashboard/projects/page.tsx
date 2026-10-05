"use client";

import {
  Check,
  Eye,
  ExternalLink,
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
import Link from "next/link";
import axios from "axios";

type Project = {
  id: number;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  technologies: string[];
  imageUrl: string | null;
  liveUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type ModalType = "view" | "edit" | null;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("All Projects");

  const [modal, setModal] = useState<ModalType>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | EDIT FORM STATE
  |--------------------------------------------------------------------------
  */

  const [editTitle, setEditTitle] = useState("");

  const [editCategory, setEditCategory] = useState("");

  const [editShortDescription, setEditShortDescription] = useState("");

  const [editDescription, setEditDescription] = useState("");

  const [editLiveUrl, setEditLiveUrl] = useState("");

  const [editTechnologies, setEditTechnologies] = useState<string[]>([]);

  const [editTechnologyInput, setEditTechnologyInput] = useState("");

  const [editPublished, setEditPublished] = useState(false);

  const [editImage, setEditImage] = useState<File | null>(null);

  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | GET PROJECTS
  |--------------------------------------------------------------------------
  */

const fetchProjects = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await axios.get("/api/projects", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    // Axios already parses JSON
    const data = response.data;

    if (!data?.success) {
      throw new Error(
        data?.message || "Failed to fetch projects"
      );
    }

    setProjects(data.projects || []);
  } catch (error) {
    console.error("FETCH PROJECTS ERROR:", error);

    if (axios.isAxiosError(error)) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch projects"
      );
    } else {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch projects"
      );
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchProjects();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        project.title.toLowerCase().includes(searchValue) ||
        project.category.toLowerCase().includes(searchValue) ||
        project.shortDescription.toLowerCase().includes(searchValue) ||
        project.technologies.some((technology) =>
          technology.toLowerCase().includes(searchValue),
        );

      const matchesFilter =
        filter === "All Projects" ||
        (filter === "Published" && project.isPublished) ||
        (filter === "Draft" && !project.isPublished);

      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  /*
  |--------------------------------------------------------------------------
  | OPEN VIEW MODAL
  |--------------------------------------------------------------------------
  */

  const openViewModal = (project: Project) => {
    setSelectedProject(project);
    setModal("view");
    setError("");
    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT MODAL
  |--------------------------------------------------------------------------
  */

  const openEditModal = (project: Project) => {
    setSelectedProject(project);

    setEditTitle(project.title);
    setEditCategory(project.category);

    setEditShortDescription(project.shortDescription);

    setEditDescription(project.description);

    setEditLiveUrl(project.liveUrl || "");

    setEditTechnologies([...(project.technologies || [])]);

    setEditPublished(project.isPublished);

    setEditImage(null);

    setEditImagePreview(project.imageUrl);

    setEditTechnologyInput("");

    setModal("edit");

    setError("");
    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE MODAL
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (saving) return;

    setModal(null);
    setSelectedProject(null);

    setEditImage(null);

    setEditImagePreview(null);

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleEditImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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

    setEditImage(file);

    setEditImagePreview(URL.createObjectURL(file));
  };

  /*
  |--------------------------------------------------------------------------
  | ADD TECHNOLOGY
  |--------------------------------------------------------------------------
  */

  const addEditTechnology = () => {
    const value = editTechnologyInput.trim();

    if (!value) return;

    if (!editTechnologies.includes(value)) {
      setEditTechnologies([...editTechnologies, value]);
    }

    setEditTechnologyInput("");
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE TECHNOLOGY
  |--------------------------------------------------------------------------
  */

  const removeEditTechnology = (technology: string) => {
    setEditTechnologies(editTechnologies.filter((item) => item !== technology));
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE PROJECT
  |--------------------------------------------------------------------------
  */

  const updateProject = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedProject) {
      return;
    }

    if (
      !editTitle.trim() ||
      !editCategory ||
      !editShortDescription.trim() ||
      !editDescription.trim()
    ) {
      setError("Please fill all required fields.");

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("title", editTitle.trim());

      formData.append("category", editCategory);

      formData.append("shortDescription", editShortDescription.trim());

      formData.append("description", editDescription.trim());

      formData.append("technologies", editTechnologies.join(","));

      formData.append("liveUrl", editLiveUrl.trim());

      formData.append("isPublished", String(editPublished));

      if (editImage) {
        formData.append("image", editImage);
      }
const response = await axios.put(
  `/api/projects/${selectedProject.id}`,
  formData
);

const data = response.data;

if (!data?.success) {
  throw new Error(
    data?.message || "Failed to update project"
  );
}

      /*
       * Update UI immediately.
       * No refresh.
       */

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === selectedProject.id ? data.project : project,
        ),
      );

      setSelectedProject(data.project);

      setSuccess("Project updated successfully.");

      /*
       * Keep modal open for confirmation.
       */
    } catch (error) {
      console.error("UPDATE PROJECT ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to update project",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE PROJECT
  |--------------------------------------------------------------------------
  */

  const deleteProject = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const response = await axios.delete(
  `/api/projects/${id}`
);

const data = response.data;

if (!data?.success) {
  throw new Error(
    data?.message || "Failed to delete project"
  );
}

      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== id),
      );

      if (selectedProject?.id === id) {
        closeModal();
      }

      setSuccess("Project deleted successfully.");
    } catch (error) {
      console.error("DELETE PROJECT ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DATE FORMAT
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
        {/* ================================================================
            HEADER
        ================================================================ */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
              Portfolio
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#080808] md:text-4xl">
              Projects
            </h1>

            <p className="mt-2 text-sm font-medium text-black/50">
              Manage the projects displayed on your portfolio website.
            </p>
          </div>

          <Link
            href="/dashboard/projects/new"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#080808] px-6 text-sm font-bold text-white shadow-lg shadow-black/5 transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-[#ffb646]/20 active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Project
          </Link>
        </div>

        {/* ================================================================
            SUCCESS MESSAGE
        ================================================================ */}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <Check size={18} />

            <span>{success}</span>

            <button onClick={() => setSuccess("")} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================================================================
            ERROR MESSAGE
        ================================================================ */}

        {error && !modal && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            <span>{error}</span>

            <button onClick={() => setError("")} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================================================================
            TOOLBAR
        ================================================================ */}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[425px]">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects..."
              className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-4 text-sm font-medium text-[#080808] outline-none transition-all placeholder:text-black/30 placeholder:font-medium focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-medium text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10 sm:w-auto cursor-pointer"
          >
            <option>All Projects</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        {/* ================================================================
            TABLE
        ================================================================ */}

        <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          {/* Header */}

          <div className="hidden grid-cols-[1.5fr_1fr_1.3fr_0.7fr_0.7fr_100px] border-b border-black/10 bg-[#f9f9f9]/50 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-black/40 lg:grid">
            <span>Project</span>
            <span>Category</span>
            <span>Technology</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>

          {/* Loading */}

          {loading && (
            <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm font-medium text-black/40">
              <Loader2 size={20} className="animate-spin text-[#ff8a24]" />
              Loading projects...
            </div>
          )}

          {/* Empty */}

          {!loading && filteredProjects.length === 0 && (
            <div className="px-6 py-20 text-center">
              <p className="text-base font-bold text-[#080808]">
                No projects found
              </p>

              <p className="mt-2 text-sm font-medium text-black/40">
                Try another search or create a new project.
              </p>
            </div>
          )}

          {/* Rows */}

          {!loading && filteredProjects.length > 0 && (
            <div className="divide-y divide-black/5">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="grid gap-4 px-5 py-5 transition-colors hover:bg-black/[0.01] lg:grid-cols-[1.5fr_1fr_1.3fr_0.7fr_0.7fr_100px] lg:items-center lg:px-6"
                >
                  {/* Project */}

                  <div>
                    <div className="flex items-center gap-4">
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffb646]/10 text-xs font-bold text-[#ff8a24]">
                          {project.title.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#080808]">
                          {project.title}
                        </p>

                        <p className="mt-1 line-clamp-1 text-xs font-medium text-black/45 lg:hidden">
                          {project.category}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category */}

                  <p className="hidden text-sm font-medium text-black/60 lg:block">
                    {project.category}
                  </p>

                  {/* Technology */}

                  <p className="hidden line-clamp-2 text-xs font-medium text-black/50 lg:block">
                    {project.technologies.join(" · ")}
                  </p>

                  {/* Status */}

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase border ${
                        project.isPublished
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                      }`}
                    >
                      {project.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Updated */}

                  <p className="hidden text-xs font-medium text-black/45 lg:block">
                    {formatDate(project.updatedAt)}
                  </p>

                  {/* Actions */}

                  <div className="flex items-center gap-1.5">
                    {/* View */}

                    <button
                      type="button"
                      title="View project"
                      onClick={() => openViewModal(project)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                    >
                      <Eye size={17} strokeWidth={2} />
                    </button>

                    {/* Edit */}

                    <button
                      type="button"
                      title="Edit project"
                      onClick={() => openEditModal(project)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                    >
                      <Pencil size={16} strokeWidth={2} />
                    </button>

                    {/* Delete */}

                    <button
                      type="button"
                      title="Delete project"
                      disabled={deletingId === project.id}
                      onClick={() => deleteProject(project.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === project.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} strokeWidth={2} />
                      )}
                    </button>

                    {/* More */}

                    <button
                      type="button"
                      title="More"
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
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      </div>

      {/* ==================================================================
          VIEW MODAL
      ================================================================== */}

      {modal === "view" && selectedProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080808]/60 p-3 backdrop-blur-sm sm:p-6 font-['Sora',sans-serif]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Project Details
                </p>

                <h2 className="mt-1 truncate text-lg font-bold text-[#080808] sm:text-xl">
                  {selectedProject.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black/40 bg-black/5 transition hover:bg-[#080808] hover:text-white"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Modal Content */}

            <div className="overflow-y-auto">
              {/* Image */}

              {selectedProject.imageUrl && (
                <div className="border-b border-black/10 bg-[#fafafa]">
                  <img
                    src={selectedProject.imageUrl}
                    alt={selectedProject.title}
                    className="max-h-[350px] w-full object-contain"
                  />
                </div>
              )}

              <div className="space-y-8 p-6 sm:p-8">
                {/* Title + status */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-[#080808]">
                      {selectedProject.title}
                    </h3>

                    <p className="mt-1.5 text-sm font-medium text-black/50">
                      {selectedProject.category}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase border ${
                      selectedProject.isPublished
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                    }`}
                  >
                    {selectedProject.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                {/* Short description */}

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#080808]/40">
                    Short Description
                  </p>

                  <p className="text-sm font-medium leading-relaxed text-[#080808]/80">
                    {selectedProject.shortDescription}
                  </p>
                </div>

                {/* Description */}

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#080808]/40">
                    Description
                  </p>

                  <p className="whitespace-pre-wrap text-sm font-medium leading-loose text-[#080808]/80">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Technologies */}

                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#080808]/40">
                    Technologies
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map((technology) => (
                      <span
                        key={technology}
                        className="rounded-full border border-[#ffb646]/30 bg-[#ffb646]/10 px-3.5 py-1.5 text-xs font-bold text-[#080808]"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}

                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedProject.liveUrl && (
                    <a
                      href={selectedProject.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#ffb646]/30 bg-[#ffb646]/5 px-4 py-3.5 text-sm font-bold text-[#ff8a24] transition-all hover:bg-[#ffb646]/15 hover:border-[#ffb646]/50"
                    >
                      <ExternalLink size={18} strokeWidth={2.5} />
                      Open Live Website
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditModal(selectedProject)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#080808] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98]"
                  >
                    <Pencil size={18} strokeWidth={2} />
                    Edit Project
                  </button>
                </div>

                {/* Metadata */}

                <div className="grid gap-4 rounded-[1.5rem] bg-[#fafafa] border border-black/5 p-5 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Project ID
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#080808]">
                      #{selectedProject.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Created
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#080808]">
                      {formatDate(selectedProject.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Updated
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#080808]">
                      {formatDate(selectedProject.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          EDIT MODAL
      ================================================================== */}

      {modal === "edit" && selectedProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080808]/60 p-3 backdrop-blur-sm sm:p-6 font-['Sora',sans-serif]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <form
            onSubmit={updateProject}
            className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            {/* Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Portfolio
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#080808] sm:text-xl">
                  Edit Project
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

            {/* Edit Content */}

            <div className="overflow-y-auto">
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_340px]">
                {/* Left */}

                <div className="space-y-6">
                  {/* Title */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Project Name *
                    </label>

                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  {/* Category */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Category *
                    </label>

                    <select
                      value={editCategory}
                      onChange={(event) => setEditCategory(event.target.value)}
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10 cursor-pointer"
                    >
                      <option value="">Select category</option>
                      <option>Web Development</option>
                      <option>E-commerce</option>
                      <option>Event Platform</option>
                      <option>SaaS</option>
                      <option>Mobile Application</option>
                    </select>
                  </div>

                  {/* Short description */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Short Description *
                    </label>

                    <textarea
                      value={editShortDescription}
                      onChange={(event) =>
                        setEditShortDescription(event.target.value)
                      }
                      rows={3}
                      className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  {/* Description */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Description *
                    </label>

                    <textarea
                      value={editDescription}
                      onChange={(event) =>
                        setEditDescription(event.target.value)
                      }
                      rows={7}
                      className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm font-medium leading-relaxed text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  {/* Live URL */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Live Website
                    </label>

                    <input
                      type="url"
                      value={editLiveUrl}
                      onChange={(event) => setEditLiveUrl(event.target.value)}
                      placeholder="https://example.com"
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                    />
                  </div>

                  {/* Technologies */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Technologies
                    </label>

                    <div className="flex gap-2.5">
                      <input
                        value={editTechnologyInput}
                        onChange={(event) =>
                          setEditTechnologyInput(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addEditTechnology();
                          }
                        }}
                        placeholder="Add technology"
                        className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
                      />

                      <button
                        type="button"
                        onClick={addEditTechnology}
                        className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#080808] px-5 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808]"
                      >
                        <Plus size={16} strokeWidth={2.5} />
                        Add
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {editTechnologies.map((technology) => (
                        <span
                          key={technology}
                          className="inline-flex items-center gap-2 rounded-full border border-[#ffb646]/30 bg-[#ffb646]/10 px-3.5 py-1.5 text-xs font-bold text-[#080808]"
                        >
                          {technology}

                          <button
                            type="button"
                            onClick={() => removeEditTechnology(technology)}
                            className="text-black/40 hover:text-red-500 transition-colors"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Publish */}

                  <label className="flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-black/10 bg-[#fafafa] p-5 transition-colors hover:border-[#ffb646]/50">
                    <input
                      type="checkbox"
                      checked={editPublished}
                      onChange={(event) =>
                        setEditPublished(event.target.checked)
                      }
                      className="h-5 w-5 accent-[#ff8a24]"
                    />

                    <div>
                      <p className="text-sm font-bold text-[#080808]">
                        Publish project
                      </p>

                      <p className="mt-1 text-xs font-medium text-black/50">
                        Make this project visible on your portfolio.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Right */}

                <div className="space-y-6">
                  {/* Image */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                      Project Image
                    </label>

                    <label className="group relative flex min-h-[250px] cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-black/15 bg-[#fafafa] transition-all hover:border-[#ffb646] hover:bg-[#ffb646]/5">
                      {editImagePreview ? (
                        <>
                          <img
                            src={editImagePreview}
                            alt="Project"
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
                            <ImagePlus size={24} />
                          </div>

                          <p className="text-sm font-bold text-[#080808]">
                            Upload image
                          </p>

                          <p className="mt-1.5 text-xs font-medium text-black/45">
                            PNG, JPG or WEBP
                          </p>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                    </label>

                    <p className="mt-3 text-[11px] font-medium text-black/45">
                      Maximum file size: 5MB
                    </p>
                  </div>

                  {/* Current information */}

                  <div className="rounded-[1.5rem] bg-[#fafafa] border border-black/5 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Project Information
                    </p>

                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3">
                        <span className="text-xs font-medium text-black/50">
                          ID
                        </span>

                        <span className="text-xs font-bold text-[#080808]">
                          #{selectedProject.id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3">
                        <span className="text-xs font-medium text-black/50">
                          Slug
                        </span>

                        <span className="truncate text-xs font-bold text-[#080808]">
                          {selectedProject.slug}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-black/50">
                          Created
                        </span>

                        <span className="text-xs font-bold text-[#080808]">
                          {formatDate(selectedProject.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error inside modal */}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-600">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium leading-5 text-green-700">
                      {success}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-black/10 bg-white px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={closeModal}
                className="h-12 rounded-xl border border-black/10 bg-white px-6 text-sm font-bold text-[#080808] transition-all hover:bg-black/5 disabled:opacity-50"
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
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
