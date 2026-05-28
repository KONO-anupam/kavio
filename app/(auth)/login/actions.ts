// app/(auth)/login/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

export async function signInWithPassword(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { success: false, error: "Invalid form submission." };
  }

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    // Normalize Supabase error messages to match our copy standard
    if (error.message.includes("Invalid login credentials")) {
      return {
        success: false,
        error: "The credentials provided do not match our records.",
      };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        error: "Your email address has not been verified. Check your inbox.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithMagicLink(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email");

  if (typeof email !== "string" || !email.trim()) {
    return { success: false, error: "A valid email address is required." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}