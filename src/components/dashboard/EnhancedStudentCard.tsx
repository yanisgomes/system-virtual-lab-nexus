
import { MouseEventHandler } from "react";
import { Hand } from "lucide-react";
import { motion } from "framer-motion";
import { useRaisedHand } from "@/contexts/RaisedHandContext";
import { Student } from "@/services/dashboard-data";
import StudentCard from "./StudentCard";

interface EnhancedStudentCardProps {
  student: Student;
  onClick: MouseEventHandler<HTMLDivElement>;
}

const EnhancedStudentCard = ({ student, onClick }: EnhancedStudentCardProps) => {
  const { raisedHands, helpDots, clearHelpDot } = useRaisedHand();
  
  const isHandRaised = raisedHands[student.id] || false;
  const hasHelpDot = helpDots[student.id] || false;
  
  const handleHelpDotClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card's onClick
    clearHelpDot(student.id);
  };
  
  // Animation variants for the card
  const cardVariants = {
    initial: { y: 0, rotate: 0 },
    raised: {
      y: -8,
      transition: { duration: 0.2 }
    },
    wiggle: {
      rotate: [0, -2, 2, -2, 2, -1, 1, 0],
      transition: { duration: 0.8, times: [0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1] }
    }
  };
  
  // Animation variants for the hand icon
  const handVariants = {
    initial: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <div className="relative">
      {/* Animated card wrapper */}
      <motion.div
        variants={cardVariants}
        animate={isHandRaised ? ["raised", "wiggle"] : "initial"}
      >
        <StudentCard student={student} onClick={onClick} />
      </motion.div>
      
      {/* Help indicator (hand or dot) */}
      <div 
        className="absolute top-2 right-2 z-10"
        onClick={handleHelpDotClick}
      >
        {isHandRaised ? (
          <motion.div
            variants={handVariants}
            initial="initial"
            animate="visible"
            exit="exit"
          >
            <Hand 
              size={24} 
              className="text-rose-500" 
            />
          </motion.div>
        ) : hasHelpDot ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-2 h-2 rounded-full bg-rose-500 cursor-pointer"
            title="Click to clear help notification"
          />
        ) : null}
      </div>
    </div>
  );
};

export default EnhancedStudentCard;
