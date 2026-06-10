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
      cluster_thoughts: {
        Row: {
          added_at: string
          cluster_id: string
          id: string
          thought_id: string
        }
        Insert: {
          added_at?: string
          cluster_id: string
          id?: string
          thought_id: string
        }
        Update: {
          added_at?: string
          cluster_id?: string
          id?: string
          thought_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_thoughts_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_thoughts_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_anonymous_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_anonymous_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_anonymous_id?: string
        }
        Relationships: []
      }
      experiment_checkins: {
        Row: {
          created_at: string
          date: string
          experiment_id: string
          id: string
          note: string | null
          showed_up: boolean
        }
        Insert: {
          created_at?: string
          date: string
          experiment_id: string
          id?: string
          note?: string | null
          showed_up?: boolean
        }
        Update: {
          created_at?: string
          date?: string
          experiment_id?: string
          id?: string
          note?: string | null
          showed_up?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "experiment_checkins_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          action: string
          created_at: string
          duration: string
          ends_at: string
          id: string
          reflection_minus: string | null
          reflection_next: string | null
          reflection_plus: string | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          duration: string
          ends_at: string
          id?: string
          reflection_minus?: string | null
          reflection_next?: string | null
          reflection_plus?: string | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          duration?: string
          ends_at?: string
          id?: string
          reflection_minus?: string | null
          reflection_next?: string | null
          reflection_plus?: string | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          platform_preference: string | null
          price_range: string | null
          rating: number
          user_anonymous_id: string
          would_pay: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          platform_preference?: string | null
          price_range?: string | null
          rating: number
          user_anonymous_id: string
          would_pay?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          platform_preference?: string | null
          price_range?: string | null
          rating?: number
          user_anonymous_id?: string
          would_pay?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          date: string
          emotion: string | null
          emotion_fr: string | null
          gratitude: string | null
          id: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          date: string
          emotion?: string | null
          emotion_fr?: string | null
          gratitude?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          emotion?: string | null
          emotion_fr?: string | null
          gratitude?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          cluster_id: string
          content_native: string
          content_target_language: string
          generated_at: string
          id: string
          target_language_code: string
        }
        Insert: {
          cluster_id: string
          content_native: string
          content_target_language: string
          generated_at?: string
          id?: string
          target_language_code?: string
        }
        Update: {
          cluster_id?: string
          content_native?: string
          content_target_language?: string
          generated_at?: string
          id?: string
          target_language_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          ai_theme: string | null
          archived: boolean
          composted: boolean
          content: string
          created_at: string
          embedding: string | null
          id: string
          user_anonymous_id: string
        }
        Insert: {
          ai_theme?: string | null
          archived?: boolean
          composted?: boolean
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          user_anonymous_id: string
        }
        Update: {
          ai_theme?: string | null
          archived?: boolean
          composted?: boolean
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          user_anonymous_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compost_and_fetch_thoughts: {
        Args: { p_user_anonymous_id: string }
        Returns: {
          ai_theme: string | null
          archived: boolean
          composted: boolean
          content: string
          created_at: string
          embedding: string | null
          id: string
          user_anonymous_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "thoughts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      match_thoughts: {
        Args: {
          match_count?: number
          p_user_anonymous_id?: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          ai_theme: string
          archived: boolean
          composted: boolean
          content: string
          created_at: string
          id: string
          similarity: number
          user_anonymous_id: string
        }[]
      }
      migrate_anonymous_data: {
        Args: { new_user_id: string; old_anon_id: string }
        Returns: undefined
      }
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
