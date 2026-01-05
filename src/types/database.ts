export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      card_media: {
        Row: {
          attribution_name: string | null
          attribution_source: string | null
          attribution_url: string | null
          card_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          license: string | null
          position: string
          species_id: string | null
          type: string
          url: string
        }
        Insert: {
          attribution_name?: string | null
          attribution_source?: string | null
          attribution_url?: string | null
          card_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          license?: string | null
          position?: string
          species_id?: string | null
          type: string
          url: string
        }
        Update: {
          attribution_name?: string | null
          attribution_source?: string | null
          attribution_url?: string | null
          card_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          license?: string | null
          position?: string
          species_id?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_media_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_media_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          back_text: string | null
          created_at: string | null
          deck_id: string
          deleted_at: string | null
          front_text: string | null
          id: string
          position: number
          species_id: string | null
          updated_at: string | null
        }
        Insert: {
          back_text?: string | null
          created_at?: string | null
          deck_id: string
          deleted_at?: string | null
          front_text?: string | null
          id?: string
          position?: number
          species_id?: string | null
          updated_at?: string | null
        }
        Update: {
          back_text?: string | null
          created_at?: string | null
          deck_id?: string
          deleted_at?: string | null
          front_text?: string | null
          id?: string
          position?: number
          species_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_stars: {
        Row: {
          created_at: string | null
          deck_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deck_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          deck_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_stars_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_tags: {
        Row: {
          added_at: string | null
          added_by: string | null
          deck_id: string
          tag_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          deck_id: string
          tag_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          deck_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_tags_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          card_count: number | null
          copied_from_deck_id: string | null
          cover_image_url: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          share_token: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_count?: number | null
          copied_from_deck_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          share_token?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_count?: number | null
          copied_from_deck_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          share_token?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decks_copied_from_deck_id_fkey"
            columns: ["copied_from_deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      species: {
        Row: {
          common_names: Json
          created_at: string | null
          created_by: string | null
          descriptions: Json | null
          external_links: Json | null
          facts: Json | null
          id: string
          scientific_name: string
          taxonomy: Json | null
          updated_at: string | null
        }
        Insert: {
          common_names?: Json
          created_at?: string | null
          created_by?: string | null
          descriptions?: Json | null
          external_links?: Json | null
          facts?: Json | null
          id?: string
          scientific_name: string
          taxonomy?: Json | null
          updated_at?: string | null
        }
        Update: {
          common_names?: Json
          created_at?: string | null
          created_by?: string | null
          descriptions?: Json | null
          external_links?: Json | null
          facts?: Json | null
          id?: string
          scientific_name?: string
          taxonomy?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          names: Json
          slug: string
          type: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          names?: Json
          slug: string
          type?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          names?: Json
          slug?: string
          type?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          card_id: string
          created_at: string | null
          difficulty: number | null
          elapsed_days: number | null
          lapses: number | null
          last_review: string | null
          next_review: string | null
          reps: number | null
          scheduled_days: number | null
          stability: number | null
          state: number | null
          times_correct: number | null
          times_seen: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          difficulty?: number | null
          elapsed_days?: number | null
          lapses?: number | null
          last_review?: string | null
          next_review?: string | null
          reps?: number | null
          scheduled_days?: number | null
          stability?: number | null
          state?: number | null
          times_correct?: number | null
          times_seen?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          difficulty?: number | null
          elapsed_days?: number | null
          lapses?: number | null
          last_review?: string | null
          next_review?: string | null
          reps?: number | null
          scheduled_days?: number | null
          stability?: number | null
          state?: number | null
          times_correct?: number | null
          times_seen?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
