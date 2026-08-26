import { api } from "./api";
import { getLocalSession, getTeacherToken } from "../utils/localSession";

// Cross-site cookies (Vercel frontend, Render backend) are unreliable —
// browsers increasingly block third-party cookies by default (Chrome
// Incognito already does). So every authenticated call explicitly sends
// its session token as a header, read from localStorage, instead of
// relying only on the cookie the server also sets. See
// utils/localSession.js and the server's requireStudent/requireTeacher
// middleware for the matching server-side logic.
function studentHeaders(code) {
  const session = getLocalSession(code);
  return session?.sessionId ? { "X-Student-Session": session.sessionId } : {};
}

function teacherHeaders(code) {
  const token = getTeacherToken(code);
  return token ? { "X-Teacher-Token": token } : {};
}

export const roomService = {
  createTestRoom: (payload) => api.post("/test-rooms", payload),
  createClassroom: (payload) => api.post("/classrooms", payload),
  getRoom: (code) => api.get(`/rooms/${code}`),
  joinRoom: (code, payload) => api.post(`/rooms/${code}/join`, payload),
};

export const testService = {
  start: (code) => api.post(`/test/${code}/start`, undefined, teacherHeaders(code)),
  end: (code) => api.post(`/test/${code}/end`, undefined, teacherHeaders(code)),
  dashboard: (code) => api.get(`/test/${code}/dashboard`, teacherHeaders(code)),
  studentDetail: (code, sessionId) =>
    api.get(`/test/${code}/students/${sessionId}`, teacherHeaders(code)),
  results: (code) => api.get(`/test/${code}/results`, teacherHeaders(code)),
  questions: (code) => api.get(`/test/${code}/questions`, studentHeaders(code)),
  save: (code, payload) => api.put(`/test/${code}/save`, payload, studentHeaders(code)),
  run: (code, payload) => api.post(`/test/${code}/run`, payload, studentHeaders(code)),
  submit: (code) => api.post(`/test/${code}/submit`, undefined, studentHeaders(code)),
  activity: (code, payload) => api.post(`/test/${code}/activity`, payload, studentHeaders(code)),
  mySubmissions: (code) => api.get(`/test/${code}/my-submissions`, studentHeaders(code)),
};

export const classroomService = {
  messages: (code) => api.get(`/classroom/${code}/messages`),
  members: (code) => api.get(`/classroom/${code}/members`),
};
