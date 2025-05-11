
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
  const { raisedHands } = useRaisedHand();
  
  const isHandRaised = raisedHands[student.id] || false;
  
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
    <div className="relative h-full">
      {/* Animated card wrapper */}
      <motion.div
        variants={cardVariants}
        animate={isHandRaised ? ["raised", "wiggle"] : "initial"}
        className="h-full"
      >
        <StudentCard student={student} onClick={onClick} />
      </motion.div>
      
      {/* Hand icon (only shown when hand is raised) */}
      {isHandRaised && (
        <motion.div
          variants={handVariants}
          initial="initial"
          animate="visible"
          exit="exit"
          className="absolute top-2 right-2 z-10"
        >
          <Hand 
            size={24} 
            className="text-rose-500" 
          />
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedStudentCard;
