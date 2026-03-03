# Desktop Examination System (Electron)

A practical, lightweight examination system designed for the Fletter desktop application (Electron). Optimized for classroom and lab environments with minimal complexity.

## Features

### Core Exam Management
- **Multi-tenant Architecture**: College-level isolation with secure data separation
- **Flexible Scheduling**: Schedule exams with timezone support
- **Multiple Attempt Support**: Configure retry policies
- **Draft/Publish Workflow**: Review exams before making them live

### Question Types
1. **Multiple Choice (MCQ)**: Single/Multiple correct answers with shuffle options
2. **True/False**: Binary choice questions
3. **Short Answer**: Text-based responses with auto-grading
4. **Essay**: Long-form responses requiring manual grading
5. **Coding**: Programming questions with test case validation
6. **Fill in the Blanks**: Text completion questions
7. **Matching**: Pair association questions

### Advanced Question Features
- **Media Attachments**: Support images, videos, and documents
- **Question Hints**: Contextual hints for students
- **Explanations**: Post-submission explanations for learning
- **Difficulty Levels**: Tag questions as easy, medium, or hard
- **Tags/Topics**: Organize questions by subject matter
- **Negative Marking**: Penalty for incorrect answers

### Proctoring & Security (Desktop-Optimized)
- **Fullscreen Mode**: Require fullscreen in Electron app
- **Window Management**: Prevent minimize, resize, always-on-top
- **Tab Switch Detection**: Monitor application focus changes
- **Input Restrictions**: Block copy/paste, right-click, DevTools
- **Print Screen Blocking**: Prevent screen capture
- **IP Restrictions**: Toggle-able IP-based access control
- **Idle Detection**: Warn/submit after inactivity
- **Auto-Save**: Automatic answer saving every 30 seconds

### Live Monitoring Panel
- **Real-time Dashboard**: Monitor all active students
- **Connection Status**: Online/offline/disconnected indicators
- **Progress Tracking**: Questions answered, completion percentage
- **Time Tracking**: Time spent and remaining per student
- **Activity Log**: Tab switches, warnings, submissions
- **Proctor Actions**:
  - Send warnings to individual students
  - Extend time for specific students
  - Pause/resume all exams
  - Broadcast messages to all students
  - Force submit student exams
  - Remove students from exam
- **IP Management**: View and manage allowed/blocked IPs

### Live Exam Settings (Real-time)
Settings that can be changed during an active exam:
- **Pause/Resume**: Pause all exams with custom message
- **Time Extension**: Add time to all active attempts
- **Broadcast Messages**: Send messages to all students
- **Early Submit Control**: Allow/prevent early submission
- **Time Warnings**: Configure warning thresholds
- **Student Access**: Disable specific students from continuing

### Analytics & Reporting
- **Performance Analytics**: Question-level difficulty analysis
- **Score Distribution**: Visualize grade distributions
- **Time Analysis**: Track time spent per question
- **Leaderboards**: Gamification with ranked results
- **Pass/Fail Statistics**: Overall performance metrics

### Import/Export
- **Bulk Import**: Import questions from JSON, CSV
- **Export Results**: Download results in multiple formats
- **Question Banks**: Reuse questions across exams

## API Endpoints

### Desktop Exam Management
```
POST   /api/v1/examination/desktop/exams              # Create exam
GET    /api/v1/examination/desktop/exams              # List exams
GET    /api/v1/examination/desktop/exams/{id}         # Get exam details
PATCH  /api/v1/examination/desktop/exams/{id}/settings  # Update proctoring/IP settings
```

### Live Monitoring
```
GET    /api/v1/examination/desktop/exams/{id}/live-monitoring    # Get monitoring snapshot
POST   /api/v1/examination/desktop/exams/{id}/live-settings      # Update live settings
GET    /api/v1/examination/desktop/exams/{id}/live-settings      # Get live settings
POST   /api/v1/examination/desktop/exams/{id}/proctor-actions    # Execute proctor action
```

### IP Management
```
POST   /api/v1/examination/desktop/exams/{id}/ip-restrictions    # Update IP restrictions
GET    /api/v1/examination/desktop/exams/{id}/ip-logs            # Get IP audit logs
```

### Exam Attempts
```
POST   /api/v1/examination/desktop/exams/{id}/start              # Start exam
POST   /api/v1/examination/desktop/attempts/{id}/events         # Report desktop events
```

### WebSocket (Real-time)
```
WS     /api/v1/examination/desktop/ws/exams/{id}/monitor         # Real-time monitoring
```

## Data Models

