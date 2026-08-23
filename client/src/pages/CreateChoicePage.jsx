import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function CreateChoicePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-sm">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop py-10 md:py-16">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="font-headline-lg text-[26px] md:text-headline-lg text-on-background mb-2">Create a Room</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">What are you setting up today?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-gutter">
            <button
              onClick={() => navigate("/create/classroom")}
              className="text-left bg-surface-container-lowest border border-surface-variant rounded-xl p-5 md:p-8 hover:border-primary transition-colors shadow-sm"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary-fixed flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">school</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-background mb-2">Classroom</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Live code sharing, real-time collaboration, and chat for lab sessions.
              </p>
            </button>
            <button
              onClick={() => navigate("/create/test")}
              className="text-left bg-surface-container-lowest border border-surface-variant rounded-xl p-5 md:p-8 hover:border-error transition-colors shadow-sm"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-error-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-error text-2xl">assignment</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-background mb-2">Test Room</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Timed practical exam with questions, autosave, and activity monitoring.
              </p>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
