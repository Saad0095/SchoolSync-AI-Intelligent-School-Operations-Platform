import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../utils/api";
import PageHeader from "@/components/shared/PageHeader";
import { CURRENT_SESSION } from "@/components/shared/TermSessionFilter";
import StatCard from "@/components/shared/StatCard";
import { DataTable } from "../../components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Plus,
  Search,
  Download,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Eye,
  RotateCcw,
  Sparkles,
} from "lucide-react";

// Status Badge Helper
const getStatusBadge = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "paid") {
    return (
      <Badge variant="success">
        <CheckCircle2 size={12} className="mr-1" aria-hidden="true" /> Paid
      </Badge>
    );
  }
  if (s === "partially_paid") {
    return (
      <Badge variant="warning">
        <Clock size={12} className="mr-1" aria-hidden="true" /> Partially Paid
      </Badge>
    );
  }
  if (s === "overdue") {
    return (
      <Badge variant="destructive">
        <AlertCircle size={12} className="mr-1" aria-hidden="true" /> Overdue
      </Badge>
    );
  }
  return (
    <Badge variant="info">
      <Clock size={12} className="mr-1" aria-hidden="true" /> Pending
    </Badge>
  );
};

const FeeManagement = () => {
  const [activeTab, setActiveTab] = useState("vouchers");

  // Summary Metrics State
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Fee Structures State
  const [structures, setStructures] = useState([]);
  const [structuresLoading, setStructuresLoading] = useState(true);
  const [createStructOpen, setCreateStructOpen] = useState(false);
  const [structFormData, setStructFormData] = useState({
    name: "",
    feeType: "tuition",
    amount: "",
    frequency: "monthly",
    dueDate: "",
    description: "",
    academicSession: "2025-2026",
  });
  const [structSubmitting, setStructSubmitting] = useState(false);

  // Vouchers State
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [selectedSortFilter, setSelectedSortFilter] = useState("newest");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [selectedBalanceFilter, setSelectedBalanceFilter] = useState("all");
  const [selectedSessionFilter, setSelectedSessionFilter] = useState(CURRENT_SESSION);

  // Classes & Students data for options
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);

  // Modals State
  const [genVoucherOpen, setGenVoucherOpen] = useState(false);
  const [genFormData, setGenFormData] = useState({
    targetType: "class", // 'class' or 'student'
    classId: "",
    studentId: "",
    feeStructureId: "",
    title: "",
    feeType: "tuition",
    amount: "",
    dueDate: "",
    remarks: "",
  });
  const [genSubmitting, setGenSubmitting] = useState(false);

  // View Voucher Modal
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [viewVoucherOpen, setViewVoucherOpen] = useState(false);

  // Payment Recording Modal
  const [payVoucher, setPayVoucher] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payFormData, setPayFormData] = useState({
    amount: "",
    paymentMethod: "cash",
    transactionId: "",
    notes: "",
  });
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Load All Data
  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const params = {};
      if (selectedSessionFilter !== "all") params.academicSession = selectedSessionFilter;
      const res = await api.get("/fees/summary", { params });
      setSummary(res.data || res);
    } catch (err) {
      console.error("Failed to load fee summary", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchFeeStructures = async () => {
    setStructuresLoading(true);
    try {
      const res = await api.get("/fees/structures");
      setStructures(res.data || res || []);
    } catch (err) {
      console.error("Failed to load fee structures", err);
    } finally {
      setStructuresLoading(false);
    }
  };

  const fetchVouchers = async () => {
    setVouchersLoading(true);
    try {
      const params = {};
      if (selectedClassFilter !== "all") params.classId = selectedClassFilter;
      if (selectedStatusFilter !== "all") params.status = selectedStatusFilter;
      if (selectedTypeFilter !== "all") params.feeType = selectedTypeFilter;
      if (selectedSortFilter !== "newest") params.sortBy = selectedSortFilter;
      if (selectedDateFilter !== "all") params.dateRange = selectedDateFilter;
      if (selectedBalanceFilter !== "all") params.balanceFilter = selectedBalanceFilter;
      if (selectedSessionFilter !== "all") params.academicSession = selectedSessionFilter;
      if (search) params.search = search;

      const res = await api.get("/fees/vouchers", { params });
      setVouchers(res.vouchers || res.data?.vouchers || []);
    } catch (err) {
      console.error("Failed to load vouchers", err);
    } finally {
      setVouchersLoading(false);
    }
  };

  const resetVoucherFilters = () => {
    setSearch("");
    setSelectedClassFilter("all");
    setSelectedStatusFilter("all");
    setSelectedTypeFilter("all");
    setSelectedSortFilter("newest");
    setSelectedDateFilter("all");
    setSelectedBalanceFilter("all");
    setSelectedSessionFilter(CURRENT_SESSION);
  };

  const hasActiveFilters = 
    search || 
    selectedClassFilter !== "all" || 
    selectedStatusFilter !== "all" || 
    selectedTypeFilter !== "all" || 
    selectedSortFilter !== "newest" || 
    selectedDateFilter !== "all" || 
    selectedBalanceFilter !== "all" ||
    selectedSessionFilter !== "all";

  const fetchClassesAndStudents = async () => {
    try {
      const classesRes = await api.get("/classes?limit=1000").catch((err) => {
        console.error("Error fetching classes:", err);
        return null;
      });
      if (classesRes) {
        const clsArr = Array.isArray(classesRes.data)
          ? classesRes.data
          : Array.isArray(classesRes)
          ? classesRes
          : classesRes.classes || [];
        setClassesList(clsArr);
      }

      const enrollmentsRes = await api
        .get("/enrollments/student-enrollments?limit=1000")
        .catch(() => api.get("/enrollments?limit=1000").catch((err) => {
          console.error("Error fetching enrollments:", err);
          return null;
        }));

      if (enrollmentsRes) {
        const enrollArr = Array.isArray(enrollmentsRes.data)
          ? enrollmentsRes.data
          : Array.isArray(enrollmentsRes)
          ? enrollmentsRes
          : enrollmentsRes.enrollments || [];
        setStudentsList(enrollArr);
      }
    } catch (err) {
      console.error("Failed to load classes or students", err);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchFeeStructures();
    fetchVouchers();
    fetchClassesAndStudents();
  }, []);

  useEffect(() => {
    if (genVoucherOpen) {
      fetchClassesAndStudents();
    }
  }, [genVoucherOpen]);

  useEffect(() => {
    fetchVouchers();
    fetchSummary();
  }, [selectedClassFilter, selectedStatusFilter, selectedTypeFilter, selectedSortFilter, selectedDateFilter, selectedBalanceFilter, selectedSessionFilter, search]);

  // Handle Create Fee Structure
  const handleCreateStructure = async (e) => {
    e.preventDefault();
    setStructSubmitting(true);
    try {
      await api.post("/fees/structures", {
        ...structFormData,
        amount: Number(structFormData.amount),
      });
      toast.success("Fee structure template created successfully!");
      setCreateStructOpen(false);
      setStructFormData({
        name: "",
        feeType: "tuition",
        amount: "",
        frequency: "monthly",
        dueDate: "",
        description: "",
        academicSession: "2025-2026",
      });
      fetchFeeStructures();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to create fee structure");
    } finally {
      setStructSubmitting(false);
    }
  };

  // Select Fee Structure in Generate Modal
  const handleSelectStructureForGen = (structId) => {
    const selected = structures.find((s) => s._id === structId);
    if (selected) {
      setGenFormData((prev) => ({
        ...prev,
        feeStructureId: selected._id,
        title: `${selected.name} - ${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`,
        feeType: selected.feeType,
        amount: selected.amount,
        dueDate: selected.dueDate ? new Date(selected.dueDate).toISOString().split("T")[0] : "",
      }));
    }
  };

  // Handle Generate Vouchers
  const handleGenerateVouchers = async (e) => {
    e.preventDefault();
    setGenSubmitting(true);
    try {
      const payload = {
        title: genFormData.title,
        feeType: genFormData.feeType,
        amount: Number(genFormData.amount),
        dueDate: genFormData.dueDate,
        remarks: genFormData.remarks,
      };

      if (genFormData.feeStructureId) payload.feeStructureId = genFormData.feeStructureId;
      if (genFormData.targetType === "class") payload.classId = genFormData.classId;
      else payload.studentId = genFormData.studentId;

      const res = await api.post("/fees/vouchers/generate", payload);
      toast.success(res.message || "Fee vouchers generated successfully!");
      setGenVoucherOpen(false);
      setGenFormData({
        targetType: "class",
        classId: "",
        studentId: "",
        feeStructureId: "",
        title: "",
        feeType: "tuition",
        amount: "",
        dueDate: "",
        remarks: "",
      });
      fetchVouchers();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to generate vouchers");
    } finally {
      setGenSubmitting(false);
    }
  };

  // Handle Record Payment Submit
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payVoucher) return;

    const amt = Number(payFormData.amount);
    if (amt <= 0 || amt > payVoucher.remainingBalance) {
      toast.error(`Payment amount must be between PKR 1 and PKR ${payVoucher.remainingBalance}`);
      return;
    }

    setPaySubmitting(true);
    try {
      const res = await api.post(`/fees/vouchers/${payVoucher._id}/pay`, {
        amount: amt,
        paymentMethod: payFormData.paymentMethod,
        transactionId: payFormData.transactionId,
        notes: payFormData.notes,
      });

      toast.success("Payment recorded successfully!");
      setPayModalOpen(false);
      setPayFormData({
        amount: "",
        paymentMethod: "cash",
        transactionId: "",
        notes: "",
      });
      setPayVoucher(null);
      fetchVouchers();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to record payment");
    } finally {
      setPaySubmitting(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async (voucherId, voucherNum) => {
    try {
      toast.info("Generating PDF fee voucher…");
      const response = await api.get(`/fees/vouchers/${voucherId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data || response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Voucher_${voucherNum || voucherId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download PDF voucher");
      console.error(err);
    }
  };

  // Vouchers Table Columns
  const voucherColumns = [
    {
      header: "Voucher #",
      accessorKey: "voucherNumber",
      meta: { label: "Voucher #" },
      cell: ({ row }) => (
        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
          {row.original.voucherNumber}
        </span>
      ),
    },
    {
      header: "Student",
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
      header: "Title & Type",
      accessorKey: "title",
      meta: { label: "Title" },
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium text-foreground">{row.original.title}</p>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {row.original.feeType}
          </span>
        </div>
      ),
    },
    {
      header: "Due Date",
      accessorKey: "dueDate",
      meta: { label: "Due Date" },
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          {new Date(row.original.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Total Fee",
      accessorKey: "totalAmount",
      meta: { label: "Total Fee" },
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          PKR {row.original.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Balance Due",
      accessorKey: "remainingBalance",
      meta: { label: "Balance Due" },
      cell: ({ row }) => (
        <span
          className={`text-xs font-semibold ${
            row.original.remainingBalance > 0 ? "text-destructive" : "text-success"
          }`}
        >
          PKR {row.original.remainingBalance.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      meta: { label: "Status" },
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: "Actions",
      accessorKey: "_id",
      meta: { label: "Actions" },
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setSelectedVoucher(row.original);
              setViewVoucherOpen(true);
            }}
          >
            <Eye size={12} className="mr-1" aria-hidden="true" /> View
          </Button>

          {row.original.remainingBalance > 0 && (
            <Button
              size="sm"
              className="h-7 bg-success px-2.5 text-xs font-semibold text-success-foreground hover:bg-success/90"
              onClick={() => {
                setPayVoucher(row.original);
                setPayFormData((prev) => ({
                  ...prev,
                  amount: row.original.remainingBalance.toString(),
                }));
                setPayModalOpen(true);
              }}
            >
              <CheckCircle2 size={12} className="mr-1" aria-hidden="true" /> Mark as Paid
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => handleDownloadPDF(row.original._id, row.original.voucherNumber)}
            title="Download PDF Voucher"
            aria-label={`Download PDF for voucher ${row.original.voucherNumber}`}
          >
            <Download size={14} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  // Fee Structure Table Columns
  const structColumns = [
    {
      header: "Structure Name",
      accessorKey: "name",
      meta: { label: "Name" },
      cell: ({ row }) => <span className="text-xs font-semibold text-foreground">{row.original.name}</span>,
    },
    {
      header: "Fee Type",
      accessorKey: "feeType",
      meta: { label: "Fee Type" },
      cell: ({ row }) => (
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold capitalize text-muted-foreground">
          {row.original.feeType}
        </span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      meta: { label: "Amount" },
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-success">
          PKR {row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Frequency",
      accessorKey: "frequency",
      meta: { label: "Frequency" },
      cell: ({ row }) => <span className="text-xs font-medium capitalize text-muted-foreground">{row.original.frequency}</span>,
    },
    {
      header: "Academic Session",
      accessorKey: "academicSession",
      meta: { label: "Session" },
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.academicSession}</span>,
    },
    {
      header: "Status",
      accessorKey: "isActive",
      meta: { label: "Status" },
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  // Revenue collection rate calculation
  const totalExp = summary?.totalExpected || 1;
  const collectedPct = Math.min(100, Math.round(((summary?.totalCollected || 0) / totalExp) * 100));

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Page Header with Primary Actions */}
      <PageHeader
        eyebrow="Fees"
        title="Fee Management Hub"
        subtitle="Campus financial operations: Generate vouchers, record payments, and monitor collection rate."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateStructOpen(true)}
              className="text-xs font-medium"
            >
              <Plus size={14} className="mr-1.5 text-primary" aria-hidden="true" />
              Add Structure
            </Button>

            <Button
              size="sm"
              onClick={() => setGenVoucherOpen(true)}
              className="text-xs font-semibold"
            >
              <Sparkles size={14} className="mr-1.5" aria-hidden="true" />
              Generate Vouchers
            </Button>
          </div>
        }
      />

      {/* Main Streamlined Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-border/60 pb-2">
          <TabsList className="rounded-xl bg-muted/40 p-1">
            <TabsTrigger value="vouchers" className="px-4 py-2 text-xs font-semibold">
              <CreditCard size={14} className="mr-1.5 text-primary" aria-hidden="true" />
              Vouchers ({vouchers.length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="px-4 py-2 text-xs font-semibold">
              <FileText size={14} className="mr-1.5 text-primary" aria-hidden="true" />
              Fee Templates ({structures.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: VOUCHERS & PAYMENTS DIRECTORY */}
        <TabsContent value="vouchers" className="space-y-6 m-0">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={DollarSign}
              tone="primary"
              label="Expected Revenue"
              value={`PKR ${(summary?.totalExpected || 0).toLocaleString()}`}
              hint={`${summary?.totalVouchers || vouchers.length} total active vouchers`}
            />
            <StatCard
              icon={CheckCircle2}
              tone="success"
              label="Collected Revenue"
              value={`PKR ${(summary?.totalCollected || 0).toLocaleString()}`}
              hint={`Cleared cash & bank deposits (${collectedPct}% collection rate)`}
            />
            <StatCard
              icon={Clock}
              tone="warning"
              label="Outstanding Balance"
              value={`PKR ${(summary?.totalOutstanding || 0).toLocaleString()}`}
              hint="Pending & partial remaining balance"
            />
            <StatCard
              icon={AlertCircle}
              tone="danger"
              label="Overdue Amount"
              value={`PKR ${(summary?.totalOverdue || 0).toLocaleString()}`}
              hint={`${summary?.counts?.overdue || 0} vouchers past due date`}
            />
          </div>

          {/* Vouchers Table & Interactive Filters */}
          <Card>
            <CardHeader className="border-b border-border/60 bg-muted/30 px-6 py-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold">Issued Student Vouchers</CardTitle>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {vouchers.length} Records
                    </Badge>
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetVoucherFilters}
                      className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <RotateCcw size={12} className="mr-1.5" aria-hidden="true" />
                      Reset Filters
                    </Button>
                  )}
                </div>

                {/* Filters Grid Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-7 gap-2">
                  {/* Search Input */}
                  <div className="col-span-2 relative sm:col-span-1 md:col-span-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      placeholder="Search student, roll #, title…"
                      aria-label="Search vouchers"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8 text-xs font-medium"
                    />
                  </div>

                  {/* Class Filter */}
                  <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                    <SelectTrigger className="h-8 text-xs font-medium" aria-label="Filter by class">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classesList.map((c) => {
                        const cId = (c._id || c.id || "").toString();
                        if (!cId) return null;
                        return (
                          <SelectItem key={cId} value={cId}>
                            Grade {c.grade ?? "N/A"} {c.section ? `(${c.section})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                    <SelectTrigger className="h-8 text-xs font-medium" aria-label="Filter by status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Fee Type Filter */}
                  <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                    <SelectTrigger className="h-8 text-xs font-medium" aria-label="Filter by fee type">
                      <SelectValue placeholder="Fee Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="tuition">Tuition</SelectItem>
                      <SelectItem value="admission">Admission</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="miscellaneous">Misc</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By Filter */}
                  <Select value={selectedSortFilter} onValueChange={setSelectedSortFilter}>
                    <SelectTrigger className="h-8 text-xs font-medium" aria-label="Sort vouchers">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="dueDateAsc">Due Date (Earliest)</SelectItem>
                      <SelectItem value="dueDateDesc">Due Date (Latest)</SelectItem>
                      <SelectItem value="amountHigh">Amount (High to Low)</SelectItem>
                      <SelectItem value="amountLow">Amount (Low to High)</SelectItem>
                      <SelectItem value="balanceHigh">Balance (High to Low)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Session Filter */}
                  <Select value={selectedSessionFilter} onValueChange={setSelectedSessionFilter}>
                    <SelectTrigger className="h-8 text-xs font-medium" aria-label="Filter by session">
                      <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="2024-2025">2024–2025</SelectItem>
                      <SelectItem value="2025-2026">2025–2026</SelectItem>
                      <SelectItem value="2026-2027">2026–2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {vouchersLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <DataTable
                  data={vouchers}
                  columns={voucherColumns}
                  hideColumnsOnMobile={["totalAmount"]}
                  emptyState={{
                    icon: CreditCard,
                    title: "No vouchers found",
                    description: hasActiveFilters
                      ? "No vouchers match the current filters. Try resetting them or generate a new batch."
                      : "No fee vouchers have been issued yet. Generate a batch to get started.",
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: FEE STRUCTURE TEMPLATES */}
        <TabsContent value="templates" className="space-y-4 m-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-6 py-4">
              <div>
                <CardTitle className="text-base font-bold">Fee Structure Templates</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Templates used for generating single and bulk student vouchers.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setCreateStructOpen(true)}
                className="text-xs font-medium"
              >
                <Plus size={14} className="mr-1" aria-hidden="true" /> Add Template
              </Button>
            </CardHeader>
            <CardContent>
              {structuresLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <DataTable
                  data={structures}
                  columns={structColumns}
                  hideColumnsOnMobile={["frequency", "academicSession"]}
                  emptyState={{
                    icon: FileText,
                    title: "No fee structures yet",
                    description: "Create a template to define reusable fee rates for voucher generation.",
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: CREATE FEE STRUCTURE TEMPLATE */}
      <Dialog open={createStructOpen} onOpenChange={setCreateStructOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus size={18} className="text-primary" aria-hidden="true" /> Create Fee Structure Template
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateStructure} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="struct-name" className="text-xs font-semibold">Structure Name</Label>
              <Input
                id="struct-name"
                placeholder="e.g. Monthly Tuition Fee 2026"
                value={structFormData.name}
                onChange={(e) => setStructFormData({ ...structFormData, name: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="struct-fee-type" className="text-xs font-semibold">Fee Type</Label>
                <Select
                  value={structFormData.feeType}
                  onValueChange={(v) => setStructFormData({ ...structFormData, feeType: v })}
                >
                  <SelectTrigger id="struct-fee-type" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="admission">Admission</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="struct-amount" className="text-xs font-semibold">Amount (PKR)</Label>
                <Input
                  id="struct-amount"
                  type="number"
                  placeholder="5000"
                  value={structFormData.amount}
                  onChange={(e) => setStructFormData({ ...structFormData, amount: e.target.value })}
                  required
                  min="1"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="struct-frequency" className="text-xs font-semibold">Billing Frequency</Label>
                <Select
                  value={structFormData.frequency}
                  onValueChange={(v) => setStructFormData({ ...structFormData, frequency: v })}
                >
                  <SelectTrigger id="struct-frequency" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="termly">Termly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="one_time">One-Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="struct-session" className="text-xs font-semibold">Academic Session</Label>
                <Input
                  id="struct-session"
                  placeholder="2025-2026"
                  value={structFormData.academicSession}
                  onChange={(e) => setStructFormData({ ...structFormData, academicSession: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="struct-description" className="text-xs font-semibold">Description / Notes</Label>
              <Input
                id="struct-description"
                placeholder="Optional notes regarding this fee rate"
                value={structFormData.description}
                onChange={(e) => setStructFormData({ ...structFormData, description: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateStructOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={structSubmitting}>
                {structSubmitting ? <Loader2 size={14} className="animate-spin mr-1" aria-hidden="true" /> : <Plus size={14} className="mr-1" aria-hidden="true" />} Save Structure
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: GENERATE VOUCHERS */}
      <Dialog open={genVoucherOpen} onOpenChange={setGenVoucherOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" aria-hidden="true" /> Generate Student Fee Vouchers
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGenerateVouchers} className="space-y-4 py-2">
            {structures.length > 0 && (
              <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl border border-border/60">
                <Label htmlFor="gen-template" className="text-xs font-bold text-primary">Load from Fee Structure Template (Optional)</Label>
                <Select onValueChange={handleSelectStructureForGen}>
                  <SelectTrigger id="gen-template" className="h-9 text-xs bg-card"><SelectValue placeholder="-- Select Template --" /></SelectTrigger>
                  <SelectContent>
                    {structures.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name} — PKR {s.amount.toLocaleString()} ({s.feeType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gen-target-type" className="text-xs font-semibold">Target Audience</Label>
                <Select
                  value={genFormData.targetType}
                  onValueChange={(v) => setGenFormData({ ...genFormData, targetType: v })}
                >
                  <SelectTrigger id="gen-target-type" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Whole Class (Bulk)</SelectItem>
                    <SelectItem value="student">Single Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {genFormData.targetType === "class" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="gen-class" className="text-xs font-semibold">Select Class</Label>
                  <Select
                    value={genFormData.classId}
                    onValueChange={(v) => setGenFormData({ ...genFormData, classId: v })}
                  >
                    <SelectTrigger id="gen-class" className="h-9 text-xs"><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>
                      {classesList.map((c) => {
                        const cId = (c._id || c.id || "").toString();
                        if (!cId) return null;
                        return (
                          <SelectItem key={cId} value={cId}>
                            Grade {c.grade ?? "N/A"} {c.section ? `(${c.section})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="gen-student" className="text-xs font-semibold">Select Student</Label>
                  <Select
                    value={genFormData.studentId}
                    onValueChange={(v) => setGenFormData({ ...genFormData, studentId: v })}
                  >
                    <SelectTrigger id="gen-student" className="h-9 text-xs"><SelectValue placeholder="Select Student" /></SelectTrigger>
                    <SelectContent>
                      {studentsList.map((e) => {
                        const sId = (e.student?._id || e.student || e._id || "").toString();
                        const sName = e.student?.name || e.name || "Student";
                        const roll = e.rollNumber || e.enrollmentId || "N/A";
                        if (!sId) return null;
                        return (
                          <SelectItem key={sId} value={sId}>
                            {sName} (Roll: {roll})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gen-title" className="text-xs font-semibold">Voucher Title</Label>
              <Input
                id="gen-title"
                placeholder="e.g. Monthly Tuition Fee - August 2026"
                value={genFormData.title}
                onChange={(e) => setGenFormData({ ...genFormData, title: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gen-fee-type" className="text-xs font-semibold">Fee Type</Label>
                <Select
                  value={genFormData.feeType}
                  onValueChange={(v) => setGenFormData({ ...genFormData, feeType: v })}
                >
                  <SelectTrigger id="gen-fee-type" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="admission">Admission</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="miscellaneous">Misc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gen-amount" className="text-xs font-semibold">Amount (PKR)</Label>
                <Input
                  id="gen-amount"
                  type="number"
                  placeholder="5000"
                  value={genFormData.amount}
                  onChange={(e) => setGenFormData({ ...genFormData, amount: e.target.value })}
                  required
                  min="1"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gen-due-date" className="text-xs font-semibold">Due Date</Label>
                <Input
                  id="gen-due-date"
                  type="date"
                  value={genFormData.dueDate}
                  onChange={(e) => setGenFormData({ ...genFormData, dueDate: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setGenVoucherOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={genSubmitting}>
                {genSubmitting ? <Loader2 size={14} className="animate-spin mr-1" aria-hidden="true" /> : <Sparkles size={14} className="mr-1" aria-hidden="true" />} Generate Vouchers
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: RECORD PAYMENT */}
      {payVoucher && (
        <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success" aria-hidden="true" /> Mark Fee as Paid
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50 space-y-1 text-xs">
                <p className="font-bold text-foreground">Voucher #{payVoucher.voucherNumber}</p>
                <p className="text-muted-foreground">Student: <strong className="text-foreground">{payVoucher.student?.name}</strong></p>
                <div className="flex justify-between pt-1 mt-1 font-semibold text-destructive border-t">
                  <span>Remaining Balance:</span>
                  <span>PKR {payVoucher.remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pay-amount" className="text-xs font-semibold">Payment Amount (PKR)</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={payFormData.amount}
                    onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
                    required
                    min="1"
                    max={payVoucher.remainingBalance}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pay-method" className="text-xs font-semibold">Payment Method</Label>
                  <Select
                    value={payFormData.paymentMethod}
                    onValueChange={(v) => setPayFormData({ ...payFormData, paymentMethod: v })}
                  >
                    <SelectTrigger id="pay-method" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online / Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-transaction" className="text-xs font-semibold">Transaction / Ref ID (Optional)</Label>
                <Input
                  id="pay-transaction"
                  placeholder="e.g. TXN-998823"
                  value={payFormData.transactionId}
                  onChange={(e) => setPayFormData({ ...payFormData, transactionId: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={paySubmitting} className="bg-success font-semibold text-success-foreground hover:bg-success/90">
                  {paySubmitting ? <Loader2 size={14} className="animate-spin mr-1" aria-hidden="true" /> : <CheckCircle2 size={14} className="mr-1" aria-hidden="true" />} Mark as Paid
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: VIEW VOUCHER DETAILS */}
      {selectedVoucher && (
        <Dialog open={viewVoucherOpen} onOpenChange={setViewVoucherOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="text-base font-bold">Voucher #{selectedVoucher.voucherNumber}</DialogTitle>
                {getStatusBadge(selectedVoucher.status)}
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="bg-muted/30 p-3 rounded-xl border space-y-1 text-xs">
                <p className="font-bold text-foreground text-sm">{selectedVoucher.title}</p>
                <p className="text-muted-foreground">Fee Type: <span className="uppercase font-semibold">{selectedVoucher.feeType}</span></p>
                <p className="text-muted-foreground">Issue Date: {new Date(selectedVoucher.issueDate).toLocaleDateString()}</p>
                <p className="text-muted-foreground font-semibold">Due Date: {new Date(selectedVoucher.dueDate).toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 text-center border rounded-xl bg-card shadow-2xs">
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase">Total Fee</p>
                  <p className="font-bold text-foreground">PKR {selectedVoucher.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase">Paid</p>
                  <p className="font-bold text-success">PKR {selectedVoucher.paidAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase">Remaining</p>
                  <p className="font-bold text-destructive">PKR {selectedVoucher.remainingBalance.toLocaleString()}</p>
                </div>
              </div>

              {selectedVoucher.payments && selectedVoucher.payments.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-bold text-xs text-foreground uppercase tracking-wider">Payment Transactions</p>
                  <div className="border rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted text-muted-foreground font-semibold">
                        <tr>
                          <th scope="col" className="p-2">Date</th>
                          <th scope="col" className="p-2">Method</th>
                          <th scope="col" className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedVoucher.payments.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td className="p-2 uppercase font-medium">{p.paymentMethod}</td>
                            <td className="p-2 text-right font-semibold text-success">
                              PKR {p.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No payment transactions recorded for this voucher yet.</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="font-semibold"
                onClick={() => handleDownloadPDF(selectedVoucher._id, selectedVoucher.voucherNumber)}
              >
                <Download size={14} className="mr-1.5" aria-hidden="true" />
                Download PDF
              </Button>
              <Button size="sm" onClick={() => setViewVoucherOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FeeManagement;
