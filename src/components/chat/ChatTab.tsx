
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchMessages, sendTeacherMessage, Message } from "@/services/message-service";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatInput from "./ChatInput";

interface ChatTabProps {
  student: {
    id: string;
    name: string;
  };
}

const ChatTab = ({ student }: ChatTabProps) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

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
      };
      
      setOptimisticMessages(prev => [optimisticMessage, ...prev]);
      return { optimisticMessage };
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
    onSettled: () => {
      // Clear optimistic messages after the server responds
      setOptimisticMessages([]);
    },
  });

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    mutate({ student_id: student.id, content });
  };

  // Set up realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
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
          // We'll let React Query handle the refetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, optimisticMessages]);

  // Combine server messages with optimistic messages
  const allMessages = [...optimisticMessages, ...messages];

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
            {allMessages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                content={message.content}
                timestamp={message.created_at}
                sender={message.sender}
              />
            ))}
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
