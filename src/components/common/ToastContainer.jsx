/**
 * src/components/common/ToastContainer.jsx
 * Floating toast notification stack for real-time operational feedback,
 * shift swap/leave decisions, and multi-brand assignment workload alerts.
 */


import { useRoster } from '../../context/RosterContext';
import { CheckCircle2, AlertTriangle, Info, X, } from 'lucide-react';

export default function ToastContainer() {
  const { notifications, dismissNotification, currentUser, currentRoleKey } = useRoster();

  // Filter notifications: Managers see all; Employees see general or user-targeted alerts
  const visibleNotifications = notifications.filter((notif) => {
    if (currentRoleKey === 'MANAGER') return true;
    return !notif.targetEmployeeId || notif.targetEmployeeId === currentUser.employeeId;
  });

  if (visibleNotifications.length === 0) return null;

  const renderIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-white/95';
      case 'warning':
        return 'border-amber-300 bg-amber-50/95';
      case 'info':
      default:
        return 'border-sky-200 bg-white/95';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-3">
      {visibleNotifications.map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-300 transform translate-y-0 flex items-start space-x-2.5 ${getBorderColor(
            notif.type
          )}`}
        >
          {renderIcon(notif.type)}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {notif.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {notif.timestamp}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {notif.message}
            </p>
          </div>

          <button
            onClick={() => dismissNotification(notif.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}