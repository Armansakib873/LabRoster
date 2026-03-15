import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import initialData from '../data/db.json';

const RosterContext = createContext();

const STORAGE_KEY = 'aurora-roster-data';
const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initialData,
        ...parsed,
        departments: initialData.departments,
        settings: initialData.settings,
        signatories: initialData.signatories,
        hospital: initialData.hospital,
      };
    }
  } catch (e) {
    console.warn('Failed to load saved data:', e);
  }
  return initialData;
}

function saveData(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      employees: state.employees,
      rosters: state.rosters,
      effectiveFrom: state.effectiveFrom,
    }));
  } catch (e) {
    console.warn('Failed to save data:', e);
  }
}

// Get the first Saturday of current month or nearby
function getDefaultEffectiveFrom() {
  const d = new Date();
  // Simply return YYYY-MM-DD
  return d.toISOString().split('T')[0];
}

function initializeWeekRoster(state, deptId) {
  const dept = state.departments.find(d => d.id === deptId);
  if (!dept) return {};
  const roster = {};
  DAYS.forEach(day => {
    roster[day] = {};
    Object.entries(dept.shifts).forEach(([shiftKey, shift]) => {
      roster[day][shiftKey] = {};
      shift.sections.forEach(section => {
        roster[day][shiftKey][section.id] = [];
      });
    });
  });
  return roster;
}

function rosterReducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_DEPT':
      return { ...state, activeDepartment: action.payload };

    case 'SET_EFFECTIVE_FROM':
      return { ...state, effectiveFrom: action.payload };



    case 'ASSIGN_EMPLOYEE': {
      const { deptId, day, shift, section, employeeId, timeNote } = action.payload;
      const rosterKey = deptId;
      const rosters = { ...state.rosters };
      if (!rosters[rosterKey]) {
        rosters[rosterKey] = initializeWeekRoster(state, deptId);
      }
      const roster = JSON.parse(JSON.stringify(rosters[rosterKey]));
      if (!roster[day]) roster[day] = {};
      if (!roster[day][shift]) roster[day][shift] = {};
      if (!roster[day][shift][section]) roster[day][shift][section] = [];
      const existing = roster[day][shift][section].find(a => a.employeeId === employeeId);
      if (!existing) {
        roster[day][shift][section].push({ employeeId, timeNote: timeNote || '' });
      }
      rosters[rosterKey] = roster;
      return { ...state, rosters };
    }

    case 'REMOVE_ASSIGNMENT': {
      const { deptId, day, shift, section, employeeId } = action.payload;
      const rosterKey = deptId;
      const rosters = { ...state.rosters };
      if (!rosters[rosterKey]?.[day]?.[shift]?.[section]) return state;
      const roster = JSON.parse(JSON.stringify(rosters[rosterKey]));
      roster[day][shift][section] = roster[day][shift][section].filter(a => a.employeeId !== employeeId);
      rosters[rosterKey] = roster;
      return { ...state, rosters };
    }

    case 'MOVE_ASSIGNMENT': {
      const { deptId, fromDay, fromShift, fromSection, toDay, toShift, toSection, employeeId } = action.payload;
      const rosterKey = deptId;
      const rosters = { ...state.rosters };
      if (!rosters[rosterKey]) rosters[rosterKey] = initializeWeekRoster(state, deptId);
      const roster = JSON.parse(JSON.stringify(rosters[rosterKey]));

      // Ensure structures
      if (!roster[fromDay]?.[fromShift]?.[fromSection]) return state;
      if (!roster[toDay]) roster[toDay] = {};
      if (!roster[toDay][toShift]) roster[toDay][toShift] = {};
      if (!roster[toDay][toShift][toSection]) roster[toDay][toShift][toSection] = [];

      // Find & remove from source
      const assignment = roster[fromDay][fromShift][fromSection].find(a => a.employeeId === employeeId);
      if (!assignment) return state;
      roster[fromDay][fromShift][fromSection] = roster[fromDay][fromShift][fromSection].filter(a => a.employeeId !== employeeId);

      // Add to target (prevent duplicate)
      if (!roster[toDay][toShift][toSection].some(a => a.employeeId === employeeId)) {
        roster[toDay][toShift][toSection].push(assignment);
      }

      rosters[rosterKey] = roster;
      return { ...state, rosters };
    }

    case 'SWAP_ASSIGNMENT': {
      const { deptId, source, target } = action.payload;
      const rosterKey = deptId;
      const rosters = { ...state.rosters };
      if (!rosters[rosterKey]) return state;

      const roster = JSON.parse(JSON.stringify(rosters[rosterKey]));

      // Verify locations
      if (!roster[source.day]?.[source.shift]?.[source.section] || !roster[target.day]?.[target.shift]?.[target.section]) return state;

      const sourceAssignments = roster[source.day][source.shift][source.section];
      const targetAssignments = roster[target.day][target.shift][target.section];

      const sourceObj = sourceAssignments.find(a => a.employeeId === source.employeeId);
      const targetObj = targetAssignments.find(a => a.employeeId === target.employeeId);

      if (!sourceObj || !targetObj) return state;

      // Remove from original
      roster[source.day][source.shift][source.section] = sourceAssignments.filter(a => a.employeeId !== source.employeeId);
      roster[target.day][target.shift][target.section] = targetAssignments.filter(a => a.employeeId !== target.employeeId);

      // Swap
      roster[source.day][source.shift][source.section].push(targetObj);
      roster[target.day][target.shift][target.section].push(sourceObj);

      rosters[rosterKey] = roster;
      return { ...state, rosters };
    }

    case 'REPLACE_ASSIGNMENT': {
      const { deptId, day, shift, section, oldEmployeeId, newEmployeeId } = action.payload;
      const rosterKey = deptId;
      const rosters = { ...state.rosters };
      if (!rosters[rosterKey]?.[day]?.[shift]?.[section]) return state;
      const roster = JSON.parse(JSON.stringify(rosters[rosterKey]));
      
      // Update the assignment at the correct index, or just filter and push
      roster[day][shift][section] = roster[day][shift][section].map(a => 
        a.employeeId === oldEmployeeId ? { ...a, employeeId: newEmployeeId } : a
      );
      
      rosters[rosterKey] = roster;
      return { ...state, rosters };
    }

    case 'CLEAR_DAY': {
      const { deptId, day } = action.payload;
      const rosterKey = deptId;
      const rosters = { ...state.rosters };
      if (!rosters[rosterKey]?.[day]) return state;
      const roster = JSON.parse(JSON.stringify(rosters[rosterKey]));
      const dept = state.departments.find(d => d.id === deptId);
      if (dept) {
        Object.entries(dept.shifts).forEach(([shiftKey, shift]) => {
          if (!roster[day][shiftKey]) roster[day][shiftKey] = {};
          shift.sections.forEach(section => {
            roster[day][shiftKey][section.id] = [];
          });
        });
      }
      rosters[rosterKey] = roster;
      return { ...state, rosters };
    }

    case 'ADD_EMPLOYEE': {
      return { ...state, employees: [...state.employees, action.payload] };
    }

    case 'UPDATE_EMPLOYEE': {
      return {
        ...state,
        employees: state.employees.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e),
      };
    }

    case 'DELETE_EMPLOYEE': {
      return { ...state, employees: state.employees.filter(e => e.id !== action.payload) };
    }

    case 'IMPORT_DATA': {
      return { ...state, ...action.payload };
    }

    case 'SET_SELECTED_EMPLOYEE':
      return { ...state, selectedEmployeeId: action.payload };

    default:
      return state;
  }
}

