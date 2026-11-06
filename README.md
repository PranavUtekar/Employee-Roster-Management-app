# Smart Roster Management System — DataStraw Hiring Assignment

A multi-brand operational roster intelligence and shift management application built with **React 19**, **Vite**, and **Tailwind CSS**[cite: 5]. Engineered to address deterministic monthly shift scheduling, client coverage rules (365-day, public holidays off, standard business days), leave management, peer shift swaps, and cross-coverage gap auto-assignment across pods and brands[cite: 1, 2, 3].

---

## 💡 2–3 Sentence Approach Note

To solve multi-brand operational vulnerability without generating silent coverage voids, the system implements a deterministic, rule-based scheduling engine paired with an intelligent backup matching algorithm[cite: 1, 3, 5, 6]. It separates a brand's operating requirements from individual worker schedules, prioritizing mandatory client coverage days over secondary preferences[cite: 3, 4]. When absences occur, the engine flags unstaffed brand shifts and balances workloads by auto-matching eligible on-duty pod peers who are not on leave, have no pending swaps, and hold $\le$ 2 concurrent brand desks[cite: 3, 4].

---

## 🎯 Key System Features

### 1. Operations Control Center (Manager Portal)
* **Coverage Health Dashboard:** Real-time metrics monitoring fulfillment percentage, approved/pending leaves, open peer swaps, and unstaffed brand shift gaps[cite: 2, 6].
* **30-Day Interactive Scheduling Matrix:** Complete monthly view tracking working days, staggered/fixed weekly offs, approved leaves, shift swaps, and active coverage tags with 1-click CSV export[cite: 2, 3, 6].
* **Intelligent Gap Detection & Resolution:**
  * Real-time identification of unstaffed brand shifts caused by single-resource leaves or multi-resource understaffing[cite: 1, 3, 4].
  * **1-Click Auto-Assign Engine:** Filters for on-duty pod peers who have no leave, no pending swaps, and $\le$ 2 brand assignments, prioritizing candidates with the lowest workload[cite: 2, 3].
  * **Bulk Auto-Assign All:** Resolves all monthly staffing vulnerabilities simultaneously with fair distribution across pod members[cite: 5, 6].
* **Workload-Aware Employee Directory:** Search and sort team members by total assigned brand count, pod grouping, or name to quickly spot overload thresholds[cite: 2].
* **Immutable Activity Audit Log:** Real-time event log tracking leaves, swaps, overrides, and auto-pilot decisions with timestamps and actor tracking[cite: 5, 6].

### 2. Employee Workspace (Personalized Portal)
* **Dynamic Persona Switcher:** Direct simulation across all 30+ employees (single-resource brand leads and multi-resource associates)[cite: 2, 4].
* **Personalized Notifications:** Live toasts and dedicated banner alerts when assigned to cover peer brand desks or when crossing workload thresholds[cite: 5, 6].
* **Self-Service Leave & Peer Swaps:** Submit time-off requests and propose shifts swaps with eligible pod teammates[cite: 2, 3].
* **Individual Monthly Schedule:** Color-coded personal calendar showing active duty, weekly offs, approved leaves, and cross-brand coverage responsibilities[cite: 2, 4].

---

## 🔑 Demo Access Credentials

The application includes role-based access simulation[cite: 2]:

| Role | Access Method | Passcode |
| :--- | :--- | :--- |
| **Operations Manager** | Click *Manager* in Navbar | `admin123` |
| **Employee Portal** | Select any team member via the Navbar dropdown | *None (Direct Persona Simulation)* |

---

## 🧠 Section 8: Tell Us How You Think

### 1. How did you model employees, brands, processes, pods, and their relationships?
The domain model (`mockData.js`) uses relational mapping[cite: 2, 4]:
* **Employees (30+):** Store identity, assigned pod ID, weekly-off configuration (fixed vs. staggered), and role level[cite: 2, 4].
* **Pods:** Represent operational pods overseen by a designated Pod Lead[cite: 1, 2].
* **Brands:** Define client operational requirements (`OPERATING_CALENDAR`: `ALL_DAYS_365`, `EXCEPT_PUBLIC_HOLIDAYS`, `BUSINESS_DAYS_OFF_SUNDAY_PH`), minimum headcount per process, operational model (`SINGLE_RESOURCE` vs. `MULTI_RESOURCE`), and assigned employee IDs[cite: 1, 3, 4].
* **Processes:** Model brand-specific workflows (Customer Support, Abandoned Cart Conversions, NDR, Retention) mapped to specific employees within that brand[cite: 1, 2].
* Approximately 80% of brands are mapped to a single dedicated employee handling all processes, while the remaining 20% are distributed across 2–3 employees with partitioned or overlapping process assignments[cite: 1, 4].

### 2. How does your system generate a roster and determine whether it satisfies the required constraints?
The roster engine (`rosterEngine.js`) executes a deterministic, multi-pass evaluation across every day of the month[cite: 3, 5]:
1. **Operating Calendar Evaluation:** Computes if the brand/process requires coverage on date $D$ based on public holidays and day of the week[cite: 3].
2. **Base Employee Availability:** Calculates whether the assigned employee is scheduled for a regular working shift, a weekly off, an approved leave, or an approved swap[cite: 3].
3. **Coverage Constraint Verification:** Aggregates working headcount for that brand on date $D$[cite: 3]. If the working count is less than the brand's minimum coverage threshold, a structured `CoverageGap` object is flagged detailing the deficit, date, and operational reason rather than silently producing an invalid schedule[cite: 3, 4].

