import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Check, X, Clock, Download, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStudentAttendanceById } from "@/services/attendanceService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import { CURRENT_TERM, CURRENT_SESSION } from "@/components/shared/TermSessionFilter";
import EmptyState from "@/components/shared/EmptyState";
import StatCard from "@/components/shared/StatCard";

const statusConfig = {
  present: { color: "bg-success/10 text-success", dot: "bg-success", variant: "success" },
  absent: { color: "bg-destructive/10 text-destructive", dot: "bg-destructive", variant: "destructive" },
  leave: { color: "bg-warning/10 text-warning", dot: "bg-warning", variant: "warning" },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MyAttendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState(CURRENT_TERM);
  const [academicSession, setAcademicSession] = useState(CURRENT_SESSION);
  const [monthFilter, setMonthFilter] = useState("all");

  const summary = useMemo(() => {
    const s = { present: 0, absent: 0, leave: 0, total: records.length };
    records.forEach((r) => { if (s[r.status] !== undefined) s[r.status]++; });
    return s;
  }, [records]);

  const attendancePct = summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : 0;

  const fetchAttendance = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await getStudentAttendanceById(user._id, { term, academicSession });
      setRecords(res?.records || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, [term, academicSession, user?._id]);

  // Group records by month
  const byMonth = useMemo(() => {
    const acc = {};
    records.forEach((record) => {
      const d = new Date(record.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!acc[key]) acc[key] = { month: MONTHS[d.getMonth()], monthIdx: d.getMonth(), year: d.getFullYear(), records: [] };
      acc[key].records.push(record);
    });
    return acc;
  }, [records]);

  const filteredByMonth = monthFilter === "all"
    ? Object.values(byMonth).sort((a, b) => `${b.year}-${b.monthIdx}`.localeCompare(`${a.year}-${a.monthIdx}`))
    : Object.values(byMonth).filter((m) => `${m.year}-${m.monthIdx}` === monthFilter);

  // Records for DataTable
  const tableRecords = useMemo(() => {
    let recs = [...records];
    if (monthFilter !== "all") {
      recs = recs.filter((r) => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${d.getMonth()}` === monthFilter;
      });
    }
    return recs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [records, monthFilter]);

  const tableColumns = [
    {
      header: "Date",
      accessorKey: "date",
      meta: { label: "Date" },
      cell: (info) => (
        <span className="text-sm font-medium text-foreground">
          {format(new Date(info.getValue()), "EEE, dd MMM yyyy")}
        </span>
      ),
    },
    {
      header: "Day",
      accessorKey: "date",
      id: "day",
      meta: { label: "Day" },
      cell: (info) => (
        <span className="text-xs text-muted-foreground">{format(new Date(info.getValue()), "EEEE")}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      meta: { label: "Status" },
      cell: (info) => {
        const cfg = statusConfig[info.getValue()] || statusConfig.absent;
        return (
          <Badge variant={cfg.variant} className="gap-1.5 capitalize">
            <span className={`size-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
            {info.getValue()}
          </Badge>
        );
      },
    },
  ];

  // CSV export
  const handleCSVDownload = () => {
    try {
      const headers = ["Date", "Day", "Status"];
      const rows = tableRecords.map((r) => [
        format(new Date(r.date), "yyyy-MM-dd"),
        format(new Date(r.date), "EEEE"),
        r.status,
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${term}_${academicSession}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("CSV download failed");
    }
  };

  // Month options for filter
  const monthOptions = Object.values(byMonth)
    .sort((a, b) => `${b.year}-${b.monthIdx}`.localeCompare(`${a.year}-${a.monthIdx}`))
    .map((m) => ({ value: `${m.year}-${m.monthIdx}`, label: `${m.month} ${m.year}` }));

  // Stacked bar segments
  const barSegments = summary.total > 0
    ? [
        { pct: (summary.present / summary.total) * 100, color: "bg-success" },
        { pct: (summary.late / summary.total) * 100, color: "bg-warning" },
        { pct: (summary.absent / summary.total) * 100, color: "bg-destructive" },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader
        eyebrow="Academics"
        title="My Attendance"
        subtitle={`${academicSession} • ${term.replace("Term", " Term")}`}
        actions={
          <Button variant="outline" size="sm" onClick={handleCSVDownload} disabled={records.length === 0}>
            <Download size={14} className="mr-1.5" aria-hidden="true" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="myatt-term" className="text-xs font-semibold text-muted-foreground">Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger id="myatt-term" className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FirstTerm">First Term</SelectItem>
                  <SelectItem value="SecondTerm">Second Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="myatt-session" className="text-xs font-semibold text-muted-foreground">Session</Label>
              <Select value={academicSession} onValueChange={setAcademicSession}>
                <SelectTrigger id="myatt-session" className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024–2025</SelectItem>
                  <SelectItem value="2025-2026">2025–2026</SelectItem>
                  <SelectItem value="2026-2027">2026–2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="myatt-month" className="text-xs font-semibold text-muted-foreground">Month</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger id="myatt-month" className="w-40 h-9"><SelectValue placeholder="All Months" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(term || monthFilter !== "all") && (
              <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setMonthFilter("all"); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No attendance records"
          description="No attendance was recorded for the selected term and session."
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Check} label="Present" value={summary.present} tone="success" />
            <StatCard icon={X} label="Absent" value={summary.absent} tone="danger" />
            <StatCard icon={Clock} label="Leave" value={summary.leave} tone="warning" />
            <StatCard icon={BarChart3} label="Attendance Rate" value={`${attendancePct}%`} tone="info" />
          </div>

          {/* Stacked bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Calendar size={16} className="text-primary" aria-hidden="true" />
                Attendance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                {barSegments.map((seg, i) => (
                  <div key={i} className={`${seg.color} transition-all`} style={{ width: `${seg.pct}%` }} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success" aria-hidden="true" />
                  Present: {summary.present} ({summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(0) : 0}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
                  Leave: {summary.leave}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
                  Absent: {summary.absent} ({summary.total > 0 ? ((summary.absent / summary.total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly calendar cards */}
          {filteredByMonth.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Monthly Calendar</h3>
              {filteredByMonth.map(({ month, year, records: monthRecords }) => (
                <Card key={`${month}-${year}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      {month} {year}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({monthRecords.length} days)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {monthRecords.map((r) => {
                        const cfg = statusConfig[r.status] || statusConfig.absent;
                        const d = new Date(r.date);
                        return (
                          <div
                            key={r._id}
                            title={`${d.toLocaleDateString("en-GB")} — ${r.status}`}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-medium ${cfg.color}`}
                          >
                            {d.getDate()}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex gap-3 text-xs">
                      <span className="flex items-center gap-1 font-medium text-success">
                        <Check size={12} aria-hidden="true" /> {monthRecords.filter((r) => r.status === "present").length} Present
                      </span>
                      <span className="flex items-center gap-1 font-medium text-destructive">
                        <X size={12} aria-hidden="true" /> {monthRecords.filter((r) => r.status === "absent").length} Absent
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Detailed records table */}
          <Card>
            <CardHeader className="border-b border-border/60 px-6 py-4">
              <CardTitle className="text-sm font-bold">Detailed Records</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DataTable
                data={tableRecords}
                columns={tableColumns}
                hideColumnsOnMobile={["day"]}
                emptyState={{ icon: Calendar, title: "No records", description: "No attendance records for the selected filters." }}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MyAttendance;
