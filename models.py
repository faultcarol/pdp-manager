from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date

db = SQLAlchemy()


class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    department = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    enrollments = db.relationship('Enrollment', back_populates='student', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone or '',
            'department': self.department or '',
            'created_at': self.created_at.isoformat(),
        }


class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    instructor = db.Column(db.String(100))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_sessions = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    enrollments = db.relationship('Enrollment', back_populates='course', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description or '',
            'instructor': self.instructor or '',
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'total_sessions': self.total_sessions,
            'created_at': self.created_at.isoformat(),
            'enrolled_count': len(self.enrollments),
        }


class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrolled_date = db.Column(db.Date, default=date.today)

    student = db.relationship('Student', back_populates='enrollments')
    course = db.relationship('Course', back_populates='enrollments')
    attendance_records = db.relationship('Attendance', back_populates='enrollment', cascade='all, delete-orphan')
    certificate = db.relationship('Certificate', back_populates='enrollment', uselist=False, cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('student_id', 'course_id', name='uq_student_course'),)

    def to_dict(self):
        attended = sum(1 for a in self.attendance_records if a.status == 'present')
        total = self.course.total_sessions
        return {
            'id': self.id,
            'student_id': self.student_id,
            'course_id': self.course_id,
            'student_name': self.student.name,
            'course_title': self.course.title,
            'enrolled_date': self.enrolled_date.isoformat(),
            'attended_sessions': attended,
            'total_sessions': total,
            'attendance_pct': round(attended / total * 100) if total > 0 else 0,
            'has_certificate': self.certificate is not None,
        }


class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollments.id'), nullable=False)
    session_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(10), nullable=False, default='absent')  # present, absent, late

    enrollment = db.relationship('Enrollment', back_populates='attendance_records')

    __table_args__ = (db.UniqueConstraint('enrollment_id', 'session_date', name='uq_enrollment_session'),)

    def to_dict(self):
        return {
            'id': self.id,
            'enrollment_id': self.enrollment_id,
            'student_name': self.enrollment.student.name,
            'course_title': self.enrollment.course.title,
            'session_date': self.session_date.isoformat(),
            'status': self.status,
        }


class Certificate(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.Integer, primary_key=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollments.id'), nullable=False, unique=True)
    certificate_number = db.Column(db.String(50), unique=True, nullable=False)
    issue_date = db.Column(db.Date, default=date.today)
    notes = db.Column(db.Text)

    enrollment = db.relationship('Enrollment', back_populates='certificate')

    def to_dict(self):
        return {
            'id': self.id,
            'enrollment_id': self.enrollment_id,
            'student_name': self.enrollment.student.name,
            'course_title': self.enrollment.course.title,
            'certificate_number': self.certificate_number,
            'issue_date': self.issue_date.isoformat(),
            'notes': self.notes or '',
        }
