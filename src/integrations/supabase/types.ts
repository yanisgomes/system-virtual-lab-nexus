export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_history: {
        Row: {
          id: number
          student_id: string
          timestamp: number
          value: number
        }
        Insert: {
          id?: number
          student_id: string
          timestamp: number
          value: number
        }
        Update: {
          id?: number
          student_id?: string
          timestamp?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "activity_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_metrics: {
        Row: {
          active_students: number
          average_attention: number
          classroom_id: string
          id: number
          session_duration: number
          total_engagement: number
        }
        Insert: {
          active_students?: number
          average_attention?: number
          classroom_id: string
          id?: number
          session_duration?: number
          total_engagement?: number
        }
        Update: {
          active_students?: number
          average_attention?: number
          classroom_id?: string
          id?: number
          session_duration?: number
          total_engagement?: number
        }
        Relationships: [
          {
            foreignKeyName: "classroom_metrics_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: true
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      focus_areas: {
        Row: {
          area: string
          id: number
          percentage: number
          student_id: string
        }
        Insert: {
          area: string
          id?: number
          percentage?: number
          student_id: string
        }
        Update: {
          area?: string
          id?: number
          percentage?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_areas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_interactions: {
        Row: {
          id: number
          menu_type: string
          student_id: string
        }
        Insert: {
          id?: number
          menu_type: string
          student_id: string
        }
        Update: {
          id?: number
          menu_type?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_interactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender: string
          student_id: string | null
          type: string | null
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender: string
          student_id?: string | null
          type?: string | null
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender?: string
          student_id?: string | null
          type?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          id: string
          title: string
          description: string
          diff: string
          system_json: Json
          layout_json?: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          diff: string
          system_json: Json
          layout_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          diff?: string
          system_json?: Json
          layout_json?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      student_exercises: {
        Row: {
          id: string
          student_id: string
          exercise_id: string
          assigned_at: string
          status: string
        }
        Insert: {
          id?: string
          student_id: string
          exercise_id: string
          assigned_at?: string
          status?: string
        }
        Update: {
          id?: string
          student_id?: string
          exercise_id?: string
          assigned_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_exercises_student_id_fkey",
            columns: ["student_id"],
            isOneToOne: false,
            referencedRelation: "students",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exercises_exercise_id_fkey",
            columns: ["exercise_id"],
            isOneToOne: false,
            referencedRelation: "exercises",
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_dispatch_queue: {
        Row: {
          id: string
          exercise_id: string
          student_id: string
          status: string
          error: string | null
          created_at: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          exercise_id: string
          student_id: string
          status?: string
          error?: string | null
          created_at?: string
          sent_at?: string | null
        }
        Update: {
          id?: string
          exercise_id?: string
          student_id?: string
          status?: string
          error?: string | null
          created_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_dispatch_queue_student_id_fkey",
            columns: ["student_id"],
            isOneToOne: false,
            referencedRelation: "students",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_dispatch_queue_exercise_id_fkey",
            columns: ["exercise_id"],
            isOneToOne: false,
            referencedRelation: "exercises",
            referencedColumns: ["id"]
          }
        ]
      }
      router_logs: {
        Row: {
          content: Json
          id: string
          log_type: string
          raw_log: string | null
          source_ip: string
          time_seconds: number
          timestamp: string
        }
        Insert: {
          content: Json
          id?: string
          log_type: string
          raw_log?: string | null
          source_ip: string
          time_seconds: number
          timestamp?: string
        }
        Update: {
          content?: Json
          id?: string
          log_type?: string
          raw_log?: string | null
          source_ip?: string
          time_seconds?: number
          timestamp?: string
        }
        Relationships: []
      }
      student_metrics: {
        Row: {
          attention: number
          block_grabs: number
          block_releases: number
          completed_tasks: number
          engagement: number
          id: number
          interaction_rate: number
          left_hand_usage: number
          menu_interactions: number
          move_distance: number
          right_hand_usage: number
          student_id: string
          task_success_rate: number
          total_hand_actions: number
        }
        Insert: {
          attention?: number
          block_grabs?: number
          block_releases?: number
          completed_tasks?: number
          engagement?: number
          id?: number
          interaction_rate?: number
          left_hand_usage?: number
          menu_interactions?: number
          move_distance?: number
          right_hand_usage?: number
          student_id: string
          task_success_rate?: number
          total_hand_actions?: number
        }
        Update: {
          attention?: number
          block_grabs?: number
          block_releases?: number
          completed_tasks?: number
          engagement?: number
          id?: number
          interaction_rate?: number
          left_hand_usage?: number
          menu_interactions?: number
          move_distance?: number
          right_hand_usage?: number
          student_id?: string
          task_success_rate?: number
          total_hand_actions?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_metrics_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar: string
          classroom_id: string
          headset_id: string
          id: string
          ip_address: string
          name: string
        }
        Insert: {
          avatar: string
          classroom_id: string
          headset_id: string
          id: string
          ip_address: string
          name: string
        }
        Update: {
          avatar?: string
          classroom_id?: string
          headset_id?: string
          id?: string
          ip_address?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
