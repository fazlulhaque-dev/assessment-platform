import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: examId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "candidate") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { registrationId, questionId, answer } = await request.json();

  // Verify the exam is still within its time window
  const now = new Date().toISOString();
  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", examId)
    .lte("start_time", now)
    .gte("end_time", now)
    .single();

  if (!exam) {
    return NextResponse.json({ error: "Exam is not active" }, { status: 403 });
  }

  // Validate registration belongs to this candidate and exam
  const { data: reg } = await supabase
    .from("exam_registrations")
    .select("id, status")
    .eq("id", registrationId)
    .eq("candidate_id", user.id)
    .eq("exam_id", examId)
    .single();

  if (!reg || reg.status === "submitted") {
    return NextResponse.json(
      { error: "Invalid or already submitted registration" },
      { status: 403 },
    );
  }

  const { error } = await supabase.from("exam_answers").upsert(
    {
      registration_id: registrationId,
      question_id: questionId,
      answer,
    },
    { onConflict: "registration_id,question_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
