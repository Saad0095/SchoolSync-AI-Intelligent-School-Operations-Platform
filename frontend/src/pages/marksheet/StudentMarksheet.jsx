import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "../../context/AuthContext";
import { CURRENT_TERM, CURRENT_SESSION } from "@/components/shared/TermSessionFilter";
import {
  Printer,
  Download,
  GraduationCap,
  Search,
  FileText,
  Edit2,
  Check,
  X,
  School,
  UserCheck,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "../../components/ui/DataTable";

const gradeVariants = {
  "A+": "success",
  A: "success",
  B: "info",
  C: "warning",
  D: "warning",
  F: "destructive",
};

const StudentMarksheet = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const term = searchParams.get("term") || CURRENT_TERM;
  const academicSession = searchParams.get("academicSession") || CURRENT_SESSION;
  const studentId = searchParams.get("studentId") || (user?.role === "student" ? user?.id : "");
  const selectedClassId = searchParams.get("classId") || "all";

  // State
  const [classesList, setClassesList] = useState([]);
  const [marksheets, setMarksheets] = useState([]);
  const [selectedStudentMarksheet, setSelectedStudentMarksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("rank_high");
  const [activeClassTab, setActiveClassTab] = useState("all");

  // Remark editing state
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [editRemarkValue, setEditRemarkValue] = useState("");
  const [isSavingRemark, setIsSavingRemark] = useState(false);

  // 1. Fetch Available Classes for Dropdown (for Campus Admin, Super Admin, Teacher)
  useEffect(() => {
    const fetchClasses = async () => {
      if (user?.role === "student") return;
      try {
        const res = await api.get("/classes?limit=1000");
        const clsArr = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : res.classes || [];
        setClassesList(clsArr);
      } catch (err) {
        console.error("Failed to fetch classes list", err);
      }
    };
    fetchClasses();
  }, [user]);

  // 2. Fetch Marksheets
  const fetchMarksheets = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        term,
        academicSession,
        limit: 200, // Load all marksheets for categorization
      };

      if (user?.role === "student") {
        params.studentId = user.id;
      } else {
        if (studentId) params.studentId = studentId;
        if (selectedClassId && selectedClassId !== "all") params.classId = selectedClassId;
      }

      const res = await api.get("/result/marksheet", { params });
      const fetchedMarksheets = res?.marksheets || res?.data?.marksheets || (Array.isArray(res) ? res : []);
      setMarksheets(fetchedMarksheets);

      if (fetchedMarksheets.length > 0) {
        setSelectedStudentMarksheet(fetchedMarksheets[0]);
      } else {
        setSelectedStudentMarksheet(null);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.response?.data?.message || "Failed to load marksheets");
      setMarksheets([]);
      setSelectedStudentMarksheet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarksheets();
  }, [term, academicSession, studentId, selectedClassId]);

  // Handle Save Remark
  const handleSaveRemark = async () => {
    if (!selectedStudentMarksheet) return;
    setIsSavingRemark(true);
    try {
      await api.put(`/result/marksheet/${selectedStudentMarksheet._id}/remark`, {
        finalRemarks: editRemarkValue,
      });

      const updated = {
        ...selectedStudentMarksheet,
        finalRemarks: editRemarkValue,
        isAIGenerated: false,
      };

      setSelectedStudentMarksheet(updated);
      setMarksheets((prev) =>
        prev.map((m) => (m._id === updated._id ? updated : m))
      );
      setIsEditingRemark(false);
      toast.success("Teacher remark updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update remark");
    } finally {
      setIsSavingRemark(false);
    }
  };

  // Download ZIP for selected class or all
  const downloadZIP = async () => {
    try {
      toast.info("Preparing marksheets ZIP export…");
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        term,
        academicSession,
        classId: selectedClassId !== "all" ? selectedClassId : "",
        downloadZIP: "true",
      }).toString();

      const url = `${api.defaults.baseURL.replace(/\/$/, "")}/result/marksheet?${params}`;

      const resp = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Class_Marksheets_${term}_${academicSession}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Marksheets exported successfully!");
    } catch (err) {
      console.error("ZIP Download failed", err);
      toast.error("Failed to download marksheets ZIP");
    }
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(Object.fromEntries([...searchParams]));
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handlePrint = () => {
    window.print();
  };

  // Group Marksheets Class-Wise
  const groupedByClass = marksheets.reduce((acc, m) => {
    const clsId = m.class?._id || m.class || "unassigned";
    const clsName = m.class?.grade
      ? `Grade ${m.class.grade} ${m.class.section ? `- Section ${m.class.section}` : ""}`
      : "General Class";

    if (!acc[clsId]) {
      acc[clsId] = {
        classId: clsId,
        className: clsName,
        marksheets: [],
      };
    }
    acc[clsId].marksheets.push(m);
    return acc;
  }, {});

  const classGroupKeys = Object.keys(groupedByClass);

  // Filter and sort marksheets dynamically
  const getFilteredMarksheets = (marksheetList) => {
    let result = [...marksheetList];

    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.student?.name?.toLowerCase().includes(q) ||
          m.student?.email?.toLowerCase().includes(q) ||
          m.student?._id?.toLowerCase().includes(q)
      );
    }

    if (performanceFilter === "distinction") {
      result = result.filter((m) => (m.percentage || 0) >= 80);
    } else if (performanceFilter === "passing") {
      result = result.filter((m) => (m.percentage || 0) >= 50 && (m.percentage || 0) < 80);
    } else if (performanceFilter === "at_risk") {
      result = result.filter((m) => (m.percentage || 0) < 50 || m.overallGrade === "F");
    }

    if (sortOrder === "rank_high") {
      result.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
    } else if (sortOrder === "rank_low") {
      result.sort((a, b) => (a.percentage || 0) - (b.percentage || 0));
    } else if (sortOrder === "name_asc") {
      result.sort((a, b) => (a.student?.name || "").localeCompare(b.student?.name || ""));
    }

    return result;
  };

  // Data Table Columns for Class View
  const classMarksheetColumns = [
    {
      header: "Student Name",
      accessorKey: "student.name",
      meta: { label: "Student" },
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-foreground">{row.original.student?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">{row.original.student?.email}</p>
        </div>
      ),
    },
    {
      header: "Class & Section",
      accessorKey: "class.grade",
      meta: { label: "Class" },
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          Grade {row.original.class?.grade || "N/A"} {row.original.class?.section ? `(${row.original.class.section})` : ""}
        </span>
      ),
    },
    {
      header: "Obtained / Total",
      accessorKey: "grandObtained",
      meta: { label: "Marks" },
      cell: ({ row }) => (
        <span className="text-xs font-medium">
          <strong className="font-bold text-primary">{row.original.grandObtained || 0}</strong> / {row.original.grandTotal || 0}
        </span>
      ),
    },
    {
      header: "Percentage",
      accessorKey: "overallPercentage",
      meta: { label: "Percentage" },
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          {row.original.overallPercentage || 0}%
        </span>
      ),
    },
    {
      header: "Grade",
      accessorKey: "overallGrade",
      meta: { label: "Grade" },
      cell: ({ row }) => (
        <Badge variant={gradeVariants[row.original.overallGrade] || "secondary"}>
          {row.original.overallGrade || "-"}
        </Badge>
      ),
    },
    {
      header: "Teacher Remark",
      accessorKey: "finalRemarks",
      meta: { label: "Remark" },
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-xs text-muted-foreground">
          {row.original.finalRemarks || "—"}
          {row.original.isAIGenerated && (
            <Badge variant="ai" className="ml-1 text-[10px]">AI</Badge>
          )}
        </div>
      ),
    },
    {
      header: "Action",
      accessorKey: "_id",
      meta: { label: "Actions" },
      cell: ({ row }) => (
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => {
            setSelectedStudentMarksheet(row.original);
            const el = document.getElementById("report-card-view");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Eye size={12} className="mr-1" aria-hidden="true" /> View Card
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top Header - Hidden in print mode */}
      <div className="no-print space-y-6">
        <PageHeader
          eyebrow="Results"
          title={
            user?.role === "student"
              ? "My Academic Marksheet"
              : user?.role === "teacher"
              ? "Class Marksheets"
              : "Campus Marksheets"
          }
          subtitle={`Categorized performance reports for ${term} • ${academicSession}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer size={14} className="mr-1.5 text-primary" aria-hidden="true" />
                Print Card
              </Button>
              {user?.role !== "student" && marksheets.length > 0 && (
                <Button size="sm" onClick={downloadZIP} className="text-xs font-semibold">
                  <Download size={14} className="mr-1.5" aria-hidden="true" />
                  Export Class ZIP
                </Button>
              )}
            </div>
          }
        />

        {/* Filters & Class Category Bar */}
        {user?.role !== "student" && (
          <Card>
            <CardHeader className="border-b border-border/60 bg-muted/30 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Filter size={16} className="text-primary" aria-hidden="true" /> Class Categorization & Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                {/* Term Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="term-selector" className="text-xs font-semibold text-muted-foreground">Examination Term</Label>
                  <Select value={term} onValueChange={(v) => updateParam("term", v)}>
                    <SelectTrigger id="term-selector" className="h-9 text-xs font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FirstTerm">First Term</SelectItem>
                      <SelectItem value="SecondTerm">Second Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Session Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="session-selector" className="text-xs font-semibold text-muted-foreground">Academic Session</Label>
                  <Select value={academicSession} onValueChange={(v) => updateParam("academicSession", v)}>
                    <SelectTrigger id="session-selector" className="h-9 text-xs font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026-2027">2026 - 2027</SelectItem>
                      <SelectItem value="2025-2026">2025 - 2026</SelectItem>
                      <SelectItem value="2024-2025">2024 - 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Categorization Dropdown */}
                <div className="space-y-1.5">
                  <Label htmlFor="class-category" className="text-xs font-semibold text-muted-foreground">Class Category</Label>
                  <Select
                    value={selectedClassId}
                    onValueChange={(v) => updateParam("classId", v)}
                  >
                    <SelectTrigger id="class-category" className="h-9 text-xs font-medium"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classesList.map((c) => {
                        const cId = (c._id || c.id || "").toString();
                        if (!cId) return null;
                        return (
                          <SelectItem key={cId} value={cId}>
                            Grade {c.grade ?? "N/A"} {c.section ? `- Section ${c.section}` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Performance Filter */}
                <div className="space-y-1.5">
                  <Label htmlFor="performance-tier" className="text-xs font-semibold text-muted-foreground">Performance Tier</Label>
                  <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                    <SelectTrigger id="performance-tier" className="h-9 text-xs font-medium"><SelectValue placeholder="All Grades" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Performance Tiers</SelectItem>
                      <SelectItem value="distinction">High Performers (≥80%)</SelectItem>
                      <SelectItem value="passing">Passing Students (50%-79%)</SelectItem>
                      <SelectItem value="at_risk">Academic At-Risk (&lt;50% / F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rank Order Sort */}
                <div className="space-y-1.5">
                  <Label htmlFor="sort-order" className="text-xs font-semibold text-muted-foreground">Sort Order</Label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger id="sort-order" className="h-9 text-xs font-medium"><SelectValue placeholder="Sort Order" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rank_high">Rank: Highest % First</SelectItem>
                      <SelectItem value="rank_low">Rank: Lowest % First</SelectItem>
                      <SelectItem value="name_asc">Name: A to Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Student Search */}
                <div className="space-y-1.5">
                  <Label htmlFor="student-search" className="text-xs font-semibold text-muted-foreground">Search Student</Label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="student-search"
                      placeholder="Student name…"
                      aria-label="Search students"
                      className="h-9 pl-8 text-xs font-medium"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {loading ? (
        <Card className="no-print">
          <CardContent className="space-y-4 p-12">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : error ? (
        <div className="no-print">
          <ErrorState
            title="Failed to load marksheets"
            description={error}
            onRetry={fetchMarksheets}
          />
        </div>
      ) : marksheets.length === 0 ? (
        <div className="no-print">
          <EmptyState
            icon={FileText}
            title="No marksheets found"
            description="No examination marksheets have been generated for the selected term or class."
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* CLASS-WISE CATEGORIZED DISPLAY FOR ADMIN / TEACHER */}
          {user?.role !== "student" && (
            <div className="no-print space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <School className="text-primary" size={20} aria-hidden="true" />
                  Class-Wise Marksheets ({marksheets.length} Total)
                </h3>
              </div>

              {/* Class Tabs / Categories */}
              <Tabs value={activeClassTab} onValueChange={setActiveClassTab} className="space-y-4">
                <TabsList className="flex h-auto flex-wrap gap-1 rounded-xl bg-muted/40 p-1.5">
                  <TabsTrigger value="all" className="rounded-lg px-3 py-1.5 text-xs font-semibold">
                    All Classes ({marksheets.length})
                  </TabsTrigger>
                  {classGroupKeys.map((key) => (
                    <TabsTrigger key={key} value={key} className="rounded-lg px-3 py-1.5 text-xs font-semibold">
                      {groupedByClass[key].className} ({groupedByClass[key].marksheets.length})
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* ALL CLASSES VIEW */}
                <TabsContent value="all" className="space-y-6">
                  {classGroupKeys.map((clsId) => {
                    const group = groupedByClass[clsId];
                    const filteredGroupMarksheets = getFilteredMarksheets(group.marksheets);
                    if (filteredGroupMarksheets.length === 0) return null;

                    return (
                      <Card key={clsId}>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-6 py-4">
                          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                            <GraduationCap size={18} className="text-primary" aria-hidden="true" />
                            {group.className}
                            <Badge variant="secondary" className="ml-2 text-xs font-semibold">
                              {filteredGroupMarksheets.length} Student{filteredGroupMarksheets.length !== 1 ? "s" : ""}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <DataTable data={filteredGroupMarksheets} columns={classMarksheetColumns} hideColumnsOnMobile={["finalRemarks"]} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                {/* SPECIFIC CLASS CATEGORY TAB VIEWS */}
                {classGroupKeys.map((clsId) => {
                  const group = groupedByClass[clsId];
                  const filteredGroupMarksheets = getFilteredMarksheets(group.marksheets);

                  return (
                    <TabsContent key={clsId} value={clsId} className="space-y-4">
                      <Card>
                        <CardHeader className="border-b border-border/60 px-6 py-4">
                          <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <GraduationCap size={18} className="text-primary" aria-hidden="true" />
                            {group.className} Marksheets
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <DataTable data={filteredGroupMarksheets} columns={classMarksheetColumns} hideColumnsOnMobile={["finalRemarks"]} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          )}

          {/* DETAILED A4 REPORT CARD VIEW */}
          {selectedStudentMarksheet && (
            <div id="report-card-view" className="pt-4">
              {user?.role !== "student" && (
                <div className="no-print mb-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary sm:text-sm">
                    <UserCheck size={18} aria-hidden="true" />
                    Active Report Card Preview: {selectedStudentMarksheet.student?.name}
                  </div>
                  <Badge variant="outline" className="text-xs font-bold bg-card">
                    Grade {selectedStudentMarksheet.class?.grade || "N/A"} ({selectedStudentMarksheet.class?.section || "A"})
                  </Badge>
                </div>
              )}

              <div className="report-card-print bg-card p-8 sm:p-12 border shadow-sm rounded-xl mx-auto max-w-4xl relative overflow-hidden">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>

                {/* Header */}
                <div className="text-center mb-10 pb-6 border-b-2 border-border">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap size={32} className="text-primary" aria-hidden="true" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Academic Report Card</h1>
                  <p className="text-muted-foreground mt-1 font-medium text-xs uppercase tracking-wider">
                    {selectedStudentMarksheet.term} Examination • {selectedStudentMarksheet.academicSession}
                  </p>
                </div>

                {/* Student & Class Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted-foreground font-medium">Student Name</span>
                      <span className="font-bold text-foreground">{selectedStudentMarksheet.student?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted-foreground font-medium">Student ID</span>
                      <span className="font-bold text-foreground">{selectedStudentMarksheet.student?._id?.substring(18, 24).toUpperCase() || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted-foreground font-medium">Email</span>
                      <span className="font-semibold text-foreground text-xs">{selectedStudentMarksheet.student?.email || "N/A"}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted-foreground font-medium">Grade / Class</span>
                      <span className="font-bold text-foreground">Grade {selectedStudentMarksheet.class?.grade || "N/A"} ({selectedStudentMarksheet.class?.section || "A"})</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted-foreground font-medium">Campus</span>
                      <span className="font-bold text-foreground">{selectedStudentMarksheet.campus?.name || "Main Campus"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted-foreground font-medium">Issue Date</span>
                      <span className="font-semibold text-foreground">{new Date(selectedStudentMarksheet.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Subjects Table */}
                <div className="mb-10 rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted text-muted-foreground font-bold">
                      <tr>
                        <th scope="col" className="border-b px-4 py-3 text-xs font-semibold">Subject</th>
                        <th scope="col" className="border-b px-4 py-3 text-center text-xs font-semibold">Total Marks</th>
                        <th scope="col" className="border-b px-4 py-3 text-center text-xs font-semibold">Marks Obtained</th>
                        <th scope="col" className="border-b px-4 py-3 text-center text-xs font-semibold">Percentage</th>
                        <th scope="col" className="border-b px-4 py-3 text-center text-xs font-semibold">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {selectedStudentMarksheet.subjects?.map((s, idx) => (
                        <tr key={s._id || idx} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-semibold text-foreground">{s.subject?.name || "Subject"}</td>
                          <td className="py-3 px-4 text-center font-medium text-muted-foreground">{s.totalMarks ?? "-"}</td>
                          <td className="py-3 px-4 text-center font-bold text-foreground">{s.marksObtained ?? "-"}</td>
                          <td className="py-3 px-4 text-center font-semibold text-muted-foreground">{s.percentage ?? "-"}%</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={gradeVariants[s.grade] || "secondary"}>
                              {s.grade ?? "-"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Final Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-muted/20 rounded-xl p-5 border border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Academic Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grand Total</span>
                        <span className="font-bold text-foreground">{selectedStudentMarksheet.grandTotal || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Obtained</span>
                        <span className="font-bold text-primary">{selectedStudentMarksheet.grandObtained || 0}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border mt-2">
                        <span className="font-bold text-foreground">Final Percentage</span>
                        <span className="font-bold text-foreground">{selectedStudentMarksheet.overallPercentage || 0}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/20 rounded-xl p-5 border border-border flex flex-col justify-center items-center text-center">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Overall Performance & Remarks</h4>
                    <div className="mb-2 text-5xl font-bold text-foreground">
                      {selectedStudentMarksheet.overallGrade || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-col items-center gap-1.5 w-full">
                      <div className="font-medium flex items-center justify-center gap-1 flex-wrap">
                        Remarks: 
                        {isEditingRemark ? (
                          <div className="ml-2 mt-1 flex items-center gap-2 no-print">
                            <Input
                              value={editRemarkValue}
                              onChange={(e) => setEditRemarkValue(e.target.value)}
                              aria-label="Edit teacher remark"
                              className="h-8 min-w-[200px] text-xs"
                              disabled={isSavingRemark}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-success"
                              onClick={handleSaveRemark}
                              disabled={isSavingRemark}
                              aria-label="Save remark"
                            >
                              <Check size={14} aria-hidden="true" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setIsEditingRemark(false)}
                              disabled={isSavingRemark}
                              aria-label="Cancel editing remark"
                            >
                              <X size={14} aria-hidden="true" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold text-foreground italic">“{selectedStudentMarksheet.finalRemarks || "Satisfactory progress."}”</span>
                            {user?.role !== "student" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-primary no-print"
                                onClick={() => {
                                  setEditRemarkValue(selectedStudentMarksheet.finalRemarks || "");
                                  setIsEditingRemark(true);
                                }}
                                title="Edit Teacher Remark"
                                aria-label="Edit teacher remark"
                              >
                                <Edit2 size={12} aria-hidden="true" />
                              </Button>
                            )}
                            {selectedStudentMarksheet.isAIGenerated && (
                              <Badge variant="ai" className="text-[10px] font-semibold no-print">
                                AI Remark
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-16 grid grid-cols-3 gap-8 text-center border-t border-border pt-8">
                  <div>
                    <div className="h-10 border-b border-dashed border-border mx-auto w-3/4 mb-2"></div>
                    <p className="text-xs text-muted-foreground font-semibold">Class Teacher</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-border mx-auto w-3/4 mb-2"></div>
                    <p className="text-xs text-muted-foreground font-semibold">Principal</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-border mx-auto w-3/4 mb-2"></div>
                    <p className="text-xs text-muted-foreground font-semibold">Parent / Guardian</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-card-print, .report-card-print * {
            visibility: visible;
          }
          .report-card-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentMarksheet;
