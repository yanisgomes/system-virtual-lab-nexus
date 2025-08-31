import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import ClassroomSidebar from "@/components/dashboard/ClassroomSidebar";
import { fetchClassrooms, Classroom } from "@/services/dashboard-data";
import { useToast } from "@/hooks/use-toast";
import { ClassroomProvider, useClassroom } from "@/contexts/ClassroomContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayoutContent = ({ children }: AppLayoutProps) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { selectedClassroom, setSelectedClassroom } = useClassroom();

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
          title: "Erreur de chargement",
          description: "Veuillez vérifier votre connexion et réessayer."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadClassrooms();
  }, [toast, selectedClassroom, setSelectedClassroom]);

  const handleClassroomChange = (classroomId: string) => {
    setSelectedClassroom(classroomId);
  };

  if (isLoading && classrooms.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-t-academic-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des laboratoires...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8F9FA]">
        <div className="bg-[#1A1F2C]">
          <ClassroomSidebar
            classrooms={classrooms}
            selectedClassroom={selectedClassroom}
            onSelectClassroom={handleClassroomChange}
          />
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <ClassroomProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </ClassroomProvider>
  );
};

export default AppLayout;