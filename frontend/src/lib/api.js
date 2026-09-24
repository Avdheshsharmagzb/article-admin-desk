import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const newsApi = {
  stats: () => axios.get(`${API}/news/stats`).then((r) => r.data),
  list: (status) =>
    axios
      .get(`${API}/news`, { params: status ? { status } : {} })
      .then((r) => r.data),
  update: (id, payload) =>
    axios.patch(`${API}/news/${id}`, payload).then((r) => r.data),
  setStatus: (id, status) =>
    axios.patch(`${API}/news/${id}/status`, { status }).then((r) => r.data),
  remove: (id) => axios.delete(`${API}/news/${id}`).then((r) => r.data),
};
