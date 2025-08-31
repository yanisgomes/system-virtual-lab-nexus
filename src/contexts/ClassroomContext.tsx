import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ClassroomContextType {
  selectedClassroom: string;
  setSelectedClassroom: (classroomId: string) => void;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (context === undefined) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};

interface ClassroomProviderProps {
  children: ReactNode;
}

export const ClassroomProvider: React.FC<ClassroomProviderProps> = ({ children }) => {
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");

  return (
    <ClassroomContext.Provider value={{ selectedClassroom, setSelectedClassroom }}>
      {children}
    </ClassroomContext.Provider>
  );
};