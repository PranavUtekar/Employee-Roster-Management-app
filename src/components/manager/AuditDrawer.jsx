/**
 * src/components/manager/AuditDrawer.jsx
 * Slide-out drawer displaying an activity trail for roster modifications,
 * leave authorizations, swap resolutions, and coverage reassignments.
 */

import { useRoster } from '../../context/RosterContext';
import { X, History, CheckCircle, XCircle, ArrowLeftRight, UserCheck, Calendar } from 'lucide-react';

export default function AuditDrawer({ isOpen, onClose }) {
  const { auditLogs } = useRoster();

  if (!isOpen) return null;

  const getActionBadge = (action) => {
    switch (action) {
      case 'LEAVE_APPROVED':
        return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'LEAVE_REJECTED':
      case 'SWAP_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'SWAP_REQUESTED':
      case 'SWAP_APPROVED':
        return <ArrowLeftRight className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'COVERAGE_ASSIGNED':
        return <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Operational Audit Log</h2>
                <p className="text-xs text-slate-500">Live trail of actions, approvals & reassignments</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Activity Timeline List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No activity logged yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="mt-0.5">{getActionBadge(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {log.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      {log.details}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1.5">
                      Triggered by: <span className="font-semibold text-slate-700">{log.actor}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}