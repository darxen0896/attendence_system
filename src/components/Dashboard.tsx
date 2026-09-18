"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { StatsCards } from "./StatsCards";
import { SearchAndControls } from "./SearchAndControls";
import { MemberCard } from "./MemberCard";
import { AttendanceTable } from "./AttendanceTable";
import { AddMemberModal } from "./AddMemberModal";
import { EditMemberModal } from "./EditMemberModal";
import { MemberDetailsModal } from "./MemberDetailsModal";
import { ReportsPanel } from "./ReportsPanel";
import { ToastContainer } from "./Toast";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { Users, Sparkles, Plus } from "lucide-react";
import type { Member } from "@/types";

export function Dashboard() {
  const { members, isLoading, addToast, refreshMembers, refreshStats } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "attendance">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleViewDetails = (member: Member) => {
    setSelectedMember(member);
    setDetailsModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setDetailsModalOpen(false);
    setEditModalOpen(true);
  };

  const handleDelete = async (member: Member) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${member.fullName}"? This will also remove their attendance history.`
      )
    ) {
      try {
        const res = await fetch(`/api/members/${member.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          addToast("Member deleted successfully", "success");
          setDetailsModalOpen(false);
          await refreshMembers();
          await refreshStats();
        } else {
          addToast("Failed to delete member", "error");
        }
      } catch {
        addToast("Failed to delete member", "error");
      }
    }
  };

  const handleAddSampleData = async () => {
    setIsSeeding(true);
    const sampleMembers = [
      { fullName: "Parth Patel", phoneNumber: "+91 98765 43210", age: 22, notes: "Seva Team - Audio/Visual" },
      { fullName: "Harshil Shah", phoneNumber: "+91 98234 56789", age: 24, notes: "Karyakar - Zone 1" },
      { fullName: "Devam Sharma", phoneNumber: "+91 98987 65432", age: 20, notes: "Satsang Reader" },
      { fullName: "Ketan Trivedi", phoneNumber: "+91 97123 45678", age: 26, notes: "Karyakar - Zone 2" },
      { fullName: "Aakash Mehta", phoneNumber: "+91 99090 12345", age: 23, notes: "Prasad Coordinator" },
      { fullName: "Bhavik Joshi", phoneNumber: "+91 98456 78901", age: 21, notes: "Kirtan Team" },
    ];

    try {
      for (const s of sampleMembers) {
        await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        });
      }
      addToast("Added 6 sample members successfully!", "success");
      await refreshMembers();
      await refreshStats();
    } catch {
      addToast("Failed to add sample members", "error");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col">
      {/* Top Navbar */}
      <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left Fixed Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenReports={() => {
            setReportsOpen(true);
            setSidebarOpen(false);
          }}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
        />

        {/* Center Main Content (Switches between Dashboard and Attendance Table) */}
        <main className="flex-1 w-full lg:pl-64 min-w-0 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {activeTab === "attendance" ? (
              <AttendanceTable onViewMemberDetails={handleViewDetails} />
            ) : (
              <>
                {/* Top Stat Summary Cards */}
                <StatsCards />

                {/* Search Filter, Sort, Reset & Add Member Bar */}
                <SearchAndControls
                  onAddMember={() => setAddModalOpen(true)}
                  onResetAttendance={() => {}}
                />

                {/* Members Section */}
                {isLoading ? (
                  <LoadingSkeleton />
                ) : members.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-8 sm:p-14 text-center shadow-xs">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/40">
                      <Users size={32} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-2">
                      No Members in Database
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                      Start taking attendance by registering your first youth member or load sample records to test the dashboard immediately.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <Plus size={16} />
                        <span>Add Member</span>
                      </button>
                      <button
                        onClick={handleAddSampleData}
                        disabled={isSeeding}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles size={16} className="text-amber-500" />
                        <span>{isSeeding ? "Adding..." : "Load Sample Members"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>Members Directory</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {members.length}
                        </span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                      {members.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          onViewDetails={handleViewDetails}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Interactive Modals */}
      <AddMemberModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
      <EditMemberModal
        member={selectedMember}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
      <MemberDetailsModal
        member={selectedMember}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {reportsOpen && <ReportsPanel onClose={() => setReportsOpen(false)} />}
      <ToastContainer />
    </div>
  );
}
