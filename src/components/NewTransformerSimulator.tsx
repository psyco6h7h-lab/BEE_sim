import React, { useRef, useState, useEffect, useCallback } from 'react';

interface TransformerState {
  primaryVoltage: number;
  secondaryVoltage: number;
  turnsRatio: number;
  efficiency: number;
  primaryCurrent: number;
  secondaryCurrent: number;
  isConnected: boolean;
}

const NewTransformerSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const fluxAnimationRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState<boolean[]>([false, false, false, false]);
  
  const [transformer, setTransformer] = useState<TransformerState>({
    primaryVoltage: 240,
    secondaryVoltage: 12,
    turnsRatio: 20,
    efficiency: 95,
    primaryCurrent: 0.5,
    secondaryCurrent: 10,
    isConnected: false
  });

  // Scroll animation observer for overlay cards
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Card 1 appears after 100vh scroll
      const card1Visible = scrollY > windowHeight * 0.8;
      // Card 2 appears after 120vh scroll  
      const card2Visible = scrollY > windowHeight * 1.0;
      // Card 3 appears after 140vh scroll
      const card3Visible = scrollY > windowHeight * 1.2;
      // Card 4 appears after 160vh scroll
      const card4Visible = scrollY > windowHeight * 1.4;
      
      setIsVisible([card1Visible, card2Visible, card3Visible, card4Visible]);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const calculateTransformer = useCallback(() => {
    const { primaryVoltage, turnsRatio, efficiency } = transformer;
    const idealSecondaryVoltage = primaryVoltage / turnsRatio;
    const actualSecondaryVoltage = idealSecondaryVoltage * (efficiency / 100);
    const power = primaryVoltage * transformer.primaryCurrent * (efficiency / 100);
    const secondaryCurrent = power / actualSecondaryVoltage;

    setTransformer(prev => ({
      ...prev,
      secondaryVoltage: actualSecondaryVoltage,
      secondaryCurrent
    }));
  }, [transformer.primaryVoltage, transformer.turnsRatio, transformer.efficiency, transformer.primaryCurrent]);

  const drawTransformer = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const scale = Math.min(ctx.canvas.width, ctx.canvas.height) / 600;
    
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Grid background
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < ctx.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < ctx.canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }

    // E-SHAPED IRON CORE
    const coreWidth = 40 * scale;
    const coreHeight = 240 * scale;
    
    // Core shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(centerX - coreWidth/2 + 4, centerY - coreHeight/2 + 4, coreWidth, coreHeight);
    
    // Main iron core
    const coreGradient = ctx.createLinearGradient(
      centerX - coreWidth/2, centerY,
      centerX + coreWidth/2, centerY
    );
    coreGradient.addColorStop(0, '#4b5563');
    coreGradient.addColorStop(0.5, '#6b7280');
    coreGradient.addColorStop(1, '#4b5563');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(centerX - coreWidth/2, centerY - coreHeight/2, coreWidth, coreHeight);
    
    // Core laminations
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = centerY - coreHeight/2 + (i * coreHeight / 20);
      ctx.beginPath();
      ctx.moveTo(centerX - coreWidth/2, y);
      ctx.lineTo(centerX + coreWidth/2, y);
      ctx.stroke();
    }
    
    // Core border
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - coreWidth/2, centerY - coreHeight/2, coreWidth, coreHeight);
    
    // PRIMARY WINDING (Left side)
    const primaryTurns = Math.max(4, Math.round(transformer.turnsRatio / 2.5));
    const coilRadius = 18 * scale;
    const coilSpacing = Math.min(25 * scale, (coreHeight - 40) / primaryTurns);
    const primaryStartY = centerY - ((primaryTurns - 1) * coilSpacing) / 2;
    
    for (let i = 0; i < primaryTurns; i++) {
      const y = primaryStartY + (i * coilSpacing);
      
      // Coil shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(centerX - 65 * scale + 2, y + 2, coilRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Coil body
      const coilGrad = ctx.createRadialGradient(
        centerX - 65 * scale - 5, y - 5, coilRadius * 0.3,
        centerX - 65 * scale, y, coilRadius
      );
      coilGrad.addColorStop(0, '#fca5a5');
      coilGrad.addColorStop(0.6, '#ef4444');
      coilGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = coilGrad;
      ctx.beginPath();
      ctx.arc(centerX - 65 * scale, y, coilRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Coil winding detail
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX - 65 * scale, y, coilRadius - 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // SECONDARY WINDING (Right side)
    const secondaryTurns = Math.max(1, Math.round(primaryTurns / transformer.turnsRatio));
    const secondaryStartY = centerY - ((secondaryTurns - 1) * coilSpacing) / 2;
    
    for (let i = 0; i < secondaryTurns; i++) {
      const y = secondaryStartY + (i * coilSpacing);
      
      // Coil shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(centerX + 65 * scale + 2, y + 2, coilRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Coil body
      const coilGrad = ctx.createRadialGradient(
        centerX + 65 * scale - 5, y - 5, coilRadius * 0.3,
        centerX + 65 * scale, y, coilRadius
      );
      coilGrad.addColorStop(0, '#86efac');
      coilGrad.addColorStop(0.6, '#22c55e');
      coilGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = coilGrad;
      ctx.beginPath();
      ctx.arc(centerX + 65 * scale, y, coilRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Coil winding detail
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX + 65 * scale, y, coilRadius - 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // MAGNETIC FLUX ANIMATION
    if (transformer.isConnected) {
      fluxAnimationRef.current += 0.08;
      
      // Flux through iron core
      for (let i = 0; i < 5; i++) {
        const offset = (fluxAnimationRef.current + i * 0.4) % (Math.PI * 2);
        const intensity = 0.4 + 0.6 * Math.sin(offset);
        
        ctx.strokeStyle = `rgba(139, 92, 246, ${intensity})`;
        ctx.lineWidth = 3;
        
        const xOffset = (i - 2) * 3;
        ctx.beginPath();
        ctx.moveTo(centerX + xOffset, centerY - coreHeight/2 + 10);
        ctx.lineTo(centerX + xOffset, centerY + coreHeight/2 - 10);
        ctx.stroke();
      }
    }

    // PHYSICS EQUATIONS & LABELS
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Transformer Physics', centerX, centerY - coreHeight/2 - 30);
    
    // Turns ratio display
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#8b5cf6';
    const n1 = primaryTurns;
    const n2 = secondaryTurns;
    ctx.fillText(`N₁ : N₂ = ${n1} : ${n2} (Ratio: ${(n1/n2).toFixed(2)}:1)`, centerX, centerY - coreHeight/2 - 10);
    
    // PRIMARY SIDE (Left)
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('PRIMARY', centerX - 110 * scale, centerY - coreHeight/2 + 30);
    
    ctx.font = '13px Arial';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`V₁ = ${transformer.primaryVoltage} V`, centerX - 110 * scale, centerY - coreHeight/2 + 50);
    ctx.fillText(`I₁ = ${transformer.primaryCurrent.toFixed(2)} A`, centerX - 110 * scale, centerY - coreHeight/2 + 68);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`P₁ = ${(transformer.primaryVoltage * transformer.primaryCurrent).toFixed(1)} W`, centerX - 110 * scale, centerY - coreHeight/2 + 86);
    
    // SECONDARY SIDE (Right)
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#86efac';
    ctx.fillText('SECONDARY', centerX + 110 * scale, centerY - coreHeight/2 + 30);
    
    ctx.font = '13px Arial';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`V₂ = ${transformer.secondaryVoltage.toFixed(1)} V`, centerX + 110 * scale, centerY - coreHeight/2 + 50);
    ctx.fillText(`I₂ = ${transformer.secondaryCurrent.toFixed(2)} A`, centerX + 110 * scale, centerY - coreHeight/2 + 68);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`P₂ = ${(transformer.secondaryVoltage * transformer.secondaryCurrent).toFixed(1)} W`, centerX + 110 * scale, centerY - coreHeight/2 + 86);
    
    // PHYSICS EQUATIONS (Bottom)
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('⚡ Faraday\'s Law: V₂/V₁ = N₂/N₁', centerX, centerY + coreHeight/2 + 30);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#94a3b8';
    const actualRatio = (transformer.secondaryVoltage / transformer.primaryVoltage).toFixed(3);
    const theoreticalRatio = (n2 / n1).toFixed(3);
    ctx.fillText(`Actual: ${actualRatio} | Theoretical: ${theoreticalRatio}`, centerX, centerY + coreHeight/2 + 48);
    
    // Efficiency indicator
    ctx.fillStyle = transformer.efficiency > 90 ? '#22c55e' : transformer.efficiency > 80 ? '#fbbf24' : '#ef4444';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`η = ${transformer.efficiency}% (${transformer.isConnected ? 'ACTIVE' : 'IDLE'})`, centerX, centerY + coreHeight/2 + 70);
  }, [transformer]);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawTransformer(ctx, time);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawTransformer]);

  useEffect(() => {
    calculateTransformer();
  }, [calculateTransformer]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div style={{ background: '#040407', color: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
      <style>{`
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
        .card-overlay {
          position: relative;
          width: 100%;
          height: 400px;
          z-index: 1000;
          transform: translateY(50px);
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          margin: '20px 0';
        }
        .card-overlay.visible {
          transform: translateY(0);
          opacity: 1;
        }
      `}</style>
      
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
              {[{ label: 'Secondary Voltage', value: `${transformer.secondaryVoltage.toFixed(1)} V` },
                { label: 'Secondary Current', value: `${transformer.secondaryCurrent.toFixed(2)} A` },
                { label: 'Power Transfer', value: `${(transformer.primaryVoltage * transformer.primaryCurrent * transformer.efficiency / 100).toFixed(1)} W` },
                { label: 'Flux Coupling', value: transformer.isConnected ? 'Linked' : 'Open' }].map(stat => (
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

        {/* Main Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              background: 'rgba(2,6,23,0.92)',
              borderLeft: '1px solid rgba(30, 64, 175, 0.3)'
            }}
          />
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
          ✅ NEW OVERLAY SYSTEM v3.0
        </div>
        
        {/* Card 1: Waveform Analysis - OVERLAY */}
        <div 
          className={`card-overlay ${isVisible[0] ? 'visible' : ''}`}
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(59,130,246,0.5)',
            borderTop: '3px solid #3b82f6',
            borderBottom: '3px solid #3b82f6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px'
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
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>V₂(t) = {transformer.secondaryVoltage.toFixed(1)}V × sin(2πft)</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Frequency: 50Hz | RMS: {(transformer.secondaryVoltage/1.414).toFixed(1)}V</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Phase: 0° | Peak: {transformer.secondaryVoltage.toFixed(1)}V</div>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Harmonic Analysis</div>
              <div style={{ color: '#f8fafc', fontSize: '12px' }}>THD: 2.1% | Fundamental: 50Hz | 3rd Harmonic: 0.8%</div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>Power Factor: 0.95 | Crest Factor: 1.41</div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#8b5cf6', fontSize: '14px' }}>📈 Live Waveform Graph</div>
          </div>
        </div>

        {/* Card 2: Hysteresis Loop - OVERLAY */}
        <div 
          className={`card-overlay ${isVisible[1] ? 'visible' : ''}`}
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(139,92,246,0.5)',
            borderTop: '3px solid #8b5cf6',
            borderBottom: '3px solid #8b5cf6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px'
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
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Steinmetz Equation</div>
              <div style={{ color: '#f8fafc', fontSize: '12px' }}>P_h = k_h × f × B^α | k_h = 0.01, α = 1.6</div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>Frequency: 50Hz | Flux Density: 1.2T</div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#8b5cf6', fontSize: '14px' }}>🔄 Hysteresis Loop Visualization</div>
          </div>
        </div>

        {/* Card 3: Load Analysis - OVERLAY */}
        <div 
          className={`card-overlay ${isVisible[2] ? 'visible' : ''}`}
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
            border: '2px solid rgba(34,197,94,0.5)',
            borderTop: '3px solid #22c55e',
            borderBottom: '3px solid #22c55e',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px'
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
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>P_out = {(transformer.secondaryVoltage * transformer.secondaryCurrent).toFixed(1)}W</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Losses: {((transformer.primaryVoltage * transformer.primaryCurrent) - (transformer.secondaryVoltage * transformer.secondaryCurrent)).toFixed(1)}W</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Efficiency Metrics</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>η = {transformer.efficiency}%</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Power Factor: 0.95</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Load Factor: 0.85</div>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ color: '#fca5a5', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Load Characteristics</div>
              <div style={{ color: '#f8fafc', fontSize: '12px' }}>Load Type: Resistive | Power Factor: 1.0</div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>Voltage Regulation: 2.1% | Temperature Rise: 65°C</div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: '14px' }}>📊 Load Analysis Dashboard</div>
          </div>
        </div>

        {/* Card 4: Physics Equations - OVERLAY */}
        <div 
          className={`card-overlay ${isVisible[3] ? 'visible' : ''}`}
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
            border: '2px solid rgba(245,158,11,0.5)',
            borderTop: '3px solid #f59e0b',
            borderBottom: '3px solid #f59e0b',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px'
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
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Magnetic Circuit Equations</div>
              <div style={{ color: '#f8fafc', fontSize: '12px' }}>Φ = B × A | H = N×I/l | B = μ₀μᵣH</div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>Flux Density: 1.2T | Permeability: 2000</div>
            </div>
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Loss Equations</div>
              <div style={{ color: '#f8fafc', fontSize: '12px' }}>P_core = P_h + P_e | P_h = k_h×f×B^α</div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>P_e = k_e×f²×B²×V | Total: {((100 - transformer.efficiency) * 0.5).toFixed(1)}W</div>
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

export default NewTransformerSimulator;

