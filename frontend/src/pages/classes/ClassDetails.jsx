import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MoveLeft, Users, GraduationCap, BookOpen, Search, Pencil, UserCheck, X } from "lucide-react";
import { getClassById, updateClass } from "@/services/classService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AddClassModal } from "@/components/class/AddClassModal";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = ["super-admin", "campus-admin"].includes(user?.role);
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [studentSearch, setStudentSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [removeTeacherOpen, setRemoveTeacherOpen] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await getClassById(id);
      setCls(res.data);
    } catch (err) {
      toast.error("Failed to load class details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/auth/users?role=teacher&limit=200");
      setTeachers(res.users || []);
    } catch {
      setTeachers([]);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchTeachers();
  }, [id]);

  const handleChangeClassTeacher = async () => {
    if (!selectedTeacherId) return;
    setSavingTeacher(true);
    try {
      await updateClass(id, { classTeacher: selectedTeacherId });
      toast.success("Class teacher updated");
      setTeacherDialogOpen(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update class teacher");
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleRemoveClassTeacher = async () => {
    setSavingTeacher(true);
    try {
      await updateClass(id, { classTeacher: null });
      toast.success("Class teacher removed");
      setRemoveTeacherOpen(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to remove class teacher");
    } finally {
      setSavingTeacher(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!cls) return (
    <EmptyState
      icon={GraduationCap}
      title="Class not found"
      description="The class you are looking for does not exist or has been removed."
    />
  );

  const tabLabels = {
    overview: "Overview",
    students: `Students (${cls.students?.length || 0})`,
    subjects: `Subjects (${cls.subjects?.length || 0})`,
  };

  const studentColumns = [
    { header: "Name", accessorKey: "name", meta: { label: "Name" }, cell: (info) => <span className="font-medium">{info.getValue()}</span> },
    { header: "Email", accessorKey: "email", meta: { label: "Email" } },
    { header: "Roll Number", accessorKey: "rollNumber", meta: { label: "Roll Number" } },
    { header: "Session", accessorKey: "academicSession", meta: { label: "Session" } },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <MoveLeft size={14} aria-hidden="true" /> Back
      </Button>

      <PageHeader
        eyebrow="Class"
        title={`Grade ${cls.grade} - ${cls.section}`}
        subtitle={cls.campus?.name ? `Campus: ${cls.campus?.name}` : undefined}
        actions={
          canManage && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={14} className="mr-1.5" aria-hidden="true" />
              Edit Class
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border" role="tablist" aria-label="Class sections">
        {["overview", "students", "subjects"].map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors sm:px-6 ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap size={16} aria-hidden="true" /> Class Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/60">
                  <span className="text-muted-foreground">Campus</span>
                  <span className="font-medium">{cls.campus?.name || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/60">
                  <span className="text-muted-foreground">Class Teacher</span>
                  <div className="flex items-center gap-2">
                    {cls.classTeacher ? (
                      <>
                        <Badge variant="success">{cls.classTeacher.name}</Badge>
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setSelectedTeacherId(cls.classTeacher._id);
                                setTeacherDialogOpen(true);
                              }}
                            >
                              <UserCheck size={12} aria-hidden="true" /> Change
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() => setRemoveTeacherOpen(true)}
                            >
                              <X size={12} aria-hidden="true" /> Remove
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground italic">Not Assigned</span>
                        {canManage && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setSelectedTeacherId("");
                              setTeacherDialogOpen(true);
                            }}
                          >
                            <UserCheck size={12} aria-hidden="true" /> Assign
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/60">
                  <span className="text-muted-foreground">Total Students</span>
                  <span className="font-medium">{cls.students?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Subjects</span>
                  <span className="font-medium">{cls.subjects?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={Users}
                  label="Enrolled"
                  value={cls.students?.length || 0}
                  tone="primary"
                />
                <StatCard
                  icon={BookOpen}
                  label="Subjects"
                  value={cls.subjects?.length || 0}
                  tone="info"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-4">
                <CardTitle className="text-base flex items-center gap-2 min-w-max">
                  <Users size={16} aria-hidden="true" /> Enrolled Students ({cls.students?.length || 0})
                </CardTitle>
                <div className="relative ml-auto w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Search by name, email..."
                    aria-label="Search students"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cls.students?.length > 0 ? (
                <DataTable
                  data={(cls.students || []).filter((s) =>
                    !studentSearch ||
                    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.rollNumber?.toString().includes(studentSearch)
                  )}
                  columns={studentColumns}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No students enrolled"
                  description="Students will appear here once they are enrolled in this class."
                />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "subjects" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen size={16} aria-hidden="true" /> Assigned Subjects ({cls.subjects?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cls.subjects?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {cls.subjects.map((sub) => (
                    <div key={sub._id} className="rounded-lg border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <BookOpen size={16} aria-hidden="true" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{sub.name}</h4>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{sub.code || "No Code"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No subjects assigned"
                  description="Subjects will appear here once they are assigned to this class."
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Class Modal */}
      {canManage && (
        <AddClassModal
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={fetchDetails}
          initialData={cls}
        />
      )}

      {/* Change/Assign Class Teacher Dialog */}
      <Dialog open={teacherDialogOpen} onOpenChange={setTeacherDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{cls.classTeacher ? "Change Class Teacher" : "Assign Class Teacher"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="ct-teacher">Select Teacher</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger id="ct-teacher">
                <SelectValue placeholder="Choose a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers
                  .filter((t) => !cls.classTeacher || t._id !== cls.classTeacher._id)
                  .map((t) => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeacherDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeClassTeacher} disabled={savingTeacher || !selectedTeacherId}>
              {savingTeacher ? "Saving…" : cls.classTeacher ? "Change Teacher" : "Assign Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Class Teacher */}
      <ConfirmDialog
        open={removeTeacherOpen}
        onOpenChange={setRemoveTeacherOpen}
        title="Remove Class Teacher"
        description={`Remove ${cls.classTeacher?.name || "the current teacher"} as class teacher for Grade ${cls.grade} - ${cls.section}? They will still remain assigned as a subject teacher if applicable.`}
        confirmLabel="Remove"
        onConfirm={handleRemoveClassTeacher}
        loading={savingTeacher}
        variant="destructive"
      />
    </div>
  );
};

export default ClassDetails;
