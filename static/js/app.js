// ─── API Helpers ────────────────────────────────────────────────────────

const API = '/api';

async function api(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json', ...opts.headers },
        ...opts,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ─── Toast ──────────────────────────────────────────────────────────────

function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type} show`;
    setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── Navigation ─────────────────────────────────────────────────────────

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const section = link.dataset.section;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');
        loadSection(section);
    });
});

function loadSection(name) {
    switch (name) {
        case 'dashboard':   loadDashboard(); break;
        case 'courses':     loadCourses(); break;
        case 'students':    loadStudents(); break;
        case 'attendance':  loadAttendanceSetup(); break;
        case 'certificates': loadCertificates(); break;
    }
}

// ─── Modal Helpers ──────────────────────────────────────────────────────

function showModal(id) { document.getElementById(id).classList.add('open'); }
function hideModal(id) { document.getElementById(id).classList.remove('open'); }

// close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

// ─── Dashboard ──────────────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const stats = await api('/stats');
        document.getElementById('stat-students').textContent = stats.total_students;
        document.getElementById('stat-courses').textContent = stats.total_courses;
        document.getElementById('stat-enrollments').textContent = stats.total_enrollments;
        document.getElementById('stat-certificates').textContent = stats.total_certificates;
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ─── Courses ────────────────────────────────────────────────────────────

let coursesCache = [];

async function loadCourses() {
    try {
        coursesCache = await api('/courses');
        const tbody = document.getElementById('courses-table');
        tbody.innerHTML = coursesCache.length === 0
            ? '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">No courses yet. Click "+ Add Course" to get started.</td></tr>'
            : coursesCache.map(c => `
                <tr>
                    <td><strong>${esc(c.title)}</strong></td>
                    <td>${esc(c.instructor)}</td>
                    <td>${c.start_date}</td>
                    <td>${c.end_date}</td>
                    <td>${c.total_sessions}</td>
                    <td>${c.enrolled_count}</td>
                    <td class="action-btns">
                        <button class="btn-icon" title="Edit" onclick="editCourse(${c.id})">✏️</button>
                        <button class="btn-icon" title="Delete" onclick="deleteCourse(${c.id})">🗑️</button>
                    </td>
                </tr>`).join('');
    } catch (err) {
        toast(err.message, 'error');
    }
}

function editCourse(id) {
    const c = coursesCache.find(x => x.id === id);
    if (!c) return;
    document.getElementById('course-modal-title').textContent = 'Edit Course';
    document.getElementById('course-id').value = c.id;
    document.getElementById('course-title').value = c.title;
    document.getElementById('course-description').value = c.description;
    document.getElementById('course-instructor').value = c.instructor;
    document.getElementById('course-start').value = c.start_date;
    document.getElementById('course-end').value = c.end_date;
    document.getElementById('course-sessions').value = c.total_sessions;
    showModal('course-modal');
}

async function deleteCourse(id) {
    if (!confirm('Delete this course and all related data?')) return;
    try {
        await api(`/courses/${id}`, { method: 'DELETE' });
        toast('Course deleted');
        loadCourses();
    } catch (err) { toast(err.message, 'error'); }
}

async function submitCourse(e) {
    e.preventDefault();
    const id = document.getElementById('course-id').value;
    const body = {
        title: document.getElementById('course-title').value,
        description: document.getElementById('course-description').value,
        instructor: document.getElementById('course-instructor').value,
        start_date: document.getElementById('course-start').value,
        end_date: document.getElementById('course-end').value,
        total_sessions: document.getElementById('course-sessions').value || 1,
    };
    try {
        if (id) {
            await api(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            toast('Course updated');
        } else {
            await api('/courses', { method: 'POST', body: JSON.stringify(body) });
            toast('Course created');
        }
        hideModal('course-modal');
        document.getElementById('course-form').reset();
        document.getElementById('course-id').value = '';
        document.getElementById('course-modal-title').textContent = 'Add Course';
        loadCourses();
    } catch (err) { toast(err.message, 'error'); }
}

// ─── Students ───────────────────────────────────────────────────────────

let studentsCache = [];

async function loadStudents() {
    try {
        studentsCache = await api('/students');
        const tbody = document.getElementById('students-table');
        tbody.innerHTML = studentsCache.length === 0
            ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No students yet. Click "+ Add Student" to get started.</td></tr>'
            : studentsCache.map(s => `
                <tr>
                    <td><strong>${esc(s.name)}</strong></td>
                    <td>${esc(s.email)}</td>
                    <td>${esc(s.phone)}</td>
                    <td>${esc(s.department)}</td>
                    <td class="action-btns">
                        <button class="btn-icon" title="Edit" onclick="editStudent(${s.id})">✏️</button>
                        <button class="btn-icon" title="Delete" onclick="deleteStudent(${s.id})">🗑️</button>
                    </td>
                </tr>`).join('');
    } catch (err) {
        toast(err.message, 'error');
    }
}

function editStudent(id) {
    const s = studentsCache.find(x => x.id === id);
    if (!s) return;
    document.getElementById('student-modal-title').textContent = 'Edit Student';
    document.getElementById('student-id').value = s.id;
    document.getElementById('student-name').value = s.name;
    document.getElementById('student-email').value = s.email;
    document.getElementById('student-phone').value = s.phone;
    document.getElementById('student-department').value = s.department;
    showModal('student-modal');
}

async function deleteStudent(id) {
    if (!confirm('Delete this student and all related data?')) return;
    try {
        await api(`/students/${id}`, { method: 'DELETE' });
        toast('Student deleted');
        loadStudents();
    } catch (err) { toast(err.message, 'error'); }
}

async function submitStudent(e) {
    e.preventDefault();
    const id = document.getElementById('student-id').value;
    const body = {
        name: document.getElementById('student-name').value,
        email: document.getElementById('student-email').value,
        phone: document.getElementById('student-phone').value,
        department: document.getElementById('student-department').value,
    };
    try {
        if (id) {
            await api(`/students/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            toast('Student updated');
        } else {
            await api('/students', { method: 'POST', body: JSON.stringify(body) });
            toast('Student created');
        }
        hideModal('student-modal');
        document.getElementById('student-form').reset();
        document.getElementById('student-id').value = '';
        document.getElementById('student-modal-title').textContent = 'Add Student';
        loadStudents();
    } catch (err) { toast(err.message, 'error'); }
}

