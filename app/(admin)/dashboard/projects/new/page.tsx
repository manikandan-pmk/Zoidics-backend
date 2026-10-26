"use client";

import Link from "next/link";
import { ArrowLeft, ImagePlus, Plus, X } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function NewProjectPage() {
  const router = useRouter();

  const [technologies, setTechnologies] = useState<string[]>([
    "React",
    "TypeScript",
  ]);

  const [technologyInput, setTechnologyInput] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const addTechnology = () => {
    const value = technologyInput.trim();

    if (!value) return;

    if (!technologies.includes(value)) {
      setTechnologies([...technologies, value]);
    }

    setTechnologyInput("");
  };

  const removeTechnology = (technology: string) => {
    setTechnologies(technologies.filter((item) => item !== technology));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImage(null);
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrorMessage("Only PNG, JPG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setImage(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const form = event.currentTarget;

      const formData = new FormData(form);

      // Add technologies as comma-separated string
      formData.set("technologies", technologies.join(","));

      // Add publish status
      formData.set("isPublished", String(isPublished));

      // Make sure image is included
      if (image) {
        formData.set("image", image);
      }

      const response = await axios.post("/api/projects", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || "Failed to create project");
      }

      setSuccessMessage("Project created successfully!");

      // Redirect after successful creation
      setTimeout(() => {
        router.push("/dashboard/projects");
        router.refresh();
      }, 800);
    } catch (error) {
      console.error("CREATE PROJECT ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the project.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] font-['Sora',sans-serif]">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/dashboard/projects"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-black/50 transition-colors hover:text-[#ff8a24]"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          Back to Projects
        </Link>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
            Portfolio
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#080808] md:text-4xl">
            Add Project
          </h1>

          <p className="mt-3 text-sm font-medium text-black/50">
            Create a new project for your freelance portfolio.
          </p>
        </div>
      </div>

      {/* Success / Error */}
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-600">
          {successMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic information */}
        <section className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/5 bg-[#f9f9f9]/50 px-6 py-5">
            <h2 className="font-bold text-[#080808]">Basic Information</h2>

            <p className="mt-1 text-xs font-medium text-black/45">
              Basic information about your project.
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            {/* Project name */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                Project Name *
              </label>

              <input
                name="title"
                type="text"
                required
                placeholder="e.g. TuneTix"
                className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:font-medium placeholder:text-black/30 focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                Slug *
              </label>

              <input
                type="text"
                placeholder="tunetix"
                value="auto-generated"
                disabled
                className="h-12 w-full cursor-not-allowed rounded-xl border border-black/10 bg-[#f5f5f5] px-4 text-sm font-semibold text-black/40 outline-none"
              />

              <p className="mt-2 text-[11px] font-medium text-black/45">
                Slug is automatically generated from the project name.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                Category *
              </label>

              <select
                name="category"
                required
                defaultValue=""
                className="h-12 w-full cursor-pointer rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
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
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                Short Description *
              </label>

              <textarea
                name="shortDescription"
                required
                rows={3}
                placeholder="A short description of the project..."
                className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:font-medium placeholder:text-black/30 focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
              />
            </div>

            {/* Full description */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                Project Description *
              </label>

              <textarea
                name="description"
                required
                rows={7}
                placeholder="Describe the project, your role, features, challenges and solution..."
                className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm font-medium leading-relaxed text-[#080808] outline-none transition-all placeholder:font-medium placeholder:text-black/30 focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
              />
            </div>
          </div>
        </section>

        {/* Technologies */}
        <section className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/5 bg-[#f9f9f9]/50 px-6 py-5">
            <h2 className="font-bold text-[#080808]">Technologies</h2>

            <p className="mt-1 text-xs font-medium text-black/45">
              Add the technologies used to build this project.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex gap-3">
              <input
                value={technologyInput}
                onChange={(event) => setTechnologyInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTechnology();
                  }
                }}
                placeholder="e.g. Node.js"
                className="h-12 flex-1 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:font-medium placeholder:text-black/30 focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
              />

              <button
                type="button"
                onClick={addTechnology}
                className="flex h-12 items-center gap-2 rounded-xl bg-[#080808] px-6 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808]"
              >
                <Plus size={18} strokeWidth={2.5} />
                Add
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {technologies.map((technology) => (
                <span
                  key={technology}
                  className="inline-flex items-center gap-2 rounded-full border border-[#ffb646]/30 bg-[#ffb646]/10 px-3.5 py-1.5 text-xs font-bold text-[#080808]"
                >
                  {technology}

                  <button
                    type="button"
                    onClick={() => removeTechnology(technology)}
                    className="text-black/40 transition-colors hover:text-red-500"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/5 bg-[#f9f9f9]/50 px-6 py-5">
            <h2 className="font-bold text-[#080808]">Project Link</h2>

            <p className="mt-1 text-xs font-medium text-black/45">
              Add a link where visitors can explore the project.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#080808]/70">
                Live Website
              </label>

              <input
                name="liveUrl"
                type="url"
                placeholder="https://example.com"
                className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:font-medium placeholder:text-black/30 focus:border-[#ffb646] focus:bg-white focus:ring-4 focus:ring-[#ffb646]/10"
              />
            </div>
          </div>
        </section>

        {/* Image */}
        <section className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/5 bg-[#f9f9f9]/50 px-6 py-5">
            <h2 className="font-bold text-[#080808]">Project Image</h2>

            <p className="mt-1 text-xs font-medium text-black/45">
              Upload the main image used on your portfolio.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <label className="flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-black/15 bg-[#fafafa] transition-all hover:border-[#ffb646] hover:bg-[#ffb646]/5">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffb646]/10 text-[#ff8a24]">
                <ImagePlus size={28} />
              </div>

              <p className="text-sm font-bold text-[#080808]">
                {image ? image.name : "Upload project image"}
              </p>

              <p className="mt-1.5 text-xs font-medium text-black/45">
                PNG, JPG or WEBP up to 5MB
              </p>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </section>

        {/* Publishing */}
        <section className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/5 bg-[#f9f9f9]/50 px-6 py-5">
            <h2 className="font-bold text-[#080808]">Publishing</h2>

            <p className="mt-1 text-xs font-medium text-black/45">
              Control whether this project is visible publicly.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <label className="flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-black/10 bg-[#fafafa] p-5 transition-colors hover:border-[#ffb646]/50">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="h-5 w-5 accent-[#ff8a24]"
              />

              <div>
                <p className="text-sm font-bold text-[#080808]">
                  Publish project
                </p>

                <p className="mt-1 text-xs font-medium text-black/50">
                  Published projects are visible on your portfolio.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse justify-end gap-4 pt-4 sm:flex-row">
          <Link
            href="/dashboard/projects"
            className="flex h-12 items-center justify-center rounded-xl border border-black/10 bg-white px-8 text-sm font-bold text-[#080808] transition-all hover:bg-black/5"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-[#080808] px-8 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
