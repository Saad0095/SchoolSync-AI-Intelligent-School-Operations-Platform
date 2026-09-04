import api from "@/utils/api";

export const getCampuses = (params) => api.get("/campuses", { params });
export const getCampusById = (id) => api.get(`/campuses/${id}`);
export const createCampus = (data) => api.post("/campuses", data);
export const updateCampus = (id, data) => api.patch(`/campuses/${id}`, data);
export const deleteCampus = (id) => api.post(`/campuses/${id}/delete`);
export const getCampusAdmins = () => api.get("/campuses/admins");
export const getCampusDetails = (params) => api.get("/campuses/details", { params });
