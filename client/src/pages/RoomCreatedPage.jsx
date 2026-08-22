import { useLocation, useNavigate, useParams } from "react-router-dom";
import RoomCodeBadge from "../components/RoomCodeBadge";
import Button from "../components/Button";

export default function RoomCreatedPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const room = location.state?.room;

  return (
    <div className="bg-background text-on-background font-body-sm min-h-screen flex flex-col justify-center items-center p-margin-mobile md:p-margin-desktop">
      <main className="w-full max-w-3xl flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-center">Room Created Successfully</h1>
          <p className="font-body-lg text-body-lg text-secondary text-center mt-2">
            Share this code with your students to begin.
          </p>
        </div>

        <div className="bg-surface w-full rounded-xl border border-outline-variant p-6 md:p-8 mb-8 flex flex-col items-center gap-6 shadow-sm">
          <p className="font-label-caps text-label-caps text-secondary uppercase">Room Code</p>
          <RoomCodeBadge code={code} />
        </div>

        {room && (
          <div className="w-full bg-surface-container-low rounded-lg p-6 mb-8 border border-surface-variant flex flex-col md:flex-row gap-6 md:gap-12 justify-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-fixed p-2 rounded-full text-primary">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <p className="font-label-caps text-label-caps text-secondary">Test Title</p>
                <p className="font-body-lg text-body-lg font-semibold">{room.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary-fixed p-2 rounded-full text-primary">
                <span className="material-symbols-outlined">timer</span>
              </div>
              <div>
                <p className="font-label-caps text-label-caps text-secondary">Duration</p>
                <p className="font-body-lg text-body-lg font-semibold">{room.durationMinutes} Minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary-fixed p-2 rounded-full text-primary">
                <span className="material-symbols-outlined">format_list_numbered</span>
              </div>
              <div>
                <p className="font-label-caps text-label-caps text-secondary">Questions</p>
                <p className="font-body-lg text-body-lg font-semibold">{room.questionCount} Items</p>
              </div>
            </div>
          </div>
        )}

        <Button onClick={() => navigate(`/test/${code}/teacher`)} className="w-full md:w-auto">
          Open Teacher Dashboard
        </Button>
      </main>
    </div>
  );
}
