// app/dashboard/settings/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { disconnectCalendar } from "@/lib/google/calendar";
import type { ActionResult, Profile, Service } from "@/types";

export async function updateProfile(
  formData: FormData
): Promise<ActionResult<Pick<Profile, "business_name" | "slug" | "accent_color" | "timezone">>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Authentication required." };
  }
  const businessName = formData.get("business_name");
  const slug = formData.get("slug");
  const accentColor = formData.get("accent_color");
  const timezone = formData.get("timezone");
  if (
    typeof businessName !== "string" ||
    typeof slug !== "string" ||
    typeof accentColor !== "string" ||
    typeof timezone !== "string"
  ) {
    return { success: false, error: "Invalid form data." };
  }
  const slugRegex = /^[a-z0-9][a-z0-9\-]{2,62}[a-z0-9]$/;
  if (!slugRegex.test(slug.trim())) {
    return {
      success: false,
      error:
        "Slug must be 4–64 characters: lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen.",
    };
  }
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  if (!hexRegex.test(accentColor)) {
    return { success: false, error: "Accent color must be a valid 6-digit hex color (e.g. #6366f1)." };
  }
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", slug.trim())
    .neq("id", user.id)
    .maybeSingle();
  if (existing) {
    return { success: false, error: "This slug is already in use. Choose a different one." };
  }
  const { data, error } = await supabase
    .from("profiles")
    .update({
      business_name: businessName.trim(),
      slug: slug.trim(),
      accent_color: accentColor,
      timezone: timezone.trim(),
    })
    .eq("id", user.id)
    .select("business_name, slug, accent_color, timezone")
    .single();
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "This slug is already in use." };
    }
    return { success: false, error: error.message };
  }
  revalidatePath("/dashboard", "layout");
  return { success: true, data };
}

export async function disconnectGoogleCalendar(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Authentication required." };
  }
  try {
    await disconnectCalendar(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
  revalidatePath("/dashboard/settings");
  return { success: true, data: undefined };
}

// ── Service CRUD ───────────────────────────────────────────────────────────

export async function createService(
  formData: FormData
): Promise<ActionResult<Service>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: "Authentication required." };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const duration = parseInt(formData.get("duration") as string, 10);
  const price = parseFloat(formData.get("price") as string);

  if (!name) return { success: false, error: "Service name is required." };
  if (isNaN(duration) || duration < 5) return { success: false, error: "Duration must be at least 5 minutes." };
  if (isNaN(price) || price < 0) return { success: false, error: "Price must be 0 or greater." };

  const { data, error } = await supabase
    .from("services")
    .insert({ tenant_id: user.id, name, description, duration, price, is_active: true })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Failed to create service." };

  revalidatePath("/dashboard/services");
  return { success: true, data: data as Service };
}

export async function updateService(
  id: string,
  formData: FormData
): Promise<ActionResult<Service>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: "Authentication required." };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const duration = parseInt(formData.get("duration") as string, 10);
  const price = parseFloat(formData.get("price") as string);

  if (!name) return { success: false, error: "Service name is required." };
  if (isNaN(duration) || duration < 5) return { success: false, error: "Duration must be at least 5 minutes." };
  if (isNaN(price) || price < 0) return { success: false, error: "Price must be 0 or greater." };

  const { data, error } = await supabase
    .from("services")
    .update({ name, description, duration, price })
    .eq("id", id)
    .eq("tenant_id", user.id)
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Failed to update service." };

  revalidatePath("/dashboard/services");
  return { success: true, data: data as Service };
}

export async function toggleServiceActive(
  id: string,
  isActive: boolean
): Promise<ActionResult<Service>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: "Authentication required." };

  const { data, error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("tenant_id", user.id)
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Failed to update service." };

  revalidatePath("/dashboard/services");
  return { success: true, data: data as Service };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: "Authentication required." };

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("tenant_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}