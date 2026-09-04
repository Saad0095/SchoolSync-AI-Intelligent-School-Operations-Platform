import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'
import { createClass, updateClass } from '@/api/classes'
import { useAuth } from '@/context/AuthContext'

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

export function AddClassModal({ open, onOpenChange, onSuccess, initialData }) {
    const isEdit = !!initialData;
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super-admin';
    const [form, setForm] = useState({
        grade: '',
        section: '',
        campus: '',
        classTeacher: '',
        subjects: [],
    })

    const [campuses, setCampuses] = useState([])
    const [teachers, setTeachers] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(false)
    const [subjectsOpen, setSubjectsOpen] = useState(false)


    useEffect(() => {
        if (!open) return

        // Pre-fill form when editing
        if (initialData) {
            setForm({
                grade: initialData.grade?.toString() || '',
                section: initialData.section || '',
                campus: initialData.campus || initialData.campusId || '',
                classTeacher: initialData.classTeacher?._id || initialData.classTeacher || '',
                subjects: Array.isArray(initialData.subjects) ? initialData.subjects.map(s => s._id || s) : [],
            });
        } else {
            setForm({ grade: '', section: '', campus: '', classTeacher: '', subjects: [] });
        }

        const fetchDropdowns = async () => {
            try {
                // Fetch independently so if one fails (like /campuses for campus-admin), the others still load
                const [campusRes, teacherRes, subjectRes] = await Promise.all([
                    isSuperAdmin ? api.get('/campuses').catch(() => ({ campuses: [] })) : Promise.resolve({ campuses: [] }),
                    api.get('/auth/users?role=teacher').catch(() => ({ users: [] })),
                    api.get('/subjects').catch(() => []),
                ])

                setCampuses(campusRes?.campuses || [])
                setTeachers(teacherRes?.users || [])
                setSubjects(Array.isArray(subjectRes) ? subjectRes : subjectRes.data || [])
            } catch (err) {
                console.error("Failed to fetch dropdowns", err)
            }
        }

        fetchDropdowns()
    }, [open, isSuperAdmin, initialData])

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const payload = {
                grade: Number(form.grade),
                section: form.section,
                campus: form.campus || undefined,
                classTeacher: form.classTeacher || undefined,
                subjects: form.subjects,
            }
            if (isEdit) {
                await updateClass(initialData._id, payload)
                toast.success('Class updated successfully')
            } else {
                await createClass(payload)
                toast.success('Class created successfully')
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || (isEdit ? 'Failed to update class' : 'Failed to create class'))
        } finally {
            setLoading(false)
        }
    }

    const toggleSubject = (id) => {
        setForm((prev) => ({
            ...prev,
            subjects: prev.subjects.includes(id)
                ? prev.subjects.filter((s) => s !== id)
                : [...prev.subjects, id],
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-card">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Class' : 'Add Class'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="class-grade">Grade *</Label>
                        <Input
                            id="class-grade"
                            type="number"
                            value={form.grade}
                            onChange={(e) => setForm({ ...form, grade: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="class-section">Section *</Label>
                        <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}>
                            <SelectTrigger id="class-section">
                                <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                {SECTIONS.map((s) => (
                                    <SelectItem key={s} value={s} className={"cursor-pointer hover:bg-muted"}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isSuperAdmin && (
                        <div className="grid gap-2">
                            <Label htmlFor="class-campus">Campus</Label>
                            <Select value={form.campus} onValueChange={(v) => setForm({ ...form, campus: v })}>
                                <SelectTrigger id="class-campus">
                                    <SelectValue placeholder="Select campus" />
                                </SelectTrigger>
                                <SelectContent className={"bg-card"}>
                                    {campuses.map((c) => (
                                        <SelectItem key={c._id} value={c._id} className={"cursor-pointer hover:bg-muted"}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="class-subjects">Subjects</Label>

                        <Select open={subjectsOpen} onOpenChange={setSubjectsOpen}>
                            <SelectTrigger id="class-subjects" className="w-full">
                                <SelectValue
                                    placeholder="Select subjects"
                                >
                                    {form.subjects.length
                                        ? `${form.subjects.length} selected`
                                        : "Select subjects"}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent
                                position="popper"
                                side="top"
                                className="max-h-72 overflow-y-auto bg-card"
                            >
                                {subjects.length === 0 ? (
                                    <p className="px-2 py-3 text-sm text-muted-foreground">No subjects available.</p>
                                ) : (
                                    subjects.map((s) => (
                                        <button
                                            type="button"
                                            key={s._id}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                toggleSubject(s._id)
                                            }}
                                            aria-pressed={form.subjects.includes(s._id)}
                                            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                                        >
                                            <Check
                                                className={`h-4 w-4 ${form.subjects.includes(s._id) ? "opacity-100" : "opacity-0"}`}
                                                aria-hidden="true"
                                            />
                                            {s.name}
                                        </button>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="class-teacher">Class Teacher</Label>
                        <Select value={form.classTeacher} onValueChange={(v) => setForm({ ...form, classTeacher: v })}>
                            <SelectTrigger id="class-teacher">
                                <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                {teachers.map((t) => (
                                    <SelectItem key={t._id} value={t._id} className={"cursor-pointer hover:bg-muted"}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={loading || !form.grade || !form.section}>
                        {loading ? 'Saving…' : (isEdit ? 'Update Class' : 'Create Class')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
