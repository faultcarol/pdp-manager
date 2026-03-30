# Changelog

All notable changes to PDP Manager will be documented here.

## [Unreleased]

## [1.0.0] - 2026-03-17

### Added

**Students**
- Create, read, update, delete students (`/api/students`)
- Fields: name, email (unique), phone, department
- Duplicate email rejected with 400 error

**Courses**
- CRUD for courses (`/api/courses`)
- Fields: title, description, instructor, start_date, end_date, total_sessions
- Listed newest-first by start date
- `enrolled_count` included in response

**Enrollments**
- Enroll a student in a course (`POST /api/enrollments`)
- Duplicate enrollment rejected with 400 error
- Filter by `course_id` or `student_id` query params
- Response includes attended sessions, total sessions, attendance % and certificate status

**Attendance**
- Bulk mark attendance for a session (`POST /api/attendance/bulk`)
  - Body: `{ course_id, session_date, records: [{student_id, status}] }`
  - Status values: `present`, `absent`, `late` (invalid values default to `absent`)
  - Upserts — re-posting same student + date updates existing record
- List attendance filtered by `course_id` + optional `session_date`

**Certificates**
- Issue certificate for an enrollment (`POST /api/certificates`)
  - Auto-generates unique number: `PDP-YYYYMMDD-<8-char hex>`
  - Duplicate issue rejected with 400 error
- Revoke certificate (`DELETE /api/certificates/<id>`)
- List all certificates, newest-first by issue date

**Dashboard**
- `GET /api/stats` — counts of students, courses, enrollments, certificates

**Frontend**
- Single-page app with sidebar: Dashboard, Courses, Students, Attendance, Certificates
- Stack: Flask 3.1, Flask-SQLAlchemy 3.1.1, SQLite
