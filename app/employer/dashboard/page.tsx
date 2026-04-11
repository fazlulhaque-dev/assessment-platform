import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlusCircle, ClipboardList } from "lucide-react";
import Link from "next/link";
import EmployerExamList from "@/components/employer/EmployerExamList";

async function ExamsList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: exams } = await supabase
    .from("exams")
    .select(
      `*, question_sets(id, title, questions(id)), exam_registrations(id)`,
    )
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  if (!exams || exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-1">
          No online tests available
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Create your first exam to get started
        </p>
        <Link href="/employer/exams/create" className={cn(buttonVariants())}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Exam
        </Link>
      </div>
    );
  }

  return <EmployerExamList initialExams={exams} />;
}

function ExamsListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-52 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export default function EmployerDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Online Tests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and monitor your assessments
          </p>
        </div>
        <Link href="/employer/exams/create" className={cn(buttonVariants())}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Online Test
        </Link>
      </div>
      <Suspense fallback={<ExamsListSkeleton />}>
        <ExamsList />
      </Suspense>
    </div>
  );
}
