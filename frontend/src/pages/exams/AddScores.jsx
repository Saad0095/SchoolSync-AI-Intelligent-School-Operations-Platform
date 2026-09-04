import { useEffect, useState } from "react";
import api from "@/utils/api";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Users,
  Save,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { TERMS, SESSIONS, CURRENT_TERM, CURRENT_SESSION } from "@/components/shared/TermSessionFilter";

const AddScores = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [examData, setExamData] = useState([]); // store full nested API response

  const [selectedClass, setSelectedClass] = useState(null); // will store object {_id, class}
  const [selectedSubject, setSelectedSubject] = useState(null); // will store object {_id, subject}
  const [selectedExamType, setSelectedExamType] = useState(null); // string
  const [selectedExamObj, setSelectedExamObj] = useState(null); // store chosen exam object
  const [error, setError] = useState("");
  const [deleteScoreTarget, setDeleteScoreTarget] = useState(null);
  const [deletingScore, setDeletingScore] = useState(false);
  const [filterTerm, setFilterTerm] = useState(CURRENT_TERM);
  const [filterSession, setFilterSession] = useState(CURRENT_SESSION);

  const fetchExamData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, limit: 100 };
      if (filterTerm !== "all") params.term = filterTerm;
      if (filterSession !== "all") params.academicSession = filterSession;
      const res = await api.get("/exams", { params });
      const payload = res?.data ?? [];
      setExamData(payload);
      setClasses(payload);
    } catch (err) {
      console.error(err);
      setError("Failed to load exam data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData();
  }, [filterTerm, filterSession]);

  const handleClassChange = (clsId) => {
    const cls = classes.find((c) => c._id === clsId);
    setSelectedClass(cls);
    setSelectedSubject(null);
    setSelectedExamType(null);
    setStudents([]);
    setSubjects(cls?.subjects || []);
    setExamTypes([]);
    setSelectedExamObj(null);
  };

  const handleSubjectChange = (subjId) => {
    const subj = subjects.find((s) => s._id === subjId);
    setSelectedSubject(subj);
    setSelectedExamType(null);
    setStudents([]);
    setExamTypes(subj?.exams || []);
  };

 const handleExamTypeChange = async (examType) => {
  setSelectedExamType(examType);
  setStudents([]);
  if (!selectedClass || !selectedSubject) return;

  try {
    const res = await api.get("/score/examScores", {
      params: {
        classId: selectedClass._id,
        subjectId: selectedSubject._id,
        examType,
      },
    });

    const payload = res?.data ?? res;

    // Extract campusId from response
    const responseCampusId = payload?.campusId;

    const examObj =
      (selectedSubject?.exams || []).find((ex) => ex.type === examType) ||
      null;
    
    // Add campusId to examObj
    if (examObj && responseCampusId) {
      examObj.campusId = responseCampusId;
    }
    
    setSelectedExamObj(examObj);

    const studentList = (payload?.scores || payload?.students || []).map(
      (s) => ({
        ...s,
        marks: s.marks ?? 0,
      })
    );
    setStudents(studentList);
  } catch (err) {
    console.error(err);
    setError("Failed to load students");
  }
};

  const handleMarksChange = (studentId, value) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student._id === studentId ? { ...s, marks: value } : s
      )
    );
  };

  const handleUpdateSingleScore = async (scoreId, marks) => {
    try {
      await api.patch(`/score/updateScore/${scoreId}`, { marksObtained: marks });
      toast.success("Score updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update score");
    }
  };

  const handleDeleteScore = async () => {
    if (!deleteScoreTarget) return;
    setDeletingScore(true);
    try {
      await api.delete(`/score/deleteScore/${deleteScoreTarget.scoreId}`);
      toast.success("Score deleted successfully");

      // Update UI to remove the score ID and set marks to 0
      setStudents((prev) =>
        prev.map((s) =>
          s.student._id === deleteScoreTarget.studentId ? { ...s, _id: null, marks: 0 } : s
        )
      );
      setDeleteScoreTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete score");
    } finally {
      setDeletingScore(false);
    }
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedExamObj) {
      setError("Please select class, subject, and exam type");
      return;
    }

    if (students.length === 0) {
      setError("No students to save");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        classId: selectedClass._id,
        subjectId: selectedSubject._id,
        campusId: selectedExamObj.campusId,
        examId: selectedExamObj._id,
        scores: students
          .filter((s) => s.marks > 0 || s.marks === 0)
          .map((s) => ({
            studentId: s.student._id,
            marksObtained: parseFloat(s.marks) || 0,
          })),
      };

      const res = await api.post("/score/addScore", payload);

      toast.success(
        `Successfully saved scores for ${res?.data?.count || students.length} students`
      );

      // Reset form
      setStudents([]);
      setSelectedExamType(null);
      setSelectedSubject(null);
      setSelectedClass(null);
      setSubjects([]);
      setExamTypes([]);
    } catch (error) {
      console.error("Save error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save exam data";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getCompletionPercentage = () => {
    if (students.length === 0) return 0;
    const filled = students.filter((s) => s.marks > 0).length;
    return Math.round((filled / students.length) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Exams"
        title="Add Exam Scores"
        subtitle="Record student performance with ease"
      />

      {/* Selection Card */}
      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            Exam Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchExamData}>
                Try again
              </Button>
            </div>
          ) : (
              <>
                {/* Term & Session Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="scores-term" className="text-xs font-semibold text-muted-foreground">Term</Label>
                    <Select value={filterTerm} onValueChange={(v) => { setFilterTerm(v); setSelectedClass(null); setSelectedSubject(null); setSelectedExamType(null); setStudents([]); }}>
                      <SelectTrigger id="scores-term" className="h-9 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Terms</SelectItem>
                        {TERMS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="scores-session" className="text-xs font-semibold text-muted-foreground">Session</Label>
                    <Select value={filterSession} onValueChange={(v) => { setFilterSession(v); setSelectedClass(null); setSelectedSubject(null); setSelectedExamType(null); setStudents([]); }}>
                      <SelectTrigger id="scores-session" className="h-9 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        {SESSIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Class Select */}
                  <div className="space-y-2">
                    <Label htmlFor="score-class" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <GraduationCap className="size-4 text-primary" aria-hidden="true" />
                      Class
                    </Label>
                    <Select
                      value={selectedClass?._id || ""}
                      onValueChange={handleClassChange}
                    >
                      <SelectTrigger id="score-class" className="w-full">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.class}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject Select */}
                  <div className="space-y-2">
                    <Label htmlFor="score-subject" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <BookOpen className="size-4 text-info" aria-hidden="true" />
                      Subject
                    </Label>
                    <Select
                      value={selectedSubject?._id || ""}
                      onValueChange={handleSubjectChange}
                      disabled={!selectedClass}
                    >
                      <SelectTrigger id="score-subject" className="w-full">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Exam Type Select */}
                  <div className="space-y-2">
                    <Label htmlFor="score-exam-type" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="size-4 text-primary" aria-hidden="true" />
                      Examination Type
                    </Label>
                    <Select
                      value={selectedExamType || ""}
                      onValueChange={handleExamTypeChange}
                      disabled={!selectedSubject}
                    >
                      <SelectTrigger id="score-exam-type" className="w-full">
                        <SelectValue placeholder="Select Exam Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {examTypes.map((ex) => (
                          <SelectItem key={ex._id || ex.type} value={ex.type}>
                            {`${ex.type} (${ex.totalMarks ?? ex.totalMarks})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Info Banner */}
                {selectedClass && selectedSubject && selectedExamType && (
                  <div className="mt-6 rounded-lg border-l-4 border-primary/60 bg-primary/[0.05] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Users className="size-5 text-primary" aria-hidden="true" />
                        <span className="font-semibold text-foreground">
                          {students.length} Students Enrolled
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Max Marks:{" "}
                        <span className="font-bold tabular-nums text-primary">
                          {selectedExamObj?.totalMarks || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Students Marks Card */}
        {students.length > 0 && (
          <Card>
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" aria-hidden="true" />
                  Student Marks Entry
                </CardTitle>
                <Badge variant="secondary" className="tabular-nums">
                  {getCompletionPercentage()}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                {students.map((s, idx) => (
                  <div
                    key={s.student._id}
                    className="flex flex-wrap items-center gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-bold tabular-nums text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground">
                        {s.student.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={s.marks}
                          onChange={(e) =>
                            handleMarksChange(s.student._id, e.target.value)
                          }
                          placeholder="0"
                          aria-label={`Marks for ${s.student.name}`}
                          className="w-24 text-center text-base font-semibold tabular-nums"
                          min={0}
                          max={selectedExamObj?.totalMarks ?? undefined}
                        />
                        <span className="text-muted-foreground font-medium">
                          / {selectedExamObj?.totalMarks}
                        </span>
                      </div>
                      {/* Show actions if score already exists in DB (has _id) */}
                      {s._id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateSingleScore(s._id, s.marks)}
                            className="size-8 text-success hover:bg-success/10 hover:text-success"
                            aria-label={`Update score for ${s.student.name}`}
                            title="Update individual score"
                          >
                            <CheckCircle className="size-4" aria-hidden="true" />
                          </Button>
                          {["campus-admin", "super-admin"].includes(user?.role) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteScoreTarget({ scoreId: s._id, studentId: s.student._id, name: s.student.name })
                              }
                              className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete score for ${s.student.name}`}
                              title="Delete score"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg">
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" aria-hidden="true" />
                      Save All Scores
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading &&
          students.length === 0 &&
          selectedClass &&
          selectedSubject &&
          selectedExamType && (
            <EmptyState
              icon={Users}
              title="No students found"
              description="There are no students enrolled for this exam."
            />
          )}

      <ConfirmDialog
        open={!!deleteScoreTarget}
        onOpenChange={(open) => !open && setDeleteScoreTarget(null)}
        title="Delete Score"
        description={`Are you sure you want to delete the score for ${deleteScoreTarget?.name}? The student's marks will be reset to 0.`}
        confirmLabel="Delete Score"
        onConfirm={handleDeleteScore}
        loading={deletingScore}
      />
    </div>
  );
};

export default AddScores;
