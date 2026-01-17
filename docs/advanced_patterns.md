# Advanced Scheduler Patterns

This document describes the scheduler implementation patterns used for reliable, horizontally-scalable reminder processing.

## Overview

The scheduler processes due reminders and triggers Vapi calls. It's designed to be safe for multi-server deployments with the following guarantees:

- **No duplicate calls**: Each reminder is processed exactly once
- **Automatic retries**: Failed reminders are retried with exponential backoff
- **Fault tolerance**: Server crashes don't leave reminders in limbo

## Database-Level Locking

### Problem

Without locking, multiple servers polling the database simultaneously can pick up the same reminder:

```
Server A: SELECT * FROM reminders WHERE status='scheduled' → finds Reminder #1
Server B: SELECT * FROM reminders WHERE status='scheduled' → also finds Reminder #1
Server A: Calls Vapi, updates status to 'completed'
Server B: Calls Vapi AGAIN, updates status to 'completed'
Result: User receives duplicate phone calls
```

### Solution: Optimistic Locking with UPDATE ... WHERE

We use an atomic `UPDATE ... WHERE` pattern to claim reminders:

```python
# From backend/app/jobs/daily_calls.py

def acquire_reminder_for_processing(db, reminder_id: int) -> Reminder | None:
    stmt = (
        update(Reminder)
        .where(
            and_(
                Reminder.id == reminder_id,
                Reminder.status.in_(['scheduled', 'pending_retry'])
            )
        )
        .values(status='processing')
        .returning(Reminder.id)
    )

    result = db.execute(stmt)
    db.commit()

    claimed = result.fetchone()
    if claimed:
        return db.get(Reminder, reminder_id)
    return None
```

**How it works:**

1. Server queries for due reminder IDs (lightweight SELECT)
2. For each ID, attempts atomic UPDATE to set `status = 'processing'`
3. UPDATE only succeeds if status is still `scheduled` or `pending_retry`
4. If another server already claimed it, UPDATE affects 0 rows
5. Only the server that successfully claimed it proceeds with processing

**Race condition resolution:**

```
Server A: UPDATE status='processing' WHERE id=1 AND status='scheduled' → 1 row affected (success)
Server B: UPDATE status='processing' WHERE id=1 AND status='scheduled' → 0 rows affected (skipped)
```

### Status State Machine

```
┌───────────┐
│ SCHEDULED │
└─────┬─────┘
      │ (acquired for processing)
      ▼
┌────────────┐
│ PROCESSING │
└─────┬──────┘
      │
      ├─── success ──────────────► COMPLETED
      │
      └─── failure
            │
            ├─── retries remaining ──► PENDING_RETRY ──► (back to PROCESSING)
            │
            └─── max retries hit ────► FAILED
```

## Retry Logic with Exponential Backoff

### Configuration

```python
# backend/app/config.py
RETRY_MAX_ATTEMPTS: int = 3
RETRY_BASE_DELAY_SECONDS: int = 60
```

### Database Fields

| Field | Type | Purpose |
|-------|------|---------|
| `attempt_count` | Integer | Number of attempts made |
| `max_attempts` | Integer | Maximum allowed attempts (default: 3) |
| `next_retry_at` | DateTime | When to retry next |
| `last_error` | Text | Most recent error message |

### Exponential Backoff Formula

```python
delay = base_delay_seconds * (2 ** attempt_count)
```

With default settings (`base_delay = 60s`):

| Attempt | Delay | Cumulative Wait |
|---------|-------|-----------------|
| 1 | 60s | 1 min |
| 2 | 120s | 3 min |
| 3 | 240s | 7 min |

### Implementation

```python
# From backend/app/models/reminder.py

def calculate_next_retry(self, base_delay_seconds: int = 60) -> datetime:
    delay = base_delay_seconds * (2 ** self.attempt_count)
    self.next_retry_at = datetime.utcnow() + timedelta(seconds=delay)
    return self.next_retry_at
```

### Failure Handling

```python
# From backend/app/jobs/daily_calls.py

def handle_reminder_failure(reminder: Reminder, error: str) -> None:
    reminder.last_error = error

    if reminder.attempt_count < reminder.max_attempts:
        # Schedule retry
        reminder.status = ReminderStatus.PENDING_RETRY.value
        reminder.calculate_next_retry(settings.RETRY_BASE_DELAY_SECONDS)
    else:
        # Permanently failed
        reminder.status = ReminderStatus.FAILED.value
        reminder.next_retry_at = None
```

