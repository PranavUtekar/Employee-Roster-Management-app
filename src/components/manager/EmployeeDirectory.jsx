/**
 * src/components/manager/EmployeeDirectory.jsx
 * Sortable profile directory grid for managers to inspect employee workloads,
 * assigned brands count, pod memberships, and skill qualifications.
 */

import { useState, useMemo } from 'react';
import { useRoster } from '../../context/RosterContext';
import { Users, Search, ArrowUpDown, Briefcase} from 'lucide-react';

export default function EmployeeDirectory() {
  const { employees, brands, pods, coverageOverrides } = useRoster();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('BRANDS_DESC'); // 'BRANDS_DESC', 'NAME_ASC', 'POD_ASC'

  // Compile total assigned companies (primary baseline + active override reassignments)
  const employeeProfiles = useMemo(() => {
    return employees.map((emp) => {
      const pod = pods.find((p) => p.id === emp.podId);

      // 1. Primary brands
      const primaryBrands = brands.filter((b) => b.assignedEmployeeIds.includes(emp.id));

      // 2. Reassigned coverage brands from active overrides
      const overrideBrandIds = new Set();
      Object.entries(coverageOverrides).forEach(([overrideKey, assignedEmpId]) => {
        if (assignedEmpId === emp.id) {
          const [brandId] = overrideKey.split('_');
          overrideBrandIds.add(brandId);
        }
      });

      const additionalCoverBrands = brands.filter((b) => overrideBrandIds.has(b.id) && !primaryBrands.some((pb) => pb.id === b.id));
      const totalBrandsList = [...primaryBrands, ...additionalCoverBrands];

      return {
        ...emp,
        podName: pod?.name || 'General Pod',
        primaryBrands,
        additionalCoverBrands,
        totalBrandsList,
        brandCount: totalBrandsList.length
      };
    });
  }, [employees, brands, pods, coverageOverrides]);

  // Search & Sorting
  const filteredAndSortedProfiles = useMemo(() => {
    let list = employeeProfiles.filter((emp) => {
      const query = searchQuery.toLowerCase();
      const matchesName = emp.name.toLowerCase().includes(query);
      const matchesRole = emp.role.toLowerCase().includes(query);
      const matchesBrand = emp.totalBrandsList.some((b) => b.name.toLowerCase().includes(query));
      return matchesName || matchesRole || matchesBrand;
    });

    switch (sortBy) {
      case 'BRANDS_DESC':
        list.sort((a, b) => b.brandCount - a.brandCount);
        break;
      case 'NAME_ASC':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'POD_ASC':
        list.sort((a, b) => a.podName.localeCompare(b.podName));
        break;
      default:
        break;
    }

    return list;
  }, [employeeProfiles, searchQuery, sortBy]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      
      {/* Top Header & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-4 h-4 text-sky-600" />
            <span>Employee Profile & Brand Assignment Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor workload distribution, assigned companies, and skill qualifications across the team.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search employee or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 w-48 sm:w-56"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="BRANDS_DESC">Sort: Most Brands First</option>
              <option value="NAME_ASC">Sort: Name (A-Z)</option>
              <option value="POD_ASC">Sort: Pod Group</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Employee Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
        {filteredAndSortedProfiles.map((emp) => {
          const isHeavyLoad = emp.brandCount > 1;

          return (
            <div
              key={emp.id}
              className={`p-4 rounded-xl border transition-all ${
                isHeavyLoad
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Profile Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs leading-tight">{emp.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{emp.podName} • {emp.role}</div>
                  </div>
                </div>

                {/* Brand Count Badge */}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    isHeavyLoad
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}
                  title={`${emp.brandCount} active brand assignment(s)`}
                >
                  {emp.brandCount} {emp.brandCount === 1 ? 'Brand' : 'Brands'}
                </span>
              </div>

              {/* Assigned Brands Section */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  <span>Assigned Companies</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {emp.totalBrandsList.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">No assigned brands</span>
                  ) : (
                    emp.totalBrandsList.map((brand) => (
                      <span
                        key={brand.id}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-2xs"
                      >
                        {brand.name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Skills & Off-Days Footer */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <div className="truncate max-w-[170px]" title={emp.skills.join(', ')}>
                  Skills: {emp.skills.slice(0, 2).join(', ')}{emp.skills.length > 2 ? '...' : ''}
                </div>
                <div className="font-medium text-slate-400">
                  Off: {emp.fixedOffDay.slice(0, 3)} / {emp.staggeredOffDay.slice(0, 3)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}