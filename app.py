import os
import uuid
from datetime import date, datetime

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from models import Attendance, Certificate, Course, Enrollment, Student, db

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pdp.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()


# ─── Helpers ────────────────────────────────────────────────────────────────

def _parse_date(value):
    """Parse an ISO-format date string, returning a date object or None."""
    if not value:
        return None
    return date.fromisoformat(value)


def _error(msg, status=400):
    return jsonify({'error': msg}), status


# ─── Pages ──────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


# ─── Student CRUD ───────────────────────────────────────────────────────────

@app.route('/api/students', methods=['GET'])
def list_students():
    students = Student.query.order_by(Student.name).all()
    return jsonify([s.to_dict() for s in students])


@app.route('/api/students', methods=['POST'])
def create_student():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return _error('Name and email are required')
    if Student.query.filter_by(email=data['email']).first():
        return _error('A student with this email already exists')
    student = Student(
        name=data['name'].strip(),
        email=data['email'].strip(),
        phone=data.get('phone', '').strip(),
        department=data.get('department', '').strip(),
    )
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


@app.route('/api/students/<int:sid>', methods=['GET'])
def get_student(sid):
    student = db.session.get(Student, sid)
    if not student:
        return _error('Student not found', 404)
    return jsonify(student.to_dict())


@app.route('/api/students/<int:sid>', methods=['PUT'])
def update_student(sid):
    student = db.session.get(Student, sid)
    if not student:
        return _error('Student not found', 404)
    data = request.get_json()
    if data.get('name'):
        student.name = data['name'].strip()
    if data.get('email'):
        existing = Student.query.filter(Student.email == data['email'], Student.id != sid).first()
        if existing:
            return _error('A student with this email already exists')
        student.email = data['email'].strip()
    if 'phone' in data:
        student.phone = data['phone'].strip()
    if 'department' in data:
        student.department = data['department'].strip()
    db.session.commit()
    return jsonify(student.to_dict())


@app.route('/api/students/<int:sid>', methods=['DELETE'])
def delete_student(sid):
    student = db.session.get(Student, sid)
    if not student:
        return _error('Student not found', 404)
    db.session.delete(student)
    db.session.commit()
    return jsonify({'ok': True})


# ─── Course CRUD ────────────────────────────────────────────────────────────

@app.route('/api/courses', methods=['GET'])
def list_courses():
    courses = Course.query.order_by(Course.start_date.desc()).all()
    return jsonify([c.to_dict() for c in courses])


@app.route('/api/courses', methods=['POST'])
def create_course():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('start_date') or not data.get('end_date'):
        return _error('Title, start_date, and end_date are required')
    course = Course(
        title=data['title'].strip(),
        description=data.get('description', '').strip(),
        instructor=data.get('instructor', '').strip(),
        start_date=_parse_date(data['start_date']),
        end_date=_parse_date(data['end_date']),
        total_sessions=int(data.get('total_sessions', 1)),
    )
    db.session.add(course)
    db.session.commit()
    return jsonify(course.to_dict()), 201


@app.route('/api/courses/<int:cid>', methods=['GET'])
def get_course(cid):
    course = db.session.get(Course, cid)
    if not course:
        return _error('Course not found', 404)
    return jsonify(course.to_dict())


@app.route('/api/courses/<int:cid>', methods=['PUT'])
def update_course(cid):
    course = db.session.get(Course, cid)
    if not course:
        return _error('Course not found', 404)
    data = request.get_json()
    if data.get('title'):
        course.title = data['title'].strip()
    if 'description' in data:
        course.description = data['description'].strip()
    if 'instructor' in data:
        course.instructor = data['instructor'].strip()
    if data.get('start_date'):
        course.start_date = _parse_date(data['start_date'])
    if data.get('end_date'):
        course.end_date = _parse_date(data['end_date'])
    if data.get('total_sessions'):
        course.total_sessions = int(data['total_sessions'])
    db.session.commit()
    return jsonify(course.to_dict())


@app.route('/api/courses/<int:cid>', methods=['DELETE'])
def delete_course(cid):
    course = db.session.get(Course, cid)
    if not course:
        return _error('Course not found', 404)
    db.session.delete(course)
    db.session.commit()
    return jsonify({'ok': True})


# ─── Enrollment ─────────────────────────────────────────────────────────────

@app.route('/api/enrollments', methods=['GET'])
def list_enrollments():
    course_id = request.args.get('course_id', type=int)
    student_id = request.args.get('student_id', type=int)
    q = Enrollment.query
    if course_id:
        q = q.filter_by(course_id=course_id)
    if student_id:
        q = q.filter_by(student_id=student_id)
    return jsonify([e.to_dict() for e in q.all()])


