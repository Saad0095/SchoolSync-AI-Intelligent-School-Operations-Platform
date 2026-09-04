import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, UserPlus, BookOpen, Trash2, Users, CheckCircle2, UserX, KeyRound, UserMinus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUsers, createUser, deleteUser } from "@/services/userService";
import {
  getTeacherAssignments,
  getUnassignedTeachers,
  assignTeacher,
  deleteTeacherAssignment,
} from "@/services/enrollmentService";
import { getCampuses, getCampusDetails } from "@/services/campusService";
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
  role: "teacher",
};

const Teachers = () => {
  const { user: currentUser } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [campusId, setCampusId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const [addUserModal, setAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [savingUser, setSavingUser] = useState(false);

  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [unassignTarget, setUnassignTarget] = useState(null);
  const [unassigning, setUnassigning] = useState(false);
  const [assignForm, setAssignForm] = useState({
    campusId: "",
    classId: "",
    subjectId: "",
  });
  const [assigning, setAssigning] = useState(false);
  const [campusesLoading, setCampusesLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [assignRes, unassignedRes, classRes, subjectRes] = await Promise.all([
        getTeacherAssignments(),
        getUnassignedTeachers(),
        getClasses({ limit: 100 }),
        getSubjects(),
      ]);

      setAssignments(assignRes.data || []);
      setUnassigned(unassignedRes.data || []);

      const classData = classRes.data || [];
      setClasses(classData);

      // Extract campus from class list
      if (classData.length > 0 && currentUser?.role === "campus-admin") {
        // Campus admin: get their campus from campus details
        try {
          const campusRes = await getCampusDetails();
          const cd = campusRes.campusDetails?.[0];
          if (cd) setCampusId(cd._id);
        } catch {}
      }

      setSubjects(Array.isArray(subjectRes) ? subjectRes : subjectRes.data || []);

      // Build flat teacher list from assignments
      const teacherList = (assignRes.data || []).map((ta) => ({
        _id: ta.teacher?._id,
        name: ta.teacher?.name,
        email: ta.teacher?.email,
        role: ta.teacher?.role,
        assignmentId: ta._id,
        assignedClasses: ta.assignments || [],
        isAssigned: true,
      }));

      const unassignedList = (unassignedRes.data || []).map((t) => ({
        _id: t._id,
        name: t.name,
        email: t.email,
        role: "teacher",
        assignedClasses: [],
        isAssigned: false,
      }));

      setTeachers([...teacherList, ...unassignedList]);
    } catch (err) {
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.role) return;
    fetchAll();
  }, [currentUser?.role]);

  useEffect(() => {
    const fetchCampuses = async () => {
      if (currentUser?.role !== "super-admin") {
        setCampuses([]);
        return;
      }

      setCampusesLoading(true);
      try {
        const res = await getCampuses({ limit: 100 });
        setCampuses(res.data?.campuses || []);
      } catch (error) {
        setCampuses([]);
      } finally {
        setCampusesLoading(false);
      }
    };

    fetchCampuses();
  }, [currentUser?.role]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      await createUser({ ...userForm, role: "teacher" });
      toast.success("Teacher account created");
      setAddUserModal(false);
      setUserForm(EMPTY_USER_FORM);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create teacher");
    } finally {
      setSavingUser(false);
    }
  };

  const openAssignModal = (teacher) => {
    setAssignTarget(teacher);
    setAssignForm({ campusId: campusId || "", classId: "", subjectId: "" });
    setAssignModal(true);
  };

  const visibleClasses =
    currentUser?.role === "super-admin" && assignForm.campusId
      ? classes.filter((c) => c.campus?._id === assignForm.campusId)
      : classes;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignTarget) return;
    setAssigning(true);
    try {
      await assignTeacher({
        teacherId: assignTarget._id,
        campusId: assignForm.campusId,
        classId: assignForm.classId,
        subjectId: assignForm.subjectId,
      });
      toast.success(`${assignTarget.name} assigned successfully`);
      setAssignModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to assign teacher");
    } finally {
      setAssigning(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedTeachers.length) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedTeachers.map((t) => deleteUser(t._id)));
      toast.success(`${selectedTeachers.length} teachers deleted successfully`);
      setSelectedTeachers([]);
      setBulkConfirmOpen(false);
      fetchAll();
    } catch (err) {
      toast.error("Failed to delete some teachers");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleUnassign = async () => {
    if (!unassignTarget) return;
    setUnassigning(true);
    try {
      // Collect unique campus IDs from assignments
      const campusIds = [
        ...new Set(
          (unassignTarget.assignedClasses || [])
            .map((a) => a.campus?._id)
            .filter(Boolean)
        ),
      ];

      if (campusIds.length === 0) {
        toast.error("No campus assignments found for this teacher");
        setUnassignTarget(null);
        return;
      }

      // Unassign from each campus
      await Promise.all(
        campusIds.map((campusId) =>
          deleteTeacherAssignment(unassignTarget._id, {
            teacherId: unassignTarget._id,
            campusId,
          })
        )
      );

      toast.success(`${unassignTarget.name} unassigned from all classes`);
      setUnassignTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to unassign teacher");
    } finally {
      setUnassigning(false);
    }
  };

  const filtered = teachers.filter((t) => {
    const matchesSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || (filterStatus === "assigned" && t.isAssigned) || (filterStatus === "unassigned" && !t.isAssigned);
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      meta: { label: "Name" },
      cell: (info) => (
        <span className="font-medium text-foreground">{info.getValue()}</span>
      ),
    },
    { header: "Email", accessorKey: "email", meta: { label: "Email" } },
    {
      header: "Assigned Classes",
      id: "classes",
      meta: { label: "Assigned Classes" },
      cell: ({ row }) => {
        const assignments = row.original.assignedClasses || [];
        if (!assignments.length)
          return <span className="text-muted-foreground text-xs">Unassigned</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {assignments.slice(0, 3).map((a) => (
              <Badge key={a._id} variant="info" className="text-xs">
                {a.class
                  ? `${a.class.grade}-${a.class.section}`
                  : a.campus?.name}
              </Badge>
            ))}
            {assignments.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{assignments.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      id: "status",
      meta: { label: "Status" },
      cell: ({ row }) => (
        <StatusBadge
          active={row.original.isAssigned}
          activeLabel="Assigned"
          inactiveLabel="Unassigned"
        />
      ),
    },
    {
      header: "Actions",
      id: "actions",
      enableSorting: false,
      meta: { label: "Actions" },
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAssignModal(row.original)}
            className="text-xs"
          >
            <BookOpen size={12} className="mr-1" aria-hidden="true" />
            Assign
          </Button>
          {row.original.isAssigned && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUnassignTarget(row.original)}
              className="text-xs text-destructive hover:text-destructive"
              title="Unassign from all classes"
            >
              <UserMinus size={12} className="mr-1" aria-hidden="true" />
              Unassign
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={() => setResetPasswordUser(row.original)}
            aria-label={`Reset password for ${row.original.name}`}
            title="Reset Password"
          >
            <KeyRound size={14} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teachers total`}
        actions={
          <>
            {selectedTeachers.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setBulkConfirmOpen(true)}
                disabled={bulkDeleting}
                className="animate-fade-in"
              >
                <Trash2 size={14} className="mr-1.5" aria-hidden="true" />
                Delete Selected ({selectedTeachers.length})
              </Button>
            )}
            <Button size="sm" onClick={() => setAddUserModal(true)}>
              <UserPlus size={14} className="mr-1.5" aria-hidden="true" />
              Add Teacher
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Teachers"
          value={teachers.length}
          tone="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Assigned"
          value={teachers.filter((t) => t.isAssigned).length}
          tone="success"
        />
        <StatCard
          icon={UserX}
          label="Unassigned"
          value={teachers.filter((t) => !t.isAssigned).length}
          tone="warning"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="text-base min-w-max">All Teachers</CardTitle>
            
            <div className="flex flex-wrap items-center gap-3 ml-auto">
              <div className="relative w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search teachers..."
                  aria-label="Search teachers"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable 
              data={filtered} 
              columns={columns} 
              selectable={true}
              onSelectionChange={setSelectedTeachers}
              emptyState={{
                title: "No teachers found",
                description:
                  search || filterStatus !== "all"
                    ? "No teachers match your current search or filters."
                    : "Teachers will appear here once they are added.",
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Teacher Modal */}
      <Dialog open={addUserModal} onOpenChange={setAddUserModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="teacher-name">Full Name *</Label>
                <Input
                  id="teacher-name"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="teacher-email">Email *</Label>
                <Input
                  id="teacher-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="teacher-password">Password *</Label>
                <Input
                  id="teacher-password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="teacher-gender">Gender</Label>
                <Select
                  value={userForm.gender}
                  onValueChange={(v) => setUserForm({ ...userForm, gender: v })}
                >
                  <SelectTrigger id="teacher-gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="teacher-dob">Date of Birth *</Label>
                <Input
                  id="teacher-dob"
                  type="date"
                  value={userForm.dob}
                  onChange={(e) => setUserForm({ ...userForm, dob: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="teacher-address">Address</Label>
                <Input
                  id="teacher-address"
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  placeholder="123 Main St, City"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="teacher-contact">Contact</Label>
              <Input
                id="teacher-contact"
                value={userForm.contact}
                onChange={(e) => setUserForm({ ...userForm, contact: e.target.value })}
                placeholder="+92 300 0000000"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddUserModal(false)}>Cancel</Button>
              <Button type="submit" disabled={savingUser}>
                {savingUser ? "Creating…" : "Create Teacher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Modal */}
      <Dialog open={assignModal} onOpenChange={setAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign {assignTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4 mt-2">
            {currentUser?.role === "super-admin" && (
              <div className="space-y-1">
                <Label htmlFor="assign-campus">Campus *</Label>
                <Select
                  value={assignForm.campusId}
                  onValueChange={(v) => setAssignForm({ ...assignForm, campusId: v, classId: "", subjectId: "" })}
                >
                  <SelectTrigger id="assign-campus">
                    <SelectValue
                      placeholder={
                        campusesLoading
                          ? "Loading campuses..."
                          : campuses.length
                            ? "Select campus"
                            : "No campuses found"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {campusesLoading ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        Loading campuses...
                      </div>
                    ) : campuses.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">No campuses available.</div>
                    ) : (
                      campuses.map((campus) => (
                        <SelectItem key={campus._id} value={campus._id}>
                          {campus.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="assign-class">Class *</Label>
              <Select
                value={assignForm.classId}
                onValueChange={(v) => setAssignForm({ ...assignForm, classId: v })}
              >
                <SelectTrigger id="assign-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {visibleClasses.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      Grade {c.grade} - {c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="assign-subject">Subject *</Label>
              <Select
                value={assignForm.subjectId}
                onValueChange={(v) => setAssignForm({ ...assignForm, subjectId: v })}
              >
                <SelectTrigger id="assign-subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAssignModal(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={assigning || !assignForm.campusId || !assignForm.classId || !assignForm.subjectId}
              >
                {assigning ? "Assigning…" : "Assign Teacher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Bulk Delete */}
      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title="Delete Selected Teachers"
        description={`Are you sure you want to delete ${selectedTeachers.length} teachers? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedTeachers.length} Teachers`}
        onConfirm={handleBulkDelete}
        loading={bulkDeleting}
      />

      {/* Confirm Unassign */}
      <ConfirmDialog
        open={!!unassignTarget}
        onOpenChange={(open) => !open && setUnassignTarget(null)}
        title="Unassign Teacher"
        description={`Unassign ${unassignTarget?.name} from all ${unassignTarget?.assignedClasses?.length || 0} class assignment(s)? The teacher will need to be re-assigned to manage classes again.`}
        confirmLabel="Unassign"
        onConfirm={handleUnassign}
        loading={unassigning}
        variant="destructive"
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

export default Teachers;
