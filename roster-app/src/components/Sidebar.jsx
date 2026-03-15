import { useState, useCallback } from 'react';
import { useRoster } from '../context/RosterContext';
import { Search, Plus, Users, FlaskConical, Droplets, ChevronDown, GripVertical } from 'lucide-react';

export default function Sidebar({ isOpen, onAddEmployee, onEditEmployee }) {
  const { state, getDeptEmployees, getEmployeeWeekSummary, DAYS } = useRoster();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'lab-service', 'sample-collection'

  const employees = filter === 'all'
    ? state.employees
    : state.employees.filter(e => e.departments.includes(filter));

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const getDeptClass = (emp) => {
    const hasLab = emp.departments.includes('lab-service');
    const hasCollection = emp.departments.includes('sample-collection');
    if (hasLab && hasCollection) return 'both';
    if (hasLab) return 'lab';
    return 'collection';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleDragStart = (e, employee) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'employee',
      employeeId: employee.id,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="sidebar-title">Staff Pool</div>
            <div className="sidebar-subtitle">{state.employees.length} employees</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onAddEmployee}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 12px 0' }}>
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search staff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, fontSize: 13 }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
        <button
          className={`dept-tab ${filter === 'all' ? 'active lab' : ''}`}
          style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`dept-tab ${filter === 'lab-service' ? 'active lab' : ''}`}
          style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
          onClick={() => setFilter('lab-service')}
        >
          <FlaskConical size={12} /> Lab
        </button>
        <button
          className={`dept-tab ${filter === 'sample-collection' ? 'active collection' : ''}`}
          style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
          onClick={() => setFilter('sample-collection')}
        >
          <Droplets size={12} /> SC
        </button>
      </div>

      {/* Employee List */}
      <div className="sidebar-content">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div className="empty-text">No staff found</div>
            <div className="empty-hint">Try adjusting filters</div>
          </div>
        )}
        {filtered.map(emp => (
          <div
            key={emp.id}
            className="employee-chip"
            draggable
            onDragStart={(e) => handleDragStart(e, emp)}
            onClick={() => onEditEmployee(emp)}
            style={{ marginBottom: 6 }}
          >
            <div className={`avatar ${getDeptClass(emp)}`}>
              {getInitials(emp.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {emp.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                {emp.role}
              </div>
            </div>
            <div className="dept-dots">
              {emp.departments.includes('lab-service') && <span className="dept-dot lab" />}
              {emp.departments.includes('sample-collection') && <span className="dept-dot collection" />}
            </div>
            <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>
            <FlaskConical size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Lab: {getDeptEmployees('lab-service').length}
          </span>
          <span>
            <Droplets size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> SC: {getDeptEmployees('sample-collection').length}
          </span>
          <span>
            Both: {state.employees.filter(e => e.departments.length > 1).length}
          </span>
        </div>
      </div>
    </aside>
  );
}
