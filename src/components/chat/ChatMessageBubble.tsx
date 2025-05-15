
import { formatRelative } from "date-fns";

interface ChatMessageBubbleProps {
  content: string;
  timestamp: string;
  sender: "teacher" | "student" | "system";
}

const ChatMessageBubble = ({ content, timestamp, sender }: ChatMessageBubbleProps) => {
  const isTeacher = sender === "teacher";
  const isSystem = sender === "system";
  const date = new Date(timestamp);
  const formattedTime = formatRelative(date, new Date());
  
  return (
    <div className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}>
      <div 
        className={`${
          isTeacher 
            ? 'bg-primary/90 text-white self-end' 
            : isSystem
              ? 'bg-slate-100 border border-slate-200 text-slate-800 self-start'
              : 'bg-muted text-foreground self-start'
        } rounded-2xl px-3 py-2 max-w-[75%]`}
      >
        {content}
      </div>
      <span className="text-xs text-muted-foreground mt-1">{formattedTime}</span>
    </div>
  );
};

export default ChatMessageBubble;
