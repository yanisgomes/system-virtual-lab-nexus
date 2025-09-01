
import { useNavigate } from "react-router-dom";
import ClassroomDashboard from "@/components/dashboard/ClassroomDashboard";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useClassroom } from "@/contexts/ClassroomContext";

const Index = () => {
  const navigate = useNavigate();
  const { selectedClassroom } = useClassroom();

  return (
    <div className="relative">
      
      <Button
        onClick={() => navigate('/logs')}
        className="absolute top-4 right-4 z-10"
        variant="outline"
        size="sm"
      >
        <FileText className="h-4 w-4 mr-2" />
        Journaux
      </Button>
      {selectedClassroom && (
        <ClassroomDashboard classroomId={selectedClassroom} />
      )}
    </div>
  );
};

export default Index;
