import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLightweightStore } from '../store/lightweightStore';

type MotorType = 'DC' | 'AC';

const EnhancedMotorLab: React.FC = React.memo(() => {
  const [state] = useLightweightStore();
  const [motorType, setMotorType] = useState<MotorType>('DC');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const rotorAngleRef = useRef<number>(0);
  
  // AC Motor State
  const [acMotor, setAcMotor] = useState({
    speed: 1000,
    torque: 5.0,
    voltage: 220,
    current: 2.5,
    frequency: 50,
    efficiency: 85,
    isRunning: false
  });

  // DC Motor State (for controlling the iframe)
  const [dcMotor, setDcMotor] = useState({
    magneticField: 1.8,
    batteryVoltage: 5.0,
    numberOfLoops: 2,
    animationSpeed: 1.0,
    isRunning: true
  });

  // Send messages to iframe to control it (no reloading!)
  useEffect(() => {
    if (motorType !== 'DC') return;
    
    const iframe = document.getElementById('dcMotorIframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'updateMotorParams',
        magneticField: dcMotor.magneticField,
        voltage: dcMotor.batteryVoltage,
        loops: dcMotor.numberOfLoops,
        speed: dcMotor.animationSpeed,
        running: dcMotor.isRunning
      }, '*');
    }
  }, [dcMotor, motorType]);

  // Force refresh mechanism for AC motor after page refresh - FIXED INFINITE LOOP
  useEffect(() => {
    if (motorType === 'AC') {
      // Force a complete re-render after component mount
      const forceRefresh = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Clear and force immediate redraw
            const refreshDpr = Math.max(window.devicePixelRatio || 1, 1);
            const displayWidth = canvas.width / refreshDpr;
            const displayHeight = canvas.height / refreshDpr;
            ctx.clearRect(0, 0, displayWidth, displayHeight);
            // DON'T trigger state update to avoid infinite loop
          }
        }
      };
      
      // Single refresh attempt to avoid infinite loops
      const timeoutId = setTimeout(forceRefresh, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [motorType]); // Only run when motorType changes, not on every render

  // Professional AC Motor Visualization - Perfect Alignment & Crisp Rendering
  const drawACMotor = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    // Ultra-crisp rendering settings
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Get canvas dimensions in CSS pixels for proper alignment
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const canvasWidth = ctx.canvas.width / dpr;
    const canvasHeight = ctx.canvas.height / dpr;
    
    // Perfect center calculation with pixel-perfect alignment
    const centerX = Math.round(canvasWidth / 2);
    const centerY = Math.round(canvasHeight / 2);
    
    // Consistent scaling for all screen sizes - BIGGER MOTOR
    const minDimension = Math.min(canvasWidth, canvasHeight);
    const baseScale = minDimension / 600; // Smaller divisor = bigger motor
    const scale = Math.max(Math.min(baseScale, 1.5), 0.8); // Increased max scale for bigger motor
    
    // Clear canvas with crisp edges
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Grid
    if (state.showGrid) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvasWidth; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvasHeight; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
      
      // Debug crosshair removed - motor is now properly centered and sized
    }

    // Professional Motor Casing - Outer Frame
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 180 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Stator Frame - Professional Blue Ring
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 150 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Stator Ring - Dashed
    ctx.strokeStyle = 'rgba(30, 64, 175, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 130 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Professional Stator Windings - Perfect 3-Phase Alignment
    const phases = [
      { name: 'A', color: '#ef4444', offset: 0 },           // 0° - Right
      { name: 'B', color: '#22c55e', offset: Math.PI * 2 / 3 }, // 120° - Bottom Left
      { name: 'C', color: '#3b82f6', offset: Math.PI * 4 / 3 }  // 240° - Top Left
    ];
    
    // Draw stator windings - 6 coils per phase for professional look
    phases.forEach(phase => {
      for (let i = 0; i < 6; i++) {
        const angle = phase.offset + (i * Math.PI * 2) / 6;
        const x = centerX + Math.cos(angle) * 140 * scale;
        const y = centerY + Math.sin(angle) * 140 * scale;
        
        // Professional winding coils
        ctx.fillStyle = phase.color;
        ctx.beginPath();
        ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Coil connections to stator
        ctx.strokeStyle = phase.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(centerX + Math.cos(angle) * 150 * scale, centerY + Math.sin(angle) * 150 * scale);
        ctx.stroke();
      }
    });
    
    // Professional Phase Labels - Perfectly Aligned
    phases.forEach((phase) => {
      const labelAngle = phase.offset;
      const labelX = centerX + Math.cos(labelAngle) * 170 * scale;
      const labelY = centerY + Math.sin(labelAngle) * 170 * scale;
      
      // Phase label background - larger for better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(labelX, labelY, 16 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Phase label text - perfectly centered
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${16 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(phase.name, labelX, labelY);
    });

    // Simple air gap
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 90 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotor rotation
    if (acMotor.isRunning) {
      rotorAngleRef.current += (acMotor.speed / 60) * (acMotor.frequency / 50) * 0.04;
    }
    
    // Professional Rotor - Perfectly Centered
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotorAngleRef.current);
    
    // Rotor Core - Professional Red Iron Core
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, 80 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Rotor Shaft - Professional Steel Shaft
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(0, 0, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Professional Squirrel Cage Rotor Bars - Perfectly Aligned
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const x1 = Math.cos(angle) * 25 * scale;
      const y1 = Math.sin(angle) * 25 * scale;
      const x2 = Math.cos(angle) * 75 * scale;
      const y2 = Math.sin(angle) * 75 * scale;
      
      // Professional rotor bars
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // Bar end connections
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x2, y2, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Professional End Rings - Squirrel Cage Connections
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 75 * scale, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();

    // Professional Motor Shaft - Extends Through Motor
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(centerX - 120 * scale, centerY);
    ctx.lineTo(centerX + 120 * scale, centerY);
    ctx.stroke();
    
    // Shaft Bearings - Professional Support - Adjusted for bigger motor
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX - 120 * scale, centerY, 15 * scale, 0, Math.PI * 2); // Further out for bigger motor
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX + 120 * scale, centerY, 15 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Professional Magnetic Field Indicator
    if (acMotor.isRunning) {
      const fieldAngle = time * 0.004 * (acMotor.frequency / 50);
      const fieldX = centerX + Math.cos(fieldAngle) * 140 * scale; // Bigger radius for bigger motor
      const fieldY = centerY + Math.sin(fieldAngle) * 140 * scale;
      
      // Professional field arrow
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(fieldX, fieldY);
      ctx.stroke();
      
      // Arrowhead
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.moveTo(fieldX, fieldY);
      ctx.lineTo(
        fieldX - Math.cos(fieldAngle - Math.PI / 6) * 10 * scale,
        fieldY - Math.sin(fieldAngle - Math.PI / 6) * 10 * scale
      );
      ctx.lineTo(
        fieldX - Math.cos(fieldAngle + Math.PI / 6) * 10 * scale,
        fieldY - Math.sin(fieldAngle + Math.PI / 6) * 10 * scale
      );
      ctx.closePath();
      ctx.fill();
      
      // Field label
      ctx.fillStyle = '#8b5cf6';
      ctx.font = `bold ${12 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('B-field', fieldX + Math.cos(fieldAngle) * 20 * scale, fieldY + Math.sin(fieldAngle) * 20 * scale);
    }

    // Professional 3-Phase Power Connections - Adjusted for bigger motor
    const powerPhases = [
      { color: '#22c55e', y: -150 * scale, label: 'L1' },
      { color: '#ef4444', y: -125 * scale, label: 'L2' },
      { color: '#3b82f6', y: -100 * scale, label: 'L3' }
    ];
    
    powerPhases.forEach(phase => {
      // Power line
      ctx.strokeStyle = phase.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - 220 * scale, centerY + phase.y); // Further left for bigger motor
      ctx.lineTo(centerX - 180 * scale, centerY + phase.y);
      ctx.stroke();
      
      // Power label
      ctx.fillStyle = phase.color;
      ctx.font = `bold ${12 * scale}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(phase.label, centerX - 230 * scale, centerY + phase.y + 5 * scale);
    });

    // Simple shaft - Adjusted for bigger motor
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - 140 * scale, centerY); // Longer shaft for bigger motor
    ctx.lineTo(centerX + 140 * scale, centerY);
    ctx.stroke();

    // Professional Title and Subtitle - Positioned higher to avoid interference
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('AC Induction Motor', centerX, centerY - 250 * scale);
    
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Three-Phase Squirrel Cage Design', centerX, centerY - 225 * scale);
    
    // Professional Status Display - Fixed positioning to prevent overlap
    const statusY = Math.min(centerY + 220 * scale, canvasHeight - 30); // Further down for bigger motor
    const indicatorY = Math.min(centerY + 220 * scale, canvasHeight - 30);
    
    if (acMotor.isRunning) {
      ctx.fillStyle = '#22c55e';
      ctx.font = `bold ${14 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ Running: ${acMotor.speed} RPM`, centerX, statusY);
      
      // Rotation direction indicator - positioned safely
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      const indicatorX = Math.min(centerX + 160 * scale, canvasWidth - 30); // Further right for bigger motor
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 12 * scale, 0, Math.PI * 1.5);
      ctx.stroke();
      
      // Arrowhead
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(indicatorX, indicatorY - 10 * scale);
      ctx.lineTo(indicatorX - 5 * scale, indicatorY - 15 * scale);
      ctx.lineTo(indicatorX + 5 * scale, indicatorY - 15 * scale);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#22c55e';
      ctx.font = `bold ${10 * scale}px Arial`;
      ctx.fillText('CW', indicatorX, indicatorY + 15 * scale);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold ${14 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('⏸️ Motor Stopped', centerX, statusY);
    }
  }, [acMotor, state.showGrid]);

  // Ultra-Optimized Animation Loop - Perfect Performance & Crisp Rendering
  useEffect(() => {
    if (motorType !== 'AC') return;
    
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (time: number) => {
      // Throttle to target FPS for consistent performance
      if (time - lastTime >= frameInterval) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ultra-crisp rendering settings on every frame
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'high';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // Draw AC motor with perfect rendering
        drawACMotor(ctx, time);
        
        lastTime = time;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation immediately for smooth experience
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [motorType, drawACMotor]);

  // Ultra-Crisp Canvas Setup - Eliminates All Blurriness
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const setupDpr = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      
      // Calculate optimal dimensions
      const width = rect.width || window.innerWidth - 320;
      const height = rect.height || window.innerHeight - 60;
      
      // Ensure minimum dimensions for proper display
      const minWidth = 1000;
      const minHeight = 700;
      const finalWidth = Math.max(width, minWidth);
      const finalHeight = Math.max(height, minHeight);
      
      // Set CSS size (display size)
      canvas.style.width = finalWidth + 'px';
      canvas.style.height = finalHeight + 'px';
      
      // Set buffer size (actual canvas pixels) - CRITICAL for crisp rendering
      canvas.width = Math.floor(finalWidth * setupDpr);
      canvas.height = Math.floor(finalHeight * setupDpr);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Reset transform and scale for device pixel ratio
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(setupDpr, setupDpr);
        
        // Ultra-crisp rendering settings
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'high';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // Clear with crisp edges
        ctx.clearRect(0, 0, finalWidth, finalHeight);
        
        // Force immediate re-render for AC motor
        if (motorType === 'AC') {
          setTimeout(() => {
            drawACMotor(ctx, performance.now());
          }, 0);
        }
      }
    };

    // Setup canvas immediately
    setupCanvas();
    
    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setupCanvas, 16); // ~60fps
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Multiple setup calls to ensure perfect rendering after refresh
    const timeoutId1 = setTimeout(setupCanvas, 10);
    const timeoutId2 = setTimeout(setupCanvas, 100);
    const timeoutId3 = setTimeout(setupCanvas, 300);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [motorType, drawACMotor]);

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 60px)',
      marginTop: '60px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#ffffff'
    }}>
      {/* Sidebar - Fixed width and layout */}
      <div style={{
        width: '320px',
        minWidth: '320px',
        maxWidth: '320px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRight: '1px solid rgba(59, 130, 246, 0.3)',
        padding: '20px',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)',
        maxHeight: 'calc(100vh - 60px)',
        boxSizing: 'border-box',
        flexShrink: 0,
        position: 'relative'
      }}>
        {/* Educational Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '16px',
          border: '1px solid rgba(59,130,246,0.2)'
        }}>
          <h3 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            🎓 Motor Physics Lab
          </h3>
          <p style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.4' }}>
            Interactive simulation of electric motor principles, electromagnetic induction, and electromechanical energy conversion.
          </p>
        </div>

        {/* AC/DC Toggle */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
          background: 'rgba(30, 64, 175, 0.2)',
          borderRadius: '12px',
          padding: '6px'
        }}>
          <button
            onClick={() => setMotorType('DC')}
            style={{
              flex: 1,
              padding: '12px',
              background: motorType === 'DC' 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: motorType === 'DC' ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
            }}
          >
            ⚡ DC Motor (3D)
          </button>
          <button
            onClick={() => setMotorType('AC')}
            style={{
              flex: 1,
              padding: '12px',
              background: motorType === 'AC' 
                ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' 
                : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: motorType === 'AC' ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none'
            }}
          >
            🔄 AC Motor (2D)
          </button>
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: motorType === 'DC' 
              ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
              : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '18px'
          }}>
            {motorType === 'DC' ? '⚡' : '🔄'}
          </div>
          <div>
            <h2 style={{ 
              color: '#f1f5f9', 
              margin: 0,
              fontSize: '18px',
              fontWeight: '700'
            }}>
              {motorType} Motor Lab
            </h2>
            <p style={{ 
              color: '#94a3b8', 
              margin: 0,
              fontSize: '12px'
            }}>
              {motorType === 'DC' ? '3D Interactive Visualization' : '2D Physics Simulation'}
            </p>
          </div>
        </div>

        {/* AC Motor Controls */}
        {motorType === 'AC' && (
          <>
            {/* AC Motor Educational Content */}
            <div style={{
              background: 'rgba(139,92,246,0.1)',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '16px',
              border: '1px solid rgba(139,92,246,0.2)'
            }}>
              <h4 style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                🔬 How AC Induction Motors Work
              </h4>
              <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>1. Rotating Magnetic Field:</strong> Three-phase AC creates a rotating magnetic field in the stator.
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>2. Electromagnetic Induction:</strong> The rotating field induces current in the rotor bars (Faraday's Law).
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>3. Lenz's Law:</strong> Induced current creates its own magnetic field opposing the change.
                </div>
                <div>
                  <strong>4. Torque Production:</strong> Interaction between stator and rotor fields produces rotation.
                </div>
              </div>
            </div>

            {/* Physics Principles */}
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '16px',
              border: '1px solid rgba(34,197,94,0.2)'
            }}>
              <h4 style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                ⚡ Key Physics Principles
              </h4>
              <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Faraday's Law:</strong> E = -dΦ/dt (Induced EMF opposes flux change)
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Lenz's Law:</strong> Induced current opposes the change causing it
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Lorentz Force:</strong> F = q(v × B) (Force on moving charge in magnetic field)
                </div>
                <div>
                  <strong>Motor Constant:</strong> K = T/I (Torque per unit current)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#cbd5f5', fontSize: '14px', marginBottom: '10px', fontWeight: '600' }}>
                ⚙️ Motor Parameters
              </h4>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                  Voltage: {acMotor.voltage}V
                </label>
                <input
                  type="range"
                  min="100"
                  max="400"
                  value={acMotor.voltage}
                  onChange={(e) => setAcMotor(prev => ({ ...prev, voltage: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                  Frequency: {acMotor.frequency} Hz
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={acMotor.frequency}
                  onChange={(e) => setAcMotor(prev => ({ ...prev, frequency: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                  Speed: {acMotor.speed} RPM
                </label>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  value={acMotor.speed}
                  onChange={(e) => setAcMotor(prev => ({ ...prev, speed: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#cbd5f5', fontSize: '14px', marginBottom: '10px', fontWeight: '600' }}>
                📊 Performance
              </h4>
              <div style={{ color: '#fff', fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Current:</span>
                  <strong>{acMotor.current.toFixed(1)}A</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Torque:</span>
                  <strong>{acMotor.torque.toFixed(2)} N⋅m</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Efficiency:</span>
                  <strong style={{ color: '#22c55e' }}>{acMotor.efficiency}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Power:</span>
                  <strong>{((acMotor.voltage * acMotor.current * acMotor.efficiency) / 100).toFixed(1)}W</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAcMotor(prev => ({ ...prev, isRunning: !prev.isRunning }))}
              style={{
                width: '100%',
                padding: '12px',
                background: acMotor.isRunning 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {acMotor.isRunning ? '⏸️ Stop Motor' : '▶️ Start Motor'}
            </button>
          </>
        )}

        {/* DC Motor Controls */}
        {motorType === 'DC' && (
          <>
            {/* DC Motor Educational Content */}
            <div style={{
              background: 'rgba(59,130,246,0.1)',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '16px',
              border: '1px solid rgba(59,130,246,0.2)'
            }}>
              <h4 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                🔬 How DC Motors Work
              </h4>
              <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>1. Magnetic Field:</strong> Permanent magnets create a static magnetic field.
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>2. Current Flow:</strong> DC current flows through armature windings.
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>3. Lorentz Force:</strong> F = I × L × B (Force = Current × Length × Magnetic Field).
                </div>
                <div>
                  <strong>4. Commutation:</strong> Brushes and commutator reverse current direction for continuous rotation.
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
            }}>
              <h4 style={{ 
                color: '#e0e7ff', 
                fontSize: '14px', 
                marginBottom: '8px', 
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>⚙️</span> 3D Motor Controls
              </h4>
              <p style={{ color: '#a5b4fc', fontSize: '11px', lineHeight: '1.5', margin: 0 }}>
                Adjust parameters to control the 3D motor simulation in real-time.
              </p>
            </div>

            {/* DC Motor Physics Principles */}
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '16px',
              border: '1px solid rgba(34,197,94,0.2)'
            }}>
              <h4 style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                ⚡ DC Motor Physics
              </h4>
              <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Back EMF:</strong> E = Kω (Proportional to angular velocity)
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Torque:</strong> T = K × I (Proportional to current)
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Power:</strong> P = T × ω (Mechanical power output)
                </div>
                <div>
                  <strong>Efficiency:</strong> η = P_out / P_in (Output/Input power ratio)
                </div>
              </div>
            </div>

            {/* DC Motor Parameters */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                color: '#cbd5f5', 
                fontSize: '13px', 
                marginBottom: '12px', 
                fontWeight: '600',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Motor Parameters
              </h4>
              
              {/* Magnetic Field */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '500' }}>
                    🧲 Magnetic Field
                  </label>
                  <span style={{ 
                    color: '#3b82f6', 
                    fontSize: '13px', 
                    fontWeight: '700',
                    background: 'rgba(59, 130, 246, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {dcMotor.magneticField.toFixed(1)} T
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={dcMotor.magneticField}
                  onChange={(e) => setDcMotor(prev => ({ ...prev, magneticField: Number(e.target.value) }))}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    background: 'linear-gradient(to right, #1e40af, #3b82f6)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>1.0 T</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>2.0 T</span>
                </div>
              </div>

              {/* Battery Voltage */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '500' }}>
                    🔋 Battery Voltage
                  </label>
                  <span style={{ 
                    color: '#22c55e', 
                    fontSize: '13px', 
                    fontWeight: '700',
                    background: 'rgba(34, 197, 94, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {dcMotor.batteryVoltage.toFixed(1)} V
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={dcMotor.batteryVoltage}
                  onChange={(e) => setDcMotor(prev => ({ ...prev, batteryVoltage: Number(e.target.value) }))}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    background: 'linear-gradient(to right, #15803d, #22c55e)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>1.0 V</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>5.0 V</span>
                </div>
              </div>

              {/* Number of Loops */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '500' }}>
                    🌀 Number of Loops
                  </label>
                  <span style={{ 
                    color: '#f59e0b', 
                    fontSize: '13px', 
                    fontWeight: '700',
                    background: 'rgba(245, 158, 11, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {dcMotor.numberOfLoops}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={dcMotor.numberOfLoops}
                  onChange={(e) => setDcMotor(prev => ({ ...prev, numberOfLoops: Number(e.target.value) }))}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    background: 'linear-gradient(to right, #c2410c, #f59e0b)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>1 Loop</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>3 Loops</span>
                </div>
              </div>

              {/* Animation Speed */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '500' }}>
                    ⚡ Animation Speed
                  </label>
                  <span style={{ 
                    color: '#8b5cf6', 
                    fontSize: '13px', 
                    fontWeight: '700',
                    background: 'rgba(139, 92, 246, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {dcMotor.animationSpeed.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={dcMotor.animationSpeed}
                  onChange={(e) => setDcMotor(prev => ({ ...prev, animationSpeed: Number(e.target.value) }))}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    background: 'linear-gradient(to right, #6d28d9, #8b5cf6)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>0.1x</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>3.0x</span>
                </div>
              </div>
            </div>

            {/* Motor Info Display */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                color: '#cbd5f5', 
                fontSize: '13px', 
                marginBottom: '10px', 
                fontWeight: '600',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Motor Status
              </h4>
              <div style={{
                background: 'rgba(15,23,42,0.7)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Field Strength:</span>
                    <strong style={{ color: '#3b82f6' }}>{dcMotor.magneticField.toFixed(1)} T</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Voltage:</span>
                    <strong style={{ color: '#22c55e' }}>{dcMotor.batteryVoltage.toFixed(1)} V</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Coil Turns:</span>
                    <strong style={{ color: '#f59e0b' }}>{dcMotor.numberOfLoops}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Speed:</span>
                    <strong style={{ color: '#8b5cf6' }}>{dcMotor.animationSpeed.toFixed(1)}x</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <span style={{ color: '#94a3b8' }}>Power:</span>
                    <strong style={{ color: '#ef4444' }}>
                      {(dcMotor.batteryVoltage * dcMotor.magneticField * dcMotor.numberOfLoops * 0.5).toFixed(2)} W
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setDcMotor(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: dcMotor.isRunning 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: dcMotor.isRunning 
                    ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
                    : '0 4px 12px rgba(34, 197, 94, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {dcMotor.isRunning ? '⏸️ Pause Motor' : '▶️ Run Motor'}
              </button>

              <button
                onClick={() => setDcMotor({
                  magneticField: 1.5,
                  batteryVoltage: 2,
                  numberOfLoops: 1,
                  animationSpeed: 1,
                  isRunning: false
                })}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.4)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Reset to Defaults
              </button>
            </div>
          </>
        )}

        {/* Status */}
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '10px',
          padding: '10px',
          marginTop: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></div>
            <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '600' }}>
              {motorType} Motor Active
            </span>
          </div>
        </div>
      </div>
      
      {/* Main Content - Stable layout */}
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15), transparent 55%)',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {motorType === 'AC' ? (
          // Ultra-Crisp 2D Canvas for AC Motor
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              background: '#0f0f0f',
              imageRendering: 'crisp-edges',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              willChange: 'transform',
              outline: 'none',
              border: 'none',
              display: 'block'
            }}
          />
        ) : (
          // 3D iframe for DC Motor
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <iframe 
              id="dcMotorIframe"
              src="/dc-motor-simulator/index.html"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#0a0a0a',
                filter: 'brightness(0.9) contrast(1.2)'
              }}
              title="DC Motor 3D Simulator"
            />
            {/* Dark overlay to match theme */}
            <style>{`
              #dcMotorIframe {
                background: #0a0a0a !important;
              }
            `}</style>
          </div>
        )}

        {/* Status Bar */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '120px',
          right: '0',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(59, 130, 246, 0.3)',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: '#94a3b8', fontSize: '11px' }}>
              {motorType} Motor Physics Lab
            </div>
            <div style={{ color: motorType === 'DC' ? '#3b82f6' : '#8b5cf6', fontSize: '11px' }}>
              {motorType === 'DC' ? '3D Visualization' : '2D Simulation'}
            </div>
          </div>
          <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: '600' }}>
            ⚡ Ready
          </div>
        </div>
      </div>
    </div>
  );
});

export default EnhancedMotorLab;
