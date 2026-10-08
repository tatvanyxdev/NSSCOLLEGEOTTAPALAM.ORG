import {
  Course,
  CourseCategory,
  CourseOffering,
  CourseGroup,
  Student,
  Faculty,
  FacultyCourseAssignment,
  StudentCourseRegistration,
  TimetablePeriod,
  TimetableEntry,
  ClassSession,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  Department,
  Programme,
  SpecialAttendanceEvent,
  SpecialAttendanceRecord
} from '../types';

export const mapCourseFromDb = (row: any): Course => ({
  id: row.id,
  courseCode: row.course_code || row.courseCode || '',
  courseTitle: row.course_title || row.courseTitle || '',
  departmentId: row.department_id || row.departmentId || '',
  categoryId: row.course_category_id || row.category_id || row.categoryId || '',
  credits: Number(row.credits) || 0,
  lectureHours: Number(row.lecture_hours || row.lectureHours) || 0,
  theoryHours: Number(row.theory_hours || row.theoryHours || row.lecture_hours || row.lectureHours) || 0,
  practicalHours: Number(row.practical_hours || row.practicalHours) || 0,
  description: row.description || '',
  isActive: row.is_active !== undefined ? row.is_active : row.isActive !== undefined ? row.isActive : true
});

export const mapCourseCategoryFromDb = (row: any): CourseCategory => ({
  id: row.id,
  name: row.name || '',
  code: row.code || '',
  description: row.description || '',
  isActive: row.is_active !== undefined ? row.is_active : row.isActive !== undefined ? row.isActive : true,
  colorHex: row.color_hex || row.colorHex || '#2563eb'
});

export const mapCourseOfferingFromDb = (row: any): CourseOffering => ({
  id: row.id,
  academicYear: row.academic_year || row.academicYear || '2026-27',
  semesterNumber: Number(row.semester_number || row.semesterNumber || 1),
  courseId: row.course_id || row.courseId || '',
  departmentId: row.department_id || row.departmentId || '',
  coordinatorFacultyId: row.coordinator_faculty_id || row.coordinatorFacultyId || undefined,
  expectedStrength: Number(row.expected_strength || row.expectedStrength) || 0,
  maxStrength: Number(row.max_strength || row.maxStrength) || 0,
  isActive: row.is_active !== undefined ? row.is_active : row.isActive !== undefined ? row.isActive : true
});

export const mapCourseGroupFromDb = (row: any): CourseGroup => ({
  id: row.id,
  courseOfferingId: row.course_offering_id || row.courseOfferingId || '',
  groupName: row.group_name || row.groupName || '',
  room: row.room || '',
  capacity: Number(row.capacity || row.maxCapacity) || 0,
  isActive: row.is_active !== undefined ? row.is_active : row.isActive !== undefined ? row.isActive : true
});

export const mapStudentFromDb = (row: any): Student => ({
  id: row.id,
  admissionNumber: row.admission_number || row.admissionNumber || '',
  universityRegisterNumber: row.university_register_number || row.universityRegisterNumber || '',
  rollNumber: row.roll_number || row.rollNumber || '',
  fullName: row.full_name || row.fullName || '',
  username: row.username || '',
  password: row.password || row.password_hash || '',
  email: row.email || '',
  phoneNumber: row.mobile_number || row.phone_number || row.phoneNumber || row.phone || '',
  phone: row.mobile_number || row.phone || row.phone_number || row.phoneNumber || '',
  mobileNumber: row.mobile_number || row.phoneNumber || row.phone || '',
  homeDepartmentId: row.home_department_id || row.homeDepartmentId || '',
  programmeId: row.programme_id || row.programmeId || '',
  admissionBatch: row.admission_batch || row.admissionBatch || '',
  currentSemester: Number(row.current_semester || row.currentSemester) || 1,
  yearOfStudy: Number(row.year_of_study || row.yearOfStudy) || Math.ceil((Number(row.current_semester || row.currentSemester) || 1) / 2),
  profilePhotoUrl: row.profile_photo_url || row.profilePhotoUrl || '',
  bloodGroup: row.blood_group || row.bloodGroup || '',
  guardianName: row.guardian_name || row.guardianName || row.parent_name || '',
  guardianPhone: row.guardian_phone || row.guardianPhone || row.parent_phone || '',
  status: row.status || 'ACTIVE',
  isActive: row.is_active !== undefined ? row.is_active : true,
  createdAt: row.created_at || row.createdAt || new Date().toISOString()
});

