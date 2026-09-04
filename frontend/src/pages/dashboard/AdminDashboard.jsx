import { useEffect, useState } from "react";
import { Building2, Users2, GraduationCap, TrendingDown, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverviewStats, getDropRatio, getTopPerformers, getCampusComparison } from "@/services/dashboardService";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  CHART_COLORS, STATUS_COLORS, scoreColor,
  ChartTooltip, ChartLegend, axisTickStyle, gridStroke,
} from "@/components/shared/ChartTooltip";

const AdminDashboard = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super-admin";

  const [stats, setStats] = useState({ campusCount: 0, studentCount: 0, teacherCount: 0 });
  const [topPerformers, setTopPerformers] = useState([]);
  const [dropRatio, setDropRatio] = useState(null);
  const [campusComp, setCampusComp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const [statsRes, dropRes, perfRes, compRes] = await Promise.allSettled([
          getOverviewStats(),
          getDropRatio(),
          getTopPerformers(),
          isSuperAdmin ? getCampusComparison() : Promise.resolve({ data: [] }),
        ]);

        // Backend: { data: { campusCount, studentCount, teacherCount } }
        if (statsRes.status === "fulfilled") {
          const s = statsRes.value?.data || statsRes.value || {};
          setStats(s);
        } else {
          setError(true);
        }

        // Backend: { data: { totalStudents, inactiveStudents, dropRatio } }
        if (dropRes.status === "fulfilled") {
          const d = dropRes.value?.data || dropRes.value || {};
          setDropRatio(d);
        }

        // Backend: { data: [{ campusId, campusName, topStudents: [{name, avgMarks, ...}] }] }
        if (perfRes.status === "fulfilled") {
          const p = perfRes.value?.data || perfRes.value || [];
          // Flatten: extract all topStudents from all campuses
          const allStudents = Array.isArray(p)
            ? p.flatMap((campus) =>
                (campus.topStudents || []).map((s) => ({
                  studentId: s.studentId,
                  studentName: s.name,
                  averageScore: s.avgMarks,
                  className: s.classGrade ? `${s.classGrade} ${s.classSection || ""}`.trim() : null,
                  campusName: campus.campusName,
                }))
              )
            : [];
          // Sort and take top 5
          allStudents.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
          setTopPerformers(allStudents.slice(0, 5));
        }

        // Backend: { data: [{ campusId, campusName, averageResult }] }
        if (compRes.status === "fulfilled") {
          const c = compRes.value?.data || compRes.value || [];
          setCampusComp(c);
        }
      } catch (error) {
        console.error("Dashboard fetch error", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isSuperAdmin, refreshKey]);

  const retry = () => setRefreshKey((k) => k + 1);

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader title="Dashboard" />
        <ErrorState
          title="Dashboard data unavailable"
          description="We couldn't load the latest statistics. Check your connection and try again."
          onRetry={retry}
        />
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
              {isSuperAdmin ? "Organization overview" : "Campus overview"}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {user?.name || "Admin"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Here's what's happening across your {isSuperAdmin ? "campuses" : "campus"} today.
              Keep track of performance, attendance, and administrative tasks.
            </p>
          </div>
          <div
            className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex"
            aria-hidden="true"
          >
            <Building2 className="size-7" />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin && (
          <StatCard icon={Building2} label="Total Campuses" value={stats.campusCount || 0} tone="primary" />
        )}
        <StatCard icon={Users2} label="Total Students" value={stats.studentCount || 0} tone="success" />
        <StatCard icon={GraduationCap} label="Total Teachers" value={stats.teacherCount || 0} tone="info" />
        <StatCard
          icon={TrendingDown}
          label="Drop Ratio"
          value={dropRatio?.dropRatio ? `${dropRatio.dropRatio}%` : "0%"}
          tone="danger"
          hint={`${dropRatio?.inactiveStudents || 0} dropped out of ${dropRatio?.totalStudents || 0}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Drop Ratio Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="size-[18px] text-primary" aria-hidden="true" /> Student Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dropRatio?.totalStudents > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    <linearGradient id="gradActive" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="gradDropped" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={[
                      { name: "Active", value: (dropRatio.totalStudents || 0) - (dropRatio.inactiveStudents || 0), fill: "url(#gradActive)" },
                      { name: "Dropped", value: dropRatio.inactiveStudents || 0, fill: "url(#gradDropped)" },
                    ]}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    animationDuration={800}
                    animationBegin={100}
                  >
                    <Cell fill="url(#gradActive)" />
                    <Cell fill="url(#gradDropped)" />
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend content={<ChartLegend />} />
                  {/* Center label */}
                  <text x="50%" y="40%" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-2xl font-bold">
                    {dropRatio.totalStudents}
                  </text>
                  <text x="50%" y="48%" textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground text-xs">
                    Total Students
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={TrendingDown} title="No data" description="Drop ratio data will appear once students are enrolled." className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>

        {/* Top Performers Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-[18px] text-primary" aria-hidden="true" /> Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topPerformers} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                  <defs>
                    {topPerformers.map((entry, i) => (
                      <linearGradient key={`perf-${i}`} id={`perfGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={scoreColor(entry.averageScore)} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={scoreColor(entry.averageScore)} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={axisTickStyle} axisLine={false} tickLine={false} />
                  <YAxis dataKey="studentName" type="category" width={100} tick={axisTickStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip suffix="marks" />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
                  <Bar dataKey="averageScore" radius={[0, 8, 8, 0]} barSize={22} animationDuration={800}>
                    {topPerformers.map((_, i) => (
                      <Cell key={i} fill={`url(#perfGrad-${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Award} title="No performance data yet" description="Top performers will appear here once exam results are recorded." className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campus Comparison (Super Admin Only) */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-[18px] text-primary" aria-hidden="true" /> Campus Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campusComp?.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={campusComp} margin={{ left: 10, right: 20, top: 20, bottom: 5 }}>
                  <defs>
                    {campusComp.map((_, i) => (
                      <linearGradient key={`camp-${i}`} id={`campGrad-${i}`} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="campusName" tick={axisTickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
                  <Bar dataKey="averageResult" radius={[8, 8, 0, 0]} barSize={48} animationDuration={800}>
                    {campusComp.map((_, i) => (
                      <Cell key={i} fill={`url(#campGrad-${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Building2} title="No campus comparison yet" description="Average results per campus will appear here as exams are graded." className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
