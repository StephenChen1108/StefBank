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
      account_members: {
        Row: {
          account_id: string
          created_at: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_members_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          created_at: string
          current_balance: number
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          account_id: string
          created_at: string
          current_amount: number
          goal_type: string
          id: string
          metadata: Json
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          current_amount?: number
          goal_type?: string
          id?: string
          metadata?: Json
          target_amount: number
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          current_amount?: number
          goal_type?: string
          id?: string
          metadata?: Json
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          account_id: string
          amount: number
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          note: string
          payment_method: string
          rejected_at: string | null
          rejected_by: string | null
          request_type: Database["public"]["Enums"]["transaction_type"]
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          urgency: string | null
        }
        Insert: {
          account_id: string
          amount: number
          category: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          note: string
          payment_method: string
          rejected_at?: string | null
          rejected_by?: string | null
          request_type: Database["public"]["Enums"]["transaction_type"]
          requester_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          note?: string
          payment_method?: string
          rejected_at?: string | null
          rejected_by?: string | null
          request_type?: Database["public"]["Enums"]["transaction_type"]
          requester_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          balance_after: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          request_id: string | null
          status: string
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          account_id: string
          amount: number
          balance_after: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          request_id?: string | null
          status?: string
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          balance_after?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          request_id?: string | null
          status?: string
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_withdraw_request: {
        Args: { p_request_id: string; p_review_note: string }
        Returns: {
          account_id: string
          amount: number
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          note: string
          payment_method: string
          rejected_at: string | null
          rejected_by: string | null
          request_type: Database["public"]["Enums"]["transaction_type"]
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          urgency: string | null
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_withdraw_request: {
        Args: { p_request_id: string }
        Returns: {
          account_id: string
          amount: number
          balance_after: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          request_id: string | null
          status: string
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_deposit_request: {
        Args: { p_request_id: string }
        Returns: {
          account_id: string
          amount: number
          balance_after: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          request_id: string | null
          status: string
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_manual_transaction: {
        Args: {
          p_account_id: string
          p_amount: number
          p_category: string
          p_description: string
          p_transaction_date: string
          p_type: Database["public"]["Enums"]["transaction_type"]
        }
        Returns: {
          account_id: string
          amount: number
          balance_after: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          request_id: string | null
          status: string
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_goal: { Args: { p_account_id: string }; Returns: undefined }
      delete_request: { Args: { p_request_id: string }; Returns: undefined }
      delete_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      get_bank_snapshot: { Args: never; Returns: Json }
      keep_alive: { Args: never; Returns: Json }
      reject_request: {
        Args: { p_request_id: string; p_review_note: string }
        Returns: {
          account_id: string
          amount: number
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          note: string
          payment_method: string
          rejected_at: string | null
          rejected_by: string | null
          request_type: Database["public"]["Enums"]["transaction_type"]
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          urgency: string | null
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_request: {
        Args: {
          p_account_id: string
          p_amount: number
          p_category: string
          p_note: string
          p_payment_method: string
          p_request_type: Database["public"]["Enums"]["transaction_type"]
          p_urgency: string
        }
        Returns: {
          account_id: string
          amount: number
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          note: string
          payment_method: string
          rejected_at: string | null
          rejected_by: string | null
          request_type: Database["public"]["Enums"]["transaction_type"]
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          urgency: string | null
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_transaction: {
        Args: {
          p_amount: number
          p_category: string
          p_description: string
          p_transaction_date: string
          p_transaction_id: string
          p_type: Database["public"]["Enums"]["transaction_type"]
        }
        Returns: {
          account_id: string
          amount: number
          balance_after: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          request_id: string | null
          status: string
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_goal: {
        Args: {
          p_account_id: string
          p_goal_type: string
          p_metadata: Json
          p_target_amount: number
          p_title: string
        }
        Returns: {
          account_id: string
          created_at: string
          current_amount: number
          goal_type: string
          id: string
          metadata: Json
          target_amount: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "goals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      request_status: "pending" | "approved" | "completed" | "rejected"
      transaction_type: "deposit" | "withdraw"
      user_role: "manager" | "depositor"
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
      request_status: ["pending", "approved", "completed", "rejected"],
      transaction_type: ["deposit", "withdraw"],
      user_role: ["manager", "depositor"],
    },
  },
} as const
