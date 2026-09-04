import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, MapPin, Users, UserCog, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { DataTable } from "../../components/ui/DataTable";
import api from "../../utils/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EditCampusModal from "./EditCampusModal";
import { Button } from "@/components/ui/button";
import { Plus, Building } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Campus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super-admin";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    totalCampuses: 0,
    inActiveCampuses: 0,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/campuses");
      const resData = response.data || response;

      setStats({
        totalCampuses: resData.totalCampuses || 0,
        inActiveCampuses: resData.inActiveCampuses || 0,
      });

      setData(resData.campuses || []);
    } catch (error) {
      console.error("Failed to fetch campuses:", error);
      toast.error("Failed to load campuses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (campus) => {
    try {
      const newActive = !campus.isActive;
      await api.patch(`/campuses/${campus._id}`, { isActive: newActive });
      toast.success(`Campus ${newActive ? "activated" : "deactivated"}`);
      fetchCampuses();
    } catch {
      toast.error("Failed to update campus status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.post(`/campuses/${deleteTarget._id}/delete`);
      toast.success("Campus deleted");
      setDeleteTarget(null);
      fetchCampuses();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete campus");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter((c) => {
    // Status filter
    if (statusFilter === "active" && c.isActive === false) return false;
    if (statusFilter === "inactive" && c.isActive !== false) return false;
    // Search filter
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.campusAdmin?.name?.toLowerCase().includes(q)
    );
  });

  // Define DataTable columns
  const columns = [
    {
      header: "Campus Name",
      accessorKey: "name",
      meta: { label: "Campus Name" },
      cell: (info) => (
        <button
          onClick={() => navigate(`/admin/campuses/${info.row.original._id}`)}
          className="font-medium text-primary hover:underline"
        >
          {info.getValue()}
        </button>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      meta: { label: "Status" },
      cell: (info) => {
        const active = info.getValue() !== false;
        return (
          <Badge variant={active ? "success" : "secondary"}>
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      header: "City",
      accessorKey: "city",
      meta: { label: "City" },
      cell: (info) => (
        <span className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin size={14} className="text-muted-foreground" aria-hidden="true" />
          {info.getValue()}
        </span>
      ),
    },
    {
      header: "Admin",
      accessorKey: "campusAdmin.name",
      meta: { label: "Admin" },
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.campusAdmin?.name || "Unassigned"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.campusAdmin?.email || "—"}
          </p>
        </div>
      ),
    },
    { header: "Classes", accessorKey: "classCount", meta: { label: "Classes" } },
    { header: "Teachers", accessorKey: "teacherCount", meta: { label: "Teachers" } },
    { header: "Students", accessorKey: "studentCount", meta: { label: "Students" } },
    ...(isSuperAdmin
      ? [
          {
            id: "actions",
            header: "Actions",
            meta: { label: "Actions" },
            cell: ({ row }) => {
              const campus = row.original;
              const isActive = campus.isActive !== false;
              return (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(campus)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    title={isActive ? "Deactivate campus" : "Activate campus"}
                    aria-label={isActive ? "Deactivate campus" : "Activate campus"}
                  >
                    {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <EditCampusModal campus={campus} onUpdated={fetchCampuses} />
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(campus)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete campus"
                    aria-label="Delete campus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Page Header */}
      <PageHeader
        title="Campus Overview"
        subtitle="View, manage, and navigate to campus details."
        actions={
          isSuperAdmin && (
            <Button size="sm" onClick={() => navigate("/admin/campuses/add")}>
              <Plus size={14} className="mr-1.5" aria-hidden="true" />
              Add Campus
            </Button>
          )
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Campuses"
          value={stats.totalCampuses}
          tone="primary"
        />
        <StatCard
          icon={UserCog}
          label="Inactive Campuses"
          value={stats.inActiveCampuses}
          tone="danger"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value={data.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
          tone="success"
        />
        <StatCard
          icon={UserCog}
          label="Total Teachers"
          value={data.reduce((sum, c) => sum + (c.teacherCount || 0), 0)}
          tone="info"
        />
      </div>

      {/* Campus Table */}
      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="text-base min-w-max">Campus List</CardTitle>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search by name, city, admin..."
                  aria-label="Search campuses"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Building}
              title={data.length === 0 ? "No campuses yet" : "No campuses match your filters"}
              description={
                data.length === 0
                  ? "Get started by creating your first campus."
                  : "Try adjusting your search or status filter."
              }
              action={
                isSuperAdmin && data.length === 0 && (
                  <Button onClick={() => navigate("/admin/campuses/add")}>
                    <Plus size={14} className="mr-1.5" aria-hidden="true" />
                    Create Campus
                  </Button>
                )
              }
            />
          ) : (
            <DataTable data={filtered} columns={columns} hideColumnsOnMobile={["classCount", "teacherCount", "studentCount"]} />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Campus"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
        variant="destructive"
      />
    </div>
  );
};

export default Campus;
