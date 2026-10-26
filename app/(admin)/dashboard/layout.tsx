"use client"

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="lg:pl-[250px]">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="min-h-[calc(100vh-80px)] p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}