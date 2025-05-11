
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StudentCard from './StudentCard';
import { Student } from '@/services/dashboard-data';
import { createRouterLogs } from '@/services/log-service';

// Mock student data
const mockStudent: Student = {
  id: 'student-1',
  name: 'Emma Thompson',
  ip_address: '192.168.1.101',
  headset_id: 'VR-102',
  avatar: '/placeholder.svg',
  classroom_id: 'classroom-1',
  metrics: {
    attention: 75,
    engagement: 82,
    completed_tasks: 8,
    task_success_rate: 75,
    interactionCounts: {
      blockGrabs: 24,
      menuInteractions: 18
    },
    interaction_rate: 65,
    move_distance: 120.5,
    activityHistory: [
      { time: Date.now() - 10000, value: 75 },
      { time: Date.now() - 20000, value: 80 },
      { time: Date.now() - 30000, value: 65 }
    ],
    focusAreas: [
      { id: 'focus-1', name: 'Area 1', percentage: 70 },
      { id: 'focus-2', name: 'Area 2', percentage: 30 }
    ],
    handPreference: 'right'
  }
};

// Generate a random router log for testing
const generateTestLog = (ip: string, logType: string) => {
  return {
    source_ip: ip,
    log_type: logType,
    content: { 
      buttonName: logType === 'HelpRequest' ? 'Help' : `Test ${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString()
    },
    time_seconds: 0
  };
};

// Demo component with test buttons
const StudentCardDemo = () => {
  const [student] = useState(mockStudent);
  
  const triggerTestEvent = async (logType: string) => {
    // Create a test router log for this student
    await createRouterLogs(generateTestLog(student.ip_address, logType));
  };
  
  const handleCardClick = useCallback(() => {
    console.log('Card clicked');
  }, []);
  
  return (
    <div className="space-y-4 max-w-sm">
      <h2 className="text-lg font-semibold">StudentCard Preview</h2>
      
      <StudentCard 
        student={student} 
        onClick={handleCardClick} 
      />
      
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Test Controls</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => triggerTestEvent('MenuButtonPress')} 
            className="w-full"
          >
            Simulate Interaction
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => triggerTestEvent('PortAdded')} 
            className="w-full"
          >
            Simulate Port Added (+20%)
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => triggerTestEvent('HelpRequest')} 
            className="w-full"
          >
            Simulate Help Request
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default StudentCardDemo;
