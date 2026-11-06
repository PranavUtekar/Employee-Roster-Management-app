# SmartRoster Ops — Multi-Brand Pod Management System

An operational roster intelligence and shift management application built with React and Tailwind CSS. Designed to solve complex cross-coverage vulnerabilities, deterministic monthly shift scheduling, leave workflows, peer shift swaps, and intelligent automated gap assignments across multi-brand enterprise pods.

---

## 🎯 Key Capabilities

### 1. Operations Control Center (Manager Perspective)
* **Real-Time Coverage Health:** Diagnostic metrics tracking monthly staffing fulfillment percentage, approved/pending leaves, open peer swaps, and unstaffed shift gaps.
* **Deterministic Monthly Roster Grid:** 30-day interactive scheduling matrix mapping working days, weekly fixed/staggered offs, approved leaves, shift swaps, and active coverage tags with 1-click CSV export.
* **Intelligent Gap Detection & Auto-Assignment:**
  * Single-row vulnerability management with real-time candidate filtering.
  * **Auto-Assign Engine:** Evaluates active on-duty pod peers who are not on leave, have no pending swap requests, and hold $\le$ 2 concurrent brand desks.
  * **Bulk Auto-Assign All:** Resolves all unstaffed shifts across the month with a single click while load-balancing across teammates.
* **Sortable Employee Workload Directory:** Search and sort all team members by total assigned brand count, pod grouping, or name to detect team overload early.
* **Audit Trail Log:** Slide-out immutable activity drawer capturing administrative decisions, leaves, swaps, and automated reassignments with actor timestamps.

### 2. Employee Workspace (Personalized Portal)
* **Dynamic Employee Persona Switcher:** Instant switcher supporting all roster members (single-resource brand leads and multi-resource pod associates).
* **Targeted Notification Toasts & Alerts:** Real-time feedback alerts when reassigned to cover peer brand desks or when taking on multi-brand workloads.
* **Time-Off & Peer Shift Swapping:** Self-service leave requests and direct peer swap submissions bound to eligible pod peers.
* **Personal Calendar Breakdown:** Color-coded personal monthly view distinguishing regular shifts, comp-offs, approved leaves, and active brand coverage duties.

---

## 🔑 Demo Access Credentials

The application includes role-based authentication simulation:

| Role | Access Method | Passcode |
| :--- | :--- | :--- |
| **Operations Manager** | Click *Manager* in Navbar | `admin123` |
| **Employee (Any Teammate)** | Select any name from Navbar Employee Dropdown | *None (Direct Simulation)* |

---

## 🛠️ Tech Stack & Architecture

* **Frontend Framework:** React 19 (Vite)
* **Styling:** Tailwind CSS with Lucide React Icons
* **State Management:** React Context API (`RosterContext`) with optimistic state overrides
* **Algorithm Engine:** Deterministic rule-based roster matrix generator (`rosterEngine.js`)

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* npm

### Installation & Local Run
```bash
# Clone the repository
git clone [https://github.com/PranavUtekar/roster-management-app.git](https://github.com/PranavUtekar/roster-management-app.git)

# Navigate into project directory
cd roster-management-app

# Install dependencies
npm install

# Start development server
npm run dev