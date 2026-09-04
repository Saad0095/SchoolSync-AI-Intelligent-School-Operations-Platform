import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Term options matching backend enum ["FirstTerm", "SecondTerm"].
 */
export const TERMS = [
  { value: "FirstTerm", label: "First Term" },
  { value: "SecondTerm", label: "Second Term" },
];

/**
 * Academic session options.
 */
export const SESSIONS = [
  { value: "2024-2025", label: "2024–2025" },
  { value: "2025-2026", label: "2025–2026" },
  { value: "2026-2027", label: "2026–2027" },
];

/**
 * Derive the current academic term and session from today's date.
 * Academic year runs July–June:
 *   Jul–Dec  → FirstTerm,  session = `${year}-${year+1}`
 *   Jan–Jun  → SecondTerm, session = `${year-1}-${year}`
 */
export const getCurrentTermAndSession = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  const term = month >= 6 ? "FirstTerm" : "SecondTerm";
  const session = month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  return { term, session };
};

/** Current academic term (e.g. "FirstTerm") */
export const CURRENT_TERM = getCurrentTermAndSession().term;

/** Current academic session (e.g. "2026-2027") */
export const CURRENT_SESSION = getCurrentTermAndSession().session;

/**
 * Reusable Term + Academic Session filter controls.
 *
 * Props:
 *   term        — current term value ("all" | "FirstTerm" | "SecondTerm")
 *   session     — current session value ("all" | "2024-2025" | ...)
 *   onTermChange    — (value: string) => void
 *   onSessionChange — (value: string) => void
 *   showAll     — if true, include an "All" option (default: true)
 *   className   — optional wrapper className
 */
const TermSessionFilter = ({
  term = "all",
  session = "all",
  onTermChange,
  onSessionChange,
  showAll = true,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      {/* Term */}
      <div className="space-y-1.5">
        <Label htmlFor="tsf-term" className="text-xs font-semibold text-muted-foreground">
          Term
        </Label>
        <Select value={term} onValueChange={onTermChange}>
          <SelectTrigger id="tsf-term" className="h-9 w-36">
            <SelectValue placeholder="All Terms" />
          </SelectTrigger>
          <SelectContent>
            {showAll && <SelectItem value="all">All Terms</SelectItem>}
            {TERMS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Academic Session */}
      <div className="space-y-1.5">
        <Label htmlFor="tsf-session" className="text-xs font-semibold text-muted-foreground">
          Session
        </Label>
        <Select value={session} onValueChange={onSessionChange}>
          <SelectTrigger id="tsf-session" className="h-9 w-36">
            <SelectValue placeholder="All Sessions" />
          </SelectTrigger>
          <SelectContent>
            {showAll && <SelectItem value="all">All Sessions</SelectItem>}
            {SESSIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TermSessionFilter;
