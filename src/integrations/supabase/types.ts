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
      config: {
        Row: {
          campeao_oficial: string | null
          id: number
        }
        Insert: {
          campeao_oficial?: string | null
          id?: number
        }
        Update: {
          campeao_oficial?: string | null
          id?: number
        }
        Relationships: []
      }
      fases: {
        Row: {
          abertura: string
          encerramento: string
          id: string
          nome: Database["public"]["Enums"]["fase_nome"]
        }
        Insert: {
          abertura: string
          encerramento: string
          id?: string
          nome: Database["public"]["Enums"]["fase_nome"]
        }
        Update: {
          abertura?: string
          encerramento?: string
          id?: string
          nome?: Database["public"]["Enums"]["fase_nome"]
        }
        Relationships: []
      }
      jogos: {
        Row: {
          bandeira_a: string | null
          bandeira_b: string | null
          created_at: string
          data_hora: string
          fase: Database["public"]["Enums"]["fase_nome"]
          gols_a: number | null
          gols_b: number | null
          grupo: string | null
          id: string
          time_a: string
          time_b: string
        }
        Insert: {
          bandeira_a?: string | null
          bandeira_b?: string | null
          created_at?: string
          data_hora: string
          fase: Database["public"]["Enums"]["fase_nome"]
          gols_a?: number | null
          gols_b?: number | null
          grupo?: string | null
          id?: string
          time_a: string
          time_b: string
        }
        Update: {
          bandeira_a?: string | null
          bandeira_b?: string | null
          created_at?: string
          data_hora?: string
          fase?: Database["public"]["Enums"]["fase_nome"]
          gols_a?: number | null
          gols_b?: number | null
          grupo?: string | null
          id?: string
          time_a?: string
          time_b?: string
        }
        Relationships: []
      }
      palpites: {
        Row: {
          created_at: string
          gols_a: number
          gols_b: number
          id: string
          jogo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gols_a: number
          gols_b: number
          id?: string
          jogo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gols_a?: number
          gols_b?: number
          id?: string
          jogo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          campeao: string | null
          created_at: string
          email: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          campeao?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          campeao?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["user_status"]
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
    }
    Views: {
      ranking: {
        Row: {
          id: string | null
          nome: string | null
          pontos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      fase_aberta_para_jogo: { Args: { _jogo_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pontos_palpite: {
        Args: {
          p_palpite_a: number
          p_palpite_b: number
          p_real_a: number
          p_real_b: number
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "participant"
      fase_nome: "grupos" | "oitavas" | "quartas" | "semis" | "final"
      user_status: "pendente" | "aprovado" | "rejeitado"
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
      app_role: ["admin", "participant"],
      fase_nome: ["grupos", "oitavas", "quartas", "semis", "final"],
      user_status: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
