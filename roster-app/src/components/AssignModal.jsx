import { useState } from 'react';
import { useRoster } from '../context/RosterContext';
import { X, Search, UserPlus } from 'lucide-react';

export default function AssignModal({ day, shift, section, onClose }) {
  const { state, dispatch, getActiveDepartment, getRoster } = useRoster();
  const [search, setSearch] = useState('');
  const [timeNote, setTimeNote] = useState('');

  const dept = getActiveDepartment();
  const roster = getRoster(state.activeDepartment);
  const availableEmployees = state.employees.filter(e =>
    e.departments.includes(state.activeDepartment) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentAssignments = roster?.[day]?.[shift]?.[section] || [];
  const alreadyAssigned = currentAssignments.map(a => a.employeeId);

  const handleAssign = (employeeId) => {
    dispatch({
      type: 'ASSIGN_EMPLOYEE',
      payload: {
        deptId: state.activeDepartment,
        day, shift, section, employeeId,
        timeNote,
      }
    });
    setTimeNote('');
  };

  const shiftLabel = dept?.shifts?.[shift]?.label || shift;
  const sectionLabel = dept?.shifts?.[shift]?.sections?.find(s => s.id === section)?.label || '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Assign Staff</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {day} • {shiftLabel}{sectionLabel ? ` • ${sectionLabel}` : ''}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Time Note (optional)</label>
            <input className="form-input" placeholder="e.g. 3pm-11pm" value={timeNote} onChange={e => setTimeNote(e.target.value)} />
          </div>

          <div className="form-group">
            <div className="search-box">
              <Search size={14} className="search-icon" />
              <input className="form-input" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {availableEmployees.map(emp => {
              const isAssigned = alreadyAssigned.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  className={`assign-row ${isAssigned ? 'assigned' : ''}`}
                  onClick={() => !isAssigned && handleAssign(emp.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={`assign-avatar ${state.activeDepartment === 'lab-service' ? 'lab' : 'collection'} ${isAssigned ? 'done' : ''}`}>
                      {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.role}</div>
                    </div>
                  </div>
                  {isAssigned
                    ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>✓ Assigned</span>
                    : <UserPlus size={16} style={{ color: 'var(--text-muted)' }} />
                  }
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
