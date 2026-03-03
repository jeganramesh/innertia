# 🚀 PRODUCTION IMPLEMENTATION PROMPT: COMPREHENSIVE EXAMINATION & ASSESSMENT SYSTEM

## Objective

Implement a full‑featured examination and assessment management system for a multi‑college platform (Innertia) using **FastAPI**, **PostgreSQL**, **Redis**, and **Celery**, supporting both web (React) and mobile (Flutter) clients. The system must distinguish between **Exams** (strictly proctored with real‑time monitoring) and **Assessments** (simplified, low‑stakes quizzes). It must provide:

- College Admin: create/manage exams/assessments, configure proctoring rules, view aggregated progress (department, year, batch), adjudicate violations, generate reports.
- Faculty: create exams/assessments for their classes, monitor live student activity during exams, receive violation alerts, grade subjective answers, view class‑level analytics.
- Students: take exams under strict proctoring (fullscreen lock, tab‑switch detection, face monitoring, etc.), take lightweight assessments, view their own results and progress.
- Real‑time proctoring via WebSockets (violation detection, focus tracking).
- Celery for background processing (video frame analysis, report generation, notifications, scheduled exam start/end).
- Redis for caching active exam sessions, rate limiting, and as a message broker for Celery.
- All data scoped by college (multi‑tenant) and role‑based access.

---

## 📦 Database Schema (PostgreSQL)

All tables include:
- `id`: UUID primary key
- `college_id`: UUID foreign key to `colleges.id` (for multi‑tenant isolation)
- `created_at`, `updated_at`, `deleted_at` (soft delete)
- Audit logging via triggers or application‑level logging to `audit_logs`.

### Core Entities

#### `departments`
| Column       | Type         | Description                      |
|--------------|--------------|----------------------------------|
| name         | VARCHAR(100) | e.g., "Computer Science"         |
| code         | VARCHAR(20)  | unique within college            |
| is_active    | BOOLEAN      | default true                     |

#### `batches`
| Column        | Type         | Description                              |
|---------------|--------------|------------------------------------------|
| name          | VARCHAR(100) | e.g., "Batch 2024"                       |
| academic_year | VARCHAR(20)  | e.g., "2024‑2025"                        |
| start_date    | DATE         | optional                                 |
| end_date      | DATE         | optional                                 |
| is_active     | BOOLEAN      | default true                             |

#### `courses` (or `classes`)
| Column        | Type         | Description                              |
|---------------|--------------|------------------------------------------|
| name          | VARCHAR(100) | e.g., "Data Structures"                  |
| code          | VARCHAR(20)  | unique within college                    |
| department_id | UUID (FK)    |                                          |
| semester      | INTEGER      | optional                                  |
| credits       | INTEGER      | optional                                  |
| is_active     | BOOLEAN      | default true                             |

#### `users` (extended for students)
Add to existing `users` table:
| Column           | Type         | Description                              |
|------------------|--------------|------------------------------------------|
| department_id    | UUID (FK)    | nullable                                 |
| current_year     | INTEGER      | 1‑4                                      |
| section          | VARCHAR(10)  |                                          |
| batch_id         | UUID (FK)    | nullable                                 |
| register_number  | VARCHAR(50)  | unique within college                    |
| custom_fields    | JSONB        | college‑defined custom fields            |

### Examination & Assessment Templates

#### `exam_templates`
Defines reusable configurations for exams.
| Column                | Type         | Description                                      |
|-----------------------|--------------|--------------------------------------------------|
| name                  | VARCHAR(100) | e.g., "Midterm Strict"                           |
| description           | TEXT         |                                                  |
| duration_minutes      | INTEGER      |                                                  |
| total_marks           | INTEGER      |                                                  |
| passing_marks         | INTEGER      |                                                  |
| shuffle_questions     | BOOLEAN      |                                                  |
| shuffle_options       | BOOLEAN      |                                                  |
| allow_navigation      | BOOLEAN      | can student go back?                             |
| allow_review          | BOOLEAN      | can student review answers before submit?        |
| show_result_immediately | BOOLEAN    | after submission?                                |
| **proctoring_config** | JSONB        | violation thresholds, fullscreen mandatory, tab switch limit, face detection required, etc. |
| created_by            | UUID (FK)    |                                                  |

