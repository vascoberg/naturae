"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/lib/actions/profile";
import { toast } from "sonner";

interface ProfileFormProps {
  initialDisplayName: string | null;
  initialBio: string | null;
}

export function ProfileForm({ initialDisplayName, initialBio }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName || "");
  const [bio, setBio] = useState(initialBio || "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateProfile({
        displayName,
        bio,
      });

      if (result.success) {
        toast.success("Profiel bijgewerkt");
      } else {
        toast.error(result.error || "Er ging iets mis");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="displayName" className="text-sm font-medium">
          Weergavenaam
        </label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Je naam zoals anderen die zien"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          Dit is de naam die anderen zien bij je leersets
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Vertel iets over jezelf..."
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {bio.length}/500 karakters
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Opslaan..." : "Opslaan"}
      </Button>
    </form>
  );
}
