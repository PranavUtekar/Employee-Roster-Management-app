/**
 * src/components/manager/LeaveApprovals.jsx
 * Leave approvals view enabling operations leads to approve/reject
 * requests with live impact on the roster and brand coverage.
 */


import { useRoster } from '../../context/RosterContext';
import { LEAVE_STATUS } from '../../utils/rosterEngine';
import { Check, X, CalendarDays } from 'lucide-react';

export default function LeaveApprovals() {
  const { leaves, employees, brands, handleLeaveDecision } = useRoster();

  const pendingLeaves = leaves.filter((l) => l.status === LEAVE_STATUS.PENDING);
  const reviewedLeaves = leaves.filter((l) => l.status !== LEAVE_STATUS.PENDING);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Leave Requests & Coverage Pipeline</h2>
          <p className="text-xs text-slate-500">
            Review incoming employee time-off requests. Approvals automatically update the roster grid.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
          {pendingLeaves.length} Pending
        </span>
      </div>

      {pendingLeaves.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
          No pending leave requests awaiting approval.
        </div>
      ) : (
        <div className="space-y-2.5 mb-5">
          {pendingLeaves.map((req) => {
            const employee = employees.find((e) => e.id === req.employeeId);
            const assignedBrand = brands.find((b) => b.assignedEmployeeIds.includes(req.employeeId));

            return (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                    {employee?.name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      {employee?.name}{' '}
                      {assignedBrand && (
                        <span className="font-normal text-slate-500">({assignedBrand.name})</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <span className="flex items-center">
                        <CalendarDays className="w-3 h-3 mr-1 text-slate-400" />
                        {req.date}
                      </span>
                      <span>•</span>
                      <span>{req.type}: "{req.reason}"</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLeaveDecision(req.id, LEAVE_STATUS.APPROVED)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleLeaveDecision(req.id, LEAVE_STATUS.REJECTED)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recently Processed Leaves */}
      {reviewedLeaves.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Recently Processed
          </div>
          <div className="space-y-1.5">
            {reviewedLeaves.slice(0, 3).map((item) => {
              const emp = employees.find((e) => e.id === item.employeeId);
              const isApproved = item.status === LEAVE_STATUS.APPROVED;

              return (
                <div key={item.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600">
                    <strong className="text-slate-800 font-medium">{emp?.name}</strong> — {item.date} ({item.type})
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}