export const mapFacultyFromDb = (row: any): Faculty => ({
  id: row.id,
  employeeId: row.employee_id || row.employee_code || row.employeeId || row.pen_number || '',
  fullName: row.full_name || row.fullName || '',
  email: row.email || '',
  phoneNumber: row.phone || row.mobile_number || row.phone_number || row.phoneNumber || '',
  phone: row.phone || row.mobile_number || row.phone_number || row.phoneNumber || '',
  departmentId: row.department_id || row.departmentId || '',
  designation: row.designation || '',
  qualification: row.qualification || '',
  profileImageUrl: row.profile_photo_url || row.profile_image_url || row.profileImageUrl || '',
  username: row.username || row.user_name || '',
  password: row.password || '',
  roles: Array.isArray(row.roles) ? row.roles : typeof row.roles === 'string' ? JSON.parse(row.roles) : ['TEACHER'],
  status: row.status || (row.is_active ? 'ACTIVE' : 'INACTIVE'),
  isActive: row.is_active !== undefined ? row.is_active : row.isActive !== undefined ? row.isActive : true
});

export const mapFacultyAssignmentFromDb = (row: any): FacultyCourseAssignment => ({
  id: row.id,
  facultyId: row.faculty_id || row.facultyId || '',
  courseOfferingId: row.course_offering_id || row.courseOfferingId || '',
  courseGroupId: row.course_group_id || row.courseGroupId || '',
  role: row.role || 'PRIMARY',
  assignmentRole: row.assignment_role || row.assignmentRole || 'PRIMARY',
  isActive: row.is_active !== undefined ? row.is_active : true
});

export const mapStudentRegistrationFromDb = (row: any): StudentCourseRegistration => ({
  id: row.id,
  studentId: row.student_id || row.studentId || '',
  courseOfferingId: row.course_offering_id || row.courseOfferingId || '',
  courseGroupId: row.course_group_id || row.courseGroupId || '',
  courseCategoryId: row.course_category_id || row.courseCategoryId || '',
  registrationDate: row.registration_date || row.registrationDate || new Date().toISOString(),
  status: row.status || row.registration_status || 'APPROVED'
});

export const mapTimetablePeriodFromDb = (row: any): TimetablePeriod => {
  const formatTime = (t: string) => {
    if (!t) return '';
    const match = String(t).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return String(t);
    const h = parseInt(match[1], 10);
    const m = match[2];
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    const padH = displayH < 10 ? `0${displayH}` : `${displayH}`;
    return `${padH}:${m}`;
  };

  return {
    id: String(row.id),
    periodNumber: Number(row.period_number || row.periodNumber) || 1,
    startTime: formatTime(row.start_time || row.startTime || ''),
    endTime: formatTime(row.end_time || row.endTime || ''),
    label: row.name || row.label || `Period ${row.period_number || 1}`,
    isBreak: row.is_break !== undefined ? row.is_break : !!row.isBreak,
    isActive: row.is_active !== undefined ? row.is_active : true
  };
};

export const mapTimetableEntryFromDb = (row: any): TimetableEntry => {
  let dayName: any = 'MONDAY';
  if (typeof row.weekday === 'number') {
    const weekdayMap: Record<number, string> = {
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
      7: 'SUNDAY'
    };
    dayName = weekdayMap[row.weekday] || 'MONDAY';
  } else if (typeof row.day_of_week === 'string' && row.day_of_week) {
    dayName = row.day_of_week.toUpperCase();
  } else if (typeof row.weekday === 'string' && row.weekday) {
    dayName = row.weekday.toUpperCase();
  }

  return {
    id: String(row.id),
    academicYear: row.academic_year || row.academic_year_id || row.academicYear || '2026-27',
    semesterNumber: Number(row.semester_number || row.semester_id || row.semesterNumber || 1),
    dayOfWeek: dayName,
    weekday: dayName,
    periodId: String(row.period_id || row.periodId || ''),
    courseOfferingId: String(row.course_offering_id || row.courseOfferingId || ''),
    courseGroupId: String(row.course_group_id || row.courseGroupId || ''),
    facultyId: String(row.faculty_id || row.facultyId || ''),
    room: row.room || row.room_number || row.roomNumber || '',
    roomNumber: row.room_number || row.roomNumber || row.room || '',
    isActive: row.is_active !== undefined ? row.is_active : true
  };
};

