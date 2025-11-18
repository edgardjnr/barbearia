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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      appointment_rate_limit: {
        Row: {
          appointment_count: number | null
          created_at: string | null
          id: string
          ip_address: string
          last_appointment: string | null
          organization_id: string
        }
        Insert: {
          appointment_count?: number | null
          created_at?: string | null
          id?: string
          ip_address: string
          last_appointment?: string | null
          organization_id: string
        }
        Update: {
          appointment_count?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string
          last_appointment?: string | null
          organization_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          base: string | null
          client_id: string
          company_phone: string | null
          created_at: string
          duration_minutes: number
          establishment_name: string | null
          id: string
          instance: string | null
          member_id: string | null
          notes: string | null
          organization_id: string
          scheduled_date: string
          scheduled_time: string
          service_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          base?: string | null
          client_id: string
          company_phone?: string | null
          created_at?: string
          duration_minutes?: number
          establishment_name?: string | null
          id?: string
          instance?: string | null
          member_id?: string | null
          notes?: string | null
          organization_id: string
          scheduled_date: string
          scheduled_time: string
          service_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          base?: string | null
          client_id?: string
          company_phone?: string | null
          created_at?: string
          duration_minutes?: number
          establishment_name?: string | null
          id?: string
          instance?: string | null
          member_id?: string | null
          notes?: string | null
          organization_id?: string
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_member"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          client_phone: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          organization_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_phone: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_phone?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_loyalty_points: {
        Row: {
          client_id: string
          created_at: string
          current_points: number
          id: string
          lifetime_points: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          current_points?: number
          id?: string
          lifetime_points?: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          current_points?: number
          id?: string
          lifetime_points?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          configuration: Json | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          configuration?: Json | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          configuration?: Json | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_point_transactions: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          description: string | null
          id: string
          organization_id: string
          points: number
          redemption_id: string | null
          service_id: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          points: number
          redemption_id?: string | null
          service_id?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          points?: number
          redemption_id?: string | null
          service_id?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_redemptions: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          points_spent: number
          redeemed_at: string
          reward_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          points_spent: number
          redeemed_at?: string
          reward_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          points_spent?: number
          redeemed_at?: string
          reward_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_loyalty_redemptions_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_loyalty_redemptions_reward_id"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          current_redemptions: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_redemptions: number | null
          name: string
          organization_id: string
          points_cost: number
          reward_type: string
          terms_conditions: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_redemptions?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_redemptions?: number | null
          name: string
          organization_id: string
          points_cost: number
          reward_type?: string
          terms_conditions?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_redemptions?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_redemptions?: number | null
          name?: string
          organization_id?: string
          points_cost?: number
          reward_type?: string
          terms_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_settings: {
        Row: {
          bronze_threshold: number | null
          created_at: string
          gold_threshold: number | null
          id: string
          is_active: boolean | null
          organization_id: string
          points_per_real: number | null
          points_per_visit: number | null
          silver_threshold: number | null
          updated_at: string
          vip_threshold: number | null
        }
        Insert: {
          bronze_threshold?: number | null
          created_at?: string
          gold_threshold?: number | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          points_per_real?: number | null
          points_per_visit?: number | null
          silver_threshold?: number | null
          updated_at?: string
          vip_threshold?: number | null
        }
        Update: {
          bronze_threshold?: number | null
          created_at?: string
          gold_threshold?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          points_per_real?: number | null
          points_per_visit?: number | null
          silver_threshold?: number | null
          updated_at?: string
          vip_threshold?: number | null
        }
        Relationships: []
      }
      member_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          member_id: string
          module: Database["public"]["Enums"]["module_name"]
          operation: Database["public"]["Enums"]["crud_operation"]
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          member_id: string
          module: Database["public"]["Enums"]["module_name"]
          operation: Database["public"]["Enums"]["crud_operation"]
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          member_id?: string
          module?: Database["public"]["Enums"]["module_name"]
          operation?: Database["public"]["Enums"]["crud_operation"]
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_permissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_schedule_blocks: {
        Row: {
          block_date: string
          created_at: string
          end_time: string | null
          id: string
          is_all_day: boolean
          member_id: string
          organization_id: string
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          block_date: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_all_day?: boolean
          member_id: string
          organization_id: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          block_date?: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_all_day?: boolean
          member_id?: string
          organization_id?: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      member_services: {
        Row: {
          created_at: string
          id: string
          member_id: string
          organization_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          organization_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          organization_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_member_services_member"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      Mensagens: {
        Row: {
          audio: string | null
          created_at: string
          FromMe: string | null
          id: number
          Imagem: string | null
          Instancia: string | null
          Mensagem: string | null
          Mensagem_visualizada: boolean | null
          Nome: string | null
          organization_id: string | null
          remoteJid: string | null
        }
        Insert: {
          audio?: string | null
          created_at?: string
          FromMe?: string | null
          id?: number
          Imagem?: string | null
          Instancia?: string | null
          Mensagem?: string | null
          Mensagem_visualizada?: boolean | null
          Nome?: string | null
          organization_id?: string | null
          remoteJid?: string | null
        }
        Update: {
          audio?: string | null
          created_at?: string
          FromMe?: string | null
          id?: number
          Imagem?: string | null
          Instancia?: string | null
          Mensagem?: string | null
          Mensagem_visualizada?: boolean | null
          Nome?: string | null
          organization_id?: string | null
          remoteJid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Mensagens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization_members_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
          whatsapp_apikey: string | null
          whatsapp_base_url: string | null
          whatsapp_instance_name: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          updated_at?: string
          whatsapp_apikey?: string | null
          whatsapp_base_url?: string | null
          whatsapp_instance_name?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
          whatsapp_apikey?: string | null
          whatsapp_base_url?: string | null
          whatsapp_instance_name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          current_organization_id: string | null
          display_name: string | null
          email: string | null
          id: string
          is_master: boolean | null
          phone: string | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          current_organization_id?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_master?: boolean | null
          phone?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          current_organization_id?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_master?: boolean | null
          phone?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      review_moderation: {
        Row: {
          created_at: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          rejection_reason: string | null
          review_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          review_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          review_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_moderation_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_rate_limit: {
        Row: {
          created_at: string | null
          email_hash: string
          id: string
          last_review: string | null
          organization_id: string
          review_count: number | null
        }
        Insert: {
          created_at?: string | null
          email_hash: string
          id?: string
          last_review?: string | null
          organization_id: string
          review_count?: number | null
        }
        Update: {
          created_at?: string | null
          email_hash?: string
          id?: string
          last_review?: string | null
          organization_id?: string
          review_count?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: string
          member_id: string | null
          organization_id: string
          rating: number
          service_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          organization_id: string
          rating: number
          service_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          organization_id?: string
          rating?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_member"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      service_history: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          id: string
          member_id: string | null
          notes: string | null
          organization_id: string
          performed_at: string
          price: number | null
          service_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          organization_id: string
          performed_at?: string
          price?: number | null
          service_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          organization_id?: string
          performed_at?: string
          price?: number | null
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_history_member"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          organization_id: string
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          member_id: string
          organization_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          member_id: string
          organization_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          member_id?: string
          organization_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_working_hours_member"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_users: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_appointment_rate_limit: {
        Args: { client_ip: string; org_id: string }
        Returns: boolean
      }
      check_client_exists: {
        Args: { client_email?: string; client_phone?: string; org_id: string }
        Returns: {
          client_exists: boolean
          client_id: string
        }[]
      }
      check_review_rate_limit: {
        Args: { client_email: string; org_id: string }
        Returns: boolean
      }
      create_or_update_client_safe: {
        Args: {
          client_birth_date?: string
          client_email?: string
          client_name: string
          client_phone?: string
          org_id: string
        }
        Returns: {
          client_id: string
          was_created: boolean
        }[]
      }
      create_review_with_validation: {
        Args: {
          client_email: string
          comment_param?: string
          member_id_param: string
          org_id: string
          rating_param: number
          service_id_param: string
        }
        Returns: {
          message: string
          review_id: string
          success: boolean
        }[]
      }
      get_clients_for_booking: {
        Args: { org_id: string }
        Returns: {
          id: string
          name: string
          organization_id: string
        }[]
      }
      get_current_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_or_create_chat: {
        Args: { _client_phone: string; _organization_id: string }
        Returns: string
      }
      get_organization_member_count: {
        Args: { org_id: string }
        Returns: {
          active_members_count: number
        }[]
      }
      get_organizations_for_booking: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          description: string
          id: string
          name: string
        }[]
      }
      get_profiles_for_booking: {
        Args: { org_id: string }
        Returns: {
          display_name: string
          user_id: string
        }[]
      }
      get_public_appointments: {
        Args: { member_id_filter?: string; org_id: string; target_date: string }
        Returns: {
          duration_minutes: number
          member_id: string
          scheduled_time: string
        }[]
      }
      get_public_clients: {
        Args: { org_id: string }
        Returns: {
          id: string
          name: string
          organization_id: string
        }[]
      }
      get_public_member_profiles: {
        Args: { org_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
        }[]
      }
      get_public_member_services: {
        Args: { org_id: string }
        Returns: {
          member_id: string
          service_id: string
        }[]
      }
      get_public_organization_info: {
        Args: { org_id: string }
        Returns: {
          address: string
          description: string
          id: string
          name: string
        }[]
      }
      get_public_organization_members: {
        Args: { org_id: string }
        Returns: {
          id: string
          role: string
          user_id: string
        }[]
      }
      get_public_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          description: string
          id: string
          name: string
        }[]
      }
      get_public_schedule_blocks: {
        Args: { end_date?: string; org_id: string; start_date?: string }
        Returns: {
          block_date: string
          end_time: string
          is_all_day: boolean
          member_id: string
          start_time: string
        }[]
      }
      get_public_services: {
        Args: { org_id: string }
        Returns: {
          description: string
          duration_minutes: number
          id: string
          name: string
          price: number
        }[]
      }
      get_public_working_hours: {
        Args: { org_id: string }
        Returns: {
          day_of_week: number
          end_time: string
          member_id: string
          start_time: string
        }[]
      }
      get_safe_member_profiles: {
        Args: { org_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
        }[]
      }
      get_safe_organization_info: {
        Args: { org_slug: string }
        Returns: {
          address: string
          description: string
          id: string
          name: string
        }[]
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          joined_at: string
          member_status: string
          organization_description: string
          organization_id: string
          organization_name: string
          user_role: string
        }[]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_master_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      switch_current_organization: {
        Args: { _organization_id: string }
        Returns: boolean
      }
    }
    Enums: {
      AcaoAuditoria:
        | "CRIACAO"
        | "ATUALIZACAO"
        | "EXCLUSAO"
        | "LOGIN_SUCESSO"
        | "LOGIN_FALHA"
      appointment_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      CategoriaDRE:
        | "RECEITA_BRUTA"
        | "DEDUCOES_E_IMPOSTOS"
        | "CUSTOS"
        | "DESPESAS_OPERACIONAIS"
        | "RECEITAS_FINANCEIRAS"
        | "DESPESAS_FINANCEIRAS"
        | "IMPOSTOS_SOBRE_LUCRO"
      crud_operation: "create" | "read" | "update" | "delete"
      member_status: "active" | "inactive" | "pending"
      module_name:
        | "dashboard"
        | "agenda"
        | "clients"
        | "services"
        | "reports"
        | "loyalty"
        | "reviews"
        | "users"
        | "settings"
        | "messages"
      PerfilUsuario: "ADMIN" | "FINANCEIRO" | "LEITURA"
      TipoConta:
        | "RECEITA"
        | "CUSTO"
        | "DESPESA"
        | "OUTROS"
        | "FINANCEIRO_RECEITA"
        | "FINANCEIRO_DESPESA"
        | "IMPOSTO_SOBRE_VENDAS"
        | "IMPOSTO_SOBRE_LUCRO"
        | "DEDUCAO_RECEITA"
      user_role: "owner" | "admin" | "manager" | "employee"
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
      AcaoAuditoria: [
        "CRIACAO",
        "ATUALIZACAO",
        "EXCLUSAO",
        "LOGIN_SUCESSO",
        "LOGIN_FALHA",
      ],
      appointment_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      CategoriaDRE: [
        "RECEITA_BRUTA",
        "DEDUCOES_E_IMPOSTOS",
        "CUSTOS",
        "DESPESAS_OPERACIONAIS",
        "RECEITAS_FINANCEIRAS",
        "DESPESAS_FINANCEIRAS",
        "IMPOSTOS_SOBRE_LUCRO",
      ],
      crud_operation: ["create", "read", "update", "delete"],
      member_status: ["active", "inactive", "pending"],
      module_name: [
        "dashboard",
        "agenda",
        "clients",
        "services",
        "reports",
        "loyalty",
        "reviews",
        "users",
        "settings",
        "messages",
      ],
      PerfilUsuario: ["ADMIN", "FINANCEIRO", "LEITURA"],
      TipoConta: [
        "RECEITA",
        "CUSTO",
        "DESPESA",
        "OUTROS",
        "FINANCEIRO_RECEITA",
        "FINANCEIRO_DESPESA",
        "IMPOSTO_SOBRE_VENDAS",
        "IMPOSTO_SOBRE_LUCRO",
        "DEDUCAO_RECEITA",
      ],
      user_role: ["owner", "admin", "manager", "employee"],
    },
  },
} as const