#### `assessments`
Simpler than exams; may have retakes, no strict proctoring.
| Column            | Type                        | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| title             | VARCHAR(255)                |                                          |
| description       | TEXT                        |                                          |
| course_id         | UUID (FK)                   | optional (if linked to a course)         |
| assessment_type   | ENUM('quiz','assignment','lab') |                                    |
| status            | ENUM('draft','published','closed') |                                |
| due_at            | TIMESTAMP                   |                                          |
| total_marks       | INTEGER                     |                                          |
| allow_retake      | BOOLEAN                     |                                          |
| max_attempts      | INTEGER (nullable)          | null = unlimited                         |
| shuffle_questions | BOOLEAN                     |                                          |
| created_by        | UUID (FK)                   |                                          |

#### `exams`
| Column            | Type                        | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| title             | VARCHAR(255)                |                                          |
| description       | TEXT                        |                                          |
| course_id         | UUID (FK)                   | optional                                 |
| exam_template_id  | UUID (FK)                   | inherits config, can override             |
| status            | ENUM('draft','scheduled','ongoing','completed','cancelled') |
| scheduled_at      | TIMESTAMP                   | when exam becomes available              |
| duration_minutes  | INTEGER                     |                                          |
| total_marks       | INTEGER                     |                                          |
| passing_marks     | INTEGER                     |                                          |
| is_immediate      | BOOLEAN                     | if true, starts on student click         |
| max_attempts      | INTEGER (default 1)         |                                          |
| instructions      | TEXT                        |                                          |
| proctoring_config | JSONB                       | override from template                   |
| created_by        | UUID (FK)                   |                                          |

#### `exam_questions`
| Column           | Type         | Description                                      |
|------------------|--------------|--------------------------------------------------|
| exam_id          | UUID (FK)    |                                                  |
| question_text    | TEXT         |                                                  |
| question_type    | ENUM('mcq','true_false','short_answer','essay','coding') |
| options          | JSONB        | for MCQ: array of { id, text, is_correct? } – correct flag may be separate for security |
| correct_answer   | TEXT         | for short answer (optional, for auto‑grading)   |
| marks            | INTEGER      |                                                  |
| negative_marks   | INTEGER      | optional, default 0                              |
| order_index      | INTEGER      |                                                  |
| section          | VARCHAR(100) | optional (for section‑wise timing)               |

#### `assessment_questions` (similar, but may have different grading rules)

### Attempts & Submissions

#### `exam_attempts`
Tracks each student's attempt of an exam.
| Column            | Type                        | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| exam_id           | UUID (FK)                   |                                          |
| student_id        | UUID (FK)                   |                                          |
| started_at        | TIMESTAMP                   |                                          |
| submitted_at      | TIMESTAMP (nullable)        |                                          |
| status            | ENUM('in_progress','submitted','auto_submitted','graded','terminated') |
| total_obtained    | INTEGER (nullable)          | after grading                            |
| graded_by         | UUID (FK) (nullable)        |                                          |
| graded_at         | TIMESTAMP (nullable)        |                                          |
| answers           | JSONB                       | { question_id: { answer, is_correct?, marks_obtained } } |
| device_fingerprint| TEXT                        | unique identifier of device              |
| ip_address        | INET                         |                                          |
| user_agent        | TEXT                         |                                          |
| violation_count   | INTEGER (default 0)          | cumulative                               |
| is_cheating       | BOOLEAN (default false)      | flagged by AI or faculty                 |
| proctoring_notes  | TEXT                         |                                          |

#### `assessment_attempts` (similar, but may not need device fingerprint etc.)

