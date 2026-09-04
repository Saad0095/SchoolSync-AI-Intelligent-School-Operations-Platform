import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/utils/api";
import { exportToCSV } from "@/utils/exportUtils";
import { Download, Search, UserPlus, BookUser, Users, CheckCircle2, UserX, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createUser } from "@/services/userService";
import {
  getStudentEnrollments,
  enrollStudent,
} from "@/services/enrollmentService";
import { getClasses } from "@/services/classService";
import { CURRENT_SESSION } from "@/components/shared/TermSessionFilter";
import { getCampusDetails } from "@/services/campusService";
import { getUsers } from "@/services/userService";
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
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ResetPasswordDialog from "@/components/shared/ResetPasswordDialog";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY_USER_FORM = {
  name: "",
  email: "",
  password: "",
  gender: "Male",
  contact: "",
  address: "",
  dob: "",
  role: "student",
};

const Students = () => {
  const { user: currentUser } = useAuth();

  const [enrollments, setEnrollments] = useState([]);
  const [unenrolledStudents, setUnenrolledStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [campusId, setCampusId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkUnenrolling, setBulkUnenrolling] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState(null);
  const [unenrolling, setUnenrolling] = useState(false);
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSession, setFilterSession] = useState(CURRENT_SESSION);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);

  const [addUserModal, setAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [savingUser, setSavingUser] = useState(false);

  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [enrollForm, setEnrollForm] = useState({
    campusId: "",
    classId: "",
    rollNumber: "",
    academicSession: CURRENT_SESSION,
  });
  const [enrolling, setEnrolling] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(filterClass !== "all" && { classId: filterClass }),
        ...(filterStatus !== "all" && { isActive: filterStatus }),
        ...(filterSession !== "all" && { academicSession: filterSession }),
      };
      
      const promises = [
        getStudentEnrollments(params),
        getClasses({ limit: 100 }),
        // Fetch ALL active enrollments (no pagination/session filter) for accurate unenrolled calculation
        getStudentEnrollments({ limit: 10000 }),
      ];

      if (currentUser?.role !== "teacher") {
        promises.push(getUsers({ role: "student", limit: 100 }));
      }

      const results = await Promise.all(promises);
      const enrollRes = results[0];
      const classRes = results[1];
      const allEnrollRes = results[2];
      const unenrolledRes = currentUser?.role !== "teacher" ? results[3] : { users: [] };

      const enrollData = enrollRes.data || [];
      setEnrollments(enrollData);
      setTotal(enrollRes.totalEnrollments || 0);

      const classData = classRes.data || [];
      setClasses(classData);

      // Determine campusId from campus details
      if (currentUser?.role === "campus-admin") {
        try {
          const campusRes = await getCampusDetails();
          const cd = campusRes.campusDetails?.[0];
          if (cd) setCampusId(cd._id);
        } catch {}
      }

      // Find students not yet enrolled (using ALL active enrollments, not just current page/session)
      const allEnrollData = allEnrollRes.data || [];
      const enrolledIds = new Set(allEnrollData.map((e) => e.student?._id));
      const allStudents = unenrolledRes.users || [];
      setUnenrolledStudents(allStudents.filter((s) => !enrolledIds.has(s._id)));
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [page, filterClass, filterStatus, filterSession]);

  const handleExport = () => {
    const exportData = enrollments.map(e => ({
      ID: e.rollNumber || e._id,
      Name: e.student?.name,
      Email: e.student?.email,
      Class: e.class ? `Grade ${e.class.grade} - ${e.class.section}` : "N/A",
      Campus: e.campus?.name || "N/A",
      Session: e.academicSession,
      Status: e.isActive ? "Active" : "Inactive"
    }));
    exportToCSV(exportData, "Students_List");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      await createUser({ ...userForm, role: "student" });
      toast.success("Student account created");
      setAddUserModal(false);
      setUserForm(EMPTY_USER_FORM);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create student");
    } finally {
      setSavingUser(false);
    }
  };

  const openEnrollModal = (student) => {
    setEnrollTarget(student);
    setEnrollForm({
      campusId: campusId || "",
      classId: "",
      rollNumber: "",
      academicSession: CURRENT_SESSION,
    });
    setEnrollModal(true);
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollTarget) return;
    setEnrolling(true);
    try {
      await enrollStudent({
        studentId: enrollTarget._id || enrollTarget.student?._id,
        campusId: enrollForm.campusId,
        classId: enrollForm.classId,
        rollNumber: enrollForm.rollNumber,
        academicSession: enrollForm.academicSession,
      });
      toast.success(`Student enrolled successfully`);
      setEnrollModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to enroll student");
    } finally {
      setEnrolling(false);
    }
  };

  const unenrollStudent = async (enrollment) => {
    // id is the enrollment document ID
    const token = localStorage.getItem("token");
    await fetch(`${api.defaults.baseURL}/enrollment/enroll-student/${enrollment._id}/delete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleUnenroll = async () => {
    if (!unenrollTarget) return;
    setUnenrolling(true);
    try {
      await unenrollStudent(unenrollTarget);
      toast.success("Student unenrolled");
      setUnenrollTarget(null);
      fetchAll();
    } catch {
      toast.error("Failed to unenroll");
    } finally {
      setUnenrolling(false);
    }
  };

  const handleBulkUnenroll = async () => {
    if (!selectedStudents.length) return;
    setBulkUnenrolling(true);
    try {
      await Promise.all(selectedStudents.map((e) => unenrollStudent(e)));
      toast.success(`${selectedStudents.length} students unenrolled`);
      setSelectedStudents([]);
      setBulkConfirmOpen(false);
      fetchAll();
    } catch (err) {
      toast.error("Failed to unenroll some students");
    } finally {
      setBulkUnenrolling(false);
    }
  };

  const filtered = enrollments.filter(
    (e) =>
      !search ||
      e.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Name",
      accessorKey: "student.name",
      meta: { label: "Name" },
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.student?.name}</span>
      ),
    },
    {
      header: "Email",
      accessorKey: "student.email",
      meta: { label: "Email" },
      cell: ({ row }) => row.original.student?.email,
    },
    { header: "Roll No.", accessorKey: "rollNumber", meta: { label: "Roll No." } },
    {
      header: "Class",
      id: "class",
      meta: { label: "Class" },
      cell: ({ row }) => {
        const cls = row.original.class;
        return cls ? (
          <Badge variant="info">
            Grade {cls.grade} - {cls.section}
          </Badge>
        ) : "-";
      },
    },
    {
      header: "Campus",
      id: "campus",
      meta: { label: "Campus" },
      cell: ({ row }) => row.original.campus?.name || "-",
    },
    { header: "Session", accessorKey: "academicSession", meta: { label: "Session" } },
    {
      header: "Status",
      accessorKey: "isActive",
      meta: { label: "Status" },
      cell: (info) => <StatusBadge active={info.getValue()} />,
    }
  ];

  if (currentUser?.role !== "teacher") {
    columns.push({
      header: "Actions",
      id: "actions",
      enableSorting: false,
      meta: { label: "Actions" },
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={() => setResetPasswordUser(row.original.student || row.original)}
            aria-label={`Reset password for ${row.original.student?.name || row.original.name}`}
            title="Reset Password"
          >
            <KeyRound size={14} aria-hidden="true" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setUnenrollTarget(row.original)}
          >
            Unenroll
          </Button>
        </div>
      )
    });
  }

  const unenrolledColumns = [
    {
      header: "Name",
      accessorKey: "name",
      meta: { label: "Name" },
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    },
    { header: "Email", accessorKey: "email", meta: { label: "Email" } },
    {
      header: "Action",
      id: "action",
      enableSorting: false,
      meta: { label: "Action" },
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openEnrollModal(row.original)}
          className="text-xs"
        >
          <BookUser size={12} className="mr-1" aria-hidden="true" />
          Enroll
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Students"
        subtitle={`${total} enrolled students`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={14} className="mr-1.5" aria-hidden="true" />
              Export
            </Button>
            {selectedStudents.length > 0 && currentUser?.role !== "teacher" && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setBulkConfirmOpen(true)}
                disabled={bulkUnenrolling}
              >
                Bulk Unenroll ({selectedStudents.length})
              </Button>
            )}
            {currentUser?.role !== "teacher" && (
              <Button size="sm" onClick={() => setAddUserModal(true)}>
                <UserPlus size={14} className="mr-1.5" aria-hidden="true" />
                Add Student
              </Button>
            )}
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Enrolled"
          value={total}
          tone="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={enrollments.filter((e) => e.isActive).length}
          tone="success"
        />
        <StatCard
          icon={UserX}
          label="Not Enrolled"
          value={unenrolledStudents.length}
          tone="warning"
        />
      </div>

      {/* Enrolled Students */}
      <Card>
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="text-base min-w-max">Enrolled Students</CardTitle>
            
            <div className="flex flex-wrap items-center gap-3 ml-auto">
              <div className="relative w-56">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search students..."
                  aria-label="Search students"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      Grade {c.grade}-{c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSession} onValueChange={setFilterSession}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All Sessions" />
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
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <DataTable 
              data={filtered} 
              columns={columns} 
              selectable={true}
              onSelectionChange={setSelectedStudents}
              emptyState={{
                title: "No students found",
                description:
                  search || filterClass !== "all" || filterStatus !== "all"
                    ? "No students match your current search or filters."
                    : "Enrolled students will appear here.",
              }}
            />
          )}
          {!loading && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
              <span className="text-sm text-muted-foreground">
                Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unenrolled Students */}
      {unenrolledStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-warning">
              Students Without Enrollment ({unenrolledStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={unenrolledStudents} columns={unenrolledColumns} pageSize={5} />
          </CardContent>
        </Card>
      )}

      {/* Add Student Account Modal */}
      <Dialog open={addUserModal} onOpenChange={setAddUserModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="student-name">Full Name *</Label>
                <Input id="student-name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="student-email">Email *</Label>
                <Input id="student-email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="student-password">Password *</Label>
                <Input id="student-password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="student-gender">Gender</Label>
                <Select value={userForm.gender} onValueChange={(v) => setUserForm({ ...userForm, gender: v })}>
                  <SelectTrigger id="student-gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="student-contact">Contact</Label>
                <Input id="student-contact" value={userForm.contact} onChange={(e) => setUserForm({ ...userForm, contact: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="student-dob">Date of Birth</Label>
                <Input id="student-dob" type="date" value={userForm.dob} onChange={(e) => setUserForm({ ...userForm, dob: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddUserModal(false)}>Cancel</Button>
              <Button type="submit" disabled={savingUser}>
                {savingUser ? "Creating…" : "Create Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enroll Student Modal */}
      <Dialog open={enrollModal} onOpenChange={setEnrollModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll {enrollTarget?.name || enrollTarget?.student?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="enroll-class">Class *</Label>
              <Select value={enrollForm.classId} onValueChange={(v) => setEnrollForm({ ...enrollForm, classId: v })}>
                <SelectTrigger id="enroll-class"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c._id} value={c._id}>Grade {c.grade} - {c.section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="enroll-roll">Roll Number *</Label>
                <Input id="enroll-roll" value={enrollForm.rollNumber} onChange={(e) => setEnrollForm({ ...enrollForm, rollNumber: e.target.value })} required placeholder="e.g. 101" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="enroll-session">Academic Session</Label>
                <Select value={enrollForm.academicSession} onValueChange={(v) => setEnrollForm({ ...enrollForm, academicSession: v })}>
                  <SelectTrigger id="enroll-session"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEnrollModal(false)}>Cancel</Button>
              <Button type="submit" disabled={enrolling || !enrollForm.classId || !enrollForm.rollNumber}>
                {enrolling ? "Enrolling…" : "Enroll Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Unenroll */}
      <ConfirmDialog
        open={!!unenrollTarget}
        onOpenChange={(open) => !open && setUnenrollTarget(null)}
        title="Unenroll Student"
        description={`Are you sure you want to unenroll ${unenrollTarget?.student?.name}? They will need to be re-enrolled to attend classes.`}
        confirmLabel="Unenroll"
        onConfirm={handleUnenroll}
        loading={unenrolling}
      />

      {/* Confirm Bulk Unenroll */}
      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title="Unenroll Selected Students"
        description={`Are you sure you want to unenroll ${selectedStudents.length} students? They will need to be re-enrolled to attend classes.`}
        confirmLabel={`Unenroll ${selectedStudents.length} Students`}
        onConfirm={handleBulkUnenroll}
        loading={bulkUnenrolling}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={!!resetPasswordUser}
        onOpenChange={(open) => { if (!open) setResetPasswordUser(null); }}
        user={resetPasswordUser}
      />
    </div>
  );
};

export default Students;
