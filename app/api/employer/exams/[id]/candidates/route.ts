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

  if (profile?.role !== "employer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify exam belongs to this employer
  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", id)
    .eq("employer_id", user.id)
    .single();

  if (!exam) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: registrations, error } = await supabase
    .from("exam_registrations")
    .select(`*, candidate:profiles(id, full_name, email)`)
    .eq("exam_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: registrations });
}
