
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import ClassroomSidebar from "@/components/dashboard/ClassroomSidebar";
import ClassroomDashboard from "@/components/dashboard/ClassroomDashboard";
import { classrooms } from "@/services/dashboard-data";

const Index = () => {
  const [selectedClassroom, setSelectedClassroom] = useState(classrooms[0].id);

  const handleClassroomChange = (classroomId: string) => {
    setSelectedClassroom(classroomId);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f5f7fa]">
        <div className="bg-vr-dark-gray">
          <ClassroomSidebar
            classrooms={classrooms}
            selectedClassroom={selectedClassroom}
            onSelectClassroom={handleClassroomChange}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <ClassroomDashboard classroomId={selectedClassroom} />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
