/**
 * src/components/employee/EmployeeDashboard.jsx
 * Individual employee portal with monthly shift breakdown,
 * reassignment & multi-brand coverage notices, leave submission,
 * peer shift swap requests, and single vs multi-resource policy guidelines.
 */

import { useState, useMemo } from 'react';
import { useRoster } from '../../context/RosterContext';
import { SHIFT_TYPES } from '../../utils/rosterEngine';
import { Calendar, AlertCircle, Send, CheckCircle2, Award, ArrowLeftRight, Bell } from 'lucide-react';

export default function EmployeeDashboard() {
  const {
    currentUser,
    employees,
    brands,
    selectedYear,
    selectedMonth,
    scheduleMatrix,
    leaves,
    swaps,
    submitLeaveRequest,
    submitSwapRequest
  } = useRoster();

  // Active form tab: 'LEAVE' or 'SWAP'
  const [activeTab, setActiveTab] = useState('LEAVE');

  // Employee and Brand Profile
  const employeeProfile = employees.find((e) => e.id === currentUser.employeeId);
  const assignedBrand = brands.find((b) => b.assignedEmployeeIds.includes(currentUser.employeeId));

  // Eligible Pod Teammates for swap
  const podPeers = useMemo(() => {
    return employees.filter(
      (e) => e.podId === employeeProfile?.podId && e.id !== currentUser.employeeId
    );
  }, [employees, employeeProfile, currentUser.employeeId]);

  // Leave Form States
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveReason, setLeaveReason] = useState('');

  // Swap Form States
  const [swapDate, setSwapDate] = useState('');
  const [swapTargetId, setSwapTargetId] = useState(podPeers[0]?.id || '');
  const [swapReason, setSwapReason] = useState('');

  // Feedback states
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Allowed Date Bounds: Today to end of next month
  const { minDateStr, maxDateStr } = useMemo(() => {
    const today = new Date();
    const minStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const maxStr = `${endOfNextMonth.getFullYear()}-${String(endOfNextMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfNextMonth.getDate()).padStart(2, '0')}`;
    return { minDateStr: minStr, maxDateStr: maxStr };
  }, []);

  const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dayIndices = Array.from({ length: totalDays }, (_, i) => i + 1);

  const myLeaves = leaves.filter((l) => l.employeeId === currentUser.employeeId);
  const mySwaps = swaps.filter(
    (s) => s.requesterId === currentUser.employeeId || s.targetEmployeeId === currentUser.employeeId
  );

  // Detect any days where this employee has active reassigned brand coverage
  const activeReassignments = useMemo(() => {
    const assignments = [];
    dayIndices.forEach((day) => {
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const shift = scheduleMatrix[`${currentUser.employeeId}_${dateKey}`];
      if (shift && shift.isCoveringBrand) {
        assignments.push({
          date: dateKey,
          brandName: shift.primaryCoveringBrand,
          coveredBrands: shift.coveredBrands || [shift.primaryCoveringBrand],
          brandCount: shift.brandCount || 1
        });
      }
    });
    return assignments;
  }, [dayIndices, selectedYear, selectedMonth, scheduleMatrix, currentUser.employeeId]);

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!leaveDate) return;
    if (leaveDate < minDateStr || leaveDate > maxDateStr) {
      setErrorMessage(`Please select a date between ${minDateStr} and ${maxDateStr}.`);
      return;
    }

    // Edge check: Prevent duplicate leave on the same date
    const alreadyRequested = myLeaves.some((l) => l.date === leaveDate);
    if (alreadyRequested) {
      setErrorMessage(`You already have a leave submission logged for ${leaveDate}.`);
      return;
    }

    submitLeaveRequest({
      employeeId: currentUser.employeeId,
      date: leaveDate,
      type: leaveType,
      reason: leaveReason || 'Personal obligation'
    });

    setLeaveDate('');
    setLeaveReason('');
    setFeedback('Leave request submitted!');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleSwapSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!swapDate || !swapTargetId) return;
    if (swapDate < minDateStr || swapDate > maxDateStr) {
      setErrorMessage(`Please select a date between ${minDateStr} and ${maxDateStr}.`);
      return;
    }

    submitSwapRequest({
      requesterId: currentUser.employeeId,
      targetEmployeeId: swapTargetId,
      date: swapDate,
      reason: swapReason || 'Mutual shift adjustment'
    });

    setSwapDate('');
    setSwapReason('');
    setFeedback('Shift swap request submitted for approval!');
    setTimeout(() => setFeedback(''), 3000);
  };

  const isSingleResourceBrand = assignedBrand?.modelType === 'SINGLE_RESOURCE';

  return (
    <div className="space-y-6">
      
      {/* Top Profile Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">{currentUser.name}</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
              {assignedBrand?.name || 'Operations'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {isSingleResourceBrand ? 'Single-Resource Model' : 'Multi-Resource Model'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Weekly Offs: <strong>{employeeProfile?.fixedOffDay}</strong> (Fixed) &{' '}
            <strong>{employeeProfile?.staggeredOffDay}</strong> (Staggered)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Comp-Off Balance</div>
            <div className="text-base font-bold text-slate-800 flex items-center justify-center space-x-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{employeeProfile?.compOffBalance || 0} Day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reassigned Brand Notice Banner (If Manager has assigned this employee to cover) */}
      {activeReassignments.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-teal-900 font-bold text-xs">
            <Bell className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Active Brand Coverage Assignments</span>
          </div>
          <div className="space-y-1.5">
            {activeReassignments.map((item, idx) => (
              <div
                key={idx}
                className="text-xs text-teal-800 flex flex-col sm:flex-row sm:items-center justify-between bg-white/70 p-2.5 rounded-lg border border-teal-200 gap-1"
              >
                <div>
                  You are scheduled to cover <strong>{item.brandName}</strong> on <strong>{item.date}</strong>.
                  {item.brandCount > 1 && (
                    <span className="text-amber-800 font-semibold block text-[11px] mt-0.5">
                      ⚠️ Note: You are handling multiple brand desks on this date ({item.coveredBrands.join(', ')}).
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900 self-start sm:self-center">
                  Assigned by Operations Lead
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy Notice for Single-Resource Handlers */}
      {isSingleResourceBrand && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <strong className="font-semibold text-amber-900">Coverage Advisory:</strong> You are the sole dedicated resource for <strong>{assignedBrand.name}</strong>. Time-off requests are routed directly to your Pod Manager to arrange qualified cross-coverage from an available pod peer with matching process skills.
          </div>
        </div>
      )}

      {/* Main Split Layout: Calendar + Actions Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Monthly Shift Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>My Monthly Shift Schedule</span>
          </h2>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
                {d}
              </div>
            ))}

            {dayIndices.map((day) => {
              const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const scheduleKey = `${currentUser.employeeId}_${dateKey}`;
              const shift = scheduleMatrix[scheduleKey];

              let bgStyle = 'bg-slate-50 border-slate-200 text-slate-700';
              let badge = 'Day Shift';

              if (shift?.isCoveringBrand) {
                const isMulti = shift.brandCount && shift.brandCount > 1;
                bgStyle = isMulti
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-teal-50 border-teal-300 text-teal-900 font-bold';
                badge = isMulti ? `Cover (${shift.brandCount} Brands)` : `Cover (${shift.primaryCoveringBrand})`;
              } else if (shift?.shiftType === SHIFT_TYPES.LEAVE) {
                bgStyle = 'bg-amber-50 border-amber-300 text-amber-800 font-semibold';
                badge = 'On Leave';
              } else if (shift?.shiftType === SHIFT_TYPES.WEEKLY_OFF) {
                bgStyle = 'bg-slate-100 border-slate-200 text-slate-400';
                badge = 'Weekly Off';
              } else if (shift?.isOverride) {
                bgStyle = 'bg-indigo-50 border-indigo-300 text-indigo-800 font-semibold';
                badge = 'Swapped';
              }

              return (
                <div
                  key={day}
                  className={`min-h-[70px] p-1.5 rounded-lg border text-left flex flex-col justify-between ${bgStyle}`}
                >
                  <span className="text-xs font-semibold">{day}</span>
                  <span className="text-[10px] tracking-tight leading-tight">{badge}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Tabbed Request Center & History */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-4 pb-2 space-x-4">
              <button
                onClick={() => { setActiveTab('LEAVE'); setErrorMessage(''); }}
                className={`text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'LEAVE'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Request Leave
              </button>
              <button
                onClick={() => { setActiveTab('SWAP'); setErrorMessage(''); }}
                className={`text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'SWAP'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Shift Swap
              </button>
            </div>

            {/* Leave Form */}
            {activeTab === 'LEAVE' ? (
              <form onSubmit={handleLeaveSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    max={maxDateStr}
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    Window: {minDateStr} to {maxDateStr}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Compensatory Off">Compensatory Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Doctor checkup, personal work"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {errorMessage && (
                  <div className="text-xs text-rose-600 font-medium">{errorMessage}</div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Leave Request</span>
                </button>
              </form>
            ) : (
              /* Swap Form */
              <form onSubmit={handleSwapSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Swap Date
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    max={maxDateStr}
                    value={swapDate}
                    onChange={(e) => setSwapDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Swap With (Pod Teammate)
                  </label>
                  <select
                    value={swapTargetId}
                    onChange={(e) => setSwapTargetId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {podPeers.map((peer) => (
                      <option key={peer.id} value={peer.id}>
                        {peer.name} ({peer.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule swap for family event"
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {errorMessage && (
                  <div className="text-xs text-rose-600 font-medium">{errorMessage}</div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Submit Swap Request</span>
                </button>
              </form>
            )}

            {feedback && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-medium pt-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}
          </div>

          {/* Activity History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">
              {activeTab === 'LEAVE' ? 'My Leave Records' : 'My Swap Requests'}
            </h3>

            {activeTab === 'LEAVE' ? (
              myLeaves.length === 0 ? (
                <p className="text-xs text-slate-400">No leave requests logged this period.</p>
              ) : (
                <div className="space-y-2">
                  {myLeaves.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <div className="font-semibold text-slate-700">{l.date}</div>
                        <div className="text-[10px] text-slate-400">{l.type}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              )
            ) : mySwaps.length === 0 ? (
              <p className="text-xs text-slate-400">No swap requests logged this period.</p>
            ) : (
              <div className="space-y-2">
                {mySwaps.map((s) => {
                  const peer = employees.find((e) =>
                    e.id === (s.requesterId === currentUser.employeeId ? s.targetEmployeeId : s.requesterId)
                  );
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <div className="font-semibold text-slate-700">{s.date}</div>
                        <div className="text-[10px] text-slate-400">With: {peer?.name}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'PENDING'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}