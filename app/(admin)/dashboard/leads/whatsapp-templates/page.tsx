"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Plus,
  Eye,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

type LeadCategory = {
  id: number;
  name: string;
  slug?: string;
  isActive?: boolean;
};

type WhatsAppTemplate = {
  id: number;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  message: string;
  imageUrl?: string | null;
  isActive?: boolean;
};

const SENDER_NAME = "Zoidics Software Solutions";
const BUSINESS_TOKEN = "{{businessName}}";
const CATEGORY_TOKEN = "{{categoryName}}";
const DEFAULT_MESSAGE =
  "Hi {{businessName}},\n\n" +
  "Greetings from Zoidics Software Solutions!\n\n" +
  "We came across {{businessName}} and wanted to connect. We help restaurants improve their online presence with modern websites, online menu pages, online ordering and digital marketing.\n\n" +
  "Would you be open to a quick conversation about your restaurant's digital needs?\n\n" +
  "Thank you,\n" +
  "Zoidics Software Solutions";

const CATEGORY_MESSAGES: Record<string, string> = {
  restaurant:
    "Hi {{businessName}},\n\n" +
    "Greetings from Zoidics Software Solutions!\n\n" +
    "We help restaurants attract more customers with modern websites, digital menus, online ordering and local digital marketing.\n\n" +
    "Would you be open to a quick conversation about growing {{businessName}} online?\n\n" +
    "Thank you,\nZoidics Software Solutions",
  "dental clinic":
    "Hi {{businessName}},\n\n" +
    "Greetings from Zoidics Software Solutions!\n\n" +
    "We help dental clinics improve their online presence with professional websites, appointment enquiry forms and local digital marketing.\n\n" +
    "Would you be open to a quick conversation about your clinic's digital needs?\n\n" +
    "Thank you,\nZoidics Software Solutions",
  "real estate":
    "Hi {{businessName}},\n\n" +
    "Greetings from Zoidics Software Solutions!\n\n" +
    "We help real estate businesses generate enquiries through professional websites, property listing pages and digital marketing.\n\n" +
    "Would you be open to a quick conversation about your business goals?\n\n" +
    "Thank you,\nZoidics Software Solutions",
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500";
const labelClass = "block text-sm font-semibold text-slate-800";

export default function WhatsAppTemplatesPage() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [recipientName, setRecipientName] = useState("ABC Restaurant");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedCategory = categories.find((category) => String(category.id) === categoryId);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
     const [categoryResponse, templateResponse] = await Promise.all([
  axios.get("/api/leads-management/categories", {
    headers: { "Cache-Control": "no-cache" },
  }),
  axios.get("/api/leads-management/whatsapp-templates", {
    headers: { "Cache-Control": "no-cache" },
  }),
]);

const categoryJson = categoryResponse.data;
const templateJson = templateResponse.data;

if (!categoryJson.success) {
  throw new Error(
    categoryJson.message || "Could not load business categories."
  );
}

setCategories(
  (Array.isArray(categoryJson.data) ? categoryJson.data : []).filter(
    (category: LeadCategory) => category.isActive !== false
  )
);

if (templateJson.success) {
  setTemplates(Array.isArray(templateJson.data) ? templateJson.data : []);
} else {
  setTemplates([]);
  setError(
    templateJson.message ||
      "Templates could not be loaded. You can still draft a template."
  );
}
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load page data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const previewMessage = useMemo(() => {
    const name = recipientName.trim() || "Business Name";
    return message
      .replaceAll("{{businessName}}", name)
      .replaceAll("{{categoryName}}", selectedCategory?.name || "business")
      .replaceAll("{{senderName}}", SENDER_NAME);
  }, [message, recipientName, selectedCategory]);

  function chooseCategory(value: string) {
    setCategoryId(value);
    setError("");
    setNotice("");
    if (!templateId) {
      const category = categories.find((item) => String(item.id) === value);
      const key = category?.name.trim().toLowerCase() || "";
      setMessage(CATEGORY_MESSAGES[key] || DEFAULT_MESSAGE);
      if (category && !templateName.trim()) {
        setTemplateName(`${category.name} Introduction`);
      }
    }
  }

  function resetForm() {
    setTemplateId(null);
    setTemplateName("");
    setMessage(
      CATEGORY_MESSAGES[selectedCategory?.name.trim().toLowerCase() || ""] ||
        DEFAULT_MESSAGE,
    );
    setImageFile(null);
    setImagePreview("");
    setActive(true);
    setError("");
    setNotice("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function editTemplate(template: WhatsAppTemplate) {
    setTemplateId(template.id);
    setTemplateName(template.name);
    setCategoryId(template.categoryId ? String(template.categoryId) : "");
    setMessage(template.message);
    setImageFile(null);
    setImagePreview(template.imageUrl || "");
    setActive(template.isActive !== false);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!categoryId) {
      setError("Select the business category this template is for.");
      return;
    }
    if (!templateName.trim()) {
      setError("Enter a clear template name.");
      return;
    }
    if (!message.trim()) {
      setError("Enter the WhatsApp message.");
      return;
    }
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      return;
    }
    if (imageFile && !["image/png", "image/jpeg", "image/webp"].includes(imageFile.type)) {
      setError("Choose a PNG, JPG or WEBP image.");
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.append("name", templateName.trim());
      body.append("categoryId", categoryId);
      body.append("message", message.trim());
      body.append("isActive", String(active));
      body.append("senderName", SENDER_NAME);
      if (imageFile) body.append("image", imageFile);

      const url = templateId
  ? `/api/leads-management/whatsapp-templates/${templateId}`
  : "/api/leads-management/whatsapp-templates";

const response = templateId
  ? await axios.patch(url, body)
  : await axios.post(url, body);

const result = response.data;

if (!result.success) {
  throw new Error(
    result.message ||
      "Could not save template. Check the template API and image upload support."
  );
}
      setNotice(templateId ? "Template updated successfully." : "Template saved successfully.");
      setTemplateId(null);
      setTemplateName("");
      setImageFile(null);
      setActive(true);
      if (imageInputRef.current) imageInputRef.current.value = "";
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save template.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(template: WhatsAppTemplate) {
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
     const response = await axios.delete(
  `/api/leads-management/whatsapp-templates/${template.id}`
);

const result = response.data;

if (!result.success) {
  throw new Error(result.message || "Could not delete template.");
}
      setNotice("Template deleted.");
      if (templateId === template.id) resetForm();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete template.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-5 font-['Sora',sans-serif] text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <Link href="/dashboard/leads/import" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700">
          <ArrowLeft size={16} /> Back to Import Leads
        </Link>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Zoidics · Sales</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">WhatsApp Templates</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Choose the same business category used for your Excel lead list, create a matching message, and preview it before saving.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-emerald-800">Fixed sender identity</p>
            <p className="mt-1 text-sm font-bold text-emerald-950">{SENDER_NAME}</p>
          </div>
        </header>

        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><X size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
        {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /><span>{notice}</span></div>}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <form onSubmit={saveTemplate} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{templateId ? "Edit template" : "Create a category template"}</h2>
                <p className="mt-1 text-sm text-slate-600">Use a short, relevant message. Keep it personal and easy to reply to.</p>
              </div>
              {templateId && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Editing</span>}
            </div>

            <div>
              <label htmlFor="category" className={labelClass}>Business category *</label>
              <select id="category" value={categoryId} onChange={(event) => chooseCategory(event.target.value)} disabled={loading || saving} required className={inputClass}>
                <option value="">{loading ? "Loading categories..." : "Choose category"}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">Example: choose Restaurant for your Chennai restaurant lead sheet.</p>
              {!loading && categories.length === 0 && <p className="mt-2 text-sm text-amber-800">No categories found. Create one from the Import Leads page first.</p>}
            </div>

            <div>
              <label htmlFor="templateName" className={labelClass}>Template name *</label>
              <input id="templateName" value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="e.g. Chennai Restaurant Introduction" maxLength={120} required className={inputClass} />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="message" className={labelClass}>WhatsApp message *</label>
                <span className="text-xs text-slate-500">{message.length}/1500</span>
              </div>
              <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1500} rows={10} required placeholder="Write a short, friendly introduction..." className={`${inputClass} min-h-64 resize-y leading-6`} />
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => setMessage((value) => value.includes(BUSINESS_TOKEN) ? value : `Hi ${BUSINESS_TOKEN},\n\n${value}`)} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">+ Insert business name</button>
                <button type="button" onClick={() => setMessage((value) => value.includes(CATEGORY_TOKEN) ? value : `${value}\n\nWe work with {{categoryName}} businesses.`)} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">+ Insert category</button>
                <button type="button" onClick={() => setMessage((value) => value.includes("{{senderName}}") ? value : `${value}\n{{senderName}}`)} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">+ Insert sender name</button>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Supported placeholders: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">{BUSINESS_TOKEN}</code>, <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">{CATEGORY_TOKEN}</code>, <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">{"{{senderName}}"}</code>
              </p>
            </div>

            <div>
              <label className={labelClass}>Optional image attachment</label>
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
              <div className="mt-2 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                {imagePreview ? (
                  <div className="w-full">
                    <img src={imagePreview} alt="Template attachment preview" className="mx-auto max-h-52 rounded-lg object-contain" />
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <button type="button" onClick={() => imageInputRef.current?.click()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">Change image</button>
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); if (imageInputRef.current) imageInputRef.current.value = ""; }} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Remove image</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="flex w-full flex-col items-center py-2 text-slate-800">
                    <ImagePlus size={28} className="text-emerald-700" />
                    <span className="mt-2 text-sm font-bold">Choose an image</span>
                    <span className="mt-1 text-xs text-slate-500">PNG, JPG or WEBP · Maximum 5 MB</span>
                  </button>
                )}
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3">
              <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" />
              <span><span className="block text-sm font-semibold text-slate-900">Active template</span><span className="mt-0.5 block text-xs text-slate-600">Only active templates should appear in the import workflow.</span></span>
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={saving || loading || !categories.length} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
                {saving ? "Saving..." : templateId ? "Update template" : "Save template"}
              </button>
              <button type="button" onClick={resetForm} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <X size={16} /> Clear form
              </button>
            </div>
          </form>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2"><Eye size={18} className="text-emerald-700" /><h2 className="font-bold text-slate-950">Live message preview</h2></div>
              <div className="mt-4">
                <label htmlFor="recipientName" className={labelClass}>Example recipient business name</label>
                <input id="recipientName" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="e.g. Marina Spice Restaurant" className={inputClass} />
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-[#eaf8ef] p-4 text-slate-900">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-900"><MessageCircle size={15} /> WhatsApp preview · Not sent</div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{previewMessage}</p>
                {imagePreview && <img src={imagePreview} alt="Selected template image" className="mt-3 max-h-48 rounded-xl object-contain" />}
                {!imagePreview && templates.find((item) => item.id === templateId)?.imageUrl && <img src={templates.find((item) => item.id === templateId)?.imageUrl || ""} alt="Saved template attachment" className="mt-3 max-h-48 rounded-xl object-contain" />}
                <p className="mt-4 text-right text-[10px] text-slate-500">Preview only — not sent</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Recipient business name changes for each lead. Sender identity remains <strong className="text-slate-700">{SENDER_NAME}</strong>.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-bold text-slate-950">Saved templates</h2><p className="mt-1 text-sm text-slate-600">{templates.length} template{templates.length === 1 ? "" : "s"}</p></div>
                <button type="button" onClick={() => void fetchData()} disabled={loading} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh</button>
              </div>
              {loading ? (
                <div className="flex justify-center py-10"><LoaderCircle className="animate-spin text-emerald-700" /></div>
              ) : templates.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <MessageCircle size={25} className="mx-auto text-slate-400" />
                  <p className="mt-3 text-sm font-bold text-slate-800">No templates yet</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Choose a category, review the message and save your first template.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {templates.map((template) => (
                    <article key={template.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start gap-3">
                        {template.imageUrl ? <img src={template.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><MessageCircle size={20} /></span>}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-bold text-slate-900">{template.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${template.isActive === false ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-800"}`}>{template.isActive === false ? "Inactive" : "Active"}</span></div>
                          <p className="mt-1 text-xs text-slate-600">{template.categoryName || categories.find((item) => item.id === template.categoryId)?.name || "Category not specified"}</p>
                          <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{template.message}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                        <button type="button" onClick={() => editTemplate(template)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={13} /> Edit</button>
                        <button type="button" onClick={() => void deleteTemplate(template)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 size={13} /> Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <footer className="flex flex-wrap gap-2 pb-3">
          <Link href="/dashboard/leads/import" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={15} /> Back to Import Leads</Link>
          <Link href="/dashboard/leads" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#ffb646] px-4 text-sm font-bold text-slate-950 hover:bg-[#ffa726]">Lead Management <ArrowRight size={15} /></Link>
        </footer>
      </div>
    </main>
  );
}
