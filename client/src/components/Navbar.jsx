import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ active = "" }) {
  const navigate = useNavigate();

  const linkClass = (name) =>
    active === name
      ? "text-primary border-b-2 border-primary font-bold font-label-caps text-label-caps h-16 flex items-center px-2"
      : "text-secondary hover:text-primary transition-colors font-label-caps text-label-caps h-16 flex items-center px-2";

  return (
    <nav className="bg-surface border-b border-surface-variant w-full sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 max-w-container-max mx-auto">
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">terminal</span>
          codexa
        </Link>
        <div className="hidden md:flex gap-8">
          <a className={linkClass("classroom")} href="#">Classroom</a>
          <a className={linkClass("resources")} href="#">Resources</a>
          <a className={linkClass("support")} href="#">Support</a>
        </div>
        <div className="flex gap-2 md:gap-4 shrink-0">
          <button
            onClick={() => navigate("/join")}
            className="font-label-caps text-label-caps text-on-surface-variant bg-surface border border-outline-variant px-2.5 md:px-4 py-2 rounded-DEFAULT hover:bg-surface-container transition-colors whitespace-nowrap"
          >
            Join Room
          </button>
          <button
            onClick={() => navigate("/create")}
            className="font-label-caps text-label-caps text-on-primary bg-primary px-2.5 md:px-4 py-2 rounded-DEFAULT hover:bg-on-primary-fixed-variant transition-colors whitespace-nowrap"
          >
            Create Room
          </button>
        </div>
      </div>
    </nav>
  );
}
