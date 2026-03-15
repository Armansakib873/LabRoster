import { useState } from 'react';
import { useRoster } from '../context/RosterContext';
import { X, Save, Trash2 } from 'lucide-react';

export default function EmployeeModal({ employee, onClose }) {
  const { state, dispatch } = useRoster();
  const isEdit = !!employee;

  const [form, setForm] = useState({
    name: employee?.name || '',
    role: employee?.role || 'Technologist',
    phone: employee?.phone || '',
    departments: employee?.departments || ['lab-service'],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (isEdit) {
      dispatch({
        type: 'UPDATE_EMPLOYEE',
        payload: { id: employee.id, ...form },
      });
    } else {
      dispatch({
        type: 'ADD_EMPLOYEE',
        payload: {
          id: `emp-${Date.now()}`,
          ...form,
          avatar: '',
        },
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Delete ${employee.name}? This will remove them from all rosters.`)) {
      dispatch({ type: 'DELETE_EMPLOYEE', payload: employee.id });
      onClose();
    }
  };

  const toggleDept = (deptId) => {
    setForm(prev => {
      const deps = prev.departments.includes(deptId)
        ? prev.departments.filter(d => d !== deptId)
        : [...prev.departments, deptId];
      return { ...prev, departments: deps.length > 0 ? deps : prev.departments };
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="e.g. Arman Hossain"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role / Designation</label>
              <select
                className="form-select"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="Technologist">Technologist</option>
                <option value="Senior Technologist">Senior Technologist</option>
                <option value="Quality Control Manager">Quality Control Manager</option>
                <option value="Lab In-Charge">Lab In-Charge</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Biochemist">Biochemist</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input
                className="form-input"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department(s)</label>
              <div className="form-checkbox-group">
                <label className="form-checkbox-label" style={{
                  borderColor: form.departments.includes('lab-service') ? 'var(--primary)' : undefined,
                  background: form.departments.includes('lab-service') ? 'var(--primary-50)' : undefined,
                }}>
                  <input
                    type="checkbox"
                    checked={form.departments.includes('lab-service')}
                    onChange={() => toggleDept('lab-service')}
                  />
                  Lab Service
                </label>
                <label className="form-checkbox-label" style={{
                  borderColor: form.departments.includes('sample-collection') ? 'var(--accent)' : undefined,
                  background: form.departments.includes('sample-collection') ? 'var(--accent-50)' : undefined,
                }}>
                  <input
                    type="checkbox"
                    checked={form.departments.includes('sample-collection')}
                    onChange={() => toggleDept('sample-collection')}
                  />
                  Sample Collection
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {isEdit && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} style={{ marginRight: 'auto' }}>
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} /> {isEdit ? 'Update' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
