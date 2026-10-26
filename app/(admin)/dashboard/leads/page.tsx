"use client";

import { useCallback, useEffect, useState } from "react";
import axios from 'axios'

import {

  Search,

  Users,

  Phone,

  MessageCircle,

  RefreshCw,

  Upload,

  ChevronLeft,

  ChevronRight,

  Filter,

  X,

  Target,

  TrendingUp,

  CalendarClock,

  ArrowUpRight,

  CircleAlert,

  LoaderCircle,

  Pencil,

  Globe,

  Mail,

} from "lucide-react";

type LeadStatus =

  | "new"

  | "contacted"

  | "interested"

  | "follow_up"

  | "converted"

  | "not_interested"

  | "lost";

type LeadPriority = "high" | "medium" | "low";

type InterestLevel = "hot" | "warm" | "cold";

type Lead = {

  id: number;

  businessName: string;

  contactPerson?: string | null;

  phone?: string | null;

  email?: string | null;

  instagram?: string | null;

  serviceNeeded?: string | null;

  source?: string | null;
  status: LeadStatus;

  lastCallResult?: string;

  priority: LeadPriority;

  interestLevel?: InterestLevel;

  campaignId?: number | null;

  createdAt?: string;

  nextFollowUpAt?: string | null;

  lastContactedAt?: string | null;

  address?: string | null;
  city?: string | null;
  activityType?: "follow_up" | "meeting" | null;
  activityNotes?: string | null;
};

type Campaign = {

  id: number;

  name: string;

  topic?: string;

  status?: string;

};

type Pagination = {

  page: number;

  limit: number;

  total: number;

  totalPages: number;

};

const STATUS_STYLES: Record<string, string> = {

  new: "bg-blue-50 text-blue-700 ring-blue-600/10",

  contacted: "bg-violet-50 text-violet-700 ring-violet-600/10",

  interested: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",

  follow_up: "bg-amber-50 text-amber-800 ring-amber-600/10",

  converted: "bg-green-100 text-green-800 ring-green-600/10",

  not_interested: "bg-slate-100 text-slate-600 ring-slate-500/10",

  lost: "bg-red-50 text-red-700 ring-red-600/10",

};

const PRIORITY_STYLES: Record<string, string> = {

  high: "bg-red-50 text-red-700",

  medium: "bg-amber-50 text-amber-800",

  low: "bg-slate-100 text-slate-600",

};

function formatLabel(value?: string | null) {

  if (!value) return "Not set";

  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

}

function getWhatsAppNumber(phone?: string | null): string {

  if (!phone) return "";

  let digits = phone.replace(/\D/g, "");


  if (digits.length === 10) {

    digits = `91${digits}`;

  } else if (digits.length === 11 && digits.startsWith("0")) {

    digits = `91${digits.slice(1)}`;

  }



  return digits.length >= 8 && digits.length <= 15 ? digits : "";

}

function getWhatsAppMessage(lead: Lead): string {

  const businessName = lead.businessName?.trim() || "there";

  return `Hi ${businessName},

Greetings from Zoidics Software Solutions!

We help businesses grow with website development, mobile apps, digital marketing and custom software solutions.

Would you be interested in discussing how we can help your business?

Thank you!`;

}

function toDateTimeLocal(value?: string | null) {

  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 16);

}

async function readApiResponse(

  response: Response,

  fallbackMessage: string,

): Promise<any> {

  const responseText = await response.text();

  if (!responseText.trim()) {

    throw new Error(

      `Empty response from API (HTTP ${response.status} ${response.statusText || ""}).`.trim(),

    );

  }

  let result: any;

  try {

    result = JSON.parse(responseText);

  } catch {

    throw new Error(

      `Invalid JSON from API (HTTP ${response.status}). Check the API route for a server error or non-JSON response.`,

    );

  }

  if (!response.ok || !result?.success) {

    throw new Error(

      result?.message || `${fallbackMessage} (HTTP ${response.status}).`,

    );

  }

  return result;

}

