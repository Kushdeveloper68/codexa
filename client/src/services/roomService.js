import { api } from "./api";

export const roomService = {
  createTestRoom: (payload) => api.post("/test-rooms", payload),
  createClassroom: (payload) => api.post("/classrooms", payload),
  getRoom: (code) => api.get(`/rooms/${code}`),
  joinRoom: (code, payload) => api.post(`/rooms/${code}/join`, payload),
};

export const testService = {
  start: (code) => api.post(`/test/${code}/start`),
  end: (code) => api.post(`/test/${code}/end`),
  dashboard: (code) => api.get(`/test/${code}/dashboard`),
  studentDetail: (code, sessionId) => api.get(`/test/${code}/students/${sessionId}`),
  results: (code) => api.get(`/test/${code}/results`),
  questions: (code) => api.get(`/test/${code}/questions`),
  save: (code, payload) => api.put(`/test/${code}/save`, payload),
  submit: (code) => api.post(`/test/${code}/submit`),
  activity: (code, payload) => api.post(`/test/${code}/activity`, payload),
  mySubmissions: (code) => api.get(`/test/${code}/my-submissions`),
};

export const classroomService = {
  messages: (code) => api.get(`/classroom/${code}/messages`),
  members: (code) => api.get(`/classroom/${code}/members`),
};
