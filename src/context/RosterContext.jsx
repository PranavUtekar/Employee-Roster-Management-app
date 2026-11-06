/**
 * src/context/RosterContext.jsx
 * Central state management for Roster data, dynamic role/employee switching,
 * leave lifecycle, peer shift swaps, coverage gap assignments, automated assignments,
 * workload threshold tracking, and multi-brand assignment notifications.
 */

import  { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  EMPLOYEES,
  BRANDS,
  PODS,
  DEMO_USERS
} from '../data/mockData';
import {
  generateMonthlyRoster,
  evaluateBrandCoverage,
  findAvailableBackupCandidates,
  LEAVE_STATUS,
  SHIFT_TYPES
} from '../utils/rosterEngine';

export const SWAP_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export const MAX_SAFE_CONCURRENT_BRANDS = 1;

const RosterContext = createContext(null);

export function RosterProvider({ children }) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(10); // November 2026

  const [currentRoleKey, setCurrentRoleKeyState] = useState('MANAGER');

  const [activeEmployeeProfile, setActiveEmployeeProfile] = useState(
    EMPLOYEES.find((e) => e.id === DEMO_USERS.singleResourceEmployee.employeeId) || EMPLOYEES[0]
  );

  const setCurrentRoleKey = (roleKey, employeeObj = null) => {
    setCurrentRoleKeyState(roleKey);
    if (employeeObj) {
      setActiveEmployeeProfile(employeeObj);
    } else if (roleKey === 'EMPLOYEE_SINGLE') {
      const defaultSingle = EMPLOYEES.find((e) => e.id === DEMO_USERS.singleResourceEmployee.employeeId);
      if (defaultSingle) setActiveEmployeeProfile(defaultSingle);
    } else if (roleKey === 'EMPLOYEE_MULTI') {
      const defaultMulti = EMPLOYEES.find((e) => e.id === DEMO_USERS.multiResourceEmployee.employeeId);
      if (defaultMulti) setActiveEmployeeProfile(defaultMulti);
    }
  };

  const [notifications, setNotifications] = useState([]);

  const showNotification = ({ title, message, type = 'info', targetEmployeeId = null }) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotif = {
      id,
      title,
      message,
      type,
      targetEmployeeId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications((prev) => [...prev, newNotif]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const [leaves, setLeaves] = useState([
    {
      id: 'leave-101',
      employeeId: 'emp-2', // Rahul Sharma (Nova D2C - Single Resource)
      date: '2026-11-05',
      type: 'Casual Leave',
      reason: 'Urgent family work',
      status: LEAVE_STATUS.APPROVED
    },
    {
      id: 'leave-102',
      employeeId: 'emp-10', // Priya Mehta
      date: '2026-11-12',
      type: 'Sick Leave',
      reason: 'Doctor appointment',
      status: LEAVE_STATUS.PENDING
    }
  ]);

  const [swaps, setSwaps] = useState([
    {
      id: 'swap-1',
      requesterId: 'emp-4', // Liam Patel
      targetEmployeeId: 'emp-5', // Aria Tan
      date: '2026-11-16',
      reason: 'Personal emergency swap',
      status: SWAP_STATUS.PENDING
    }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'audit-1',
      timestamp: '2026-11-01 09:30',
      action: 'LEAVE_APPROVED',
      title: 'Leave Approved',
      details: 'Rahul Sharma approved for Casual Leave on 2026-11-05',
      actor: 'Alex K. (Ops Lead)'
    },
    {
      id: 'audit-2',
      timestamp: '2026-11-02 11:15',
      action: 'SWAP_REQUESTED',
      title: 'Swap Request Submitted',
      details: 'Liam Patel requested swap with Aria Tan for 2026-11-16',
      actor: 'Liam Patel'
    }
  ]);

  const logActivity = (action, title, details, actor) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry = {
      id: `audit-${Date.now()}`,
      timestamp: timeStr,
      action,
      title,
      details,
      actor: actor || 'System'
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const [coverageOverrides, setCoverageOverrides] = useState({});

  const baseScheduleMatrix = useMemo(() => {
    return generateMonthlyRoster({
      year: selectedYear,
      month: selectedMonth,
      employees: EMPLOYEES,
      brands: BRANDS,
      leaves
    });
  }, [selectedYear, selectedMonth, leaves]);

  const getEmployeeBrandsForDate = useCallback((employeeId, dateKey, currentOverrides = coverageOverrides) => {
    const assignedBrands = [];

    const baseShift = baseScheduleMatrix[`${employeeId}_${dateKey}`];
    if (baseShift && baseShift.isWorking) {
      BRANDS.forEach((b) => {
        if (b.assignedEmployeeIds.includes(employeeId)) {
          assignedBrands.push(b.name);
        }
      });
    }

    Object.entries(currentOverrides).forEach(([overrideKey, assignedEmpId]) => {
      if (assignedEmpId === employeeId) {
        const [brandId, ...dateParts] = overrideKey.split('_');
        const keyDate = dateParts.join('_');
        if (keyDate === dateKey) {
          const brand = BRANDS.find((b) => b.id === brandId);
          if (brand && !assignedBrands.includes(brand.name)) {
            assignedBrands.push(brand.name);
          }
        }
      }
    });

    return assignedBrands;
  }, [baseScheduleMatrix, coverageOverrides]);

  const scheduleMatrix = useMemo(() => {
    const updatedMatrix = { ...baseScheduleMatrix };

    // Apply approved swaps
    swaps
      .filter((s) => s.status === SWAP_STATUS.APPROVED)
      .forEach((swap) => {
        const reqKey = `${swap.requesterId}_${swap.date}`;
        const targetKey = `${swap.targetEmployeeId}_${swap.date}`;

        const reqShift = updatedMatrix[reqKey];
        const targetShift = updatedMatrix[targetKey];

        if (reqShift && targetShift) {
          updatedMatrix[reqKey] = {
            ...targetShift,
            employeeId: swap.requesterId,
            isOverride: true,
            label: `${targetShift.label} (Swapped)`
          };
          updatedMatrix[targetKey] = {
            ...reqShift,
            employeeId: swap.targetEmployeeId,
            isOverride: true,
            label: `${reqShift.label} (Swapped)`
          };
        }
      });

    // Apply coverage overrides
    Object.entries(coverageOverrides).forEach(([overrideKey, backupEmpId]) => {
      const [brandId, ...dateParts] = overrideKey.split('_');
      const dateKey = dateParts.join('_');
      const targetBrand = BRANDS.find((b) => b.id === brandId);
      const backupScheduleKey = `${backupEmpId}_${dateKey}`;

      const allCoveredBrands = getEmployeeBrandsForDate(backupEmpId, dateKey, coverageOverrides);

      updatedMatrix[backupScheduleKey] = {
        employeeId: backupEmpId,
        date: dateKey,
        isWorking: true,
        isCoveringBrand: true,
        primaryCoveringBrand: targetBrand?.name || 'Brand',
        coveredBrands: allCoveredBrands,
        brandCount: allCoveredBrands.length,
        shiftType: SHIFT_TYPES.WORKING,
        label: allCoveredBrands.length > 1
          ? `Multi-Brand (${allCoveredBrands.length}): ${allCoveredBrands.join(', ')}`
          : `Covering ${targetBrand?.name || 'Brand'}`
      };
    });

    return updatedMatrix;
  }, [baseScheduleMatrix, swaps, coverageOverrides, getEmployeeBrandsForDate]);

  const monthlyCoverageGaps = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const allGaps = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayGaps = evaluateBrandCoverage({
        dateKey,
        brands: BRANDS,
        employees: EMPLOYEES,
        scheduleMatrix
      });

      const unresolvedGaps = dayGaps.filter(
        (gap) => !coverageOverrides[`${gap.brandId}_${gap.date}`]
      );

      allGaps.push(...unresolvedGaps);
    }

    return allGaps;
  }, [selectedYear, selectedMonth, scheduleMatrix, coverageOverrides]);

  const currentUser = useMemo(() => {
    if (currentRoleKey === 'MANAGER') {
      return DEMO_USERS.manager;
    }

    return {
      role: activeEmployeeProfile.role || 'Process Associate',
      name: activeEmployeeProfile.name,
      employeeId: activeEmployeeProfile.id
    };
  }, [currentRoleKey, activeEmployeeProfile]);

  // Helper function to query backup candidates with all business filters
  const getCandidatesForGap = useCallback((brand, dateKey) => {
    return findAvailableBackupCandidates({
      brand,
      dateKey,
      employees: EMPLOYEES,
      scheduleMatrix,
      leaves,
      swaps,
      getEmployeeBrandsForDate
    });
  }, [scheduleMatrix, leaves, swaps, getEmployeeBrandsForDate]);

  // Manual assignment to gap
  const assignBackupToGap = (brandId, dateKey, backupEmployeeId) => {
    const brand = BRANDS.find((b) => b.id === brandId);
    const backupEmp = EMPLOYEES.find((e) => e.id === backupEmployeeId);
    if (!brand || !backupEmp) return;

    const nextOverrides = {
      ...coverageOverrides,
      [`${brandId}_${dateKey}`]: backupEmployeeId
    };
    setCoverageOverrides(nextOverrides);

    const totalBrands = getEmployeeBrandsForDate(backupEmployeeId, dateKey, nextOverrides);
    const hasHighWorkload = totalBrands.length > MAX_SAFE_CONCURRENT_BRANDS;

    logActivity(
      'COVERAGE_ASSIGNED',
      'Backup Reassigned',
      `${backupEmp.name} assigned to cover ${brand.name} on ${dateKey}. Current load: ${totalBrands.length} brand(s) (${totalBrands.join(', ')}).`,
      currentUser.name
    );

    if (hasHighWorkload) {
      showNotification({
        type: 'warning',
        title: 'Workload Threshold Alert',
        message: `${backupEmp.name} is now covering ${totalBrands.length} brands (${totalBrands.join(', ')}) on ${dateKey}. The gap has been resolved and the employee was notified.`
      });
    } else {
      showNotification({
        type: 'success',
        title: 'Coverage Assigned & Gap Cleared',
        message: `${backupEmp.name} assigned to ${brand.name} for ${dateKey}.`
      });
    }

    showNotification({
      type: hasHighWorkload ? 'warning' : 'info',
      targetEmployeeId: backupEmployeeId,
      title: `Assignment Notice: ${brand.name}`,
      message: hasHighWorkload
        ? `You have been assigned to cover ${brand.name} on ${dateKey}. Note: You are handling multiple brand desks (${totalBrands.join(', ')}) on this shift.`
        : `You have been assigned to cover ${brand.name} on ${dateKey}.`
    });
  };

  // Automated Single Gap Assignment
  const autoAssignSingleGap = (gap) => {
    const brand = BRANDS.find((b) => b.id === gap.brandId);
    const eligibleCandidates = getCandidatesForGap(brand, gap.date);

    if (eligibleCandidates.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Auto-Assign Failed',
        message: `No eligible on-duty peer with <= 2 brands found for ${gap.brandName} on ${gap.date}.`
      });
      return false;
    }

    const bestCandidate = eligibleCandidates[0]; // Candidate with lowest brand load
    assignBackupToGap(gap.brandId, gap.date, bestCandidate.id);
    return true;
  };

  // Automated Batch Assignment for ALL unresolved vulnerabilities
  const autoAssignAllGaps = () => {
    let resolvedCount = 0;
    const workingOverrides = { ...coverageOverrides };

    monthlyCoverageGaps.forEach((gap) => {
      const brand = BRANDS.find((b) => b.id === gap.brandId);
      const candidates = findAvailableBackupCandidates({
        brand,
        dateKey: gap.date,
        employees: EMPLOYEES,
        scheduleMatrix,
        leaves,
        swaps,
        getEmployeeBrandsForDate: (empId, dKey) => getEmployeeBrandsForDate(empId, dKey, workingOverrides)
      });

      if (candidates.length > 0) {
        const chosen = candidates[0];
        workingOverrides[`${gap.brandId}_${gap.date}`] = chosen.id;
        resolvedCount++;

        logActivity(
          'AUTO_ASSIGNED',
          'Automated Coverage Match',
          `${chosen.name} automatically matched to cover ${gap.brandName} on ${gap.date}.`,
          'SmartRoster AutoPilot'
        );

        showNotification({
          type: 'info',
          targetEmployeeId: chosen.id,
          title: `Assignment Notice: ${gap.brandName}`,
          message: `Auto-assigned to cover ${gap.brandName} on ${gap.date} based on active duty availability.`
        });
      }
    });

    if (resolvedCount > 0) {
      setCoverageOverrides(workingOverrides);
      showNotification({
        type: 'success',
        title: 'Auto-Assignment Complete',
        message: `Successfully resolved and assigned ${resolvedCount} brand shift vulnerabilities.`
      });
    } else {
      showNotification({
        type: 'warning',
        title: 'Auto-Assign Incomplete',
        message: 'No available on-duty pod peers met all criteria (active shift, not on leave, no swaps, <= 2 brands).'
      });
    }
  };

  const handleLeaveDecision = (leaveId, newStatus) => {
    const targetLeave = leaves.find((l) => l.id === leaveId);
    const emp = EMPLOYEES.find((e) => e.id === targetLeave?.employeeId);

    setLeaves((prevLeaves) =>
      prevLeaves.map((item) =>
        item.id === leaveId ? { ...item, status: newStatus } : item
      )
    );

    if (targetLeave && emp) {
      const isApproved = newStatus === LEAVE_STATUS.APPROVED;
      logActivity(
        isApproved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        `Leave ${isApproved ? 'Approved' : 'Rejected'}`,
        `${emp.name}'s ${targetLeave.type} on ${targetLeave.date} was marked ${newStatus}`,
        currentUser.name
      );

      showNotification({
        type: isApproved ? 'success' : 'warning',
        title: `Leave ${isApproved ? 'Approved' : 'Rejected'}`,
        message: `${emp.name}'s request for ${targetLeave.date} was marked ${newStatus.toLowerCase()}.`
      });

      showNotification({
        type: isApproved ? 'success' : 'warning',
        targetEmployeeId: emp.id,
        title: `Leave ${isApproved ? 'Approved' : 'Declined'}`,
        message: `Your ${targetLeave.type} request for ${targetLeave.date} has been ${newStatus.toLowerCase()} by Operations.`
      });
    }
  };

  const submitLeaveRequest = ({ employeeId, date, type, reason }) => {
    const newLeave = {
      id: `leave-${Date.now()}`,
      employeeId,
      date,
      type,
      reason,
      status: LEAVE_STATUS.PENDING
    };
    setLeaves((prev) => [newLeave, ...prev]);

    const emp = EMPLOYEES.find((e) => e.id === employeeId);
    logActivity(
      'LEAVE_REQUESTED',
      'Leave Requested',
      `${emp?.name || 'Employee'} requested ${type} on ${date}`,
      emp?.name || 'Employee'
    );

    showNotification({
      type: 'info',
      title: 'Leave Submitted',
      message: `Your request for ${date} has been sent to operations for review.`
    });
  };

  const submitSwapRequest = ({ requesterId, targetEmployeeId, date, reason }) => {
    const newSwap = {
      id: `swap-${Date.now()}`,
      requesterId,
      targetEmployeeId,
      date,
      reason,
      status: SWAP_STATUS.PENDING
    };
    setSwaps((prev) => [newSwap, ...prev]);

    const req = EMPLOYEES.find((e) => e.id === requesterId);
    const tar = EMPLOYEES.find((e) => e.id === targetEmployeeId);
    logActivity(
      'SWAP_REQUESTED',
      'Shift Swap Requested',
      `${req?.name} initiated swap with ${tar?.name} for ${date}`,
      req?.name || 'Employee'
    );

    showNotification({
      type: 'info',
      title: 'Shift Swap Proposed',
      message: `Swap request with ${tar?.name} on ${date} submitted for manager authorization.`
    });
  };

  const handleSwapDecision = (swapId, newStatus) => {
    const targetSwap = swaps.find((s) => s.id === swapId);
    const req = EMPLOYEES.find((e) => e.id === targetSwap?.requesterId);
    const tar = EMPLOYEES.find((e) => e.id === targetSwap?.targetEmployeeId);

    setSwaps((prevSwaps) =>
      prevSwaps.map((item) =>
        item.id === swapId ? { ...item, status: newStatus } : item
      )
    );

    if (targetSwap) {
      const isApproved = newStatus === SWAP_STATUS.APPROVED;
      logActivity(
        isApproved ? 'SWAP_APPROVED' : 'SWAP_REJECTED',
        `Shift Swap ${isApproved ? 'Approved' : 'Rejected'}`,
        `Swap between ${req?.name} and ${tar?.name} on ${targetSwap.date} was ${newStatus}`,
        currentUser.name
      );

      showNotification({
        type: isApproved ? 'success' : 'warning',
        title: `Swap ${isApproved ? 'Approved' : 'Rejected'}`,
        message: `Shift swap between ${req?.name} and ${tar?.name} on ${targetSwap.date} has been ${newStatus.toLowerCase()}.`
      });

      if (req) {
        showNotification({
          type: isApproved ? 'success' : 'warning',
          targetEmployeeId: req.id,
          title: `Shift Swap ${isApproved ? 'Approved' : 'Rejected'}`,
          message: `Your shift swap with ${tar?.name} on ${targetSwap.date} was ${newStatus.toLowerCase()}.`
        });
      }
      if (tar) {
        showNotification({
          type: isApproved ? 'success' : 'warning',
          targetEmployeeId: tar.id,
          title: `Shift Swap ${isApproved ? 'Approved' : 'Rejected'}`,
          message: `Your shift swap with ${req?.name} on ${targetSwap.date} was ${newStatus.toLowerCase()}.`
        });
      }
    }
  };

  const value = {
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    currentRoleKey,
    setCurrentRoleKey,
    currentUser,
    employees: EMPLOYEES,
    brands: BRANDS,
    pods: PODS,
    leaves,
    swaps,
    auditLogs,
    notifications,
    showNotification,
    dismissNotification,
    scheduleMatrix,
    coverageOverrides,
    monthlyCoverageGaps,
    assignBackupToGap,
    autoAssignSingleGap,
    autoAssignAllGaps,
    handleLeaveDecision,
    submitLeaveRequest,
    submitSwapRequest,
    handleSwapDecision,
    getEmployeeBrandsForDate,
    findBackupCandidates: getCandidatesForGap
  };

  return (
    <RosterContext.Provider value={value}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
}