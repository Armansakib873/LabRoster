import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle size={16} />,
    error: <XCircle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <div className={`toast ${type}`} onClick={onDismiss}>
      {icons[type]}
      {message}
    </div>
  );
}
