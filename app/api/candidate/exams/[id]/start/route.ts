import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  // Check exam exists and is active
  const now = new Date().toISOString();
  const { data: exam } = await supabase
    .from("exams")
    .select("id, total_slots")
    .eq("id", id)
    .lte("start_time", now)
    .gte("end_time", now)
    .single();

  if (!exam) {
    return NextResponse.json(
      { error: "Exam not found or not active" },
      { status: 404 },
    );
  }

  // Check if already registered — must come before slot check so returning
  // candidates are never blocked by their own registration counting toward capacity
  const { data: existing } = await supabase
    .from("exam_registrations")
    .select("id, status")
    .eq("exam_id", id)
    .eq("candidate_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ data: existing });
  }

  // Check slot availability (only for new registrations)
  const { count } = await supabase
    .from("exam_registrations")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", id);

  if ((count ?? 0) >= exam.total_slots) {
    return NextResponse.json({ error: "No slots available" }, { status: 409 });
  }

  const { data: registration, error } = await supabase
    .from("exam_registrations")
    .insert({
      exam_id: id,
      candidate_id: user.id,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: registration }, { status: 201 });
}
