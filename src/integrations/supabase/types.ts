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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          rarity: Database["public"]["Enums"]["badge_rarity"]
          unlock_condition: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          unlock_condition?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          unlock_condition?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          background_color: string | null
          background_type: string | null
          background_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_online: boolean | null
          location: string | null
          music_artist: string | null
          music_title: string | null
          music_url: string | null
          music_image_url: string | null
          music_autoplay: boolean | null
          music_player_style: string | null
          avatar_shape: string | null
          banner_url: string | null
          discord_user_id: string | null
          is_admin: boolean | null
          is_premium: boolean | null
          premium_expires_at: string | null
          hide_footer: boolean | null
          updated_at: string
          user_id: string
          username: string
          views_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          background_color?: string | null
          background_type?: string | null
          background_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_online?: boolean | null
          location?: string | null
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          music_autoplay?: boolean | null
          music_player_style?: string | null
          avatar_shape?: string | null
          banner_url?: string | null
          discord_user_id?: string | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          premium_expires_at?: string | null
          hide_footer?: boolean | null
          updated_at?: string
          user_id: string
          username: string
          views_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          background_color?: string | null
          background_type?: string | null
          background_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_online?: boolean | null
          location?: string | null
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          music_autoplay?: boolean | null
          music_player_style?: string | null
          avatar_shape?: string | null
          banner_url?: string | null
          discord_user_id?: string | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          premium_expires_at?: string | null
          hide_footer?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string
          views_count?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          is_displayed: boolean | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          is_displayed?: boolean | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          is_displayed?: boolean | null
          sort_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_links: {
        Row: {
          clicks_count: number | null
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean | null
          sort_order: number | null
          title: string
          url: string
          user_id: string
        }
        Insert: {
          clicks_count?: number | null
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          title: string
          url: string
          user_id: string
        }
        Update: {
          clicks_count?: number | null
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_videos: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean | null
          platform: string | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean | null
          platform?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean | null
          platform?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      badge_category:
        | "achievement"
        | "event"
        | "special"
        | "community"
        | "premium"
      badge_rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
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
      badge_category: [
        "achievement",
        "event",
        "special",
        "community",
        "premium",
      ],
      badge_rarity: ["common", "uncommon", "rare", "epic", "legendary"],
    },
  },
} as const
