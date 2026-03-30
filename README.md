# PDP Manager

A web-based Professional Development Program records manager. Track students, courses, enrollments, attendance, and certificates from a single dashboard.

## Features

- **Students** — add and manage student profiles
- **Courses** — create courses with dates and session counts
- **Enrollments** — enroll students in courses
- **Attendance** — bulk-mark attendance per session (`present` / `absent` / `late`)
- **Certificates** — issue and revoke completion certificates with auto-generated numbers
- **Dashboard** — live counts across all entities

## Requirements

- Python 3.10+
- pip

No database server needed — uses SQLite (file created automatically on first run).

## First-time Setup

```bash
# 1. Clone or download the project, then enter the folder
cd pdp-manager

# 2. Create a virtual environment
python3 -m venv venv

# 3. Activate it
#    macOS / Linux:
source venv/bin/activate
#    Windows:
venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt
```

## Running the App

```bash
# Make sure the virtual environment is active (see step 3 above)
python app.py
```

Open your browser at **http://localhost:5000**.

The SQLite database (`instance/pdp.db`) is created automatically on first run — no migrations needed.

## Project Structure

```
pdp-manager/
├── app.py            # Flask routes & API
├── models.py         # SQLAlchemy models
├── requirements.txt  # Python dependencies
├── static/
│   ├── css/style.css
│   └── js/app.js
├── templates/
│   └── index.html    # Single-page frontend
└── instance/         # Auto-created; holds pdp.db (git-ignored)
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/students` | List / create students |
| GET/PUT/DELETE | `/api/students/<id>` | Get / update / delete student |
| GET/POST | `/api/courses` | List / create courses |
| GET/PUT/DELETE | `/api/courses/<id>` | Get / update / delete course |
| GET/POST | `/api/enrollments` | List / create enrollments |
| DELETE | `/api/enrollments/<id>` | Remove enrollment |
| GET | `/api/attendance?course_id=` | List attendance |
| POST | `/api/attendance/bulk` | Bulk mark attendance |
| GET/POST | `/api/certificates` | List / issue certificates |
| DELETE | `/api/certificates/<id>` | Revoke certificate |
| GET | `/api/stats` | Dashboard counts |
