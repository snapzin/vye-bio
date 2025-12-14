import * as React from "react";

import { toast as baseToast } from "@/components/ui/use-toast";

// In this codebase we only use string messages (toast.success("...")).
// Keeping it string avoids the ReactNode vs. HTML `title` attribute type collision.
type Message = string;

type SimpleOptions = {
  description?: string;
};

/**
 * Small adapter so we can keep using the familiar `toast.success(...)` / `toast.error(...)`
 * API while using the shadcn/Radix toast under the hood.
 *
 * Theme note: We keep it monochrome (success/info/warning all default variant).
 */
export const toast = {
  message: (title: Message, options?: SimpleOptions) =>
    baseToast({
      title,
      description: options?.description,
    }),

  success: (title: Message, options?: SimpleOptions) =>
    baseToast({
      variant: "success",
      title,
      description: options?.description,
    }),

  info: (title: Message, options?: SimpleOptions) =>
    baseToast({
      variant: "info",
      title,
      description: options?.description,
    }),

  warning: (title: Message, options?: SimpleOptions) =>
    baseToast({
      title,
      description: options?.description,
    }),

  error: (title: Message, options?: SimpleOptions) =>
    baseToast({
      variant: "destructive",
      title,
      description: options?.description,
    }),
};


