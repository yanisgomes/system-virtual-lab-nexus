
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import StudentCard from './StudentCard';
import { supabase } from '@/integrations/supabase/client';

// Mock student data
const mockStudent = {
  id: 'student-1',
  name: 'Emma Thompson',
  ip_address: '192.168.1.101',
  headset_id: 'VR-102',
  avatar: '/placeholder.svg',
  classroom_id: 'class-001',
  metrics: {
    attention: 75,
    engagement: 82,
    completed_tasks: 8,
    task_success_rate: 75,
    interaction_rate: 65,
    move_distance: 120,
    interactionCounts: {
      blockGrabs: 24,
      blockReleases: 18,
      menuInteractions: 18,
      menuTypes: {}
    },
    activityHistory: Array(24).fill(0).map((_, i) => ({
      time: Date.now() - (24 - i) * 5 * 60 * 1000,
      value: Math.floor(Math.random() * 100),
      timestamp: new Date(Date.now() - (24 - i) * 5 * 60 * 1000).toISOString()
    })),
    focusAreas: [
      { id: 'Building', name: 'Building', percentage: 45 },
      { id: 'Exploration', name: 'Exploration', percentage: 30 }
    ],
    handPreference: {
      leftHandUsage: 35,
      rightHandUsage: 65,
      totalHandActions: 100
    }
  }
};

const meta: Meta<typeof StudentCard> = {
  title: 'Dashboard/StudentCard/RealTime',
  component: StudentCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof StudentCard>;

// Generate a random router log for testing
const generateTestLog = (ip: string) => {
  return {
    source_ip: ip,
    log_type: 'MenuButtonPress',
    content: { 
      buttonName: `Test ${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString()
    },
    time_seconds: 0
  };
};

// Interactive story with test button
export const RealTimeCard: Story = {
  render: (args) => {
    const [student] = useState(mockStudent);
    
    const triggerTestEvent = async () => {
      // Create a test router log for this student
      await supabase
        .from('router_logs')
        .insert([generateTestLog(student.ip_address)]);
    };
    
    return (
      <div className="space-y-4 w-[300px]">
        <StudentCard 
          student={student} 
          onClick={() => console.log('Card clicked')} 
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerTestEvent} 
          className="w-full"
        >
          Simulate Interaction
        </Button>
      </div>
    );
  }
};

// Story showing multiple cards with different statuses
export const MultipleStudents: Story = {
  render: () => {
    const students = [
      { ...mockStudent, id: 'student-1', name: 'Emma Thompson', ip_address: '192.168.1.101' },
      { ...mockStudent, id: 'student-2', name: 'Michael Chen', ip_address: '192.168.1.102' },
      { ...mockStudent, id: 'student-3', name: 'Sofia Rodriguez', ip_address: '192.168.1.103' }
    ];
    
    return (
      <div className="grid grid-cols-3 gap-4">
        {students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            onClick={() => console.log(`${student.name} clicked`)}
          />
        ))}
      </div>
    );
  }
};
