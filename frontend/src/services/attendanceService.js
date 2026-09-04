import api from "@/utils/api";

export const getStudentAttendance = (params) => api.get("/attendance/students", { params });
export const getStudentAttendanceById = (studentId, params) => api.get(`/attendance/students/${studentId}`, { params });
export const markBulkAttendance = (data) => api.post("/attendance/students/markAttendance", data);
export const updateStudentAttendance = (id, data) => api.put(`/attendance/students/student/${id}`, data);
export const deleteStudentAttendance = (id) => api.delete(`/attendance/students/student/${id}`);

export const getTeacherAttendance = (teacherId, params) => api.get(`/attendance/teachers/${teacherId}`, { params });
export const getAllTeacherAttendance = (params) => api.get("/attendance/teachers", { params });
export const markTeacherAttendance = (data) => api.post("/attendance/teachers/markAttendance", data);
export const teacherCheckOut = (data) => api.put("/attendance/teachers/checkout", data);
export const updateTeacherAttendance = (id, data) => api.put(`/attendance/teachers/teacher/${id}`, data);
export const deleteTeacherAttendance = (id) => api.delete(`/attendance/teachers/teacher/${id}`);
export const markBulkTeacherAttendance = (data) => api.post("/attendance/teachers/bulk", data);