## Idempotency Key Tracking

### Problem

Even with database locking, network issues can cause duplicate API calls:

1. Server sends Vapi request
2. Vapi processes the call successfully
3. Network timeout before response reaches server
4. Server retries, Vapi processes again
5. User gets duplicate calls

### Solution: Idempotency Keys

Each processing attempt generates a unique idempotency key:

```python
# From backend/app/models/reminder.py

def generate_idempotency_key(self) -> str:
    key = f"{self.id}-{self.attempt_count}-{uuid.uuid4().hex[:8]}"
    self.idempotency_key = key
    return key
```

**Key format:** `{reminder_id}-{attempt_count}-{random_suffix}`

Example: `42-1-a3f8c2b1`

### Database Fields

| Field | Type | Purpose |
|-------|------|---------|
| `idempotency_key` | String(64) | Unique key per attempt (unique index) |
| `vapi_call_id` | String(100) | External call ID from Vapi |

### Usage with Vapi

```python
# From backend/app/services/vapi_service.py

def make_reminder_call(self, ..., idempotency_key: str | None = None) -> dict:
    call_params = { ... }

    if idempotency_key:
        call_params["metadata"] = {"idempotency_key": idempotency_key}

    response = self.client.calls.create(**call_params)
    return {"success": True, "call_id": response.id}
```

### Benefits

1. **Internal deduplication**: Unique constraint on `idempotency_key` prevents duplicate DB records
2. **External deduplication**: Vapi can use metadata to identify duplicate requests
3. **Audit trail**: `vapi_call_id` links internal records to external API calls

## Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    process_due_reminders()                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Query due reminder IDs (SCHEDULED or PENDING_RETRY)         │
│     - SCHEDULED: date_time_utc <= now + poll_interval           │
│     - PENDING_RETRY: next_retry_at <= now                       │
│     - Limited by SCHEDULER_BATCH_SIZE                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. For each reminder ID:                                        │
│     - Attempt atomic UPDATE to claim (optimistic locking)        │
│     - Skip if already claimed by another server                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Process claimed reminder:                                    │
│     - Generate idempotency key                                   │
│     - Increment attempt_count                                    │
│     - Call Vapi with idempotency key                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Handle result:                                               │
│     - Success: status = COMPLETED, store vapi_call_id           │
│     - Failure + retries left: status = PENDING_RETRY            │
│     - Failure + no retries: status = FAILED                     │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Reference

| Setting | Default | Description |
|---------|---------|-------------|
| `SCHEDULER_POLL_INTERVAL_SECONDS` | 60 | How often to poll for due reminders |
| `SCHEDULER_BATCH_SIZE` | 10 | Max reminders to process per poll cycle |
| `RETRY_MAX_ATTEMPTS` | 3 | Maximum retry attempts before permanent failure |
| `RETRY_BASE_DELAY_SECONDS` | 60 | Base delay for exponential backoff |

## Database Migration

Apply the migration to add the new fields:

```bash
cd backend
alembic upgrade head
```

Migration file: `alembic/versions/a1b2c3d4e5f6_add_scheduler_retry_and_idempotency_.py`

## Monitoring Recommendations

### Key Metrics to Track

1. **Processing rate**: Reminders processed per minute
2. **Failure rate**: Percentage of reminders hitting FAILED status
3. **Retry rate**: Percentage of reminders requiring retries
4. **Lock contention**: How often servers skip already-claimed reminders

### Log Messages

| Level | Message | Meaning |
|-------|---------|---------|
| INFO | `Processing reminder {id} (attempt X/Y)` | Normal processing |
| INFO | `Call initiated for reminder {id}` | Successful Vapi call |
| WARNING | `Reminder {id} failed, scheduling retry` | Transient failure |
| ERROR | `Reminder {id} permanently failed` | Max retries exceeded |
| DEBUG | `Reminder {id} already being processed` | Lock contention (normal) |

## Limitations

1. **SQLite**: The current implementation works with SQLite but is optimized for PostgreSQL.

```

2. **Clock skew**: Servers should have synchronized clocks (NTP) for accurate scheduling.
