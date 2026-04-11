import { Exam } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";
import {
  Clock,
  Users,
  BookOpen,
  CalendarClock,
  ChevronRight,
  Play,
  MinusCircle,
  Layers,
} from "lucide-react";
import Link from "next/link";

interface EmployerExamCardProps {
  exam: Exam & {
    question_sets?: { id: string; questions?: { id: string }[] }[];
    exam_registrations?: { id: string }[];
    registration?: null;
  };
}

interface CandidateExamCardProps {
  exam: Exam & {
    question_sets?: { id: string; questions?: { id: string }[] }[];
    registration?: { id: string; status: string } | null;
  };
}

function StatPill({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export function EmployerExamCard({ exam }: EmployerExamCardProps) {
  const questionCount =
    exam.question_sets?.reduce(
      (acc, qs) => acc + (qs.questions?.length ?? 0),
      0,
    ) ?? 0;
  const candidateCount = exam.exam_registrations?.length ?? 0;

  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);
  const isActive = now >= start && now <= end;
  const isUpcoming = now < start;

  const statusConfig = isActive
    ? {
        label: "Active",
        className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
      }
    : isUpcoming
      ? {
          label: "Upcoming",
          className: "bg-blue-500/15 text-blue-600 border-blue-500/20",
        }
      : {
          label: "Ended",
          className: "bg-muted text-muted-foreground border-border",
        };

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Accent bar */}
      <div
        className={cn(
          "h-1 w-full",
          isActive
            ? "bg-emerald-500"
            : isUpcoming
              ? "bg-blue-500"
              : "bg-muted-foreground/30",
        )}
      />

      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">
            {exam.title}
          </h3>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              statusConfig.className,
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatPill
            icon={Users}
            label={`${candidateCount}/${exam.total_candidates} candidates`}
          />
          <StatPill icon={Clock} label={`${exam.duration} min`} />
          <StatPill
            icon={Layers}
            label={`${exam.question_sets?.length ?? 0} sets`}
          />
          <StatPill icon={BookOpen} label={`${questionCount} questions`} />
          <StatPill
            icon={MinusCircle}
            label={exam.negative_marking ? "-0.25 per wrong" : "No penalty"}
          />
        </div>

        {/* Time range */}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {formatDateTime(exam.start_time)}
          {" — "}
          {formatDateTime(exam.end_time)}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <Link
          href={`/employer/exams/${exam.id}/candidates`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full justify-center gap-1",
          )}
        >
          View Candidates
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function CandidateExamCard({ exam }: CandidateExamCardProps) {
  const totalQuestions =
    exam.question_sets?.reduce(
      (acc, qs) => acc + (qs.questions?.length ?? 0),
      0,
    ) ?? 0;

  const reg = exam.registration;
  const isSubmitted = reg?.status === "submitted";
  const isInProgress = reg?.status === "in_progress";

  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);
  const isActive = now >= start && now <= end;
  const isUpcoming = now < start;

  const statusConfig = isSubmitted
    ? {
        label: "Submitted",
        className: "bg-muted text-muted-foreground border-border",
      }
    : isInProgress
      ? {
          label: "In Progress",
          className: "bg-blue-500/15 text-blue-600 border-blue-500/20",
        }
      : isUpcoming
        ? {
            label: "Upcoming",
            className: "bg-amber-500/15 text-amber-600 border-amber-500/20",
          }
        : isActive
          ? {
              label: "Active",
              className:
                "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
            }
          : {
              label: "Ended",
              className: "bg-muted text-muted-foreground border-border",
            };

  const accentColor = isSubmitted
    ? "bg-muted-foreground/30"
    : isInProgress
      ? "bg-blue-500"
      : isUpcoming
        ? "bg-amber-500"
        : isActive
          ? "bg-emerald-500"
          : "bg-muted-foreground/30";

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Accent bar */}
      <div className={cn("h-1 w-full", accentColor)} />

      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">
            {exam.title}
          </h3>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              statusConfig.className,
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatPill icon={Clock} label={`${exam.duration} min`} />
          <StatPill icon={BookOpen} label={`${totalQuestions} questions`} />
          <StatPill
            icon={MinusCircle}
            label={exam.negative_marking ? "-0.25 per wrong" : "No penalty"}
          />
          {isUpcoming && (
            <StatPill
              icon={CalendarClock}
              label={start.toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        {isSubmitted ? (
          <button
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full cursor-not-allowed opacity-50",
            )}
            disabled
          >
            Already Submitted
          </button>
        ) : isUpcoming ? (
          <button
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full cursor-not-allowed opacity-50",
            )}
            disabled
          >
            Starts {formatDateTime(exam?.start_time)}
          </button>
        ) : isActive ? (
          <Link
            href={`/candidate/exam/${exam.id}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "w-full justify-center gap-1.5",
            )}
          >
            <Play className="h-4 w-4" />
            {isInProgress ? "Continue Exam" : "Start Exam"}
          </Link>
        ) : (
          <button
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full cursor-not-allowed opacity-50",
            )}
            disabled
          >
            Exam Ended
          </button>
        )}
      </div>
    </div>
  );
}
