"use client";

import axios from "axios";
import {
  Search,
  Mail,
  Phone,
  CalendarDays,
  Eye,
  X,
  User,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

type Contact = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  isDeal: boolean;
  createdAt: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [showDetails, setShowDetails] = useState(false);

  /* =====================================================
     FETCH CONTACTS
  ===================================================== */

  const fetchContacts = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await axios.get("/api/contact", {
        withCredentials: true,
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const data = response.data;

      if (response.data && data.success) {
        const newContacts: Contact[] = data.contacts || [];

        setContacts(newContacts);

        /*
         * If drawer is open,
         * keep selected contact updated.
         */
        setSelectedContact((current) => {
          if (!current) {
            return null;
          }

          return (
            newContacts.find(
              (item: Contact) => item.id === current.id
            ) || current
          );
        });
      } else {
        console.error(data.message || "Failed to load contacts");
      }
    } catch (error) {
      console.error("Failed to load contacts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* =====================================================
     INITIAL LOAD + AUTO REFRESH
  ===================================================== */

  useEffect(() => {
    // Load immediately
    fetchContacts();

    // Automatically check every 5 seconds
    const interval = setInterval(() => {
      fetchContacts(true);
    }, 5000);

    // Clear interval when page unmounts
    return () => {
      clearInterval(interval);
    };
  }, [fetchContacts]);

  /* =====================================================
     MANUAL REFRESH
  ===================================================== */

  const handleRefresh = () => {
    fetchContacts(true);
  };

  /* =====================================================
     UPDATE CONTACT
     STATUS + DEAL
  ===================================================== */

  const updateContact = async (
    contactId: number,
    updates: {
      status?: string;
      isDeal?: boolean;
    }
  ) => {
    try {
      const response = await axios.put(
        "/api/contact",
        {
          id: contactId,
          ...updates,
        },
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || "Failed to update contact");
      }

      const updatedContact: Contact = data.contact;

      // Update table data
      setContacts((currentContacts) =>
        currentContacts.map((contact) =>
          contact.id === contactId
            ? updatedContact
            : contact
        )
      );

      // Update drawer data
      setSelectedContact((current) =>
        current && current.id === contactId
          ? updatedContact
          : current
      );
    } catch (error) {
      console.error("Failed to update contact:", error);

      // Reload server data if update failed
      fetchContacts(true);
    }
  };

  /* =====================================================
     OPEN DETAILS
  ===================================================== */

  const openDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetails(true);
  };

  /* =====================================================
     CLOSE DETAILS
  ===================================================== */

  const closeDetails = () => {
    setShowDetails(false);

    setTimeout(() => {
      setSelectedContact(null);
    }, 200);
  };

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredContacts = contacts.filter((contact) => {
    const value = search.toLowerCase();

    return (
      contact.name.toLowerCase().includes(value) ||
      contact.email.toLowerCase().includes(value) ||
      contact.subject.toLowerCase().includes(value) ||
      contact.message.toLowerCase().includes(value)
    );
  });

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <main className="min-h-screen bg-[#fafafa] px-5 py-8 md:px-8 font-['Sora',sans-serif]">
        <div className="mx-auto max-w-[1500px]">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                Contact
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#080808] md:text-4xl">
                Contact Us
              </h1>

              <p className="mt-2 text-sm font-medium text-black/50">
                Manage enquiries submitted from your portfolio website.
              </p>
            </div>

            {/* HEADER ACTIONS */}

            <div className="flex items-center gap-4">
              {/* REFRESH */}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-white text-black/40 shadow-sm transition-all hover:border-[#ffb646] hover:text-[#ff8a24] disabled:cursor-not-allowed disabled:opacity-50"
                title="Refresh enquiries"
              >
                <RefreshCw
                  size={18}
                  strokeWidth={2.5}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>

              {/* TOTAL */}

              <div className="hidden rounded-xl border border-black/10 bg-white px-5 py-3 shadow-sm sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                  Total enquiries
                </p>

                <p className="mt-1 text-xl font-bold text-[#080808]">
                  {contacts.length}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="mb-6 rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex h-12 items-center gap-3 rounded-xl border border-black/10 bg-[#fafafa] px-4 transition-all focus-within:border-[#ffb646] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ffb646]/10">
              <Search size={18} className="shrink-0 text-black/40" />

              <input
                type="text"
                placeholder="Search enquiries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 w-full bg-transparent text-sm font-semibold text-[#080808] outline-none placeholder:text-black/30 placeholder:font-medium"
              />
            </div>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
            {/* TABLE HEADER */}

            <div
              className="
                hidden
                grid-cols-[minmax(180px,1.4fr)_minmax(150px,1.3fr)_minmax(200px,1.7fr)_90px_120px_40px]
                gap-4
                border-b
                border-black/5
                bg-[#f9f9f9]/50
                px-6
                py-4
                text-[11px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-black/40
                md:grid
              "
            >
              <span>Contact</span>
              <span>Subject</span>
              <span>Message</span>
              <span>Status</span>
              <span>Date</span>
              <span />
            </div>

            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (
              <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm font-medium text-black/40">
                <RefreshCw
                  size={20}
                  className="animate-spin text-[#ff8a24]"
                />
                Loading enquiries...
              </div>
            ) : filteredContacts.length === 0 ? (
              /* EMPTY */

              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#ffb646]/10">
                  <Mail size={24} className="text-[#ff8a24]" />
                </div>

                <p className="mt-4 text-base font-bold text-[#080808]">
                  No enquiries found
                </p>

                <p className="mt-1.5 text-sm font-medium text-black/45">
                  Contact submissions will appear here.
                </p>
              </div>
            ) : (
              /* CONTACT ROWS */

              <div className="divide-y divide-black/5">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => openDetails(contact)}
                    className="cursor-pointer px-5 py-5 transition-colors hover:bg-black/[0.01] sm:px-6"
                  >
                    {/* =================================================
                        DESKTOP ROW
                    ================================================= */}

                    <div
                      className="
                        hidden
                        min-w-0
                        grid-cols-[minmax(180px,1.4fr)_minmax(150px,1.3fr)_minmax(200px,1.7fr)_90px_120px_40px]
                        items-center
                        gap-4
                        md:grid
                      "
                    >
                      {/* CONTACT */}

                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffb646]/10 text-[11px] font-bold text-[#ff8a24]">
                            {contact.name.slice(0, 2).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[#080808]">
                              {contact.name}
                            </p>

                            <p className="mt-1 truncate text-xs font-medium text-black/45">
                              {contact.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* SUBJECT */}

                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-medium text-black/70"
                          title={contact.subject}
                        >
                          {contact.subject}
                        </p>
                      </div>

                      {/* MESSAGE */}

                      <div className="min-w-0">
                        <p
                          className="truncate text-xs font-medium text-black/50"
                          title={contact.message}
                        >
                          {contact.message}
                        </p>
                      </div>

                      {/* STATUS */}

                      <div className="min-w-0">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                            contact.status === "new"
                              ? "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                              : contact.status === "replied"
                                ? "bg-green-50 text-green-600 border-green-100"
                                : "bg-black/5 text-black/50 border-black/10"
                          }`}
                        >
                          {contact.status}
                        </span>
                      </div>

                      {/* DATE */}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-black/50">
                          <CalendarDays size={14} className="shrink-0" />
                          <span>{formatDate(contact.createdAt)}</span>
                        </div>
                      </div>

                      {/* VIEW */}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetails(contact);
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black/40 transition-colors hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                        title="View enquiry"
                      >
                        <Eye size={18} strokeWidth={2} />
                      </button>
                    </div>

                    {/* =================================================
                        MOBILE ROW
                    ================================================= */}

                    <div className="flex min-w-0 items-center justify-between gap-4 md:hidden">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffb646]/10 text-xs font-bold text-[#ff8a24]">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#080808]">
                            {contact.name}
                          </p>

                          <p className="truncate text-xs font-medium text-black/50">
                            {contact.subject}
                          </p>

                          <span
                            className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              contact.status === "new"
                                ? "bg-[#ffb646]/10 text-[#ff8a24] border-[#ffb646]/20"
                                : contact.status === "replied"
                                  ? "bg-green-50 text-green-600 border-green-100"
                                  : "bg-black/5 text-black/50 border-black/10"
                            }`}
                          >
                            {contact.status}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetails(contact);
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/10 text-black/40 hover:border-[#ffb646] hover:bg-[#ffb646]/10 hover:text-[#ff8a24]"
                      >
                        <Eye size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          {!loading && filteredContacts.length > 0 && (
            <div className="mt-5 flex items-center justify-between px-2 text-xs font-medium text-black/45">
              <span>Showing {filteredContacts.length} enquiries</span>

              <span className="font-bold text-[#080808]">
                {contacts.filter((item) => item.status === "new").length} new
              </span>
            </div>
          )}
        </div>
      </main>

      {/* =====================================================
         DETAIL DRAWER
      ===================================================== */}

      {showDetails && selectedContact && (
        <div
          className="fixed inset-0 z-[100] bg-[#080808]/60 backdrop-blur-sm font-['Sora',sans-serif]"
          onClick={closeDetails}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full max-w-[550px] overflow-y-auto bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.1)] sm:rounded-l-[2.5rem]"
          >
            {/* DRAWER HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/90 px-6 py-5 backdrop-blur-md sm:px-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Enquiry
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#080808]">
                  Contact Details
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-black/40 transition hover:bg-[#080808] hover:text-white"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* DRAWER CONTENT */}

            <div className="space-y-8 px-6 py-8 sm:px-8">
              {/* PROFILE */}

              <div className="rounded-[1.5rem] border border-black/5 bg-[#fafafa] p-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffb646]/10 text-base font-bold text-[#ff8a24]">
                    {selectedContact.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-bold text-[#080808]">
                      {selectedContact.name}
                    </h3>

                    <p className="mt-1.5 truncate text-xs font-medium text-black/45">
                      Contact ID #{selectedContact.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTACT INFORMATION */}

              <section>
                <div className="mb-4 flex items-center gap-2.5">
                  <User
                    size={18}
                    className="text-[#ff8a24]"
                    strokeWidth={2.5}
                  />

                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#080808]/50">
                    Contact Information
                  </h3>
                </div>

                <div className="divide-y divide-black/5 rounded-[1.25rem] border border-black/10 overflow-hidden shadow-sm">
                  <div className="flex gap-4 p-5 bg-white">
                    <Mail
                      size={18}
                      className="mt-0.5 shrink-0 text-black/40"
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                        Email
                      </p>

                      <p className="mt-1.5 break-all text-sm font-semibold text-[#080808]">
                        {selectedContact.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-5 bg-white">
                    <Phone
                      size={18}
                      className="mt-0.5 shrink-0 text-black/40"
                    />

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                        Phone
                      </p>

                      <p className="mt-1.5 text-sm font-semibold text-[#080808]">
                        {selectedContact.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ENQUIRY */}

              <section>
                <div className="mb-4 flex items-center gap-2.5">
                  <MessageSquare
                    size={18}
                    className="text-[#ff8a24]"
                    strokeWidth={2.5}
                  />

                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#080808]/50">
                    Enquiry
                  </h3>
                </div>

                <div className="rounded-[1.25rem] border border-black/10 overflow-hidden shadow-sm bg-white">
                  <div className="border-b border-black/5 p-5 bg-[#fafafa]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Subject
                    </p>

                    <p className="mt-1.5 break-words text-sm font-bold text-[#080808]">
                      {selectedContact.subject}
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                      Message
                    </p>

                    <p className="mt-2.5 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-[#080808]/80">
                      {selectedContact.message}
                    </p>
                  </div>
                </div>
              </section>

              {/* STATUS + DATE */}

              <section className="grid grid-cols-2 gap-4">
                {/* STATUS */}

                <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                    Status
                  </p>

                  <select
                    value={selectedContact.status}
                    onChange={(event) => {
                      const newStatus = event.target.value;

                      setSelectedContact((current) => {
                        if (!current) {
                          return current;
                        }

                        return {
                          ...current,
                          status: newStatus,
                        };
                      });

                      updateContact(selectedContact.id, {
                        status: newStatus,
                      });
                    }}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-2.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:ring-4 focus:ring-[#ffb646]/10"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* DEAL */}

                <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                    Deal
                  </p>

                  <select
                    value={selectedContact.isDeal ? "yes" : "no"}
                    onChange={(event) => {
                      const newIsDeal = event.target.value === "yes";

                      setSelectedContact((current) => {
                        if (!current) {
                          return current;
                        }

                        return {
                          ...current,
                          isDeal: newIsDeal,
                        };
                      });

                      updateContact(selectedContact.id, {
                        isDeal: newIsDeal,
                      });
                    }}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-2.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#080808] outline-none transition-all focus:border-[#ffb646] focus:ring-4 focus:ring-[#ffb646]/10"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {/* SUBMITTED */}

                <div className="rounded-[1.25rem] border border-black/5 bg-[#fafafa] p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                    Submitted
                  </p>

                  <div className="mt-2.5 flex items-center gap-2 text-sm font-bold text-[#080808]">
                    <CalendarDays size={16} className="text-black/40" />

                    {formatDate(selectedContact.createdAt)}
                  </div>
                </div>
              </section>

              {/* CLOSE BUTTON */}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="w-full rounded-xl bg-[#080808] py-4 text-sm font-bold text-white transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-lg hover:shadow-[#ffb646]/20 active:scale-[0.98]"
                >
                  Close Details
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
