"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Camera, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAvatar, deleteAvatar } from "@/lib/actions/profile";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  username: string;
}

export function AvatarUpload({ currentAvatarUrl, username }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);

      if (result.success && result.url) {
        setAvatarUrl(result.url);
        toast.success("Profielfoto bijgewerkt");
      } else {
        toast.error(result.error || "Er ging iets mis");
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => {
    if (!confirm("Weet je zeker dat je je profielfoto wilt verwijderen?")) return;

    startTransition(async () => {
      const result = await deleteAvatar();

      if (result.success) {
        setAvatarUrl(null);
        toast.success("Profielfoto verwijderd");
      } else {
        toast.error(result.error || "Er ging iets mis");
      }
    });
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <User className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        {isPending && (
          <div className="absolute inset-0 bg-background/50 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <Camera className="w-4 h-4 mr-2" />
            {avatarUrl ? "Wijzigen" : "Uploaden"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Verwijderen
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP of GIF. Max 2MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
