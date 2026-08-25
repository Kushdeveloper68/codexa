export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-surface-variant mt-auto">
      <div className="w-full py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-4">
        <div className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">terminal</span>
          codexa
        </div>
        <div className="flex gap-6">
          <a className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors" href="#">Product</a>
          <a className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors" href="#">Privacy</a>
          <a className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors" href="#">Terms</a>
          <a className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors" href="#">Legal</a>
        </div>
        <div className="font-body-sm text-body-sm text-secondary">
          © 2026 codexa. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
