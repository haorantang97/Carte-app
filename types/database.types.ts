export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          group_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      dish_comments: {
        Row: {
          content: string
          created_at: string
          dish_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          dish_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dish_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dish_likes: {
        Row: {
          created_at: string
          dish_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dish_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          dish_id?: string
          user_id?: string
        }
        Relationships: []
      }
      dishes: {
        Row: {
          calories: number | null
          category_id: string
          cook_steps: Json | null
          created_at: string
          cuisine: string | null
          description: string | null
          difficulty: string | null
          extract_error: string | null
          extract_stage: string | null
          extract_started_at: string | null
          extract_status: string | null
          group_id: string
          id: string
          image_url: string | null
          ingredients: Json
          name: string
          nutrition: Json | null
          prep_steps: Json | null
          price: number
          recipe: string | null
          recipe_is_private: boolean
          servings: number | null
          sort_order: number
          source_platform: string | null
          source_url: string | null
          tags: Json | null
          tools: Json | null
          total_time_min: number | null
          updated_at: string
        }
        Insert: {
          calories?: number | null
          category_id: string
          cook_steps?: Json | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          difficulty?: string | null
          extract_error?: string | null
          extract_stage?: string | null
          extract_started_at?: string | null
          extract_status?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          ingredients?: Json
          name: string
          nutrition?: Json | null
          prep_steps?: Json | null
          price?: number
          recipe?: string | null
          recipe_is_private?: boolean
          servings?: number | null
          sort_order?: number
          source_platform?: string | null
          source_url?: string | null
          tags?: Json | null
          tools?: Json | null
          total_time_min?: number | null
          updated_at?: string
        }
        Update: {
          calories?: number | null
          category_id?: string
          cook_steps?: Json | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          difficulty?: string | null
          extract_error?: string | null
          extract_stage?: string | null
          extract_started_at?: string | null
          extract_status?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          ingredients?: Json
          name?: string
          nutrition?: Json | null
          prep_steps?: Json | null
          price?: number
          recipe?: string | null
          recipe_is_private?: boolean
          servings?: number | null
          sort_order?: number
          source_platform?: string | null
          source_url?: string | null
          tags?: Json | null
          tools?: Json | null
          total_time_min?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      menu_group_members: {
        Row: {
          diner_id: string
          group_id: string
          joined_at: string
        }
        Insert: {
          diner_id: string
          group_id: string
          joined_at?: string
        }
        Update: {
          diner_id?: string
          group_id?: string
          joined_at?: string
        }
        Relationships: []
      }
      menu_groups: {
        Row: {
          access_code: string
          chef_id: string
          created_at: string
          id: string
          is_private: boolean
          name: string
          password_hash: string | null
          updated_at: string
        }
        Insert: {
          access_code: string
          chef_id: string
          created_at?: string
          id?: string
          is_private?: boolean
          name: string
          password_hash?: string | null
          updated_at?: string
        }
        Update: {
          access_code?: string
          chef_id?: string
          created_at?: string
          id?: string
          is_private?: boolean
          name?: string
          password_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_sessions: {
        Row: {
          created_at: string
          diner_id: string
          id: string
          menu_group_id: string
          notes: string | null
          tip: number
        }
        Insert: {
          created_at?: string
          diner_id: string
          id?: string
          menu_group_id: string
          notes?: string | null
          tip?: number
        }
        Update: {
          created_at?: string
          diner_id?: string
          id?: string
          menu_group_id?: string
          notes?: string | null
          tip?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          diner_id: string
          dish_id: string
          id: string
          menu_group_id: string
          price_at_order: number
          quantity: number
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diner_id: string
          dish_id: string
          id?: string
          menu_group_id: string
          price_at_order: number
          quantity?: number
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diner_id?: string
          dish_id?: string
          id?: string
          menu_group_id?: string
          price_at_order?: number
          quantity?: number
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          role?: string
          updated_at?: string
          username?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          requester_id: string
          votes: number
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          requester_id: string
          votes?: number
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          requester_id?: string
          votes?: number
        }
        Relationships: []
      }
      wishlist_votes: {
        Row: {
          created_at: string
          user_id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          wishlist_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_group_by_access_code: {
        Args: { code: string }
        Returns: {
          chef_avatar_url: string
          chef_id: string
          chef_username: string
          group_id: string
          group_name: string
          is_private: boolean
        }[]
      }
      get_apify_api_key: { Args: never; Returns: string }
      get_gemini_api_key: { Args: never; Returns: string }
      get_openclaw_api_key: { Args: never; Returns: string }
      is_group_chef: {
        Args: { check_group_id: string; check_user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { check_group_id: string; check_user_id: string }
        Returns: boolean
      }
      is_group_public: { Args: { check_group_id: string }; Returns: boolean }
      set_carte_password: {
        Args: { check_group_id: string; pin: string }
        Returns: boolean
      }
      sweep_stuck_extractions: { Args: never; Returns: undefined }
      toggle_wishlist_vote: {
        Args: { check_wishlist_id: string }
        Returns: boolean
      }
      verify_carte_password: {
        Args: { check_group_id: string; pin: string }
        Returns: boolean
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
