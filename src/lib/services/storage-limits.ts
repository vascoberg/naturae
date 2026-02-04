/**
 * Storage Limits Service
 *
 * Beheert opslaglimieten voor freemium accounts.
 * Gratis: 50 MB, Premium: 1 GB
 *
 * Wat telt mee:
 * - Eigen foto uploads
 * - GBIF media gedownload naar deck kaarten
 *
 * Wat telt NIET mee:
 * - GBIF/Xeno-canto externe links (quiz modus)
 */

import { createClient } from "@/lib/supabase/server";

export const STORAGE_LIMITS = {
  free: 50 * 1024 * 1024, // 50 MB
  premium: 1024 * 1024 * 1024, // 1 GB
} as const;

export type PlanType = keyof typeof STORAGE_LIMITS;

export interface StorageUsage {
  used: number;
  limit: number;
  remaining: number;
  planType: PlanType;
}

export interface UploadCheck {
  allowed: boolean;
  remaining: number;
  required: number;
}

/**
 * Haal huidige storage gebruik op voor een gebruiker
 */
export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("storage_used_bytes, plan_type")
    .eq("id", userId)
    .single();

  const used = data?.storage_used_bytes || 0;
  const planType = (data?.plan_type || "free") as PlanType;
  const limit = STORAGE_LIMITS[planType];

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    planType,
  };
}

/**
 * Check of een upload is toegestaan gegeven de huidige limieten
 */
export async function canUpload(
  userId: string,
  sizeBytes: number
): Promise<UploadCheck> {
  const { remaining } = await getStorageUsage(userId);
  return {
    allowed: sizeBytes <= remaining,
    remaining,
    required: sizeBytes,
  };
}

/**
 * Registreer een upload (increment storage_used_bytes)
 */
export async function recordUpload(
  userId: string,
  sizeBytes: number
): Promise<void> {
  console.log(`[Storage] Recording upload: ${formatBytes(sizeBytes)} for user ${userId}`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_storage_used", {
    user_id: userId,
    bytes: sizeBytes,
  });

  if (error) {
    console.error("[Storage] Failed to record upload:", error);
    // Don't throw - storage tracking failure shouldn't block the user
  } else {
    console.log(`[Storage] Successfully recorded ${formatBytes(sizeBytes)}`);
  }
}

/**
 * Registreer een verwijdering (decrement storage_used_bytes)
 */
export async function recordDeletion(
  userId: string,
  sizeBytes: number
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decrement_storage_used", {
    user_id: userId,
    bytes: sizeBytes,
  });

  if (error) {
    console.error("Failed to record storage deletion:", error);
    // Don't throw - storage tracking failure shouldn't block the user
  }
}

/**
 * Format bytes naar leesbare string (bijv. "45.2 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
