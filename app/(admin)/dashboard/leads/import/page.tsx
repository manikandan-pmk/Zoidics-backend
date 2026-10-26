"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  LoaderCircle,
  MessageCircle,
  Plus,
  Upload,
  Users,
  X,
  UserRoundPlus,
  Save,
  RefreshCw,
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
  title?: string;
  topic?: string;
  language?: string;
  message: string;
  content?: string;
  categoryId?: number;
  categoryName?: string | null;
  category?: { id: number; name: string };
  imageUrl?: string | null;
  isActive?: boolean;
};

type ImportResult = {
  success: boolean;
  message?: string;
  imported: number;
  duplicates: number;
  failed: number;
  campaignId?: number;
  campaignName?: string;
  categoryId?: number;
  categoryName?: string;
  templateId?: number;
  templateName?: string;
  errors?: { row: number; sheet?: string; reason: string }[];
  skippedSheets?: string[];
};

type Mode = "manual" | "file";
type ManualLead = {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  instagram: string;
  serviceNeeded: string;
  city: string;
  address: string;
};

const EMPTY_LEAD: ManualLead = {
  businessName: "",
  contactPerson: "",
  phone: "",
  email: "",
  instagram: "",
  serviceNeeded: "",
  city: "",
  address: "",
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SENDER_NAME = "Zoidics Software Solutions";
const DEFAULT_TEMPLATE =
  "Hi {{businessName}},\n\nGreetings from Zoidics Software Solutions!\n\n" +
  "We came across {{businessName}} and wanted to connect. We help businesses " +
  "improve their online presence with modern websites, online marketing and digital solutions.\n\n" +
  "Would you be open to a quick conversation about your business needs?\n\n" +
  "Thank you,\nZoidics Software Solutions";

async function readResponse(response: Response): Promise<any> {
  const text = await response.text();
  let result: any = null;
  if (text.trim()) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(
        `The server returned an invalid response (${response.status}). Check the API route/server logs.`,
      );
    }
  }
  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.message || `Request failed (${response.status}). Please check the server logs.`,
    );
  }
  if (!result || typeof result !== "object") {
    throw new Error("The server returned an empty response. Check the API route.");
  }
  return result;
}

function renderMessage(
  message: string,
  businessName: string,
  categoryName: string,
  contactPerson = "Contact Person",
  serviceNeeded = "Digital Solutions",
) {
  return message
    .replaceAll("{{businessName}}", businessName || "Business Name")
    .replaceAll("{{categoryName}}", categoryName || "Business Category")
    .replaceAll("{{contactPerson}}", contactPerson || "Contact Person")
    .replaceAll("{{serviceNeeded}}", serviceNeeded || categoryName || "Service")
    .replaceAll("{{companyName}}", SENDER_NAME)
    .replaceAll("{{senderName}}", SENDER_NAME);
}

