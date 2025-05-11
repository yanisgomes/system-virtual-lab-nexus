
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  student_id: string;
  sender: "teacher" | "student";
  content: string;
  created_at: string;
}

export interface MessageInput {
  student_id: string;
  sender: "teacher" | "student";
  content: string;
}

export const fetchMessages = async (studentId: string, limit = 50): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching messages:", error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Cast the data to ensure it matches our expected type
    return (data as Message[]) || [];
  } catch (err) {
    console.error("Error in fetchMessages:", err);
    throw err;
  }
};

export const sendTeacherMessage = async ({ student_id, content }: Omit<MessageInput, "sender">): Promise<Message | null> => {
  try {
    if (!content.trim()) return null;
    
    const { data, error } = await supabase
      .from("messages")
      .insert({ student_id, sender: 'teacher' as const, content })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw new Error(`Failed to send message: ${error.message}`);
    }

    // Cast the returned data to ensure it matches our expected type
    return data as Message;
  } catch (err) {
    console.error("Error in sendTeacherMessage:", err);
    throw err;
  }
};
