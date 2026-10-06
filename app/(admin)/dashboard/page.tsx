"use client";

import { useEffect, useState } from "react";

import {
  FolderKanban,
  BriefcaseBusiness,
  MessageSquare,
  FileText,
  ArrowUpRight,
  RefreshCw,
  Bot,
} from "lucide-react";

import StatCard from "@/components/admin/StatCard";

/* =========================================================
   TYPES
========================================================= */

type RecentProject = {
  id: number;
  title: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
};

type DashboardStats = {
  /* Projects */
  projects: number;
  publishedProjects: number;

  /* Services */
  services: number;
  activeServices: number;

  /* Contact Us */
  clientEnquiries: number;
  newClientEnquiries: number;

  /* ChatBot */
  chatbotLeads: number;
  activeChatbotLeads: number;

  /* Blog */
  blogs: number;
  publishedBlogs: number;
};

type DashboardResponse = {
  success: boolean;

  stats: DashboardStats;

  recentProjects: RecentProject[];
};

/* =========================================================
   DEFAULT STATS
========================================================= */

const defaultStats: DashboardStats = {
  projects: 0,
  publishedProjects: 0,

  services: 0,
  activeServices: 0,

  clientEnquiries: 0,
  newClientEnquiries: 0,

  chatbotLeads: 0,
  activeChatbotLeads: 0,

  blogs: 0,
  publishedBlogs: 0,
};

/* =========================================================
   DASHBOARD PAGE
========================================================= */

