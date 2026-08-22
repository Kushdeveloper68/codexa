import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CreateChoicePage from "./pages/CreateChoicePage";
import CreateTestRoomPage from "./pages/CreateTestRoomPage";
import CreateClassroomPage from "./pages/CreateClassroomPage";
import RoomCreatedPage from "./pages/RoomCreatedPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import StudentTestRoomPage from "./pages/StudentTestRoomPage";
import StudentClassroomPage from "./pages/StudentClassroomPage";
import ResultsPage from "./pages/ResultsPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreateChoicePage />} />
        <Route path="/create/test" element={<CreateTestRoomPage />} />
        <Route path="/create/classroom" element={<CreateClassroomPage />} />
        <Route path="/create/test/:code/created" element={<RoomCreatedPage />} />
        <Route path="/join" element={<JoinRoomPage />} />

        <Route path="/test/:code" element={<StudentTestRoomPage />} />
        <Route path="/test/:code/teacher" element={<TeacherDashboardPage />} />
        <Route path="/test/:code/results" element={<ResultsPage />} />

        <Route path="/classroom/:code" element={<StudentClassroomPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
