import React, { useState, useEffect } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { Modal, Badge } from '../common/UIComponents';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';

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

  const defaultTarget = Math.min(99, Math.max(1, Number(settings.minAttendancePercentage) || 75));
  const [targetPercentage, setTargetPercentage] = useState<number>(defaultTarget);
  const [simulatedConducted, setSimulatedConducted] = useState<number>(summary.totalConducted || 20);
  const [simulatedAttended, setSimulatedAttended] = useState<number>(
    summary.totalConducted > 0 ? summary.consolidatedTotalAttended : 18
  );

  useEffect(() => {
    if (isOpen) {
      setTargetPercentage(Math.min(99, Math.max(1, Number(settings.minAttendancePercentage) || 75)));
      setSimulatedConducted(summary.totalConducted > 0 ? summary.totalConducted : 20);
      setSimulatedAttended(summary.totalConducted > 0 ? summary.consolidatedTotalAttended : 18);
    }
  }, [isOpen, studentId, summary.totalConducted, summary.consolidatedTotalAttended, settings.minAttendancePercentage]);

  const safeTargetPct = Math.min(99, Math.max(1, Number(targetPercentage) || 75));
  const targetRatio = safeTargetPct / 100;
  const isSessionStrict = summary.policy === 'SESSION_STRICT';

  // Use policy-appropriate metrics when calculating needed/missable buffer
  const baseConducted = isSessionStrict && summary.totalConducted > 0 ? summary.totalWorkingDays : simulatedConducted;
  const baseAttended = isSessionStrict && summary.totalConducted > 0 ? summary.awardedDays : simulatedAttended;
  const activePercent = baseConducted > 0 ? (baseAttended / baseConducted) * 100 : 100;

  // Calculation 1: How many consecutive sessions (0.5d) or class hours needed?
  let neededCount = 0;
  if (activePercent < safeTargetPct && targetRatio < 1 && baseConducted > 0) {
    const rawDelta = Math.max(0, (targetRatio * baseConducted - baseAttended) / (1 - targetRatio));
    neededCount = isSessionStrict && summary.totalConducted > 0
      ? Math.max(0, Math.ceil(rawDelta / 0.5))
      : Math.max(0, Math.ceil(rawDelta));
  }

  // Calculation 2: How many sessions (0.5d) or class hours can safely be missed?
  let canMissCount = 0;
  if (activePercent >= safeTargetPct && targetRatio > 0 && baseConducted > 0) {
    const rawBuffer = Math.max(0, (baseAttended - targetRatio * baseConducted) / targetRatio);
    canMissCount = isSessionStrict && summary.totalConducted > 0
      ? Math.max(0, Math.floor(rawBuffer / 0.5))
      : Math.max(0, Math.floor(rawBuffer));
  }

  const displayPercent = summary.totalConducted > 0 ? summary.overallPercentage : activePercent;

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
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-blue-200 uppercase font-semibold">Institutional Current Attendance</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/15 text-white border border-white/20">
                  {summary.policyLabel}
                </span>
              </div>
              <h3 className="text-3xl font-black mt-1 text-white">
                {summary.totalConducted > 0 ? `${summary.overallPercentage.toFixed(1)}%` : 'No Sessions'}
              </h3>
              <p className="text-xs text-blue-200 mt-1">
                {isSessionStrict && summary.totalWorkingDays > 0
                  ? `${summary.awardedDays} / ${summary.totalWorkingDays} Working Days Awarded (${simulatedAttended}/${simulatedConducted} hrs)`
                  : `${simulatedAttended} Attended / ${simulatedConducted} Total Conducted Periods`}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant={displayPercent >= safeTargetPct ? 'success' : 'danger'}
                className="text-xs font-bold px-3 py-1"
              >
                {summary.totalConducted === 0
                  ? 'Pending Sessions'
                  : displayPercent >= safeTargetPct
                    ? 'On Track'
                    : 'Below Target'}
              </Badge>
            </div>
          </div>

          {isSessionStrict && (
            <div className="text-[11px] bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-blue-100">
              {summary.halfDaysLost > 0
                ? `${summary.halfDaysLost} FN/AN half-day session(s) forfeited due to partial absences (-${(summary.halfDaysLost * 0.5).toFixed(1)} working days). Forecast counts 0.5d FN/AN sessions; subjects below remain Hour-Wise:`
                : 'Strict Session-Wise Rule active: any single period absence in FN or AN cuts 0.5 working day. Forecast counts 0.5d FN/AN sessions; subjects below remain Hour-Wise:'}
            </div>
          )}
        </div>

        {/* Target Slider */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-600" /> Target Attendance Goal
            </label>
            <span className="text-sm font-black text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-md">
              {safeTargetPct}%
            </span>
          </div>
          <input
            type="range"
            min={60}
            max={95}
            step={1}
            value={safeTargetPct}
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
            <p className="text-xs text-emerald-800 font-semibold uppercase">
              {isSessionStrict && summary.totalConducted > 0 ? 'FN/AN Sessions Can Miss' : 'Hours You Can Miss'}
            </p>
            <p className="text-3xl font-black text-emerald-700 mt-1">{canMissCount}</p>
            <p className="text-[10px] text-emerald-600 mt-1">
              before dropping below {safeTargetPct}%
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-1" />
            <p className="text-xs text-rose-800 font-semibold uppercase">
              {isSessionStrict && summary.totalConducted > 0 ? 'FN/AN Sessions Must Attend' : 'Hours Must Attend'}
            </p>
            <p className="text-3xl font-black text-rose-700 mt-1">{neededCount}</p>
            <p className="text-[10px] text-rose-600 mt-1">
              consecutively to reach {safeTargetPct}%
            </p>
          </div>
        </div>

        {/* Per-Course Breakdown in FYUGP */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              FYUGP Course-Wise Requirement Breakdown
            </h4>
            <span className="text-[10px] font-semibold text-slate-500">Always Hour-Wise</span>
          </div>
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-52 overflow-y-auto">
            {summary.courses.map((crs, idx) => {
              const crsAttended =
                crs.presentCount +
                crs.odCount +
                (settings.enableOdAutomation ? crs.medicalLeaveCount : 0);
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