#### `violations`
| Column            | Type                        | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| exam_attempt_id   | UUID (FK)                   |                                          |
| timestamp         | TIMESTAMP                   |                                          |
| violation_type    | ENUM('tab_switch','fullscreen_exit','multiple_faces','face_not_visible','phone_detected','screenshot','copy_paste','idle_timeout') |
| severity          | ENUM('low','medium','high') |                                          |
| details           | JSONB                       | e.g., screenshot path, number of faces   |
| acknowledged      | BOOLEAN (default false)     | by faculty/admin                         |

#### `proctoring_snapshots`
Optional: store periodic snapshots during exam for later review.
| Column            | Type                        | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| exam_attempt_id   | UUID (FK)                   |                                          |
| timestamp         | TIMESTAMP                   |                                          |
| image_url         | TEXT                        | path to stored snapshot                  |
| face_data         | JSONB                       | optional (face encoding, bounding box)   |

### Live Monitoring

#### `live_monitoring_sessions`
Represents a faculty member actively monitoring an ongoing exam.
| Column            | Type                        | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| exam_id           | UUID (FK)                   |                                          |
| faculty_id        | UUID (FK)                   |                                          |
| started_at        | TIMESTAMP                   |                                          |
| ended_at          | TIMESTAMP (nullable)        |                                          |

#### `monitoring_events`
Real‑time events sent to faculty during monitoring (e.g., violation alert, student started/finished).
| Column            | Type                        | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| exam_id           | UUID (FK)                   |                                          |
| student_id        | UUID (FK)                   |                                          |
| event_type        | ENUM('violation','start','submit','pause','resume','auto_submit','terminate') |
| details           | JSONB                       |                                          |
| created_at        | TIMESTAMP                   |                                          |

### Analytics & Progress

#### `student_progress_snapshots`
Pre‑aggregated daily/weekly snapshots for performance.
| Column            | Type                        | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| student_id        | UUID (FK)                   |                                          |
| snapshot_date     | DATE                        |                                          |
| exams_taken       | INTEGER                     |                                          |
| avg_score         | FLOAT                       |                                          |
| total_violations  | INTEGER                     |                                          |
| department_id     | UUID (FK)                   | denormalized for department roll‑up      |
| batch_id          | UUID (FK)                   | denormalized                             |
| year              | INTEGER                     |                                          |
| data              | JSONB                       | additional metrics                       |

#### `department_progress` (similarly aggregated)

---

## 🔧 Backend API Design (FastAPI)

All endpoints are prefixed with `/api/v1`. Role‑based access via dependencies (`require_role`, `require_college_access`, `require_feature`). All responses are JSON.

### Module 1: Exam Administration (College Admin / Faculty)

- `GET /exams` – list exams (filter by status, course, date range, etc.)
- `POST /exams` – create exam (body includes all fields, plus optional `exam_template_id`)
- `GET /exams/{id}` – detailed view including questions
- `PATCH /exams/{id}` – update (if not started)
- `DELETE /exams/{id}` – soft delete (if no attempts)
- `POST /exams/{id}/publish` – change status to scheduled (validate questions, etc.)
- `POST /exams/{id}/cancel` – cancel scheduled exam
- `POST /exams/{id}/questions` – add question
- `PATCH /exams/questions/{question_id}` – update question
- `DELETE /exams/questions/{question_id}` – soft delete
- `GET /exams/{id}/attempts` – list all attempts (paginated, filtered)
- `GET /exams/{id}/results` – aggregated results (pass rate, average, histogram)

### Module 2: Assessment Administration (similar endpoints for assessments)

- `GET /assessments`
- `POST /assessments`
- `GET /assessments/{id}`
- `PATCH /assessments/{id}`
- `DELETE /assessments/{id}`
- `POST /assessments/{id}/publish`
- `GET /assessments/{id}/attempts`

### Module 3: Exam Taking (Student)

All these endpoints require a valid exam attempt context and enforce proctoring.

