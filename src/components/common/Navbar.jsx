/**
 * src/components/common/Navbar.jsx
 * Top navigation header with role switcher, employee selector dropdown,
 * month picker, active user indicator, and passcode authentication for Manager access.
 */

import { useState } from 'react';
import { useRoster } from '../../context/RosterContext';
import { DEMO_USERS } from '../../data/mockData';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Lock,
  X,
  KeyRound,
  ChevronDown
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Navbar() {
  const {
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    currentRoleKey,
    setCurrentRoleKey,
    currentUser,
    employees,
    brands
  } = useRoster();

  // Modal and passcode states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Dropdown state for selecting specific employees
  const [isEmployeeMenuOpen, setIsEmployeeMenuOpen] = useState(false);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const handleManagerClick = () => {
    if (currentRoleKey === 'MANAGER') return;
    setPasscodeInput('');
    setAuthError('');
    setIsAuthModalOpen(true);
    setIsEmployeeMenuOpen(false);
  };

  const handleSelectEmployee = (employee) => {
    // Determine whether this employee belongs to a single-resource brand
    const assignedBrand = brands.find((b) => b.assignedEmployeeIds.includes(employee.id));
    const roleKey = assignedBrand?.modelType === 'SINGLE_RESOURCE' ? 'EMPLOYEE_SINGLE' : 'EMPLOYEE_MULTI';

    // Set custom employee persona in context
    setCurrentRoleKey(roleKey, employee);
    setIsEmployeeMenuOpen(false);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const correctPasscode = DEMO_USERS.manager.passcode || 'admin123';

    if (passcodeInput.trim() === correctPasscode) {
      setCurrentRoleKey('MANAGER');
      setIsAuthModalOpen(false);
      setPasscodeInput('');
      setAuthError('');
    } else {
      setAuthError('Incorrect passcode. Use "admin123" for demo access.');
    }
  };

  const isEmployeeMode = currentRoleKey !== 'MANAGER';

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 leading-tight">SmartRoster Ops</div>
                <div className="text-xs text-slate-500 font-medium">Multi-Brand Pod Management</div>
              </div>
            </div>

            {/* Month Selector */}
            <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1 rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-700 px-3 min-w-[130px] text-center">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1 rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Role / Persona Switcher */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs font-medium border border-slate-200 relative">
                
                {/* Manager Toggle */}
                <button
                  onClick={handleManagerClick}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    currentRoleKey === 'MANAGER'
                      ? 'bg-white text-sky-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Manager</span>
                  {currentRoleKey !== 'MANAGER' && (
                    <Lock className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                  )}
                </button>

                {/* Employee Switcher Dropdown Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setIsEmployeeMenuOpen((prev) => !prev)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      isEmployeeMode
                        ? 'bg-white text-sky-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {isEmployeeMode ? currentUser.name : 'Switch Employee'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                  </button>

                  {/* Dropdown Menu listing all employees */}
                  {isEmployeeMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsEmployeeMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 max-h-80 overflow-y-auto">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          Select Employee Login
                        </div>
                        {employees.map((emp) => {
                          const isCurrent = currentUser?.employeeId === emp.id;
                          const brand = brands.find((b) => b.assignedEmployeeIds.includes(emp.id));

                          return (
                            <button
                              key={emp.id}
                              onClick={() => handleSelectEmployee(emp)}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                                isCurrent ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700'
                              }`}
                            >
                              <div>
                                <div className="text-xs font-medium">{emp.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  {brand?.name || 'Operations'} • {emp.role}
                                </div>
                              </div>
                              {isCurrent && (
                                <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">
                                  Active
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

              </div>

              {/* Current Active Persona Badge */}
              <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200 text-xs">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-800">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">
                    {currentUser.role}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Manager Passcode Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAuthModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Manager Passcode</h3>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enter the manager passcode to access scheduling controls, approvals, and pod reassignments.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter passcode (admin123)"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 focus:bg-white text-slate-800"
                />
                {authError && (
                  <p className="text-rose-600 text-[11px] font-medium mt-1.5">{authError}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-1/2 py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 px-3 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Unlock Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}