### 3. How did you handle the difference between single-resource brands and brands with multiple employees?
* **Single-Resource Brands (~80%):** A single point of failure exists[cite: 1]. If the sole assigned employee takes leave or has a weekly off on a required client working day, the engine immediately flags a critical coverage vulnerability (`reason: "Sole assigned brand lead is on leave/off"`)[cite: 1, 3, 4].
* **Multi-Resource Brands (~20%):** Multiple employees are assigned to different or shared processes[cite: 1, 4]. The engine evaluates remaining on-duty headcount against minimum process requirements[cite: 3, 4]. If an associate is absent but sufficient peer coverage remains on that process, no gap is triggered[cite: 4]; if staffing falls below the threshold, a targeted gap is raised[cite: 3, 4].

### 4. What happens when an employee manages all processes for a brand but is unavailable on a required working day?
When a single-resource brand lead is unavailable (e.g., approved casual leave):
1. The calendar validation detects zero active coverage on a mandatory operating day[cite: 3, 4].
2. A vulnerability alert is raised on the Manager Dashboard with the reason and impact clearly displayed[cite: 3, 4].
3. The engine activates `findAvailableBackupCandidates()`, scanning peers in the same operational pod who meet strict eligibility criteria:
   * Actively working on that calendar day (on-duty)[cite: 2, 4].
   * Not on approved leave[cite: 3, 4].
   * Not engaged in an active pending swap[cite: 3, 4].
   * Currently handling $\le 2$ concurrent brand desks (preventing burnout)[cite: 3, 4].
4. The manager can use 1-click **Auto-Assign** (or manual dropdown reassignment)[cite: 2]. Once assigned, an optimistic override resolves the gap, updates the schedule matrix, writes to the immutable audit trail, and issues an assignment notice to the chosen peer[cite: 2, 5, 6].

### 5. How does your system handle conflicting requirements or insufficient staffing?
The system enforces a clear hierarchy between **hard constraints** and **soft preferences**[cite: 3, 4]:
* **Hard Constraints:** Client brand operating days (e.g., 365-day SLA) and approved leaves are non-negotiable[cite: 1, 3, 4]. Client SLA fulfillment always supersedes preferred employee off-days[cite: 4].
* **Insufficient Staffing:** If no eligible pod peer satisfies all constraints (e.g., all pod peers are off, on leave, or already at capacity), the system explicitly flags `"No On-Duty Peer with <= 2 Brands"` rather than making unsafe assignments or masking the deficit[cite: 3, 4]. This alerts the manager to explore cross-pod support or adjust leave approvals[cite: 1, 2].

### 6. Which parts of the process did you automate, and which did you leave under human control? Why?
* **Automated:**
  * Base monthly roster matrix generation from rules, holidays, and regular shifts[cite: 3].
  * Conflict detection and unstaffed shift identification[cite: 3, 4].
  * Intelligent candidate discovery, sorting peers by lowest existing workload[cite: 2, 5].
  * 1-click bulk auto-pilot matching (`Auto-Assign All Gaps`)[cite: 2, 5].
* **Human-Controlled:**
  * Approval or rejection of leave requests and peer shift swaps[cite: 2, 5].
  * Final managerial authority to manually reassign shifts or override auto-pilot suggestions[cite: 2, 3].
* **Rationale:** Operational scheduling impacts client SLAs and employee morale[cite: 1, 4]. Automating data computation, constraint validation, and candidate matching removes manual overhead, while human sign-off preserves accountability and contextual decision-making[cite: 1, 2, 7].

### 7. If the company doubled its team and brand count, what would you change about your solution?
1. **Backend & Persistent Storage:** Transition from in-memory state/client-side context to a PostgreSQL database with Prisma ORM and a Node.js/Go backend for concurrent updates[cite: 2, 5].
2. **Matrix Virtualization:** Implement row and column virtualization (`@tanstack/react-virtual`) for the 30-day roster grid to maintain 60 FPS rendering when displaying 100+ employees simultaneously.
3. **Cross-Pod Dynamic Borrowing:** Introduce secondary and tertiary backup tiers allowing cross-pod allocations when local pod resources are exhausted[cite: 1, 4].
4. **Constraint Programming Solver:** Replace the heuristic matching algorithm with an integer linear programming (ILP) or constraint satisfaction solver (e.g., Google OR-Tools) to optimize global multi-objective goals (minimizing overtime while equalizing weekend distributions)[cite: 5, 6].

### 8. If you had one additional week to work on this, what would you improve first?
1. **Interactive Roster Builder UI:** Allow managers to drag-and-drop shift assignments directly within the monthly grid with real-time constraint validation popovers[cite: 2, 3].
2. **Automated Cross-Pod Borrowing:** Add an escalation engine that suggests cross-pod transfers when an entire pod is at maximum brand capacity[cite: 1, 4].
3. **Advanced Fair-Share Engine:** Implement mathematical fairness scoring (tracking weekend shifts and holiday burdens per employee over rolling 90-day windows)[cite: 5, 6].
4. **Direct Notification Webhooks:** Integrate email (SendGrid) and Slack/WhatsApp notification webhooks for instant leave and shift swap decision alerts[cite: 5, 6].

---

## 🛠️ Tech Stack & Setup

### Tech Stack
* **Core:** React 19, JavaScript (ES6+), Vite[cite: 5]
* **Styling:** Tailwind CSS, Lucide Icons
* **State & Architecture:** React Context API (`RosterContext`), Deterministic Engine (`rosterEngine.js`)[cite: 5]

### Local Setup Instructions
```bash
# 1. Clone the repository
git clone [https://github.com/PranavUtekar/Employee-Roster-Management-app.git](https://github.com/PranavUtekar/Employee-Roster-Management-app.git)

# 2. Navigate to project root
cd Employee-Roster-Management-app

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev

# 5. Build for production
npm run build