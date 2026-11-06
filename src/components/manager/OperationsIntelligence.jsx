/**
 * src/components/manager/OperationsIntelligence.jsx
 * Operational status overview and automated scheduling recommendations.
 * Computes coverage health, staffing ratios, and audits swaps for skill/schedule conflicts.
 */

import { useMemo } from 'react';
import { useRoster, SWAP_STATUS } from '../../context/RosterContext';
import { LEAVE_STATUS, SHIFT_TYPES } from '../../utils/rosterEngine';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Users,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function OperationsIntelligence() {
  const {
    employees,
    brands,
    pods,
    leaves,
    swaps,
    monthlyCoverageGaps,
    scheduleMatrix,
    selectedYear,
    selectedMonth
  } = useRoster();

  // 1. Core KPIs
  const kpis = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const totalBrandDays = brands.length * daysInMonth;
    const gapCount = monthlyCoverageGaps.length;
    const coveragePercentage = totalBrandDays > 0
      ? Math.max(0, Math.round(((totalBrandDays - gapCount) / totalBrandDays) * 100))
      : 100;

    const pendingLeavesCount = leaves.filter((l) => l.status === LEAVE_STATUS.PENDING).length;
    const pendingSwapsCount = swaps.filter((s) => s.status === SWAP_STATUS.PENDING).length;
    const approvedLeavesCount = leaves.filter((l) => l.status === LEAVE_STATUS.APPROVED).length;

    return {
      coveragePercentage,
      gapCount,
      pendingLeavesCount,
      pendingSwapsCount,
      approvedLeavesCount
    };
  }, [brands, monthlyCoverageGaps, leaves, swaps, selectedYear, selectedMonth]);

  // 2. Pod Staffing & Health Distribution
  const podStats = useMemo(() => {
    return pods.map((pod) => {
      const podEmployees = employees.filter((e) => e.podId === pod.id);
      const podBrands = brands.filter((b) => b.podId === pod.id);
      const podGaps = monthlyCoverageGaps.filter((g) =>
        podBrands.some((pb) => pb.id === g.brandId)
      );

      return {
        id: pod.id,
        name: pod.name,
        color: pod.color,
        employeeCount: podEmployees.length,
        brandCount: podBrands.length,
        gapCount: podGaps.length,
        isHealthy: podGaps.length === 0
      };
    });
  }, [pods, employees, brands, monthlyCoverageGaps]);

  // 3. Automated Diagnostics & Recommendations Engine
  const recommendations = useMemo(() => {
    const items = [];

    // Diagnostic A: Audit Pending Swaps for Skill or Schedule Conflicts
    swaps
      .filter((s) => s.status === SWAP_STATUS.PENDING)
      .forEach((swap) => {
        const req = employees.find((e) => e.id === swap.requesterId);
        const target = employees.find((e) => e.id === swap.targetEmployeeId);

        if (!req || !target) return;

        // Check 1: Do both teammates have common skill sets?
        const hasSkillOverlap = req.skills.some((skill) => target.skills.includes(skill));

        // Check 2: Are both employees scheduled on weekly off or leave on that day?
        const reqShift = scheduleMatrix[`${req.id}_${swap.date}`];
        const targetShift = scheduleMatrix[`${target.id}_${swap.date}`];

        const reqIsOff = reqShift?.shiftType === SHIFT_TYPES.WEEKLY_OFF || reqShift?.shiftType === SHIFT_TYPES.LEAVE;
        const targetIsOff = targetShift?.shiftType === SHIFT_TYPES.WEEKLY_OFF || targetShift?.shiftType === SHIFT_TYPES.LEAVE;

        if (!hasSkillOverlap) {
          items.push({
            id: `rec-skill-${swap.id}`,
            type: 'WARNING',
            title: `Skill Mismatch Risk: Swap #${swap.id.slice(-4)}`,
            detail: `${req.name} and ${target.name} do not share identical platform tags. Approving this swap may reduce coverage quality.`,
            actionLabel: 'Review Swap Request'
          });
        }

        if (reqIsOff && targetIsOff) {
          items.push({
            id: `rec-off-${swap.id}`,
            type: 'CONFLICT',
            title: `Redundant Swap Detected`,
            detail: `Both ${req.name} and ${target.name} are scheduled OFF on ${swap.date}. A mutual swap provides no active desk coverage.`,
            actionLabel: 'Check Off Schedules'
          });
        }
      });

    // Diagnostic B: Single-Resource Brand Vulnerability
    brands
      .filter((b) => b.modelType === 'SINGLE_RESOURCE')
      .forEach((brand) => {
        const assignedEmpId = brand.assignedEmployeeIds[0];
        const assignedEmp = employees.find((e) => e.id === assignedEmpId);
        const hasPendingLeave = leaves.some(
          (l) => l.employeeId === assignedEmpId && l.status === LEAVE_STATUS.PENDING
        );

        if (hasPendingLeave) {
          items.push({
            id: `rec-single-${brand.id}`,
            type: 'SUGGESTION',
            title: `Proactive Backup Needed for ${brand.name}`,
            detail: `${assignedEmp?.name} has requested leave. Because ${brand.name} operates on a single-resource model, pre-assigning a pod peer is recommended.`,
            actionLabel: 'Review Pending Leaves'
          });
        }
      });

    // Fallback if system is clean
    if (items.length === 0) {
      items.push({
        id: 'rec-optimal',
        type: 'OPTIMAL',
        title: 'Optimal Scheduling Integrity',
        detail: 'All brand operational matrices, pod peer qualifications, and swap requests satisfy operational policy requirements.',
        actionLabel: null
      });
    }

    return items;
  }, [swaps, employees, scheduleMatrix, brands, leaves]);

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Coverage Health
            </span>
            <ShieldCheck className={`w-4 h-4 ${kpis.coveragePercentage === 100 ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1.5">
            {kpis.coveragePercentage}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {kpis.gapCount === 0 ? 'All brand shifts covered' : `${kpis.gapCount} unassigned gaps`}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Action Queue
            </span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1.5">
            {kpis.pendingLeavesCount + kpis.pendingSwapsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {kpis.pendingLeavesCount} leaves • {kpis.pendingSwapsCount} swaps
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Leaves
            </span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1.5">
            {kpis.approvedLeavesCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Approved this month
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pod Distribution
            </span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1.5">
            {pods.length} Pods
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {employees.length} active resources
          </p>
        </div>
      </div>

      {/* Pod Breakdown + Automation Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pod Distribution Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Pod Staffing & Coverage</span>
          </h2>
          <div className="space-y-2.5">
            {podStats.map((pod) => (
              <div
                key={pod.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">{pod.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {pod.employeeCount} Members • {pod.brandCount} Brands
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    pod.isHealthy
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {pod.isHealthy ? '100% Staffed' : `${pod.gapCount} Gaps`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Automated Recommendations & Risk Diagnostics */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Automated Scheduling Diagnostics & Suggestions</span>
            </h2>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              AI Engine
            </span>
          </div>

          <div className="space-y-2.5">
            {recommendations.map((rec) => {
              const isWarning = rec.type === 'WARNING';
              const isConflict = rec.type === 'CONFLICT';
              const isOptimal = rec.type === 'OPTIMAL';

              return (
                <div
                  key={rec.id}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs transition-colors ${
                    isConflict
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : isWarning
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : isOptimal
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-sky-50/70 border-sky-200 text-sky-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {isOptimal ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isConflict ? 'text-rose-600' : 'text-amber-600'}`} />
                    )}
                    <div>
                      <div className="font-bold leading-tight">{rec.title}</div>
                      <div className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{rec.detail}</div>
                    </div>
                  </div>

                  {rec.actionLabel && (
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded bg-white/80 border border-current opacity-80 flex items-center space-x-1">
                      <span>{rec.actionLabel}</span>
                      <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}