// ─── Attendance ─────────────────────────────────────────────────────────

let enrollmentsForAttendance = [];

async function loadAttendanceSetup() {
    try {
        const courses = await api('/courses');
        const sel = document.getElementById('att-course-select');
        sel.innerHTML = '<option value="">-- Select a Course --</option>' +
            courses.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('');
    } catch (err) { toast(err.message, 'error'); }
}

async function loadAttendancePage() {
    const courseId = document.getElementById('att-course-select').value;
    const sessionDate = document.getElementById('att-date').value;
    const tbody = document.getElementById('attendance-table');
    const enrollSection = document.getElementById('enrollment-actions');

    if (!courseId) {
        tbody.innerHTML = '';
        enrollSection.style.display = 'none';
        return;
    }

    enrollSection.style.display = 'block';
    // populate the enroll modal's course label
    const courseOpt = document.querySelector(`#att-course-select option[value="${courseId}"]`);
    document.getElementById('enroll-course-label').textContent = courseOpt ? courseOpt.textContent : '';

    try {
        enrollmentsForAttendance = await api(`/enrollments?course_id=${courseId}`);

        if (enrollmentsForAttendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px">No students enrolled. Enroll students first.</td></tr>';
            return;
        }

        // fetch existing attendance for this date
        let existingAtt = [];
        if (sessionDate) {
            existingAtt = await api(`/attendance?course_id=${courseId}&session_date=${sessionDate}`);
        }
        const attMap = {};
        existingAtt.forEach(a => { attMap[a.enrollment_id] = a.status; });

        tbody.innerHTML = enrollmentsForAttendance.map(en => {
            const status = attMap[en.id] || '';
            return `
                <tr data-student-id="${en.student_id}">
                    <td><strong>${esc(en.student_name)}</strong></td>
                    <td class="att-radio-group">
                        <input type="radio" name="att-${en.student_id}" value="present" ${status === 'present' ? 'checked' : ''}>
                    </td>
                    <td class="att-radio-group">
                        <input type="radio" name="att-${en.student_id}" value="late" ${status === 'late' ? 'checked' : ''}>
                    </td>
                    <td class="att-radio-group">
                        <input type="radio" name="att-${en.student_id}" value="absent" ${status === 'absent' ? 'checked' : ''}>
                    </td>
                </tr>`;
        }).join('');
    } catch (err) { toast(err.message, 'error'); }
}

