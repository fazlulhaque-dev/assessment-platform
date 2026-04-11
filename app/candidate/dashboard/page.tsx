import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CandidateExamList from "@/components/candidate/CandidateExamList";

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

  return <CandidateExamList initialExams={enriched} />;
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
