"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileData {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

/**
 * Update profiel gegevens
 */
export async function updateProfile(data: {
  displayName?: string;
  bio?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Je moet ingelogd zijn" };
  }

  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (data.displayName !== undefined) {
    updates.display_name = data.displayName.trim() || null;
  }

  if (data.bio !== undefined) {
    updates.bio = data.bio.trim() || null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true, error: null };
}

/**
 * Update avatar URL
 */
export async function updateAvatar(
  avatarUrl: string | null
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Je moet ingelogd zijn" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true, error: null };
}

/**
 * Upload avatar afbeelding
 */
export async function uploadAvatar(
  formData: FormData
): Promise<{ success: boolean; url: string | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, url: null, error: "Je moet ingelogd zijn" };
  }

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) {
    return { success: false, url: null, error: "Geen bestand geselecteerd" };
  }

  // Valideer bestandstype
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, url: null, error: "Ongeldig bestandstype. Gebruik JPG, PNG, WebP of GIF." };
  }

  // Valideer bestandsgrootte (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, url: null, error: "Bestand is te groot. Maximum is 2MB." };
  }

  // Genereer unieke bestandsnaam
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

  // Upload naar Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return { success: false, url: null, error: uploadError.message };
  }

  // Haal publieke URL op
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  // Update profiel met nieuwe avatar URL
  await updateAvatar(urlData.publicUrl);

  return { success: true, url: urlData.publicUrl, error: null };
}

/**
 * Verwijder avatar
 */
export async function deleteAvatar(): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Je moet ingelogd zijn" };
  }

  // Haal huidige avatar URL op
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    // Probeer bestand te verwijderen uit storage
    const urlParts = profile.avatar_url.split("/avatars/");
    if (urlParts.length > 1) {
      await supabase.storage.from("avatars").remove([urlParts[1]]);
    }
  }

  // Update profiel
  return updateAvatar(null);
}

/**
 * Wijzig wachtwoord
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Je moet ingelogd zijn" };
  }

  // Valideer nieuw wachtwoord
  if (newPassword.length < 8) {
    return { success: false, error: "Wachtwoord moet minimaal 8 karakters zijn" };
  }

  // Verifieer huidig wachtwoord door opnieuw in te loggen
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Huidig wachtwoord is onjuist" };
  }

  // Update wachtwoord
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
}
