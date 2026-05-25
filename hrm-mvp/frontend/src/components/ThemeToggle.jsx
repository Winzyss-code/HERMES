import { useEffect, useState } from "react";


const SunIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.25 15.28A8.3 8.3 0 0 1 8.72 3.75 8.3 8.3 0 1 0 20.25 15.28Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getInitialTheme = () => {
  const saved = localStorage.getItem("hermes_theme");
  if (saved) return saved === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const ThemeToggle = ({ className = "" }) => {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("hermes_theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-indigo-600 hover:shadow-md ${className}`}
      type="button"
      title={isDark ? "Light theme" : "Dark theme"}
      onClick={() => setIsDark((current) => !current)}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};

export default ThemeToggle;