- `POST /exams/{id}/start` – initiate an exam attempt. Returns `attempt_id` and exam data (questions, duration). Validations: exam must be scheduled/ongoing, student eligible, max attempts not exceeded. Device fingerprint captured. Creates `exam_attempt` with status `in_progress`. If immediate exam, may start immediately.
- `POST /exams/attempts/{attempt_id}/submit` – final submission. Validates all questions answered? (depending on config), calculates score if auto‑gradable, updates status.
- `POST /exams/attempts/{attempt_id}/save` – auto‑save (every 30 seconds) – stores answers in Redis and periodically flushes to DB.
- `GET /exams/attempts/{attempt_id}/questions` – get questions for the attempt (shuffled according to config).
- `POST /exams/attempts/{attempt_id}/violation` – report a violation from client (e.g., tab switch detected). Logs violation, may trigger auto‑submit if threshold reached.
- `GET /exams/attempts/{attempt_id}/status` – get remaining time, violation count, etc.

### Module 4: Assessment Taking (Student)

- `POST /assessments/{id}/start`
- `POST /assessments/attempts/{attempt_id}/submit`
- `POST /assessments/attempts/{attempt_id}/save`
- `GET /assessments/attempts/{attempt_id}/questions`

### Module 5: Live Monitoring (Faculty)

- WebSocket endpoint `/ws/monitor/{exam_id}` – faculty connects to receive real‑time events (violations, student start/submit). Also can send commands (pause/terminate student attempt).
- `GET /monitor/exams/{id}/active-students` – list currently active students for an exam.
- `POST /monitor/exams/{id}/terminate-student/{student_id}` – force terminate student attempt.
- `GET /monitor/exams/{id}/violations` – get all violations for an exam (paginated).

### Module 6: Proctoring Engine (WebSocket for student)

- WebSocket endpoint `/ws/exam/{attempt_id}` – bidirectional communication during exam.
  - Student client sends periodic heartbeat, face detection events, screen capture (if enabled).
  - Server can send violation alerts, pause/resume commands.
  - Server processes incoming frames (offloaded to Celery for AI analysis) and returns results.
- Separate endpoint for uploading snapshots (HTTP POST with image) if WebSocket not suitable.

### Module 7: Analytics & Progress (College Admin / Faculty)

- `GET /analytics/department/{department_id}/progress` – aggregated metrics (exams taken, avg score, violation trends) over time.
- `GET /analytics/students` – list students with progress summary (filter by department, batch, year).
- `GET /analytics/students/{id}/detailed` – detailed attempt history.
- `GET /analytics/exams/{id}/heatmap` – question‑wise performance heatmap.

### Module 8: Violation Adjudication (College Admin)

- `GET /violations` – list all violations (filter by exam, student, severity, acknowledged)
- `PATCH /violations/{id}/acknowledge` – mark as reviewed.
- `POST /violations/bulk-acknowledge` – bulk action.

### Module 9: Configuration (College Admin)

- `GET /exam-templates` – list templates
- `POST /exam-templates` – create
- `PATCH /exam-templates/{id}` – update
- `DELETE /exam-templates/{id}` – soft delete
- `GET /proctoring-config/default` – get default config (used as base for templates)

---

## 🔄 Real‑Time & Background Processing

### WebSocket Architecture

- Use **FastAPI WebSocket** with **Redis Pub/Sub** for horizontal scaling.
- Student connects to `/ws/exam/{attempt_id}`:
  - Authenticate via token.
  - Join a Redis channel specific to that attempt.
  - Send messages (heartbeat, violation events, frame metadata).
  - Server processes messages, stores violations, and may publish to faculty monitoring channels.
- Faculty connects to `/ws/monitor/{exam_id}`:
  - Subscribe to Redis channel for that exam.
  - Receive aggregated events from all student attempts.
- Use **Celery** for heavy processing:
  - When a student sends a frame, server pushes to a Celery task `analyze_frame` that runs face detection, multiple person detection, etc., using OpenCV/AI models. Result (violation or OK) is sent back to student via WebSocket and logged.
  - Frame analysis may be asynchronous; client continues sending periodic frames while waiting for results.

