import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-sm">
      <Navbar />
      <main className="flex-grow">
        <section className="py-16 md:py-32 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center text-center max-w-container-max mx-auto">
          <h1 className="font-display-room-code text-[32px] md:text-display-room-code text-on-background mb-6 max-w-4xl tracking-tight leading-tight">
            Share code. <br className="md:hidden" />Collaborate. <br className="md:hidden" />Run practicals.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-2xl">
            A temporary room-based platform for college labs, coding classrooms, and programming
            practical tests. Minimal friction, maximum focus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/create")}
              className="font-label-caps text-label-caps bg-primary text-on-primary hover:bg-primary-container px-8 py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span className="material-symbols-outlined">add_box</span>
              Create a Room
            </button>
            <button
              onClick={() => navigate("/join")}
              className="font-label-caps text-label-caps bg-surface-container-lowest text-on-surface border border-outline-variant hover:border-primary hover:text-primary px-8 py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
            >
              <span className="material-symbols-outlined">login</span>
              Join with Code
            </button>
          </div>
        </section>

        <section className="py-16 px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-surface-variant">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">How it Works</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
                Four simple steps to get your classroom coding.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: "add_circle", title: "Create", desc: "Instantly spin up a new temporary room for your session.", bg: "bg-primary-fixed", color: "text-primary" },
                { icon: "share", title: "Share", desc: "Distribute the unique monospace room code to participants.", bg: "bg-secondary-container", color: "text-secondary" },
                { icon: "login", title: "Join", desc: "Students enter the code and instantly connect to the session.", bg: "bg-tertiary-fixed", color: "text-tertiary" },
                { icon: "code", title: "Work", desc: "Collaborate in real-time or run isolated practical exams.", bg: "bg-primary-fixed", color: "text-primary" },
              ].map((step) => (
                <div
                  key={step.title}
                  className="bg-surface-container-lowest p-8 rounded-xl border border-surface-variant flex flex-col items-center text-center hover:border-primary transition-colors group"
                >
                  <div className={`w-16 h-16 rounded-full ${step.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <span className={`material-symbols-outlined ${step.color} text-3xl`}>{step.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-background mb-2">{step.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Tailored for Education</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Choose the environment that fits your teaching needs.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden shadow-sm hover:border-primary transition-colors">
              <div className="p-8 border-b border-surface-variant flex justify-between items-start">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-background mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">school</span>
                    Classroom Mode
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Real-time collaboration and open sharing for interactive labs.
                  </p>
                </div>
                <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full font-label-caps text-label-caps">Collaborative</span>
              </div>
              <div className="p-8 bg-surface-container-low min-h-[200px] flex items-center justify-center">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 w-full font-code-sm text-code-sm text-on-surface-variant shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-surface-variant pb-2">
                    <span className="w-3 h-3 rounded-full bg-red-400"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span className="w-3 h-3 rounded-full bg-green-400"></span>
                    <span className="ml-2 font-label-caps text-label-caps">lab_session.js</span>
                  </div>
                  <pre>{`function collaborativeSort(arr) {
  // Everyone can edit this function
  return arr.sort((a, b) => a - b);
}`}</pre>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden shadow-sm hover:border-error transition-colors">
              <div className="p-8 border-b border-surface-variant flex justify-between items-start">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-background mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-error">assignment</span>
                    Test Room
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Isolated environments for practical exams, with activity monitoring.
                  </p>
                </div>
                <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-caps text-label-caps">Isolated</span>
              </div>
              <div className="p-8 bg-surface-container-low min-h-[200px] flex items-center justify-center">
                <div className="bg-inverse-surface border border-outline-variant rounded-lg p-4 w-full font-code-sm text-code-sm text-surface shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-surface-variant pb-2 text-surface-variant">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span className="ml-1 font-label-caps text-label-caps">exam_environment.py</span>
                  </div>
                  <pre>{`def calculate_score(answers):
    # Isolated submission environment
    score = 0
    return score`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
