import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { Input, Textarea, Select } from "../components/FormControls";
import { roomService } from "../services/roomService";

const LANGUAGES = ["C", "C++", "Java", "Python", "JavaScript"];

export default function CreateTestRoomPage() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("Python");
  const [duration, setDuration] = useState("");
  const [questions, setQuestions] = useState([{ title: "", description: "" }]);
  const [settings, setSettings] = useState({
    fullscreenRequired: false,
    activityMonitoring: true,
    autosave: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const addQuestion = () => setQuestions((q) => [...q, { title: "", description: "" }]);
  const removeQuestion = (i) => setQuestions((q) => q.filter((_, idx) => idx !== i));
  const updateQuestion = (i, field, value) =>
    setQuestions((q) => q.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const validate = () => {
    const errs = {};
    if (!teacherName.trim()) errs.teacherName = "Required";
    if (!title.trim()) errs.title = "Required";
    if (!duration || Number(duration) < 1) errs.duration = "Enter a valid duration";
    if (questions.some((q) => !q.description.trim())) errs.questions = "Every question needs a description";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { room } = await roomService.createTestRoom({
        teacherName,
        title,
        language,
        durationMinutes: Number(duration),
        questions: questions.map((q) => ({ title: q.title, description: q.description })),
        settings,
      });
      navigate(`/create/test/${room.code}/created`, { state: { room } });
    } catch (err) {
      setApiError(err.message || "Could not create room. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-sm">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop py-8 md:py-16">
        <div className="w-full max-w-2xl bg-surface-container-lowest border border-surface-variant rounded-xl shadow-sm p-6 md:p-8">
          <div className="mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">Create Test Room</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Configure the environment and questions for your upcoming test.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-3 bg-error-container text-on-error-container rounded-DEFAULT font-body-sm text-body-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="teacher-name"
                  label="Teacher Name"
                  placeholder="e.g. Prof. Smith"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  error={errors.teacherName}
                />
                <Input
                  id="test-title"
                  label="Test Title"
                  placeholder="e.g. Midterm Data Structures"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select id="language" label="Programming Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
                <Input
                  id="duration"
                  label="Duration (Minutes)"
                  type="number"
                  min="1"
                  placeholder="e.g. 60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  error={errors.duration}
                />
              </div>

              <hr className="border-surface-variant my-2" />

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-headline-md text-headline-md text-on-background">Questions</h2>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1 font-label-caps text-label-caps"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span> Add Question
                  </button>
                </div>
                {errors.questions && (
                  <p className="font-body-sm text-body-sm text-error mb-3">{errors.questions}</p>
                )}
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={i} className="bg-surface border border-surface-variant rounded-lg p-4 relative group">
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(i)}
                          className="absolute top-2 right-2 text-outline hover:text-error transition-colors"
                          title="Remove Question"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                      <Textarea
                        label={`Question ${i + 1}`}
                        placeholder="Describe the programming problem..."
                        rows={3}
                        value={q.description}
                        onChange={(e) => updateQuestion(i, "description", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-surface-variant my-2" />

              <div>
                <h2 className="font-headline-md text-headline-md text-on-background mb-4">Settings</h2>
                <div className="space-y-3">
                  {[
                    { key: "fullscreenRequired", label: "Require fullscreen mode" },
                    { key: "activityMonitoring", label: "Enable activity monitoring" },
                    { key: "autosave", label: "Autosave student code" },
                  ].map((s) => (
                    <label key={s.key} className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[s.key]}
                        onChange={(e) => setSettings((prev) => ({ ...prev, [s.key]: e.target.checked }))}
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" icon="rocket_launch" loading={submitting} className="w-full md:w-auto">
                  Create Test Room
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
