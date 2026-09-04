import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Sparkles, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getExams, createExam, updateExam, deleteExam } from "@/services/examService";
import { getClasses } from "@/services/classService";
import { getSubjects } from "@/services/subjectService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { DataTable } from "@/components/ui/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { TERMS, SESSIONS, CURRENT_TERM, CURRENT_SESSION } from "@/components/shared/TermSessionFilter";

const EXAM_TYPES = [
  "Examination",
  "Assessment",
  "Quiz",
  "Homework",
  "Classwork",
  "Practical",
  "Notebook",
];

const EMPTY_FORM = {
  type: "",
  totalMarks: "",
  classId: "",
  subjectId: "",
  term: "FirstTerm",
  academicSession: "2025-2026",
};

const Exams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ["super-admin", "campus-admin"].includes(user?.role);

  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [filterClass, setFilterClass] = useState("all");
  const [filterTerm, setFilterTerm] = useState(CURRENT_TERM);
  const [filterSession, setFilterSession] = useState(CURRENT_SESSION);
  const [filterSubject, setFilterSubject] = useState("all");
  const [examSearch, setExamSearch] = useState("");
  
  const [selectedExams, setSelectedExams] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [examRes, classRes, subjectRes] = await Promise.all([
        getExams({ limit: 100 }),
        getClasses({ limit: 100 }),
        getSubjects(),
      ]);

      // Backend returns grouped: { data: [{ _id, class, subjects: [{ _id, subject, exams: [...] }] }] }
      // Flatten into a simple array of exam objects
      const rawData = examRes?.data || examRes || [];
      let flatExams = [];

      if (Array.isArray(rawData) && rawData.length > 0) {
        // Check if data is already flat (has .type field) or grouped (has .subjects field)
        if (rawData[0]?.subjects) {
          // Grouped structure — flatten it
          rawData.forEach((classGroup) => {
            const classParts = (classGroup.class || "").trim().split(/\s+/);
            const classInfo = { _id: classGroup._id };
            
            if (classParts.length >= 2) {
              classInfo.grade = classParts[0];
              classInfo.section = classParts.slice(1).join(" ");
            } else {
              classInfo.grade = classGroup.class || "?";
              classInfo.section = "";
            }

            (classGroup.subjects || []).forEach((subjectGroup) => {
              (subjectGroup.exams || []).forEach((exam) => {
                flatExams.push({
                  _id: exam._id,
                  type: exam.type,
                  totalMarks: exam.totalMarks,
                  term: exam.term,
                  academicSession: exam.academicSession,
                  class: { _id: classGroup._id, grade: classInfo.grade, section: classInfo.section },
                  subject: { _id: subjectGroup._id, name: subjectGroup.subject },
                  campus: exam.campus,
                });
              });
            });
          });
        } else {
          // Already flat
          flatExams = rawData;
        }
      }

      setExams(flatExams);
      setClasses(classRes.data || []);
      setSubjects(Array.isArray(subjectRes) ? subjectRes : subjectRes.data || []);
    } catch {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAdd = () => {
    setEditingExam(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (exam) => {
    setEditingExam(exam);
    setForm({
      type: exam.type || "",
      totalMarks: exam.totalMarks || "",
      classId: exam.class?._id || exam.class || "",
      subjectId: exam.subject?._id || exam.subject || "",
      term: exam.term || "FirstTerm",
      academicSession: exam.academicSession || "2025-2026",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        totalMarks: Number(form.totalMarks),
        classId: form.classId,
        subjectId: form.subjectId,
        term: form.term,
        academicSession: form.academicSession,
      };
      // Backend requires campusId for create — derive from selected class if available
      if (!editingExam) {
        const selectedClass = classes.find((c) => c._id === form.classId);
        if (selectedClass?.campusName) {
          // campusId might not be on the aggregated class, so we may need it from context
        }
      }
      if (editingExam) {
        await updateExam(editingExam._id, payload);
        toast.success("Exam updated");
      } else {
        await createExam(payload);
        toast.success("Exam created");
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExam(deleteTarget._id);
      toast.success("Exam deleted");
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete exam");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedExams.length) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedExams.map((e) => deleteExam(e._id)));
      toast.success(`${selectedExams.length} exams deleted successfully`);
      setSelectedExams([]);
      setBulkConfirmOpen(false);
      fetchAll();
    } catch (err) {
      toast.error("Failed to delete some exams");
    } finally {
      setBulkDeleting(false);
    }
  };

  const termVariants = {
    FirstTerm: "info",
    SecondTerm: "ai",
    MidTerm: "warning",
    FinalTerm: "success",
  };

  const filtered = exams.filter((e) => {
    const classId = e.class?._id || e.class;
    const term = e.term;
    const session = e.academicSession;
    const subjectId = e.subject?._id || e.subject;
    if (filterClass !== "all" && classId !== filterClass) return false;
    if (filterTerm !== "all" && term !== filterTerm) return false;
    if (filterSession !== "all" && session !== filterSession) return false;
    if (filterSubject !== "all" && subjectId !== filterSubject) return false;
    if (examSearch.trim()) {
      const q = examSearch.toLowerCase();
      const typeMatch = e.type?.toLowerCase().includes(q);
      const subjectMatch = e.subject?.name?.toLowerCase().includes(q);
      if (!typeMatch && !subjectMatch) return false;
    }
    return true;
  });

  const columns = [
    {
      header: "Type",
      accessorKey: "type",
      meta: { label: "Type" },
      cell: (info) => (
        <span className="font-medium text-foreground">{info.getValue()}</span>
      ),
    },
    {
      header: "Class",
      id: "class",
      meta: { label: "Class" },
      cell: ({ row }) => {
        const cls = row.original.class;
        return cls ? (
          <Badge variant="info">
            Grade {cls.grade || "?"} - {cls.section || "?"}
          </Badge>
        ) : "—";
      },
    },
    {
      header: "Subject",
      id: "subject",
      meta: { label: "Subject" },
      cell: ({ row }) => row.original.subject?.name || "—",
    },
    {
      header: "Term",
      accessorKey: "term",
      meta: { label: "Term" },
      cell: (info) => (
        <Badge variant={termVariants[info.getValue()] || "secondary"}>
          {info.getValue()}
        </Badge>
      ),
    },
    { header: "Session", accessorKey: "academicSession", meta: { label: "Session" } },
    {
      header: "Total Marks",
      accessorKey: "totalMarks",
      meta: { label: "Total Marks" },
      cell: (info) => (
        <span className="font-semibold tabular-nums">{info.getValue()}</span>
      ),
    },
    ...(isAdmin
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
                  aria-label={`Edit ${row.original.type} exam`}
                  title="Edit"
                >
                  <Pencil size={14} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(row.original)}
                  aria-label={`Delete ${row.original.type} exam`}
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
        title="Exams"
        subtitle={`${exams.length} exams total`}
        actions={
          <>
            {!isAdmin && user?.role === "teacher" && (
              <Button
                size="sm"
                variant="outline"
                className="border-ai-accent/30 text-ai-accent hover:bg-ai-accent/10 hover:text-ai-accent"
                onClick={() => navigate("/teacher/ai-assistant")}
              >
                <Sparkles size={14} className="mr-1.5" aria-hidden="true" />
                AI Quiz Generator
              </Button>
            )}
            {isAdmin && (
              <>
                {selectedExams.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setBulkConfirmOpen(true)}
                    disabled={bulkDeleting}
                    className="animate-fade-in"
                  >
                    <Trash2 size={14} className="mr-1.5" aria-hidden="true" />
                    Delete Selected ({selectedExams.length})
                  </Button>
                )}
                <Button size="sm" onClick={openAdd}>
                  <Plus size={14} className="mr-1.5" aria-hidden="true" />
                  Create Exam
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Filters */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search exams..."
                aria-label="Search exams by type or subject"
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    Grade {c.grade} - {c.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {TERMS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSession} onValueChange={setFilterSession}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {SESSIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterClass !== "all" || filterTerm !== "all" || filterSession !== "all" || filterSubject !== "all" || examSearch) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterClass("all"); setFilterTerm(CURRENT_TERM); setFilterSession(CURRENT_SESSION); setFilterSubject("all"); setExamSearch(""); }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exam List ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No exams found"
              description={
                filterClass !== "all" || filterTerm !== "all" || filterSession !== "all" || filterSubject !== "all" || examSearch
                  ? "No exams match your current filters."
                  : isAdmin
                    ? "Get started by creating your first exam."
                    : "Exams will appear here once they are created."
              }
              action={
                isAdmin && filterClass === "all" && filterTerm === "all" && filterSession === "all" && (
                  <Button onClick={openAdd}>
                    <Plus size={14} className="mr-1.5" aria-hidden="true" />
                    Create First Exam
                  </Button>
                )
              }
            />
          ) : (
            <DataTable 
              data={filtered} 
              columns={columns} 
              selectable={isAdmin}
              onSelectionChange={setSelectedExams}
              emptyState={{
                title: "No exams found",
                description: "No exams match your current filters.",
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExam ? "Edit Exam" : "Create Exam"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="exam-type">Exam Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="exam-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="exam-marks">Total Marks *</Label>
                <Input
                  id="exam-marks"
                  type="number"
                  value={form.totalMarks}
                  onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                  required
                  min={1}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="exam-class">Class *</Label>
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                  <SelectTrigger id="exam-class"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>Grade {c.grade} - {c.section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="exam-subject">Subject *</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger id="exam-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="exam-term">Term</Label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                  <SelectTrigger id="exam-term"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="exam-session">Academic Session</Label>
                <Select value={form.academicSession} onValueChange={(v) => setForm({ ...form, academicSession: v })}>
                  <SelectTrigger id="exam-session"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SESSIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={saving || !form.type || !form.totalMarks || !form.classId || !form.subjectId}
              >
                {saving ? "Saving…" : editingExam ? "Save Changes" : "Create Exam"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Exam"
        description={`Delete "${deleteTarget?.type}"? This will also remove all scores associated with it.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title="Delete Selected Exams"
        description={`Are you sure you want to delete ${selectedExams.length} exams? This will also remove all scores associated with them.`}
        confirmLabel={`Delete ${selectedExams.length} Exams`}
        onConfirm={handleBulkDelete}
        loading={bulkDeleting}
      />
    </div>
  );
};

export default Exams;
