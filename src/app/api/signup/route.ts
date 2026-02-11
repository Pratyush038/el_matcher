import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Lazy-init service-role client to bypass RLS for student insert
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, usn, name, phone, cgpa, branch_id, semester, interests } = body;

  // Validate RVCE email
  if (!email.endsWith("@rvce.edu.in")) {
    return NextResponse.json(
      { error: "Please use your @rvce.edu.in email address" },
      { status: 400 }
    );
  }

  // 1. Create auth user via admin client (skips email confirmation)
  //    If the auth user already exists but has no student record (e.g. DB was reset),
  //    delete the orphan and recreate.
  const supabaseAdmin = getAdminClient();

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  let authUserId: string;

  if (existingUser) {
    // Check if a student record exists for this auth user
    const { data: existingStudent } = await supabaseAdmin
      .from("students")
      .select("usn")
      .eq("auth_id", existingUser.id)
      .maybeSingle();

    if (existingStudent) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 400 }
      );
    }

    // Orphan auth user — delete and recreate with new password
    await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create account" }, { status: 400 });
    }
    authUserId = authData.user.id;
  } else {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create account" }, { status: 400 });
    }
    authUserId = authData.user.id;
  }

  // 2. Insert student record via admin client (bypasses RLS)
  const { error: studentError } = await supabaseAdmin.from("students").insert({
    usn: usn.toUpperCase(),
    name,
    email,
    phone: phone || null,
    cgpa: cgpa ? parseFloat(cgpa) : null,
    branch_id,
    semester: semester ? parseInt(semester) : null,
    interests: interests || [],
    auth_id: authUserId,
  });

  if (studentError) {
    // Clean up: delete the auth user if student insert fails
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    return NextResponse.json({ error: studentError.message }, { status: 400 });
  }

  // 3. Sign in the user via the cookie-based server client
  const supabase = await createServerSupabaseClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json({
      success: true,
      message: "Account created. Please sign in.",
      needsLogin: true,
    });
  }

  return NextResponse.json({ success: true });
}
