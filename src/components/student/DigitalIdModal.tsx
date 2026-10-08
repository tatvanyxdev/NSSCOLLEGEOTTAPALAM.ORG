import React from 'react';
import { Student } from '../../types';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { Modal } from '../common/UIComponents';
import { COLLEGE_LOGO_WHITE } from '../common/CollegeLogo';
import { QrCode, ShieldCheck, Sparkles } from 'lucide-react';

interface DigitalIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const DigitalIdModal: React.FC<DigitalIdModalProps> = ({ isOpen, onClose, student }) => {
  const { departments, programmes, settings } = useCollegeData();

  if (!student) return null;

  const dept = departments.find(d => d.id === student.homeDepartmentId);
  const prog = programmes.find(p => p.id === student.programmeId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Identity Card" maxWidth="max-w-md">
      <div className="flex flex-col items-center">
        {/* ID Card Front */}
        <div className="w-full bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-2xl border border-blue-500/20 relative overflow-hidden">
          {/* Header */}
          <div className="text-center pb-4 border-b border-white/10 relative z-10">
            <div className="flex justify-center mb-2">
              <img
                src={COLLEGE_LOGO_WHITE}
                alt="NSS College Emblem"
                referrerPolicy="no-referrer"
                className="w-14 h-14 object-contain drop-shadow-md"
              />
            </div>
            <h3 className="font-serif font-bold tracking-wider text-base uppercase text-blue-100">
              {settings.collegeName}
            </h3>
            <p className="text-[10px] text-blue-300 tracking-wider uppercase">{settings.affiliation}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] font-bold text-amber-300 uppercase">
              FYUGP STUDENT IDENTITY
            </span>
          </div>

          {/* Body */}
          <div className="py-5 flex flex-col items-center relative z-10">
            <div className="relative">
              <img
                src={student.profilePhotoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
                alt={student.fullName}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <h4 className="text-lg font-bold text-white mt-3 text-center">{student.fullName}</h4>
            <p className="text-xs text-amber-300 font-medium text-center">{prog?.name || 'Undergraduate Programme'}</p>

            <div className="w-full mt-4 bg-white/5 rounded-xl p-3.5 border border-white/10 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Roll No:</span>
                <span className="font-bold text-white">{student.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Admission No:</span>
                <span className="font-bold text-white">{student.admissionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Univ Reg No:</span>
                <span className="font-bold text-white">{student.universityRegisterNumber || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Major Dept:</span>
                <span className="font-bold text-blue-200">{dept?.name || 'Department'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Batch / Sem:</span>
                <span className="font-bold text-white">{student.admissionBatch} • Semester {student.currentSemester}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-bold text-rose-300">{student.bloodGroup || 'O+ve'}</span>
              </div>
            </div>
          </div>

          {/* QR Barcode Section */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-lg shadow-inner">
                <QrCode className="w-8 h-8 text-slate-950" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">DIGITAL TOKEN</p>
                <p className="text-[10px] text-amber-300 font-mono">{student.admissionNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400">Principal Signature</p>
              <p className="text-xs font-serif italic text-blue-200">Authorized Principal</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
        >
          Close Card
        </button>
      </div>
    </Modal>
  );
};
