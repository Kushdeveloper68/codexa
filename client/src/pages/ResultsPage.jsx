import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import StatusBadge from "../components/StatusBadge";
import { testService } from "../services/roomService";

export default function ResultsPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testService
      .results(code)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-body-sm text-secondary">Loading results...</div>;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <div className="bg-background min-h-screen flex flex-col font-body-sm">
      <header className="bg-surface border-b border-surface-variant flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16">
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary">codexa</Link>
      </header>
      <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-6 md:py-gutter">
        <div className="mb-6 md:mb-8">
          <h1 className="font-headline-lg text-[22px] md:text-headline-lg text-on-background mb-2 break-words">{data.room.title} — Results</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {data.submittedCount} of {data.totalStudents} students submitted
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-lg shadow-sm divide-y divide-surface-variant">
          {data.students.map((s) => (
            <div key={s.sessionId}>
              <button
                onClick={() => setExpanded(expanded === s.sessionId ? null : s.sessionId)}
                className="w-full flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-3 md:py-4 hover:bg-surface-bright transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">{s.name}</span>
                  {s.rollNumber && <span className="font-code-sm text-code-sm text-secondary shrink-0">{s.rollNumber}</span>}
                </div>
                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                  <StatusBadge status={s.submitted ? "SUBMITTED" : "NOT_STARTED"} />
                  <span className="material-symbols-outlined text-secondary">
                    {expanded === s.sessionId ? "expand_less" : "expand_more"}
                  </span>
                </div>
              </button>
              {expanded === s.sessionId && (
                <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-4">
                  {s.submissions.length === 0 && (
                    <p className="font-body-sm text-body-sm text-secondary">No code submitted.</p>
                  )}
                  {s.submissions.map((sub, i) => (
                    <div key={i} className="bg-[#1e1e1e] rounded-lg p-3 md:p-4 overflow-x-auto">
                      <pre className="font-code-sm text-code-sm text-[#d4d4d4]">{sub.code || "// empty"}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