### Desktop Exam
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "exam_type": "mcq|coding|mixed",
  "status": "draft|scheduled|ongoing|completed|cancelled",
  "scheduled_at": "datetime",
  "scheduled_end_at": "datetime",
  "duration_minutes": "integer",
  "timezone": "string",
  "total_marks": "integer",
  "passing_marks": "integer",
  "max_attempts": "integer",
  "instructions": "string",
  "welcome_message": "string",
  "completion_message": "string",
  "shuffle_questions": "boolean",
  "shuffle_options": "boolean",
  "allow_navigation": "boolean",
  "allow_review": "boolean",
  "require_password": "boolean",
  "proctoring_enabled": "boolean",
  "proctoring_config": {
    "enabled": "boolean",
    "fullscreen_mandatory": "boolean",
    "prevent_minimize": "boolean",
    "prevent_resize": "boolean",
    "always_on_top": "boolean",
    "block_copy_paste": "boolean",
    "block_right_click": "boolean",
    "block_dev_tools": "boolean",
    "block_print_screen": "boolean",
    "tab_switch_limit": "integer",
    "tab_switch_action": "warn|block|submit",
    "detect_window_blur": "boolean",
    "auto_save_interval_seconds": "integer",
    "idle_timeout_seconds": "integer",
    "idle_action": "warn|submit"
  },
  "ip_restrictions": {
    "enabled": "boolean",
    "allowed_ips": ["string"],
    "allowed_ranges": ["string"],
    "blocked_ips": ["string"],
    "allow_localhost": "boolean"
  }
}
```

### Live Monitoring Snapshot
```json
{
  "exam_id": "uuid",
  "exam_title": "string",
  "generated_at": "datetime",
  "total_students": "integer",
  "active_students": "integer",
  "submitted_students": "integer",
  "disconnected_students": "integer",
  "avg_time_remaining_minutes": "float",
  "min_time_remaining_minutes": "float",
  "total_tab_switches": "integer",
  "total_warnings_issued": "integer",
  "current_settings": {
    "is_paused": "boolean",
    "pause_message": "string",
    "extend_time_minutes": "integer",
    "broadcast_message": "string",
    "allow_early_submit": "boolean",
    "show_time_warning_at_minutes": "integer"
  },
  "students": [{
    "student_id": "uuid",
    "student_name": "string",
    "student_email": "string",
    "is_online": "boolean",
    "status": "in_progress|submitted|paused|disconnected",
    "questions_answered": "integer",
    "total_questions": "integer",
    "progress_percentage": "float",
    "time_spent_minutes": "float",
    "time_remaining_minutes": "float",
    "tab_switch_count": "integer",
    "warning_count": "integer",
    "ip_address": "string",
    "is_ip_allowed": "boolean"
  }]
}
```

## Testing

Run the comprehensive curl test suite:

```bash
# Set the API URL
export API_URL=http://localhost:8000

# Run all tests
./tests/test_examination_curl.sh
```

### Test Coverage
1. **Authentication**: Login for college_admin, faculty, student roles
2. **Exam CRUD**: Create, read, update exams
3. **Question Management**: All question types
4. **Live Monitoring**: Real-time dashboard tests
5. **IP Restrictions**: Access control tests
6. **Exam Attempts**: Start, events, submit
7. **Proctor Actions**: Warnings, time extensions, submissions
8. **Live Settings**: Pause, broadcast, time extensions

## Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/innertia

# Redis (for live settings and caching)
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Electron App
ELECTRON_APP_VERSION=1.0.0
ELECTRON_UPDATE_URL=https://updates.fletter.app
```

## IP Restrictions Setup

### Enabling IP Restrictions
1. Create exam with `ip_restrictions.enabled = true`
2. Add allowed IP addresses or ranges
3. Students can only access from approved IPs

### IP Configuration Example
```json
{
  "enabled": true,
  "allowed_ips": ["192.168.1.100", "192.168.1.101"],
  "allowed_ranges": ["192.168.1.0/24", "10.0.0.0/8"],
  "blocked_ips": ["192.168.1.200"],
  "allow_localhost": true
}
```

## Live Monitoring Usage

### Accessing the Monitoring Panel
1. Faculty/Admin navigates to exam
2. Click "Live Monitoring" button
3. Real-time dashboard displays all students

### Available Actions
- **Warning**: Send message to specific student
- **Extend Time**: Add minutes to student's exam
- **Force Submit**: End student's exam immediately
- **Kick**: Remove student from exam
- **Broadcast**: Send message to all students
- **Pause/Resume**: Control entire exam session

## Electron App Integration

### Starting an Exam
```javascript
// In Electron app
const response = await fetch(`${API_URL}/examination/desktop/exams/${examId}/start`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    platform: process.platform, // 'win32', 'darwin', 'linux'
    screen_resolution: `${screen.width}x${screen.height}`,
    app_version: app.getVersion()
  })
});
```

### Window Management
```javascript
// Enforce fullscreen in Electron
mainWindow.setFullScreen(true);
mainWindow.setAlwaysOnTop(true, 'screen-saver');
mainWindow.setMinimizable(false);
mainWindow.setMaximizable(false);
```

### Event Reporting
```javascript
// Report tab switch
await fetch(`${API_URL}/examination/desktop/attempts/${attemptId}/events?event_type=tab_switch`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Security Considerations

1. **Data Encryption**: All exam data encrypted in transit (HTTPS) and at rest
2. **Access Control**: Role-based permissions enforced at API level
3. **IP Whitelisting**: Optional network restrictions per exam
4. **Audit Logging**: All actions logged with timestamps
5. **Rate Limiting**: API endpoints protected against abuse
6. **Token Expiry**: JWT tokens expire after configured time

## Performance Optimization

- **Caching**: Redis cache for live settings and monitoring data
- **Database Indexing**: Optimized queries for large datasets
- **Pagination**: All list endpoints support pagination
- **Compression**: Response compression enabled
- **WebSocket**: Real-time updates without polling

## Deployment

### Docker
```bash
docker-compose up -d
```

### Requirements
- PostgreSQL 13+
- Redis 6+
- Node.js 18+ (for Electron app)

## Support & Documentation

- API Documentation: `/api/docs`
- ReDoc: `/api/redoc`
- OpenAPI Schema: `/api/openapi.json`
- WebSocket Events: See WebSocket section in API docs