function StatCard({

  title,

  value,

  description,

  icon: Icon,

  accent = "orange",

}: {

  title: string;

  value: number;

  description: string;

  icon: typeof Users;

  accent?: "orange" | "green" | "amber" | "blue";

}) {

  const accents = {

    orange: "bg-orange-50 text-orange-600",

    green: "bg-emerald-50 text-emerald-600",

    amber: "bg-amber-50 text-amber-700",

    blue: "bg-blue-50 text-blue-600",

  };

  return (

    <article className="group min-w-0 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-4 text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">

            {value.toLocaleString("en-IN")}

          </p>

        </div>

        <span

          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}

        >

          <Icon size={21} strokeWidth={1.9} />

        </span>

      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">

        <span className="h-1.5 w-1.5 rounded-full bg-[#ffb646]" />

        <p className="text-xs leading-5 text-slate-500">{description}</p>

      </div>

    </article>

  );

}

export default function LeadsPage() {

  const [leads, setLeads] = useState<Lead[]>([]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [pagination, setPagination] = useState<Pagination>({

    page: 1,

    limit: 10,

    total: 0,

    totalPages: 0,

  });

  const [search, setSearch] = useState("");

  const [campaignId, setCampaignId] = useState("");

  const [status, setStatus] = useState("");

  const [priority, setPriority] = useState("");

  const [loading, setLoading] = useState(true);

  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const [error, setError] = useState("");

  const [campaignError, setCampaignError] = useState("");

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [savingLead, setSavingLead] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");

  const [editStatus, setEditStatus] = useState<LeadStatus>("new");

  const [editPriority, setEditPriority] = useState<LeadPriority>("medium");

  const [editInterest, setEditInterest] = useState<InterestLevel>("warm");
  const [editFollowUp, setEditFollowUp] = useState("");

  const [editCallResult, setEditCallResult] = useState<

    "not_called" | "answered" | "no_answer" | "busy" | "switched_off" | "call_back_later"

  >("not_called");

  const [editActivityType, setEditActivityType] = useState<"follow_up" | "meeting">(

    "follow_up",

  );

  const [editActivityNotes, setEditActivityNotes] = useState("");

 const fetchCampaigns = useCallback(async () => {
  setCampaignsLoading(true);
  setCampaignError("");

  try {
    const response = await axios.get(
      `/api/leads-management/campaigns?_t=${Date.now()}`,
      {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
    );

    const result = response.data;

    if (!result?.success) {
      throw new Error(result?.message || "Unable to load campaigns.");
    }

    setCampaigns(Array.isArray(result.data) ? result.data : []);
  } catch (err) {
    setCampaignError(
      axios.isAxiosError(err)
        ? err.response?.data?.message || err.message || "Unable to load campaigns."
        : err instanceof Error
          ? err.message
          : "Unable to load campaigns.",
    );
  } finally {
    setCampaignsLoading(false);
  }
}, []);

  const fetchLeads = useCallback(

    async (page = 1) => {

      setLoading(true);

      setError("");

      try {

        const params = new URLSearchParams({

          page: String(page),

          limit: "10",

          _t: Date.now().toString(),

        });

        if (search.trim()) params.set("search", search.trim());

        if (campaignId) params.set("campaignId", campaignId);

        if (status) params.set("status", status);

        if (priority) params.set("priority", priority);

       const response = await axios.get(
  `/api/leads-management?${params.toString()}`,
  {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  },
);

const result = response.data;

if (!result?.success) {
  throw new Error(result?.message || "Unable to load leads.");
}

setLeads(Array.isArray(result.data) ? result.data : []);

setPagination(
  result.pagination ?? {
    page,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
);

      } catch (err) {

        setError(err instanceof Error ? err.message : "Something went wrong.");

      } finally {

        setLoading(false);

      }

    },

    [search, campaignId, status, priority],

  );

  useEffect(() => {

    void fetchCampaigns();

  }, [fetchCampaigns]);

  useEffect(() => {

    void fetchLeads(1);

  }, [fetchLeads]);

  const totalInterested = leads.filter(

    (lead) => lead.status === "interested",

  ).length;

  const totalConverted = leads.filter(

    (lead) => lead.status === "converted",

  ).length;

  const totalFollowUps = leads.filter(

    (lead) => lead.status === "follow_up",

  ).length;

  const clearFilters = () => {

    setSearch("");

    setCampaignId("");

    setStatus("");

    setPriority("");

    setMobileFiltersOpen(false);

  };

  const hasFilters = Boolean(search || campaignId || status || priority);

  const openLeadEditor = async (lead: Lead) => {

    

    setSelectedLead(lead);

    setEditStatus(lead.status || "new");

    setEditPriority(lead.priority || "medium");

    setEditInterest(lead.interestLevel || "warm");
    setEditFollowUp(toDateTimeLocal(lead.nextFollowUpAt));

    setEditCallResult(

      (lead.lastCallResult as

        | "not_called"

        | "answered"

        | "no_answer"

        | "busy"

        | "switched_off"

        | "call_back_later") || "not_called",

    );

    setEditActivityType(lead.activityType || "follow_up");

    setEditActivityNotes(lead.activityNotes || "");

    setSaveMessage("");

  

    try {

      const response = await axios.get(
  `/api/leads-management/${lead.id}?_t=${Date.now()}`,
  {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  },
);

const result = response.data;

      const details = result.data ?? result.lead ?? result;

      const activity = result.activity ?? details.activity ?? {};

      const activityType = result.activityType ?? activity.activityType ?? details.activityType;

      const activityNotes = result.activityNotes ?? activity.notes ?? details.activityNotes;

      const scheduledAt = result.scheduledAt ?? activity.scheduledAt ?? details.scheduledAt;

      setEditStatus(details.status || lead.status || "new");

      setEditPriority(details.priority || lead.priority || "medium");

      setEditInterest(details.interestLevel || lead.interestLevel || "warm");
      setEditCallResult(

        (details.lastCallResult as typeof editCallResult) ||

          (lead.lastCallResult as typeof editCallResult) ||

          "not_called",

      );

      setEditActivityType(activityType === "meeting" ? "meeting" : "follow_up");

      setEditActivityNotes(activityNotes ?? "");

      setEditFollowUp(

        toDateTimeLocal(scheduledAt ?? details.nextFollowUpAt ?? lead.nextFollowUpAt),

      );

    } catch {

      

    }

  };

  const saveLeadChanges = async () => {

    if (!selectedLead) return;

    if (editFollowUp) {

      const scheduledDate = new Date(editFollowUp);

      if (Number.isNaN(scheduledDate.getTime())) {

        setSaveMessage("Please choose a valid activity date and time.");

        return;

      }

      if (scheduledDate.getTime() <= Date.now()) {

        setSaveMessage("Please choose a future date and time for the reminder.");

        return;

      }

    }

    setSavingLead(true);

    setSaveMessage("");

    try {

      const response = await axios.patch(
  `/api/leads-management/${selectedLead.id}`,
  {
    status: editStatus,
    priority: editPriority,
    interestLevel: editInterest,
    lastCallResult:
      editCallResult === "not_called" ? null : editCallResult,
    activityType: editActivityType,
    activityNotes: editActivityNotes,
    nextFollowUpAt: editFollowUp
      ? new Date(editFollowUp).toISOString()
      : null,
  },
  {
    headers: {
      "Cache-Control": "no-cache",
    },
  },
);

const result = response.data;

if (!result?.success) {
  throw new Error(result?.message || "Unable to update lead.");
}

setSelectedLead(null);
await fetchLeads(pagination.page);

      await fetchLeads(pagination.page);

    } catch (err) {

      setSaveMessage(err instanceof Error ? err.message : "Update failed.");

    } finally {

      setSavingLead(false);

    }

  };

  const handleImportClick = () => {

    window.location.assign("/dashboard/leads/import");

  };

  return (

    <main className="min-h-screen min-w-0 bg-[#fafafa] px-3 py-5 font-['Sora',sans-serif] sm:px-5 sm:py-6 lg:px-8 lg:py-8">

      <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-7">

        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div className="min-w-0">

            <div className="mb-2 flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-[#ff9f26]" />

              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ed8b16]">

                Zoidics · Sales

              </p>

            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#101010] sm:text-3xl lg:text-[34px]">

              Lead Management

            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">

              Manage campaigns, prospects and follow-ups in one place.

            </p>

          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">

            <button

              type="button"

              onClick={() => {

                void fetchLeads(pagination.page);

                void fetchCampaigns();

              }}

              disabled={loading}

              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:px-4"

            >

              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />

              Refresh

            </button>

            <button

              type="button"

              onClick={handleImportClick}

              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ffb646] px-3 py-2.5 text-sm font-bold text-[#151515] shadow-sm transition hover:bg-[#ffa726] sm:px-4"

            >

              <Upload size={16} />

              Import Excel

            </button>

          </div>

        </header>

        {error && (

          <div

            role="alert"

            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"

          >

            <CircleAlert size={19} className="mt-0.5 shrink-0" />

            <div className="min-w-0">

              <p className="font-semibold">Could not load leads</p>

              <p className="mt-1 break-words">{error}</p>

              <button

                type="button"

                onClick={() => void fetchLeads(pagination.page)}

                className="mt-2 font-bold underline underline-offset-2"

              >

                Try again

              </button>

            </div>

          </div>

        )}

        <section

          aria-label="Lead summary"

          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"

        >

          <StatCard

            title="Total Leads"

            value={pagination.total}

            icon={Users}

            description="Matching current filters"

            accent="orange"

          />

          <StatCard

            title="Interested"

            value={totalInterested}

            icon={Target}

            description="On the current page"

            accent="green"

          />

          <StatCard

            title="Follow-ups"

            value={totalFollowUps}

            icon={CalendarClock}

            description="On the current page"

            accent="amber"

          />

          <StatCard

            title="Converted"

            value={totalConverted}

            icon={TrendingUp}

            description="On the current page"

            accent="blue"

          />

        </section>

        <section className="rounded-2xl border border-black/[0.07] bg-white p-3 shadow-sm sm:p-5">

          <div className="mb-3 flex items-center justify-between gap-3">

            <div className="flex items-center gap-2">

              <Filter size={17} className="text-[#df8919]" />

              <h2 className="text-sm font-bold text-[#171717]">

                Search &amp; Filters

              </h2>

              {hasFilters && (

                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">

                  Active

                </span>

              )}

            </div>

            <button

              type="button"

              onClick={() => setMobileFiltersOpen((open) => !open)}

              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:hidden"

            >

              {mobileFiltersOpen ? "Hide filters" : "Show filters"}

              {mobileFiltersOpen ? <X size={14} /> : <Filter size={14} />}

            </button>

          </div>

          <div

            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${mobileFiltersOpen ? "" : "hidden sm:grid"}`}

          >

            <div className="relative min-w-0">

              <Search

                size={17}

                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

              />

              <input

                type="search"

                value={search}

                onChange={(event) => setSearch(event.target.value)}

                placeholder="Search business, phone, email..."

                aria-label="Search leads"

                className="min-h-12 w-full min-w-0 rounded-xl border border-black/10 bg-white py-3 pl-10 pr-3 text-sm text-[#222] outline-none transition placeholder:text-slate-400 focus:border-[#ffb646] focus:ring-2 focus:ring-[#ffb646]/20"

              />

            </div>

            <select

              value={campaignId}

              onChange={(event) => setCampaignId(event.target.value)}

              aria-label="Filter by campaign"

              className="min-h-12 w-full min-w-0 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#ffb646] focus:ring-2 focus:ring-[#ffb646]/20"

            >

              <option value="">All campaigns</option>

              {campaigns.map((campaign) => (

                <option key={campaign.id} value={campaign.id}>

                  {campaign.name}

                </option>

              ))}

            </select>

            <select

              value={status}

              onChange={(event) => setStatus(event.target.value)}

              aria-label="Filter by lead status"

              className="min-h-12 w-full min-w-0 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#ffb646] focus:ring-2 focus:ring-[#ffb646]/20"

            >

              <option value="">All statuses</option>

              <option value="new">New</option>

              <option value="contacted">Contacted</option>

              <option value="interested">Interested</option>

              <option value="follow_up">Follow-up</option>

              <option value="converted">Converted</option>

              <option value="not_interested">Not interested</option>

              <option value="lost">Lost</option>

            </select>

            <select

              value={priority}

              onChange={(event) => setPriority(event.target.value)}

              aria-label="Filter by priority"

              className="min-h-12 w-full min-w-0 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#ffb646] focus:ring-2 focus:ring-[#ffb646]/20"

            >

              <option value="">All priorities</option>

              <option value="high">High priority</option>

              <option value="medium">Medium priority</option>

              <option value="low">Low priority</option>

            </select>

          </div>

          {hasFilters && (

            <div className="mt-3 flex justify-end">

              <button

                type="button"

                onClick={clearFilters}

                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-orange-50 hover:text-orange-700"

              >

                <X size={14} /> Clear filters

              </button>

            </div>

          )}

          {campaignError && (

            <p className="mt-3 text-xs text-amber-700">

              Campaign list could not be loaded: {campaignError}

            </p>

          )}

          {campaignsLoading && (

            <p className="mt-2 text-xs text-slate-400">Loading campaigns…</p>

          )}

        </section>

        <section className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-3 border-b border-black/[0.06] p-4 sm:flex-row sm:items-center sm:p-5">

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-base font-bold text-[#111111] sm:text-lg">

                  All Leads

                </h2>

                <span className="rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">

                  {pagination.total} records

                </span>

              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">

                View and manage your business prospects.

              </p>

            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">

              <span className="text-xs text-slate-500">

                Page {pagination.page} of {Math.max(1, pagination.totalPages)}

              </span>

              {loading && (

                <LoaderCircle

                  size={17}

                  className="animate-spin text-[#df8919]"

                />

              )}

            </div>

          </div>

          <div className="w-full min-w-0">

            

            <div className="hidden border-b border-black/[0.06] bg-[#faf8f4] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-black/55 xl:grid xl:grid-cols-[minmax(0,1.45fr)_minmax(110px,.9fr)_minmax(130px,1fr)_minmax(80px,.65fr)_minmax(90px,.7fr)_minmax(120px,.95fr)_minmax(190px,1.25fr)] xl:items-center xl:gap-3">

              <span>Business</span>

              <span>Phone</span>

              <span>Campaign</span>

              <span>Status</span>

              <span>Priority</span>

              <span>Next follow-up</span>

              <span>Actions</span>

            </div>

            {loading && leads.length === 0 ? (

              <div className="px-5 py-16 text-center">

                <LoaderCircle

                  size={24}

                  className="mx-auto animate-spin text-[#df8919]"

                />

                <p className="mt-3 text-sm text-slate-500">Loading leads...</p>

              </div>

            ) : leads.length === 0 ? (

              <div className="px-5 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#df8919]">

                  <Users size={25} />

                </div>

                <p className="mt-4 font-bold text-slate-800">

                  {error ? "Unable to display leads" : "No leads found"}

                </p>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500 sm:text-sm">

                  {error

                    ? "Check the API response and try refreshing the page."

                    : hasFilters

                      ? "No leads match these filters. Try clearing your filters."

                      : "Create a campaign and import your Excel lead list to get started."}

                </p>

                {hasFilters && (

                  <button

                    type="button"

                    onClick={clearFilters}

                    className="mt-4 rounded-lg bg-[#ffb646] px-4 py-2 text-xs font-bold text-black hover:bg-[#ffa726]"

                  >

                    Clear filters

                  </button>

                )}

              </div>

            ) : (

              <div className="divide-y divide-black/[0.05]">

                {leads.map((lead) => {

                  const campaign = campaigns.find(

                    (item) => item.id === Number(lead.campaignId),

                  );

                  const whatsappNumber = getWhatsAppNumber(lead.phone);

                  return (

                    <article

                      key={lead.id}

                      className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-4 p-4 transition-colors hover:bg-[#fffaf2] sm:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_minmax(110px,.9fr)_minmax(130px,1fr)_minmax(80px,.65fr)_minmax(90px,.7fr)_minmax(120px,.95fr)_minmax(190px,1.25fr)] xl:items-center xl:gap-3 xl:px-5 xl:py-4"

                    >

                      <div className="min-w-0 sm:col-span-2 xl:col-span-1">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4e2] text-xs font-bold text-[#b66b0c]">

                            {(lead.businessName || "L")

                              .trim()

                              .slice(0, 2)

                              .toUpperCase()}

                          </div>

                          <div className="min-w-0 flex-1">

                            <p

                              className="truncate font-bold text-[#171717]"

                              title={lead.businessName || "Unnamed business"}

                            >

                              {lead.businessName || "Unnamed business"}

                            </p>

                            {lead.contactPerson && (

                              <p

                                className="mt-1 truncate text-xs text-slate-500"

                                title={lead.contactPerson}

                              >

                                {lead.contactPerson}

                              </p>

                            )}

                            {lead.email && (

                              <a

                                href={`mailto:${lead.email}`}

                                className="mt-1 flex min-w-0 items-center gap-1 text-xs text-slate-500 hover:text-orange-700"

                              >

                                <Mail size={12} className="shrink-0" />

                                <span className="truncate">{lead.email}</span>

                              </a>

                            )}

                            {lead.instagram && (

                              <a

                                href={

                                  lead.instagram.startsWith("http")

                                    ? lead.instagram

                                    : `https\\://instagram.com/${lead.instagram.replace("@", "")}`

                                }

                                target="_blank"

                                rel="noopener noreferrer"

                                className="mt-1 inline-flex text-slate-500 hover:text-orange-700"

                                aria-label={`Instagram ${lead.businessName}`}

                              >

                                <Globe size={14} />

                              </a>

                            )}

                          </div>

                        </div>

                      </div>

                      <div className="min-w-0">

                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">

                          Phone

                        </p>

                        {lead.phone ? (

                          <a

                            href={`tel:${lead.phone}`}

                            className="inline-flex max-w-full items-center gap-2 text-sm text-slate-600 transition hover:text-[#d67e0c]"

                          >

                            <Phone size={14} className="shrink-0" />

                            <span className="truncate">{lead.phone}</span>

                          </a>

                        ) : (

                          <span className="text-sm text-slate-400">—</span>

                        )}

                      </div>

                      <div className="min-w-0">

                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">

                          Campaign

                        </p>

                        <p

                          className="truncate text-sm font-medium text-slate-700"

                          title={

                            campaign?.name ||

                            `Campaign #${lead.campaignId ?? "—"}`

                          }

                        >

                          {campaign?.name ||

                            `Campaign #${lead.campaignId ?? "—"}`}

                        </p>

                        {campaign?.topic && (

                          <p

                            className="mt-1 truncate text-xs text-slate-400"

                            title={campaign.topic}

                          >

                            {campaign.topic}

                          </p>

                        )}

                      </div>

                      <div className="min-w-0">

                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">

                          Status

                        </p>

                        <span

                          className={`inline-flex max-w-full whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-bold ring-1 ring-inset sm:text-xs ${STATUS_STYLES[lead.status] || "bg-slate-100 text-slate-600 ring-slate-500/10"}`}

                        >

                          {formatLabel(lead.status)}

                        </span>

                      </div>

                      <div className="min-w-0">

                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">

                          Priority

                        </p>

                        <span

                          className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-bold sm:text-xs ${PRIORITY_STYLES[lead.priority] || PRIORITY_STYLES.medium}`}

                        >

                          <span className="h-1.5 w-1.5 rounded-full bg-current" />

                          {formatLabel(lead.priority)}

                        </span>

                      </div>

                      <div className="min-w-0">

                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">

                          Next follow-up

                        </p>

                        <p className="text-xs leading-5 text-slate-600">

                          {lead.nextFollowUpAt

                            ? new Date(lead.nextFollowUpAt).toLocaleString(

                                "en-IN",

                                { dateStyle: "medium", timeStyle: "short" },

                              )

                            : "Not scheduled"}

                        </p>

                      </div>

                      <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-black/[0.05] pt-3 sm:col-span-2 xl:col-span-1 xl:flex-nowrap xl:border-0 xl:pt-0">

                        <a

                          href={
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          getWhatsAppMessage(lead)
        )}`
      : undefined
  }

                          target="_blank"

                          rel="noopener noreferrer"

                          aria-label={`WhatsApp ${lead.businessName}`}

                          title={

                            whatsappNumber

                              ? "Open WhatsApp message"

                              : "Valid phone number unavailable"

                          }

                          onClick={(event) => {

                            if (!lead.phone) event.preventDefault();

                          }}

                          aria-disabled={!whatsappNumber}

                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${whatsappNumber ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"}`}

                        >

                          <MessageCircle size={17} />

                        </a>

                        <a

                          href={

                            whatsappNumber

                              ? `tel:${(lead.phone || "").replace(/[^\d+]/g, "")}`

                              : undefined

                          }

                          aria-label={`Call ${lead.businessName}`}

                          title={

                            whatsappNumber

                              ? "Call business"

                              : "Valid phone number unavailable"

                          }

                          onClick={(event) => {

                            if (!whatsappNumber) event.preventDefault();

                          }}

                          aria-disabled={!whatsappNumber}

                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${whatsappNumber ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"}`}

                        >

                          <Phone size={16} />

                        </a>

                        <button

                          type="button"

                          onClick={() => openLeadEditor(lead)}

                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#ffb646] hover:bg-orange-50 sm:flex-none"

                        >

                          <Pencil size={13} /> Manage lead

                        </button>

                      </div>

                    </article>

                  );

                })}

              </div>

            )}

          </div>

          <footer className="flex flex-col gap-3 border-t border-black/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

            <p className="text-xs leading-5 text-slate-500">

              Showing{" "}

              <span className="font-bold text-slate-800">

                {leads.length

                  ? (pagination.page - 1) * pagination.limit + 1

                  : 0}

                –{(pagination.page - 1) * pagination.limit + leads.length}

              </span>{" "}

              of{" "}

              <span className="font-bold text-slate-800">

                {pagination.total}

              </span>{" "}

              leads

            </p>

            