async function saveAttendance() {
    const courseId = document.getElementById('att-course-select').value;
    const sessionDate = document.getElementById('att-date').value;
    if (!courseId || !sessionDate) {
        toast('Select a course and date first', 'error');
        return;
    }

    const records = [];
    enrollmentsForAttendance.forEach(en => {
        const radio = document.querySelector(`input[name="att-${en.student_id}"]:checked`);
        if (radio) {
            records.push({ student_id: en.student_id, status: radio.value });
        }
    });

    if (records.length === 0) {
        toast('Mark attendance for at least one student', 'error');
        return;
    }

    try {
        await api('/attendance/bulk', {
            method: 'POST',
            body: JSON.stringify({ course_id: parseInt(courseId), session_date: sessionDate, records }),
        });
        toast('Attendance saved');
    } catch (err) { toast(err.message, 'error'); }
}

// ─── Enrollment (from attendance page) ──────────────────────────────────

async function submitEnrollment(e) {
    e.preventDefault();
    const courseId = document.getElementById('att-course-select').value;
    const studentId = document.getElementById('enroll-student').value;
    if (!courseId || !studentId) { toast('Select a student', 'error'); return; }

    try {
        await api('/enrollments', {
            method: 'POST',
            body: JSON.stringify({ student_id: parseInt(studentId), course_id: parseInt(courseId) }),
        });
        toast('Student enrolled');
        hideModal('enroll-modal');
        loadAttendancePage();
    } catch (err) { toast(err.message, 'error'); }
}

// populate enroll modal's student dropdown when opened
const enrollObserver = new MutationObserver(() => {
    const overlay = document.getElementById('enroll-modal');
    if (overlay.classList.contains('open')) {
        populateEnrollStudents();
    }
});
enrollObserver.observe(document.getElementById('enroll-modal'), { attributes: true, attributeFilter: ['class'] });

