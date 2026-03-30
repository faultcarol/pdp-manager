# PDP Manager - AI Coding Guidelines

## Architecture Overview
- **Backend**: Flask REST API with SQLAlchemy ORM and SQLite database
- **Frontend**: Single-page vanilla JavaScript app (no framework)
- **Database**: Auto-created SQLite file (`instance/pdp.db`) on first run
- **Key Models**: Student, Course, Enrollment (junction), Attendance, Certificate
- **Relationships**: Students enroll in Courses; Enrollments have Attendance records and optional Certificates

## Core Patterns
- **API Responses**: All endpoints return JSON; errors use `{"error": "message"}` format
- **Date Handling**: Use `_parse_date()` helper for ISO date strings; store as `date` objects
- **Uniqueness**: Student emails unique; enrollments unique per student-course; certificates unique per enrollment; attendance unique per enrollment-session
- **Bulk Operations**: Attendance marking via `POST /api/attendance/bulk` with `{course_id, session_date, records: [{student_id, status}]}` (status: present/absent/late)
- **Certificate Numbers**: Auto-generated as `PDP-YYYYMMDD-<8char_hex>` on issue

## Development Workflow
- **Setup**: `python -m venv venv; venv\Scripts\activate; pip install -r requirements.txt`
- **Run**: `python app.py` (starts on port 5001 with debug=True)
- **Database**: No migrations needed; `db.create_all()` runs automatically
- **Add Features**: New routes in `app.py`, models in `models.py`, UI in `templates/index.html` + `static/js/app.js`

## Code Conventions
- **Models**: Include `to_dict()` methods for serialization; use relationships with cascade deletes
- **Routes**: Validate inputs, check existence with `db.session.get()`, strip strings, commit transactions
- **Frontend**: Use `api()` helper for fetch calls; sections loaded via `loadSection()` switch
- **Errors**: Use `_error(msg, status)` helper; check foreign keys before operations
- **Stats**: Dashboard counts from simple `Model.query.count()` calls

## Common Tasks
- **New Entity**: Add model in `models.py`, CRUD routes in `app.py`, UI section in HTML/JS
- **Modify Schema**: Update model fields; restart app (SQLite handles schema changes automatically)
- **Add Validation**: Check required fields, uniqueness, foreign key existence in route handlers
- **Update UI**: Modify `index.html` structure, add event handlers in `app.js`, style in `style.css`