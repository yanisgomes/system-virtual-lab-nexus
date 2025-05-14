
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import SystemExerciseModal from "./SystemExerciseModal";

export interface SystemExercise {
  title: string;
  desc: string;
  diff: "1" | "2" | "3";
  blocks: SystemExerciseBlock[];
}

export interface SystemExerciseBlock {
  id: string;
  title: string;
  desc: string;
  out_ports: SystemExercisePort[];
}

export interface SystemExercisePort {
  type: "E" | "I" | "M";
  dir: "in" | "out";
  pos: "L" | "R" | "T" | "B";
  target: string;
}

interface SystemExerciseCardProps {
  exercise: SystemExercise;
  studentId?: string;
  onUpdate?: (exercise: SystemExercise) => void;
}

const SystemExerciseCard = ({ exercise, studentId, onUpdate }: SystemExerciseCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case "1": return "Facile";
      case "2": return "Moyen";
      case "3": return "Difficile";
      default: return "Inconnu";
    }
  };
  
  const handleUpdate = (updatedExercise: SystemExercise) => {
    if (onUpdate) {
      onUpdate(updatedExercise);
    }
    setIsModalOpen(false);
  };
  
  return (
    <>
      <Card className="border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium text-navy-700">{exercise.title}</h3>
            <Badge 
              variant={exercise.diff === "3" ? "destructive" : exercise.diff === "2" ? "secondary" : "outline"}
              className="ml-2"
            >
              {getDifficultyLabel(exercise.diff)}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2">{exercise.desc}</p>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={() => setIsModalOpen(true)}
          >
            Voir détails
          </Button>
        </CardFooter>
      </Card>
      
      <SystemExerciseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialExercise={exercise}
        onSave={handleUpdate}
      />
    </>
  );
};

export default SystemExerciseCard;
