// app/dashboard/server/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Service, ServiceInsert, ServiceUpdate } from "@/types";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase };
  }
  return { user, supabase };
}

export async function createService(
  formData: FormData
): Promise<ActionResult<Service>> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Authentication required." };

  const name = formData.get("name");
  const description = formData.get("description");
  const duration = formData.get("duration");
  const price = formData.get("price");

  if (
    typeof name !== "string" ||
    typeof duration !== "string" ||
    typeof price !== "string"
  ) {
    return { success: false, error: "Invalid form data." };
  }

  if (!name.trim()) {
    return { success: false, error: "Service name is required." };
  }

  const durationNum = parseInt(duration, 10);
  const priceNum = parseFloat(price);

  if (isNaN(durationNum) || durationNum <= 0) {
    return { success: false, error: "Duration must be a positive number of minutes." };
  }

  if (isNaN(priceNum) || priceNum < 0) {
    return { success: false, error: "Price must be zero or greater." };
  }

  const insert: ServiceInsert = {
    tenant_id: user.id,
    name: name.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : null,
    duration: durationNum,
    price: priceNum,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("services")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/services");
  return { success: true, data };
}

export async function updateService(
  serviceId: string,
  formData: FormData
): Promise<ActionResult<Service>> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Authentication required." };

  const name = formData.get("name");
  const description = formData.get("description");
  const duration = formData.get("duration");
  const price = formData.get("price");

  if (
    typeof name !== "string" ||
    typeof duration !== "string" ||
    typeof price !== "string"
  ) {
    return { success: false, error: "Invalid form data." };
  }

  if (!name.trim()) {
    return { success: false, error: "Service name is required." };
  }

  const durationNum = parseInt(duration, 10);
  const priceNum = parseFloat(price);

  if (isNaN(durationNum) || durationNum <= 0) {
    return { success: false, error: "Duration must be a positive number of minutes." };
  }

  if (isNaN(priceNum) || priceNum < 0) {
    return { success: false, error: "Price must be zero or greater." };
  }

  const update: ServiceUpdate = {
    name: name.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : null,
    duration: durationNum,
    price: priceNum,
  };

  const { data, error } = await supabase
    .from("services")
    .update(update)
    .eq("id", serviceId)
    .eq("tenant_id", user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/services");
  return { success: true, data };
}

export async function toggleServiceActive(
  serviceId: string,
  isActive: boolean
): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Authentication required." };

  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId)
    .eq("tenant_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}

export async function deleteService(
  serviceId: string
): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Authentication required." };

  // Check for existing bookings referencing this service
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId)
    .eq("tenant_id", user.id)
    .in("status", ["new", "contacted", "booked"]);

  if (count && count > 0) {
    return {
      success: false,
      error: `This service has ${count} active booking${count === 1 ? "" : "s"}. Mark it inactive instead, or resolve the bookings first.`,
    };
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("tenant_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}