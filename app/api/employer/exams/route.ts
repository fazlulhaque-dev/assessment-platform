import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateExamPayload } from "@/types";

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

  if (profile?.role !== "employer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: exams, error } = await supabase
    .from("exams")
    .select(
      `*, question_sets(id, title, questions(id)), exam_registrations(id)`,
    )
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: exams });
}

export async function POST(request: NextRequest) {
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

  if (profile?.role !== "employer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: CreateExamPayload = await request.json();
  const { basicInfo, questionSets } = body;

  // Create exam
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({
      employer_id: user.id,
      title: basicInfo.title,
      total_candidates: basicInfo.total_candidates,
      total_slots: basicInfo.total_slots,
      start_time: basicInfo.start_time,
      end_time: basicInfo.end_time,
      duration: basicInfo.duration,
      negative_marking: basicInfo.negative_marking,
    })
    .select()
    .single();

  if (examError) {
    return NextResponse.json({ error: examError.message }, { status: 500 });
  }

  // Create question sets and questions
  for (const qs of questionSets) {
    const { data: questionSet, error: qsError } = await supabase
      .from("question_sets")
      .insert({ exam_id: exam.id, title: qs.title })
      .select()
      .single();

    if (qsError) continue;

    if (qs.questions.length > 0) {
      await supabase.from("questions").insert(
        qs.questions.map((q) => ({
          question_set_id: questionSet.id,
          title: q.title,
          type: q.type,
          options: q.options?.length ? q.options : null,
          correct_answers: q.correct_answers?.length ? q.correct_answers : null,
        })),
      );
    }
  }

  return NextResponse.json({ data: exam }, { status: 201 });
}