export function RosterProvider({ children }) {
  const loaded = loadData();
  const initialState = {
    ...loaded,
    activeDepartment: loaded.departments[0]?.id || 'lab-service',
    effectiveFrom: loaded.effectiveFrom || getDefaultEffectiveFrom(),
    selectedEmployeeId: null,
  };

  const [state, dispatch] = useReducer(rosterReducer, initialState);

  useEffect(() => {
    saveData(state);
  }, [state.employees, state.rosters, state.effectiveFrom]);

  const getActiveDepartment = useCallback(() => {
    return state.departments.find(d => d.id === state.activeDepartment);
  }, [state.departments, state.activeDepartment]);

  const getDeptEmployees = useCallback((deptId) => {
    return state.employees.filter(e => e.departments.includes(deptId));
  }, [state.employees]);

  const getRoster = useCallback((deptId) => {
    const rosterKey = deptId;
    return state.rosters[rosterKey] || null;
  }, [state.rosters]);

  const getEmployeeById = useCallback((id) => {
    return state.employees.find(e => e.id === id);
  }, [state.employees]);

  const getConflicts = useCallback((deptId) => {
    const roster = getRoster(deptId);
    if (!roster) return [];
    
    const conflicts = [];
    const deptEmployees = getDeptEmployees(deptId);
    
    // 1. Check for overlapping shifts (including Day Off overlaps) and individual Day Offs
    const employeeOffDaysCount = {};
    deptEmployees.forEach(e => employeeOffDaysCount[e.id] = 0);

    DAYS.forEach(day => {
      if (!roster[day]) return;
      const employeeShifts = {};
      
      Object.entries(roster[day]).forEach(([shiftKey, sections]) => {
        Object.entries(sections).forEach(([, assignments]) => {
          assignments.forEach(a => {
            if (!employeeShifts[a.employeeId]) employeeShifts[a.employeeId] = new Set();
            employeeShifts[a.employeeId].add(shiftKey);
            
            if (shiftKey === 'dayoff') {
              employeeOffDaysCount[a.employeeId]++;
            }
          });
        });
      });

      Object.entries(employeeShifts).forEach(([empId, shifts]) => {
        const hasDayOff = shifts.has('dayoff');
        const hasWork = Array.from(shifts).some(s => s !== 'dayoff');
        
        // Error: Assigned to work and marked as Day Off on same day
        if (hasDayOff && hasWork) {
          conflicts.push({ 
            type: 'overlap',
            day, 
            employeeId: empId, 
            message: `Assigned to work and Day Off on the same day.` 
          });
        } 
        // Error: Multiple work shifts on same day
        else if (shifts.size > 1 && !hasDayOff) {
          conflicts.push({ 
            type: 'multi-shift',
            day, 
            employeeId: empId, 
            message: `Assigned to multiple working shifts.` 
          });
        }
      });
    });

    // 2. Error: Employee must have at least one Day Off in the roster
    deptEmployees.forEach(emp => {
      if (employeeOffDaysCount[emp.id] === 0) {
        conflicts.push({
          type: 'no-day-off',
          employeeId: emp.id,
          message: `Staff has no Day Off assigned in this roster.`
        });
      }
    });

    return conflicts;
  }, [getRoster, getDeptEmployees]);

  const value = {
    state,
    dispatch,
    getActiveDepartment,
    getDeptEmployees,
    getRoster,
    getEmployeeById,
    getConflicts,
    DAYS,
  };

  return (
    <RosterContext.Provider value={value}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const context = useContext(RosterContext);
  if (!context) throw new Error('useRoster must be used within a RosterProvider');
  return context;
}

export { DAYS };
