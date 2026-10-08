import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal } from '../common/UIComponents';
import { Megaphone, Plus, Trash2, Calendar, UserCheck, Sparkles, AlertCircle } from 'lucide-react';

export const AnnouncementsView: React.FC = () => {
  const { announcements, addAnnouncement, deleteAnnouncement } = useCollegeData();
  const { activeRole, user } = useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'STUDENTS' | 'FACULTY'>('ALL');

  const [isPosting, setIsPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const canPost = can(activeRole, 'announcements', 'create');
  const canDelete = can(activeRole, 'announcements', 'delete');
  const isStudent = activeRole === 'STUDENT';

  const visibleAnnouncements = announcements.filter(item => {
    if (isStudent) {
      return item.targetAudience === 'ALL' || item.targetAudience === 'STUDENTS';
    }
    return true;
  });

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    if (!title.trim() || !content.trim()) return;

    setIsPosting(true);
    setModalError(null);

    const res = await addAnnouncement({
      title: title.trim(),
      content: content.trim(),
      publishDate: new Date().toISOString().split('T')[0],
      authorName: user?.name || 'College Administration',
      targetAudience,
      isPinned: false
    });

    setIsPosting(false);

    if (!res.success) {
      setModalError(res.error || 'Failed to publish announcement to Supabase database.');
      return;
    }

    setTitle('');
    setContent('');
    setIsAddOpen(false);
  };

  const handleDelete = async (id: string, titleText: string) => {
    if (!canDelete) return;
    if (confirm(`Are you sure you want to remove notice "${titleText}"?`)) {
      setDeletingId(id);
      setPageError(null);
      const res = await deleteAnnouncement(id);
      setDeletingId(null);
      if (!res.success) {
        setPageError(res.error || 'Failed to delete notice from Supabase database.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {pageError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Database Error: {pageError}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Announcements</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            Notice Board
          </span>
        </div>

        {canPost && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Post Notice
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {visibleAnnouncements.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
            No notices available for your viewing profile.
          </div>
        ) : (
          visibleAnnouncements.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                      Audience: {item.targetAudience}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        disabled={deletingId === item.id}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Delete Notice"
                      >
                        {deletingId === item.id ? (
                          <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{item.content}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Published: {item.publishDate}
                </span>
                <span className="font-semibold text-slate-700">Issued by: {item.authorName}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {canPost && (
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Publish Official Notice">
        <form onSubmit={handlePost} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Notice Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. FYUGP End-Semester Examination Registration Notification"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Audience</label>
            <select
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="ALL">All Campus (Students & Faculty)</option>
              <option value="STUDENTS">Students Only</option>
              <option value="FACULTY">Faculty & Staff Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Notice Body Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Full details of the circular..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Database Error:</span> {modalError}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isPosting}
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPosting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-2"
              >
                {isPosting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Publishing to Supabase...</span>
                  </>
                ) : (
                  <span>Publish Circular</span>
                )}
              </button>
            </div>
        </form>
      </Modal>
      )}
    </div>
  );
};
