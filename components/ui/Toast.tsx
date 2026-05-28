// components/ui/Toast.tsx

/**
 * Toast utility — thin wrapper around sonner for consistent
 * copy-standard messaging across the app.
 *
 * Usage:
 *   import { notify } from "@/components/ui/Toast";
 *   notify.success("Appointment confirmed");
 *   notify.error("Unable to process request");
 *   notify.info("Calendar sync in progress");
 */
import { toast } from "sonner";

export const notify = {
  success: (message: string, description?: string) =>
    toast.success(message, { description }),

  error: (message: string, description?: string) =>
    toast.error(message, { description }),

  info: (message: string, description?: string) =>
    toast(message, { description }),

  loading: (message: string) =>
    toast.loading(message),

  dismiss: (id?: string | number) =>
    toast.dismiss(id),

  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) =>
    toast.promise(promise, messages),
} as const;