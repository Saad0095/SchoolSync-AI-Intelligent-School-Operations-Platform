import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, ChevronRight, GraduationCap, Users, BookOpen, CheckCircle2, Search, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getClasses, deleteClass } from "@/services/classService";
import { AddClassModal } from "@/components/class/AddClassModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";

const Class = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingClass, setEditingClass] = useState(null);
  const limit = 10;

  const canManage = ["super-admin", "campus-admin"].includes(user?.role);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await getClasses({ page, limit });
      setClasses(res.data || []);
      setCount(res.count || 0);
    } catch {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClass(deleteTarget._id);
      toast.success("Class deleted");
      setDeleteTarget(null);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete class");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (cls, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingClass(cls);
    setModalOpen(true);
  };

  const openDelete = (cls, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDeleteTarget(cls);
  };

  const filtered = classes.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.grade?.toString().toLowerCase().includes(q) ||
      c.section?.toLowerCase().includes(q) ||
      c.campusName?.toLowerCase().includes(q) ||
      c.classTeacherName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Classes"
        subtitle={`${count} total classes`}
        actions={
          ["super-admin", "campus-admin"].includes(user?.role) && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={14} className="mr-1.5" aria-hidden="true" />
              Add Class
            </Button>
          )
        }
      />

      {/* Stat Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Total Classes"
          value={count}
          tone="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="With Class Teacher"
          value={classes.filter((c) => c.classTeacherName).length}
          tone="success"
        />
        <StatCard
          icon={BookOpen}
          label="Subjects"
          value={classes.reduce((acc, c) => acc + (c.subjects || 0), 0)}
          tone="info"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value={classes.reduce((acc, c) => acc + (c.studentsCount || 0), 0)}
          tone="warning"
        />
      </div>

      {/* Search bar */}
      <div className="relative w-full max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Search by grade, section, campus, teacher..."
          aria-label="Search classes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Class Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={search ? "No classes match your search" : "No classes yet"}
          description={
            search
                  ? "Try a different grade, section, campus, or teacher name."
                  : "Get started by creating your first class."
          }
          action={
            !search && ["super-admin", "campus-admin"].includes(user?.role) && (
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={14} className="mr-1.5" aria-hidden="true" />
                Create First Class
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link
              key={c._id}
              to={`/admin/classes/${c._id}`}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={`View Grade ${c.grade} ${c.section} details`}
            >
              <Card className="h-full border transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary transition-transform duration-200 group-hover:scale-105">
                      {c.grade}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Grade {c.grade} — {c.section}
                      </h3>
                      <p className="text-xs text-muted-foreground">{c.campusName || "—"}</p>
                    </div>
                  </div>
                  {canManage ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => openEdit(c, e)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label={`Edit Grade ${c.grade} ${c.section}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openDelete(c, e)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete Grade ${c.grade} ${c.section}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <ChevronRight
                      size={16}
                      className="mt-1 text-muted-foreground/50 transition-colors group-hover:text-primary"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-primary" aria-hidden="true" />
                    <span>{c.studentsCount ?? 0} students</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={12} className="text-success" aria-hidden="true" />
                    <span>{c.subjects ?? 0} subjects</span>
                  </div>
                </div>

                {c.classTeacherName && (
                  <div className="mt-2">
                    <Badge variant="success" className="text-xs font-normal">
                      Teacher: {c.classTeacherName}
                    </Badge>
                  </div>
                )}
              </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {count > limit && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(count / limit)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= count}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AddClassModal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) setEditingClass(null); }}
        onSuccess={fetchClasses}
        initialData={editingClass}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Class"
        description={`Delete Grade ${deleteTarget?.grade} - ${deleteTarget?.section}? All enrollments will be affected.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
        variant="destructive"
      />
    </div>
  );
};

export default Class;
