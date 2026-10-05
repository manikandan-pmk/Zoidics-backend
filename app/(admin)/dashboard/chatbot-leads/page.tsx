"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search,
  RefreshCw,
  MessageSquare,
  Mail,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  DollarSign,
  ChevronRight,
  X,
  CheckCircle2,
  CircleDot,
  Users,
  MessagesSquare,
  Bot,
} from "lucide-react";

type LeadStatus = "active" | "submitted" | "closed";

type ChatLead = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  service: string | null;
  requirement: string | null;
  timeline: string | null;
  budget: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: number;
  sessionId: number;
  role: "user" | "model";
  message: string;
  createdAt: string;
};

type LeadDetails = ChatLead & {
  messages: ChatMessage[];
};

const statusConfig: Record<
  LeadStatus,
  {
    label: string;
    className: string;
    icon: React.ReactNode;
  }
> = {
  active: {
    label: "Active",
    className: "bg-blue-50 text-blue-600 border-blue-100",
    icon: <CircleDot size={13} />,
  },
  submitted: {
    label: "Submitted",
    className: "bg-green-50 text-green-600 border-green-100",
    icon: <CheckCircle2 size={13} />,
  },
  closed: {
    label: "Closed",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <CheckCircle2 size={13} />,
  },
};

function formatDate(value: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string | null) {
  if (!name) return "V";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ChatbotLeadsPage() {
  const [leads, setLeads] = useState<ChatLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");

  const [selectedLead, setSelectedLead] = useState<LeadDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [error, setError] = useState("");

  const fetchLeads = async () => {
    try {
      setError("");
      const response = await axios.get("/api/chat", {
        withCredentials: true,
      });
      console.log("Chatbot leads response:", response.data);
      setLeads(response.data?.chats ?? []);
    } catch (error) {
      console.error("Chatbot leads error:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || "Failed to load chatbot leads");
      } else {
        setError("Unable to load chatbot leads");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const refreshLeads = async () => {
    setRefreshing(true);
    await fetchLeads();
  };

  const openLead = async (leadId: number) => {
    try {
      setDetailsLoading(true);
      setSelectedLead(null);
      const response = await axios.get(`/api/chat/${leadId}`, {
        withCredentials: true,
      });
      console.log("Chat details response:", response.data);
      setSelectedLead(response.data?.chat ?? null);
    } catch (error) {
      console.error("Conversation error:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || "Unable to load conversation");
      } else {
        alert("Unable to load conversation");
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return (
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.service?.toLowerCase().includes(query) ||
        lead.requirement?.toLowerCase().includes(query)
      );
    });
  }, [leads, search, statusFilter]);

  const totalLeads = leads.length;

  const activeLeads = leads.filter(
    (lead) => lead.status === "active",
  ).length;

  const submittedLeads = leads.filter(
    (lead) => lead.status === "submitted",
  ).length;

  return (
    <div className="min-h-full bg-white">
      {/* ========================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================= */}

      <div className="border-b border-black/[0.06] bg-white px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f59e0b]">
                Management
              </span>
            </div>

            <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-[#111827]">
              ChatBot Leads
            </h1>

            <p className="mt-2 text-[14px] leading-6 text-gray-500">
              View chatbot enquiries, customer details and complete
              conversations.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshLeads}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONTENT */}
      {/* ========================================================= */}

      <div className="px-6 py-7 lg:px-10">
        {/* ======================================================= */}
        {/* STAT CARDS */}
        {/* ======================================================= */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={<Users size={20} />}
            label="Total Leads"
            value={totalLeads}
            description="All chatbot conversations"
          />

          <StatCard
            icon={<MessageSquare size={20} />}
            label="Active"
            value={activeLeads}
            description="Currently active conversations"
          />

          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Submitted"
            value={submittedLeads}
            description="Confirmed enquiries"
          />
        </div>

        {/* ======================================================= */}
        {/* SEARCH + FILTER */}
        {/* ======================================================= */}

        <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone or service..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <FilterButton
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </FilterButton>

            <FilterButton
              active={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </FilterButton>

            <FilterButton
              active={statusFilter === "submitted"}
              onClick={() => setStatusFilter("submitted")}
            >
              Submitted
            </FilterButton>
          </div>
        </div>

        {/* ======================================================= */}
        {/* ERROR */}
        {/* ======================================================= */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ======================================================= */}
        {/* TABLE */}
        {/* ======================================================= */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold text-gray-900">
                Recent ChatBot Leads
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {filteredLeads.length} conversation
                {filteredLeads.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="hidden items-center gap-2 text-xs text-gray-400 sm:flex">
              <MessagesSquare size={15} />
              Chat conversations
            </div>
          </div>

          {loading ? (
            <LoadingTable />
          ) : filteredLeads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Visitor
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Service
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Requirement
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Date
                    </th>

                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="group border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60"
                    >
                      {/* Visitor */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-sm font-semibold text-[#ea580c]">
                            {getInitials(lead.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {lead.name || "Visitor"}
                            </p>

                            <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500">
                              {lead.email || "No email provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Service */}

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600">
                          {lead.service || "Not specified"}
                        </span>
                      </td>

                      {/* Requirement */}

                      <td className="max-w-[300px] px-5 py-4">
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {lead.requirement || "No requirement provided"}
                        </p>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <StatusBadge status={lead.status} />
                      </td>

                      {/* Date */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CalendarDays size={14} />
                          {formatDate(lead.createdAt)}
                        </div>
                      </td>

                      {/* Action */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openLead(lead.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                        >
                          View
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DETAILS DRAWER */}
      {/* ========================================================= */}

      {(selectedLead || detailsLoading) && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => {
              if (!detailsLoading) {
                setSelectedLead(null);
              }
            }}
          />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col bg-white shadow-2xl">
            {detailsLoading ? (
              <DetailsLoading />
            ) : selectedLead ? (
              <>
                {/* Drawer Header */}

                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff7ed] text-sm font-semibold text-[#ea580c]">
                      {getInitials(selectedLead.name)}
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedLead.name || "Visitor"}
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Chat Session #{selectedLead.id}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X size={19} />
                  </button>
                </div>

                {/* Lead Information */}

                <div className="overflow-y-auto px-6 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Lead Information
                    </h3>

                    <StatusBadge status={selectedLead.status} />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoItem
                      icon={<Mail size={15} />}
                      label="Email"
                      value={selectedLead.email || "Not provided"}
                    />

                    <InfoItem
                      icon={<Phone size={15} />}
                      label="Phone"
                      value={selectedLead.phone || "Not provided"}
                    />

                    <InfoItem
                      icon={<BriefcaseBusiness size={15} />}
                      label="Service"
                      value={selectedLead.service || "Not specified"}
                    />

                    <InfoItem
                      icon={<Clock3 size={15} />}
                      label="Timeline"
                      value={selectedLead.timeline || "Not provided"}
                    />

                    <InfoItem
                      icon={<DollarSign size={15} />}
                      label="Budget"
                      value={selectedLead.budget || "Not provided"}
                    />

                    <InfoItem
                      icon={<CalendarDays size={15} />}
                      label="Created"
                      value={formatDateTime(selectedLead.createdAt)}
                    />
                  </div>

                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Requirement
                    </p>

                    <p className="text-sm leading-6 text-gray-700">
                      {selectedLead.requirement ||
                        "No requirement provided"}
                    </p>
                  </div>
                </div>

                {/* Conversation History Section (Clean & Isolated Scroll Layout) */}

                <div className="flex flex-col border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between bg-white px-6 py-3.5 border-b border-gray-100 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <MessagesSquare size={16} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Conversation History
                      </h3>
                    </div>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {selectedLead.messages?.length || 0} messages
                    </span>
                  </div>

                  {/* Message Container with a fixed maximum height and clean internal scrollbar */}
                  <div className="h-[320px] overflow-y-auto px-6 py-4 space-y-4">
                    {selectedLead.messages?.length ? (
                      selectedLead.messages.map((message) => {
                        const isUser = message.role === "user";

                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2.5 ${
                              isUser ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {/* Avatar */}
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-xs ${
                                isUser
                                  ? "bg-gradient-to-tr from-gray-800 to-gray-900 text-white"
                                  : "bg-white text-amber-600 border border-amber-100"
                              }`}
                            >
                              {isUser ? (
                                getInitials(selectedLead.name)
                              ) : (
                                <Bot size={15} />
                              )}
                            </div>

                            {/* Message Body */}
                            <div
                              className={`flex max-w-[75%] flex-col ${
                                isUser ? "items-end" : "items-start"
                              }`}
                            >
                              <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] font-medium text-gray-400">
                                <span>{isUser ? (selectedLead.name || "Visitor") : "Zoidics AI"}</span>
                              </div>

                              <div
                                className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                                  isUser
                                    ? "rounded-br-xs bg-[#111827] text-white"
                                    : "rounded-bl-xs border border-gray-200/80 bg-white text-gray-800"
                                }`}
                              >
                                {message.message}
                              </div>

                              <span className="mt-1 px-1 text-[10px] text-gray-400">
                                {formatDateTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <MessageSquare
                            size={28}
                            className="mx-auto text-gray-300"
                          />
                          <p className="mt-2 text-sm text-gray-500">
                            No messages found in this conversation.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================= */
/* STAT CARD */
/* ============================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          {icon}
        </div>

        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Overview
        </span>
      </div>

      <p className="mt-5 text-sm text-gray-500">{label}</p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
        {value.toString().padStart(2, "0")}
      </p>

      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}

/* ============================================================= */
/* FILTER BUTTON */
/* ============================================================= */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-lg border px-4 text-xs font-semibold transition ${
        active
          ? "border-[#f59e0b] bg-[#fff7ed] text-[#ea580c]"
          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================= */
/* STATUS BADGE */
/* ============================================================= */

function StatusBadge({ status }: { status: LeadStatus }) {
  const config = statusConfig[status] || statusConfig.active;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

/* ============================================================= */
/* INFO ITEM */
/* ============================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {icon}
        {label}
      </div>

      <p className="mt-1.5 break-words text-sm font-medium text-gray-700">
        {value}
      </p>
    </div>
  );
}

/* ============================================================= */
/* LOADING TABLE */
/* ============================================================= */

function LoadingTable() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-5 px-5 py-5"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />

          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="hidden h-7 w-28 animate-pulse rounded bg-gray-100 md:block" />

          <div className="hidden h-7 w-20 animate-pulse rounded bg-gray-100 md:block" />

          <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================= */
/* EMPTY STATE */
/* ============================================================= */

function EmptyState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
        <MessageSquare size={25} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        No chatbot leads found
      </h3>

      <p className="mt-1 max-w-sm text-center text-sm leading-6 text-gray-500">
        Chatbot conversations will appear here once visitors start
        interacting with your Zoidics AI assistant.
      </p>
    </div>
  );
}

/* ============================================================= */
/* DETAILS LOADING */
/* ============================================================= */

function DetailsLoading() {
  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />

          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100" />
      </div>

      <div className="space-y-4 p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>

        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />

        <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    </>
  );
}