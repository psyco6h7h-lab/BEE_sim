import React, { useState, useRef, useCallback, useEffect } from 'react';

interface DraggableToolbarProps {
  selectedTool: string;
  onToolChange: (tool: string) => void;
  showGrid: boolean;
  onGridToggle: () => void;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
}

const DraggableToolbar: React.FC<DraggableToolbarProps> = ({
  selectedTool,
  onToolChange,
  showGrid,
  onGridToggle,
  onSave,
  onLoad,
  onClear
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const dragData = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    
    const rect = dragRef.current.getBoundingClientRect();
    dragData.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
    
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragData.current.startX;
    const deltaY = e.clientY - dragData.current.startY;
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    dragData.current.startX = e.clientX;
    dragData.current.startY = e.clientY;
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: '80px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    transition: 'transform 0.1s ease-out',
    transform: `translate(${position.x}px, ${position.y}px) ${isDragging ? 'scale(1.02)' : 'scale(1)'}`,
    willChange: 'transform'
  };

  const getButtonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
    color: active ? 'white' : '#93c5fd',
    border: `1px solid ${active ? '#3b82f6' : 'transparent'}`,
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '80px',
    transform: 'translateZ(0)'
  });

  const toolGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px'
  };

  const toolLabelStyle: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '0.7rem',
    fontWeight: '500',
    marginBottom: '4px'
  };

  return (
    <div
      ref={dragRef}
      style={toolbarStyle}
      onMouseDown={handleMouseDown}
    >
      <div style={toolLabelStyle}>Tools</div>
      <div style={toolGroupStyle}>
        <button
          style={getButtonStyle(selectedTool === 'select')}
          onClick={() => onToolChange('select')}
        >
          🖱️ Select
        </button>
        <button
          style={getButtonStyle(selectedTool === 'wire')}
          onClick={() => onToolChange('wire')}
        >
          🔌 Wire
        </button>
        <button
          style={getButtonStyle(selectedTool === 'delete')}
          onClick={() => onToolChange('delete')}
        >
          🗑️ Delete
        </button>
      </div>

      <div style={toolLabelStyle}>View</div>
      <div style={toolGroupStyle}>
        <button
          style={getButtonStyle(showGrid)}
          onClick={onGridToggle}
        >
          {showGrid ? '🔲 Grid' : '⬜ Grid'}
        </button>
      </div>

      <div style={toolLabelStyle}>File</div>
      <div style={toolGroupStyle}>
        <button
          style={getButtonStyle(false)}
          onClick={onSave}
        >
          💾 Save
        </button>
        <button
          style={getButtonStyle(false)}
          onClick={onLoad}
        >
          📁 Load
        </button>
        <button
          style={getButtonStyle(false)}
          onClick={onClear}
        >
          🧹 Clear
        </button>
      </div>
    </div>
  );
};

export default DraggableToolbar;