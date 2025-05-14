
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchMessages, sendTeacherMessage, Message, SystemExerciseData, SystemFinishedData, addNewExerciseLoadedMessage, addSystemFinishedMessage } from "@/services/message-service";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatInput from "./ChatInput";
import ExerciseMessageCard from "./ExerciseMessageCard";
import { toast } from "@/components/ui/use-toast";
import { createRouterLog, RouterLog } from "@/services/log-service";

interface ChatTabProps {
  student: {
    id: string;
    name: string;
  };
}

const ChatTab = ({ student }: ChatTabProps) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", student.id],
    queryFn: () => fetchMessages(student.id),
    refetchOnWindowFocus: false,
  });

  // Send message mutation
  const { mutate, isPending: isSending } = useMutation({
    mutationFn: sendTeacherMessage,
    onMutate: async (newMessage) => {
      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        student_id: newMessage.student_id,
        sender: "teacher",
        content: newMessage.content,
        created_at: new Date().toISOString(),
        type: "chat"
      };
      
      setOptimisticMessages(prev => [optimisticMessage, ...prev]);
      return { optimisticMessage };
    },
    onSuccess: (data, variables) => {
      // Push server-confirmed message into cache
      queryClient.setQueryData<Message[]>(["messages", student.id], (old = []) => {
        return [data, ...old];
      });
      
      // Remove the matching optimistic message
      setOptimisticMessages(prev => 
        prev.filter(msg => msg.content !== variables.content)
      );
    },
    onError: (error, variables, context) => {
      console.error("Failed to send message:", error);
      // Remove the optimistic message on error
      if (context?.optimisticMessage) {
        setOptimisticMessages(prev => 
          prev.filter(msg => msg.id !== context.optimisticMessage.id)
        );
      }
    },
  });

  // Add exercise loaded message mutation
  const { mutate: addExerciseLoaded } = useMutation({
    mutationFn: addNewExerciseLoadedMessage,
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData<Message[]>(["messages", student.id], (old = []) => {
          return [data, ...old];
        });
        
        toast({
          title: "Nouvel exercice chargé",
          description: `${(data.metadata as SystemExerciseData).systemName} a été chargé`,
        });
      }
    }
  });
  
  // Add exercise finished message mutation
  const { mutate: addExerciseFinished } = useMutation({
    mutationFn: addSystemFinishedMessage,
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData<Message[]>(["messages", student.id], (old = []) => {
          return [data, ...old];
        });
        
        toast({
          title: "Exercice terminé",
          description: `${(data.metadata as SystemFinishedData).systemName} a été terminé`,
        });
      }
    }
  });

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    mutate({ student_id: student.id, content });
  };

  // Set up realtime subscription for router logs to capture system events
  useEffect(() => {
    const processRouterLog = async (payload: any) => {
      const log = payload.new as RouterLog;
      
      // Only process if this log belongs to the current student
      // Note: This assumes there's a mapping between source_ip and student_id
      // In a real implementation, you'd need to check if this log is for this student
      
      // Look for NewExerciseLoaded events
      if (log.log_type === 'NewExerciseLoaded' && log.content) {
        try {
          console.log("Exercise loaded:", log.content);
          const exerciseData = typeof log.content === 'string' ? 
            JSON.parse(log.content) as SystemExerciseData : 
            log.content as SystemExerciseData;
            
          // Add the message to the student's chat and persist it to the database
          addExerciseLoaded(student.id, exerciseData);
        } catch (error) {
          console.error("Error processing NewExerciseLoaded event:", error);
        }
      }
      
      // Look for SystemFinished events
      if (log.log_type === 'SystemFinished' && log.content) {
        try {
          console.log("System finished:", log.content);
          const finishedData = typeof log.content === 'string' ? 
            JSON.parse(log.content) as SystemFinishedData : 
            log.content as SystemFinishedData;
            
          // Add the message to the student's chat and persist it to the database
          addExerciseFinished(student.id, finishedData);
        } catch (error) {
          console.error("Error processing SystemFinished event:", error);
        }
      }
    };

    // Subscribe to router logs
    const channel = supabase
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

    // Set up realtime subscription for new messages
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `student_id=eq.${student.id}`
        },
        (payload) => {
          console.log("New message received:", payload);
          // Update the query cache with the new message
          queryClient.setQueryData<Message[]>(["messages", student.id], (old = []) => {
            const exists = old.some(m => m.id === payload.new.id);
            return exists ? old : [payload.new as Message, ...old];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [student.id, queryClient, addExerciseLoaded, addExerciseFinished]);

  // Simulate system events for testing purposes
  const simulateSystemEvent = async (type: "exercise_loaded" | "exercise_finished") => {
    let log: RouterLog;
    
    if (type === "exercise_loaded") {
      const exerciseData: SystemExerciseData = {
        systemName: "Système électrique",
        systemDesc: "Exploration d'un système électrique basique",
        systemDiff: "2",
        requiredLinks: 5
      };
      
      log = {
        time_seconds: Math.floor(Date.now() / 1000),
        source_ip: "192.168.1.100",
        log_type: "NewExerciseLoaded",
        content: exerciseData
      };
    } else {
      const finishedData: SystemFinishedData = {
        systemName: "Système électrique",
        systemDesc: "Exploration d'un système électrique basique",
        systemDiff: "2",
        correctLinks: 4,
        incorrectLinks: 1
      };
      
      log = {
        time_seconds: Math.floor(Date.now() / 1000),
        source_ip: "192.168.1.100",
        log_type: "SystemFinished",
        content: finishedData
      };
    }
    
    await createRouterLog(log);
  };

  // For development testing only - uncomment to test
  // useEffect(() => {
  //   const testEvents = async () => {
  //     await simulateSystemEvent("exercise_loaded");
  //     setTimeout(async () => {
  //       await simulateSystemEvent("exercise_finished");
  //     }, 5000);
  //   };
  //   testEvents();
  // }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, optimisticMessages]);

  // Combine server messages with optimistic messages
  const allMessages = [...optimisticMessages, ...messages];

  // Function to render the appropriate message component based on type
  const renderMessage = (message: Message) => {
    if (message.type === "exercise_loaded" && message.metadata) {
      return (
        <ExerciseMessageCard 
          key={message.id}
          type="exercise_loaded"
          timestamp={message.created_at}
          data={message.metadata as SystemExerciseData}
        />
      );
    } else if (message.type === "exercise_finished" && message.metadata) {
      return (
        <ExerciseMessageCard 
          key={message.id}
          type="exercise_finished"
          timestamp={message.created_at}
          data={message.metadata as SystemFinishedData}
        />
      );
    } else {
      // Default chat message
      return (
        <ChatMessageBubble
          key={message.id}
          content={message.content}
          timestamp={message.created_at}
          sender={message.sender}
        />
      );
    }
  };

  return (
    <div className="relative h-[500px]">
      <div 
        ref={messageContainerRef}
        className="flex flex-col gap-2 overflow-y-auto h-full pb-16"
      >
        {isLoading ? (
          <div className="flex justify-center p-4">
            <p>Loading messages...</p>
          </div>
        ) : allMessages.length > 0 ? (
          <div className="flex flex-col-reverse gap-4 p-4">
            {allMessages.map(renderMessage)}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>
      
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isSending={isSending}
      />
    </div>
  );
};

export default ChatTab;
