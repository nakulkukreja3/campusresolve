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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      complaint_logs: {
        Row: {
          action: string
          actor_id: string | null
          complaint_id: string
          created_at: string
          id: string
          note: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          complaint_id: string
          created_at?: string
          id?: string
          note?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          complaint_id?: string
          created_at?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_logs_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          ai_category: string | null
          ai_confidence: number | null
          ai_department_id: string | null
          ai_priority: Database["public"]["Enums"]["complaint_priority"] | null
          ai_reasoning: string | null
          ai_sentiment:
            | Database["public"]["Enums"]["complaint_sentiment"]
            | null
          ai_tags: string[] | null
          assigned_department_id: string | null
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string
          escalation_level: number
          id: string
          is_anonymous: boolean
          location: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          tracking_id: string
          updated_at: string
          urgency: Database["public"]["Enums"]["complaint_priority"]
          user_id: string
        }
        Insert: {
          ai_category?: string | null
          ai_confidence?: number | null
          ai_department_id?: string | null
          ai_priority?: Database["public"]["Enums"]["complaint_priority"] | null
          ai_reasoning?: string | null
          ai_sentiment?:
            | Database["public"]["Enums"]["complaint_sentiment"]
            | null
          ai_tags?: string[] | null
          assigned_department_id?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description: string
          escalation_level?: number
          id?: string
          is_anonymous?: boolean
          location?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
          tracking_id?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["complaint_priority"]
          user_id: string
        }
        Update: {
          ai_category?: string | null
          ai_confidence?: number | null
          ai_department_id?: string | null
          ai_priority?: Database["public"]["Enums"]["complaint_priority"] | null
          ai_reasoning?: string | null
          ai_sentiment?:
            | Database["public"]["Enums"]["complaint_sentiment"]
            | null
          ai_tags?: string[] | null
          assigned_department_id?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string
          escalation_level?: number
          id?: string
          is_anonymous?: boolean
          location?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
          tracking_id?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["complaint_priority"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_ai_department_id_fkey"
            columns: ["ai_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_assigned_department_id_fkey"
            columns: ["assigned_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          complaint_id: string | null
          created_at: string
          id: string
          message: string | null
          read: boolean
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "admin" | "super_admin" | "department_staff"
      complaint_priority: "low" | "medium" | "high" | "critical"
      complaint_sentiment:
        | "positive"
        | "neutral"
        | "concerned"
        | "negative"
        | "urgent"
      complaint_status:
        | "submitted"
        | "under_review"
        | "assigned"
        | "in_progress"
        | "escalated"
        | "resolved"
        | "closed"
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
    Enums: {
      app_role: ["student", "admin", "super_admin", "department_staff"],
      complaint_priority: ["low", "medium", "high", "critical"],
      complaint_sentiment: [
        "positive",
        "neutral",
        "concerned",
        "negative",
        "urgent",
      ],
      complaint_status: [
        "submitted",
        "under_review",
        "assigned",
        "in_progress",
        "escalated",
        "resolved",
        "closed",
      ],
    },
  },
} as const
