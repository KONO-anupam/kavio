// types/database.ts

// Generated Database types — reflects 001_initial_schema.sql
// Keep in sync with schema. Re-generate with:
//   pnpm supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookingStatus = "new" | "contacted" | "booked" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          business_name: string;
          slug: string;
          accent_color: string;
          logo_url: string | null;
          gcal_token_ref: string | null;
          business_hours: Json;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_name?: string;
          slug: string;
          accent_color?: string;
          logo_url?: string | null;
          gcal_token_ref?: string | null;
          business_hours?: Json;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          slug?: string;
          accent_color?: string;
          logo_url?: string | null;
          gcal_token_ref?: string | null;
          business_hours?: Json;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      services: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          duration: number;
          price: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          duration: number;
          price: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string | null;
          duration?: number;
          price?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          tenant_id: string;
          service_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          start_at: string;
          end_at: string;
          status: BookingStatus;
          notes: string | null;
          gcal_event_id: string | null;
          confirmation_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          service_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          start_at: string;
          end_at: string;
          status?: BookingStatus;
          notes?: string | null;
          gcal_event_id?: string | null;
          confirmation_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          service_id?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          start_at?: string;
          end_at?: string;
          status?: BookingStatus;
          notes?: string | null;
          gcal_event_id?: string | null;
          confirmation_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      calendar_sync_tokens: {
        Row: {
          id: string;
          tenant_id: string;
          channel_id: string;
          resource_id: string | null;
          sync_token: string | null;
          expiration: string | null;
          calendar_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          channel_id: string;
          resource_id?: string | null;
          sync_token?: string | null;
          expiration?: string | null;
          calendar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          channel_id?: string;
          resource_id?: string | null;
          sync_token?: string | null;
          expiration?: string | null;
          calendar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_sync_tokens_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_tenant_id_by_slug: {
        Args: { p_slug: string };
        Returns: string;
      };
      get_tenant_metrics: {
        Args: { p_tenant_id: string };
        Returns: Json;
      };
    };
    Enums: {
      booking_status: BookingStatus;
    };
  };
}