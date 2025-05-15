
import { useEffect, useRef } from "react";
import { useChatMessages } from "@/hooks/useChatMessages";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatInput from "./ChatInput";
import ExerciseMessageCard from "./ExerciseMessageCard";
import { Message } from "@/services/message-service";

interface ChatTabProps {
  student: {
    id: string;
    name: string;
  };
}

const ChatTab = ({ student }: ChatTabProps) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Use our custom hook to manage chat messages
  const { 
    messages: allMessages,
    isLoading,
    isSending,
    sendMessage
  } = useChatMessages(student.id);

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [allMessages]);

  // Function to render the appropriate message component based on type
  const renderMessage = (message: Message) => {
    if (message.type === "exercise_loaded" && message.metadata) {
      return (
        <ExerciseMessageCard 
          key={message.id}
          type="exercise_loaded"
          timestamp={message.created_at}
          data={message.metadata}
        />
      );
    } else if (message.type === "exercise_finished" && message.metadata) {
      return (
        <ExerciseMessageCard 
          key={message.id}
          type="exercise_finished"
          timestamp={message.created_at}
          data={message.metadata}
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
