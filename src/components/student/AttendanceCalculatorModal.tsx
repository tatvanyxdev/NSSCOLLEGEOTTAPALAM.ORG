import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { Modal, Badge } from '../common/UIComponents';
import { Calculator, Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface AttendanceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export const AttendanceCalculatorModal: React.FC<AttendanceCalculatorModalProps> = ({
  isOpen,
  onClose,
  studentId
}) => {
  const { getStudentAttendanceSummary, settings } = useCollegeData();
  const summary = getStudentAttendanceSummary(studentId);

  const [targetPercentage, setTargetPercentage] = useState<number>(settings.minAttendancePercentage || 75);
  const [simulatedConducted, setSimulatedConducted] = useState<number>(summary.totalConducted || 20);
  const [simulatedAttended, setSimulatedAttended] = useState<number>(
    summary.totalPresent + summary.totalOd + summary.totalMedicalLeave || 18
  );

  const currentPercent = simulatedConducted > 0 ? (simulatedAttended / simulatedConducted) * 100 : 100;
  const targetRatio = targetPercentage / 100;

  // Calculation 1: If current < target, how many consecutive upcoming classes needed?
  // (attended + x) / (conducted + x) >= targetRatio
  // attended + x >= targetRatio * conducted + targetRatio * x
  // x * (1 - targetRatio) >= targetRatio * conducted - attended
  // x = ceil((targetRatio * conducted - attended) / (1 - targetRatio))
  let neededClasses = 0;
  if (currentPercent < targetPercentage && targetRatio < 1) {
    neededClasses = Math.max(0, Math.ceil((targetRatio * simulatedConducted - simulatedAttended) / (1 - targetRatio)));
  }

  // Calculation 2: If current >= target, how many classes can safely be missed?
  // attended / (conducted + y) >= targetRatio
  // attended >= targetRatio * conducted + targetRatio * y
  // y = floor((attended - targetRatio * conducted) / targetRatio)
  let canMissClasses = 0;
  if (currentPercent >= targetPercentage && targetRatio > 0) {
    canMissClasses = Math.max(0, Math.floor((simulatedAttended - targetRatio * simulatedConducted) / targetRatio));
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Target & Forecast Calculator"
      subtitle="Simulate attendance requirements under FYUGP regulations"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Overall Status Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200 uppercase font-semibold">Institutional Current Attendance</p>
              <h3 className="text-3xl font-black mt-1 text-white">{currentPercent.toFixed(1)}%</h3>
              <p className="text-xs text-blue-200 mt-1">
                {simulatedAttended} Attended / {simulatedConducted} Total Conducted Sessions
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant={currentPercent >= targetPercentage ? 'success' : 'danger'}
                className="text-xs font-bold px-3 py-1"
              >
                {currentPercent >= targetPercentage ? 'On Track' : 'Below Target'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Target Slider */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-600" /> Target Attendance Goal
            </label>
            <span className="text-sm font-black text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-md">
              {targetPercentage}%
            </span>
          </div>
          <input
            type="range"
            min={60}
            max={95}
            step={1}
            value={targetPercentage}
            onChange={e => setTargetPercentage(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>60%</span>
            <span className="text-blue-600 font-bold">75% (Min Exam Rule)</span>
            <span>85%</span>
            <span>95%</span>
          </div>
        </div>

        {/* Forecast Outcome */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-emerald-800 font-semibold uppercase">Classes You Can Miss</p>
            <p className="text-3xl font-black text-emerald-700 mt-1">{canMissClasses}</p>
            <p className="text-[10px] text-emerald-600 mt-1">
              before dropping below {targetPercentage}%
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-1" />
            <p className="text-xs text-rose-800 font-semibold uppercase">Classes Must Attend</p>
            <p className="text-3xl font-black text-rose-700 mt-1">{neededClasses}</p>
            <p className="text-[10px] text-rose-600 mt-1">
              consecutively to reach {targetPercentage}%
            </p>
          </div>
        </div>

        {/* Per-Course Breakdown in FYUGP */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            FYUGP Course-Wise Requirement Breakdown
          </h4>
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-52 overflow-y-auto">
            {summary.courses.map((crs, idx) => {
              const crsAttended = crs.presentCount + crs.odCount + crs.medicalLeaveCount;
              const crsPercent = crs.conductedCount > 0 ? (crsAttended / crs.conductedCount) * 100 : 100;
              let crsNeeded = 0;
              let crsCanMiss = 0;

              if (crsPercent < targetPercentage && targetRatio < 1) {
                crsNeeded = Math.max(0, Math.ceil((targetRatio * crs.conductedCount - crsAttended) / (1 - targetRatio)));
              } else if (crsPercent >= targetPercentage && targetRatio > 0) {
                crsCanMiss = Math.max(0, Math.floor((crsAttended - targetRatio * crs.conductedCount) / targetRatio));
              }

              return (
                <div
                  key={crs.registrationId || `${crs.courseId}-${crs.courseCategory}-${crs.groupName}-${idx}`}
                  className="p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{crs.courseCode}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                        {crs.courseCategory}
                      </span>
                    </div>
                    <p className="text-slate-500 truncate max-w-xs">{crs.courseTitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{crsPercent.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-500">
                      {crsPercent >= targetPercentage ? (
                        <span className="text-emerald-600 font-semibold">Can miss: {crsCanMiss}</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Need: +{crsNeeded}</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};