export const mapClassSessionFromDb = (row: any): ClassSession => ({
  id: row.id,
  date: row.date || '',
  periodId: row.period_id || row.periodId || '',
  courseOfferingId: row.course_offering_id || row.courseOfferingId || '',
  courseGroupId: row.course_group_id || row.courseGroupId || '',
  facultyId: row.faculty_id || row.facultyId || '',
  substituteFacultyId: row.substitute_faculty_id || row.substituteFacultyId || undefined,
  timetableEntryId: row.timetable_entry_id || row.timetableEntryId || undefined,
  sessionSource: row.session_source || row.sessionSource || 'TIMETABLE',
  cancellationReason: row.cancellation_reason || row.cancellationReason || undefined,
  room: row.room || undefined,
  startTime: row.start_time || row.startTime || '',
  endTime: row.end_time || row.endTime || '',
  topicCovered: row.topic_covered || row.topicCovered || '',
  sessionType: row.session_type || row.sessionType || 'REGULAR',
  status: row.status || 'SCHEDULED',
  attendanceSubmitted: row.attendance_submitted !== undefined ? row.attendance_submitted : !!row.attendanceSubmitted,
  submittedTimestamp: row.submitted_timestamp || row.submittedTimestamp || undefined
});

export const mapAttendanceRecordFromDb = (row: any): AttendanceRecord => ({
  id: row.id,
  classSessionId: row.class_session_id || row.classSessionId || '',
  studentId: row.student_id || row.studentId || '',
  status: row.status || 'PRESENT',
  markedByFacultyId: row.marked_by_faculty_id || row.markedByFacultyId || '',
  markedTimestamp: row.marked_timestamp || row.markedTimestamp || new Date().toISOString(),
  remarks: row.remarks || undefined
});

export const mapCorrectionRequestFromDb = (row: any): AttendanceCorrectionRequest => ({
  id: row.id,
  classSessionId: row.class_session_id || row.classSessionId || '',
  studentId: row.student_id || row.studentId || '',
  requestedByFacultyId: row.requested_by_faculty_id || row.requestedByFacultyId || '',
  oldStatus: row.old_status || row.oldStatus || 'ABSENT',
  requestedStatus: row.requested_status || row.requestedStatus || 'PRESENT',
  reason: row.reason || '',
  requestedDate: row.requested_date || row.requestedDate || new Date().toISOString(),
  status: row.status || 'PENDING',
  reviewedByFacultyId: row.reviewed_by_faculty_id || row.reviewedByFacultyId || undefined,
  reviewDate: row.review_date || row.reviewDate || undefined,
  reviewRemarks: row.review_remarks || row.reviewRemarks || undefined,
  requestGroupId: row.request_group_id || row.requestGroupId || undefined
});

export const mapDepartmentFromDb = (row: any): Department => ({
  id: row.id,
  name: row.name || '',
  code: row.code || '',
  type: row.type || 'ACADEMIC',
  hodFacultyId: row.hod_faculty_id || row.hodFacultyId || undefined,
  isActive: row.is_active !== undefined ? row.is_active : row.isActive !== undefined ? row.isActive : true
});

export const mapProgrammeFromDb = (row: any): Programme => ({
  id: row.id,
  name: row.name || '',
  code: row.code || '',
  departmentId: row.department_id || row.departmentId || '',
  type: row.type || 'UG',
  durationYears: Number(row.duration_years || row.durationYears) || 4,
  totalSemesters: Number(row.total_semesters || row.totalSemesters) || 8,
  sanctionedIntake: Number(row.sanctioned_intake || row.sanctionedIntake || row.maxStrength) || 40,
  expectedStrength: Number(row.expected_strength || row.expectedStrength) || 40,
  maxStrength: Number(row.max_strength || row.maxStrength) || 50,
  admittedCount: Number(row.admitted_count || row.admittedCount) || 0,
  isActive: row.is_active !== undefined ? row.is_active : row.isActive !== undefined ? row.isActive : true
});

