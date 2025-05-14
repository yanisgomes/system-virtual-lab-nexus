
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Trophy } from "lucide-react";
import { SystemExerciseData, SystemFinishedData } from "@/services/message-service";

interface ExerciseMessageCardProps {
  type: "exercise_loaded" | "exercise_finished";
  timestamp: string;
  data: SystemExerciseData | SystemFinishedData;
}

const ExerciseMessageCard = ({ type, timestamp, data }: ExerciseMessageCardProps) => {
  const isExerciseLoaded = type === "exercise_loaded";
  const formattedTime = new Date(timestamp).toLocaleTimeString();
  
  // Cast data to the appropriate type
  const exerciseData = isExerciseLoaded 
    ? data as SystemExerciseData 
    : data as SystemFinishedData;

  return (
    <div className="flex flex-col space-y-2 mb-4">
      <span className="text-xs text-muted-foreground">{formattedTime}</span>
      
      <Card className="bg-slate-50 border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-academic-primary/10 p-2 rounded-full">
              {isExerciseLoaded ? (
                <BookOpen className="h-5 w-5 text-academic-primary" />
              ) : (
                <Trophy className="h-5 w-5 text-academic-primary" />
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-2">
                {isExerciseLoaded ? "Exercice chargé" : "Exercice terminé"}
              </h4>
              
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Titre : </span>
                  <span>{exerciseData.systemName}</span>
                </div>
                
                <div>
                  <span className="font-medium">Description : </span>
                  <span>{exerciseData.systemDesc}</span>
                </div>
                
                <div>
                  <span className="font-medium">Difficulté : </span>
                  <span>{exerciseData.systemDiff}</span>
                </div>
                
                {isExerciseLoaded ? (
                  <div>
                    <span className="font-medium">Liens requis : </span>
                    <span>{(exerciseData as SystemExerciseData).requiredLinks}</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="font-medium">Liens corrects : </span>
                      <span>{(exerciseData as SystemFinishedData).correctLinks}</span>
                    </div>
                    <div>
                      <span className="font-medium">Liens incorrects : </span>
                      <span>{(exerciseData as SystemFinishedData).incorrectLinks}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExerciseMessageCard;
