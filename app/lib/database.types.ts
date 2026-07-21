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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      courses: {
        Row: {
          blurb: string | null
          created_at: string | null
          id: number
          name: string
          subject_id: number
        }
        Insert: {
          blurb?: string | null
          created_at?: string | null
          id?: number
          name: string
          subject_id: number
        }
        Update: {
          blurb?: string | null
          created_at?: string | null
          id?: number
          name?: string
          subject_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      language_vocabulary: {
        Row: {
          created_at: string | null
          english_word: string
          explanation: string | null
          foreign_word: string
          id: number
          reading: string | null
          romanized: string | null
        }
        Insert: {
          created_at?: string | null
          english_word: string
          explanation?: string | null
          foreign_word: string
          id?: never
          reading?: string | null
          romanized?: string | null
        }
        Update: {
          created_at?: string | null
          english_word?: string
          explanation?: string | null
          foreign_word?: string
          id?: never
          reading?: string | null
          romanized?: string | null
        }
        Relationships: []
      }
      lesson_sets: {
        Row: {
          content: Json
          created_at: string
          id: number
          lesson_id: number
          set_number: number
          sort: number
          type: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: number
          lesson_id: number
          set_number?: number
          sort: number
          type: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: number
          lesson_id?: number
          set_number?: number
          sort?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          blurb: string | null
          created_at: string | null
          id: number
          name: string
          unit_id: number
          x: number
          y: number
        }
        Insert: {
          blurb?: string | null
          created_at?: string | null
          id?: number
          name: string
          unit_id: number
          x?: number
          y?: number
        }
        Update: {
          blurb?: string | null
          created_at?: string | null
          id?: number
          name?: string
          unit_id?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          gold: number
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          gold?: number
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          gold?: number
          id?: string
          role?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          blurb: string | null
          created_at: string
          id: number
          name: string
        }
        Insert: {
          blurb?: string | null
          created_at?: string
          id?: never
          name: string
        }
        Update: {
          blurb?: string | null
          created_at?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      set_completions: {
        Row: {
          completed_at: string
          lesson_id: number
          set_number: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          lesson_id: number
          set_number: number
          user_id: string
        }
        Update: {
          completed_at?: string
          lesson_id?: number
          set_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          blurb: string | null
          created_at: string | null
          id: number
          name: string
          school_id: number
        }
        Insert: {
          blurb?: string | null
          created_at?: string | null
          id?: never
          name: string
          school_id: number
        }
        Update: {
          blurb?: string | null
          created_at?: string | null
          id?: never
          name?: string
          school_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          blurb: string | null
          course_id: number
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          blurb?: string | null
          course_id: number
          created_at?: string | null
          id?: never
          name: string
        }
        Update: {
          blurb?: string | null
          course_id?: number
          created_at?: string | null
          id?: never
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_gold: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
