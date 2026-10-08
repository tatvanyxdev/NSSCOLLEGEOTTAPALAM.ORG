import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../common/UIComponents';
import {
  Megaphone,
  Users,
  GraduationCap,
  Briefcase,
  Pin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface QuickNewAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickNewAnnouncementModal: React.FC<QuickNewAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addAnnouncement } = useCollegeData();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'STUDENTS' | 'FACULTY'>('ALL');
  const [isPinned, setIsPinned] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please provide an announcement title.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Please provide announcement content.');
      return;
    }

    setIsPosting(true);
    try {
      const res = await addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        publishDate: new Date().toISOString().split('T')[0],
        authorName: user?.name || 'College Administration',
        targetAudience,
        isPinned
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to publish announcement.');
        setIsPosting(false);
        return;
      }

      setSuccessMessage('Announcement published successfully across campus channels!');
      setTimeout(() => {
        setIsPosting(false);
        setSuccessMessage(null);
        setTitle('');
        setContent('');
        setIsPinned(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while publishing.');
      setIsPosting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Campus Announcement"
      subtitle="Broadcast official notices, circulars, or urgent academic updates"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Announcement Headline <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. FYUGP S2 Mid-Term Attendance Condonation Notice"
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
            required
          />
        </div>

        {/* Audience Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Target Audience <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTargetAudience('ALL')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                targetAudience === 'ALL'
                  ? 'border-rose-900 bg-rose-50 text-rose-900 ring-1 ring-rose-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Campus Wide</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetAudience('STUDENTS')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                targetAudience === 'STUDENTS'
                  ? 'border-rose-900 bg-rose-50 text-rose-900 ring-1 ring-rose-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Students Only</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetAudience('FACULTY')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                targetAudience === 'FACULTY'
                  ? 'border-rose-900 bg-rose-50 text-rose-900 ring-1 ring-rose-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Faculty Only</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Notice Body / Instructions <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Provide clear details, applicable semester/programmes, deadlines, and contact officers..."
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
            required
          />
        </div>

        {/* Options */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pin-announcement"
              checked={isPinned}
              onChange={e => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-rose-900 focus:ring-rose-500 border-slate-300"
            />
            <label htmlFor="pin-announcement" className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <Pin className="w-3.5 h-3.5 text-amber-600 rotate-45" />
              <span>Pin to top of Dashboard bulletin</span>
            </label>
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            Author: {user?.name || 'Administrator'}
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isPosting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPosting}
            className="px-5 py-2 bg-rose-900 hover:bg-rose-950 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            {isPosting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing Notice...</span>
              </>
            ) : (
              <>
                <Megaphone className="w-3.5 h-3.5" />
                <span>Publish Now</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
