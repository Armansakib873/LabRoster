import { useState, useEffect } from 'react';
import { useRoster, DAYS } from '../context/RosterContext';
import { Plus, X, AlertTriangle, MoreHorizontal, Trash2 } from 'lucide-react';
import AssignModal from './AssignModal';

export default function RosterTable() {
  const { state, dispatch, getActiveDepartment, getRoster, getEmployeeById, getConflicts } = useRoster();
  const dept = getActiveDepartment();
  const roster = getRoster(state.activeDepartment);
  const conflicts = getConflicts(state.activeDepartment);

  const [assignModal, setAssignModal] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [dragData, setDragData] = useState(null);
  const [showConflicts, setShowConflicts] = useState(false);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (!dept) return null;

  const shifts = Object.entries(dept.shifts);

  const getAssignments = (day, shiftKey, sectionId) => {
    return roster?.[day]?.[shiftKey]?.[sectionId] || [];
  };

  // --- Drag from sidebar (new employee) ---
  const handleDropNew = (e, day, shiftKey, sectionId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('cell-drag-over');

    // Check if it's a move from another cell
    const moveRaw = e.dataTransfer.getData('text/roster-move');
    if (moveRaw) {
      try {
        const move = JSON.parse(moveRaw);
        dispatch({
          type: 'MOVE_ASSIGNMENT',
          payload: {
            deptId: state.activeDepartment,
            fromDay: move.day,
            fromShift: move.shift,
            fromSection: move.section,
            toDay: day,
            toShift: shiftKey,
            toSection: sectionId,
            employeeId: move.employeeId,
          }
        });
      } catch (err) { console.error(err); }
      return;
    }

    // Otherwise it's from sidebar
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'employee') {
        const emp = getEmployeeById(data.employeeId);
        if (emp && emp.departments.includes(state.activeDepartment)) {
          dispatch({
            type: 'ASSIGN_EMPLOYEE',
            payload: {
              deptId: state.activeDepartment,
              day,
              shift: shiftKey,
              section: sectionId,
              employeeId: data.employeeId,
            }
          });
        }
      }
    } catch (err) { /* ignore */ }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('cell-drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('cell-drag-over');
  };

  // --- Drag assigned chip ---
  const handleChipDragStart = (e, day, shiftKey, sectionId, employeeId) => {
    e.dataTransfer.setData('text/roster-move', JSON.stringify({
      day, shift: shiftKey, section: sectionId, employeeId,
    }));
    e.dataTransfer.effectAllowed = 'move';
    setDragData({ day, shift: shiftKey, section: sectionId, employeeId });
    // style the dragging chip
    e.currentTarget.classList.add('chip-dragging');
  };

  const handleChipDragEnd = (e) => {
    e.currentTarget.classList.remove('chip-dragging');
    setDragData(null);
  };

  // --- Drop on assigned chip (SWAP) ---
  const handleChipDragOver = (e) => {
    if (e.dataTransfer.types.includes('text/roster-move')) {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.add('chip-swap-target');
    }
  };

  const handleChipDragLeave = (e) => {
    e.currentTarget.classList.remove('chip-swap-target');
  };

  const handleChipDrop = (e, targetDay, targetShiftKey, targetSectionId, targetEmployeeId) => {
    e.currentTarget.classList.remove('chip-swap-target');
    
    if (e.dataTransfer.types.includes('text/roster-move')) {
      e.preventDefault();
      e.stopPropagation();
      
      const moveRaw = e.dataTransfer.getData('text/roster-move');
      if (moveRaw) {
        try {
        const move = JSON.parse(moveRaw);
        if (move.employeeId === targetEmployeeId) return; // Ignored if dropped on itself
        
        dispatch({
          type: 'SWAP_ASSIGNMENT',
          payload: {
            deptId: state.activeDepartment,
            source: {
              day: move.day,
              shift: move.shift,
              section: move.section,
              employeeId: move.employeeId,
            },
            target: {
              day: targetDay,
              shift: targetShiftKey,
              section: targetSectionId,
              employeeId: targetEmployeeId,
            }
          }
        });
      } catch (err) { console.error(err); }
    }
  }
};

  const handleRemove = (day, shiftKey, sectionId, employeeId) => {
    dispatch({
      type: 'REMOVE_ASSIGNMENT',
      payload: { deptId: state.activeDepartment, day, shift: shiftKey, section: sectionId, employeeId }
    });
  };

  const handleClearDay = (day) => {
    if (confirm(`Clear all assignments for ${day}?`)) {
      dispatch({ type: 'CLEAR_DAY', payload: { deptId: state.activeDepartment, day } });
    }
  };

  const hasConflict = (day, employeeId) => {
    return conflicts.some(c => c.day === day && c.employeeId === employeeId);
  };

  const totalAssignments = DAYS.reduce((total, day) => {
    shifts.forEach(([shiftKey, shift]) => {
      shift.sections.forEach(section => { total += getAssignments(day, shiftKey, section.id).length; });
    });
    return total;
  }, 0);

  const getShiftColorClass = (shiftKey) => {
    switch (shiftKey) {
      case 'morning': return 'shift-morning';
      case 'evening': return 'shift-evening';
      case 'evening-histo': return 'shift-evening';
      case 'night': return 'shift-night';
      case 'dayoff': return 'shift-dayoff';
      default: return '';
    }
  };

  return (
    <div className="app-main">
      {/* Toolbar */}
      <div className="roster-toolbar no-print">
        <div className="roster-toolbar-left">
          <div style={{
            fontWeight: 700, fontSize: 16, color: 'var(--text)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: dept.id === 'lab-service' ? 'var(--primary)' : 'var(--accent)',
              display: 'inline-block',
            }} />
            {dept.id === 'lab-service' ? 'Department of Laboratory Services' : 'Roster of Sample Collection'}
          </div>
        </div>
        <div className="roster-toolbar-right">
          {conflicts.length > 0 && (
            <span className="conflict-badge hover-pointer" onClick={() => setShowConflicts(true)} style={{ cursor: 'pointer' }}>
              <AlertTriangle size={13} /> {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
            </span>
          )}
          <span className="stat-badge">{totalAssignments} assigned</span>
          <span className="stat-badge">
            {state.employees.filter(e => e.departments.includes(state.activeDepartment)).length} staff
          </span>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="roster-container">
        <div className="roster-grid">
          {/* Header Row */}
          <div className="grid-header-row">
            <div className="grid-day-header">Day</div>
            {shifts.map(([shiftKey, shift]) => (
              <div key={shiftKey} className={`grid-header-shift-group ${getShiftColorClass(shiftKey)}`} style={{ flex: shift.sections.length }}>
                <div className={`shift-header-top ${shift.sections.length === 1 ? 'no-sections' : ''}`}>
                  <div className="shift-header-label">{shift.label}</div>
                  <div className="shift-header-time">{shift.time}</div>
                </div>
                {shift.sections.length > 1 && (
                  <div className="shift-header-sections-row">
                    {shift.sections.map((s, idx) => (
                      <div key={s.id} className={`shift-section-col-header ${idx > 0 ? 'border-left' : ''}`}>
                        {s.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Day Rows */}
          {DAYS.map((day) => (
            <div key={day} className={`grid-row ${day === 'Friday' ? 'grid-row-friday' : ''}`}>
              {/* Day Label */}
              <div className="grid-day-cell">
                <span className="day-name">{day.slice(0, 3)}</span>
                <button
                  className="day-menu-btn no-print"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({ day, x: e.clientX, y: e.clientY });
                  }}
                >
                  <MoreHorizontal size={13} />
                </button>
              </div>

              {/* Shift Cells */}
              {shifts.map(([shiftKey, shift]) => (
                <div key={shiftKey} className={`grid-shift-group ${getShiftColorClass(shiftKey)}`} style={{ flex: shift.sections.length }}>
                  {shift.sections.map((section, secIdx) => (
                    <div key={section.id} className={`grid-section-col ${secIdx > 0 ? 'border-left' : ''}`}>
                      <div
                        className="drop-target"
                        onDrop={(e) => handleDropNew(e, day, shiftKey, section.id)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        <div className="chips-container-col">
                          {getAssignments(day, shiftKey, section.id).map(assignment => {
                            const emp = getEmployeeById(assignment.employeeId);
                            if (!emp) return null;
                            const isConflict = hasConflict(day, assignment.employeeId);
                            return (
                              <span
                                key={assignment.employeeId}
                                className={`name-chip ${getShiftColorClass(shiftKey)} ${isConflict ? 'name-chip-conflict' : ''}`}
                                draggable
                                onDragStart={(e) => handleChipDragStart(e, day, shiftKey, section.id, assignment.employeeId)}
                                onDragEnd={handleChipDragEnd}
                                onDragOver={handleChipDragOver}
                                onDragLeave={handleChipDragLeave}
                                onDrop={(e) => handleChipDrop(e, day, shiftKey, section.id, assignment.employeeId)}
                                title={`Drag to move • ${emp.name}${assignment.timeNote ? ` (${assignment.timeNote})` : ''}`}
                              >
                                {emp.name}
                                {assignment.timeNote && (
                                  <span className="chip-time">({assignment.timeNote})</span>
                                )}
                                {isConflict && <span className="chip-conflict-dot">!</span>}
                                <button
                                  className="chip-remove no-print"
                                  onClick={(e) => { e.stopPropagation(); handleRemove(day, shiftKey, section.id, assignment.employeeId); }}
                                >
                                  <X size={9} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        <button
                          className="cell-add-btn no-print"
                          onClick={() => setAssignModal({ day, shift: shiftKey, section: section.id })}
                          title="Add staff"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={e => e.stopPropagation()}>
          <button className="context-menu-item danger" onClick={() => { handleClearDay(contextMenu.day); setContextMenu(null); }}>
            <Trash2 size={14} /> Clear {contextMenu.day}
          </button>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <AssignModal
          day={assignModal.day}
          shift={assignModal.shift}
          section={assignModal.section}
          onClose={() => setAssignModal(null)}
        />
      )}
      {/* Conflict Modal */}
      {showConflicts && (
        <div className="modal-overlay" onClick={() => setShowConflicts(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
                <AlertTriangle size={20} />
                Duty Conflicts & Errors
              </div>
              <button className="btn-icon" onClick={() => setShowConflicts(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '0 20px 20px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 15 }}>
                The following issues were detected in the current roster:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {conflicts.map((c, i) => {
                  const emp = getEmployeeById(c.employeeId);
                  return (
                    <div key={i} style={{ 
                      padding: 12, borderRadius: 8, background: '#fff5f5', 
                      border: '1px solid #fee2e2', display: 'flex', gap: 10 
                    }}>
                      <div style={{ 
                        width: 24, height: 24, borderRadius: '50%', background: 'var(--danger)', 
                        color: 'white', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', fontSize: 10, fontWeight: 700 
                      }}>
                        !
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#7f1d1d' }}>
                          {emp?.name || 'Unknown Staff'}
                        </div>
                        <div style={{ fontSize: 12, color: '#991b1b', marginTop: 2 }}>
                          {c.day && <strong>{c.day}: </strong>}
                          {c.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary w-full" onClick={() => setShowConflicts(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
