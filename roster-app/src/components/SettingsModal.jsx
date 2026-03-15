import { useState, useRef } from 'react';
import { useRoster } from '../context/RosterContext';
import { X, Download, Upload, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsModal({ onClose, showToast }) {
  const { state, dispatch } = useRoster();
  const [activeTab, setActiveTab] = useState('general');
  const fileInputRef = useRef(null);

  const handleExportAll = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      employees: state.employees,
      rosters: state.rosters,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurora-roster-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.('Data exported successfully!', 'success');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.employees && data.rosters) {
          if (confirm('This will replace all current data. Continue?')) {
            dispatch({
              type: 'IMPORT_DATA',
              payload: {
                employees: data.employees,
                rosters: data.rosters,
              }
            });
            showToast?.('Data imported successfully!', 'success');
          }
        } else {
          showToast?.('Invalid backup file format', 'error');
        }
      } catch (err) {
        showToast?.('Failed to parse backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    if (confirm('⚠️ This will delete ALL roster data and reset to defaults. This cannot be undone. Continue?')) {
      localStorage.removeItem('aurora-roster-data');
      window.location.reload();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Settings</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="tab-bar" style={{ padding: '0 24px' }}>
          <button
            className={`tab-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab-item ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data Management
          </button>
          <button
            className={`tab-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'general' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Hospital Information</h3>
              <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{state.hospital.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{state.hospital.address}</div>
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Departments</h3>
              {state.departments.map(dept => (
                <div key={dept.id} style={{
                  padding: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
                  borderLeft: `3px solid ${dept.color}`
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{dept.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {Object.keys(dept.shifts).length} shifts • {
                        Object.values(dept.shifts).reduce((t, s) => t + s.sections.length, 0)
                      } sections
                    </div>
                  </div>
                </div>
              ))}

              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 20 }}>Signatories</h3>
              {state.signatories.map((sig, i) => (
                <div key={i} style={{
                  padding: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
                  marginBottom: 6, fontSize: 13
                }}>
                  <div style={{ fontWeight: 600 }}>{sig.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sig.title} — {sig.org}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <div style={{ 
                padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', 
                marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Export Backup</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Download all employees and roster data as JSON
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleExportAll}>
                  <Download size={14} /> Export
                </button>
              </div>

              <div style={{ 
                padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', 
                marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Import Backup</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Restore data from a previously exported JSON file
                  </div>
                </div>
                <button className="btn btn-accent btn-sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> Import
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
              </div>

              <div style={{ 
                padding: 16, background: 'var(--danger-50)', border: '1px solid rgba(239,68,68,0.2)', 
                borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--danger)' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Reset All Data
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Permanently delete all saved data and reset to defaults
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={handleResetAll}>
                  <Trash2 size={14} /> Reset
                </button>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 22, margin: '0 auto 16px'
              }}>
                A
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Aurora Roster Manager</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Version 1.0.0
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                A powerful laboratory roster management system designed for 
                Aurora Specialized Hospital Ltd. Manage shifts, track assignments, 
                and ensure smooth operations across Lab Service and Sample Collection departments.
              </p>
              <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                Built with React + Vite
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
