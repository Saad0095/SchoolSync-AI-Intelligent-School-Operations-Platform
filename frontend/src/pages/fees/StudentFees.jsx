import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../utils/api";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { DataTable } from "../../components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
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

const StudentFees = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchMyVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/fees/vouchers");
      setVouchers(res.vouchers || res.data?.vouchers || []);
    } catch (err) {
      console.error("Failed to load fee vouchers", err);
      toast.error("Failed to load fee vouchers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVouchers();
  }, []);

  const handleDownloadPDF = async (voucherId, voucherNum) => {
    try {
      toast.info("Generating fee voucher PDF…");
      const response = await api.get(`/fees/vouchers/${voucherId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data || response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `My_Voucher_${voucherNum || voucherId}.pdf`);
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

  // Metrics
  const totalOutstanding = vouchers.reduce((sum, v) => sum + (v.remainingBalance || 0), 0);
  const totalPaid = vouchers.reduce((sum, v) => sum + (v.paidAmount || 0), 0);
  const overdueCount = vouchers.filter((v) => v.status === "overdue").length;

  const filteredVouchers = vouchers.filter((v) => {
    if (statusFilter !== "all" && (v.status || "pending").toLowerCase() !== statusFilter) return false;
    if (feeTypeFilter !== "all" && (v.feeType || "").toLowerCase() !== feeTypeFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      v.title?.toLowerCase().includes(q) ||
      v.voucherNumber?.toLowerCase().includes(q) ||
      v.feeType?.toLowerCase().includes(q)
    );
  });

  const columns = [
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
      header: "Description / Title",
      accessorKey: "title",
      meta: { label: "Description" },
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-semibold text-foreground">{row.original.title}</p>
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
      header: "Paid Amount",
      accessorKey: "paidAmount",
      meta: { label: "Paid" },
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-success">
          PKR {row.original.paidAmount.toLocaleString()}
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
              setViewModalOpen(true);
            }}
          >
            <Eye size={12} className="mr-1" aria-hidden="true" /> Details
          </Button>

          <Button
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => handleDownloadPDF(row.original._id, row.original.voucherNumber)}
          >
            <Download size={12} className="mr-1" aria-hidden="true" /> PDF
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader
        eyebrow="Fees"
        title="My Fee Vouchers & Payment History"
        subtitle="View your personal fee vouchers, cleared payments, remaining balance due, and download official PDF receipts."
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Clock}
          tone="danger"
          label="Outstanding Balance"
          value={`PKR ${totalOutstanding.toLocaleString()}`}
          hint="Current remaining fee balance"
        />
        <StatCard
          icon={CheckCircle2}
          tone="success"
          label="Total Paid"
          value={`PKR ${totalPaid.toLocaleString()}`}
          hint="Cleared payments to date"
        />
        <StatCard
          icon={AlertCircle}
          tone="warning"
          label="Overdue Vouchers"
          value={overdueCount}
          hint="Vouchers past due date"
        />
      </div>

      {/* Vouchers Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard size={18} className="text-primary" aria-hidden="true" /> Issued Fee Vouchers
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search title or voucher #…"
                  aria-label="Search fee vouchers"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs font-medium"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-xs font-medium" aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
                <SelectTrigger className="w-32 h-8 text-xs font-medium" aria-label="Filter by fee type"><SelectValue placeholder="Fee Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Types</SelectItem>
                  <SelectItem value="tuition">Tuition</SelectItem>
                  <SelectItem value="admission">Admission</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="miscellaneous">Misc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              data={filteredVouchers}
              columns={columns}
              hideColumnsOnMobile={["totalAmount"]}
              emptyState={{
                icon: CreditCard,
                title: "No fee vouchers found",
                description:
                  vouchers.length > 0
                    ? "No vouchers match your current search or filters."
                    : "You currently have no issued fee vouchers.",
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* MODAL: DETAILS */}
      {selectedVoucher && (
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
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
              <Button size="sm" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StudentFees;