export const mapAcademicYearFromDb = (row: any): any => ({
  id: row.id,
  name: row.year_name || row.name || '2026-27',
  startDate: row.start_date || row.startDate || '2026-06-01',
  endDate: row.end_date || row.endDate || '2027-03-31',
  isCurrent: row.is_current !== undefined ? row.is_current : true,
  isActive: row.is_active !== undefined ? row.is_active : true
});

export const mapSemesterFromDb = (row: any): any => ({
  id: row.id,
  semesterNumber: Number(row.semester_number || row.semesterNumber) || 1,
  academicYear: row.academic_year || row.academicYear || '2026-27',
  term: row.term || 'ODD',
  isActive: row.is_active !== undefined ? row.is_active : true,
  isCurrent: row.is_current !== undefined ? row.is_current : false
});

export const mapAdmissionBatchFromDb = (row: any): any => ({
  id: row.id,
  batchName: row.batch_name || row.batchName || row.name || '2026-2030',
  academicYear: row.academic_year || row.academicYear || '2026-27',
  programmeId: row.programme_id || row.programmeId || '',
  maxCapacity: Number(row.max_capacity || row.maxCapacity) || 60,
  isActive: row.is_active !== undefined ? row.is_active : true
});

export const mapSemesterEnrollmentFromDb = (row: any): any => ({
  id: row.id,
  studentId: row.student_id || row.studentId || '',
  academicYear: row.academic_year || row.academicYear || '2026-27',
  semesterNumber: Number(row.semester_number || row.semesterNumber) || 1,
  enrollmentDate: row.enrolled_date || row.enrollmentDate || row.created_at || new Date().toISOString(),
  status: row.status || 'ACTIVE'
});

export const mapSubstituteAssignmentFromDb = (row: any): any => ({
  id: row.id,
  classSessionId: row.class_session_id || row.classSessionId || '',
  originalFacultyId: row.original_faculty_id || row.originalFacultyId || '',
  substituteFacultyId: row.substitute_faculty_id || row.substituteFacultyId || '',
  assignedByFacultyId: row.assigned_by_faculty_id || row.assignedByFacultyId || '',
  assignedAt: row.assigned_at || row.assignedAt || new Date().toISOString(),
  status: row.status || 'ACTIVE',
  reason: row.reason || ''
});

export const mapAnnouncementFromDb = (row: any): any => ({
  id: row.id,
  title: row.title || '',
  content: row.content || '',
  category: row.category || 'GENERAL',
  publishedAt: row.published_at || row.publishedAt || new Date().toISOString(),
  expiryDate: row.expiry_date || row.expiryDate || undefined,
  authorFacultyId: row.author_id || row.authorFacultyId || undefined,
  targetRoles: Array.isArray(row.target_roles) ? row.target_roles : ['ALL'],
  targetDepartmentId: row.department_id || row.targetDepartmentId || undefined,
  isPinned: !!row.is_pinned,
  isActive: row.is_active !== undefined ? row.is_active : true
});

export const mapAuditLogFromDb = (row: any): any => ({
  id: row.id,
  actorName: row.actor_name || 'System User',
  actorRole: row.actor_role || 'STAFF',
  action: row.action || '',
  entityType: row.entity_type || '',
  entityId: row.entity_id || '',
  details: typeof row.details === 'string' ? JSON.parse(row.details) : (row.details || {}),
  timestamp: row.timestamp || new Date().toISOString(),
  ipAddress: row.ip_address || undefined
});

