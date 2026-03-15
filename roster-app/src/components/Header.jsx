import { useRoster } from '../context/RosterContext';
import { FlaskConical, Droplets, Printer, Download, Upload, Settings, Image, CalendarRange, Menu } from 'lucide-react';

export default function Header({ onToggleSidebar, onSettings, onExport, onPrint, onSaveImage }) {
  const { state, dispatch } = useRoster();

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <button className="btn btn-ghost btn-icon" onClick={onToggleSidebar} style={{ marginRight: 4 }}>
          <Menu size={18} />
        </button>
        <div className="header-logo">A</div>
        <div className="header-text-group">
          <div className="header-title">{state.hospital.name}</div>
          <div className="header-subtitle">{state.hospital.address}</div>
        </div>
      </div>

      {/* Department Switcher */}
      <div className="dept-switcher-mobile">
        {state.departments.map(dept => (
          <button
            key={dept.id}
            className={`dept-tab ${state.activeDepartment === dept.id ? 'active' : ''} ${dept.id === 'lab-service' ? 'lab' : 'collection'}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_DEPT', payload: dept.id })}
          >
            {dept.id === 'lab-service' ? <FlaskConical size={14} /> : <Droplets size={14} />}
            {dept.name}
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div className="date-range-bar">
        <CalendarRange size={15} style={{ color: 'var(--primary)' }} />
        <div className="date-range-group">
          <label className="date-label">From</label>
          <input
            type="date"
            className="date-input"
            value={state.effectiveFrom}
            onChange={e => dispatch({ type: 'SET_EFFECTIVE_FROM', payload: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="header-actions">
        <button className="btn btn-ghost btn-sm" onClick={onSaveImage} title="Save as JPEG">
          <Image size={15} /> <span>JPEG</span>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onPrint} title="Print Roster">
          <Printer size={15} /> <span>Print</span>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onExport} title="Export Data">
          <Download size={15} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onSettings} title="Settings">
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
