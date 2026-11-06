/**
 * src/utils/rosterEngine.js
 * Algorithmic scheduling engine for deterministic monthly roster generation,
 * operational coverage audits, and intelligent pod backup matching.
 */

export const SHIFT_TYPES = {
  WORKING: 'WORKING',
  WEEKLY_OFF: 'WEEKLY_OFF',
  LEAVE: 'LEAVE'
};

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Generates the baseline deterministic schedule for all employees across the month.
 */
export function generateMonthlyRoster({ year, month, employees, brands, leaves = [] }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const matrix = {};

  employees.forEach((employee) => {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dayName = DAY_NAMES[dateObj.getDay()];
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const scheduleKey = `${employee.id}_${dateKey}`;

      // 1. Check for approved leave
      const activeLeave = leaves.find(
        (l) => l.employeeId === employee.id && l.date === dateKey && l.status === LEAVE_STATUS.APPROVED
      );

      if (activeLeave) {
        matrix[scheduleKey] = {
          employeeId: employee.id,
          date: dateKey,
          shiftType: SHIFT_TYPES.LEAVE,
          isWorking: false,
          label: 'Leave',
          leaveType: activeLeave.type
        };
        continue;
      }

      // 2. Check for fixed or staggered weekly off
      const isFixedOff = employee.fixedOffDay === dayName;
      const isStaggeredOff = employee.staggeredOffDay === dayName;

      if (isFixedOff || isStaggeredOff) {
        matrix[scheduleKey] = {
          employeeId: employee.id,
          date: dateKey,
          shiftType: SHIFT_TYPES.WEEKLY_OFF,
          isWorking: false,
          label: 'Off'
        };
        continue;
      }

      // 3. Normal Working Shift
      const brand = brands.find((b) => b.assignedEmployeeIds.includes(employee.id));
      matrix[scheduleKey] = {
        employeeId: employee.id,
        date: dateKey,
        shiftType: SHIFT_TYPES.WORKING,
        isWorking: true,
        label: 'Shift',
        brandId: brand?.id || null,
        brandName: brand?.name || 'General Pod'
      };
    }
  });

  return matrix;
}

/**
 * Audits brand coverage for genuine operational gaps.
 * Skips standard company-wide rest days (Sunday).
 */
export function evaluateBrandCoverage({ dateKey, brands, employees, scheduleMatrix }) {
  const gaps = [];
  const dateObj = new Date(dateKey);
  const dayName = DAY_NAMES[dateObj.getDay()];

  if (dayName === 'Sunday') {
    return gaps;
  }

  brands.forEach((brand) => {
    const assignedEmps = employees.filter((e) => brand.assignedEmployeeIds.includes(e.id));

    const workingCount = assignedEmps.filter((emp) => {
      const shift = scheduleMatrix[`${emp.id}_${dateKey}`];
      return shift && shift.isWorking;
    }).length;

    const minRequired = brand.modelType === 'SINGLE_RESOURCE' ? 1 : Math.max(1, brand.minActiveResources || 1);

    if (workingCount < minRequired) {
      const handlerOnLeave = assignedEmps.find((emp) => {
        const shift = scheduleMatrix[`${emp.id}_${dateKey}`];
        return shift && shift.shiftType === SHIFT_TYPES.LEAVE;
      });

      gaps.push({
        brandId: brand.id,
        brandName: brand.name,
        podId: brand.podId,
        date: dateKey,
        dayName,
        required: minRequired,
        current: workingCount,
        reason: handlerOnLeave
          ? `Primary handler (${handlerOnLeave.name}) is on approved leave.`
          : `Designated resource is on scheduled weekly off (${dayName}).`
      });
    }
  });

  return gaps;
}

/**
 * Finds available pod peers qualified to cover a brand gap.
 * Checks:
 * 1. Must be in the same pod.
 * 2. Must NOT be on leave (pending or approved).
 * 3. Must NOT be requesting a swap out on that date.
 * 4. Must be actively working that day.
 * 5. Current brand count on that date must be <= 2.
 */
export function findAvailableBackupCandidates({
  brand,
  dateKey,
  employees,
  scheduleMatrix,
  leaves = [],
  swaps = [],
  getEmployeeBrandsForDate
}) {
  if (!brand) return [];

  return employees
    .filter((emp) => {
      // Must be same pod and not the primary handler of this specific brand
      const isSamePod = emp.podId === brand.podId;
      const isNotPrimary = !brand.assignedEmployeeIds.includes(emp.id);
      if (!isSamePod || !isNotPrimary) return false;

      // Rule 1: Must be actively working that day
      const shift = scheduleMatrix[`${emp.id}_${dateKey}`];
      if (!shift || !shift.isWorking) return false;

      // Rule 2: Must NOT be on leave (neither approved nor pending)
      const hasLeave = leaves.some(
        (l) => l.employeeId === emp.id && l.date === dateKey && l.status !== LEAVE_STATUS.REJECTED
      );
      if (hasLeave) return false;

      // Rule 3: Must NOT have put in a swap request for that date
      const hasPendingSwapOut = swaps.some(
        (s) => s.requesterId === emp.id && s.date === dateKey && s.status === 'PENDING'
      );
      if (hasPendingSwapOut) return false;

      // Rule 4: Employee must have 2 or fewer brands assigned on this date
      const assignedBrands = getEmployeeBrandsForDate
        ? getEmployeeBrandsForDate(emp.id, dateKey)
        : [];
      if (assignedBrands.length > 2) return false;

      return true;
    })
    .map((emp) => {
      const assignedBrands = getEmployeeBrandsForDate
        ? getEmployeeBrandsForDate(emp.id, dateKey)
        : [];

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        skills: emp.skills || [],
        brandCount: assignedBrands.length,
        status: `Working (${assignedBrands.length} ${assignedBrands.length === 1 ? 'brand' : 'brands'})`
      };
    })
    // Prioritize candidate with lowest brand workload
    .sort((a, b) => a.brandCount - b.brandCount);
}