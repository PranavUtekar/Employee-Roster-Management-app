/**
 * src/components/manager/GapAlerts.jsx
 * Single-line row layout for unstaffed brand shifts with automated
 * assignment controls (per-row auto-fill and global Auto-Assign All).
 * Enforces duty, leave, swap, and <= 2 brand threshold checks.
 */

import { useState } from 'react';
import { useRoster } from '../../context/RosterContext';
import {
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles
} from 'lucide-react';

export default function GapAlerts() {
  const {
    monthlyCoverageGaps,
    brands,
    findBackupCandidates,
    assignBackupToGap,
    autoAssignSingleGap,
    autoAssignAllGaps,
    coverageOverrides,
    employees
  } = useRoster();

  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [showResolved, setShowResolved] = useState(false);

  const handleSelectChange = (gapKey, employeeId) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [gapKey]: employeeId
    }));
  };

  const handleManualAssign = (gap) => {
    const gapKey = `${gap.brandId}_${gap.date}`;
    const brand = brands.find((b) => b.id === gap.brandId);
    const candidates = findBackupCandidates(brand, gap.date);
    const backupId = selectedCandidates[gapKey] || candidates[0]?.id;

    if (!backupId) return;

    assignBackupToGap(gap.brandId, gap.date, backupId);

    setSelectedCandidates((prev) => {
      const copy = { ...prev };
      delete copy[gapKey];
      return copy;
    });
  };

  const resolvedList = Object.entries(coverageOverrides).map(([key, empId]) => {
    const [brandId, ...dateParts] = key.split('_');
    const dateKey = dateParts.join('_');
    const brand = brands.find((b) => b.id === brandId);
    const emp = employees.find((e) => e.id === empId);
    return { key, brand, emp, date: dateKey };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Brand Coverage Vulnerabilities</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-assigns on-duty pod peers with &le; 2 brands, no leaves, and no pending swap requests.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {monthlyCoverageGaps.length > 0 && (
            <button
              onClick={autoAssignAllGaps}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Automatically match on-duty pod peers to all pending gaps"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Assign All Gaps</span>
            </button>
          )}

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
              monthlyCoverageGaps.length === 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {monthlyCoverageGaps.length === 0
              ? 'All Brands Staffed'
              : `${monthlyCoverageGaps.length} Unstaffed Shift${monthlyCoverageGaps.length > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Main Single-Line Row List */}
      {monthlyCoverageGaps.length === 0 ? (
        <div className="flex items-center justify-center space-x-2 py-6 border border-dashed border-emerald-200 bg-emerald-50/40 rounded-lg text-xs font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Zero active brand gaps. All operational shifts are covered.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] space-y-2">
            {monthlyCoverageGaps.map((gap) => {
              const gapKey = `${gap.brandId}_${gap.date}`;
              const brand = brands.find((b) => b.id === gap.brandId);
              const candidates = findBackupCandidates(brand, gap.date);
              const selectedEmployeeId = selectedCandidates[gapKey] || candidates[0]?.id || '';
              const isSingle = brand?.modelType === 'SINGLE_RESOURCE';

              return (
                <div
                  key={gapKey}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors gap-3"
                >
                  {/* Left: Brand Name & Model Badge */}
                  <div className="flex items-center space-x-2 shrink-0 w-48">
                    <span className="font-bold text-slate-900 text-xs truncate">{gap.brandName}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0 ${
                        isSingle
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isSingle ? 'Single-Resource' : 'Multi-Resource'}
                    </span>
                  </div>

                  {/* Middle Left: Date */}
                  <span className="inline-flex items-center text-xs font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                    {gap.date}
                  </span>

                  {/* Middle: Reason */}
                  <div className="text-[11px] text-rose-700 font-medium truncate flex-1 px-2">
                    {gap.reason}
                  </div>

                  {/* Right: Inline Controls (Auto-Match, Peer Selector, Manual Assign) */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {candidates.length > 0 ? (
                      <>
                        {/* 1-Click Auto Assign for this specific gap */}
                        <button
                          onClick={() => autoAssignSingleGap(gap)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                          title="Auto-assign best eligible pod peer (lowest workload)"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Auto</span>
                        </button>

                        {/* Peer Selector Dropdown */}
                        <select
                          value={selectedEmployeeId}
                          onChange={(e) => handleSelectChange(gapKey, e.target.value)}
                          className="w-48 text-xs p-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                        >
                          {candidates.map((cand) => (
                            <option key={cand.id} value={cand.id}>
                              {cand.name} ({cand.status})
                            </option>
                          ))}
                        </select>

                        {/* Manual Reassign Button */}
                        <button
                          onClick={() => handleManualAssign(gap)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                          title="Assign selected peer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Reassign</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-semibold text-rose-600 bg-rose-100 px-2 py-1 rounded">
                        No On-Duty Peer with &le; 2 Brands
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved History */}
      {resolvedList.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowResolved((prev) => !prev)}
            className="flex items-center justify-between w-full text-left text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Resolved Overrides This Month ({resolvedList.length})</span>
            </span>
            {showResolved ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {showResolved && (
            <div className="mt-2.5 space-y-1.5">
              {resolvedList.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-teal-50/60 border border-teal-200"
                >
                  <div className="text-slate-700">
                    <strong>{item.emp?.name}</strong> assigned to cover{' '}
                    <strong>{item.brand?.name}</strong> on <strong>{item.date}</strong>
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    Active Override
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}