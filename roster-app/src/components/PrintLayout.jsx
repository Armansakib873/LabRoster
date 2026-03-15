import { useRoster, DAYS } from '../context/RosterContext';

export default function PrintLayout({ deptId, forwardRef }) {
  const { state, getRoster, getEmployeeById } = useRoster();
  
  const dept = state.departments.find(d => d.id === deptId);
  // Get roster for the specific department
  const rosterKey = deptId;
  const roster = state.rosters[rosterKey] || null;

  if (!dept) return null;

  const shifts = Object.entries(dept.shifts);
  const getAssignments = (day, shiftKey, sectionId) => roster?.[day]?.[shiftKey]?.[sectionId] || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const s = {
    page: {
      width: 1400,
      padding: '36px 40px',
      background: '#fff',
      fontFamily: "'Times New Roman', 'Georgia', serif",
      color: '#111',
      fontSize: 13,
      lineHeight: 1.35,
    },
    header: {
      textAlign: 'center',
      marginBottom: 10,
      borderBottom: '2px solid #111',
      paddingBottom: 10,
    },
    hospitalName: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: 1,
      textTransform: 'uppercase',
      margin: 0,
    },
    address: {
      fontSize: 13,
      margin: '2px 0 6px',
      fontWeight: 400,
    },
    deptTitle: {
      fontSize: 17,
      fontWeight: 700,
      margin: '4px 0 0',
    },
    meta: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: 8,
      fontSize: 13,
      fontWeight: 600,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      border: '2px solid #222',
      fontSize: 12,
    },
    th: {
      border: '1.5px solid #333',
      padding: '6px 5px',
      textAlign: 'center',
      fontWeight: 700,
      background: '#f5f5f5',
      fontSize: 11,
      verticalAlign: 'top',
      lineHeight: 1.3,
    },
    thShift: {
      borderBottom: '1px solid #666',
      padding: '5px 4px 2px',
      textAlign: 'center',
      fontWeight: 700,
      fontSize: 12,
    },
    thTime: {
      fontSize: 10,
      fontWeight: 400,
      color: '#444',
      display: 'block',
      marginTop: 1,
    },
    thSection: {
      border: '1px solid #555',
      padding: '3px 4px',
      textAlign: 'center',
      fontWeight: 600,
      fontSize: 10,
      background: '#fafafa',
      lineHeight: 1.2,
    },
    td: {
      border: '1px solid #444',
      padding: '5px 6px',
      verticalAlign: 'top',
      textAlign: 'center',
      fontSize: 12,
      minWidth: 70,
      lineHeight: 1.4,
    },
    dayCell: {
      border: '1px solid #444',
      padding: '5px 8px',
      fontWeight: 700,
      textAlign: 'left',
      fontSize: 12,
      background: '#fafafa',
      width: 50,
    },
    names: {
      fontSize: 12,
      lineHeight: 1.5,
    },
    signaturesRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 50,
      paddingTop: 0,
    },
    sigBlock: {
      textAlign: 'center',
      minWidth: 180,
    },
    sigLine: {
      borderTop: '1px solid #333',
      paddingTop: 6,
      marginTop: 30,
    },
    sigName: {
      fontWeight: 700,
      fontSize: 12,
    },
    sigTitle: {
      fontSize: 11,
      color: '#444',
      lineHeight: 1.3,
    },
  };

  return (
    <div ref={forwardRef} style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.hospitalName}>{state.hospital.name}</h1>
        <p style={s.address}>{state.hospital.address}</p>
        <h2 style={s.deptTitle}>
          {dept.id === 'lab-service' ? 'Department of Laboratory Services' : 'Roster of Sample Collection'}
        </h2>
      </div>

      {/* Meta */}
      <div style={s.meta}>
        <span>Effective Date: {formatDate(state.effectiveFrom)}</span>
      </div>

      {/* Table */}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: 50 }} rowSpan={3}>Day</th>
            {shifts.map(([shiftKey, shift]) => (
              <th
                key={shiftKey}
                style={{ ...s.th, ...s.thShift }}
                colSpan={shift.sections.length}
              >
                {shift.label}
                <span style={s.thTime}>{shift.time}</span>
              </th>
            ))}
          </tr>
          <tr>
            {shifts.map(([shiftKey, shift]) =>
              shift.sections.map(sec => (
                <th key={sec.id} style={s.thSection}>
                  {shift.sections.length > 1 ? sec.label : ''}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {DAYS.map(day => (
            <tr key={day}>
              <td style={s.dayCell}>{day.slice(0, 3)}</td>
              {shifts.map(([shiftKey, shift]) =>
                shift.sections.map(section => {
                  const assignments = getAssignments(day, shiftKey, section.id);
                  return (
                    <td key={section.id} style={s.td}>
                      <div style={s.names}>
                        {assignments.map((a, i) => {
                          const emp = getEmployeeById(a.employeeId);
                          if (!emp) return null;
                          return (
                            <span key={a.employeeId}>
                              {emp.name}
                              {a.timeNote ? ` (${a.timeNote})` : ''}
                              {i < assignments.length - 1 ? ' + ' : ''}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signatures */}
      <div style={s.signaturesRow}>
        {state.signatories.map((sig, i) => (
          <div key={i} style={s.sigBlock}>
            <div style={s.sigLine}>
              <div style={s.sigName}>{sig.name}</div>
              <div style={s.sigTitle}>{sig.title}</div>
              <div style={s.sigTitle}>{sig.org}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
