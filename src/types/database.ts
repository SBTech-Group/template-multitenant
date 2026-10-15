// ⚠️ Core do template. Não editar por produto.
// Gerar via: npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Views: Record<string, never>
    CompositeTypes: Record<string, never>
    Tables: {
      tenants: {
        Row: {
          id: string
          slug: string
          nome: string
          plano: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          nome: string
          plano?: string
          status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      tenant_members: {
        Row: {
          tenant_id: string
          user_id: string
          role: string
        }
        Insert: {
          tenant_id: string
          user_id: string
          role?: string
        }
        Update: Partial<Database['public']['Tables']['tenant_members']['Insert']>
      }
      subscriptions: {
        Row: {
          tenant_id: string
          module: string
          active: boolean
          expires_at: string | null
        }
        Insert: {
          tenant_id: string
          module: string
          active?: boolean
          expires_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      tenant_settings: {
        Row: {
          tenant_id: string
          config: Json
        }
        Insert: {
          tenant_id: string
          config?: Json
        }
        Update: Partial<Database['public']['Tables']['tenant_settings']['Insert']>
      }
    }
    Functions: {
      current_tenant_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
