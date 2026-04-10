import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  // Verify the candidate has an active registration for this exam
  const { data: registration } = await supabase
    .from("exam_registrations")
    .select("id, status")
    .eq("exam_id", id)
    .eq("candidate_id", user.id)
    .single();

  if (!registration) {
    return NextResponse.json(
      { error: "Not registered for this exam" },
      { status: 403 },
    );
  }

  const { data: exam, error } = await supabase
    .from("exams")
    .select(
      `*, question_sets(*, questions(id, question_set_id, title, type, options, created_at))`,
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data: exam });
}
