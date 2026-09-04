import api from "@/utils/api";

export const getClasses = (params) => api.get("/classes", { params });
export const getClassById = (id) => api.get(`/classes/${id}`);
export const createClass = (data) => api.post("/classes", data);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data);
export const deleteClass = (id) => api.delete(`/classes/${id}`);
