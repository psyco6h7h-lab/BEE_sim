import React from 'react';
import { useLightweightStore } from './store/lightweightStore';

// Import lightweight components
import LightweightHeader from './components/LightweightHeader';
import LightweightCircuitSimulator from './components/LightweightCircuitSimulator';
import NewMotorLab from './components/NewMotorLab';
import EnhancedTransformerSimulator from './components/EnhancedTransformerSimulator';
import EnhancedOhmLawSimulator from './components/LightweightOhmLawSimulator';
import EnhancedKirchhoffSimulator from './components/ScrollBasedKirchhoffSimulator';

// Lightweight global styles - using native CSS instead of styled-components
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Arial', sans-serif;
    background: #000;
    color: #ffffff;
    overflow: auto;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 4px;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  
  @keyframes slideInFromTop {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
  }
`;

const LightweightApp: React.FC = () => {
  const [state] = useLightweightStore();

  React.useEffect(() => {
    // Inject global styles
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
  }, []);

  const renderScene = () => {
    console.log('Current scene:', state.currentScene); // Debug log
    switch (state.currentScene) {
      case 'circuit':
        return <LightweightCircuitSimulator />;
      case 'motor':
        return <NewMotorLab />;
      case 'ohm':
        return <EnhancedOhmLawSimulator />;
    case 'transformer':
      return <EnhancedTransformerSimulator />;
      case 'kirchhoff':
        return <EnhancedKirchhoffSimulator />;
      default:
        return <LightweightCircuitSimulator />;
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #000000, #1a1a1a)',
      position: 'relative'
    }}>
      <LightweightHeader />
      
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'auto'
      }}>
        {renderScene()}
      </div>

      {/* Performance monitor */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        padding: '5px 10px',
        borderRadius: '4px',
        color: '#22c55e',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid rgba(34, 197, 94, 0.3)'
      }}>
        ⚡ Ultra-Lightweight Mode | Memory: ~{Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB
      </div>
    </div>
  );
};

export default LightweightApp;