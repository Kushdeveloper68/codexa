import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../components/FormControls";
import Button from "../components/Button";
import { roomService } from "../services/roomService";
import { saveSessionLocally } from "../utils/localSession";

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [roomCode, setRoomCode] = useState("");
  const [roomInfo, setRoomInfo] = useState(null);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleContinue = async () => {
    setError("");
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a room code");
      return;
    }
    setChecking(true);
    try {
      const { room } = await roomService.getRoom(code);
      setRoomInfo(room);
      setStep(2);
    } catch (err) {
      setError(err.message || "Room not found");
    } finally {
      setChecking(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    setJoining(true);
    try {
      const { room, student } = await roomService.joinRoom(roomInfo.code, {
        name,
        rollNumber,
      });
      saveSessionLocally(room.code, student);
      if (room.type === "TEST") {
        navigate(`/test/${room.code}`);
      } else {
        navigate(`/classroom/${room.code}`);
      }
    } catch (err) {
      setError(err.message || "Could not join room");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-sm min-h-screen flex flex-col justify-between">
      <header className="w-full h-16 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-unit max-w-container-max mx-auto border-b border-surface-variant bg-surface">
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">terminal</span>
          CodeClass
        </Link>
        <Link to="/" className="text-body-sm font-body-sm text-secondary hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Cancel
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-margin-mobile">
        <div className="w-full max-w-md">
          {step === 1 && (
            <div className="bg-surface-container-lowest border border-surface-variant rounded-lg p-8 shadow-sm">
              <div className="text-center mb-8">
                <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Join a Room</h1>
                <p className="font-body-sm text-body-sm text-secondary">Enter the room code provided by your instructor.</p>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-center">
                  <label className="font-label-caps text-label-caps text-secondary uppercase tracking-wider" htmlFor="room_code">
                    Room Code
                  </label>
                  <input
                    autoComplete="off"
                    id="room_code"
                    maxLength={5}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                    placeholder="XXXXX"
                    className={`font-display-room-code text-[32px] md:text-display-room-code text-center w-full bg-surface-container-low border rounded focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-outline-variant py-4 tracking-widest uppercase outline-none ${
                      error ? "border-error" : "border-surface-variant focus:border-primary"
                    }`}
                  />
                  {error && <span className="font-body-sm text-body-sm text-error">{error}</span>}
                </div>
                <Button onClick={handleContinue} loading={checking} icon="arrow_forward" className="w-full">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-surface-container-lowest border border-surface-variant rounded-lg p-8 shadow-sm">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center px-3 py-1 bg-primary-fixed rounded-full mb-4">
                  <span className="font-code-sm text-code-sm text-primary tracking-widest font-bold">{roomInfo?.code}</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Participant Details</h2>
                <p className="font-body-sm text-body-sm text-secondary">{roomInfo?.title}</p>
              </div>
              <form onSubmit={handleJoin} className="flex flex-col gap-5">
                <Input
                  id="user_name"
                  label="Your Name"
                  placeholder="e.g., Alex Carter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  id="roll_number"
                  label="Roll Number / Student ID (optional)"
                  placeholder="e.g., S2024-001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                />
                {error && <span className="font-body-sm text-body-sm text-error">{error}</span>}
                <div className="pt-2 flex gap-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} className="w-1/3">
                    Back
                  </Button>
                  <Button type="submit" loading={joining} icon="login" className="w-2/3">
                    Join Room
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-surface-container-low border-t border-surface-variant w-full py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto mt-auto">
        <div className="font-headline-md text-headline-md text-primary mb-4 md:mb-0">CodeClass</div>
        <div className="font-body-sm text-body-sm text-secondary">© 2026 CodeClass. All rights reserved.</div>
      </footer>
    </div>
  );
}
