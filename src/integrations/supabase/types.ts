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
      campaign_sends: {
        Row: {
          campaign_key: string
          created_at: string
          error: string | null
          id: string
          recipient_email: string
          segment: string
          status: string
          subject: string
        }
        Insert: {
          campaign_key: string
          created_at?: string
          error?: string | null
          id?: string
          recipient_email: string
          segment: string
          status?: string
          subject: string
        }
        Update: {
          campaign_key?: string
          created_at?: string
          error?: string | null
          id?: string
          recipient_email?: string
          segment?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          display_name: string
          id: string
          location: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          location: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          location?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      cron_tokens: {
        Row: {
          created_at: string
          name: string
          token: string
        }
        Insert: {
          created_at?: string
          name: string
          token: string
        }
        Update: {
          created_at?: string
          name?: string
          token?: string
        }
        Relationships: []
      }
      hudson_session_signups: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          payment_received: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          payment_received?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          payment_received?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      location_sessions: {
        Row: {
          activity: string
          artist: string | null
          created_at: string
          id: string
          location: string
          session_date: string
          week: string
        }
        Insert: {
          activity: string
          artist?: string | null
          created_at?: string
          id?: string
          location: string
          session_date: string
          week: string
        }
        Update: {
          activity?: string
          artist?: string | null
          created_at?: string
          id?: string
          location?: string
          session_date?: string
          week?: string
        }
        Relationships: []
      }
      member_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          member_id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          member_id: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          member_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_sessions: {
        Row: {
          created_at: string
          id: string
          member_id: string
          session_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          session_name: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          session_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          archived_at: string | null
          created_at: string
          crm_tags: string[]
          email: string | null
          first_name: string
          follow_up_date: string | null
          id: string
          joined: string | null
          last_name: string
          last_session: string | null
          location: string
          notes: string
          payment_status: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          crm_tags?: string[]
          email?: string | null
          first_name: string
          follow_up_date?: string | null
          id?: string
          joined?: string | null
          last_name: string
          last_session?: string | null
          location?: string
          notes?: string
          payment_status?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          crm_tags?: string[]
          email?: string | null
          first_name?: string
          follow_up_date?: string | null
          id?: string
          joined?: string | null
          last_name?: string
          last_session?: string | null
          location?: string
          notes?: string
          payment_status?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      open_house_rsvps: {
        Row: {
          attribution_captured_at: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          landing_page: string | null
          last_name: string | null
          location: string
          referrer: string | null
          source_campaign: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          attribution_captured_at?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          landing_page?: string | null
          last_name?: string | null
          location: string
          referrer?: string | null
          source_campaign?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          attribution_captured_at?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          landing_page?: string | null
          last_name?: string | null
          location?: string
          referrer?: string | null
          source_campaign?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      popup_ticket_reservations: {
        Row: {
          checked_in_at: string | null
          created_at: string
          email: string
          event_slug: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          paid_email_sent_at: string | null
          payment_received: boolean
          ticket_count: number
          ticket_token: string | null
          updated_at: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          email: string
          event_slug: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          paid_email_sent_at?: string | null
          payment_received?: boolean
          ticket_count: number
          ticket_token?: string | null
          updated_at?: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          email?: string
          event_slug?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          paid_email_sent_at?: string | null
          payment_received?: boolean
          ticket_count?: number
          ticket_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      popup_waitlist: {
        Row: {
          created_at: string
          email: string
          event_slug: string
          first_name: string
          id: string
          last_name: string
        }
        Insert: {
          created_at?: string
          email: string
          event_slug: string
          first_name: string
          id?: string
          last_name: string
        }
        Update: {
          created_at?: string
          email?: string
          event_slug?: string
          first_name?: string
          id?: string
          last_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_until: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          status: string
          user_id: string
        }
        Insert: {
          active_until?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          status?: string
          user_id: string
        }
        Update: {
          active_until?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          attribution_captured_at: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          landing_page: string | null
          last_name: string | null
          locations: string[]
          notes: string
          referrer: string | null
          status: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          attribution_captured_at?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          landing_page?: string | null
          last_name?: string | null
          locations?: string[]
          notes?: string
          referrer?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          attribution_captured_at?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          landing_page?: string | null
          last_name?: string | null
          locations?: string[]
          notes?: string
          referrer?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      resend_email_events: {
        Row: {
          clicked_url: string | null
          created_at: string
          email_id: string | null
          event_type: string
          from_email: string | null
          id: string
          message_id: string | null
          raw_payload: Json
          received_at: string
          recipient_email: string | null
          subject: string | null
        }
        Insert: {
          clicked_url?: string | null
          created_at?: string
          email_id?: string | null
          event_type: string
          from_email?: string | null
          id?: string
          message_id?: string | null
          raw_payload: Json
          received_at?: string
          recipient_email?: string | null
          subject?: string | null
        }
        Update: {
          clicked_url?: string | null
          created_at?: string
          email_id?: string | null
          event_type?: string
          from_email?: string | null
          id?: string
          message_id?: string | null
          raw_payload?: Json
          received_at?: string
          recipient_email?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      resource_page_views: {
        Row: {
          created_at: string
          device: string | null
          event_type: string
          file_name: string | null
          id: string
          location: string | null
          page: string
          resource_type: string | null
          song: string | null
          user_id: string | null
          week: number | null
        }
        Insert: {
          created_at?: string
          device?: string | null
          event_type?: string
          file_name?: string | null
          id?: string
          location?: string | null
          page: string
          resource_type?: string | null
          song?: string | null
          user_id?: string | null
          week?: number | null
        }
        Update: {
          created_at?: string
          device?: string | null
          event_type?: string
          file_name?: string | null
          id?: string
          location?: string | null
          page?: string
          resource_type?: string | null
          song?: string | null
          user_id?: string | null
          week?: number | null
        }
        Relationships: []
      }
      session_registrations: {
        Row: {
          amount_paid: number | null
          attribution_captured_at: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_returning_member: boolean
          landing_page: string | null
          last_name: string
          location: string
          member_id: string | null
          notes: string | null
          payment_link_sent_at: string | null
          payment_status: string
          referrer: string | null
          session_label: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          amount_paid?: number | null
          attribution_captured_at?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_returning_member?: boolean
          landing_page?: string | null
          last_name: string
          location: string
          member_id?: string | null
          notes?: string | null
          payment_link_sent_at?: string | null
          payment_status?: string
          referrer?: string | null
          session_label: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          amount_paid?: number | null
          attribution_captured_at?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_returning_member?: boolean
          landing_page?: string | null
          last_name?: string
          location?: string
          member_id?: string | null
          notes?: string | null
          payment_link_sent_at?: string | null
          payment_status?: string
          referrer?: string | null
          session_label?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      song_resources: {
        Row: {
          created_at: string
          file_name: string
          id: string
          location: string
          part: string | null
          resource_type: string
          session_label: string
          song_name: string
          sort_order: number
          storage_path: string
          uploaded_by: string
          week: number | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          location: string
          part?: string | null
          resource_type: string
          session_label?: string
          song_name: string
          sort_order?: number
          storage_path: string
          uploaded_by: string
          week?: number | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          location?: string
          part?: string | null
          resource_type?: string
          session_label?: string
          song_name?: string
          sort_order?: number
          storage_path?: string
          uploaded_by?: string
          week?: number | null
        }
        Relationships: []
      }
      trial_guests: {
        Row: {
          attended: boolean
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          location: string
          notes: string | null
          session_date: string
          song: string | null
          week: string | null
        }
        Insert: {
          attended?: boolean
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name?: string
          location: string
          notes?: string | null
          session_date: string
          song?: string | null
          week?: string | null
        }
        Update: {
          attended?: boolean
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          location?: string
          notes?: string | null
          session_date?: string
          song?: string | null
          week?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_announcements: {
        Row: {
          active_from: string
          created_at: string
          id: string
          message_en: string
          message_fr: string
          title: string | null
          updated_at: string
        }
        Insert: {
          active_from?: string
          created_at?: string
          id?: string
          message_en: string
          message_fr: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          active_from?: string
          created_at?: string
          id?: string
          message_en?: string
          message_fr?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_member_for_paid_registration: {
        Args: { _active_until?: string; _email: string }
        Returns: {
          activated: boolean
          matched_user_id: string
        }[]
      }
      expire_stale_members: { Args: never; Returns: number }
      get_my_member_profile: {
        Args: never
        Returns: {
          active_until: string
          display_name: string
          email: string
          location: string
          member_since: string
          status: string
        }[]
      }
      get_public_choir_stats: {
        Args: never
        Returns: {
          locations: number
          singers: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_member: { Args: { _user_id: string }; Returns: boolean }
      run_scheduled_campaign: {
        Args: { _campaign_key: string; _location: string; _segment: string }
        Returns: undefined
      }
      update_my_member_name: {
        Args: { _first_name: string; _last_name: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
