import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

  const now = new Date().toISOString();

  const { data: exams, error } = await supabase
    .from("exams")
    .select(`*, question_sets(id, questions(id))`)
    .lte("start_time", now)
    .gte("end_time", now)
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach registration status for current candidate
  const { data: registrations } = await supabase
    .from("exam_registrations")
    .select("exam_id, status, id")
    .eq("candidate_id", user.id);

  const regMap = new Map((registrations ?? []).map((r) => [r.exam_id, r]));

  const enriched = (exams ?? []).map((exam) => ({
    ...exam,
    registration: regMap.get(exam.id) ?? null,
  }));

  return NextResponse.json({ data: enriched });
}