export default function DashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats>(defaultStats);

  const [recentProjects, setRecentProjects] =
    useState<RecentProject[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [greeting, setGreeting] =
    useState("Good morning");

  /* =======================================================
     GREETING
  ======================================================= */

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good evening");
    } else {
      setGreeting("Good night");
    }
  }, []);

  /* =======================================================
     FETCH DASHBOARD
  ======================================================= */

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result: DashboardResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          "Failed to fetch dashboard information"
        );
      }

      setStats(result.stats);

      setRecentProjects(
        result.recentProjects || []
      );
    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error
      );

      setError(
        "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL FETCH
  ======================================================= */

  useEffect(() => {
    fetchDashboard();
  }, []);

  /* =======================================================
     FORMAT NUMBER
  ======================================================= */

  const formatNumber = (value: number) => {
    return String(value).padStart(2, "0");
  };

  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (date: string) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="mx-auto max-w-[1500px] font-['Sora',sans-serif]">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-10">

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
          Overview
        </p>

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

          {/* Heading */}

          <div>

            <h2 className="text-3xl font-bold tracking-tight text-[#080808] md:text-4xl">
              {greeting}, Ajith.
            </h2>

            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-black/50">
              Manage your freelance portfolio,
              projects, services, content and client
              messages from one place.
            </p>

          </div>

          {/* Refresh */}

          <button
            type="button"
            onClick={fetchDashboard}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-black/60 transition hover:border-black/20 hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-50"
          >

            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh

          </button>

        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">

          <p className="text-sm font-medium text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchDashboard}
            className="shrink-0 text-xs font-bold text-red-600 underline"
          >
            Try again
          </button>

        </div>
      )}

      {/* ===================================================
          STAT CARDS
      =================================================== */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">

        {/* =================================================
            PROJECTS
        ================================================= */}

        <StatCard
          title="Projects"
          value={
            loading
              ? "..."
              : formatNumber(stats.projects)
          }
          description={`${stats.publishedProjects} published`}
          icon={FolderKanban}
        />

        {/* =================================================
            SERVICES
        ================================================= */}

        <StatCard
          title="Services"
          value={
            loading
              ? "..."
              : formatNumber(stats.services)
          }
          description={`${stats.activeServices} active`}
          icon={BriefcaseBusiness}
        />

        {/* =================================================
            CLIENT ENQUIRIES
        ================================================= */}

        <StatCard
          title="Client Enquiries"
          value={
            loading
              ? "..."
              : formatNumber(
                  stats.clientEnquiries
                )
          }
          description={`${stats.newClientEnquiries} new enquiries`}
          icon={MessageSquare}
        />

        {/* =================================================
            CHATBOT LEADS
        ================================================= */}

        <StatCard
          title="ChatBot Leads"
          value={
            loading
              ? "..."
              : formatNumber(
                  stats.chatbotLeads
                )
          }
          description={`${stats.activeChatbotLeads} active leads`}
          icon={Bot}
        />

        {/* =================================================
            BLOG POSTS
        ================================================= */}

        <StatCard
          title="Blog Posts"
          value={
            loading
              ? "..."
              : formatNumber(stats.blogs)
          }
          description={`${stats.publishedBlogs} published`}
          icon={FileText}
        />

      </div>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">

        {/* =================================================
            RECENT PROJECTS
        ================================================= */}

        <section className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">

          {/* Header */}

          <div className="flex items-center justify-between border-b border-black/5 bg-[#f9f9f9]/50 px-6 py-5">

            <div>

              <h3 className="font-bold text-[#080808]">
                Recent Projects
              </h3>

              <p className="mt-1 text-xs font-medium text-black/40">
                Latest portfolio updates
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigateTo("/admin/projects")
              }
              className="flex items-center gap-1 text-xs font-bold text-[#ff8a24] transition hover:text-[#ffb646]"
            >

              View all

              <ArrowUpRight className="h-3.5 w-3.5" />

            </button>

          </div>

          {/* Project List */}

          <div className="divide-y divide-black/5">

            {/* Loading */}

            {loading ? (

              <div>

                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between gap-5 px-6 py-5"
                  >

                    <div className="space-y-2">

                      <div className="h-4 w-40 animate-pulse rounded bg-black/5" />

                      <div className="h-3 w-28 animate-pulse rounded bg-black/5" />

                    </div>

                    <div className="h-6 w-20 animate-pulse rounded-full bg-black/5" />

                  </div>
                ))}

              </div>

            ) : recentProjects.length === 0 ? (

              /* Empty */

              <div className="px-6 py-14 text-center">

                <FolderKanban className="mx-auto h-9 w-9 text-black/20" />

                <p className="mt-4 text-sm font-bold text-black/50">
                  No projects found
                </p>

                <p className="mt-1 text-xs text-black/30">
                  Add your first portfolio project.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigateTo(
                      "/admin/projects"
                    )
                  }
                  className="mt-5 rounded-lg bg-[#080808] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#ff8a24]"
                >
                  Add Project
                </button>

              </div>

            ) : (

              /* Projects */

              recentProjects.map(
                (project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between gap-5 px-6 py-5 transition hover:bg-black/[0.02]"
                  >

                    {/* Project Info */}

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold text-[#080808]">
                        {project.title}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2">

                        <p className="truncate text-xs font-medium text-black/40">
                          {project.category}
                        </p>

                        <span className="text-black/20">
                          •
                        </span>

                        <p className="text-[10px] font-medium text-black/30">
                          {formatDate(
                            project.createdAt
                          )}
                        </p>

                      </div>

                    </div>

                    {/* Status */}

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        project.isPublished
                          ? "border-green-100 bg-green-50 text-green-600"
                          : "border-[#ffb646]/20 bg-[#ffb646]/10 text-[#ff8a24]"
                      }`}
                    >
                      {project.isPublished
                        ? "Published"
                        : "Draft"}
                    </span>

                  </div>
                )
              )

            )}

          </div>

        </section>


      </div>

      {/* ===================================================
          LEAD OVERVIEW
      =================================================== */}

      <div className="mt-6 grid gap-5 md:grid-cols-2">

        {/* Client Enquiries */}

        <button
          type="button"
          onClick={() =>
            navigateTo("/admin/enquiries")
          }
          className="group rounded-[1.5rem] border border-black/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md"
        >

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f5f5]">
              <MessageSquare className="h-5 w-5 text-[#777]" />
            </div>

            <ArrowUpRight className="h-4 w-4 text-black/20 transition group-hover:text-[#ff8a24]" />

          </div>

          <p className="mt-5 text-sm font-bold text-[#080808]">
            Client Enquiries
          </p>

          <p className="mt-1 text-xs leading-relaxed text-black/40">
            Contact Us messages submitted by
            potential clients.
          </p>

          <div className="mt-5 flex items-end gap-2">

            <span className="text-3xl font-bold text-[#080808]">
              {loading
                ? "..."
                : stats.clientEnquiries}
            </span>

            <span className="mb-1 text-xs font-medium text-black/40">
              total enquiries
            </span>

          </div>

          {stats.newClientEnquiries > 0 && (
            <p className="mt-3 text-xs font-bold text-[#ff8a24]">
              {stats.newClientEnquiries} new
            </p>
          )}

        </button>

        {/* ChatBot Leads */}

        <button
          type="button"
          onClick={() =>
            navigateTo(
              "/admin/chatbot-leads"
            )
          }
          className="group rounded-[1.5rem] border border-black/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md"
        >

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f5f5]">
              <Bot className="h-5 w-5 text-[#777]" />
            </div>

            <ArrowUpRight className="h-4 w-4 text-black/20 transition group-hover:text-[#ff8a24]" />

          </div>

          <p className="mt-5 text-sm font-bold text-[#080808]">
            ChatBot Leads
          </p>

          <p className="mt-1 text-xs leading-relaxed text-black/40">
            Leads collected through your website
            chatbot.
          </p>

          <div className="mt-5 flex items-end gap-2">

            <span className="text-3xl font-bold text-[#080808]">
              {loading
                ? "..."
                : stats.chatbotLeads}
            </span>

            <span className="mb-1 text-xs font-medium text-black/40">
              total leads
            </span>

          </div>

          {stats.activeChatbotLeads > 0 && (
            <p className="mt-3 text-xs font-bold text-[#ff8a24]">
              {stats.activeChatbotLeads} active
            </p>
          )}

        </button>

      </div>

    </div>
  );
}