export const mapSystemSettingsFromDb = (row: any): any => ({
  id: row.id,
  collegeName: row.college_name || 'NSS COLLEGE OTTAPALAM',
  collegeCode: row.college_code || 'NSS-OTP-1961',
  affiliation: row.affiliation || 'Affiliated to University of Calicut',
  accreditation: row.accreditation || "Accredited with 'A' Grade by NAAC",
  address: row.address || 'NSS College, Ottapalam, Palakkad District, Kerala - 679103',
  contactEmail: row.contact_email || 'nsscollegeottapalam@gmail.com',
  contactPhone: row.contact_phone || '+91 466 2244382',
  activeAcademicYear: row.active_academic_year || '2026-27',
  activeSemester: row.active_semester || 'Semester 1',
  minAttendancePercentage: Number(row.min_attendance_percentage) || 75,
  warningAttendancePercentage: Number(row.warning_attendance_percentage) || 70,
  attendanceCorrectionWindowHours: Number(row.attendance_correction_window_hours) || 24,
  allowTeacherDirectEdit: !!row.allow_teacher_direct_edit,
  requireHodApprovalForCorrection: row.require_hod_approval_for_correction !== undefined ? !!row.require_hod_approval_for_correction : true,
  workingDays: Array.isArray(row.working_days) ? row.working_days : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  enableStudentPortal: row.enable_student_portal !== undefined ? !!row.enable_student_portal : true,
  enableFacultyPortal: row.enable_faculty_portal !== undefined ? !!row.enable_faculty_portal : true,
  maintenanceMode: !!row.maintenance_mode
});

export const mapSpecialAttendanceEventFromDb = (row: any): SpecialAttendanceEvent => ({
  id: String(row.id),
  title: row.title || 'Special Attendance Event',
  description: row.description || '',
  eventType: row.event_type || 'OFFICIAL_EVENT',
  eventDate: row.event_date ? String(row.event_date).split('T')[0] : new Date().toISOString().split('T')[0],
  periodIds: Array.isArray(row.period_ids) ? row.period_ids : typeof row.period_ids === 'string' ? JSON.parse(row.period_ids || '[]') : [],
  isFullDay: !!row.is_full_day,
  startTime: row.start_time || undefined,
  endTime: row.end_time || undefined,
  scopeType: row.scope_type || 'COLLEGE',
  departmentId: row.department_id || undefined,
  programmeId: row.programme_id || undefined,
  batchId: row.batch_id || undefined,
  semesterId: row.semester_id || undefined,
  courseGroupId: row.course_group_id || undefined,
  studentCoverage: row.student_coverage || 'ALL_ELIGIBLE',
  selectedStudentIds: Array.isArray(row.selected_student_ids) ? row.selected_student_ids : typeof row.selected_student_ids === 'string' ? JSON.parse(row.selected_student_ids || '[]') : [],
  reason: row.reason || '',
  status: row.status || 'APPLIED',
  createdBy: row.created_by || '',
  createdByName: row.created_by_name || 'Authorized Officer',
  createdByRole: row.created_by_role || 'HOD',
  approvedBy: row.approved_by || undefined,
  approvedByName: row.approved_by_name || undefined,
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString()
});

export const mapSpecialAttendanceRecordFromDb = (row: any): SpecialAttendanceRecord => ({
  id: String(row.id),
  eventId: String(row.event_id),
  studentId: String(row.student_id),
  date: row.date ? String(row.date).split('T')[0] : new Date().toISOString().split('T')[0],
  periodId: String(row.period_id),
  attendanceStatus: row.attendance_status || 'SPECIAL',
  attendanceSource: 'SPECIAL',
  normalSessionConflictStatus: row.normal_session_conflict_status || 'NO_SESSION',
  remarks: row.remarks || '',
  createdAt: row.created_at || new Date().toISOString()
});

export const mapDailyScheduleOverrideFromDb = (row: any): any => ({
  id: String(row.id),
  date: row.date ? String(row.date).split('T')[0] : '',
  timetableEntryId: row.timetable_entry_id ? String(row.timetable_entry_id) : undefined,
  overrideType: row.override_type || 'PERIOD_MOVE',
  originalPeriodId: row.original_period_id ? String(row.original_period_id) : undefined,
  newPeriodId: row.new_period_id ? String(row.new_period_id) : undefined,
  originalFacultyId: row.original_faculty_id ? String(row.original_faculty_id) : undefined,
  substituteFacultyId: row.substitute_faculty_id ? String(row.substitute_faculty_id) : undefined,
  originalRoom: row.original_room || undefined,
  newRoom: row.new_room || undefined,
  courseGroupId: row.course_group_id ? String(row.course_group_id) : undefined,
  courseOfferingId: row.course_offering_id ? String(row.course_offering_id) : undefined,
  reason: row.reason || '',
  createdByFacultyId: row.created_by_faculty_id ? String(row.created_by_faculty_id) : undefined,
  createdAt: row.created_at || new Date().toISOString()
});

