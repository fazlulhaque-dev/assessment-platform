import { Exam } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Users,
  BookOpen,
  CalendarClock,
  ChevronRight,
  Play,
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

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
            {exam.title}
          </CardTitle>
          <Badge
            variant={
              isActive ? "default" : isUpcoming ? "secondary" : "outline"
            }
            className="shrink-0"
          >
            {isActive ? "Active" : isUpcoming ? "Upcoming" : "Ended"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            {candidateCount} / {exam.total_candidates} candidates
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>
            {exam.question_sets?.length ?? 0} sets · {questionCount} questions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{exam.duration} min</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          <span>{exam.total_slots} slots</span>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-3">
        <Link
          href={`/employer/exams/${exam.id}/candidates`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full justify-center",
          )}
        >
          View Candidates
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
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

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
            {exam.title}
          </CardTitle>
          {isSubmitted ? (
            <Badge variant="secondary">Submitted</Badge>
          ) : isInProgress ? (
            <Badge>In Progress</Badge>
          ) : isUpcoming ? (
            <Badge variant="secondary">Upcoming</Badge>
          ) : isActive ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="outline">Ended</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{exam.duration} min</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>{totalQuestions} questions</span>
        </div>
        {isUpcoming && (
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span>
              Starts{" "}
              {start.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Negative Marking:</span>
          <Badge
            variant={exam.negative_marking ? "destructive" : "outline"}
            className="text-xs"
          >
            {exam.negative_marking ? "Yes" : "No"}
          </Badge>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-3">
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
            Not Started Yet
          </button>
        ) : isActive ? (
          <Link
            href={`/candidate/exam/${exam.id}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "w-full justify-center",
            )}
          >
            <Play className="mr-1.5 h-4 w-4" />
            {isInProgress ? "Continue" : "Start"}
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
      </CardFooter>
    </Card>
  );
}