@app.route('/api/enrollments', methods=['POST'])
def create_enrollment():
    data = request.get_json()
    if not data or not data.get('student_id') or not data.get('course_id'):
        return _error('student_id and course_id are required')
    if not db.session.get(Student, data['student_id']):
        return _error('Student not found', 404)
    if not db.session.get(Course, data['course_id']):
        return _error('Course not found', 404)
    existing = Enrollment.query.filter_by(
        student_id=data['student_id'], course_id=data['course_id']
    ).first()
    if existing:
        return _error('Student is already enrolled in this course')
    enrollment = Enrollment(
        student_id=data['student_id'],
        course_id=data['course_id'],
    )
    db.session.add(enrollment)
    db.session.commit()
    return jsonify(enrollment.to_dict()), 201


@app.route('/api/enrollments/<int:eid>', methods=['DELETE'])
def delete_enrollment(eid):
    enrollment = db.session.get(Enrollment, eid)
    if not enrollment:
        return _error('Enrollment not found', 404)
    db.session.delete(enrollment)
    db.session.commit()
    return jsonify({'ok': True})


# ─── Attendance ─────────────────────────────────────────────────────────────

@app.route('/api/attendance', methods=['GET'])
def list_attendance():
    course_id = request.args.get('course_id', type=int)
    session_date = request.args.get('session_date')
    if not course_id:
        return _error('course_id is required')
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    enrollment_ids = [e.id for e in enrollments]
    q = Attendance.query.filter(Attendance.enrollment_id.in_(enrollment_ids))
    if session_date:
        q = q.filter_by(session_date=_parse_date(session_date))
    return jsonify([a.to_dict() for a in q.all()])


@app.route('/api/attendance/bulk', methods=['POST'])
def bulk_attendance():
    """Mark attendance for multiple students in one request.

    Body: { course_id, session_date, records: [ {student_id, status}, ... ] }
    """
    data = request.get_json()
    if not data or not data.get('course_id') or not data.get('session_date') or not data.get('records'):
        return _error('course_id, session_date, and records are required')
    session_dt = _parse_date(data['session_date'])
    results = []
    for rec in data['records']:
        enrollment = Enrollment.query.filter_by(
            student_id=rec['student_id'], course_id=data['course_id']
        ).first()
        if not enrollment:
            continue
        status = rec.get('status', 'absent')
        if status not in ('present', 'absent', 'late'):
            status = 'absent'
        att = Attendance.query.filter_by(enrollment_id=enrollment.id, session_date=session_dt).first()
        if att:
            att.status = status
        else:
            att = Attendance(enrollment_id=enrollment.id, session_date=session_dt, status=status)
            db.session.add(att)
        results.append(att)
    db.session.commit()
    return jsonify([a.to_dict() for a in results])


# ─── Certificates ───────────────────────────────────────────────────────────

@app.route('/api/certificates', methods=['GET'])
def list_certificates():
    certs = Certificate.query.order_by(Certificate.issue_date.desc()).all()
    return jsonify([c.to_dict() for c in certs])


@app.route('/api/certificates', methods=['POST'])
def issue_certificate():
    data = request.get_json()
    if not data or not data.get('enrollment_id'):
        return _error('enrollment_id is required')
    enrollment = db.session.get(Enrollment, data['enrollment_id'])
    if not enrollment:
        return _error('Enrollment not found', 404)
    if enrollment.certificate:
        return _error('Certificate already issued for this enrollment')
    cert_number = f"PDP-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    cert = Certificate(
        enrollment_id=enrollment.id,
        certificate_number=cert_number,
        notes=data.get('notes', '').strip(),
    )
    db.session.add(cert)
    db.session.commit()
    return jsonify(cert.to_dict()), 201


@app.route('/api/certificates/<int:cert_id>', methods=['DELETE'])
def revoke_certificate(cert_id):
    cert = db.session.get(Certificate, cert_id)
    if not cert:
        return _error('Certificate not found', 404)
    db.session.delete(cert)
    db.session.commit()
    return jsonify({'ok': True})


# ─── Dashboard stats ────────────────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
def dashboard_stats():
    return jsonify({
        'total_students': Student.query.count(),
        'total_courses': Course.query.count(),
        'total_enrollments': Enrollment.query.count(),
        'total_certificates': Certificate.query.count(),
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001)
