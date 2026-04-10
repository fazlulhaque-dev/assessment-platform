import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { ExamRegistration } from "@/types";
import { notFound } from "next/navigation";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  not_started: { label: "Not Started", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  submitted: { label: "Submitted", variant: "secondary" },
  expired: { label: "Expired", variant: "destructive" },
};

async function CandidatesList({ examId }: { examId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title")
    .eq("id", examId)
    .eq("employer_id", user.id)
    .single();

  if (!exam) notFound();

  const { data: registrations } = await supabase
    .from("exam_registrations")
    .select(`*, candidate:profiles(id, full_name, email)`)
    .eq("exam_id", examId)
    .order("created_at", { ascending: false });

  const regs =
    (registrations as (ExamRegistration & {
      candidate: { full_name: string; email: string };
    })[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/employer/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-xl font-bold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">Candidates</p>
        </div>
      </div>

      {regs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No candidates have started this exam yet
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regs.map((reg) => {
                const cfg =
                  statusConfig[reg.status] ?? statusConfig.not_started;
                return (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      {reg.candidate?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {reg.candidate?.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reg.started_at
                        ? new Date(reg.started_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reg.submitted_at
                        ? new Date(reg.submitted_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default async function CandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-40 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-md" />
        </div>
      }
    >
      <CandidatesList examId={id} />
    </Suspense>
  );
}
