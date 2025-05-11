
# Chat System Documentation

This document explains the implementation of the teacher-student chat functionality in the Lenovo VRX Didactic Toolkit.

## Architecture Overview

The chat system consists of the following components:

1. **Frontend UI**: A React-based chat interface within the Student Detail Modal
2. **Database**: Supabase table for storing messages
3. **Realtime Updates**: Supabase realtime for instant message notifications
4. **UDP Bridge**: Python microservice that forwards messages to VR headsets

## Database Schema

Messages are stored in a `messages` table with the following structure:

```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  sender TEXT CHECK (sender IN ('teacher', 'student')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX messages_student_id_created_at_idx ON public.messages (student_id, created_at DESC);
```

## Python UDP Bridge Service

The Python bridge service listens to Supabase realtime for new teacher messages and forwards them to student headsets via UDP. 

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd vr-chat-bridge
   ```

2. Install dependencies:
   ```
   pip install python-dotenv supabase websockets
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=https://xdzoslgjemunetuztrfg.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   ```

### Running the Bridge Service

1. Start the service:
   ```
   python bridge.py
   ```

2. The service will log connection status and message forwarding activity.

### Implementation Details

The service uses the following Python code:

```python
import os
import json
import socket
import asyncio
from dotenv import load_dotenv
from supabase import create_client, SupabaseClient

load_dotenv()

# Supabase setup
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

# UDP socket setup
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

async def handle_message_insert(payload):
    """Process new message inserts from Supabase realtime"""
    try:
        record = payload["new"]
        
        # Only process teacher messages
        if record["sender"] != "teacher":
            return
            
        # Get student IP address from students table
        student = supabase.table("students").select("ip_address").eq("id", record["student_id"]).execute()
        if not student.data:
            print(f"Student not found: {record['student_id']}")
            return
            
        student_ip = student.data[0]["ip_address"]
        
        # Create message payload
        message_json = json.dumps({
            "type": "chat",
            "content": record["content"]
        })
        
        # Send via UDP to port 50000
        sock.sendto(message_json.encode(), (student_ip, 50000))
        print(f"Message sent to {student_ip}:50000 - {record['content']}")
        
    except Exception as e:
        print(f"Error handling message: {e}")

async def start_listener():
    """Start listening for realtime message inserts"""
    subscription = supabase.table("messages").on("INSERT", handle_message_insert).subscribe()
    
    print("Listening for new messages...")
    
    try:
        # Keep the listener running
        while True:
            await asyncio.sleep(1)
    except Exception as e:
        print(f"Error in listener: {e}")
    finally:
        subscription.unsubscribe()

if __name__ == "__main__":
    print("Starting VR Chat Bridge Service...")
    asyncio.run(start_listener())
```

## Testing

To verify the system is working properly:

1. Send a message from the teacher dashboard
2. Check the Python bridge service logs for successful message forwarding
3. Verify the VR headset receives and displays the message

## Troubleshooting

- **Messages not appearing in VR**: Check the bridge service logs and verify the student's IP address is correct
- **Bridge service not connecting**: Verify Supabase credentials and network connectivity
- **UDP packets not reaching headset**: Check for firewalls or network restrictions on UDP port 50000
