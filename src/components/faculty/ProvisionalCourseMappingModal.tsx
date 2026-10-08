import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Course } from '../../types';
import { Modal } from '../common/UIComponents';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ProvisionalCourseMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  provisionalCourse: Course;
  onSuccess?: () => void;
}

export const ProvisionalCourseMappingModal: React.FC<ProvisionalCourseMappingModalProps> = ({
  isOpen,
  onClose,
  provisionalCourse,
  onSuccess
}) => {
  const { mapProvisionalCourse, courseCategories } = useCollegeData();
  const { user } = useAuth();

  const [officialCode, setOfficialCode] = useState('');
  const [officialTitle, setOfficialTitle] = useState(provisionalCourse.courseTitle);
  const [credits, setCredits] = useState(provisionalCourse.credits || 3);
  const [categoryId, setCategoryId] = useState(provisionalCourse.categoryId || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDone, setSuccessDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!officialCode.trim()) {
      setErrorMessage('Please enter the official University of Calicut Course Code.');
      return;
    }
    if (!officialTitle.trim()) {
      setErrorMessage('Please enter the official course title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await mapProvisionalCourse(
        provisionalCourse.id,
        {
          courseCode: officialCode.trim().toUpperCase(),
          courseTitle: officialTitle.trim(),
          credits: Number(credits),
          categoryId: categoryId || undefined
        },
        user?.id || 'hod-authority'
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to map provisional course.');
        setIsSubmitting(false);
        return;
      }

      setSuccessDone(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Map Provisional Course to Official University Code"
      subtitle="Update official University of Calicut details while preserving all historical attendance"
      maxWidth="max-w-lg"
    >
      {successDone ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Official Course Details Mapped!</h3>
            <p className="text-xs text-slate-600 mt-1">
              Course updated to <span className="font-bold text-slate-900">{officialCode}</span>. All student registrations and historical attendance remain intact.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Historical Integrity Protected</span>
              <span>
                All past classes conducted under temporary code <strong className="font-mono">{provisionalCourse.courseCode}</strong> will now seamlessly show the official university code. No attendance marks or timetable slots will be lost.
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Official University Course Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ENG1A01, BCM1B01, PHY2C01"
              value={officialCode}
              onChange={e => setOfficialCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Official Course Title *
            </label>
            <input
              type="text"
              required
              value={officialTitle}
              onChange={e => setOfficialTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Credits</label>
              <input
                type="number"
                min={1}
                max={12}
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                {courseCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? <span>Updating...</span> : <span>Apply Official Mapping</span>}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
