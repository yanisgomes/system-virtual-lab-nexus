
# Lenovo VRX Didactic Toolkit

A web-based teacher dashboard that monitors students' VR headsets in real-time.

## Features

- Real-time monitoring of student activity in VR
- Visual indicators for student attention and engagement
- Notification system for when students need help
- Activity beacon with visual feedback on interactions
- Predictive status indicators based on interaction patterns

## Components

### StudentCard

The StudentCard component displays real-time student activity with:

- Student profile information (name, headset ID, IP)
- Real-time activity beacon (green for active, grey for idle, red for help)
- Predictive status badge (Active, Hesitant, Persistent, Struggling, Idle)
- Task progress bar that fills as students interact with the VR environment
- Inactivity timer when no events received for 10+ seconds
- Task completion statistics

#### Usage

```jsx
import StudentCard from "@/components/dashboard/StudentCard";

// In your component
<StudentCard 
  student={studentData} 
  onClick={handleStudentSelect} 
/>
```

### ActivityBeacon

The ActivityBeacon component shows real-time connection state as a small LED indicator:

- Green pulsing beacon for active students with concentric circles on new interactions
- Grey beacon for idle students (no interactions for 3+ minutes)
- Red beacon for students who have requested help
- Respects user preferences for reduced motion

#### Usage

```jsx
import ActivityBeacon from "@/components/dashboard/ActivityBeacon";

// In your component
<ActivityBeacon
  lastInteractionTime={lastActivityTime}
  helpRequested={helpRequested}
  onHelpAcknowledged={acknowledgeHelp}
  className="your-custom-class"
/>
```

### TaskProgressBar

The TaskProgressBar component visually represents task completion progress:

- Increments by 5% for standard interactions
- Increments by 20% for PortAdded events
- Animated transitions for smooth updates
- Success flash when reaching 100%
- Auto-resets after completion

#### Usage

```jsx
import TaskProgressBar from "@/components/dashboard/TaskProgressBar";

// In your component
<TaskProgressBar
  progress={taskProgress}
  onComplete={handleTaskComplete}
  className="your-custom-class"
/>
```

### StatusBadge

The StatusBadge component displays a color-coded indicator of student status:

- Active (green): 2+ events in last 10s
- Hesitant (amber): 1-3 events in last 60s with 20s+ gaps
- Persistent (blue): Steady low-rate activity
- Struggling (red): Help requested or frequent errors
- Idle (grey): No activity for 3+ minutes

#### Usage

```jsx
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useStudentActivity } from "@/hooks/use-student-activity";

// In your component
const { status } = useStudentActivity(studentIpAddress);

<StatusBadge status={status} />
```

## Performance Tips

- Components use React.memo to prevent unnecessary re-renders
- Animations are optimized for performance
- Subscriptions are properly cleaned up on component unmount
- For large classrooms, consider:
  - Using react-window for virtualized list rendering
  - Implementing pagination or filtering to limit displayed students
  - Reducing the update frequency of status evaluations

## Development

### Manual Testing

The StudentCardDemo component provides interactive controls to test real-time functionality:

```jsx
import StudentCardDemo from "@/components/dashboard/StudentCardDemo";

// In your component
<StudentCardDemo />
```

This includes buttons to simulate:
- Standard interactions
- Port added events (larger progress increments)
- Help requests (triggers red beacon)
