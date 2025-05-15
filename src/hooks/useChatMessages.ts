
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  fetchMessages, 
  sendTeacherMessage, 
  Message, 
  SystemExerciseData, 
  SystemFinishedData,
  addNewExerciseLoadedMessage,
  addSystemFinishedMessage
} from "@/services/message-service";
import { toast } from "@/components/ui/use-toast";
import { RouterLog } from "@/services/log-service";

export function useChatMessages(studentId: string) {
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();
  
  // Fetch messages
  const { data: fetchedMessages = [], isLoading } = useQuery({
    queryKey: ["messages", studentId],
    queryFn: () => fetchMessages(studentId),
    refetchOnWindowFocus: false,
  });

  // Combined messages
  const allMessages = [...optimisticMessages, ...fetchedMessages];

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (content: string) => sendTeacherMessage({ 
      student_id: studentId, 
      content 
    }),
    onMutate: async (content) => {
      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        student_id: studentId,
        sender: "teacher",
        content: content,
        created_at: new Date().toISOString(),
        type: "chat"
      };
      
      setOptimisticMessages(prev => [optimisticMessage, ...prev]);
      return { optimisticMessage };
    },
    onSuccess: (data, content, context) => {
      // Push server-confirmed message into cache
      queryClient.setQueryData<Message[]>(["messages", studentId], (old = []) => {
        return [data, ...old];
      });
      
      // Remove the matching optimistic message
      if (context?.optimisticMessage) {
        setOptimisticMessages(prev => 
          prev.filter(msg => msg.id !== context.optimisticMessage.id)
        );
      }
    },
    onError: (error, content, context) => {
      console.error("Failed to send message:", error);
      // Remove the optimistic message on error
      if (context?.optimisticMessage) {
        setOptimisticMessages(prev => 
          prev.filter(msg => msg.id !== context.optimisticMessage.id)
        );
      }
      
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Supabase subscriptions setup
  useEffect(() => {
    // Process router logs for system events
    const processRouterLog = async (payload: any) => {
      const log = payload.new as RouterLog;
      
      // Process NewExerciseLoaded events
      if (log.log_type === 'NewExerciseLoaded' && log.content) {
        try {
          console.log("Exercise loaded:", log.content);
          const exerciseData = typeof log.content === 'string' ? 
            JSON.parse(log.content) as SystemExerciseData : 
            log.content as SystemExerciseData;
            
          // Add exercise loaded message to the message cache
          const newMessage: Message = {
            id: `exercise-${Date.now()}`,
            student_id: studentId,
            sender: "system",
            content: `Exercice chargé: ${exerciseData.systemName}`,
            created_at: new Date().toISOString(),
            type: "exercise_loaded",
            metadata: exerciseData
          };
          
          queryClient.setQueryData<Message[]>(["messages", studentId], (old = []) => {
            return [newMessage, ...old];
          });
          
          // Also persist to the database
          addNewExerciseLoadedMessage(studentId, exerciseData)
            .catch(err => console.error("Error saving exercise loaded message:", err));
          
          toast({
            title: "Nouvel exercice chargé",
            description: `${exerciseData.systemName} a été chargé`,
          });
        } catch (error) {
          console.error("Error processing NewExerciseLoaded event:", error);
        }
      }
      
      // Process SystemFinished events
      if (log.log_type === 'SystemFinished' && log.content) {
        try {
          console.log("System finished:", log.content);
          const finishedData = typeof log.content === 'string' ? 
            JSON.parse(log.content) as SystemFinishedData : 
            log.content as SystemFinishedData;
            
          // Add system finished message to the message cache
          const newMessage: Message = {
            id: `finished-${Date.now()}`,
            student_id: studentId,
            sender: "system",
            content: `Exercice terminé: ${finishedData.systemName}`,
            created_at: new Date().toISOString(),
            type: "exercise_finished",
            metadata: finishedData
          };
          
          queryClient.setQueryData<Message[]>(["messages", studentId], (old = []) => {
            return [newMessage, ...old];
          });
          
          // Also persist to the database
          addSystemFinishedMessage(studentId, finishedData)
            .catch(err => console.error("Error saving system finished message:", err));
          
          toast({
            title: "Exercice terminé",
            description: `${finishedData.systemName} a été terminé`,
          });
        } catch (error) {
          console.error("Error processing SystemFinished event:", error);
        }
      }
    };

    // Subscribe to router logs
    const routerLogsChannel = supabase
      .channel('router_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'router_logs'
        },
        processRouterLog
      )
      .subscribe();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          console.log("New message received:", payload);
          // Check if this is already in our cache (to avoid duplicates)
          queryClient.setQueryData<Message[]>(["messages", studentId], (old = []) => {
            const newMessage = payload.new as Message;
            const exists = old.some(m => m.id === newMessage.id);
            // Only add if not already in the list
            return exists ? old : [newMessage, ...old];
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(routerLogsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [studentId, queryClient]);

  // Get the latest exercise for a student
  const getLatestExercise = () => {
    const systemMessages = allMessages.filter(
      msg => msg.type === "exercise_loaded" || msg.type === "exercise_finished"
    );
    
    return systemMessages.length > 0 ? systemMessages[0] : null;
  };

  return {
    messages: allMessages,
    isLoading,
    isSending,
    sendMessage,
    getLatestExercise
  };
}
