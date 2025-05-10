
import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import ClassroomSidebar from "@/components/dashboard/ClassroomSidebar";
import ClassroomDashboard from "@/components/dashboard/ClassroomDashboard";
import { fetchClassrooms, Classroom } from "@/services/dashboard-data";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadClassrooms = async () => {
      setIsLoading(true);
      try {
        const data = await fetchClassrooms();
        setClassrooms(data);
        
        // Select the first classroom by default
        if (data.length > 0 && !selectedClassroom) {
          setSelectedClassroom(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load classrooms:", error);
        toast({
          variant: "destructive",
          title: "Error loading classrooms",
          description: "Please check your connection and try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadClassrooms();
  }, [toast, selectedClassroom]);

  const handleClassroomChange = (classroomId: string) => {
    setSelectedClassroom(classroomId);
  };

  if (isLoading && classrooms.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-t-vr-purple rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading classrooms...</p>
        </div>
      </div>
    );
  }

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
          {selectedClassroom && (
            <ClassroomDashboard classroomId={selectedClassroom} />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
