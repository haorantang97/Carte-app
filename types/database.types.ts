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
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "dish_comments_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "dish_likes_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          group_id: string
          id: string
          image_url: string | null
          ingredients: Json
          name: string
          price: number
          recipe: string | null
          recipe_is_private: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          ingredients?: Json
          name: string
          price?: number
          recipe?: string | null
          recipe_is_private?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          ingredients?: Json
          name?: string
          price?: number
          recipe?: string | null
          recipe_is_private?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dishes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "menu_group_members_diner_id_fkey"
            columns: ["diner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "menu_groups_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "order_sessions_diner_id_fkey"
            columns: ["diner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_sessions_menu_group_id_fkey"
            columns: ["menu_group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "orders_diner_id_fkey"
            columns: ["diner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_menu_group_id_fkey"
            columns: ["menu_group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "order_sessions"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "wishlist_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "wishlist_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_votes_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlist"
            referencedColumns: ["id"]
          },
        ]
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