### Celery Tasks

- **`analyze_frame`**: Accepts image bytes, attempt_id, timestamp. Returns detected issues (e.g., no face, multiple faces, phone detection). Updates violation count accordingly.
- **`auto_submit_on_threshold`**: Periodically checks exam attempts where violation count exceeds config; auto‑submits.
- **`send_exam_reminders`**: Sends notifications 15 min before scheduled exam.
- **`start_scheduled_exams`**: At scheduled time, changes exam status to ongoing.
- **`end_exam_when_time_expires`**: For each active exam attempt, check if duration exceeded; auto‑submit.
- **`generate_exam_report_pdf`**: After exam ends, generate PDF report and email to faculty.
- **`aggregate_student_progress`**: Nightly task to compute snapshots for analytics.
- **`cleanup_expired_sessions`**: Remove old WebSocket session data from Redis.

### Redis Usage

- **Cache active exam attempts** (key: `exam_attempt:{attempt_id}`) with TTL = exam duration + buffer. Stores current answers, remaining time, violation count for fast access.
- **Rate limiting** for violation reports.
- **Message broker** for Celery (using Redis).
- **Pub/Sub** for WebSocket events across multiple server instances.
- **Store temporary snapshots** (key: `snapshot:{attempt_id}:{timestamp}`) before persisting to DB.

---

## 🎨 Frontend Implementation (React/TypeScript)

### Folder Structure (following existing patterns)

```
src/modules/
├── college_admin/
│   ├── pages/
│   │   ├── ExamTemplatesPage.tsx
│   │   ├── ExamTemplateForm.tsx
│   │   ├── ExamsPage.tsx
│   │   ├── ExamForm.tsx
│   │   ├── ExamDetailPage.tsx
│   │   ├── AssessmentsPage.tsx
│   │   ├── AssessmentForm.tsx
│   │   ├── ViolationAdjudicationPage.tsx
│   │   ├── Analytics/
│   │   │   ├── DepartmentProgressPage.tsx
│   │   │   ├── StudentProgressPage.tsx
│   ├── components/
│   │   ├── ProctoringConfigEditor.tsx
│   │   ├── QuestionEditor.tsx
│   │   ├── ViolationTable.tsx
├── faculty/
│   ├── pages/
│   │   ├── FacultyExamsPage.tsx
│   │   ├── LiveMonitoringPage.tsx
│   │   ├── GradingPage.tsx
│   │   ├── AssessmentResultsPage.tsx
│   ├── components/
│   │   ├── MonitoringGrid.tsx
│   │   ├── StudentPreviewModal.tsx
├── student/
│   ├── pages/
│   │   ├── StudentExamsPage.tsx
│   │   ├── ExamTakingPage.tsx   (fullscreen enforced)
│   │   ├── AssessmentTakingPage.tsx
│   │   ├── ResultsPage.tsx
│   ├── components/
│   │   ├── ViolationWarningModal.tsx
│   │   ├── QuestionPalette.tsx
```

### Key Frontend Features

- **College Admin**:
  - Exam template builder with proctoring config (violation limits, fullscreen mandatory, face detection on/off, etc.)
  - Create/edit exams with drag‑drop question ordering, section timing.
  - View department/student progress with charts (Recharts).
  - Violation adjudication panel: see flagged attempts with evidence, mark as reviewed.
- **Faculty**:
  - Live monitoring grid: thumbnails of student screens (if enabled), real‑time violation alerts.
  - Click on student to view full details, pause/terminate exam.
  - Grade subjective answers.
  - View class‑level analytics.
- **Student**:
  - Exam taking interface: fullscreen mode, timer, question navigation, answer input, flagged questions.
  - Violation warnings: if client detects tab switch, show warning and count violation.
  - Auto‑save indicator.
  - Assessment taking: simpler interface, may allow retakes.

All UI follows Apple‑style aesthetic: large typography, generous whitespace, subtle shadows, monochrome with blue accent.

---

