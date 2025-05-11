
# Lenovo VRX Didactic Toolkit

A web-based teacher dashboard that monitors students' VR headsets in real-time.

## Features

- Real-time monitoring of student activity in VR
- Visual indicators for student attention and engagement
- Notification system for when students need help
- Activity timeline with sparkline visualization
- Predictive status indicators based on interaction patterns

## Components

### StudentCard

The StudentCard component displays real-time student activity with:

- Student profile information (name, headset ID, IP)
- Real-time interaction sparkline (last 2 minutes)
- Predictive status badge (Active, Hesitant, Persistent, Struggling, Idle)
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

### InteractionSparkline

The InteractionSparkline component shows real-time activity as a sparkline graph:

- Real-time updates from Supabase router_logs table
- Animated transitions for new data points
- Configurable time window (default: 120 seconds)
- Automatic status calculations
- Inactivity detection and timer

#### Usage

```jsx
import InteractionSparkline from "@/components/dashboard/InteractionSparkline";

// In your component
<InteractionSparkline 
  sourceIp={ipAddress} 
  windowSize={120} // 2 minutes
  height={36} // Optional: adjust height
  className="my-custom-class" // Optional: additional styling
/>
```

## Performance Tips

- Components use React.memo to prevent unnecessary re-renders
- SVG rendering is optimized for performance
- Subscriptions are properly cleaned up on component unmount
- For large classrooms, consider:
  - Using react-window for virtualized list rendering
  - Implementing pagination or filtering to limit displayed students
  - Adjusting windowSize to a smaller value (60s instead of 120s)

## Development

### Running Storybook

```
npm run storybook
```

The StudentCard storybook includes an interactive "Simulate Interaction" button to test real-time functionality without needing actual VR headsets.
