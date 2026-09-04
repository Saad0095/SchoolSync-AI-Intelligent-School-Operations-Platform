import React, { useEffect, useState } from "react";
import { Brain, TrendingUp, CalendarDays, Award, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "../../context/AuthContext";
import api from "@/utils/api";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
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
  });
  const [recommendation, setRecommendation] = useState("");
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const fetchOverview = async () => {
      try {
        const overviewRes = await api.get(`/dashboard/student/overview`);
        setStats(overviewRes.data?.data || overviewRes.data || {});
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    // AI recommendation is slow (LLM call) — load it in the background
    // so the dashboard renders immediately with stats
    const fetchRecommendation = async () => {
      try {
        const remarksRes = await api.get(`/ai/recommendation/${user._id}`);
        setRecommendation(remarksRes.recommendation || remarksRes.data?.recommendation || "");
      } catch (error) {
        console.error("Failed to fetch AI recommendation:", error);
      } finally {
        setRecommendationLoading(false);
      }
    };

    fetchOverview();
    fetchRecommendation();
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

  // Normalize to whole numbers (backend may return decimals or strings,
  // e.g. "75.0" — display and gauge fill both need clean numbers)
  const attendancePct = Math.round(Number(stats.attendance) || 0);
  const avgMarksPct = Math.round(Number(stats.averageMarks) || 0);

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
          value={`${attendancePct}%`}
          tone="info"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Marks"
          value={`${avgMarksPct}%`}
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

      {/* Full-width content */}
      <div className="space-y-6">
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
                    data={[{ name: "Attendance", value: attendancePct, fill: scoreColor(attendancePct) }]}
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
                <p className="-mt-12 text-3xl font-bold tabular-nums" style={{ color: scoreColor(attendancePct) }}>
                  {attendancePct}%
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
                    data={[{ name: "Marks", value: avgMarksPct, fill: scoreColor(avgMarksPct) }]}
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
                <p className="-mt-12 text-3xl font-bold tabular-nums" style={{ color: scoreColor(avgMarksPct) }}>
                  {avgMarksPct}%
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
              {recommendationLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="mb-3 size-10 text-ai-accent/50" aria-hidden="true" />
                  <p className="font-medium text-foreground">Generating your insights...</p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Our AI is analyzing your recent test scores and attendance to provide
                    personalized tips.
                  </p>
                </div>
              ) : recommendation ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-p:leading-relaxed prose-p:my-3 prose-headings:mt-6 prose-headings:mb-3 prose-li:my-1 prose-ul:my-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {recommendation}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="mb-3 size-10 text-ai-accent/50" aria-hidden="true" />
                  <p className="font-medium text-foreground">No insights available yet</p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Insights will appear once you have exam scores and attendance recorded.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
