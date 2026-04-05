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
      about_website: {
        Row: {
          contact_email: string | null
          content_bn: string
          content_en: string
          designation: string | null
          facebook_url: string | null
          github_url: string | null
          id: string
          image_url: string | null
          linkedin_url: string | null
          name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact_email?: string | null
          content_bn?: string
          content_en?: string
          designation?: string | null
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          linkedin_url?: string | null
          name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact_email?: string | null
          content_bn?: string
          content_en?: string
          designation?: string | null
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          linkedin_url?: string | null
          name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          present_ids: string[] | null
          subject: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          present_ids?: string[] | null
          subject: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          present_ids?: string[] | null
          subject?: string
        }
        Relationships: []
      }
      bus_locations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bus_schedules: {
        Row: {
          bus_number: string
          created_at: string
          created_by: string | null
          day: string
          direction: string
          id: string
          location_id: string
          time: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bus_number: string
          created_at?: string
          created_by?: string | null
          day: string
          direction: string
          id?: string
          location_id: string
          time: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bus_number?: string
          created_at?: string
          created_by?: string | null
          day?: string
          direction?: string
          id?: string
          location_id?: string
          time?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "bus_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          syllabus_link: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          syllabus_link?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          syllabus_link?: string | null
        }
        Relationships: []
      }
      cr_keys: {
        Row: {
          access_key: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          permissions: string[]
        }
        Insert: {
          access_key: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          permissions?: string[]
        }
        Update: {
          access_key?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          permissions?: string[]
        }
        Relationships: []
      }
      faculty: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          designation: string | null
          education: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string | null
          subject: string | null
          subjects_not_taught: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          designation?: string | null
          education?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string | null
          subject?: string | null
          subjects_not_taught?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          designation?: string | null
          education?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          subject?: string | null
          subjects_not_taught?: string[] | null
        }
        Relationships: []
      }
      gallery: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          title?: string
        }
        Relationships: []
      }
      gallery_likes: {
        Row: {
          created_at: string
          id: string
          image_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_likes_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "gallery"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_profile: {
        Row: {
          avatar_url: string | null
          bio: string | null
          designation: string | null
          email: string | null
          facebook_url: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          designation?: string | null
          email?: string | null
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          designation?: string | null
          email?: string | null
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          options: string[]
          question: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          options?: string[]
          question: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          options?: string[]
          question?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          blood_group: string | null
          bus_pickup_location: string | null
          created_at: string
          diploma_session: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          bus_pickup_location?: string | null
          created_at?: string
          diploma_session?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          bus_pickup_location?: string | null
          created_at?: string
          diploma_session?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_bus_pickup_location_fkey"
            columns: ["bus_pickup_location"]
            isOneToOne: false
            referencedRelation: "bus_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          player_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          player_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          player_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          created_at: string
          created_by: string | null
          day: string
          display_order: number | null
          id: string
          room: string | null
          subject: string
          teacher: string | null
          time: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day: string
          display_order?: number | null
          id?: string
          room?: string | null
          subject: string
          teacher?: string | null
          time: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day?: string
          display_order?: number | null
          id?: string
          room?: string | null
          subject?: string
          teacher?: string | null
          time?: string
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          permissions: string[] | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: string[] | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: string[] | null
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
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      verify_cr_key: {
        Args: { _key: string }
        Returns: {
          id: string
          name: string
          permissions: string[]
        }[]
      }
    }
    Enums: {
      app_role: "master" | "cr" | "student" | "teacher"
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
      app_role: ["master", "cr", "student", "teacher"],
    },
  },
} as const