export const mapClassTutorAssignmentFromDb = (row: any): any => ({
  id: String(row.id),
  facultyId: String(row.faculty_id || ''),
  programmeId: String(row.programme_id || ''),
  academicYearId: row.academic_year_id ? String(row.academic_year_id) : undefined,
  semesterId: row.semester_id ? String(row.semester_id) : undefined,
  batchName: row.batch_name || '2024-2028',
  departmentId: row.department_id ? String(row.department_id) : undefined,
  isActive: row.is_active !== undefined ? row.is_active : true,
  createdAt: row.created_at || new Date().toISOString()
});

export const mapSubjectRequestFromDb = (row: any): any => ({
  id: String(row.id),
  requestedBy: String(row.requested_by || row.requestedBy || ''),
  requestedByFacultyId: row.requested_by_faculty_id || row.requestedByFacultyId || row.requested_by || undefined,
  departmentId: String(row.department_id || row.departmentId || ''),
  courseName: String(row.course_name || row.courseName || ''),
  proposedCourseCode: row.proposed_course_code || row.proposedCourseCode || undefined,
  courseType: row.course_type || row.courseType || 'MAJOR',
  programmeId: row.programme_id || row.programmeId || undefined,
  semesterNumber: row.semester_number ? Number(row.semester_number) : row.semesterNumber ? Number(row.semesterNumber) : undefined,
  academicYear: row.academic_year || row.academicYear || undefined,
  academicYearId: row.academic_year_id || row.academicYearId || undefined,
  existingCourseId: row.existing_course_id || row.existingCourseId || undefined,
  existingCourseGroupId: row.existing_course_group_id || row.existingCourseGroupId || undefined,
  proposedGroupName: row.proposed_group_name || row.proposedGroupName || undefined,
  requestNotes: row.request_notes || row.requestNotes || '',
  status: row.status || 'PENDING',
  reviewedBy: row.reviewed_by || row.reviewedBy || undefined,
  reviewedByFacultyId: row.reviewed_by_faculty_id || row.reviewedByFacultyId || undefined,
  reviewedAt: row.reviewed_at || row.reviewedAt || undefined,
  reviewNotes: row.review_notes || row.reviewNotes || undefined,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  isProvisional: row.is_provisional !== undefined ? row.is_provisional : (row.proposed_course_code?.startsWith('TEMP-') ?? false)
});

export const mapAssignmentHistoryFromDb = (row: any): any => ({
  id: String(row.id),
  courseGroupId: String(row.course_group_id || row.courseGroupId || ''),
  facultyId: String(row.faculty_id || row.facultyId || row.faculty_auth_user_id || ''),
  facultyAuthUserId: row.faculty_auth_user_id || row.facultyAuthUserId || undefined,
  departmentId: String(row.department_id || row.departmentId || ''),
  assignmentRole: row.assignment_role || row.assignmentRole || 'PRIMARY',
  effectiveFrom: row.effective_from ? String(row.effective_from).split('T')[0] : new Date().toISOString().split('T')[0],
  effectiveUntil: row.effective_until ? String(row.effective_until).split('T')[0] : undefined,
  sourceRequestId: row.source_request_id || row.sourceRequestId || undefined,
  assignedBy: String(row.assigned_by || row.assignedBy || ''),
  endedBy: row.ended_by || row.endedBy || undefined,
  reason: row.reason || '',
  createdAt: row.created_at || row.createdAt || new Date().toISOString()
});

export const mapSubjectAuditFromDb = (row: any): any => ({
  id: String(row.id),
  requestId: row.request_id || row.requestId || undefined,
  assignmentHistoryId: row.assignment_history_id || row.assignmentHistoryId || undefined,
  action: String(row.action || ''),
  performedBy: String(row.performed_by || row.performedBy || ''),
  details: typeof row.details === 'object' && row.details !== null ? row.details : {},
  createdAt: row.created_at || row.createdAt || new Date().toISOString()
});
