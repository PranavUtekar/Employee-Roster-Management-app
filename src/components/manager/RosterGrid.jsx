/**
 * src/components/manager/RosterGrid.jsx
 * Operations Manager interactive grid view displaying employees, pods,
 * scheduled shifts, offs, leaves, swapped shifts, multi-brand assignments,
 * and highlighted coverage gaps. Includes quick CSV export for operations reporting.
 */

import { useState, useMemo } from 'react';
import { useRoster } from '../../context/RosterContext';
import { SHIFT_TYPES } from '../../utils/rosterEngine';
import { Search, Filter, AlertTriangle, Download, ArrowLeftRight, Briefcase } from 'lucide-react';

export default function RosterGrid() {
  const {
    selectedYear,
    selectedMonth,
    employees,
    pods,
    scheduleMatrix,
    monthlyCoverageGaps,
    brands
  } = useRoster();

  const [selectedPodId, setSelectedPodId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Number of days in active month
  const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dayIndices = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Filter employees based on active pod filter and search
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesPod = selectedPodId === 'ALL' || employee.podId === selectedPodId;
      const matchesSearch =
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPod && matchesSearch;
    });
  }, [employees, selectedPodId, searchQuery]);

  // Lookup map for fast gap matching: `${brandId}_${dateKey}`
  const gapsMap = useMemo(() => {
    const map = new Map();
    monthlyCoverageGaps.forEach((gap) => {
      map.set(`${gap.brandId}_${gap.date}`, gap);
    });
    return map;
  }, [monthlyCoverageGaps]);

  // CSV Export functionality
  const handleExportCSV = () => {
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });
    const headers = ['Employee Name', 'Role', 'Pod', ...dayIndices.map((d) => `Day ${d}`)];

    const rows = filteredEmployees.map((employee) => {
      const pod = pods.find((p) => p.id === employee.podId);
      const rowData = [
        `"${employee.name}"`,
        employee.role,
        `"${pod?.name || ''}"`
      ];

      dayIndices.forEach((day) => {
        const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const shift = scheduleMatrix[`${employee.id}_${dateKey}`];
        if (!shift) {
          rowData.push('N/A');
        } else if (shift.isCoveringBrand) {
          rowData.push(`COVERING (${shift.primaryCoveringBrand || 'BRAND'})`);
        } else if (shift.isOverride) {
          rowData.push('SWAP');
        } else {
          rowData.push(shift.shiftType);
        }
      });

      return rowData.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Roster_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render badge based on shift status
  const renderShiftCell = (employee, day) => {
    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const scheduleKey = `${employee.id}_${dateKey}`;
    const shift = scheduleMatrix[scheduleKey];

    // Check if employee is assigned to a brand that currently has an unstaffed gap today
    const employeeBrands = brands.filter((b) => b.assignedEmployeeIds.includes(employee.id));
    const hasUnstaffedBrandGap = employeeBrands.some((b) => gapsMap.has(`${b.id}_${dateKey}`));

    if (hasUnstaffedBrandGap && (!shift || !shift.isWorking)) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 mr-0.5 text-rose-600 shrink-0" />
          Gap!
        </span>
      );
    }

    if (!shift) {
      return <span className="text-slate-300 text-xs">-</span>;
    }

    // Explicitly assigned to cover a brand
    if (shift.isCoveringBrand) {
      const isMulti = shift.brandCount && shift.brandCount > 1;
      return (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
            isMulti
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-teal-50 text-teal-800 border-teal-300'
          }`}
          title={shift.label}
        >
          <Briefcase className="w-2.5 h-2.5 mr-0.5 shrink-0 opacity-80" />
          {isMulti ? `${shift.brandCount} Brands` : 'Cover'}
        </span>
      );
    }

    if (shift.isOverride) {
      return (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
          title={shift.label}
        >
          <ArrowLeftRight className="w-2.5 h-2.5 mr-0.5 text-indigo-500 shrink-0" />
          Swap
        </span>
      );
    }

    if (shift.shiftType === SHIFT_TYPES.LEAVE) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Leave
        </span>
      );
    }

    if (shift.shiftType === SHIFT_TYPES.WEEKLY_OFF) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
          Off
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        Shift
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Top Filter & Search Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pod:</span>
          </div>
          <div className="flex flex-wrap items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setSelectedPodId('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedPodId === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Pods
            </button>
            {pods.map((pod) => (
              <button
                key={pod.id}
                onClick={() => setSelectedPodId(pod.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedPodId === pod.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pod.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search input & Export Action */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white w-48 text-slate-800"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            title="Download CSV of current view"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10 w-52 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Employee ({filteredEmployees.length})
              </th>
              {dayIndices.map((day) => {
                const dateObj = new Date(selectedYear, selectedMonth, day);
                const dayShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()];
                const isSunday = dateObj.getDay() === 0;

                return (
                  <th
                    key={day}
                    className={`py-2 px-1 text-center min-w-[48px] border-l border-slate-100 ${
                      isSunday ? 'bg-slate-100/60 font-bold text-slate-700' : ''
                    }`}
                  >
                    <div>{day}</div>
                    <div className="text-[9px] font-normal text-slate-400">{dayShort}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredEmployees.map((employee) => {
              const pod = pods.find((p) => p.id === employee.podId);

              return (
                <tr key={employee.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 sticky left-0 bg-white z-10 font-medium text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 leading-tight">
                          {employee.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {pod?.name} • {employee.role}
                        </div>
                      </div>
                    </div>
                  </td>

                  {dayIndices.map((day) => {
                    const dateObj = new Date(selectedYear, selectedMonth, day);
                    const isSunday = dateObj.getDay() === 0;

                    return (
                      <td
                        key={day}
                        className={`py-2 px-1 text-center border-l border-slate-100 ${
                          isSunday ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        {renderShiftCell(employee, day)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}