## 🛡️ Security & Edge Cases

- **Device fingerprinting**: Generate unique hash from browser/device attributes (canvas fingerprint, WebGL, etc.) to prevent multiple accounts from same device.
- **IP geofencing**: Restrict exams to certain IP ranges (if configured).
- **Question randomization**: Shuffle questions and options per student; store order in attempt.
- **Answer encryption**: Transmit answers over HTTPS; optionally encrypt sensitive data.
- **Screenshot prevention**: Disable print screen via JavaScript (as much as possible), warn on detection.
- **Offline handling**: Use localStorage as backup; auto‑resume on reconnection with conflict resolution.
- **Grace period**: Allow late submission within configurable window (e.g., 5 min after time expires).
- **Extended time accommodations**: For students with disabilities, store per‑student override.
- **Concurrent exam load**: Use Redis to track active attempts; database only for persistence.
- **Auto‑submit on browser close**: Detect beforeunload and submit.
- **Violation thresholds**: Configurable per exam: e.g., 3 tab switches → auto‑submit with penalty.
- **Proctoring AI fallback**: If AI service fails, fallback to manual review with all snapshots stored.
- **Data retention**: Snapshots and video streams stored for a limited time (configurable), then deleted.

---

## 📅 Implementation Phases

### Phase 1: Core Schema & Basic CRUD (Weeks 1‑2)
- Create database tables (departments, batches, courses, exam_templates, exams, assessments, questions).
- Implement FastAPI models, schemas, and CRUD endpoints for all core entities (no proctoring, no attempts yet).
- Basic authentication/authorization (roles: college_admin, faculty).
- Frontend: simple pages to list/create exams/assessments (no proctoring config).

### Phase 2: Exam Engine & Assessment Logic (Weeks 3‑4)
- Implement exam attempt flow (`/start`, `/submit`, `/save`) with basic validation.
- Implement assessment attempt flow.
- Add question shuffling, answer storage.
- Add auto‑grading for MCQ/true‑false.
- Frontend: student exam taking interface (basic, without proctoring).

### Phase 3: Proctoring & Real‑Time Features (Weeks 5‑7)
- Design WebSocket endpoints for student monitoring and faculty live view.
- Implement client‑side violation detection (tab switch, fullscreen exit) and report to server.
- Integrate Celery for frame analysis (face detection, multiple faces) using OpenCV or a pre‑trained model.
- Store snapshots and violations.
- Faculty live monitoring dashboard (grid view, alerts).
- Add proctoring configuration to exam templates.

### Phase 4: Analytics & Reporting (Weeks 8‑9)
- Implement Celery tasks for nightly aggregation of progress data.
- Create analytics endpoints (department, batch, student).
- Build frontend charts and reports.
- Add CSV/PDF export.

### Phase 5: Advanced Security & Edge Cases (Weeks 10‑11)
- Device fingerprinting.
- IP geofencing.
- Offline support with localStorage.
- Accommodations (extended time).
- Bulk upload of students/questions.
- Comprehensive testing (load testing with simulated concurrent users).
- Deployment configuration (Docker Compose with FastAPI, PostgreSQL, Redis, Celery workers, WebSocket server).

### Phase 6: Polish & Documentation (Week 12)
- API documentation (OpenAPI).
- User guides for each role.
- Final bug fixes, performance tuning.

---

## 🐳 Deployment Configuration

- **Docker Compose** with services:
  - `postgres`: PostgreSQL 16
  - `redis`: Redis 7
  - `api`: FastAPI app (multiple replicas behind nginx)
  - `celery_worker`: Celery worker for background tasks
  - `celery_beat`: Celery beat for scheduled tasks
  - `websocket`: Separate service for WebSocket (or same as API with ASGI)
  - `frontend`: Nginx serving React build
- Environment variables for database URLs, Redis URLs, secret keys, AI model paths, etc.
- Use **pgBouncer** for connection pooling if needed.

---

## 📝 Final Deliverables

- Fully functional examination and assessment system with strict proctoring.
