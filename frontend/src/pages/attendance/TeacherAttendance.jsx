import { useEffect, useState, useMemo } from "react";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { toast } from "sonner";
import {
  LogIn,
  LogOut,
  Trash2,
  Edit,
  Search,
  CalendarX,
  Download,
  CheckCheck,
  Users,
  BarChart3,
  Clock,
  Settings2,
  Info,
} from "lucide-react";
import {
  getAllTeacherAttendance,
  markTeacherAttendance,
  teacherCheckOut,
  deleteTeacherAttendance,
  updateTeacherAttendance,
  markBulkTeacherAttendance,
} from "@/services/attendanceService";
import { getUsers } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import StatCard from "@/components/shared/StatCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import TermSessionFilter, { CURRENT_TERM, CURRENT_SESSION } from "@/components/shared/TermSessionFilter";
import { cn } from "@/lib/utils";
import api from "@/utils/api";

const statusVariants = { present: "success", absent: "destructive", leave: "warning" };
const statusDots = { present: "bg-success", absent: "bg-destructive", leave: "bg-warning" };

const TeacherAttendance = () => {
  const { user } = useAuth();
  const todayISO = format(new Date(), "yyyy-MM-dd");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // Attendance mode
  const [attendanceMode, setAttendanceMode] = useState("self");
  const [modeLoading, setModeLoading] = useState(true);

  // Admin Edit Modal
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editStatus, setEditStatus] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Attendance Modal
  const [bulkModal, setBulkModal] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [bulkData, setBulkData] = useState({});
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkDate, setBulkDate] = useState(todayISO);

  const isTeacher = user?.role === "teacher";
  const isAdmin = ["super-admin", "campus-admin"].includes(user?.role);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchTeacher, setSearchTeacher] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [filterTerm, setFilterTerm] = useState(CURRENT_TERM);
  const [filterSession, setFilterSession] = useState(CURRENT_SESSION);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTerm !== "all") params.term = filterTerm;
      if (filterSession !== "all") params.academicSession = filterSession;
      const res = await getAllTeacherAttendance(params);
      setData(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      if (err.response?.status !== 404) toast.error("Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };

  // Fetch campus attendance mode
  const fetchMode = async () => {
    setModeLoading(true);
    try {
      const res = await api.get("/campuses/settings");
      setAttendanceMode(res.data?.attendanceMode || "self");
    } catch {
      // Silently default to self
    } finally {
      setModeLoading(false);
    }
  };

  const handleModeChange = async (mode) => {
    try {
      await api.put("/campuses/settings", { attendanceMode: mode });
      setAttendanceMode(mode);
      toast.success(`Attendance mode changed to: ${mode === "self" ? "Teacher Self-Mark" : "Admin Managed"}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update attendance mode");
    }
  };

  useEffect(() => { fetchData(); }, [filterTerm, filterSession]);
  useEffect(() => { if (user?.role) fetchMode(); }, [user]);

  // Quick date presets
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    switch (preset) {
      case "today":
        setFilterFrom(todayISO);
        setFilterTo(todayISO);
        break;
      case "week":
        setFilterFrom(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        setFilterTo(todayISO);
        break;
      case "month":
        setFilterFrom(format(startOfMonth(today), "yyyy-MM-dd"));
        setFilterTo(todayISO);
        break;
      case "30days":
        setFilterFrom(format(subDays(today, 30), "yyyy-MM-dd"));
        setFilterTo(todayISO);
        break;
      default:
        setFilterFrom("");
        setFilterTo("");
    }
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterFrom("");
    setFilterTo("");
    setSearchTeacher("");
    setDatePreset("all");
    setFilterTerm(CURRENT_TERM);
    setFilterSession(CURRENT_SESSION);
  };

  // Filtered data
  const filtered = useMemo(() => data.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterFrom) {
      if (new Date(d.date) < new Date(filterFrom)) return false;
    }
    if (filterTo) {
      const toDate = new Date(filterTo);
      toDate.setHours(23, 59, 59);
      if (new Date(d.date) > toDate) return false;
    }
    if (isAdmin && searchTeacher) {
      const name = d.teacherDetails?.name?.toLowerCase() || "";
      if (!name.includes(searchTeacher.toLowerCase())) return false;
    }
    return true;
  }), [data, filterStatus, filterFrom, filterTo, searchTeacher, isAdmin]);

  // Summary stats
  const stats = useMemo(() => {
    const s = { present: 0, absent: 0, leave: 0, total: filtered.length };
    filtered.forEach((d) => { if (s[d.status] !== undefined) s[d.status]++; });
    return s;
  }, [filtered]);

  // Today's record for teacher check-in
  const todayRecord = data.find(
    (d) => format(new Date(d.date), "yyyy-MM-dd") === todayISO &&
      (d.teacherDetails?._id === user._id || !d.teacherDetails)
  );

  // Check-in / Check-out
  const handleCheckIn = async () => {
    try {
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const term = month >= 6 ? "FirstTerm" : "SecondTerm";
      const academicSession = month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      await markTeacherAttendance({ teacher: user._id, status: "present", campus: user.campus || "temp", term, academicSession });
      toast.success("Checked in successfully!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      await teacherCheckOut({ teacher: user._id });
      toast.success("Checked out successfully!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Check-out failed");
    }
  };

  // Edit
  const submitEdit = async () => {
    try {
      await updateTeacherAttendance(editTarget._id, { status: editStatus });
      toast.success("Record updated");
      setEditModal(false);
      fetchData();
    } catch {
      toast.error("Failed to update record");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTeacherAttendance(deleteTarget);
      toast.success("Record deleted");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  // Bulk modal
  const openBulkModal = async () => {
    try {
      const res = await getUsers({ role: "teacher", limit: 100 });
      const list = res.users || [];
      setTeachers(list);
      const initial = {};
      list.forEach((t) => { initial[t._id] = "present"; });
      setBulkData(initial);
      setBulkModal(true);
    } catch {
      toast.error("Failed to fetch teachers");
    }
  };

  const handleBulkSubmit = async () => {
    setSavingBulk(true);
    try {
      const records = Object.keys(bulkData).map((id) => ({ teacherId: id, status: bulkData[id], date: bulkDate }));
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const term = month >= 6 ? "FirstTerm" : "SecondTerm";
      const academicSession = month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      await markBulkTeacherAttendance({ records, term, academicSession });
      toast.success("Bulk attendance marked successfully");
      setBulkModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark bulk attendance");
    } finally {
      setSavingBulk(false);
    }
  };

  // CSV export
  const handleCSVDownload = () => {
    try {
      const headers = ["Date", "Teacher", "Check In", "Check Out", "Status"];
      const rows = filtered.map((d) => [
        format(new Date(d.date), "yyyy-MM-dd"),
        d.teacherDetails?.name || "N/A",
        d.checkIn ? format(new Date(d.checkIn), "HH:mm") : "—",
        d.checkOut ? format(new Date(d.checkOut), "HH:mm") : "—",
        d.status,
      ]);
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `teacher_attendance_${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("CSV download failed");
    }
  };

  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      meta: { label: "Date" },
      cell: (info) => format(new Date(info.getValue()), "dd MMM yyyy"),
    },
    {
      header: "Teacher",
      accessorKey: "teacherDetails.name",
      meta: { label: "Teacher" },
      cell: (info) => <span className="font-medium text-foreground">{info.getValue() || "Self"}</span>,
    },
    {
      header: "Check In",
      accessorKey: "checkIn",
      meta: { label: "Check In" },
      cell: (info) => (info.getValue() ? format(new Date(info.getValue()), "hh:mm a") : "—"),
    },
    {
      header: "Check Out",
      accessorKey: "checkOut",
      meta: { label: "Check Out" },
      cell: (info) => (info.getValue() ? format(new Date(info.getValue()), "hh:mm a") : "—"),
    },
    {
      header: "Status",
      accessorKey: "status",
      meta: { label: "Status" },
      cell: (info) => {
        const val = info.getValue();
        return (
          <Badge variant={statusVariants[val] || "secondary"} className="gap-1.5">
            <span className={`size-1.5 rounded-full ${statusDots[val] || "bg-muted-foreground"}`} aria-hidden="true" />
            {val?.charAt(0).toUpperCase() + val?.slice(1)}
          </Badge>
        );
      },
    },
  ];

  if (isAdmin) {
    columns.push({
      header: "Actions",
      id: "actions",
      enableSorting: false,
      meta: { label: "Actions" },
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            aria-label={`Edit record for ${row.original.teacherDetails?.name || "teacher"}`}
            onClick={() => { setEditTarget(row.original); setEditStatus(row.original.status); setEditModal(true); }}
          >
            <Edit size={14} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            aria-label={`Delete record for ${row.original.teacherDetails?.name || "teacher"}`}
            onClick={() => setDeleteTarget(row.original._id)}
          >
            <Trash2 size={14} aria-hidden="true" />
          </Button>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader
        eyebrow="Academics"
        title="Teacher Attendance"
        subtitle={isAdmin ? "Manage and review all teacher attendance records" : "Mark your daily attendance"}
        actions={
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openBulkModal}>
                <CheckCheck size={14} className="mr-1.5" aria-hidden="true" />
                Bulk Attendance
              </Button>
              <Button variant="outline" size="sm" onClick={handleCSVDownload} disabled={filtered.length === 0}>
                <Download size={14} className="mr-1.5" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
          )
        }
      />

      {/* Attendance Mode Settings (campus-admin only) */}
      {isAdmin && user?.role === "campus-admin" && (
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings2 className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Attendance Mode</h3>
                <p className="text-xs text-muted-foreground">
                  Choose how teacher attendance is managed for your campus.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={attendanceMode === "self" ? "default" : "outline"}
                size="sm"
                disabled={modeLoading}
                onClick={() => handleModeChange("self")}
              >
                Teacher Self-Mark
              </Button>
              <Button
                variant={attendanceMode === "admin" ? "default" : "outline"}
                size="sm"
                disabled={modeLoading}
                onClick={() => handleModeChange("admin")}
              >
                Admin Managed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher check-in card — only shown in self mode */}
      {isTeacher && attendanceMode === "self" && (
        <Card className="border-primary/20 bg-primary/[0.04]">
          <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Daily Check-in</h3>
              <p className="text-sm text-muted-foreground">
                {todayRecord
                  ? `You checked in at ${format(new Date(todayRecord.checkIn), "hh:mm a")}${todayRecord.checkOut ? ` and checked out at ${format(new Date(todayRecord.checkOut), "hh:mm a")}` : ""}`
                  : "You have not checked in today."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCheckIn} disabled={!!todayRecord}>
                <LogIn size={16} className="mr-1.5" aria-hidden="true" />
                Check In
              </Button>
              <Button onClick={handleCheckOut} disabled={!todayRecord || !!todayRecord.checkOut} variant="outline">
                <LogOut size={16} className="mr-1.5" aria-hidden="true" />
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher notice when admin-managed mode */}
      {isTeacher && attendanceMode === "admin" && (
        <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/5 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">Admin-Managed Attendance</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your campus administrator manages teacher attendance directly. Self check-in is disabled.
              Contact your campus admin if you need to report attendance.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Total Records" value={stats.total} tone="primary" />
        <StatCard icon={CheckCheck} label="Present" value={stats.present} tone="success" />
        <StatCard icon={CalendarX} label="Absent" value={stats.absent} tone="danger" />
        <StatCard icon={Clock} label="Leave" value={stats.leave} tone="warning" />
      </div>

      {/* Filters */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Time" },
                { key: "today", label: "Today" },
                { key: "week", label: "This Week" },
                { key: "month", label: "This Month" },
                { key: "30days", label: "Last 30 Days" },
              ].map((p) => (
                <Button
                  key={p.key}
                  variant={datePreset === p.key ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applyPreset(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Detailed filters */}
            <div className="flex flex-wrap gap-3 items-end">
              <TermSessionFilter
                term={filterTerm}
                session={filterSession}
                onTermChange={(v) => { setFilterTerm(v); setDatePreset("all"); }}
                onSessionChange={(v) => { setFilterSession(v); setDatePreset("all"); }}
              />
              <div className="space-y-1.5">
                <Label htmlFor="tatt-status" className="text-xs font-semibold text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setDatePreset("all"); }}>
                  <SelectTrigger id="tatt-status" className="w-32 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tatt-from" className="text-xs font-semibold text-muted-foreground">From</Label>
                <Input id="tatt-from" type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setDatePreset("all"); }} className="h-9 w-36" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tatt-to" className="text-xs font-semibold text-muted-foreground">To</Label>
                <Input id="tatt-to" type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setDatePreset("all"); }} className="h-9 w-36" />
              </div>
              {isAdmin && (
                <div className="space-y-1.5">
                  <Label htmlFor="tatt-search" className="text-xs font-semibold text-muted-foreground">Teacher</Label>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="tatt-search"
                      placeholder="Search name…"
                      aria-label="Search teacher name"
                      value={searchTeacher}
                      onChange={(e) => setSearchTeacher(e.target.value)}
                      className="h-9 w-40 pl-8"
                    />
                  </div>
                </div>
              )}
              {(filterStatus !== "all" || filterFrom || filterTo || searchTeacher || filterTerm !== "all" || filterSession !== "all") && (
                <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader className="border-b border-border/60 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 size={18} className="text-primary" aria-hidden="true" />
            Attendance Records
            <Badge variant="secondary" className="text-xs font-semibold">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="No attendance records yet"
              description={isAdmin ? "Records will appear once teachers start checking in." : "Check in to create your first attendance record."}
            />
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              hideColumnsOnMobile={["checkOut"]}
              emptyState={{
                icon: CalendarX,
                title: "No matching records",
                description: "Try adjusting your filters to see more results.",
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Admin Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editTarget && (
              <p className="text-sm text-muted-foreground">
                Editing record for <strong className="text-foreground">{editTarget.teacherDetails?.name || "Teacher"}</strong> on {format(new Date(editTarget.date), "dd MMM yyyy")}.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-att-status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="edit-att-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button onClick={submitEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Attendance Modal */}
      <Dialog open={bulkModal} onOpenChange={setBulkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Teacher Attendance</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="bulk-date" className="text-xs font-semibold text-muted-foreground">Date</Label>
              <Input id="bulk-date" type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="h-9 w-40" />
            </div>
            <Button variant="outline" size="sm" className="mt-5 h-8 text-xs" onClick={() => {
              const next = {};
              teachers.forEach((t) => { next[t._id] = "present"; });
              setBulkData(next);
            }}>
              <CheckCheck size={12} className="mr-1" aria-hidden="true" /> All Present
            </Button>
            <Button variant="outline" size="sm" className="mt-5 h-8 text-xs text-destructive hover:text-destructive" onClick={() => {
              const next = {};
              teachers.forEach((t) => { next[t._id] = "absent"; });
              setBulkData(next);
            }}>
              All Absent
            </Button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-2 mt-3 space-y-2">
            {teachers.map((teacher) => (
              <div key={teacher._id} className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/40">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{teacher.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{teacher.email}</span>
                </div>
                <Select
                  value={bulkData[teacher._id] || "present"}
                  onValueChange={(val) => setBulkData((prev) => ({ ...prev, [teacher._id]: val }))}
                >
                  <SelectTrigger className="h-8 w-[120px] shrink-0" aria-label={`Status for ${teacher.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            {teachers.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">No teachers found.</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setBulkModal(false)}>Cancel</Button>
            <Button onClick={handleBulkSubmit} disabled={savingBulk || teachers.length === 0}>
              {savingBulk ? "Saving…" : "Save Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Attendance Record"
        description="This will permanently remove the attendance record. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
};

export default TeacherAttendance;
