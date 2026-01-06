# Call Me Reminder

A full-stack reminder application that makes automated phone calls using Vapi Voice AI. Users can schedule reminders, and the system will automatically call them at the specified time with a personalized message.

## Features

- Schedule reminders with custom messages
- Automated phone calls via Vapi Voice AI integration
- Filter and search reminders by status
- Pagination support for large reminder lists
- Real-time status tracking (scheduled, completed, failed)
- JWT-based authentication
- Responsive dashboard UI

## Tech Stack

**Frontend:**

- Next.js 16
- React 19
- TypeScript
- TailwindCSS
- TanStack Query (React Query)
- Radix UI Components

**Backend:**

- FastAPI (Python)
- SQLAlchemy ORM
- SQLite database
- APScheduler for task scheduling
- Vapi Voice AI for phone calls
- JWT authentication

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Vapi Account** - [Sign up at vapi.ai](https://vapi.ai)
- **Twilio Account** (if using your own phone number with Vapi)

## Environment Variables

### Backend (.env)

The backend requires the following environment variables. See [backend/.env.example](backend/.env.example) for a template.

**Required:**

- `VAPI_API_KEY` - Your Vapi API key from [vapi.ai/dashboard](https://vapi.ai/dashboard)
- `VAPI_PHONE_NUMBER_ID` - Phone number ID from your Vapi account
- `SECRET_KEY` - JWT secret key (generate with: `openssl rand -hex 32`)

**Optional (with defaults):**

- `DATABASE_URL` - Database connection string (default: `sqlite:///./data/app.db`)
- `CORS_ORIGINS` - Allowed origins for CORS (default: `["http://localhost:3000"]`)
- `SCHEDULER_POLL_INTERVAL_SECONDS` - How often to check for due reminders (default: `60`)

### Frontend (.env.local)

The frontend requires minimal configuration. See [frontend/.env.example](frontend/.env.example) for a template.

**Required:**

- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (default: `http://localhost:8000/api/v1`)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd call-me-reminder
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a Python virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy the example environment file
cp .env.example .env

# Edit .env and add your Vapi credentials
# Required: VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, SECRET_KEY
nano .env  # or use your preferred editor

# Run database migrations (if using Alembic)
alembic upgrade head

# The database will be automatically created on first run if using SQLite
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Copy the example environment file
cp .env.example .env.local

# Edit .env.local if needed (default should work for local development)
nano .env.local  # or use your preferred editor
```

### 4. Get Vapi Credentials

1. Sign up at [vapi.ai](https://vapi.ai)
2. Get your **API Key**:
   - Go to [Dashboard → API Keys](https://vapi.ai/dashboard)
   - Copy your API key
3. Get your **Phone Number ID**:
   - Go to [Dashboard → Phone Numbers](https://vapi.ai/dashboard/phone-numbers)
   - Purchase or configure a phone number
   - Copy the Phone Number ID
4. Add these values to `backend/.env`:

   ```bash
   VAPI_API_KEY=your_api_key_here
   VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
   ```

## Running the Application

### Start the Backend

```bash
# From the backend directory
cd backend

# Make sure virtual environment is activated
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate  # Windows

# Run the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

API documentation available at:

- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

### Start the Frontend

```bash
# From the frontend directory (in a new terminal)
cd frontend

# Run the Next.js development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## How Scheduling Works

The reminder system uses **APScheduler** to poll the database and trigger calls:

1. **Scheduler Initialization**: When the backend starts, APScheduler initializes and starts running ([main.py:21](backend/main.py#L21))

2. **Polling Interval**: Every 60 seconds (configurable via `SCHEDULER_POLL_INTERVAL_SECONDS`), the scheduler runs the `process_due_reminders` job ([app/jobs/daily_calls.py:67-73](backend/app/jobs/daily_calls.py#L67-L73))

3. **Finding Due Reminders**: The job queries the database for reminders where:
   - Status is `scheduled`
   - `date_time_utc` is less than or equal to the current time + polling interval ([app/jobs/daily_calls.py:23-28](backend/app/jobs/daily_calls.py#L23-L28))

4. **Making the Call**: For each due reminder, the system:
   - Calls Vapi's API to initiate a phone call ([app/services/vapi_service.py:34-55](backend/app/services/vapi_service.py#L34-L55))
   - Updates the reminder status to `completed` or `failed` ([app/jobs/daily_calls.py:46-51](backend/app/jobs/daily_calls.py#L46-L51))

5. **Call Content**: The Vapi assistant delivers the reminder message and can handle basic conversation ([app/services/vapi_service.py:40-54](backend/app/services/vapi_service.py#L40-L54))

## Testing the Call Workflow

### Quick Test Method

To quickly test if calls are working without waiting for scheduled time:

**Option 1: Create a Reminder 2 Minutes in the Future**

1. Start both backend and frontend
2. Log in to the dashboard at `http://localhost:3000`
3. Create a new reminder:
   - Title: "Test Reminder"
   - Message: "This is a test call"
   - Phone: Your phone number in E.164 format (e.g., `+1234567890`)
   - Date/Time: Set to 2 minutes from now
4. The scheduler will trigger the call within 60 seconds after the scheduled time
5. You should receive a call from your Vapi number

**Option 2: Manually Trigger a Test (Direct API)**

Use the backend health check to verify it's running, then create a reminder via API:

```bash
# Create a test reminder (adjust the datetime to 2 minutes from now)
curl -X POST http://localhost:8000/api/v1/reminders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Call",
    "message": "This is a test reminder message",
    "phone_number": "+1234567890",
    "date_time_utc": "2026-01-06T17:30:00Z"
  }'
```

**Option 3: Reduce Polling Interval for Testing**

For faster testing during development:

1. Edit `backend/.env`:

   ```bash
   SCHEDULER_POLL_INTERVAL_SECONDS=10
   ```

2. Restart the backend
3. Create reminders 30 seconds in the future
4. The scheduler will check every 10 seconds instead of 60

### Verifying the Call Worked

1. **Check Backend Logs**: You'll see logs like:

   ```
   INFO - Found 1 due reminders to process
   INFO - Processing reminder 123
   INFO - Vapi call created: call_abc123xyz
   INFO - Call initiated for reminder 123
   ```

2. **Check Reminder Status**: In the dashboard, the reminder status will change from `scheduled` to `completed` (or `failed` if there was an error)

3. **Vapi Dashboard**: View call logs at [vapi.ai/dashboard/calls](https://vapi.ai/dashboard/calls)

### Loom Video

The loom video showcasing a demo of this application can be seen [here](https://www.loom.com/share/8d1f2580f4ab46849ac82f9ded1bd6e4)