async function populateEnrollStudents() {
    try {
        const students = await api('/students');
        const sel = document.getElementById('enroll-student');
        sel.innerHTML = '<option value="">-- Select Student --</option>' +
            students.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.email)})</option>`).join('');
    } catch (err) { toast(err.message, 'error'); }
}

// ─── Certificates ───────────────────────────────────────────────────────

async function loadCertificates() {
    try {
        const certs = await api('/certificates');
        const tbody = document.getElementById('certificates-table');
        tbody.innerHTML = certs.length === 0
            ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No certificates issued yet.</td></tr>'
            : certs.map(c => `
                <tr>
                    <td><span class="badge badge-success">${esc(c.certificate_number)}</span></td>
                    <td>${esc(c.student_name)}</td>
                    <td>${esc(c.course_title)}</td>
                    <td>${c.issue_date}</td>
                    <td class="action-btns">
                        <button class="btn btn-sm btn-outline" onclick="printCertificate(${c.id})">🖨️ Print</button>
                        <button class="btn-icon" title="Revoke" onclick="revokeCertificate(${c.id})">🗑️</button>
                    </td>
                </tr>`).join('');
    } catch (err) { toast(err.message, 'error'); }
}

async function revokeCertificate(id) {
    if (!confirm('Revoke this certificate?')) return;
    try {
        await api(`/certificates/${id}`, { method: 'DELETE' });
        toast('Certificate revoked');
        loadCertificates();
    } catch (err) { toast(err.message, 'error'); }
}

// Populate cert modal dropdowns
const certObserver = new MutationObserver(() => {
    const overlay = document.getElementById('cert-modal');
    if (overlay.classList.contains('open')) {
        populateCertCourses();
    }
});
certObserver.observe(document.getElementById('cert-modal'), { attributes: true, attributeFilter: ['class'] });

async function populateCertCourses() {
    try {
        const courses = await api('/courses');
        const sel = document.getElementById('cert-course');
        sel.innerHTML = '<option value="">-- Select Course --</option>' +
            courses.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('');
        document.getElementById('cert-enrollment').innerHTML = '<option value="">-- Select Student --</option>';
    } catch (err) { toast(err.message, 'error'); }
}

async function loadCertEnrollments() {
    const courseId = document.getElementById('cert-course').value;
    const sel = document.getElementById('cert-enrollment');
    if (!courseId) { sel.innerHTML = '<option value="">-- Select Student --</option>'; return; }
    try {
        const enrollments = await api(`/enrollments?course_id=${courseId}`);
        // filter out those who already have a certificate
        const eligible = enrollments.filter(e => !e.has_certificate);
        sel.innerHTML = '<option value="">-- Select Student --</option>' +
            eligible.map(e => `<option value="${e.id}">${esc(e.student_name)} (${e.attendance_pct}% attendance)</option>`).join('');
    } catch (err) { toast(err.message, 'error'); }
}

async function submitCertificate(e) {
    e.preventDefault();
    const enrollmentId = document.getElementById('cert-enrollment').value;
    const notes = document.getElementById('cert-notes').value;
    if (!enrollmentId) { toast('Select a student enrollment', 'error'); return; }
    try {
        await api('/certificates', {
            method: 'POST',
            body: JSON.stringify({ enrollment_id: parseInt(enrollmentId), notes }),
        });
        toast('Certificate issued');
        hideModal('cert-modal');
        document.getElementById('cert-form').reset();
        loadCertificates();
    } catch (err) { toast(err.message, 'error'); }
}

// ─── Print Certificate ──────────────────────────────────────────────────

function printCertificate(certId) {
    // find the cert in the table
    api(`/certificates`).then(certs => {
        const cert = certs.find(c => c.id === certId);
        if (!cert) { toast('Certificate not found', 'error'); return; }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head><title>Certificate - ${escHtml(cert.certificate_number)}</title>
<style>
    @page { size: landscape; margin: 0; }
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8f9fa; font-family: Georgia, 'Times New Roman', serif; }
    .cert { width: 900px; padding: 60px; border: 3px solid #1e293b; background: #fff; position: relative; text-align: center; }
    .cert::before { content: ''; position: absolute; inset: 12px; border: 1px solid #cbd5e1; }
    .cert h1 { font-size: 42px; color: #1e293b; margin-bottom: 8px; letter-spacing: 3px; }
    .cert .subtitle { font-size: 16px; color: #64748b; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 40px; }
    .cert .name { font-size: 32px; color: #4f46e5; border-bottom: 2px solid #4f46e5; display: inline-block; padding-bottom: 4px; margin: 16px 0; }
    .cert .course { font-size: 20px; margin: 12px 0; }
    .cert .details { font-size: 14px; color: #64748b; margin-top: 32px; }
    .cert .cert-no { font-size: 12px; color: #94a3b8; margin-top: 24px; }
    @media print { body { background: #fff; } }
</style>
</head>
<body>
    <div class="cert">
        <h1>CERTIFICATE</h1>
        <div class="subtitle">of Professional Development</div>
        <p>This is to certify that</p>
        <div class="name">${escHtml(cert.student_name)}</div>
        <p class="course">has successfully completed the course<br><strong>${escHtml(cert.course_title)}</strong></p>
        <div class="details">Issued on: ${cert.issue_date}</div>
        ${cert.notes ? `<div class="details">${escHtml(cert.notes)}</div>` : ''}
        <div class="cert-no">${escHtml(cert.certificate_number)}</div>
    </div>
    <script>window.onload = () => window.print();</script>
</body>
</html>`);
        printWindow.document.close();
    });
}

// ─── Utilities ──────────────────────────────────────────────────────────

function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escHtml(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Initial Load ───────────────────────────────────────────────────────

loadDashboard();
