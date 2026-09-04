import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Download,
  Pencil,
  Trash2,
  UserPlus,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUsers, createCampusAdmin, createUser, updateUser, deleteUser } from "@/services/userService";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ResetPasswordDialog from "@/components/shared/ResetPasswordDialog";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/utils/api";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  gender: "Male",
  contact: "",
  address: "",
  dob: "",
  role: "teacher",
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super-admin";

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);

  const limit = 10;

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        limit,
        ...(search && { search }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(genderFilter !== "all" && { gender: genderFilter }),
        ...(statusFilter !== "all" && { isActive: statusFilter === "active" ? "true" : "false" }),
      };
      const res = await getUsers(params);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, genderFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openAddModal = () => {
    setEditingUser(null);
    setForm({ ...EMPTY_FORM, role: isSuperAdmin ? "campus-admin" : "teacher" });
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "",
      gender: u.gender === "Female" ? "Female" : "Male",
      contact: u.contact || "",
      address: u.address || "",
      dob: u.dob ? u.dob.substring(0, 10) : "",
      role: u.role || "teacher",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const payload = { ...form };
        delete payload.password;
        await updateUser(editingUser._id, payload);
        toast.success("User updated successfully");
      } else {
        if (isSuperAdmin && form.role === "campus-admin") {
          await createCampusAdmin(form);
        } else {
          await createUser(form);
        }
        toast.success("User created successfully");
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedUsers.length) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedUsers.map((u) => deleteUser(u._id)));
      toast.success(`${selectedUsers.length} users deleted successfully`);
      setSelectedUsers([]);
      setBulkConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete some users");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleCSVDownload = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        downloadCSV: "true",
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(genderFilter !== "all" && { gender: genderFilter }),
        ...(search && { search }),
      });
      const url = `${api.defaults.baseURL}/auth/users?${params}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "users.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
      toast.success("CSV downloaded");
    } catch {
      toast.error("CSV download failed");
    }
  };

  const roleBadgeVariant = {
    "super-admin": "ai",
    "campus-admin": "info",
    teacher: "success",
    student: "warning",
    parent: "neutral",
  };

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
      header: "Role",
      accessorKey: "role",
      meta: { label: "Role" },
      cell: (info) => (
        <Badge
          variant={roleBadgeVariant[info.getValue()] || "secondary"}
          className="capitalize"
        >
          {info.getValue()?.replace("-", " ")}
        </Badge>
      ),
    },
    {
      header: "Gender",
      accessorKey: "gender",
      meta: { label: "Gender" },
      cell: (info) => (
        <span className="capitalize text-muted-foreground">{info.getValue()}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      meta: { label: "Status" },
      cell: (info) => <StatusBadge active={info.getValue()} />,
    },
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
            onClick={() => openEditModal(row.original)}
            aria-label={`Edit ${row.original.name}`}
            title="Edit"
          >
            <Pencil size={14} aria-hidden="true" />
          </Button>
          {row.original._id !== currentUser?._id && (
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
          )}
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
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${total} total users`}
        actions={
          <>
            {selectedUsers.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setBulkConfirmOpen(true)}
                disabled={bulkDeleting}
                className="animate-fade-in"
              >
                <Trash2 size={14} className="mr-1.5" aria-hidden="true" />
                Delete Selected ({selectedUsers.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCSVDownload}>
              <Download size={14} className="mr-1.5" aria-hidden="true" />
              Export CSV
            </Button>
            <Button size="sm" onClick={openAddModal}>
              <UserPlus size={14} className="mr-1.5" aria-hidden="true" />
              Add User
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-50">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search by name or email..."
                aria-label="Search users by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {isSuperAdmin && (
                  <SelectItem value="campus-admin">Campus Admin</SelectItem>
                )}
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                {isSuperAdmin && (
                  <SelectItem value="parent">Parent</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {(roleFilter !== "all" || genderFilter !== "all" || statusFilter !== "all" || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRoleFilter("all");
                  setGenderFilter("all");
                  setStatusFilter("all");
                  setSearch("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : (
            <DataTable 
              data={users} 
              columns={columns} 
              selectable={true} 
              onSelectionChange={setSelectedUsers}
              emptyState={{
                title: "No users found",
                description:
                  search || roleFilter !== "all" || genderFilter !== "all" || statusFilter !== "all"
                    ? "No users match your current filters. Try adjusting or clearing them."
                    : "Users will appear here once they are added.",
              }}
            />
          )}

          {/* Server-side pagination */}
          {!loading && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
              <span className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1}–
                {Math.min(page * limit, total)} of {total}
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
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="user-name">Full Name *</Label>
                <Input
                  id="user-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="user-email">Email *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="john@school.com"
                />
              </div>
            </div>

            {!editingUser && (
              <div className="space-y-1">
                <Label htmlFor="user-password">Password *</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Minimum 8 characters"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="user-contact">Contact</Label>
                <Input
                  id="user-contact"
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                  placeholder="+92 300 0000000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="user-gender">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger id="user-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="user-dob">Date of Birth</Label>
                <Input
                  id="user-dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                />
              </div>
              {!editingUser && (
                <div className="space-y-1">
                  <Label htmlFor="user-role">Role *</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v })}
                  >
                    <SelectTrigger id="user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isSuperAdmin && (
                        <SelectItem value="campus-admin">Campus Admin</SelectItem>
                      )}
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      {isSuperAdmin && (
                        <SelectItem value="parent">Parent</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-address">Address</Label>
              <Input
                id="user-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St, City"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving…"
                  : editingUser
                  ? "Save Changes"
                  : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Confirm Bulk Delete */}
      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title="Delete Selected Users"
        description={`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedUsers.length} Users`}
        onConfirm={handleBulkDelete}
        loading={bulkDeleting}
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

export default Users;
