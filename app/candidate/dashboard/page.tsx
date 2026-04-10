import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CandidateExamCard } from "@/components/shared/ExamCard";
import { BookOpen } from "lucide-react";

async function AvailableExams() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date().toISOString();

  const { data: exams } = await supabase
    .from("exams")
    .select(`*, question_sets(id, questions(id))`)
    .gte("end_time", now)
    .order("start_time", { ascending: true });

  const { data: registrations } = await supabase
    .from("exam_registrations")
    .select("exam_id, status, id")
    .eq("candidate_id", user.id);

  const regMap = new Map((registrations ?? []).map((r) => [r.exam_id, r]));

  const enriched = (exams ?? []).map((exam) => ({
    ...exam,
    registration: regMap.get(exam.id) ?? null,
  }));

  if (enriched.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-1">No available exams</h2>
        <p className="text-sm text-muted-foreground">
          Check back later for upcoming assessments
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {enriched.map((exam) => (
        <CandidateExamCard
          key={exam.id}
          exam={exam as Parameters<typeof CandidateExamCard>[0]["exam"]}
        />
      ))}
    </div>
  );
}

function ExamsListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export default function CandidateDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Available Exams</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Active and upcoming assessments
        </p>
      </div>
      <Suspense fallback={<ExamsListSkeleton />}>
        <AvailableExams />
      </Suspense>
    </div>
  );
}
