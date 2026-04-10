import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BehavioralEventType } from "@/types";

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

  const { registrationId, eventType } = (await request.json()) as {
    registrationId: string;
    eventType: BehavioralEventType;
  };

  const validEvents: BehavioralEventType[] = [
    "tab_switch",
    "fullscreen_exit",
    "focus_loss",
  ];
  if (!validEvents.includes(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  // Validate registration
  const { data: reg } = await supabase
    .from("exam_registrations")
    .select("id")
    .eq("id", registrationId)
    .eq("candidate_id", user.id)
    .eq("exam_id", examId)
    .single();

  if (!reg) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase.from("behavioral_logs").insert({
    registration_id: registrationId,
    event_type: eventType,
    logged_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
