import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../context/AuthContext";
import api from "@/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/shared/StatCard";
import ErrorState from "@/components/shared/ErrorState";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  STATUS_COLORS, scoreColor,
  ChartTooltip, ChartLegend, axisTickStyle, gridStroke,
} from "@/components/shared/ChartTooltip";

const attendanceStatusVariants = {
  present: "success",
  absent: "destructive",
  leave: "warning",
  late: "warning",
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const today = new Date().toISOString().split("T")[0];

        try {
          const overviewRes = await api.get("/dashboard/teacher/overview");
          setOverview(overviewRes?.data || overviewRes);
        } catch (err) {
          console.error("Overview error:", err.message);
        }

        try {
          const quickStatsRes = await api.get("/dashboard/teacher/quick-stats");
          setStats(quickStatsRes?.data || quickStatsRes);
        } catch (err) {
          console.error("Quick stats error:", err.message);
        }

        try {
          const performanceRes = await api.get("/dashboard/teacher/class-performance");
          setPerformance(performanceRes?.data || performanceRes);
        } catch (err) {
          console.error("Performance error:", err.message);
        }

        try {
          const attendanceRes = await api.get("/dashboard/teacher/attendance-overview", {
            params: { from: today, to: today }
          });
          setAttendance(attendanceRes?.data || attendanceRes);
        } catch (err) {
          console.error("Attendance error:", err.message);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [refreshKey]);

  const retry = () => setRefreshKey((k) => k + 1);

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Context header */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Teaching overview
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome, {user?.name || "Teacher"}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Class Teacher for:
              {stats?.classInfo ? (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  Grade {stats.classInfo.grade || "N/A"} — {stats.classInfo.section || "N/A"}
                </span>
              ) : (
                <span className="font-medium">Not assigned</span>
              )}
            </p>
          </div>
          <div
            className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex"
            aria-hidden="true"
          >
            <GraduationCap className="size-7" />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <ErrorState
          title="Error loading dashboard"
          description={error}
          onRetry={retry}
        />
      )}

      {/* Classes & Subjects */}
      {(overview?.allClasses?.length > 0 || overview?.allSubjects?.length > 0) && (
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-[18px] text-primary" aria-hidden="true" />
              Classes & Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {overview?.allSubjects?.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subjects you teach
                </h3>
                <div className="flex flex-wrap gap-2">
                  {overview.allSubjects.map((subject, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {overview?.allClasses?.length > 0 && (
              <div className="space-y-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your classes
                </h3>
                {overview.allClasses.map((cls) => (
                  <div
                    key={cls._id}
                    className="rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          Grade {cls.grade} — Section {cls.section}
                        </p>
                        <p className="text-sm text-muted-foreground">{cls.campus?.name || "Campus"}</p>
                      </div>
                      {cls.isClassTeacher && (
                        <Badge variant="success" className="text-xs">Class Teacher</Badge>
                      )}
                    </div>

                    {cls.subjects && cls.subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cls.subjects.map((subject, idx) => (
                          <Badge key={idx} variant="warning" className="text-xs">
                            {typeof subject === "string" ? subject : subject.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No subjects assigned yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Quick Overview</h2>
        {stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Users} label="Total Students" value={stats?.totalStudents || 0} tone="primary" />
            <StatCard icon={CheckCircle} label="Active Students" value={stats?.activeStudents || 0} tone="success" />
            <StatCard icon={BookOpen} label="Avg Attendance" value={`${stats?.averageAttendance || 0}%`} tone="info" />
            <StatCard icon={TrendingUp} label="Avg Performance" value={`${stats?.averagePerformance || 0}/100`} tone="warning" />
            <StatCard icon={BarChart3} label="Exams Scheduled" value={stats?.examsScheduled || 0} tone="neutral" />
          </div>
        ) : (
          <ErrorState
            title="Quick stats unavailable"
            description="We couldn't load your quick overview. Check your connection and try again."
            onRetry={retry}
          />
        )}
      </section>

      {/* Attendance Overview */}
      {attendance && (
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="size-[18px] text-primary" aria-hidden="true" />
              Your Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-success/10 p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-success">
                  {attendance.summary.present || 0}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Present</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-destructive">
                  {attendance.summary.absent || 0}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="rounded-xl bg-warning/10 p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-warning">
                  {attendance.summary.leave || 0}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Leave</p>
              </div>
              <div className="rounded-xl bg-info/10 p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-info">
                  {attendance.overallAttendancePercentage}%
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Overall %</p>
              </div>
            </div>

            {/* Attendance Pie Chart */}
            {(attendance.summary.present || attendance.summary.absent || attendance.summary.leave) > 0 && (
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <defs>
                      <linearGradient id="tGradPresent" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                      <linearGradient id="tGradAbsent" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                      <linearGradient id="tGradLeave" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[
                        { name: "Present", value: attendance.summary.present || 0, fill: "url(#tGradPresent)" },
                        { name: "Absent", value: attendance.summary.absent || 0, fill: "url(#tGradAbsent)" },
                        { name: "Leave", value: attendance.summary.leave || 0, fill: "url(#tGradLeave)" },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      animationDuration={800}
                    >
                      <Cell fill="url(#tGradPresent)" />
                      <Cell fill="url(#tGradAbsent)" />
                      <Cell fill="url(#tGradLeave)" />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
                    {/* Center label */}
                    <text x="50%" y="40%" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-2xl font-bold">
                      {attendance.overallAttendancePercentage}%
                    </text>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground text-[10px]">
                      Attendance
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {attendance.attendanceRecords && attendance.attendanceRecords.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Attendance Records
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.attendanceRecords.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {new Date(record.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={attendanceStatusVariants[record.status] || "secondary"}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.checkIn
                              ? new Date(record.checkIn).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {record.checkOut
                              ? new Date(record.checkOut).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Class Performance */}
      {performance && (
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-[18px] text-primary" aria-hidden="true" />
              Class Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-info/10 p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-info">
                  {performance.classAverage}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Class Average</p>
              </div>
              <div className="rounded-xl bg-success/10 p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-success">
                  {performance.studentCount}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Students</p>
              </div>
              <div className="rounded-xl bg-warning/10 p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-warning">
                  {performance.examsCompleted}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Exams</p>
              </div>
            </div>

            {performance.topPerformers && performance.topPerformers.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Top Performers
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={performance.topPerformers.slice(0, 10)} margin={{ left: 0, right: 20, top: 10, bottom: 5 }}>
                    <defs>
                      {performance.topPerformers.slice(0, 10).map((entry, i) => (
                        <linearGradient key={`tp-${i}`} id={`tpGrad-${i}`} x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor={scoreColor(entry.avgMarks)} stopOpacity={0.7} />
                          <stop offset="100%" stopColor={scoreColor(entry.avgMarks)} stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="studentName" tick={axisTickStyle} angle={-15} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={axisTickStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip suffix="/100" />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
                    <Bar dataKey="avgMarks" radius={[6, 6, 0, 0]} barSize={24} animationDuration={800}>
                      {performance.topPerformers.slice(0, 10).map((_, i) => (
                        <Cell key={i} fill={`url(#tpGrad-${i})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {performance.allStudentPerformance && performance.allStudentPerformance.length > 5 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  All Students Performance
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-center">Avg Marks</TableHead>
                        <TableHead className="text-center">Percentage</TableHead>
                        <TableHead className="text-center">Exams</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performance.allStudentPerformance.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium tabular-nums">
                            {student.rollNumber}
                          </TableCell>
                          <TableCell>{student.studentName}</TableCell>
                          <TableCell className="text-center font-semibold tabular-nums">
                            {student.avgMarks.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {(student.avgPercentage * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {student.examCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherDashboard;
