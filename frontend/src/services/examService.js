import api from "@/utils/api";

export const getExams = (params) => api.get("/exams", { params });
export const createExam = (data) => api.post("/exams", data);
export const updateExam = (id, data) => api.patch(`/exams/${id}`, data);
export const deleteExam = (id) => api.delete(`/exams/${id}/delete`);
