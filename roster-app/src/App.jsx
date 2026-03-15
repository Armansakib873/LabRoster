import { useState, useCallback, useEffect } from 'react';
import { RosterProvider } from './context/RosterContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RosterTable from './components/RosterTable';
import EmployeeModal from './components/EmployeeModal';
import SettingsModal from './components/SettingsModal';
import PrintView from './components/PrintView';
import ExportJpegModal from './components/ExportJpegModal';
import Toast from './components/Toast';
import './index.css';

function AppContent() {
  const [employeeModal, setEmployeeModal] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [printMode, setPrintMode] = useState(null); // null | 'print' | 'jpeg'
  const [toasts, setToasts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Auto-collapse on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="app-layout">
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSettings={() => setShowSettings(true)}
        onExport={() => setShowSettings(true)}
        onPrint={() => setPrintMode('print')}
        onSaveImage={() => setPrintMode('jpeg')}
      />
      <div className="app-body">
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div 
            className="sidebar-overlay no-print" 
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 999,
              animation: 'fadeIn 0.2s ease'
            }}
          />
        )}
        <Sidebar
          isOpen={isSidebarOpen}
          onAddEmployee={() => setEmployeeModal({ mode: 'add' })}
          onEditEmployee={(emp) => setEmployeeModal({ mode: 'edit', employee: emp })}
          onDragStartClose={() => {
            if (window.innerWidth <= 768) setIsSidebarOpen(false);
          }}
        />
        <RosterTable />
      </div>

      {employeeModal && (
        <EmployeeModal
          employee={employeeModal.mode === 'edit' ? employeeModal.employee : null}
          onClose={() => setEmployeeModal(null)}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} showToast={showToast} />
      )}

      {/* Print View for physical print */}
      {printMode === 'print' && (
        <PrintView mode="print" onClose={() => setPrintMode(null)} />
      )}

      {/* JPEG Export Modal with Previews */}
      {printMode === 'jpeg' && (
        <ExportJpegModal onClose={() => setPrintMode(null)} />
      )}

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RosterProvider>
      <AppContent />
    </RosterProvider>
  );
}
