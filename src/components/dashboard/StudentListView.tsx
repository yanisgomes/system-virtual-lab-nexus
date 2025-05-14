
import { useState } from "react";
import { Student } from "@/services/dashboard-data";
import EnhancedStudentCard from "./EnhancedStudentCard";
import StudentDetailModal from "./StudentDetailModal";
import { SystemExercise } from "../exercises/SystemExerciseCard";
import SystemExerciseCard from "../exercises/SystemExerciseCard";

interface StudentListViewProps {
  students: Student[];
  isLoading: boolean;
}

// Mock exercise data for each student
const mockExercises: Record<string, SystemExercise> = {};

const StudentListView = ({ students, isLoading }: StudentListViewProps) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [exercises, setExercises] = useState<Record<string, SystemExercise>>(() => {
    // Initialize with sample exercises for each student
    const initialExercises: Record<string, SystemExercise> = {};
    students.forEach((student, index) => {
      const diffLevel = ((index % 3) + 1).toString() as "1" | "2" | "3";
      initialExercises[student.id] = {
        title: `Exercice système ${index + 1}`,
        desc: `Description de l'exercice système pour ${student.name}`,
        diff: diffLevel,
        blocks: [
          {
            id: `block-${student.id}-1`,
            title: "Bloc principal",
            desc: "Description du bloc principal",
            out_ports: [
              {
                type: "E",
                dir: "out",
                pos: "R",
                target: "block-2"
              }
            ]
          },
          {
            id: `block-${student.id}-2`,
            title: "Bloc secondaire",
            desc: "Description du bloc secondaire",
            out_ports: []
          }
        ]
      };
    });
    return initialExercises;
  });

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
  };
  
  const handleExerciseUpdate = (studentId: string, updatedExercise: SystemExercise) => {
    setExercises(prev => ({
      ...prev,
      [studentId]: updatedExercise
    }));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-md animate-pulse h-[196px]"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {students.map((student) => (
          <div key={student.id} className="space-y-4">
            {/* Student Card */}
            <div className="h-[196px]">
              <EnhancedStudentCard
                student={student}
                onClick={() => handleStudentClick(student)}
              />
            </div>
            
            {/* Exercise Card */}
            <div>
              <SystemExerciseCard
                exercise={exercises[student.id]}
                studentId={student.id}
                onUpdate={(updatedExercise) => handleExerciseUpdate(student.id, updatedExercise)}
              />
            </div>
          </div>
        ))}
      </div>
      
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={handleCloseModal}
          open={!!selectedStudent}
        />
      )}
    </>
  );
};

export default StudentListView;
