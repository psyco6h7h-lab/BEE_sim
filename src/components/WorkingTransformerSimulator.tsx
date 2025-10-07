import React, { useState } from 'react';

interface TransformerState {
  primaryVoltage: number;
  secondaryVoltage: number;
  turnsRatio: number;
  efficiency: number;
  primaryCurrent: number;
  secondaryCurrent: number;
  isConnected: boolean;
}

const WorkingTransformerSimulator: React.FC = () => {
  const [transformer, setTransformer] = useState<TransformerState>({
    primaryVoltage: 240,
    secondaryVoltage: 12,
    turnsRatio: 20,
    efficiency: 95,
    primaryCurrent: 0.5,
    secondaryCurrent: 10,
    isConnected: false
  });

  const [isVisible, setIsVisible] = useState<boolean[]>([false, false, false, false]);

  // Calculate transformer values
  const idealSecondaryVoltage = transformer.primaryVoltage / transformer.turnsRatio;
  const actualSecondaryVoltage = idealSecondaryVoltage * (transformer.efficiency / 100);
  const power = transformer.primaryVoltage * transformer.primaryCurrent * (transformer.efficiency / 100);
  const secondaryCurrent = power / actualSecondaryVoltage;

  // Scroll handler
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      const card1Visible = scrollY > windowHeight * 0.8;
      const card2Visible = scrollY > windowHeight * 1.0;
      const card3Visible = scrollY > windowHeight * 1.2;
      const card4Visible = scrollY > windowHeight * 1.4;
      
      setIsVisible([card1Visible, card2Visible, card3Visible, card4Visible]);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ 
      background: '#040407', 
      color: '#f8fafc', 
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* DEBUG INDICATOR */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'rgba(34,197,94,0.9)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '10px',
        zIndex: 3000,
        fontWeight: 'bold'
      }}>
        ✅ WORKING TRANSFORMER v4.0
      </div>

      {/* MAIN TRANSFORMER SECTION */}
      <div style={{ 
        height: '100vh', 
        display: 'flex',
        background: 'radial-gradient(circle at 25% 25%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(circle at 75% 30%, rgba(139,92,246,0.15), transparent 50%), radial-gradient(circle at 50% 80%, rgba(14,165,233,0.15), transparent 50%)'
      }}>
        {/* Control Panel */}
        <div style={{
          width: '320px',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
          padding: '24px',
          overflowY: 'auto',
          borderRight: '1px solid rgba(59,130,246,0.4)',
          boxShadow: '4px 0 16px rgba(15,23,42,0.45)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#3b82f6', marginBottom: '6px', fontSize: '20px', fontWeight: 700 }}>Transformer Lab</h3>
            <div style={{ fontSize: '12px', color: '#cbd5f5' }}>Explore primary vs secondary relationships, efficiency, and flux coupling.</div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '14px',
            marginBottom: '22px',
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            boxShadow: 'inset 0 1px 0 rgba(148,163,184,0.08)',
            fontSize: '12px',
            color: '#cbd5f5',
            lineHeight: '1.6'
          }}>
            {transformer.isConnected ? 'Primary energised — observe flux animation and secondary response.' : 'Primary disconnected — adjust parameters then connect to visualise energy transfer.'}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Primary Settings</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ fontSize: '12px', color: '#f8fafc' }}>
                Voltage: {transformer.primaryVoltage.toFixed(0)}V
                <input
                  type="range"
                  min="100"
                  max="480"
                  value={transformer.primaryVoltage}
                  onChange={(e) => setTransformer(prev => ({ ...prev, primaryVoltage: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ fontSize: '12px', color: '#f8fafc' }}>
                Current: {transformer.primaryCurrent.toFixed(2)}A
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={transformer.primaryCurrent}
                  onChange={(e) => setTransformer(prev => ({ ...prev, primaryCurrent: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ fontSize: '12px', color: '#f8fafc' }}>
                Turns Ratio (Np:Ns): {transformer.turnsRatio.toFixed(1)}:1
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.1"
                  value={transformer.turnsRatio}
                  onChange={(e) => setTransformer(prev => ({ ...prev, turnsRatio: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ fontSize: '12px', color: '#f8fafc' }}>
                Efficiency: {transformer.efficiency.toFixed(0)}%
                <input
                  type="range"
                  min="70"
                  max="99"
                  value={transformer.efficiency}
                  onChange={(e) => setTransformer(prev => ({ ...prev, efficiency: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Secondary Output</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(15,23,42,0.65)',
              border: '1px solid rgba(59,130,246,0.2)'
            }}>
              {[
                { label: 'Secondary Voltage', value: `${actualSecondaryVoltage.toFixed(1)} V` },
                { label: 'Secondary Current', value: `${secondaryCurrent.toFixed(2)} A` },
                { label: 'Power Transfer', value: `${(transformer.primaryVoltage * transformer.primaryCurrent * transformer.efficiency / 100).toFixed(1)} W` },
                { label: 'Flux Coupling', value: transformer.isConnected ? 'Linked' : 'Open' }
              ].map(stat => (
                <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{stat.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={() => setTransformer(prev => ({ ...prev, isConnected: !prev.isConnected }))}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                background: transformer.isConnected ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: transformer.isConnected ? '0 14px 30px rgba(239,68,68,0.25)' : '0 14px 30px rgba(34,197,94,0.25)'
              }}
            >
              {transformer.isConnected ? 'Disconnect Primary' : 'Connect Primary'}
            </button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div style={{ flex: 1, position: 'relative', background: 'rgba(2,6,23,0.92)' }}>
          {/* Transformer Visualization */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '300px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(3,7,18,0.9))',
            borderRadius: '20px',
            border: '2px solid rgba(59,130,246,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>⚡ Transformer Physics</h2>
            
            {/* Core Visualization */}
            <div style={{
              width: '200px',
              height: '120px',
              background: 'linear-gradient(90deg, #4b5563, #6b7280, #4b5563)',
              borderRadius: '10px',
              position: 'relative',
              marginBottom: '20px',
              border: '2px solid #374151'
            }}>
              {/* Primary Coil */}
              <div style={{
                position: 'absolute',
                left: '-30px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '80px',
                background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>P</div>
                <div style={{ color: '#fff', fontSize: '8px' }}>{transformer.turnsRatio.toFixed(0)}</div>
              </div>

              {/* Secondary Coil */}
              <div style={{
                position: 'absolute',
                right: '-30px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '40px',
                background: 'linear-gradient(180deg, #22c55e, #15803d)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>S</div>
                <div style={{ color: '#fff', fontSize: '8px' }}>1</div>
              </div>

              {/* Magnetic Field Lines */}
              {transformer.isConnected && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '180px',
                  height: '100px',
                  border: '2px solid rgba(139, 92, 246, 0.6)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </div>

            {/* Physics Equations */}
            <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ color: '#8b5cf6' }}>Faraday's Law: V₂/V₁ = N₂/N₁</span>
              </div>
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: '#22c55e' }}>Actual: {(actualSecondaryVoltage/transformer.primaryVoltage).toFixed(3)}</span>
                <span style={{ color: '#94a3b8' }}> | </span>
                <span style={{ color: '#fbbf24' }}>Theoretical: {(1/transformer.turnsRatio).toFixed(3)}</span>
              </div>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: transformer.efficiency > 90 ? '#22c55e' : '#fbbf24' }}>
                  η = {transformer.efficiency}% ({transformer.isConnected ? 'ACTIVE' : 'IDLE'})
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#f1f5f9',
            fontSize: '11px',
            display: 'flex',
            gap: '10px',
            boxShadow: '0 12px 24px rgba(15,23,42,0.25)'
          }}>
            <span>🔋 Transformer Simulation</span>
            <span>|</span>
            <span>Turns Ratio: 1:{(1 / transformer.turnsRatio).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* CARDS SECTION */}
      <div style={{ 
        background: '#040407',
        padding: '20px 0'
      }}>
        {/* Scroll Indicator */}
        <div style={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          background: 'rgba(59,130,246,0.9)',
          color: '#fff',
          padding: '10px 15px',
          borderRadius: '20px',
          fontSize: '12px',
          zIndex: 2000,
          animation: 'pulse 2s infinite'
        }}>
          ↓ Scroll Down for More Info ↓
        </div>
        
        {/* Card 1: Waveform Analysis */}
        <div 
          style={{
            width: '100%',
            height: '400px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(59,130,246,0.5)',
            borderTop: '3px solid #3b82f6',
            borderBottom: '3px solid #3b82f6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px',
            margin: '20px 0',
            transform: isVisible[0] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>📊 Waveform Analysis</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Real-time voltage and current waveforms showing the relationship between primary and secondary circuits. 
              Observe how AC signals transform through the magnetic coupling with phase relationships and harmonic analysis.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Primary Waveform</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>V₁(t) = {transformer.primaryVoltage}V × sin(2πft)</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Frequency: 50Hz | RMS: {(transformer.primaryVoltage/1.414).toFixed(1)}V</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Phase: 0° | Peak: {transformer.primaryVoltage}V</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Secondary Waveform</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>V₂(t) = {actualSecondaryVoltage.toFixed(1)}V × sin(2πft)</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Frequency: 50Hz | RMS: {(actualSecondaryVoltage/1.414).toFixed(1)}V</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Phase: 0° | Peak: {actualSecondaryVoltage.toFixed(1)}V</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#8b5cf6', fontSize: '14px' }}>📈 Live Waveform Graph</div>
          </div>
        </div>

        {/* Card 2: Hysteresis Loop */}
        <div 
          style={{
            width: '100%',
            height: '400px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(139,92,246,0.5)',
            borderTop: '3px solid #8b5cf6',
            borderBottom: '3px solid #8b5cf6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px',
            margin: '20px 0',
            transform: isVisible[1] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#8b5cf6', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>🔄 Hysteresis Loop</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              The magnetic hysteresis loop shows the relationship between magnetic field intensity (H) and magnetic flux density (B). 
              This determines core losses, efficiency, and magnetic saturation characteristics in transformer cores.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Core Losses</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>P_hysteresis = {((100 - transformer.efficiency) * 0.3).toFixed(1)}W</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>P_eddy = {((100 - transformer.efficiency) * 0.2).toFixed(1)}W</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Total: {((100 - transformer.efficiency) * 0.5).toFixed(1)}W</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Magnetic Properties</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>B_sat = 1.8T | H_c = 50A/m</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>μ_r = 2000 | Coercivity: 0.5A/m</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Remanence: 0.9T</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#8b5cf6', fontSize: '14px' }}>🔄 Hysteresis Loop Visualization</div>
          </div>
        </div>

        {/* Card 3: Load Analysis */}
        <div 
          style={{
            width: '100%',
            height: '400px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
            border: '2px solid rgba(34,197,94,0.5)',
            borderTop: '3px solid #22c55e',
            borderBottom: '3px solid #22c55e',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px',
            margin: '20px 0',
            transform: isVisible[2] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#22c55e', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>⚡ Load & Efficiency</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Real-time analysis of power transfer, efficiency, and load characteristics. 
              Monitor how different loads affect transformer performance with comprehensive power analysis.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Power Analysis</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>P_in = {(transformer.primaryVoltage * transformer.primaryCurrent).toFixed(1)}W</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>P_out = {(actualSecondaryVoltage * secondaryCurrent).toFixed(1)}W</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Losses: {((transformer.primaryVoltage * transformer.primaryCurrent) - (actualSecondaryVoltage * secondaryCurrent)).toFixed(1)}W</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Efficiency Metrics</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>η = {transformer.efficiency}%</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Power Factor: 0.95</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Load Factor: 0.85</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: '14px' }}>📊 Load Analysis Dashboard</div>
          </div>
        </div>

        {/* Card 4: Physics Equations */}
        <div 
          style={{
            width: '100%',
            height: '400px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
            border: '2px solid rgba(245,158,11,0.5)',
            borderTop: '3px solid #f59e0b',
            borderBottom: '3px solid #f59e0b',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px',
            margin: '20px 0',
            transform: isVisible[3] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>🧮 Physics Equations</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Core transformer equations governing voltage transformation, power conservation, and magnetic coupling. 
              Understanding these principles is essential for transformer design and analysis.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Faraday's Law</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>V₂/V₁ = N₂/N₁</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>e = -N(dΦ/dt)</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Voltage Transformation</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Power Conservation</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>P₁ = P₂ (Ideal)</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>I₁/I₂ = N₂/N₁</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Energy Conservation</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#f59e0b', fontSize: '14px' }}>📐 Physics Equations Panel</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkingTransformerSimulator;
