import { useState, useRef, useEffect } from 'react';
import { useRoster } from '../context/RosterContext';
import html2canvas from 'html2canvas';
import { X, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import PrintLayout from './PrintLayout';

export default function ExportJpegModal({ onClose }) {
  const { state } = useRoster();
  const [activeTab, setActiveTab] = useState('lab-service');
  const [previews, setPreviews] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const layoutRef = useRef(null);

  const generatePreview = async (deptId) => {
    if (previews[deptId]) return; // already generated
    
    setIsGenerating(true);
    
    // Give DOM a moment to render the hidden PrintLayout
    setTimeout(async () => {
      try {
        if (!layoutRef.current) return;
        
        const canvas = await html2canvas(layoutRef.current, {
          scale: 2, // High resolution
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          width: layoutRef.current.scrollWidth,
          height: layoutRef.current.scrollHeight,
        });
        
        const url = canvas.toDataURL('image/jpeg', 0.95);
        setPreviews(prev => ({ ...prev, [deptId]: url }));
      } catch (err) {
        console.error('Failed to generate preview:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  };

  useEffect(() => {
    generatePreview(activeTab);
  }, [activeTab]);

  const handleDownload = () => {
    const url = previews[activeTab];
    if (!url) return;
    
    const link = document.createElement('a');
    const deptName = activeTab === 'lab-service' ? 'Lab_Services' : 'Sample_Collection';
    link.download = `Aurora_Roster_${deptName}_${state.effectiveFrom}.jpeg`;
    link.href = url;
    link.click();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
        <div className="modal modal-full" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={20} style={{ color: 'var(--primary)' }} />
              <div className="modal-title">Export Roster as JPEG</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="tab-bar" style={{ padding: '0 24px', background: 'var(--bg-elevated)' }}>
            <button
              className={`tab-item ${activeTab === 'lab-service' ? 'active' : ''}`}
              onClick={() => setActiveTab('lab-service')}
            >
              Lab Service
            </button>
            <button
              className={`tab-item ${activeTab === 'sample-collection' ? 'active' : ''}`}
              onClick={() => setActiveTab('sample-collection')}
            >
              Sample Collection
            </button>
          </div>

          <div className="modal-body" style={{ background: '#e2e8f0', padding: 30, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isGenerating || !previews[activeTab] ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-secondary)' }}>
                <Loader2 size={32} className="animate-spin" />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Rendering high-quality preview...</span>
              </div>
            ) : (
              <div style={{ boxShadow: 'var(--shadow-xl)', borderRadius: 4, overflow: 'hidden', background: 'white' }}>
                <img 
                  src={previews[activeTab]} 
                  alt={`${activeTab} Preview`} 
                  style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ background: 'var(--bg-card)' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button 
              className="btn btn-primary" 
              onClick={handleDownload}
              disabled={isGenerating || !previews[activeTab]}
            >
              <Download size={15} /> Download {activeTab === 'lab-service' ? 'Lab Service' : 'Sample Collection'} JPEG
            </button>
          </div>
        </div>
      </div>

      {/* Hidden layout rendered off-screen for html2canvas to capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PrintLayout deptId={activeTab} forwardRef={layoutRef} />
      </div>
    </>
  );
}
