import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../common/UIComponents';
import { UserCheck } from 'lucide-react';

interface SubstituteTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubstituteTeacherModal: React.FC<SubstituteTeacherModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    faculty,
    courseGroups,
    courses,
    courseOfferings,
    timetablePeriods,
    assignSubstitute
  } = useCollegeData();

  const { user } = useAuth();

  const [originalFacultyId, setOriginalFacultyId] = useState('');
  const [substituteFacultyId, setSubstituteFacultyId] = useState('');
  const [courseGroupId, setCourseGroupId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodId, setPeriodId] = useState('period-1');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalFacultyId || !substituteFacultyId || !courseGroupId) {
      setSubmitError('Please select both faculty members and the target course group.');
      return;
    }
    if (originalFacultyId === substituteFacultyId) {
      setSubmitError('Original and substitute faculty cannot be the same person.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await assignSubstitute({
      originalFacultyId,
      substituteFacultyId,
      courseGroupId,
      date,
      periodId,
      reason: reason || 'Duty leave / Institutional engagement',
      approvedByHodId: user?.id || 'fac-1'
    });

    setIsSubmitting(false);

    if (!res.success) {
      setSubmitError(res.error || 'Failed to assign substitute faculty in Supabase.');
      return;
    }

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Substitute Faculty"
      subtitle="Grant temporary attendance authorization for a specific session"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Scheduled Faculty
            </label>
            <select
              value={originalFacultyId}
              onChange={e => setOriginalFacultyId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 bg-white"
            >
              <option value="">-- Choose Faculty --</option>
              {faculty.map(f => (
                <option key={f.id} value={f.id}>
                  {f.fullName} ({f.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Substitute Faculty
            </label>
            <select
              value={substituteFacultyId}
              onChange={e => setSubstituteFacultyId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 bg-white"
            >
              <option value="">-- Choose Substitute --</option>
              {faculty.map(f => (
                <option key={f.id} value={f.id}>
                  {f.fullName} ({f.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Course Group & Class
          </label>
          <select
            value={courseGroupId}
            onChange={e => setCourseGroupId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 bg-white"
          >
            <option value="">-- Choose Course Group --</option>
            {courseGroups.map(g => {
              const off = courseOfferings.find(o => o.id === g.courseOfferingId);
              const crs = courses.find(c => c.id === off?.courseId);
              return (
                <option key={g.id} value={g.id}>
                  {crs?.courseCode} - {crs?.courseTitle} ({g.groupName})
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Period</label>
            <select
              value={periodId}
              onChange={e => setPeriodId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 bg-white"
            >
              {timetablePeriods.filter(p => !p.isBreak).map(p => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.startTime} - {p.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Reason for Substitution
          </label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. University Valuation Camp / Medical Leave"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
          />
        </div>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <span className="font-bold">Database Error:</span> {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            <span className="font-bold">Success!</span> Substitute faculty authorized in Supabase.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || submitSuccess}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authorizing in Supabase...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Authorize Substitute</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
