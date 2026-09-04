import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "../../utils/api";
import { DataTable } from "../../components/ui/DataTable";
import { MoveLeft, Trash2, Users, GraduationCap, BookOpen, Search, Building2 } from "lucide-react";
import EditCampusModal from "./EditCampusModal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";


const CampusDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campus, setCampus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classSearch, setClassSearch] = useState("");

    useEffect(() => {
        const fetchCampus = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/campuses/${id}`);
                setCampus(res);
            } catch (err) {
                toast.error(err.response?.data?.error || "Failed to load campus details");
                navigate("/admin/campuses");
            } finally {
                setLoading(false);
            }
        };
        fetchCampus();
    }, [id]);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.post(`/campuses/${id}/delete`);
            toast.success("Campus deleted successfully");
            navigate("/admin/campuses");
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to delete campus");
        } finally {
            setDeleting(false);
        }
    };

    const refetchCampus = async () => {
        const res = await api.get(`/campuses/${id}`);
        setCampus(res);
    };

    if (loading) return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
        </div>
    );

    if (!campus) return (
        <EmptyState
            icon={Building2}
            title="Campus not found"
            description="The campus you are looking for does not exist or has been removed."
        />
    );

    const classColumns = [
        { header: "Class Name", accessorKey: "className", meta: { label: "Class Name" } },
        { header: "Teacher", accessorKey: "classTeacher.name", meta: { label: "Teacher" } },
        { header: "Students", accessorKey: "studentCount", meta: { label: "Students" } },
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
                eyebrow="Campus"
                title={campus.name}
                subtitle={`${campus.city || ""}${campus.campusAdmin?.name ? ` · Admin: ${campus.campusAdmin.name}` : ""}`}
                actions={
                    <>
                        <EditCampusModal
                            campus={campus}
                            onUpdated={refetchCampus}
                        />
                        <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="flex items-center gap-1">
                            <Trash2 size={16} aria-hidden="true" /> Delete
                        </Button>
                    </>
                }
            />

            <Card>
                <CardHeader className="border-b border-border/60"><CardTitle className="text-base">Campus Information</CardTitle></CardHeader>
                <CardContent>
                    <dl className="grid gap-6 sm:grid-cols-3">
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">City</dt>
                            <dd className="mt-1 text-sm font-medium text-foreground">{campus.city || "—"}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Address</dt>
                            <dd className="mt-1 text-sm font-medium text-foreground">{campus.address || "—"}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Campus Admin</dt>
                            <dd className="mt-1 text-sm font-medium text-foreground">
                                {campus.campusAdmin?.name || "Unassigned"}
                                {campus.campusAdmin?.email && (
                                    <span className="block text-xs font-normal text-muted-foreground">{campus.campusAdmin.email}</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-4">
                        <CardTitle className="min-w-max">Classes ({campus.classes?.length || 0})</CardTitle>
                        <div className="relative ml-auto w-56">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <Input
                                placeholder="Search classes..."
                                aria-label="Search classes"
                                value={classSearch}
                                onChange={(e) => setClassSearch(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={(campus.classes || []).filter((c) =>
                            !classSearch ||
                            c.className?.toLowerCase().includes(classSearch.toLowerCase()) ||
                            c.classTeacher?.name?.toLowerCase().includes(classSearch.toLowerCase())
                        )}
                        columns={classColumns}
                    />
                </CardContent>
            </Card>

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={GraduationCap} label="Classes" value={campus.classCount ?? "—"} tone="primary" />
                <StatCard icon={Users} label="Teachers" value={campus.teacherCount ?? "—"} tone="success" />
                <StatCard icon={BookOpen} label="Students" value={campus.studentCount ?? "—"} tone="info" />
            </div>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete Campus"
                description={`Are you sure you want to delete "${campus.name}"? This action cannot be undone.`}
                confirmLabel="Delete Campus"
                onConfirm={handleDelete}
                loading={deleting}
            />
        </div>
    );
};

export default CampusDetails;
