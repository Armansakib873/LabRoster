import { useEffect } from 'react';
import { useRoster } from '../context/RosterContext';
import PrintLayout from './PrintLayout';

export default function PrintView({ onClose, mode = 'print' }) {
  const { state } = useRoster();

  useEffect(() => {
    if (mode === 'print') {
      setTimeout(() => {
        window.print();
        onClose();
      }, 500);
    }
  }, [mode, onClose]);

  return (
    <div className="print-view-root">
      {/* We render the print layout specifically for printing */}
      <PrintLayout deptId={state.activeDepartment} />
    </div>
  );
}
