
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  student_id: string;
  sender: "teacher" | "student" | "system";
  content: string;
  created_at: string;
  type?: "chat" | "exercise_loaded" | "exercise_finished";
  metadata?: SystemExerciseData | SystemFinishedData;
}

export interface MessageInput {
  student_id: string;
  sender: "teacher" | "student" | "system";
  content: string;
  type?: "chat" | "exercise_loaded" | "exercise_finished";
  metadata?: SystemExerciseData | SystemFinishedData;
}

// New interface for NewExerciseLoaded data
export interface SystemExerciseData {
  systemName: string;
  systemDesc: string;
  systemDiff: string;
  requiredLinks: number;
}

// New interface for SystemFinished data
export interface SystemFinishedData {
  systemName: string;
  systemDesc: string;
  systemDiff: string;
  correctLinks: number;
  incorrectLinks: number;
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

    // Parse metadata for system messages if it exists
    const parsedMessages = (data as Message[])?.map(message => {
      if (message.metadata && typeof message.metadata === 'string') {
        try {
          message.metadata = JSON.parse(message.metadata as unknown as string);
        } catch (e) {
          console.error("Error parsing message metadata:", e);
        }
      }
      return message;
    }) || [];

    return parsedMessages;
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
      .insert({ student_id, sender: 'teacher' as const, content, type: 'chat' })
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

// New function to add system exercise messages
export const addSystemExerciseMessage = async (
  studentId: string, 
  messageType: "exercise_loaded" | "exercise_finished", 
  content: string,
  metadata: SystemExerciseData | SystemFinishedData
): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({ 
        student_id: studentId, 
        sender: 'system', 
        content, 
        type: messageType,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding system message:", error);
      throw new Error(`Failed to add system message: ${error.message}`);
    }

    return data as Message;
  } catch (err) {
    console.error("Error in addSystemExerciseMessage:", err);
    throw err;
  }
};

// Add functions to handle the specific message types
export const addNewExerciseLoadedMessage = async (
  studentId: string,
  exerciseData: SystemExerciseData
): Promise<Message | null> => {
  return addSystemExerciseMessage(
    studentId,
    "exercise_loaded",
    `Exercice chargé: ${exerciseData.systemName}`,
    exerciseData
  );
};

export const addSystemFinishedMessage = async (
  studentId: string,
  finishedData: SystemFinishedData
): Promise<Message | null> => {
  return addSystemExerciseMessage(
    studentId,
    "exercise_finished",
    `Exercice terminé: ${finishedData.systemName}`,
    finishedData
  );
};
