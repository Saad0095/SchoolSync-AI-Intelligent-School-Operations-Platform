import React, { useEffect, useState } from "react";
import { Brain, TrendingUp, CalendarDays, Award, BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "../../context/AuthContext";
import api from "@/utils/api";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
} from "recharts";
import { scoreColor } from "@/components/shared/ChartTooltip";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    attendance: 0,
    averageMarks: 0,
    upcomingExams: 0,
    rank: 0,
    schedule: []
  });
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [remarksRes, overviewRes] = await Promise.allSettled([
          api.get(`/ai/recommendation/${user?._id}`),
          api.get(`/dashboard/student/overview`)
        ]);

        if (remarksRes.status === "fulfilled") {
          setRecommendation(remarksRes.value.recommendation || remarksRes.value.data?.recommendation);
        }

        if (overviewRes.status === "fulfilled") {
          setStats(overviewRes.value.data?.data || overviewRes.value.data || stats);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || "Student"}`}
        subtitle="Here is your academic overview and AI-powered insights."
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Attendance"
          value={`${stats.attendance}%`}
          tone="info"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Marks"
          value={`${stats.averageMarks}%`}
          tone="success"
        />
        <StatCard
          icon={Award}
          label="Class Rank"
          value={stats.rank ? `Top ${stats.rank}` : "—"}
          tone="warning"
        />
        <StatCard
          icon={BookOpen}
          label="Upcoming Exams"
          value={stats.upcomingExams}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="space-y-6 lg:col-span-2">
          {/* Performance Gauges */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarDays className="size-3.5" /> Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    barSize={14}
                    data={[{ name: "Attendance", value: stats.attendance || 0, fill: scoreColor(stats.attendance || 0) }]}
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
                <p className="-mt-12 text-3xl font-bold tabular-nums" style={{ color: scoreColor(stats.attendance || 0) }}>
                  {stats.attendance || 0}%
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
                <ResponsiveContainer width="100%" height={160}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    barSize={14}
                    data={[{ name: "Marks", value: stats.averageMarks || 0, fill: scoreColor(stats.averageMarks || 0) }]}
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
                <p className="-mt-12 text-3xl font-bold tabular-nums" style={{ color: scoreColor(stats.averageMarks || 0) }}>
                  {stats.averageMarks || 0}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Average score</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Card — restrained brass treatment */}
          <Card className="border-ai-accent/25 bg-ai-accent/[0.04]">
            <CardHeader className="border-b border-ai-accent/15">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ai-accent/10">
                  <Brain className="size-5 text-ai-accent" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Study Advisor</CardTitle>
                  <CardDescription>
                    Personalized recommendations based on your performance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recommendation ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-p:leading-relaxed prose-p:my-3 prose-headings:mt-6 prose-headings:mb-3 prose-li:my-1 prose-ul:my-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {recommendation}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="mb-3 size-10 text-ai-accent/50" aria-hidden="true" />
                  <p className="font-medium text-foreground">Generating your insights...</p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Our AI is analyzing your recent test scores and attendance to provide
                    personalized tips.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule / Reminders */}
          <Card>
            <CardHeader className="border-b border-border/60">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-primary" aria-hidden="true" />
                Upcoming Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.schedule?.length > 0 ? (
                <ul className="divide-y divide-border/60">
                  {stats.schedule.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/40"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          item.type === "Exam" ? "bg-destructive" : "bg-primary"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4">
                  <EmptyState
                    icon={Clock}
                    title="Nothing scheduled"
                    description="Upcoming exams and events will appear here."
                    className="border-0 bg-transparent py-6"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
