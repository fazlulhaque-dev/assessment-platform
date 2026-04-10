import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { email, password, full_name, role } = await request.json();

  if (!email || !password || !full_name || !role) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 },
    );
  }

  if (!["employer", "candidate"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role,
    full_name,
    email,
  });

  if (profileError) {
    // Clean up the auth user if profile creation fails
    await supabase.auth.admin?.deleteUser(data.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  return NextResponse.json({ user: data.user, profile }, { status: 201 });
}
