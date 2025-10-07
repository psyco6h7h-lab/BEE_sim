import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface OhmState {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  lockedParameter: 'voltage' | 'current' | 'resistance' | 'none';
  isConnected: boolean;
  frequency: number;
}

interface GraphData {
  voltage: number[];
  current: number[];
  power: number[];
  resistance: number[];
  time: number[];
}

const EnhancedOhmLawSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const voltageCanvasRef = useRef<HTMLCanvasElement>(null);
  const powerCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [_time, setTime] = useState(0);
  
  const [ohm, setOhm] = useState<OhmState>({
    voltage: 12,
    current: 2,
    resistance: 6,
    power: 24,
    lockedParameter: 'none',
    isConnected: false,
    frequency: 1
  });

  // Tab states for theory section and calculator modes
  const [activeTheoryTab, setActiveTheoryTab] = useState('basic');
  const [activeCalculatorMode, setActiveCalculatorMode] = useState('basic');

  // Theory tab configuration
  const theoryTabs = [
    { id: 'basic', label: '📖 Basic Ohm\'s Law', icon: '📖' },
    { id: 'circuits', label: '⚡ Circuit Analysis', icon: '⚡' },
    { id: 'power', label: '🔋 Power & Energy', icon: '🔋' },
    { id: 'applications', label: '🏭 Real Applications', icon: '🏭' },
    { id: 'safety', label: '⚠️ Safety & Limits', icon: '⚠️' }
  ];

  // Calculator mode configuration
  const calculatorModes = [
    { id: 'basic', label: '🔧 Basic Ohm\'s Law', icon: '🔧' },
    { id: 'power', label: '⚡ Power Analysis', icon: '⚡' },
    { id: 'circuits', label: '🔗 Circuit Combinations', icon: '🔗' },
    { id: 'temperature', label: '🌡️ Temperature Effects', icon: '🌡️' }
  ];

  // Graph data for real-time visualization
  const [graphData, setGraphData] = useState<GraphData>({
    voltage: [],
    current: [],
    power: [],
    resistance: [],
    time: []
  });

  const [visualMode, setVisualMode] = useState<'water' | 'circuit' | 'graph'>('circuit');

  // Memoized calculations for performance
  const calculations = useMemo(() => {
    const power = ohm.voltage * ohm.current;
    const energy = power * 1; // Energy per second
    const efficiency = 100; // Assuming ideal resistor
    const heatLoss = power * 0.1; // 10% heat loss
    const currentDensity = ohm.current / 1; // A/mm² (assuming 1mm² cross-section)
    
    return {
      power,
      energy,
      efficiency,
      heatLoss,
      currentDensity
    };
  }, [ohm.voltage, ohm.current, ohm.resistance]);

  const { power, energy: _energy, efficiency: _efficiency, heatLoss: _heatLoss, currentDensity: _currentDensity } = calculations;

  const calculateOhm = useCallback((changedParam: string, value: number) => {
    let newState = { ...ohm };
    
    switch (changedParam) {
      case 'voltage':
        newState.voltage = value;
        if (ohm.lockedParameter === 'resistance') {
          newState.current = value / ohm.resistance;
        } else {
          newState.resistance = value / ohm.current;
        }
        break;
      case 'current':
        newState.current = value;
        if (ohm.lockedParameter === 'resistance') {
          newState.voltage = value * ohm.resistance;
        } else {
          newState.resistance = ohm.voltage / value;
        }
        break;
      case 'resistance':
        newState.resistance = value;
        if (ohm.lockedParameter === 'voltage') {
          newState.current = ohm.voltage / value;
        } else {
          newState.voltage = value * ohm.current;
        }
        break;
    }
    
    newState.power = newState.voltage * newState.current;
    setOhm(newState);
  }, [ohm]);

  // Real-time data generation for graphs
  useEffect(() => {
    let intervalId: number;
    if (ohm.isConnected) {
      intervalId = window.setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 0.1;
          setGraphData(prev => {
            const newData = { ...prev };
            // Generate realistic AC-like data for demonstration
            const angularFrequency = 2 * Math.PI * ohm.frequency;
            newData.voltage.push(Math.abs(ohm.voltage * Math.sin(newTime * angularFrequency)));
            newData.current.push(Math.abs(ohm.current * Math.sin(newTime * angularFrequency)));
            newData.power.push(Math.abs(ohm.voltage * ohm.current * Math.sin(newTime * angularFrequency) * Math.sin(newTime * angularFrequency)));
            newData.resistance.push(ohm.resistance);
            newData.time.push(newTime);
            
            const maxPoints = 50;
            if (newData.voltage.length > maxPoints) {
              newData.voltage = newData.voltage.slice(-maxPoints);
              newData.current = newData.current.slice(-maxPoints);
              newData.power = newData.power.slice(-maxPoints);
              newData.resistance = newData.resistance.slice(-maxPoints);
              newData.time = newData.time.slice(-maxPoints);
            }
            return newData;
          });
          return newTime;
        });
      }, 50);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [ohm.isConnected, ohm.frequency, ohm.voltage, ohm.current, ohm.resistance]);

  // Graph animation system
  useEffect(() => {
    const animateVoltageGraph = () => {
      const canvas = voltageCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width * window.devicePixelRatio;
          canvas.height = rect.height * window.devicePixelRatio;
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
          ctx.clearRect(0, 0, rect.width, rect.height);

          if (ohm.isConnected && graphData.voltage.length > 1) {
            // Draw grid
            ctx.strokeStyle = 'rgba(59,130,246,0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
              const y = (rect.height / 4) * i;
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(rect.width, y);
              ctx.stroke();
            }

            // Draw voltage curve
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#3b82f6';
            ctx.beginPath();
            
            const maxVoltage = Math.max(...graphData.voltage);
            graphData.voltage.forEach((value, index) => {
              const x = (index / (graphData.voltage.length - 1)) * rect.width;
              const y = rect.height - (value / maxVoltage) * rect.height;
              if (index === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Draw paused state
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paused', rect.width / 2, rect.height / 2);
          }
        }
      }
    };

    const animatePowerGraph = () => {
      const canvas = powerCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width * window.devicePixelRatio;
          canvas.height = rect.height * window.devicePixelRatio;
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
          ctx.clearRect(0, 0, rect.width, rect.height);

          if (ohm.isConnected && graphData.power.length > 1) {
            // Draw grid
            ctx.strokeStyle = 'rgba(34,197,94,0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
              const y = (rect.height / 4) * i;
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(rect.width, y);
              ctx.stroke();
            }

            // Draw power curve
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#22c55e';
            ctx.beginPath();
            
            const maxPower = Math.max(...graphData.power);
            graphData.power.forEach((value, index) => {
              const x = (index / (graphData.power.length - 1)) * rect.width;
              const y = rect.height - (value / maxPower) * rect.height;
              if (index === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Draw paused state
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paused', rect.width / 2, rect.height / 2);
          }
        }
      }
    };

    let animationId: number;
    const runAnimation = () => {
      animateVoltageGraph();
      animatePowerGraph();
      animationId = requestAnimationFrame(runAnimation);
    };

    animationId = requestAnimationFrame(runAnimation);
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [ohm.isConnected, graphData.voltage, graphData.power]);

  const drawVisualization = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    if (visualMode === 'circuit') {
      // Circuit diagram
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      
      // Battery
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - 100, centerY - 50);
      ctx.lineTo(centerX - 100, centerY - 20);
      ctx.moveTo(centerX - 90, centerY - 50);
      ctx.lineTo(centerX - 90, centerY - 10);
      ctx.stroke();
      
      // Wires
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Top wire
      ctx.moveTo(centerX - 100, centerY - 50);
      ctx.lineTo(centerX + 100, centerY - 50);
      // Bottom wire
      ctx.moveTo(centerX - 100, centerY + 50);
      ctx.lineTo(centerX + 100, centerY + 50);
      // Right wire
      ctx.moveTo(centerX + 100, centerY - 50);
      ctx.lineTo(centerX + 100, centerY + 50);
      ctx.stroke();
      
      // Resistor (zigzag with HEAT visualization)
      const heatIntensity = Math.min(1, ohm.power / 100); // Heat based on power
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
      
      // Current flow animation (speed based on current)
      const flowSpeed = ohm.isConnected ? time * 0.003 * (ohm.current / 2) : 0; // Speed proportional to current
      const particles = Math.max(4, Math.floor(ohm.current * 3)); // More particles = more current
      
      for (let i = 0; i < particles; i++) {
        const progress = ((flowSpeed + i / particles) % 1);
        let x, y;
        
        if (progress < 0.25) {
          // Top wire
          x = centerX - 100 + (progress * 4) * 200;
          y = centerY - 50;
        } else if (progress < 0.5) {
          // Right wire down
          x = centerX + 100;
          y = centerY - 50 + ((progress - 0.25) * 4) * 100;
        } else if (progress < 0.75) {
          // Bottom wire left
          x = centerX + 100 - ((progress - 0.5) * 4) * 200;
          y = centerY + 50;
        } else {
          // Left wire up
          x = centerX - 100;
          y = centerY + 50 - ((progress - 0.75) * 4) * 100;
        }
        
        // Particle with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fbbf24';
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x, y, 3 + Math.sin(time * 0.01 + i) * 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
    } else if (visualMode === 'water') {
      // Water analogy
      ctx.fillStyle = '#3b82f6';
      
      // Water tank (voltage)
      const tankHeight = (ohm.voltage / 24) * 100;
      ctx.fillRect(centerX - 150, centerY + 50 - tankHeight, 60, tankHeight);
      
      // Pipe (wire)
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(centerX - 90, centerY + 45, 180, 10);
      
      // Restriction (resistance)
      const restrictionWidth = Math.max(2, 20 - (ohm.resistance / 10) * 15);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(centerX - restrictionWidth/2, centerY + 40, restrictionWidth, 20);
      
      // Water flow (current)
      ctx.fillStyle = '#22c55e';
      for (let i = 0; i < ohm.current * 2; i++) {
        const x = centerX - 80 + (time * 0.1 + i * 20) % 160;
        ctx.beginPath();
        ctx.arc(x, centerY + 50, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
    } else if (visualMode === 'graph') {
      // V-I characteristic curve
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      // Axes
      ctx.beginPath();
      ctx.moveTo(centerX - 150, centerY + 100);
      ctx.lineTo(centerX + 150, centerY + 100);
      ctx.moveTo(centerX - 150, centerY + 100);
      ctx.lineTo(centerX - 150, centerY - 100);
      ctx.stroke();
      
      // Graph line (V = I * R)
      ctx.beginPath();
      ctx.moveTo(centerX - 150, centerY + 100);
      ctx.lineTo(centerX + 150, centerY + 100 - (ohm.resistance * 10));
      ctx.stroke();
      
      // Current point
      const pointX = centerX - 150 + (ohm.current / 10) * 300;
      const pointY = centerY + 100 - (ohm.voltage / 24) * 200;
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // PHYSICS EQUATIONS & REAL-TIME CALCULATIONS
    ctx.textAlign = 'center';
    
    if (visualMode === 'circuit') {
      // Title
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('⚡ Ohm\'s Law: V = I × R', centerX, 40);
      
      // Component labels
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`${ohm.voltage.toFixed(1)} V`, centerX - 120, centerY - 30);
      
      ctx.fillStyle = ohm.power > 50 ? '#ff4444' : '#22c55e';
      ctx.fillText(`${ohm.resistance.toFixed(1)} Ω`, centerX, centerY - 80);
      ctx.font = '12px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(ohm.power > 50 ? '⚠️ HIGH HEAT' : '✓ Normal', centerX, centerY - 62);
      
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(`${ohm.current.toFixed(2)} A`, centerX + 120, centerY);
      
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
      
      // Real-time calculations box
      ctx.textAlign = 'left';
      ctx.font = '13px monospace';
      ctx.fillStyle = '#8b5cf6';
      const calcX = 20;
      const calcY = centerY - 100;
      ctx.fillText('📐 Calculations:', calcX, calcY);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px monospace';
      ctx.fillText(`V = I × R`, calcX, calcY + 20);
      ctx.fillText(`${ohm.voltage.toFixed(1)} = ${ohm.current.toFixed(2)} × ${ohm.resistance.toFixed(1)}`, calcX, calcY + 38);
      ctx.fillText(`P = V × I`, calcX, calcY + 60);
      ctx.fillText(`${ohm.power.toFixed(2)} = ${ohm.voltage.toFixed(1)} × ${ohm.current.toFixed(2)}`, calcX, calcY + 78);
      ctx.fillText(`P = I²R = ${(Math.pow(ohm.current, 2) * ohm.resistance).toFixed(2)} W`, calcX, calcY + 96);
      ctx.fillText(`P = V²/R = ${(Math.pow(ohm.voltage, 2) / ohm.resistance).toFixed(2)} W`, calcX, calcY + 114);
    }
    
  }, [ohm, visualMode]);

  const animate = useCallback((_currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Always draw, update time only when connected
    if (ohm.isConnected) {
      setTime(prev => prev + 1);
    }
    
    drawVisualization(ctx, _time);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawVisualization, ohm.isConnected, _time]);

  useEffect(() => {
    // Start animation loop immediately on mount
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
      canvas.width = window.innerWidth - 360; // Account for sidebar
      canvas.height = 400; // Fixed height
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      marginTop: '60px',
      background: '#040407',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowY: 'auto'
    }}>
      {/* Main Content Container */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 'calc(100vh - 60px)'
      }}>
        {/* Sidebar Controls */}
        <div style={{
          width: '320px',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
          padding: '24px',
          overflowY: 'auto',
          borderRight: '1px solid rgba(59,130,246,0.4)',
          boxShadow: '4px 0 16px rgba(15,23,42,0.45)',
          borderRadius: '0 20px 20px 0'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#3b82f6', marginBottom: '6px', fontSize: '20px', fontWeight: 700 }}>
              ⚡ Ohm's Law Laboratory
            </h3>
            <div style={{ fontSize: '12px', color: '#cbd5f5' }}>
              Interactive circuit simulation with real-time analysis
            </div>
          </div>

          {/* Parameter Controls */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              📊 Circuit Parameters
            </h4>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
                Voltage: {ohm.voltage.toFixed(1)}V
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="0.1"
                value={ohm.voltage}
                onChange={(e) => calculateOhm('voltage', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'linear-gradient(90deg, #1e40af, #3b82f6)',
                  borderRadius: '3px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
                Current: {ohm.current.toFixed(2)}A
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.01"
                value={ohm.current}
                onChange={(e) => calculateOhm('current', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'linear-gradient(90deg, #15803d, #22c55e)',
                  borderRadius: '3px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
                Resistance: {ohm.resistance.toFixed(1)}Ω
              </label>
              <input
                type="range"
                min="0.1"
                max="100"
                step="0.1"
                value={ohm.resistance}
                onChange={(e) => calculateOhm('resistance', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'linear-gradient(90deg, #c2410c, #f59e0b)',
                  borderRadius: '3px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
                Frequency: {ohm.frequency.toFixed(1)}Hz
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={ohm.frequency}
                onChange={(e) => setOhm(prev => ({ ...prev, frequency: parseFloat(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'linear-gradient(90deg, #6d28d9, #8b5cf6)',
                  borderRadius: '3px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Real-time Metrics */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              📈 Real-time Metrics
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(15,23,42,0.65)',
              border: '1px solid rgba(59,130,246,0.2)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Voltage</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>
                  {ohm.voltage.toFixed(1)}V
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Current</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
                  {ohm.current.toFixed(2)}A
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Resistance</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#8b5cf6' }}>
                  {ohm.resistance.toFixed(1)}Ω
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Power</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
                  {power.toFixed(1)}W
                </span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => {
                setOhm(prev => {
                  const newConnectedState = !prev.isConnected;
                  if (newConnectedState) {
                    setTime(0);
                    setGraphData({
                      voltage: [],
                      current: [],
                      power: [],
                      resistance: [],
                      time: []
                    });
                  }
                  return { ...prev, isConnected: newConnectedState };
                });
              }}
              style={{
                height: 'fit-content',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: ohm.isConnected 
                  ? 'linear-gradient(135deg, #ef4444, #b91c1c)' 
                  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: ohm.isConnected 
                  ? '0 4px 12px rgba(239,68,68,0.3)' 
                  : '0 4px 12px rgba(34,197,94,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {ohm.isConnected ? '⏸️ Pause' : '▶️ Start'}
            </button>
            
            <button
              onClick={() => setOhm({
                voltage: 12,
                current: 2,
                resistance: 6,
                frequency: 1,
                isConnected: false,
                lockedParameter: 'none',
                power: 24
              })}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(107,114,128,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              🔄 Reset
            </button>
          </div>

          {/* Visual Mode Selector */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              🎨 Visual Mode
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(['circuit', 'water', 'graph'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setVisualMode(mode)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: visualMode === mode ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(148,163,184,0.3)',
                    background: visualMode === mode ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: '#f8fafc',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left'
                  }}
                >
                  {mode === 'circuit' ? '⚡ Circuit View' : mode === 'water' ? '💧 Water Analogy' : '📊 Graph View'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Ohm's Law Visualization */}
          <div style={{ 
            height: '400px', // Fixed height for better performance
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '20px',
            margin: '20px',
            overflow: 'hidden'
          }}>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                background: 'rgba(2,6,23,0.9)',
                borderRadius: '15px'
              }}
            />
          </div>

          {/* Voltage & Power Graphs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            margin: '0 20px 20px 20px'
          }}>
            {/* Voltage Graph Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(30,64,175,0.1) 100%)',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              height: '200px',
              justifyContent: 'space-between'
            }}>
              <h4 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                📊 Voltage Graph
              </h4>
              <div style={{ height: '120px', position: 'relative', background: 'rgba(0,0,0,0.4)', borderRadius: '15px', border: '1px solid rgba(59,130,246,0.3)', overflow: 'hidden' }}>
                <canvas
                  ref={voltageCanvasRef}
                  style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Real-time voltage waveform
              </div>
            </div>

            {/* Power Graph Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(21,128,61,0.1) 100%)',
              border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              height: '200px',
              justifyContent: 'space-between'
            }}>
              <h4 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                ⚡ Power Graph
              </h4>
              <div style={{ height: '120px', position: 'relative', background: 'rgba(0,0,0,0.4)', borderRadius: '15px', border: '1px solid rgba(34,197,94,0.3)', overflow: 'hidden' }}>
                <canvas
                  ref={powerCanvasRef}
                  style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Power consumption over time
              </div>
            </div>
          </div>


          {/* Theory and Calculator Tabs */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '20px',
            padding: '25px',
            margin: '0 20px 20px 20px'
          }}>
          {/* Theory Section */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>
              📖 Theory & Concepts
            </h3>
            
            {/* Theory Tabs */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '25px',
              flexWrap: 'wrap'
            }}>
              {theoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTheoryTab(tab.id)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '25px',
                    border: activeTheoryTab === tab.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(148,163,184,0.3)',
                    background: activeTheoryTab === tab.id 
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(30,64,175,0.1))' 
                      : 'transparent',
                    color: activeTheoryTab === tab.id ? '#3b82f6' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Theory Content */}
            <div style={{
              background: 'rgba(59,130,246,0.05)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(59,130,246,0.1)'
            }}>
              {activeTheoryTab === 'basic' && (
                <div>
                  <h4 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    🔬 Basic Ohm's Law
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
                    Ohm's Law describes the relationship between voltage (V), current (I), and resistance (R) in an electrical circuit.
                  </p>
                  <div style={{
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '10px',
                    padding: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{ color: '#3b82f6', fontSize: '20px', fontWeight: 700, textAlign: 'center', marginBottom: '10px' }}>
                      V = I × R
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '12px', textAlign: 'center' }}>
                      Where: V = Voltage (Volts), I = Current (Amperes), R = Resistance (Ohms)
                    </div>
                  </div>
                  <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
                    <li>Voltage is the electrical pressure that pushes current through a circuit</li>
                    <li>Current is the flow of electric charge</li>
                    <li>Resistance opposes the flow of current</li>
                    <li>Power is calculated as P = V × I</li>
                  </ul>
                </div>
              )}
              
              {activeTheoryTab === 'circuits' && (
                <div>
                  <h4 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    ⚡ Circuit Analysis
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
                    Understanding how resistors behave in series and parallel configurations.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                    <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '10px', padding: '15px', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <h5 style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Series Circuits</h5>
                      <p style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5' }}>
                        R_total = R₁ + R₂ + R₃<br/>
                        Current is the same through all resistors
                      </p>
                    </div>
                    <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '10px', padding: '15px', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <h5 style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Parallel Circuits</h5>
                      <p style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5' }}>
                        1/R_total = 1/R₁ + 1/R₂ + 1/R₃<br/>
                        Voltage is the same across all resistors
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTheoryTab === 'power' && (
                <div>
                  <h4 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    🔋 Power & Energy
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
                    Electrical power is the rate at which energy is transferred or converted. Understanding power helps in designing efficient circuits and preventing component damage.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div style={{
                      padding: '20px',
                      background: 'rgba(245,158,11,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(245,158,11,0.2)'
                    }}>
                      <h5 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        ⚡ Power Formulas
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '8px' }}><strong style={{ color: '#f59e0b' }}>P = V × I</strong> (Basic power formula)</p>
                        <p style={{ marginBottom: '8px' }}><strong style={{ color: '#f59e0b' }}>P = I² × R</strong> (Current-based)</p>
                        <p style={{ marginBottom: '8px' }}><strong style={{ color: '#f59e0b' }}>P = V² / R</strong> (Voltage-based)</p>
                        <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                          All three formulas give the same result for resistive loads
                        </p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(139,92,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(139,92,246,0.2)'
                    }}>
                      <h5 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        🔥 Heat Dissipation
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>When current flows through a resistor, it generates heat:</p>
                        <p style={{ marginBottom: '8px' }}><strong>Heat = Power × Time</strong></p>
                        <p style={{ marginBottom: '8px' }}>This is why resistors have power ratings (1/4W, 1/2W, 1W, etc.)</p>
                        <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                          ⚠️ Exceeding power rating can damage components!
                        </p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(34,197,94,0.2)'
                    }}>
                      <h5 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        💡 Energy Consumption
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Energy (Wh) = Power (W) × Time (h)</strong></p>
                        <p style={{ marginBottom: '8px' }}>Example: A 60W light bulb running for 5 hours:</p>
                        <p style={{ marginBottom: '8px' }}>Energy = 60W × 5h = 300Wh = 0.3kWh</p>
                        <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                          Electricity bills are calculated in kWh
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTheoryTab === 'applications' && (
                <div>
                  <h4 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    🏭 Real Applications
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
                    Ohm's Law is fundamental to understanding how electrical circuits work in everyday devices and industrial applications.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div style={{
                      padding: '20px',
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      <h5 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        💡 LED Circuits
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>LEDs require current-limiting resistors:</p>
                        <p style={{ marginBottom: '8px' }}><strong>R = (V_supply - V_led) / I_led</strong></p>
                        <p style={{ marginBottom: '8px' }}>Example: 12V supply, 2V LED, 20mA:</p>
                        <p style={{ marginBottom: '8px' }}>R = (12 - 2) / 0.02 = 500Ω</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Use 470Ω or 560Ω (standard values)</p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(34,197,94,0.2)'
                    }}>
                      <h5 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        🔌 Power Supplies
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>Calculate required power supply capacity:</p>
                        <p style={{ marginBottom: '8px' }}><strong>P = V × I</strong></p>
                        <p style={{ marginBottom: '8px' }}>Example: 12V circuit drawing 2A:</p>
                        <p style={{ marginBottom: '8px' }}>P = 12V × 2A = 24W</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Add 20% headroom: Use 30W supply</p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(245,158,11,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(245,158,11,0.2)'
                    }}>
                      <h5 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        🔥 Heating Elements
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>Electric heaters use P = V²/R:</p>
                        <p style={{ marginBottom: '8px' }}>Example: 1500W heater at 120V:</p>
                        <p style={{ marginBottom: '8px' }}>R = V² / P = 120² / 1500 = 9.6Ω</p>
                        <p style={{ marginBottom: '8px' }}>Current: I = P / V = 12.5A</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Requires 15A circuit breaker</p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(139,92,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(139,92,246,0.2)'
                    }}>
                      <h5 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        ⚙️ Motor Control
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>DC motors follow Ohm's Law basics:</p>
                        <p style={{ marginBottom: '8px' }}>Starting current is very high (low R)</p>
                        <p style={{ marginBottom: '8px' }}>Running current is lower (back-EMF)</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Need current-limiting or soft-start circuits</p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(239,68,68,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(239,68,68,0.2)'
                    }}>
                      <h5 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        🎸 Audio Equipment
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>Speaker impedance matching:</p>
                        <p style={{ marginBottom: '8px' }}>8Ω speakers are standard</p>
                        <p style={{ marginBottom: '8px' }}>Amplifier power: P = V² / R</p>
                        <p style={{ marginBottom: '8px' }}>Example: 20V RMS into 8Ω = 50W</p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(16,185,129,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(16,185,129,0.2)'
                    }}>
                      <h5 style={{ color: '#10b981', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        🔋 Battery Life
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>Calculate battery runtime:</p>
                        <p style={{ marginBottom: '8px' }}>Time = Battery Capacity / Current</p>
                        <p style={{ marginBottom: '8px' }}>Example: 2000mAh battery, 200mA load:</p>
                        <p style={{ marginBottom: '8px' }}>Time = 2000 / 200 = 10 hours</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTheoryTab === 'safety' && (
                <div>
                  <h4 style={{ color: '#ef4444', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    ⚠️ Safety & Limits
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
                    Understanding electrical safety is crucial to prevent equipment damage, fires, and personal injury. Always follow these guidelines.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div style={{
                      padding: '20px',
                      background: 'rgba(239,68,68,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(239,68,68,0.2)'
                    }}>
                      <h5 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        🔥 Component Power Ratings
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Always check power ratings!</strong></p>
                        <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
                          <li>1/4W resistor: Max 0.25W</li>
                          <li>1/2W resistor: Max 0.5W</li>
                          <li>1W resistor: Max 1W</li>
                        </ul>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>⚠️ Use 50% derating for reliability</p>
                        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
                          Exceeding ratings causes overheating and fire risk!
                        </p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(245,158,11,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(245,158,11,0.2)'
                    }}>
                      <h5 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        ⚡ Wire Current Capacity
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Wire gauge vs. current:</strong></p>
                        <ul style={{ paddingLeft: '20px' }}>
                          <li>22 AWG: 0.5A max</li>
                          <li>18 AWG: 2A max</li>
                          <li>14 AWG: 15A max</li>
                          <li>12 AWG: 20A max</li>
                        </ul>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                          Undersized wire = overheating and fire hazard
                        </p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(139,92,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(139,92,246,0.2)'
                    }}>
                      <h5 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        🔌 Fuse & Breaker Sizing
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Protection devices:</strong></p>
                        <p style={{ marginBottom: '8px' }}>Fuse/breaker rating = 125% of normal current</p>
                        <p style={{ marginBottom: '8px' }}>Example: 10A load → Use 12.5A fuse</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                          ⚠️ Never use oversized protection!
                        </p>
                        <p style={{ fontSize: '12px', color: '#8b5cf6' }}>
                          It defeats the safety purpose
                        </p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      <h5 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        ⚠️ Voltage Safety Levels
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Danger levels:</strong></p>
                        <ul style={{ paddingLeft: '20px' }}>
                          <li>&lt; 50V: Generally safe (DC)</li>
                          <li>50-120V: Caution required</li>
                          <li>120-240V: High danger</li>
                          <li>&gt; 240V: Extreme danger</li>
                        </ul>
                        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
                          ⚠️ Current as low as 50mA can be fatal!
                        </p>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(34,197,94,0.2)'
                    }}>
                      <h5 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        ✅ Safety Best Practices
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <ul style={{ paddingLeft: '20px' }}>
                          <li>Always disconnect power before working</li>
                          <li>Use insulated tools</li>
                          <li>Test voltage before touching</li>
                          <li>Never work on live circuits</li>
                          <li>Use appropriate PPE (gloves, goggles)</li>
                          <li>Know first aid for electrical shock</li>
                        </ul>
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(220,38,38,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(220,38,38,0.2)'
                    }}>
                      <h5 style={{ color: '#dc2626', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        🚨 Short Circuit Dangers
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}><strong>When R → 0, I → ∞</strong></p>
                        <p style={{ marginBottom: '8px' }}>Short circuits cause:</p>
                        <ul style={{ paddingLeft: '20px' }}>
                          <li>Massive current flow</li>
                          <li>Extreme heat generation</li>
                          <li>Fire and explosion risk</li>
                          <li>Component destruction</li>
                        </ul>
                        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
                          ⚠️ Always use proper protection devices!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Add more theory content for other tabs */}
            </div>
          </div>

          {/* Calculator Section */}
          <div>
            <h3 style={{ color: '#22c55e', fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>
              🔧 Calculator Tools
            </h3>
            
            {/* Calculator Mode Tabs */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '25px',
              flexWrap: 'wrap'
            }}>
              {calculatorModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveCalculatorMode(mode.id)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '25px',
                    border: activeCalculatorMode === mode.id ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(148,163,184,0.3)',
                    background: activeCalculatorMode === mode.id 
                      ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(21,128,61,0.1))' 
                      : 'transparent',
                    color: activeCalculatorMode === mode.id ? '#22c55e' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Calculator Content */}
            <div style={{
              background: 'rgba(34,197,94,0.05)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(34,197,94,0.1)'
            }}>
              {activeCalculatorMode === 'basic' && (
                <div>
                  <h4 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    🔧 Basic Ohm's Law Calculator
                  </h4>
                  
                  {/* Parameter Controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                        Voltage (V): {ohm.voltage.toFixed(1)}V
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="0.1"
                        value={ohm.voltage}
                        onChange={(e) => calculateOhm('voltage', parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#3b82f6' }}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                        Current (I): {ohm.current.toFixed(2)}A
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.01"
                        value={ohm.current}
                        onChange={(e) => calculateOhm('current', parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#22c55e' }}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                        Resistance (R): {ohm.resistance.toFixed(1)}Ω
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={ohm.resistance}
                        onChange={(e) => calculateOhm('resistance', parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#8b5cf6' }}
                      />
                    </div>
                  </div>
                  
                  {/* Lock Parameter */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '10px', display: 'block' }}>
                      Lock Parameter:
                    </label>
                    <select
                      value={ohm.lockedParameter}
                      onChange={(e) => setOhm(prev => ({ ...prev, lockedParameter: e.target.value as any }))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(148,163,184,0.3)',
                        background: 'rgba(15,23,42,0.8)',
                        color: '#f8fafc',
                        fontSize: '14px'
                      }}
                    >
                      <option value="none">None</option>
                      <option value="voltage">Voltage</option>
                      <option value="current">Current</option>
                      <option value="resistance">Resistance</option>
                    </select>
                  </div>
                </div>
              )}
              
              {activeCalculatorMode === 'power' && (
                <div>
                  <h4 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    ⚡ Power Analysis Calculator
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {/* Current Power Analysis */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(245,158,11,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(245,158,11,0.2)'
                    }}>
                      <h5 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        📊 Current Circuit Power
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Voltage:</strong> {ohm.voltage.toFixed(2)}V
                        </p>
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Current:</strong> {ohm.current.toFixed(3)}A
                        </p>
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Resistance:</strong> {ohm.resistance.toFixed(2)}Ω
                        </p>
                        <div style={{
                          marginTop: '15px',
                          padding: '12px',
                          background: 'rgba(245,158,11,0.2)',
                          borderRadius: '8px'
                        }}>
                          <p style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
                            Power: {power.toFixed(3)} W
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Power Formulas */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      <h5 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        🔬 Power Calculation Methods
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#3b82f6' }}>Method 1:</strong> P = V × I
                        </p>
                        <p style={{ marginBottom: '12px', paddingLeft: '20px', color: '#94a3b8' }}>
                          = {ohm.voltage.toFixed(2)} × {ohm.current.toFixed(3)} = {(ohm.voltage * ohm.current).toFixed(3)}W
                        </p>
                        
                        <p style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#3b82f6' }}>Method 2:</strong> P = I² × R
                        </p>
                        <p style={{ marginBottom: '12px', paddingLeft: '20px', color: '#94a3b8' }}>
                          = {ohm.current.toFixed(3)}² × {ohm.resistance.toFixed(2)} = {(Math.pow(ohm.current, 2) * ohm.resistance).toFixed(3)}W
                        </p>
                        
                        <p style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#3b82f6' }}>Method 3:</strong> P = V² / R
                        </p>
                        <p style={{ paddingLeft: '20px', color: '#94a3b8' }}>
                          = {ohm.voltage.toFixed(2)}² / {ohm.resistance.toFixed(2)} = {(Math.pow(ohm.voltage, 2) / ohm.resistance).toFixed(3)}W
                        </p>
                      </div>
                    </div>

                    {/* Heat & Energy */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(239,68,68,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(239,68,68,0.2)'
                    }}>
                      <h5 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        🔥 Heat Dissipation Analysis
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '12px' }}>
                          <strong>Heat Generated per Hour:</strong>
                        </p>
                        <p style={{ paddingLeft: '20px', marginBottom: '8px', color: '#94a3b8' }}>
                          {(power * 3600).toFixed(1)} Joules/hour
                        </p>
                        <p style={{ paddingLeft: '20px', marginBottom: '12px', color: '#94a3b8' }}>
                          {(power * 0.860421).toFixed(3)} kcal/hour
                        </p>
                        
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Resistor Rating Needed:</strong>
                        </p>
                        <p style={{ paddingLeft: '20px', color: power < 0.125 ? '#22c55e' : power < 0.25 ? '#fbbf24' : '#ef4444' }}>
                          {power < 0.125 ? '✓ 1/4W (0.25W)' : power < 0.25 ? '⚠️ 1/2W (0.5W)' : power < 0.5 ? '⚠️ 1/2W (0.5W)' : power < 1 ? '⚠️ 1W' : `⚠️ ${Math.ceil(power)}W or higher`}
                        </p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                          Recommendation: Use {power < 0.125 ? '1/2W' : power < 0.25 ? '1W' : power < 0.5 ? '2W' : `${Math.ceil(power * 2)}W`} for 50% derating
                        </p>
                      </div>
                    </div>

                    {/* Energy Cost Calculator */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(34,197,94,0.2)'
                    }}>
                      <h5 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        💰 Energy Cost Calculator
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '12px' }}>
                          <strong>Energy Consumption:</strong>
                        </p>
                        <p style={{ paddingLeft: '20px', marginBottom: '6px' }}>
                          1 hour: {(power / 1000).toFixed(4)} kWh
                        </p>
                        <p style={{ paddingLeft: '20px', marginBottom: '6px' }}>
                          1 day (24h): {(power * 24 / 1000).toFixed(3)} kWh
                        </p>
                        <p style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                          1 month (30d): {(power * 24 * 30 / 1000).toFixed(2)} kWh
                        </p>
                        
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Cost (@$0.12/kWh):</strong>
                        </p>
                        <p style={{ paddingLeft: '20px', marginBottom: '6px' }}>
                          Daily: ${(power * 24 / 1000 * 0.12).toFixed(4)}
                        </p>
                        <p style={{ paddingLeft: '20px', color: '#22c55e' }}>
                          Monthly: ${(power * 24 * 30 / 1000 * 0.12).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCalculatorMode === 'circuits' && (
                <div>
                  <h4 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    🔗 Circuit Combinations Calculator
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {/* Series Resistors */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      <h5 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        ➕ Series Resistors
                      </h5>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '12px' }}>
                        In series, resistances add up directly
                      </p>
                      <div style={{
                        background: 'rgba(59,130,246,0.15)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '15px'
                      }}>
                        <p style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
                          R_total = R₁ + R₂ + R₃
                        </p>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Example:</strong>
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₁ = {ohm.resistance.toFixed(1)}Ω (Current circuit)
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₂ = 10Ω
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₃ = 15Ω
                        </p>
                        <p style={{ paddingLeft: '15px', marginTop: '10px', color: '#3b82f6', fontWeight: 600 }}>
                          R_total = {(ohm.resistance + 10 + 15).toFixed(1)}Ω
                        </p>
                        <p style={{ paddingLeft: '15px', fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                          Current: I = {ohm.voltage.toFixed(1)}V / {(ohm.resistance + 10 + 15).toFixed(1)}Ω = {(ohm.voltage / (ohm.resistance + 10 + 15)).toFixed(3)}A
                        </p>
                      </div>
                    </div>

                    {/* Parallel Resistors */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(139,92,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(139,92,246,0.2)'
                    }}>
                      <h5 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        ⚡ Parallel Resistors
                      </h5>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '12px' }}>
                        In parallel, reciprocals add up
                      </p>
                      <div style={{
                        background: 'rgba(139,92,246,0.15)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '15px'
                      }}>
                        <p style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
                          1/R_total = 1/R₁ + 1/R₂
                        </p>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Example (2 resistors):</strong>
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₁ = {ohm.resistance.toFixed(1)}Ω
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₂ = 10Ω
                        </p>
                        <p style={{ paddingLeft: '15px', marginTop: '10px', color: '#8b5cf6', fontWeight: 600 }}>
                          R_total = {((ohm.resistance * 10) / (ohm.resistance + 10)).toFixed(2)}Ω
                        </p>
                        <p style={{ paddingLeft: '15px', fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                          Shortcut: R = (R₁ × R₂) / (R₁ + R₂)
                        </p>
                        <p style={{ paddingLeft: '15px', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          Current: I = {ohm.voltage.toFixed(1)}V / {((ohm.resistance * 10) / (ohm.resistance + 10)).toFixed(2)}Ω = {(ohm.voltage / ((ohm.resistance * 10) / (ohm.resistance + 10))).toFixed(3)}A
                        </p>
                      </div>
                    </div>

                    {/* Voltage Divider */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(245,158,11,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(245,158,11,0.2)'
                    }}>
                      <h5 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        📉 Voltage Divider
                      </h5>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '12px' }}>
                        Divides voltage proportionally
                      </p>
                      <div style={{
                        background: 'rgba(245,158,11,0.15)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '15px'
                      }}>
                        <p style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
                          V_out = V_in × (R₂ / (R₁ + R₂))
                        </p>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Example:</strong>
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          V_in = {ohm.voltage.toFixed(1)}V
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₁ = {ohm.resistance.toFixed(1)}Ω (top)
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₂ = 10Ω (bottom)
                        </p>
                        <p style={{ paddingLeft: '15px', marginTop: '10px', color: '#f59e0b', fontWeight: 600 }}>
                          V_out = {(ohm.voltage * 10 / (ohm.resistance + 10)).toFixed(2)}V
                        </p>
                        <p style={{ paddingLeft: '15px', fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                          Voltage across R₂
                        </p>
                      </div>
                    </div>

                    {/* Current Divider */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(34,197,94,0.2)'
                    }}>
                      <h5 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        ⚡ Current Divider
                      </h5>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '12px' }}>
                        Divides current inversely to resistance
                      </p>
                      <div style={{
                        background: 'rgba(34,197,94,0.15)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '15px'
                      }}>
                        <p style={{ color: '#22c55e', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
                          I₁ = I_total × (R₂ / (R₁ + R₂))
                        </p>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Example:</strong>
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          I_total = {ohm.current.toFixed(3)}A
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₁ = {ohm.resistance.toFixed(1)}Ω
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          R₂ = 10Ω (parallel)
                        </p>
                        <p style={{ paddingLeft: '15px', marginTop: '10px', color: '#22c55e', fontWeight: 600 }}>
                          I₁ = {(ohm.current * 10 / (ohm.resistance + 10)).toFixed(4)}A
                        </p>
                        <p style={{ paddingLeft: '15px', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          I₂ = {(ohm.current * ohm.resistance / (ohm.resistance + 10)).toFixed(4)}A
                        </p>
                        <p style={{ paddingLeft: '15px', fontSize: '12px', color: '#94a3b8' }}>
                          (Current goes inversely with R)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCalculatorMode === 'temperature' && (
                <div>
                  <h4 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                    🌡️ Temperature Effects Calculator
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {/* Temperature Coefficient */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(239,68,68,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(239,68,68,0.2)'
                    }}>
                      <h5 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        🌡️ Temperature Coefficient
                      </h5>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '12px' }}>
                        Resistance changes with temperature
                      </p>
                      <div style={{
                        background: 'rgba(239,68,68,0.15)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '15px'
                      }}>
                        <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
                          R(T) = R₀[1 + α(T - T₀)]
                        </p>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}>
                          <strong>Common α values (ppm/°C):</strong>
                        </p>
                        <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
                          <li>Copper: +3900 ppm/°C</li>
                          <li>Aluminum: +3900 ppm/°C</li>
                          <li>Nichrome: +400 ppm/°C</li>
                          <li>Carbon: -500 ppm/°C</li>
                          <li>Metal film resistor: ±50-100 ppm/°C</li>
                        </ul>
                      </div>
                    </div>

                    {/* Copper Wire Example */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(245,158,11,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(245,158,11,0.2)'
                    }}>
                      <h5 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        🔶 Copper Wire (α = 0.00393/°C)
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '12px' }}>
                          <strong>At 20°C (reference):</strong>
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '12px' }}>
                          R₀ = {ohm.resistance.toFixed(2)}Ω
                        </p>
                        
                        <p style={{ marginBottom: '8px' }}>
                          <strong>At different temperatures:</strong>
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          0°C: {(ohm.resistance * (1 + 0.00393 * (0 - 20))).toFixed(3)}Ω
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          50°C: {(ohm.resistance * (1 + 0.00393 * (50 - 20))).toFixed(3)}Ω
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          75°C: {(ohm.resistance * (1 + 0.00393 * (75 - 20))).toFixed(3)}Ω
                        </p>
                        <p style={{ paddingLeft: '15px', color: '#ef4444' }}>
                          100°C: {(ohm.resistance * (1 + 0.00393 * (100 - 20))).toFixed(3)}Ω
                        </p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                          ⚠️ {((0.00393 * 80 * 100).toFixed(1))}% increase at 100°C!
                        </p>
                      </div>
                    </div>

                    {/* Current Changes with Temperature */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      <h5 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        ⚡ Current vs Temperature
                      </h5>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '12px' }}>
                        As resistance increases, current decreases
                      </p>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '12px' }}>
                          <strong>At {ohm.voltage.toFixed(1)}V supply:</strong>
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          20°C: I = {(ohm.voltage / ohm.resistance).toFixed(3)}A
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          50°C: I = {(ohm.voltage / (ohm.resistance * (1 + 0.00393 * 30))).toFixed(3)}A
                        </p>
                        <p style={{ paddingLeft: '15px', marginBottom: '6px' }}>
                          75°C: I = {(ohm.voltage / (ohm.resistance * (1 + 0.00393 * 55))).toFixed(3)}A
                        </p>
                        <p style={{ paddingLeft: '15px', color: '#3b82f6' }}>
                          100°C: I = {(ohm.voltage / (ohm.resistance * (1 + 0.00393 * 80))).toFixed(3)}A
                        </p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                          Current drops as wire heats up!
                        </p>
                      </div>
                    </div>

                    {/* Practical Considerations */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(139,92,246,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(139,92,246,0.2)'
                    }}>
                      <h5 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>
                        💡 Practical Considerations
                      </h5>
                      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '12px' }}>
                          <strong>Why this matters:</strong>
                        </p>
                        <ul style={{ paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                          <li>Motor starting current decreases as windings heat up</li>
                          <li>LED current-limiting resistors change with temperature</li>
                          <li>Precision circuits need temperature compensation</li>
                          <li>Wire ampacity ratings account for heating</li>
                          <li>Thermistors use this effect for sensing</li>
                        </ul>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', padding: '10px', background: 'rgba(139,92,246,0.1)', borderRadius: '6px' }}>
                          💡 Tip: Use metal film resistors for better temperature stability (±50ppm/°C vs ±500ppm/°C for carbon)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Add more calculator modes */}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedOhmLawSimulator;


