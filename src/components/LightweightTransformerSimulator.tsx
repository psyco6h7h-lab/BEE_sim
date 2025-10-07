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

const LightweightTransformerSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const fluxAnimationRef = useRef<number>(0);
  
  const [transformer, setTransformer] = useState<TransformerState>({
    primaryVoltage: 240,
    secondaryVoltage: 12,
    turnsRatio: 20,
    efficiency: 95,
    primaryCurrent: 0.5,
    secondaryCurrent: 10,
    isConnected: false
  });

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

    // E-SHAPED IRON CORE (Professional)
    const coreWidth = 40 * scale;
    const coreHeight = 240 * scale;
    
    // Core shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(centerX - coreWidth/2 + 4, centerY - coreHeight/2 + 4, coreWidth, coreHeight);
    
    // Main iron core (gray with gradient)
    const coreGradient = ctx.createLinearGradient(
      centerX - coreWidth/2, centerY,
      centerX + coreWidth/2, centerY
    );
    coreGradient.addColorStop(0, '#4b5563');
    coreGradient.addColorStop(0.5, '#6b7280');
    coreGradient.addColorStop(1, '#4b5563');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(centerX - coreWidth/2, centerY - coreHeight/2, coreWidth, coreHeight);
    
    // Core laminations (realistic detail)
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
    
    // PRIMARY WINDING (Left side - detailed coils)
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
      
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.arc(centerX - 65 * scale, y, coilRadius - 6 - j * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // SECONDARY WINDING (Right side - fewer coils for step-down)
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
      
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 1;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.arc(centerX + 65 * scale, y, coilRadius - 6 - j * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Primary connections
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 100, centerY - 80);
    ctx.lineTo(centerX - 55, centerY - 80);
    ctx.moveTo(centerX - 100, centerY + 80);
    ctx.lineTo(centerX - 55, centerY + 80);
    ctx.stroke();

    // Secondary connections
    ctx.beginPath();
    ctx.moveTo(centerX + 55, centerY - 40);
    ctx.lineTo(centerX + 100, centerY - 40);
    ctx.moveTo(centerX + 55, centerY + 40);
    ctx.lineTo(centerX + 100, centerY + 40);
    ctx.stroke();

    // MAGNETIC FLUX ANIMATION (Physics-accurate)
    if (transformer.isConnected) {
      fluxAnimationRef.current += 0.08;
      
      // Flux through iron core (multiple lines showing density)
      for (let i = 0; i < 5; i++) {
        const offset = (fluxAnimationRef.current + i * 0.4) % (Math.PI * 2);
        const intensity = 0.4 + 0.6 * Math.sin(offset);
        
        ctx.strokeStyle = `rgba(139, 92, 246, ${intensity})`;
        ctx.lineWidth = 3;
        
        const xOffset = (i - 2) * 3;
        // Downward flux through core
        ctx.beginPath();
        ctx.moveTo(centerX + xOffset, centerY - coreHeight/2 + 10);
        ctx.lineTo(centerX + xOffset, centerY + coreHeight/2 - 10);
        ctx.stroke();
        
        // Flux density indicator (arrows)
        const arrowY = centerY - coreHeight/2 + 30 + (offset / (Math.PI * 2)) * (coreHeight - 60);
        ctx.fillStyle = `rgba(139, 92, 246, ${intensity})`;
        ctx.beginPath();
        ctx.moveTo(centerX + xOffset, arrowY);
        ctx.lineTo(centerX + xOffset - 4, arrowY - 8);
        ctx.lineTo(centerX + xOffset + 4, arrowY - 8);
        ctx.closePath();
        ctx.fill();
      }
      
      // External flux return path (leakage flux)
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 140 * scale, -Math.PI * 0.3, -Math.PI * 0.7, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 140 * scale, Math.PI * 0.3, Math.PI * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Voltage/Current indicators
    if (transformer.isConnected) {
      // Primary side particles
      for (let i = 0; i < 3; i++) {
        const progress = (time * 0.003 + i * 0.3) % 1;
        const x = centerX - 100 + progress * 45;
        const y = centerY - 80;
        
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Secondary side particles
      for (let i = 0; i < 2; i++) {
        const progress = (time * 0.005 + i * 0.5) % 1;
        const x = centerX + 55 + progress * 45;
        const y = centerY - 40;
        
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // PHYSICS EQUATIONS & LABELS
    // Title with icon
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Transformer Physics', centerX, centerY - coreHeight/2 - 30);
    
    // Turns ratio display (top)
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
    
    // Coil turns label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Arial';
    ctx.fillText(`(${n1} turns)`, centerX - 110 * scale, centerY - coreHeight/2 + 102);
    
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
    
    // Coil turns label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Arial';
    ctx.fillText(`(${n2} turns)`, centerX + 110 * scale, centerY - coreHeight/2 + 102);
    
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
    
    // Current relationship
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('I₁/I₂ = N₂/N₁ (Power Conservation)', centerX, centerY + coreHeight/2 + 70);
    
    // Efficiency indicator
    ctx.fillStyle = transformer.efficiency > 90 ? '#22c55e' : transformer.efficiency > 80 ? '#fbbf24' : '#ef4444';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`η = ${transformer.efficiency}% (${transformer.isConnected ? 'ACTIVE' : 'IDLE'})`, centerX, centerY + coreHeight/2 + 90);
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
      canvas.width = window.innerWidth - 320;
      canvas.height = window.innerHeight - 80;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', marginTop: '60px', background: '#040407', color: '#f8fafc' }}>
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

      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 25% 25%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(circle at 75% 30%, rgba(139,92,246,0.15), transparent 50%), radial-gradient(circle at 50% 80%, rgba(14,165,233,0.15), transparent 50%)',
          pointerEvents: 'none'
        }} />

        <canvas
          ref={canvasRef}
          style={{
            flex: 1,
            background: 'rgba(2,6,23,0.92)',
            borderLeft: '1px solid rgba(30, 64, 175, 0.3)'
          }}
        />

        <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.25)', color: '#f1f5f9', fontSize: '11px', display: 'flex', gap: '10px', boxShadow: '0 12px 24px rgba(15,23,42,0.25)' }}>
          <span>🔋 Transformer Simulation</span>
          <span>|</span>
          <span>Turns Ratio: 1:{(1 / transformer.turnsRatio).toFixed(2)}</span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: 'rgba(15,23,42,0.92)',
          borderTop: '1px solid rgba(59,130,246,0.2)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {transformer.isConnected ? 'Flux paths animated — secondary voltage responds instantly.' : 'Connect the primary coil to energise the transformer.'}
          </div>
          <div style={{ fontSize: '11px', color: transformer.isConnected ? '#22c55e' : '#f97316', fontFamily: 'monospace' }}>
            {transformer.isConnected ? 'ENERGISED' : 'STANDBY'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightweightTransformerSimulator;


