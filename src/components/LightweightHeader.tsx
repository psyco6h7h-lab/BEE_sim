import React from 'react';
import { useLightweightStore } from '../store/lightweightStore';

const LightweightHeader: React.FC = () => {
  const [state, store] = useLightweightStore();

  const scenes = [
    { id: 'circuit', name: 'Circuit Builder', icon: '⚡' },
    { id: 'motor', name: 'Motor Lab', icon: '⚙️' },
    { id: 'transformer', name: 'Transformer', icon: '⚡' },
    { id: 'ohm', name: "Ohm's Law", icon: '📊' },
    { id: 'kirchhoff', name: 'Kirchhoff', icon: '🔗' }
  ];

  return (
    <header style={{
      height: '60px',
      background: 'linear-gradient(135deg, #000000, #1a1a1a)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#3b82f6',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        ⚡ Circuit Simulator
      </div>

      {/* Scene Navigation */}
      <div style={{
        display: 'flex',
        gap: '5px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '25px',
        padding: '5px'
      }}>
        {scenes.map(scene => (
          <button
            key={scene.id}
            onClick={() => store.setCurrentScene(scene.id as any)}
            style={{
              padding: '8px 16px',
              background: state.currentScene === scene.id 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                : 'transparent',
              border: 'none',
              borderRadius: '20px',
              color: state.currentScene === scene.id ? '#fff' : '#9ca3af',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {scene.icon} {scene.name}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <button
          onClick={() => store.toggleGrid()}
          style={{
            padding: '8px',
            background: state.showGrid ? '#3b82f6' : 'transparent',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {state.showGrid ? '🔲' : '⬜'} Grid
        </button>

        <div style={{
          color: '#22c55e',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          ⚡ Lightweight Mode
        </div>
      </div>
    </header>
  );
};

export default LightweightHeader;
