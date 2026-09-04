import api from "@/utils/api";

export const getMarksheet = (params) => api.get("/result/marksheet", { params });
