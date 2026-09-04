import { useEffect, useState } from "react";
import { Users, CalendarDays, TrendingUp, Award, BookOpen, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
} from "recharts";
import { scoreColor } from "@/components/shared/ChartTooltip";

const ParentDashboard = () => {
  const { user } = useAuth();
  const [childrenData, setChildrenData] = useState([]);
  const [selectedChild, setSelectedChild] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/dashboard/parent/overview");
        const data = res.data?.data || res.data || {};
        setChildrenData(data.children || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchData();
  }, [user]);

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
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader title="Parent Dashboard" />
        <EmptyState icon={Users} title="Unable to load data" description={error} />
      </div>
    );
  }

  if (!childrenData.length) {
    return (
      <div className="space-y-6 animate-fade-in pb-8">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Parent portal
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Welcome, {user?.name || "Parent"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Monitor your children's academic progress and attendance.
              </p>
            </div>
            <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex" aria-hidden="true">
              <Heart className="size-7" />
            </div>
          </div>
        </div>
        <EmptyState
          icon={Users}
          title="No children linked"
          description="Contact your school administrator to link your children's accounts to this parent portal."
        />
      </div>
    );
  }

  const current = childrenData[selectedChild];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Parent portal
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome, {user?.name || "Parent"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Monitor your children's academic progress and attendance.
            </p>
          </div>
          <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex" aria-hidden="true">
            <Heart className="size-7" />
          </div>
        </div>
      </div>

      {/* Child selector */}
      {childrenData.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {childrenData.map((child, idx) => (
            <button
              key={child.child._id}
              onClick={() => setSelectedChild(idx)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                selectedChild === idx
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {child.child.name}
            </button>
          ))}
        </div>
      )}

      {/* Current child header */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {current.child.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{current.child.name}</h2>
            <p className="text-sm text-muted-foreground">{current.className}</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Attendance" value={`${current.attendance}%`} tone="info" />
        <StatCard icon={TrendingUp} label="Avg. Marks" value={`${current.averageMarks}%`} tone="success" />
        <StatCard icon={Award} label="Class Rank" value={current.rank ? `#${current.rank}` : "—"} tone="warning" />
        <StatCard icon={BookOpen} label="Exams" value={current.upcomingExams || 0} tone="primary" />
      </div>

      {/* Gauges */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-3.5" /> Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={16}
                data={[{ name: "Attendance", value: current.attendance || 0, fill: scoreColor(current.attendance || 0) }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  dataKey="value"
                  cornerRadius={10}
                  animationDuration={1000}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="-mt-14 text-3xl font-bold tabular-nums" style={{ color: scoreColor(current.attendance || 0) }}>
              {current.attendance || 0}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Days present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-3.5" /> Average Marks
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={16}
                data={[{ name: "Marks", value: current.averageMarks || 0, fill: scoreColor(current.averageMarks || 0) }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  dataKey="value"
                  cornerRadius={10}
                  animationDuration={1000}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="-mt-14 text-3xl font-bold tabular-nums" style={{ color: scoreColor(current.averageMarks || 0) }}>
              {current.averageMarks || 0}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Average score</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;
