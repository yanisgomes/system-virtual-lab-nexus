
import React from "react";
import { Classroom } from "@/services/dashboard-data";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface ClassroomSidebarProps {
  classrooms: Classroom[];
  selectedClassroom: string;
  onSelectClassroom: (classroomId: string) => void;
}

const ClassroomSidebar = ({
  classrooms,
  selectedClassroom,
  onSelectClassroom,
}: ClassroomSidebarProps) => {
  return (
    <Sidebar className="border-r border-vr-light-gray">
      <SidebarHeader className="flex items-center h-16 px-4 border-b border-vr-light-gray">
        <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
          <span className="text-sidebar-primary">SysVL</span>
          <span className="text-sidebar-foreground/90">Nexus</span>
        </h1>
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <div className="mb-4 px-4">
          <h2 className="text-sm font-medium text-sidebar-foreground mb-2">Laboratoires</h2>
        </div>
        <div className="space-y-1 px-2">
          {classrooms.map((classroom) => (
            <button
              key={classroom.id}
              onClick={() => onSelectClassroom(classroom.id)}
              className={cn(
                "w-full flex items-center px-3 py-3 text-sm rounded-md transition-colors",
                selectedClassroom === classroom.id
                  ? "bg-academic-primary text-white"
                  : "text-sidebar-foreground hover:bg-vr-light-blue hover:text-academic-primary"
              )}
            >
              <span className="flex-1 text-left">{classroom.name}</span>
              {selectedClassroom === classroom.id && (
                <div className="w-2 h-2 rounded-full bg-white animate-pulse-light"></div>
              )}
            </button>
          ))}
        </div>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-vr-light-gray p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-vr-light-blue flex items-center justify-center text-academic-primary">
            P
          </div>
          <div>
            <p className="text-sm font-medium text-white">Professeur</p>
            <p className="text-xs text-gray-400">Administrateur</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ClassroomSidebar;
