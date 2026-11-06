/**
 * src/components/manager/SwapApprovals.jsx
 * Allows Operations Leads to review and approve peer shift swaps.
 */

import { useRoster, SWAP_STATUS } from '../../context/RosterContext';
import { ArrowLeftRight, Check, X, Calendar } from 'lucide-react';

export default function SwapApprovals() {
  const { swaps, employees, handleSwapDecision } = useRoster();

  const pendingSwaps = swaps.filter((s) => s.status === SWAP_STATUS.PENDING);
  const processedSwaps = swaps.filter((s) => s.status !== SWAP_STATUS.PENDING);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <ArrowLeftRight className="w-4 h-4 text-sky-600" />
            <span>Shift Swap Requests</span>
          </h2>
          <p className="text-xs text-slate-500">
            Review peer shift swap agreements between pod teammates.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
          {pendingSwaps.length} Pending
        </span>
      </div>

      {pendingSwaps.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
          No pending shift swap requests.
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {pendingSwaps.map((swap) => {
            const requester = employees.find((e) => e.id === swap.requesterId);
            const target = employees.find((e) => e.id === swap.targetEmployeeId);

            return (
              <div
                key={swap.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-800">{requester?.name}</span>
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-800">{target?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                      {swap.date}
                    </span>
                    <span>•</span>
                    <span>Reason: "{swap.reason}"</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => handleSwapDecision(swap.id, SWAP_STATUS.APPROVED)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleSwapDecision(swap.id, SWAP_STATUS.REJECTED)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors"
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

      {processedSwaps.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Recently Processed Swaps
          </div>
          <div className="space-y-1.5">
            {processedSwaps.slice(0, 3).map((swap) => {
              const req = employees.find((e) => e.id === swap.requesterId);
              const tar = employees.find((e) => e.id === swap.targetEmployeeId);
              const isApproved = swap.status === SWAP_STATUS.APPROVED;

              return (
                <div key={swap.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600">
                    <strong>{req?.name}</strong> ↔ <strong>{tar?.name}</strong> ({swap.date})
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {swap.status}
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