<div className="flex items-center justify-center gap-2 flex-wrap">
  <button
    type="button"
    disabled={loading || pagination.page <= 1}
    onClick={() => void fetchLeads(pagination.page - 1)}
    className="inline-flex h-10 items-center gap-1 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-40"
  >
    <ChevronLeft size={16} />
    Previous
  </button>

  {Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1
  )
    .filter((page) => {
      const current = pagination.page;
      const total = pagination.totalPages;

      return (
        page === 1 ||
        page === total ||
        Math.abs(page - current) <= 1
      );
    })
    .reduce<(number | "...")[]>((pages, page, index, array) => {
      if (index > 0 && page - array[index - 1] > 1) {
        pages.push("...");
      }

      pages.push(page);
      return pages;
    }, [])
    .map((page, index) =>
      page === "..." ? (
        <span
          key={`dots-${index}`}
          className="px-1 text-slate-400"
        >
          …
        </span>
      ) : (
        <button
          key={page}
          type="button"
          disabled={loading}
          onClick={() => void fetchLeads(page)}
          className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition ${
            pagination.page === page
              ? "border-[#ffb646] bg-[#ffb646] text-black"
              : "border-black/10 bg-white text-slate-700 hover:bg-orange-50"
          }`}
        >
          {page}
        </button>
      )
    )}

  <button
    type="button"
    disabled={
      loading ||
      pagination.page >= pagination.totalPages ||
      pagination.totalPages === 0
    }
    onClick={() => void fetchLeads(pagination.page + 1)}
    className="inline-flex h-10 items-center gap-1 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-40"
  >
    Next
    <ChevronRight size={16} />
  </button>
</div>


          </footer>

        </section>

        <div className="flex flex-col gap-2 px-1 pb-2 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">

          <p>Zoidics Software Solutions · Lead Management</p>

          <p className="inline-flex items-center gap-1.5">

            <ArrowUpRight size={13} /> Campaign-wise lead tracking

          </p>

        </div>

      </div>

      {selectedLead && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"

          onClick={(event) => {

            if (event.target === event.currentTarget && !savingLead)

              setSelectedLead(null);

          }}

        >

          <section

            role="dialog"

            aria-modal="true"

            aria-labelledby="lead-editor-title"

            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"

          >

            <div className="flex items-start justify-between gap-3">

              <div>

                <p className="text-xs font-bold uppercase tracking-widest text-orange-600">

                  Zoidics · Sales

                </p>

                <h2

                  id="lead-editor-title"

                  className="mt-2 text-xl font-bold text-slate-900"

                >

                  Manage Lead

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {selectedLead.businessName}

                </p>

                <p className="mt-1 text-sm text-slate-500">

                  {selectedLead.phone || "No phone number"}

                </p>

                {(selectedLead.address || selectedLead.city) && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Globe size={16} className="text-orange-600" />
                      Business address
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {[selectedLead.address, selectedLead.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}

              </div>

              <button

                type="button"

                disabled={savingLead}

                onClick={() => setSelectedLead(null)}

                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"

                aria-label="Close lead editor"

              >

                <X size={20} />

              </button>

            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

              <label className="text-sm font-semibold text-slate-700">

                Lead status

                <select

                  value={editStatus}

                  onChange={(event) =>

                    setEditStatus(event.target.value as LeadStatus)

                  }

                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-orange-400"

                >

                  <option value="new">New</option>

                  <option value="contacted">Contacted</option>

                  <option value="interested">Interested</option>

                  <option value="follow_up">Follow-up</option>

                  <option value="converted">Converted</option>

                  <option value="not_interested">Not interested</option>

                  <option value="lost">Lost</option>

                </select>

              </label>

              <label className="text-sm font-semibold text-slate-700">

                Priority

                <select

                  value={editPriority}

                  onChange={(event) =>

                    setEditPriority(event.target.value as LeadPriority)

                  }

                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-orange-400"

                >

                  <option value="high">High</option>

                  <option value="medium">Medium</option>

                  <option value="low">Low</option>

                </select>

              </label>

              <label className="text-sm font-semibold text-slate-700">

                Interest level

                <select

                  value={editInterest}

                  onChange={(event) =>

                    setEditInterest(event.target.value as InterestLevel)

                  }

                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-orange-400"

                >

                  <option value="hot">Hot</option>

                  <option value="warm">Warm</option>

                  <option value="cold">Cold</option>

                </select>

              </label>

              <label className="text-sm font-semibold text-slate-700">

                Call outcome

                <select

                  value={editCallResult}

                  onChange={(event) =>

                    setEditCallResult(event.target.value as typeof editCallResult)

                  }

                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-orange-400"

                >

                  <option value="not_called">Not called / no call log</option>

                  <option value="answered">Answered</option>

                  <option value="no_answer">No answer</option>

                  <option value="busy">Busy</option>

                  <option value="switched_off">Switched off</option>

                  <option value="call_back_later">Call back later</option>

                </select>

              </label>

              <div className="sm:col-span-2 mt-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                  Next activity
                </p>
                <p className="mt-1 text-xs font-normal text-slate-500">
                  Schedule a follow-up or meeting and add notes for that activity.
                </p>
              </div>

              <label className="text-sm font-semibold text-slate-700">

                Activity type

                <select

                  value={editActivityType}

                  onChange={(event) =>

                    setEditActivityType(event.target.value as "follow_up" | "meeting")

                  }

                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-orange-400"

                >

                  <option value="follow_up">Follow-up</option>

                  <option value="meeting">Meeting</option>

                </select>

              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">

                Activity date &amp; time

                <input

                  type="datetime-local"

                  value={editFollowUp}

                  onChange={(event) => setEditFollowUp(event.target.value)}

                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-orange-400"

                />

                <span className="mt-1 block text-xs font-normal text-slate-500">

                  Choose a date and time to schedule a reminder. Leave empty to clear the schedule.

                </span>

              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">

                Activity notes

                <textarea

                  rows={2}

                  maxLength={5000}

                  value={editActivityNotes}

                  onChange={(event) => setEditActivityNotes(event.target.value)}

                  placeholder="What should be discussed during the follow-up or meeting?"

                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-orange-400"

                />

              </label>

            </div>

            

            {saveMessage && (

              <p role="alert" className="mt-4 text-sm text-red-600">

                {saveMessage}

              </p>

            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button

                type="button"

                disabled={savingLead}

                onClick={() => setSelectedLead(null)}

                className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"

              >

                Cancel

              </button>

              <button

                type="button"

                disabled={savingLead}

                onClick={() => void saveLeadChanges()}

                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ffb646] px-5 text-sm font-bold text-black hover:bg-[#ffa726] disabled:opacity-50"

              >

                {savingLead && (

                  <LoaderCircle size={16} className="animate-spin" />

                )}

                {savingLead ? "Saving..." : "Save changes"}

              </button>

            </div>

          </section>

        </div>

      )}

    </main>

  );

}
