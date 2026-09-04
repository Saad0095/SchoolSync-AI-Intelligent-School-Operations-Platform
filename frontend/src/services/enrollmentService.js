import api from "@/utils/api";

// Teacher assignments
export const getTeacherAssignments = (params) => api.get("/enrollments/teacher-assignments", { params });
export const getUnassignedTeachers = (params) => api.get("/enrollments/unassigned-teachers", { params });
export const assignTeacher = (data) => api.post("/enrollments/assign-teacher", data);
export const updateTeacherAssignment = (id, data) => api.patch(`/enrollments/assign-teacher/${id}`, data);
export const deleteTeacherAssignment = (id, data) => api.post(`/enrollments/assign-teacher/${id}/delete`, data);

// Student enrollments
export const getStudentEnrollments = (params) => api.get("/enrollments/student-enrollments", { params });
export const enrollStudent = (data) => api.post("/enrollments/enroll-student", data);
export const updateStudentEnrollment = (id, data) => api.patch(`/enrollments/enroll-student/${id}`, data);
export const deleteStudentEnrollment = (id) => api.post(`/enrollments/enroll-student/${id}/delete`);
