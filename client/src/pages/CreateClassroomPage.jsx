import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { Input, Select } from "../components/FormControls";
import { roomService } from "../services/roomService";
import { saveSessionLocally } from "../utils/localSession";

const LANGUAGES = ["JavaScript", "Python", "Java", "C++", "C"];

export default function CreateClassroomPage() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const errs = {};
    if (!teacherName.trim()) errs.teacherName = "Required";
    if (!title.trim()) errs.title = "Required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { room, student } = await roomService.createClassroom({ teacherName, title, language });
      saveSessionLocally(room.code, student);
      navigate(`/classroom/${room.code}`);
    } catch (err) {
      setApiError(err.message || "Could not create classroom. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-sm">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-margin-mobile">
        <div className="w-full max-w-md bg-surface-container-lowest border border-surface-variant rounded-lg p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Create a Classroom</h1>
            <p className="font-body-sm text-body-sm text-secondary">Set up a live collaborative coding session.</p>
          </div>
          {apiError && (
            <div className="mb-6 p-3 bg-error-container text-on-error-container rounded-DEFAULT font-body-sm text-body-sm">
              {apiError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              id="teacher-name"
              label="Your Name"
              placeholder="e.g. Prof. Smith"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              error={errors.teacherName}
            />
            <Input
              id="classroom-title"
              label="Classroom Name"
              placeholder="e.g. Data Structures Lab"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />
            <Select id="language" label="Default Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
            <Button type="submit" icon="add_box" loading={submitting}>
              Create Classroom
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
