// Dit bestand wordt gegenereerd door Supabase CLI
// Voer uit: npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
//
// Tijdelijke placeholder types voor development:

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      decks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          is_public: boolean;
          share_token: string | null;
          copied_from_deck_id: string | null;
          card_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_public?: boolean;
          share_token?: string | null;
          copied_from_deck_id?: string | null;
          card_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_public?: boolean;
          share_token?: string | null;
          copied_from_deck_id?: string | null;
          card_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      cards: {
        Row: {
          id: string;
          deck_id: string;
          species_id: string | null;
          front_text: string | null;
          back_text: string | null;
          position: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          deck_id: string;
          species_id?: string | null;
          front_text?: string | null;
          back_text?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          deck_id?: string;
          species_id?: string | null;
          front_text?: string | null;
          back_text?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      card_media: {
        Row: {
          id: string;
          card_id: string | null;
          species_id: string | null;
          type: "image" | "audio";
          url: string;
          position: "front" | "back";
          attribution_name: string | null;
          attribution_url: string | null;
          attribution_source: string | null;
          license: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id?: string | null;
          species_id?: string | null;
          type: "image" | "audio";
          url: string;
          position?: "front" | "back";
          attribution_name?: string | null;
          attribution_url?: string | null;
          attribution_source?: string | null;
          license?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string | null;
          species_id?: string | null;
          type?: "image" | "audio";
          url?: string;
          position?: "front" | "back";
          attribution_name?: string | null;
          attribution_url?: string | null;
          attribution_source?: string | null;
          license?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      user_progress: {
        Row: {
          user_id: string;
          card_id: string;
          stability: number;
          difficulty: number;
          elapsed_days: number;
          scheduled_days: number;
          reps: number;
          lapses: number;
          state: "new" | "learning" | "review" | "relearning";
          last_review: string | null;
          next_review: string;
          times_seen: number;
          times_correct: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          card_id: string;
          stability?: number;
          difficulty?: number;
          elapsed_days?: number;
          scheduled_days?: number;
          reps?: number;
          lapses?: number;
          state?: "new" | "learning" | "review" | "relearning";
          last_review?: string | null;
          next_review?: string;
          times_seen?: number;
          times_correct?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          card_id?: string;
          stability?: number;
          difficulty?: number;
          elapsed_days?: number;
          scheduled_days?: number;
          reps?: number;
          lapses?: number;
          state?: "new" | "learning" | "review" | "relearning";
          last_review?: string | null;
          next_review?: string;
          times_seen?: number;
          times_correct?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
