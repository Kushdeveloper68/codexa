export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-surface-variant mt-auto">
      <div className="w-full py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-4">
        <div className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">terminal</span>
          Codexa
        </div>
        <div className="flex gap-6">
          <a className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors" href="#">Product</a>
          <a className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors" href="#">Privacy</a>
          <a className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors" href="#">Terms</a>
          <a className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors" href="#">Legal</a>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1.5">
          <span className="font-body-sm text-body-sm text-secondary">© 2026 Codexa. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Made by{" "}
              <a
                href="https://kushdeveloper.me"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Kush
              </a>
            </span>
            <a
              href="https://github.com/Kushdeveloper68"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.35.96.1-.74.4-1.25.72-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/kushdeveloper/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
