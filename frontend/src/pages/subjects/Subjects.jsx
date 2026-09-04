import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/services/subjectService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const Subjects = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super-admin";

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState({ name: "", code: "" });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await getSubjects();
      setSubjects(Array.isArray(res) ? res : res.data || []);
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openAdd = () => {
    setEditingSubject(null);
    setForm({ name: "", code: "" });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditingSubject(s);
    setForm({ name: s.name || "", code: s.code || "" });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject._id, form);
        toast.success("Subject updated");
      } else {
        await createSubject(form);
        toast.success("Subject created");
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSubject(deleteTarget._id);
      toast.success("Subject deleted");
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete subject");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedSubjects.length) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedSubjects.map((s) => deleteSubject(s._id)));
      toast.success(`${selectedSubjects.length} subjects deleted`);
      setSelectedSubjects([]);
      setBulkConfirmOpen(false);
      fetchSubjects();
    } catch {
      toast.error("Failed to delete some subjects");
    } finally {
      setBulkDeleting(false);
    }
  };

  const filtered = subjects.filter((s) =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Subject Name",
      accessorKey: "name",
      meta: { label: "Subject Name" },
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="rounded bg-primary/10 p-1.5">
            <BookOpen size={14} className="text-primary" aria-hidden="true" />
          </div>
          <span className="font-medium text-foreground">{info.getValue()}</span>
        </div>
      ),
    },
    {
      header: "Code",
      accessorKey: "code",
      meta: { label: "Code" },
      cell: (info) => (
        <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
          {info.getValue() || "—"}
        </span>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            header: "Actions",
            id: "actions",
            enableSorting: false,
            meta: { label: "Actions" },
            cell: ({ row }) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(row.original)}
                  aria-label={`Edit ${row.original.name}`}
                  title="Edit"
                >
                  <Pencil size={14} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(row.original)}
                  aria-label={`Delete ${row.original.name}`}
                  title="Delete"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Subjects"
        subtitle={`${subjects.length} subjects available`}
        actions={
          isSuperAdmin && (
            <>
              {selectedSubjects.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setBulkConfirmOpen(true)} disabled={bulkDeleting}>
                  <Trash2 size={14} className="mr-1.5" aria-hidden="true" />
                  Delete Selected ({selectedSubjects.length})
                </Button>
              )}
              <Button size="sm" onClick={openAdd}>
                <Plus size={14} className="mr-1.5" aria-hidden="true" />
                Add Subject
              </Button>
            </>
          )
        }
      />

      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="text-base min-w-max">All Subjects</CardTitle>
            <div className="relative ml-auto w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search subjects..."
                aria-label="Search subjects"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects yet"
              description={isSuperAdmin ? "Get started by creating your first subject." : "Subjects will appear here once they are added."}
              action={
                isSuperAdmin && (
                  <Button onClick={openAdd}>
                    <Plus size={14} className="mr-1.5" aria-hidden="true" />
                    Add First Subject
                  </Button>
                )
              }
            />
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              selectable={isSuperAdmin}
              onSelectionChange={setSelectedSubjects}
              emptyState={{
                title: "No subjects found",
                description: "No subjects match your current search.",
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="subject-name">Subject Name *</Label>
              <Input
                id="subject-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subject-code">Subject Code</Label>
              <Input
                id="subject-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. MATH101"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingSubject ? "Save Changes" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Subject"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect related classes and exams.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title="Delete Selected Subjects"
        description={`Are you sure you want to delete ${selectedSubjects.length} subjects? This may affect related classes and exams.`}
        confirmLabel={`Delete ${selectedSubjects.length} Subjects`}
        onConfirm={handleBulkDelete}
        loading={bulkDeleting}
      />
    </div>
  );
};

export default Subjects;
