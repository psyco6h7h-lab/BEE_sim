import React, { useRef, useState, useEffect, useCallback } from 'react';

interface OhmState {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  visualMode: 'circuit' | 'water' | 'graph';
}

const ScrollBasedOhmLawSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isVisible, setIsVisible] = useState<boolean[]>([]);
  
  const [ohm, setOhm] = useState<OhmState>({
    voltage: 12,
    current: 2,
    resistance: 6,
    power: 24,
    visualMode: 'circuit'
  });

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-card-index') || '0');
          setIsVisible(prev => {
            const newVisible = [...prev];
            newVisible[index] = entry.isIntersecting;
            return newVisible;
          });
        });
      },
      { threshold: 0.3 }
    );

    const cards = document.querySelectorAll('[data-card-index]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const calculateOhm = useCallback(() => {
    const { voltage, current, resistance } = ohm;
    const calculatedPower = voltage * current;
    const calculatedResistance = voltage / current;
    const calculatedCurrent = voltage / resistance;
    
    setOhm(prev => ({
      ...prev,
      power: calculatedPower,
      resistance: calculatedResistance,
      current: calculatedCurrent
    }));
  }, [ohm.voltage, ohm.current, ohm.resistance]);

  const drawOhmLaw = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
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

    // BATTERY (Left side)
    const batteryWidth = 60 * scale;
    const batteryHeight = 40 * scale;
    const batteryX = centerX - 150 * scale;
    const batteryY = centerY - batteryHeight / 2;
    
    // Battery body
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(batteryX, batteryY, batteryWidth, batteryHeight);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(batteryX, batteryY, batteryWidth, batteryHeight);
    
    // Battery terminals
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(batteryX - 8, batteryY + 8, 8, 8);
    ctx.fillRect(batteryX - 8, batteryY + 24, 8, 8);
    
    // Battery label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${ohm.voltage}V`, batteryX + batteryWidth/2, batteryY - 10);

    // RESISTOR (Center - with heat visualization)
    const heatIntensity = Math.min(1, ohm.power / 100);
    const heatColor = `rgba(${255}, ${Math.floor(255 * (1 - heatIntensity))}, 0, ${0.3 + heatIntensity * 0.7})`;
    
    // Heat glow
    ctx.shadowBlur = 20 + heatIntensity * 30;
    ctx.shadowColor = heatColor;
    ctx.fillStyle = heatColor;
    ctx.fillRect(centerX - 60, centerY - 70, 120, 40);
    ctx.shadowBlur = 0;
    
    // Resistor body
    const resistorGradient = ctx.createLinearGradient(centerX - 50, centerY - 50, centerX + 50, centerY - 50);
    resistorGradient.addColorStop(0, '#16a34a');
    resistorGradient.addColorStop(0.5, `rgb(${Math.floor(255 * heatIntensity)}, ${Math.floor(200 * (1-heatIntensity))}, 0)`);
    resistorGradient.addColorStop(1, '#16a34a');
    
    ctx.strokeStyle = resistorGradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - 50, centerY - 50);
    for (let i = 0; i < 8; i++) {
      const x = centerX - 50 + (i * 12.5);
      const y = centerY - 50 + (i % 2 === 0 ? -12 : 12);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(centerX + 50, centerY - 50);
    ctx.stroke();
    
    // Resistor label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${ohm.resistance}Ω`, centerX, centerY - 80);

    // AMMETER (Right side)
    const ammeterX = centerX + 150 * scale;
    const ammeterY = centerY;
    const ammeterRadius = 30 * scale;
    
    // Ammeter body
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(ammeterX, ammeterY, ammeterRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Ammeter needle
    const needleAngle = (ohm.current / 5) * Math.PI; // Scale to 0-5A range
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ammeterX, ammeterY);
    ctx.lineTo(
      ammeterX + Math.cos(needleAngle - Math.PI/2) * (ammeterRadius - 5),
      ammeterY + Math.sin(needleAngle - Math.PI/2) * (ammeterRadius - 5)
    );
    ctx.stroke();
    
    // Ammeter label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${ohm.current.toFixed(2)}A`, ammeterX, ammeterY + ammeterRadius + 20);

    // WIRES (Connecting components)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fbbf24';
    
    // Wire from battery to resistor
    ctx.beginPath();
    ctx.moveTo(batteryX + batteryWidth, batteryY + batteryHeight/2);
    ctx.lineTo(centerX - 50, centerY - 50);
    ctx.stroke();
    
    // Wire from resistor to ammeter
    ctx.beginPath();
    ctx.moveTo(centerX + 50, centerY - 50);
    ctx.lineTo(ammeterX - ammeterRadius, ammeterY);
    ctx.stroke();
    
    // Return wire
    ctx.beginPath();
    ctx.moveTo(ammeterX + ammeterRadius, ammeterY);
    ctx.lineTo(centerX + 50, centerY + 50);
    ctx.lineTo(centerX - 50, centerY + 50);
    ctx.lineTo(batteryX, batteryY + batteryHeight/2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    // CURRENT FLOW PARTICLES
    const hasCurrent = ohm.current > 0.1;
    if (hasCurrent) {
      const time = Date.now() * 0.003 * Math.sqrt(ohm.current);
      const particleCount = Math.max(3, Math.floor(ohm.current * 8) + 2);
      
      for (let i = 0; i < particleCount; i++) {
        const progress = ((time + i / particleCount) % 1);
        
        // Calculate position along the wire path
        let x, y;
        if (progress < 0.25) {
          // Battery to resistor
          const segmentProgress = progress / 0.25;
          x = batteryX + batteryWidth + (centerX - 50 - batteryX - batteryWidth) * segmentProgress;
          y = batteryY + batteryHeight/2 + (centerY - 50 - batteryY - batteryHeight/2) * segmentProgress;
        } else if (progress < 0.5) {
          // Resistor to ammeter
          const segmentProgress = (progress - 0.25) / 0.25;
          x = centerX - 50 + (centerX + 50 - centerX + 50) * segmentProgress;
          y = centerY - 50;
        } else if (progress < 0.75) {
          // Ammeter to return
          const segmentProgress = (progress - 0.5) / 0.25;
          x = centerX + 50 + (ammeterX - ammeterRadius - centerX - 50) * segmentProgress;
          y = centerY - 50 + (ammeterY - centerY + 50) * segmentProgress;
        } else {
          // Return wire
          const segmentProgress = (progress - 0.75) / 0.25;
          x = ammeterX + ammeterRadius + (centerX + 50 - ammeterX - ammeterRadius) * segmentProgress;
          y = ammeterY + (centerY + 50 - ammeterY) * segmentProgress;
        }
        
        // Particle size based on current
        const particleSize = 2 + Math.min(2, ohm.current * 0.2);
        
        // Draw glowing particle
        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12 + ohm.current * 2;
        
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, particleSize + 2);
        glowGradient.addColorStop(0, '#fbbf24');
        glowGradient.addColorStop(0.5, '#f59e0b');
        glowGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, particleSize + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Main particle
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // POWER METER (bottom center)
    const meterWidth = 200;
    const meterHeight = 60;
    const meterX = centerX - meterWidth/2;
    const meterY = centerY + 80;
    
    // Meter background
    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    // Power bar
    const powerPercent = Math.min(1, ohm.power / 100);
    const barGradient = ctx.createLinearGradient(meterX, meterY, meterX + meterWidth * powerPercent, meterY);
    barGradient.addColorStop(0, '#22c55e');
    barGradient.addColorStop(0.5, '#fbbf24');
    barGradient.addColorStop(1, '#ef4444');
    ctx.fillStyle = barGradient;
    ctx.fillRect(meterX + 5, meterY + 5, (meterWidth - 10) * powerPercent, 25);
    
    // Power text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`POWER: ${ohm.power.toFixed(2)} W`, centerX, meterY + 50);

    // OHM'S LAW EQUATIONS (Top)
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Ohm\'s Law Simulator', centerX, centerY - 120);
    
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('V = I × R', centerX, centerY - 100);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`V = ${ohm.voltage}V, I = ${ohm.current.toFixed(2)}A, R = ${ohm.resistance}Ω`, centerX, centerY - 85);
    
    // Heat warning
    if (ohm.power > 50) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('⚠️ HIGH POWER - RESISTOR HEATING!', centerX, centerY + 140);
    }
  }, [ohm]);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawOhmLaw(ctx, time);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawOhmLaw]);

  useEffect(() => {
    calculateOhm();
  }, [calculateOhm]);

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
    <div style={{ background: '#040407', color: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
      {/* MAIN OHM'S LAW SECTION (Full Screen) */}
      <div style={{ 
        height: '100vh', 
        position: 'relative', 
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
            <h3 style={{ color: '#3b82f6', marginBottom: '6px', fontSize: '20px', fontWeight: 700 }}>Ohm's Law Lab</h3>
            <div style={{ fontSize: '12px', color: '#cbd5f5' }}>Explore the relationship between voltage, current, and resistance.</div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Parameters</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ fontSize: '12px', color: '#f8fafc' }}>
                Voltage: {ohm.voltage.toFixed(1)}V
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="0.1"
                  value={ohm.voltage}
                  onChange={(e) => setOhm(prev => ({ ...prev, voltage: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ fontSize: '12px', color: '#f8fafc' }}>
                Current: {ohm.current.toFixed(2)}A
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={ohm.current}
                  onChange={(e) => setOhm(prev => ({ ...prev, current: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ fontSize: '12px', color: '#f8fafc' }}>
                Resistance: {ohm.resistance.toFixed(1)}Ω
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.1"
                  value={ohm.resistance}
                  onChange={(e) => setOhm(prev => ({ ...prev, resistance: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Calculations</h4>
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
                { label: 'Power (P=VI)', value: `${ohm.power.toFixed(1)} W` },
                { label: 'Resistance', value: `${ohm.resistance.toFixed(1)} Ω` },
                { label: 'Current', value: `${ohm.current.toFixed(2)} A` },
                { label: 'Voltage', value: `${ohm.voltage.toFixed(1)} V` }
              ].map(stat => (
                <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{stat.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>{stat.value}</span>
                </div>
              ))}
            </div>
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

          <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.25)', color: '#f1f5f9', fontSize: '11px', boxShadow: '0 12px 24px rgba(15,23,42,0.25)' }}>
            <span>⚡ Ohm's Law: V = I × R</span>
          </div>
        </div>
      </div>

      {/* SCROLL CARDS SECTION */}
      <div style={{ padding: '0 0 100px 0', background: '#040407' }}>
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
          zIndex: 1000,
          animation: 'pulse 2s infinite'
        }}>
          ↓ Scroll Down for More Info ↓
        </div>
        
        {/* Card 1: V-I Relationship */}
        <div 
          data-card-index="0"
          style={{
            width: '100%',
            height: '500px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(59,130,246,0.5)',
            borderRadius: '0',
            margin: '0',
            padding: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: isVisible[0] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderTop: '3px solid #3b82f6',
            borderBottom: '3px solid #3b82f6'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>📈 V-I Relationship</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              The fundamental relationship between voltage and current in electrical circuits. 
              As voltage increases, current increases proportionally (for constant resistance).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Linear Relationship</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>I = V/R (Ohm's Law)</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Direct proportionality</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Current Flow</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>I = {ohm.current.toFixed(2)}A</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Electron movement</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#3b82f6', fontSize: '14px' }}>📊 V-I Graph Visualization</div>
          </div>
        </div>

        {/* Card 2: Power Calculations */}
        <div 
          data-card-index="1"
          style={{
            width: '100%',
            height: '500px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(34,197,94,0.5)',
            borderRadius: '0',
            margin: '0',
            padding: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: isVisible[1] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderTop: '3px solid #22c55e',
            borderBottom: '3px solid #22c55e'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#22c55e', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>⚡ Power Calculations</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Power in electrical circuits is calculated using multiple formulas. 
              Understanding these relationships helps in circuit design and analysis.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>P = VI</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Power = Voltage × Current</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Basic power formula</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>P = I²R</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Power = Current² × Resistance</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Joule heating</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: '14px' }}>🔥 Power & Heat Analysis</div>
          </div>
        </div>

        {/* Card 3: Resistance Effects */}
        <div 
          data-card-index="2"
          style={{
            width: '100%',
            height: '500px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(245,158,11,0.5)',
            borderRadius: '0',
            margin: '0',
            padding: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: isVisible[2] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderTop: '3px solid #f59e0b',
            borderBottom: '3px solid #f59e0b'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>🔧 Resistance Effects</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Resistance controls current flow in circuits. Higher resistance means lower current for the same voltage. 
              This affects power dissipation and circuit behavior.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Current Control</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>I = V/R</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Inverse relationship</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Heat Generation</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>P = I²R</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Power dissipation</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#f59e0b', fontSize: '14px' }}>🌡️ Resistance & Temperature</div>
          </div>
        </div>

        {/* Card 4: Real Applications */}
        <div 
          data-card-index="3"
          style={{
            width: '100%',
            height: '500px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(139,92,246,0.5)',
            borderRadius: '0',
            margin: '0',
            padding: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: isVisible[3] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderTop: '3px solid #8b5cf6',
            borderBottom: '3px solid #8b5cf6'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#8b5cf6', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>🌍 Real Applications</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Ohm's Law is fundamental to electrical engineering and appears in countless real-world applications 
              from household electronics to industrial power systems.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Circuit Design</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Component sizing</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Voltage dividers, current limiting</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Power Systems</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Load calculations</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Grid stability, efficiency</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#8b5cf6', fontSize: '14px' }}>🏭 Industrial Applications</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScrollBasedOhmLawSimulator;
