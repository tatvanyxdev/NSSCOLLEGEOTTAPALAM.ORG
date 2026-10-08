import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { Modal } from '../common/UIComponents';
import {
  PushSenderRole,
  PushTargetAudience,
  PushPriority,
  PushCategory,
  PushNotificationMessage
} from '../../types/pushNotification';
import { pushNotificationService } from '../../services/pushNotificationService';
import {
  BellRing,
  Send,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Radio,
  Clock,
  Layers,
  Info
} from 'lucide-react';

interface SendPushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: (notif: PushNotificationMessage) => void;
}

export const SendPushNotificationModal: React.FC<SendPushNotificationModalProps> = ({
  isOpen,
  onClose,
  onSent
}) => {
  const { user, activeRole } = useAuth();
  const { departments } = useCollegeData();
  const academicDepartments = departments.filter((d) => d.type === 'ACADEMIC');

  // Determine current sender context
  const senderRole: PushSenderRole =
    activeRole === 'PRINCIPAL'
      ? 'PRINCIPAL'
      : activeRole === 'HOD'
      ? 'HOD'
      : 'SUPER_ADMIN';

  const userDept = academicDepartments.find(
    (d) =>
      d.id === user?.departmentId ||
      d.hodId === user?.id ||
      d.name === user?.departmentName
  ) || academicDepartments[0];

  const senderDepartmentId = senderRole === 'HOD' ? userDept?.id : undefined;
  const senderDepartmentName = senderRole === 'HOD' ? userDept?.name : undefined;

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<PushTargetAudience>(
    senderRole === 'HOD' ? 'MY_DEPARTMENT' : 'ALL_CAMPUS'
  );
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>(
    academicDepartments[0]?.id || ''
  );
  const [targetBatch, setTargetBatch] = useState('ALL');
  const [priority, setPriority] = useState<PushPriority>('NORMAL');
  const [category, setCategory] = useState<PushCategory>('GENERAL');
  const [actionUrl, setActionUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const senderDisplayName =
    senderRole === 'PRINCIPAL'
      ? `${user?.name || 'Dr. R. Rajesh'} (Principal)`
      : senderRole === 'HOD'
      ? `${user?.name || 'Department Head'} (HOD ${senderDepartmentName || 'Department'})`
      : `${user?.name || 'System Admin'} (Super Administrator)`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim() || !body.trim()) {
      setErrorMessage('Please provide both an alert title and message body.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDept = academicDepartments.find((d) => d.id === targetDepartmentId);
      const res = await pushNotificationService.sendPushNotification({
        title,
        body,
        senderRole,
        senderName: senderDisplayName,
        senderDepartmentId,
        senderDepartmentName,
        targetAudience,
        targetDepartmentId:
          targetAudience === 'SPECIFIC_DEPARTMENT' ||
          targetAudience === 'DEPARTMENT_STUDENTS' ||
          targetAudience === 'DEPARTMENT_FACULTY'
            ? targetDepartmentId
            : senderDepartmentId,
        targetDepartmentName:
          targetAudience === 'SPECIFIC_DEPARTMENT' ||
          targetAudience === 'DEPARTMENT_STUDENTS' ||
          targetAudience === 'DEPARTMENT_FACULTY'
            ? selectedDept?.name
            : senderDepartmentName,
        targetBatch: targetBatch !== 'ALL' ? targetBatch : undefined,
        priority,
        category,
        actionUrl: actionUrl.trim() || undefined
      });

      if (res.success && res.notification) {
        setSuccessMessage('Push notification successfully dispatched to target devices & portal!');
        if (onSent) onSent(res.notification);
        setTimeout(() => {
          setTitle('');
          setBody('');
          setSuccessMessage(null);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to dispatch push notification.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Alert"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Authority Pill */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg text-white ${
                senderRole === 'PRINCIPAL'
                  ? 'bg-amber-600'
                  : senderRole === 'HOD'
                  ? 'bg-blue-600'
                  : 'bg-purple-600'
              }`}
            >
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {senderDisplayName}
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              senderRole === 'PRINCIPAL'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : senderRole === 'HOD'
                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                : 'bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            {senderRole}
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Priority & Category Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Urgency / Priority Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'NORMAL', label: 'Normal', color: 'border-slate-300 text-slate-700' },
                  { id: 'HIGH', label: 'Important', color: 'border-amber-400 text-amber-800 bg-amber-50/50' },
                  { id: 'EMERGENCY', label: 'Emergency', color: 'border-rose-400 text-rose-800 bg-rose-50/50' }
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    priority === p.id
                      ? p.id === 'EMERGENCY'
                        ? 'bg-rose-900 text-white border-rose-900 shadow-xs'
                        : p.id === 'HIGH'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : `${p.color} hover:bg-slate-100`
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alert Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PushCategory)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-900/20"
            >
              <option value="GENERAL">General Notice / Circular</option>
              <option value="ACADEMIC">Academic & Curriculum Delivery</option>
              <option value="EXAM">Examinations & Internal Marks</option>
              <option value="EMERGENCY">Campus Emergency & Safety Alert</option>
              <option value="EVENT">College Event, Arts & Sports</option>
              <option value="MAINTENANCE">System Maintenance & Facilities</option>
            </select>
          </div>
        </div>

        {/* Target Audience Controls (Role-Tailored) */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Target Audience & Recipient Scope <span className="text-rose-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {senderRole === 'HOD' ? (
              <>
                <button
                  type="button"
                  onClick={() => setTargetAudience('MY_DEPARTMENT')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    targetAudience === 'MY_DEPARTMENT'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="font-bold">Entire Department (Students & Staff)</span>
                  <Users className="w-3.5 h-3.5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('DEPARTMENT_STUDENTS')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    targetAudience === 'DEPARTMENT_STUDENTS'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="font-bold">Department Students Only</span>
                  <GraduationCap className="w-3.5 h-3.5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('DEPARTMENT_FACULTY')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    targetAudience === 'DEPARTMENT_FACULTY'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="font-bold">Department Faculty & Tutors</span>
                  <Users className="w-3.5 h-3.5 opacity-70" />
                </button>

                {/* Specific Batch Filter */}
                <div>
                  <select
                    value={targetBatch}
                    onChange={(e) => setTargetBatch(e.target.value)}
                    className="w-full h-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="ALL">All Semester Batches</option>
                    <option value="UG_S1_S2">FYUGP Semester 1 & 2</option>
                    <option value="UG_S3_S4">FYUGP Semester 3 & 4</option>
                    <option value="UG_S5_S6">UG Semester 5 & 6</option>
                    <option value="PG">Postgraduate (PG) Batches</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setTargetAudience('ALL_CAMPUS')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    targetAudience === 'ALL_CAMPUS'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="font-bold">Entire College (All Students & Staff)</span>
                  <Building2 className="w-3.5 h-3.5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('ALL_STUDENTS')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    targetAudience === 'ALL_STUDENTS'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="font-bold">All Enrolled Students</span>
                  <GraduationCap className="w-3.5 h-3.5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('ALL_FACULTY')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    targetAudience === 'ALL_FACULTY'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="font-bold">All Teaching Faculty & Staff</span>
                  <Users className="w-3.5 h-3.5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('SPECIFIC_DEPARTMENT')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    targetAudience === 'SPECIFIC_DEPARTMENT'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="font-bold">Target Specific Department</span>
                  <Layers className="w-3.5 h-3.5 opacity-70" />
                </button>
              </>
            )}
          </div>

          {/* Department Dropdown for Principal / SuperAdmin when SPECIFIC_DEPARTMENT is picked */}
          {(targetAudience === 'SPECIFIC_DEPARTMENT' ||
            (senderRole === 'PRINCIPAL' && targetAudience === 'DEPARTMENT_STUDENTS')) && (
            <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-150">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Select Destination Department
              </label>
              <select
                value={targetDepartmentId}
                onChange={(e) => setTargetDepartmentId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-900/20"
              >
                {academicDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Title & Body */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Push Alert Headline / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="e.g. Tomorrow 9:00 AM Model Exam / Urgent Weather Advisory..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-900/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Detailed Message Directive <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {body.length} / 1000
              </span>
            </div>
            <textarea
              rows={3}
              required
              maxLength={1000}
              placeholder="Provide clear instructions, venue details, or statutory guidelines for the recipients..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-900/20 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Optional In-App Action Target
            </label>
            <select
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
            >
              <option value="">None (Display Alert Only)</option>
              <option value="attendance">Daily Attendance Hub</option>
              <option value="timetable">Class Timetable & Schedule</option>
              <option value="notices">Official Notices & Circulars</option>
              <option value="resources">Syllabus & QP Question Bank</option>
              <option value="leave-requests">Student Leave & OD Requests</option>
              <option value="complaints">Grievance & Vigilance Portal</option>
            </select>
          </div>
        </div>

        {/* Live Card Preview */}
        {title.trim() && (
          <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-xl space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <BellRing className="w-3 h-3" /> Live Alert Preview
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  priority === 'EMERGENCY'
                    ? 'bg-rose-500 text-white'
                    : priority === 'HIGH'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {priority}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white line-clamp-1">{title}</h4>
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              {body || 'Message directive content...'}
            </p>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>{senderDisplayName}</span>
              <span>Just now</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !body.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSubmitting ? 'Dispatching Broadcast...' : 'Broadcast Push Message'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