export default function ImportLeadsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("file");
  const [lead, setLead] = useState<ManualLead>(EMPTY_LEAD);
  const [file, setFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateConfirmed, setTemplateConfirmed] = useState(false);

  const [showTemplateEditor, setShowTemplateEditor] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateTopic, setTemplateTopic] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("English");
  const [templateContent, setTemplateContent] = useState(DEFAULT_TEMPLATE);
  const [templateImageFile, setTemplateImageFile] = useState<File | null>(null);
  const [templateImagePreview, setTemplateImagePreview] = useState("");
  const [templateIsActive, setTemplateIsActive] = useState(true);
  const [previewBusinessName, setPreviewBusinessName] = useState("ABC Restaurant");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((item) => String(item.id) === categoryId),
    [categories, categoryId],
  );
  const selectedTemplate = useMemo(
    () => templates.find((item) => String(item.id) === templateId),
    [templates, templateId],
  );

  const clearFeedback = useCallback(() => {
    setError("");
    setNotice("");
    setResult(null);
  }, []);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await axios.get("/api/leads-management/categories", {
  headers: { "Cache-Control": "no-cache" },
});
const data = response.data;
      const list: LeadCategory[] = Array.isArray(data.data) ? data.data : [];
      setCategories(list.filter((item) => item.isActive !== false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load categories.");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadTemplates = useCallback(async (selectedCategoryId: string) => {
    setTemplates([]);
    setTemplateId("");
    setTemplateConfirmed(false);
    if (!selectedCategoryId) {
      setLoadingTemplates(false);
      return;
    }
    setLoadingTemplates(true);
    try {
      const response = await axios.get(
  `/api/leads-management/whatsapp-templates?categoryId=${encodeURIComponent(selectedCategoryId)}&activeOnly=true`,
  {
    headers: { "Cache-Control": "no-cache" },
  }
);
const data = response.data;
      const list: WhatsAppTemplate[] = Array.isArray(data.data) ? data.data : [];
      const categoryTemplates = list
        .filter((item) => item.isActive !== false)
        .filter((item) => {
          const id = item.categoryId ?? item.category?.id;
          return id == null || Number(id) === Number(selectedCategoryId);
        })
        .map((item) => ({
          ...item,
          name: item.name || item.title || `Template ${item.id}`,
          message: item.message || item.content || "",
        }));
      setTemplates(categoryTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load WhatsApp templates.");
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadTemplates(categoryId);
  }, [categoryId, loadTemplates]);

  useEffect(() => {
    if (!templateImageFile) {
      setTemplateImagePreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(templateImageFile);
    setTemplateImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [templateImageFile]);

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setError("Enter a business category.");
      return;
    }
    setSavingCategory(true);
    clearFeedback();
    try {
      const response = await axios.post(
  "/api/leads-management/categories",
  { name }
);
const data = response.data;
      let created: LeadCategory | undefined = data.data?.id
        ? data.data
        : data.category?.id
          ? data.category
          : undefined;
      const refreshResponse = await axios.get(
  "/api/leads-management/categories",
  {
    headers: { "Cache-Control": "no-cache" },
  }
);
const refreshed = refreshResponse.data;
      const list: LeadCategory[] = Array.isArray(refreshed.data) ? refreshed.data : [];
      setCategories(list.filter((item) => item.isActive !== false));
      if (!created?.id) {
        created = list.find((item) => item.name.toLowerCase() === name.toLowerCase());
      }
      if (created?.id) setCategoryId(String(created.id));
      setNewCategoryName("");
      setShowCategoryInput(false);
      setNotice(`Category "${name}" saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create category.");
    } finally {
      setSavingCategory(false);
    }
  }

  function updateLead(field: keyof ManualLead, value: string) {
    setLead((current) => ({ ...current, [field]: value }));
  }

  function chooseFile(selectedFile?: File) {
    clearFeedback();
    if (!selectedFile) return;
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension || "")) {
      setFile(null);
      setError("Choose an Excel .xlsx, .xls or .csv file.");
      return;
    }
    if (selectedFile.size === 0 || selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("File must be larger than 0 bytes and no more than 5 MB.");
      return;
    }
    setFile(selectedFile);
  }

  async function saveInlineTemplate() {
    clearFeedback();
    if (!categoryId || !selectedCategory) {
      setError("Select a business category first.");
      return;
    }
    if (!templateName.trim()) {
      setError("Enter a template name.");
      return;
    }
    if (templateName.trim().length > 150) {
      setError("Template name must be 150 characters or fewer.");
      return;
    }
    if (!templateContent.trim()) {
      setError("Enter a WhatsApp message.");
      return;
    }
    if (templateContent.trim().length > 10000) {
      setError("Message must be 10,000 characters or fewer.");
      return;
    }
    if (templateImageFile && templateImageFile.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }
    if (templateImageFile && !["image/png", "image/jpeg", "image/webp"].includes(templateImageFile.type)) {
      setError("Choose a PNG, JPG or WEBP image.");
      return;
    }
    setSavingTemplate(true);
    try {
      const formData = new FormData();
      formData.append("categoryId", String(Number(categoryId)));
      formData.append("title", templateName.trim());
      formData.append("topic", templateTopic.trim() || templateName.trim());
      formData.append("language", templateLanguage);
      formData.append("content", templateContent.trim());
      formData.append("isActive", String(templateIsActive));
      formData.append("imageAltText", templateImageFile?.name || "WhatsApp template image");
      if (templateImageFile) formData.append("image", templateImageFile);

     const response = await axios.post(
  "/api/leads-management/whatsapp-templates",
  formData
);
const data = response.data;
      const saved = data.data;
      if (!saved?.id) throw new Error("Template API did not return the saved template ID.");
      const normalized: WhatsAppTemplate = {
        ...saved,
        id: Number(saved.id),
        name: saved.name || saved.title || templateName.trim(),
        title: saved.title || templateName.trim(),
        message: saved.message || saved.content || templateContent.trim(),
        content: saved.content || templateContent.trim(),
        categoryId: Number(saved.categoryId ?? categoryId),
        categoryName: saved.categoryName ?? selectedCategory.name,
        imageUrl: saved.imageUrl ?? null,
        isActive: saved.isActive ?? templateIsActive,
      };
      if (!normalized.isActive) {
        setTemplates((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)]);
        setTemplateId(String(normalized.id));
        setTemplateConfirmed(false);
        setShowTemplateEditor(false);
        setNotice("Template saved but inactive. Activate it before importing leads.");
      } else {
        setTemplates((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)]);
        setTemplateId(String(normalized.id));
        setTemplateConfirmed(false);
        setShowTemplateEditor(false);
        setNotice("Template saved and selected. Review the preview, then confirm it before importing.");
      }
      setTemplateName("");
      setTemplateTopic("");
      setTemplateContent(DEFAULT_TEMPLATE);
      setTemplateImageFile(null);
      setTemplateLanguage("English");
      setTemplateIsActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save WhatsApp template.");
    } finally {
      setSavingTemplate(false);
    }
  }

  function confirmTemplate() {
    clearFeedback();
    if (!categoryId || !selectedCategory) {
      setError("Select a business category first.");
      return;
    }
    if (!selectedTemplate || !templateId) {
      setError("Select a saved WhatsApp template.");
      return;
    }
    const templateCategoryId = selectedTemplate.categoryId ?? selectedTemplate.category?.id;
    if (templateCategoryId != null && Number(templateCategoryId) !== Number(categoryId)) {
      setError("This template does not match the selected category.");
      return;
    }
    if (selectedTemplate.isActive === false) {
      setError("This template is inactive. Create or select an active template.");
      return;
    }
    setTemplateConfirmed(true);
    setNotice("WhatsApp template confirmed. No message has been sent.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    if (!selectedCategory || !categoryId) {
      setError("Create or select a business category first.");
      return;
    }
    if (!selectedTemplate || !templateId || !templateConfirmed) {
      setError("Select and confirm a WhatsApp template before continuing.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "manual") {
        if (!lead.businessName.trim()) throw new Error("Business name is required.");
        if (!lead.phone.trim() && !lead.email.trim()) {
          throw new Error("Enter a phone number or email address.");
        }
        const response = await axios.post("/api/leads-management", {
  ...lead,
  businessName: lead.businessName.trim(),
  categoryId: Number(categoryId),
  templateId: Number(templateId),
  whatsAppTemplateId: Number(templateId),
});

const data = response.data;
        setResult({
          success: true,
          message: data.message || "Lead created successfully.",
          imported: 1,
          duplicates: 0,
          failed: 0,
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          categoryId: data.categoryId ?? Number(categoryId),
          categoryName: data.categoryName ?? selectedCategory.name,
          templateId: data.templateId ?? Number(templateId),
          templateName: data.templateName ?? selectedTemplate.name,
        });
        setNotice(data.message || "Lead created successfully.");
        setLead(EMPTY_LEAD);
      } else {
        if (!file) throw new Error("Choose an Excel or CSV file.");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("categoryId", categoryId);
        formData.append("whatsAppTemplateId", templateId);
        formData.append("templateId", templateId);
        formData.append("campaignName", `${selectedCategory.name} Outreach`);
        const response = await axios.post(
  "/api/leads-management/import",
  formData
);

const data: ImportResult = response.data;
        setResult(data);
        setNotice(data.message || "Import completed.");
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
      }
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save leads.");
    } finally {
      setBusy(false);
    }
  }

  function viewImportedLeads() {
    router.push(result?.campaignId ? `/dashboard/leads?campaignId=${result.campaignId}` : "/dashboard/leads");
  }

  const editorPreview = renderMessage(
    templateContent,
    previewBusinessName,
    selectedCategory?.name || "",
  );

  return (
    <main className="min-h-screen bg-[#fafafa] px-3 py-5 font-['Sora',sans-serif] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <Link href="/dashboard/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#d67e0c]">
          <ArrowLeft size={17} /> Back to Lead Management
        </Link>

        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e98a12]">Zoidics · Sales</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111] sm:text-3xl">Add Business Leads</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Select a category, create or confirm its WhatsApp template, then add leads manually or upload a spreadsheet.</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            <span className="block text-emerald-700">Fixed sender identity</span>
            <strong>{SENDER_NAME}</strong>
          </div>
        </header>

        {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" /><p>{error}</p></div>}
        {notice && <div role="status" className="flex gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={18} className="shrink-0" /><p>{notice}</p></div>}

        {result && (
          <section className="space-y-4 rounded-2xl border border-green-200 bg-green-50 p-4">
            <h2 className="font-bold text-green-900">Completed</h2>
            <p className="text-sm text-green-800">{result.message}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Imported</p><p className="text-2xl font-bold text-green-700">{result.imported ?? 0}</p></div>
              <div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Duplicates</p><p className="text-2xl font-bold">{result.duplicates ?? 0}</p></div>
              <div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Failed</p><p className="text-2xl font-bold">{result.failed ?? 0}</p></div>
            </div>
            {!!result.errors?.length && <details className="rounded-xl bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">Row errors ({result.errors.length})</summary><ul className="mt-2 space-y-1 text-sm">{result.errors.map((item, index) => <li key={`${item.sheet || ""}-${item.row}-${index}`}>{item.sheet ? `${item.sheet} — ` : ""}Row {item.row}: {item.reason}</li>)}</ul></details>}
            <button type="button" onClick={viewImportedLeads} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffb646] px-4 text-sm font-bold"><Users size={17} /> View imported leads <ArrowRight size={15} /></button>
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="font-bold text-[#151515]">1. Business category</h2><p className="mt-1 text-sm text-slate-500">Select an existing category or create one.</p></div>
              <button type="button" onClick={() => { setShowCategoryInput((v) => !v); clearFeedback(); }} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#f3d5a5] bg-[#fffaf1] px-3 text-sm font-bold text-[#a45b00] hover:bg-[#fff2d9]">{showCategoryInput ? <X size={16} /> : <Plus size={16} />}{showCategoryInput ? "Cancel" : "Create category"}</button>
            </div>
            {showCategoryInput && <div className="mt-4 flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3 sm:flex-row"><input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} maxLength={100} placeholder="e.g. Dental Clinic" className="min-h-11 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber-500" /><button type="button" onClick={() => void createCategory()} disabled={savingCategory || !newCategoryName.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#ffb646] px-4 text-sm font-bold disabled:opacity-50">{savingCategory ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} Save category</button></div>}
            <div className="mt-4"><label htmlFor="categoryId" className="mb-2 block text-sm font-semibold text-slate-900">Business category *</label><select id="categoryId" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setTemplateId(""); setTemplateConfirmed(false); clearFeedback(); }} disabled={loadingCategories || busy} required className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-[#ffb646] focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100 disabled:text-slate-600"><option value="" className="bg-white text-slate-900">{loadingCategories ? "Loading categories..." : "Choose business category"}</option>{categories.map((item) => <option className="bg-white text-slate-900" key={item.id} value={item.id}>{item.name}</option>)}</select>{!loadingCategories && categories.length === 0 && <p className="mt-2 text-xs text-amber-700">No categories yet. Create one above.</p>}</div>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><MessageCircle size={19} /></span><div><h2 className="font-bold text-[#151515]">2. WhatsApp template</h2><p className="mt-1 text-sm text-slate-500">Create a category-specific message, preview it, save it and confirm before importing.</p></div></div><button type="button" onClick={() => { void loadTemplates(categoryId); }} disabled={!categoryId || loadingTemplates || busy} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-semibold disabled:opacity-50"><RefreshCw size={14} className={loadingTemplates ? "animate-spin" : ""} /> Refresh</button></div>

            <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div><label htmlFor="templateId" className="mb-1.5 block text-sm font-semibold text-slate-700">Saved template *</label><select id="templateId" value={templateId} onChange={(e) => { setTemplateId(e.target.value); setTemplateConfirmed(false); clearFeedback(); }} disabled={!categoryId || loadingTemplates || busy} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500"><option value="">{!categoryId ? "Select a category first" : loadingTemplates ? "Loading templates..." : "Choose WhatsApp template"}</option>{templates.filter((item) => item.isActive !== false).map((item) => <option key={item.id} value={item.id}>{item.name || item.title || `Template ${item.id}`}</option>)}</select>{!loadingTemplates && categoryId && templates.filter((item) => item.isActive !== false).length === 0 && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No active templates for this category yet. Create one below.</p>}</div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">Create a category template</h3><span className="text-xs text-slate-500">Saved in your database</span></div>
                  <p className="mt-1 text-xs text-slate-500">Create and save here without leaving the import page.</p>
                  <div className="mt-4 space-y-3">
                    <div><label className="mb-1 block text-sm font-semibold text-slate-800">Template name *</label><input value={templateName} onChange={(e) => setTemplateName(e.target.value)} maxLength={150} disabled={!categoryId || savingTemplate || busy} placeholder="e.g. Chennai Restaurant Introduction" className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500" /></div>
                    <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-sm font-semibold text-slate-800">Topic</label><input value={templateTopic} onChange={(e) => setTemplateTopic(e.target.value)} maxLength={100} disabled={!categoryId || savingTemplate || busy} placeholder="Introduction" className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500" /></div><div><label className="mb-1 block text-sm font-semibold text-slate-800">Language</label><select value={templateLanguage} onChange={(e) => setTemplateLanguage(e.target.value)} disabled={!categoryId || savingTemplate || busy} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"><option>English</option><option>Tamil</option><option>Tanglish</option></select></div></div>
                    <div><div className="mb-1 flex items-center justify-between gap-2"><label className="text-sm font-semibold text-slate-800">WhatsApp message *</label><span className="text-xs text-slate-500">{templateContent.length}/10000</span></div><textarea value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} maxLength={10000} rows={9} disabled={!categoryId || savingTemplate || busy} className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500" /><div className="mt-2 flex flex-wrap gap-1.5">{[["Business name", "{{businessName}}"], ["Category", "{{categoryName}}"], ["Contact person", "{{contactPerson}}"], ["Sender name", "{{senderName}}"]].map(([label, token]) => <button key={token} type="button" onClick={() => setTemplateContent((current) => `${current}${current.endsWith(" ") || current.endsWith("\n") ? "" : " "}${token}`)} disabled={!categoryId || savingTemplate || busy} className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50">+ {label}</button>)}</div></div>
                    <div><label htmlFor="templateImage" className="mb-1 block text-sm font-semibold text-slate-800">Optional image attachment</label><label htmlFor="templateImage" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-4 text-center transition hover:bg-emerald-50"><Upload size={22} className="text-emerald-700" /><span className="mt-2 text-sm font-semibold text-slate-800">{templateImageFile ? templateImageFile.name : "Choose an image"}</span><span className="mt-1 text-xs text-slate-500">PNG, JPG or WEBP · Maximum 5 MB</span><input id="templateImage" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={!categoryId || savingTemplate || busy} onChange={(e) => { const picked = e.target.files?.[0] || null; if (picked && picked.size > 5 * 1024 * 1024) { setTemplateImageFile(null); setError("Image must be 5 MB or smaller."); e.currentTarget.value = ""; return; } setTemplateImageFile(picked); }} /></label>{templateImageFile && <button type="button" onClick={() => setTemplateImageFile(null)} className="mt-2 text-xs font-semibold text-red-700">Remove image</button>}<p className="mt-1 text-xs text-slate-500">Image is uploaded to the server when you save the template.</p></div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800"><input type="checkbox" checked={templateIsActive} onChange={(e) => setTemplateIsActive(e.target.checked)} disabled={!categoryId || savingTemplate || busy} /> Active template</label>
                    <button type="button" onClick={() => void saveInlineTemplate()} disabled={!categoryId || savingTemplate || busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{savingTemplate ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} {savingTemplate ? "Saving template..." : "Save template"}</button>
                  </div>
                </div>
              </div>

              <div className="self-start rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2"><Eye size={16} className="text-emerald-700" /><h3 className="font-bold text-slate-900">Live message preview</h3></div>
                <label className="mb-1 mt-4 block text-xs font-semibold text-slate-600">Example recipient business name</label><input value={previewBusinessName} onChange={(e) => setPreviewBusinessName(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                <div className="mt-3 rounded-xl border border-[#b8e4c7] bg-[#e5f6eb] p-4 shadow-inner"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-emerald-800"><MessageCircle size={13} /> WhatsApp preview · Not sent</div><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{selectedTemplate ? renderMessage(selectedTemplate.message, previewBusinessName, selectedCategory?.name || "", lead.contactPerson, lead.serviceNeeded) : editorPreview}</p>{(selectedTemplate?.imageUrl || templateImagePreview) && <img src={selectedTemplate?.imageUrl || templateImagePreview} alt="Template attachment preview" className="mt-3 max-h-48 rounded-lg object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}</div>
                <p className="mt-3 text-xs leading-5 text-slate-500">Recipient business name changes for each lead. Sender identity remains {SENDER_NAME}. Preview only — no message has been sent.</p>
                {selectedTemplate && <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3"><p className="text-sm font-bold text-emerald-900">Selected template: {selectedTemplate.name}</p><p className="mt-1 text-xs text-emerald-800">Category: {selectedCategory?.name}</p><button type="button" onClick={confirmTemplate} disabled={busy || selectedTemplate.isActive === false} className={`mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold ${templateConfirmed ? "bg-green-100 text-green-800" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}><CheckCircle2 size={16} />{templateConfirmed ? "Template confirmed" : "Confirm template"}</button></div>}
              </div>

              <div className="self-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div><h3 className="font-bold text-slate-900">Saved templates</h3><p className="mt-1 text-xs text-slate-500">{templates.filter((item) => item.isActive !== false).length} active template(s) for this category</p></div>
                  <button type="button" onClick={() => { void loadTemplates(categoryId); }} disabled={!categoryId || loadingTemplates || busy} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={13} className={loadingTemplates ? "animate-spin" : ""} /> Refresh</button>
                </div>
                <div className="mt-3 space-y-2">
                  {templates.filter((item) => item.isActive !== false).length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center"><MessageCircle size={22} className="mx-auto text-slate-400" /><p className="mt-2 text-sm font-semibold text-slate-700">No templates yet</p><p className="mt-1 text-xs leading-5 text-slate-500">Create a template on the left and save it to your database.</p></div>
                  ) : templates.filter((item) => item.isActive !== false).map((item) => (
                    <button key={item.id} type="button" onClick={() => { setTemplateId(String(item.id)); setTemplateConfirmed(false); clearFeedback(); }} className={`w-full rounded-lg border p-3 text-left transition ${String(item.id) === templateId ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
                      <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-800">{item.name || item.title || `Template ${item.id}`}</span>{String(item.id) === templateId && <CheckCircle2 size={15} className="shrink-0 text-emerald-700" />}</span>
                      <span className="mt-1 block line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">{item.message || item.content || "No message content"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="font-bold text-[#151515]">3. Add business leads</h2><p className="mt-1 text-sm text-slate-500">Choose manual entry or upload a spreadsheet. The selected template is saved with the lead operation; messages are not sent automatically.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => { setMode("manual"); clearFeedback(); }} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold ${mode === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}><UserRoundPlus size={16} /> Manual entry</button><button type="button" onClick={() => { setMode("file"); clearFeedback(); }} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold ${mode === "file" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}><FileSpreadsheet size={16} /> Excel / CSV</button></div>
            {!templateConfirmed && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Confirm the WhatsApp template above before adding leads.</p>}

            {mode === "manual" ? <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label htmlFor="businessName" className="mb-1.5 block text-sm font-semibold text-slate-700">Business name *</label><input id="businessName" value={lead.businessName} onChange={(e) => updateLead("businessName", e.target.value)} maxLength={150} required placeholder="e.g. ABC Dental Clinic" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></div>
              <div><label htmlFor="contactPerson" className="mb-1.5 block text-sm font-semibold text-slate-700">Contact person</label><input id="contactPerson" value={lead.contactPerson} onChange={(e) => updateLead("contactPerson", e.target.value)} maxLength={120} placeholder="Contact name" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></div>
              <div><label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-slate-700">Phone / WhatsApp</label><input id="phone" type="tel" value={lead.phone} onChange={(e) => updateLead("phone", e.target.value)} maxLength={30} placeholder="+91 98765 43210" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></div>
              <div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label><input id="email" type="email" value={lead.email} onChange={(e) => updateLead("email", e.target.value)} maxLength={180} placeholder="business@example.com" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></div>
              <div><label htmlFor="instagram" className="mb-1.5 block text-sm font-semibold text-slate-700">Instagram URL</label><input id="instagram" value={lead.instagram} onChange={(e) => updateLead("instagram", e.target.value)} maxLength={180} placeholder="https://instagram.com/..." className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></div>
              <div><label htmlFor="serviceNeeded" className="mb-1.5 block text-sm font-semibold text-slate-700">Service needed</label><input id="serviceNeeded" value={lead.serviceNeeded} onChange={(e) => updateLead("serviceNeeded", e.target.value)} maxLength={100} placeholder={selectedCategory?.name || "Service"} className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></div>
              <div><label htmlFor="city" className="mb-1.5 block text-sm font-semibold text-slate-700">City</label><input id="city" value={lead.city} onChange={(e) => updateLead("city", e.target.value)} maxLength={100} placeholder="Chennai" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></div>
              <div className="sm:col-span-2"><label htmlFor="address" className="mb-1.5 block text-sm font-semibold text-slate-700">Address</label><textarea id="address" value={lead.address} onChange={(e) => updateLead("address", e.target.value)} maxLength={1000} rows={3} placeholder="Business address" className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm" /></div>
              <p className="text-xs text-slate-500 sm:col-span-2">Enter at least a phone number or email. Business category is taken from Step 1.</p>
            </div> : <div className="mt-4">
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])} />
              {!file ? <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8c58c] bg-[#fffbf4] p-5 text-center hover:bg-[#fff7e8] disabled:opacity-50"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0d6] text-[#d67e0c]"><Upload size={22} /></span><span className="mt-3 text-sm font-bold text-slate-800">Click to upload spreadsheet</span><span className="mt-1 text-xs text-slate-500">XLSX, XLS or CSV · Maximum 5 MB</span><span className="mt-1 text-xs text-slate-500">A business-name column is required</span></button> : <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3"><FileSpreadsheet size={24} className="shrink-0 text-green-700" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{file.name}</p><p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p></div><button type="button" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label="Remove file" className="rounded-lg p-2 text-slate-500 hover:bg-white"><X size={17} /></button></div>}
            </div>}
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/dashboard/leads" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-black/10 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link><button type="submit" disabled={busy || !categoryId || !templateId || !templateConfirmed || loadingCategories || loadingTemplates || (mode === "file" && !file)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffb646] px-6 text-sm font-bold text-[#151515] hover:bg-[#ffa726] disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><LoaderCircle size={17} className="animate-spin" />{mode === "manual" ? "Saving lead..." : "Importing..."}</> : <>{mode === "manual" ? <UserRoundPlus size={17} /> : <Upload size={17} />}{mode === "manual" ? "Save business lead" : "Import leads"}</>}</button></div>
        </form>
      </div>
    </main>
  );
}
