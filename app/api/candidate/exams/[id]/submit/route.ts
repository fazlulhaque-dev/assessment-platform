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

  const { registrationId } = await request.json();

  const { data: reg } = await supabase
    .from("exam_registrations")
    .select("id, status")
    .eq("id", registrationId)
    .eq("candidate_id", user.id)
    .eq("exam_id", examId)
    .single();

  if (!reg) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reg.status === "submitted") {
    return NextResponse.json({ data: reg });
  }

  const { data: updated, error } = await supabase
    .from("exam_registrations")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", registrationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: updated });
}
