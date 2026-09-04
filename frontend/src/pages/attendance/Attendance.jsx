import api from "@/utils/api";
import { CURRENT_TERM, CURRENT_SESSION } from "@/components/shared/TermSessionFilter";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Users,
  Save,
  Search,
  CheckCheck,
  XCircle,
  Clock,
  ClipboardList,
  Eye,
  PenLine,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

const statusConfig = {
  present: { label: "Present", variant: "success", bg: "bg-success/10 text-success ring-success/20" },
  absent: { label: "Absent", variant: "destructive", bg: "bg-destructive/10 text-destructive ring-destructive/20" },
  late: { label: "Late", variant: "warning", bg: "bg-warning/10 text-warning ring-warning/20" },
};

const Attendance = () => {
  const todayISO = new Date().toISOString().split("T")[0];

  const [mode, setMode] = useState("mark");
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [term, setTerm] = useState(CURRENT_TERM);
  const [academicSession, setAcademicSession] = useState(CURRENT_SESSION);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  // History state
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState(todayISO);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, total: records.length };
    records.forEach((r) => { if (c[r.status] !== undefined) c[r.status]++; });
    return c;
  }, [records]);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) => r.name.toLowerCase().includes(q) || String(r.rollNumber).toLowerCase().includes(q)
    );
  }, [records, search]);

  const filteredHistory = useMemo(() => {
    if (historyStatusFilter === "all") return historyRecords;
    return historyRecords.filter((r) => r.status === historyStatusFilter);
  }, [historyRecords, historyStatusFilter]);

  // 1. Fetch classes
  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes", { params: { limit: 200 } });
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : res.classes || [];
      setClasses(list);
      if (list.length > 0 && !selectedClassId) setSelectedClassId(list[0]._id);
    } catch { /* silent */ }
  };

  // 2. Fetch students for selected class + date
  const fetchStudents = async () => {
    if (!selectedClassId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get("/attendance/students", {
        params: { classId: selectedClassId, from: selectedDate, to: selectedDate, term, academicSession },
      });

      if (res.records && res.records.length > 0) {
        setRecords(
          res.records.map((r) => ({
            _id: r._id,
            studentId: r.student || r.studentDetails?._id,
            name: r.studentDetails?.name || "N/A",
            rollNumber: r.enrollmentDetails?.rollNumber || r.rollNumber || "N/A",
            status: r.status || "absent",
          }))
        );
        setAlreadyMarked(true);
      } else {
        const enrollRes = await api.get("/enrollments/student-enrollments", {
          params: { classId: selectedClassId },
        });
        const students = enrollRes.data || [];
        setRecords(
          students.map((s) => ({
            _id: s._id || s.student?._id,
            studentId: s.student?._id || s.student,
            name: s.student?.name || "N/A",
            rollNumber: s.rollNumber || "N/A",
            status: "absent",
          }))
        );
        setAlreadyMarked(false);
      }
    } catch {
      toast.error("Failed to load students");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch history
  const fetchHistory = async () => {
    if (!selectedClassId) return;
    setHistoryLoading(true);
    try {
      const params = { classId: selectedClassId, term, academicSession };
      if (historyFrom) params.from = historyFrom;
      if (historyTo) params.to = historyTo;
      const res = await api.get("/attendance/students", { params });
      setHistoryRecords(res.records || []);
    } catch {
      setHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { if (mode === "mark") fetchStudents(); }, [selectedClassId, selectedDate, term, academicSession, mode]);
  useEffect(() => { if (mode === "history") fetchHistory(); }, [selectedClassId, historyFrom, historyTo, term, academicSession, mode]);

  const setAllStatus = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const updateStatus = (idx, status) => {
    setRecords((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], status };
      return next;
    });
  };

  const handleSave = async () => {
    setConfirmSaveOpen(false);
    if (!term || !academicSession) { toast.error("Please select term and session"); return; }
    if (!selectedClassId) { toast.error("Please select a class"); return; }
    if (!records.length) { toast.error("No students to mark"); return; }

    setSaving(true);
    try {
      const payload = {
        classId: selectedClassId,
        term,
        academicSession,
        date: selectedDate,
        records: records.map(({ rollNumber, status }) => ({ rollNumber, status })),
      };
      await api.post("/attendance/students/markAttendance", payload);
      toast.success(alreadyMarked ? "Attendance updated successfully" : "Attendance marked successfully");
      setAlreadyMarked(true);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const historyColumns = [
    {
      header: "Date",
      accessorKey: "date",
      meta: { label: "Date" },
      cell: (info) => format(new Date(info.getValue()), "dd MMM yyyy"),
    },
    {
      header: "Student",
      accessorKey: "studentDetails.name",
      meta: { label: "Student" },
      cell: (info) => (
        <div>
          <p className="text-sm font-medium text-foreground">{info.getValue() || "N/A"}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.enrollmentDetails?.rollNumber || ""}</p>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      meta: { label: "Status" },
      cell: (info) => {
        const cfg = statusConfig[info.getValue()] || statusConfig.absent;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
  ];

  const classLabel = classes.find((c) => c._id === selectedClassId);
  const classDisplayName = classLabel
    ? `Grade ${classLabel.grade}${classLabel.section ? ` - ${classLabel.section}` : ""}`
    : "";

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader
        eyebrow="Academics"
        title="Student Attendance"
        subtitle={mode === "mark" ? "Mark daily attendance with one click" : "Review past attendance records"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={mode === "mark" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("mark")}
            >
              <PenLine size={14} className="mr-1.5" aria-hidden="true" />
              Mark
            </Button>
            <Button
              variant={mode === "history" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("history")}
            >
              <Eye size={14} className="mr-1.5" aria-hidden="true" />
              History
            </Button>
          </div>
        }
      />

      {/* Shared filters */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="att-class" className="text-xs font-semibold text-muted-foreground">Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="att-class" className="h-9"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      Grade {c.grade}{c.section ? ` - ${c.section}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="att-term" className="text-xs font-semibold text-muted-foreground">Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger id="att-term" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FirstTerm">First Term</SelectItem>
                  <SelectItem value="SecondTerm">Second Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="att-session" className="text-xs font-semibold text-muted-foreground">Session</Label>
              <Select value={academicSession} onValueChange={setAcademicSession}>
                <SelectTrigger id="att-session" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024–2025</SelectItem>
                  <SelectItem value="2025-2026">2025–2026</SelectItem>
                  <SelectItem value="2026-2027">2026–2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === "mark" && (
              <div className="space-y-1.5">
                <Label htmlFor="att-date" className="text-xs font-semibold text-muted-foreground">Date</Label>
                <Input id="att-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9" />
              </div>
            )}
            {mode === "history" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="hist-from" className="text-xs font-semibold text-muted-foreground">From</Label>
                  <Input id="hist-from" type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hist-to" className="text-xs font-semibold text-muted-foreground">To</Label>
                  <Input id="hist-to" type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} className="h-9" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════ MARK MODE ═══════ */}
      {mode === "mark" && (
        <>
          {loading ? (
            <Card>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-12 w-full" />
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </CardContent>
            </Card>
          ) : records.length > 0 ? (
            <Card className="gap-0 overflow-hidden py-0">
              {/* Toolbar */}
              <CardHeader className="border-b border-border/60 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users size={18} className="text-primary" aria-hidden="true" />
                    {classDisplayName}
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {records.length} student{records.length !== 1 ? "s" : ""}
                    </Badge>
                    {alreadyMarked && (
                      <Badge variant="info" className="gap-1 text-xs">
                        <CheckCheck size={12} aria-hidden="true" /> Already marked
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <Input
                        placeholder="Search student…"
                        aria-label="Search students"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 w-40 pl-8 text-xs"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-semibold" onClick={() => setAllStatus("present")}>
                      <CheckCheck size={14} aria-hidden="true" /> All Present
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-semibold text-destructive hover:text-destructive" onClick={() => setAllStatus("absent")}>
                      <XCircle size={14} aria-hidden="true" /> All Absent
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Summary strip */}
              <div className="flex flex-wrap items-center gap-4 border-b border-border/60 bg-muted/20 px-6 py-2.5 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-success">
                  <span className="size-2 rounded-full bg-success" aria-hidden="true" /> {counts.present} Present
                </span>
                <span className="flex items-center gap-1.5 text-destructive">
                  <span className="size-2 rounded-full bg-destructive" aria-hidden="true" /> {counts.absent} Absent
                </span>
                <span className="flex items-center gap-1.5 text-warning">
                  <span className="size-2 rounded-full bg-warning" aria-hidden="true" /> {counts.late} Late
                </span>
                {search && (
                  <span className="ml-auto text-muted-foreground">
                    Showing {filtered.length} of {records.length}
                  </span>
                )}
              </div>

              {/* Student roster */}
              <CardContent className="p-0">
                <div className="max-h-[65vh] divide-y divide-border/40 overflow-y-auto">
                  {filtered.map((rec, idx) => {
                    const realIdx = records.findIndex((r) => r._id === rec._id);
                    return (
                      <div
                        key={rec._id}
                        className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-muted/30 sm:grid sm:grid-cols-[2rem_5rem_1fr_auto] sm:gap-4"
                      >
                        <span className="hidden text-xs font-semibold tabular-nums text-muted-foreground sm:block">
                          {realIdx + 1}
                        </span>
                        <span className="hidden text-xs font-medium tabular-nums text-muted-foreground sm:block">
                          {rec.rollNumber}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{rec.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">Roll {rec.rollNumber}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {Object.entries(statusConfig).map(([key, cfg]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateStatus(realIdx, key)}
                              aria-label={`Mark ${rec.name} as ${cfg.label}`}
                              aria-pressed={rec.status === key}
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition-all",
                                rec.status === key
                                  ? cfg.bg + " ring-current"
                                  : "bg-muted/40 text-muted-foreground ring-transparent hover:bg-muted hover:text-foreground"
                              )}
                            >
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filtered.length === 0 && search && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No students match "{search}"
                  </div>
                )}
              </CardContent>

              {/* Save footer */}
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selectedDate), "EEEE, dd MMMM yyyy")}
                </p>
                <div className="flex items-center gap-2">
                  {alreadyMarked && (
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={fetchStudents}>
                      <RotateCcw size={12} aria-hidden="true" /> Reset
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={saving || records.length === 0}
                    onClick={() => setConfirmSaveOpen(true)}
                  >
                    {saving ? (
                      <Clock size={14} className="mr-1.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save size={14} className="mr-1.5" aria-hidden="true" />
                    )}
                    {saving ? "Saving…" : alreadyMarked ? "Update Attendance" : "Mark Attendance"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={Users}
              title="No students found"
              description={selectedClassId ? "No students are enrolled in this class yet." : "Select a class to begin marking attendance."}
            />
          )}
        </>
      )}

      {/* ═══════ HISTORY MODE ═══════ */}
      {mode === "history" && (
        <Card>
          <CardHeader className="border-b border-border/60 bg-muted/30 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList size={18} className="text-primary" aria-hidden="true" />
                Attendance Records — {classDisplayName}
                <Badge variant="secondary" className="text-xs font-semibold">
                  {filteredHistory.length} record{filteredHistory.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-3">
                <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
                {historyStatusFilter !== "all" && (
                  <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setHistoryStatusFilter("all")}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {historyLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filteredHistory.length > 0 ? (
              <DataTable
                data={filteredHistory}
                columns={historyColumns}
                hideColumnsOnMobile={["status"]}
                emptyState={{ icon: ClipboardList, title: "No records", description: "No attendance records found for the selected filters." }}
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title={historyRecords.length > 0 ? "No matching records" : "No history records"}
                description={
                  historyRecords.length > 0
                    ? "No records match the selected status filter."
                    : "No attendance records found for the selected class, term, and date range."
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Save confirmation */}
      <ConfirmDialog
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title={alreadyMarked ? "Update Attendance?" : "Confirm Attendance"}
        description={`${counts.present} present, ${counts.absent} absent, ${counts.late} late for ${classDisplayName} on ${format(new Date(selectedDate), "dd MMM yyyy")}.`}
        confirmLabel={alreadyMarked ? "Update" : "Confirm"}
        onConfirm={handleSave}
        loading={saving}
      />
    </div>
  );
};

export default Attendance;
