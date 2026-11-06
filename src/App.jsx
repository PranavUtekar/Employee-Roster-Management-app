/**
 * src/App.jsx
 * Main application container orchestrating persona-based views,
 * navigation header, operations dashboard, employee directory,
 * intelligent diagnostics, audit trail drawer, and floating alert notifications.
 */

import { useState } from 'react';
import { RosterProvider, useRoster } from './context/RosterContext';
import Navbar from './components/common/Navbar';
import OperationsIntelligence from './components/manager/OperationsIntelligence';
import EmployeeDirectory from './components/manager/EmployeeDirectory';
import RosterGrid from './components/manager/RosterGrid';
import GapAlerts from './components/manager/GapAlerts';
import LeaveApprovals from './components/manager/LeaveApprovals';
import SwapApprovals from './components/manager/SwapApprovals';
import AuditDrawer from './components/manager/AuditDrawer';
import ToastContainer from './components/common/ToastContainer';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import { History } from 'lucide-react';

function AppContent() {
  const { currentRoleKey } = useRoster();
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRoleKey === 'MANAGER' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Operations Control Center</h1>
                <p className="text-xs text-slate-500">
                  Monitor pod staffing, review diagnostics, approve leaves, manage swaps, and resolve coverage gaps.
                </p>
              </div>
              <button
                onClick={() => setIsAuditOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>View Audit Trail</span>
              </button>
            </div>

            {/* Metrics & Automation Intelligence */}
            <OperationsIntelligence />

            {/* Gap Alerts & Actions - Strict Single-Line Rows */}
            <GapAlerts />

            {/* Employee Profile Directory & Brand Workload Grid */}
            <EmployeeDirectory />

            {/* Approvals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeaveApprovals />
              <SwapApprovals />
            </div>

            {/* Interactive Monthly Roster Grid */}
            <RosterGrid />

            {/* Slide-out Activity Log Drawer */}
            <AuditDrawer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
          </div>
        ) : (
          <EmployeeDashboard />
        )}
      </main>

      {/* Global floating toast alerts */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <RosterProvider>
      <AppContent />
    </RosterProvider>
  );
}