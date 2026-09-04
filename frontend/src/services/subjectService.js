import api from "@/utils/api";

export const getSubjects = (params) => api.get("/subjects", { params });
export const getSubjectById = (id) => api.get(`/subjects/${id}`);
export const createSubject = (data) => api.post("/subjects", data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);
