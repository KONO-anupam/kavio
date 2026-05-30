
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
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
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

export async function signUp(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");
  const businessName = formData.get("business_name");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof businessName !== "string"
  ) {
    return { success: false, error: "Invalid form submission." };
  }

  if (!email.trim()) {
    return { success: false, error: "Email address is required." };
  }

  if (!businessName.trim()) {
    return { success: false, error: "Business name is required." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      // handle_new_user trigger reads this to set profiles.business_name
      data: { business_name: businessName.trim() },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    if (
      error.message.includes("already registered") ||
      error.message.includes("already been registered")
    ) {
      return {
        success: false,
        error: "An account with this email already exists. Sign in instead.",
      };
    }
    return { success: false, error: error.message };
  }

  // Return success — the page shows a "check your inbox" state.
  // If email confirmation is disabled in Supabase, the user can sign in immediately.
  return { success: true, data: undefined };
}

export async function signInWithMagicLink(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email");

  if (typeof email !== "string" || !email.trim()) {
    return { success: false, error: "A valid email address is required." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

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