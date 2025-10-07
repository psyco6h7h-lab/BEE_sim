import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useLightweightStore } from '../store/lightweightStore';

interface TransformerState {
  primaryVoltage: number;
  secondaryVoltage: number;
  turnsRatio: number;
  efficiency: number;
  primaryCurrent: number;
  secondaryCurrent: number;
  loadResistance: number;
  isConnected: boolean;
  frequency: number;
}

interface GraphData {
  voltage: number[];
  current: number[];
  power: number[];
  efficiency: number[];
  time: number[];
}

  // Performance optimization constants - MAXIMUM SPEED
  const ANIMATION_FPS = 15; // Reduced to 15 FPS for maximum speed
  const ANIMATION_THROTTLE = 1000 / ANIMATION_FPS; // ~67ms between frames

const EnhancedTransformerSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const voltageCanvasRef = useRef<HTMLCanvasElement>(null);
  const [state] = useLightweightStore();
  const [time, setTime] = useState(0);
  
  const [transformer, setTransformer] = useState<TransformerState>({
    primaryVoltage: 220,
    secondaryVoltage: 110,
    turnsRatio: 2,
    efficiency: 95,
    primaryCurrent: 2.5,
    secondaryCurrent: 5.0,
    loadResistance: 22,
    isConnected: false, // Start as paused/stopped
    frequency: 50
  });

  // Tab states for theory section and calculator modes
  const [activeTheoryTab, setActiveTheoryTab] = useState('basic');
  const [activeCalculatorMode, setActiveCalculatorMode] = useState('basic');

  // Theory tab configuration
  const theoryTabs = [
    { id: 'basic', label: '📖 Basic Theory', icon: '📖' },
    { id: 'types', label: '⚡ Types', icon: '⚡' },
    { id: 'applications', label: '🏭 Applications', icon: '🏭' },
    { id: 'safety', label: '⚠️ Safety', icon: '⚠️' },
    { id: 'advanced', label: '🔬 Advanced', icon: '🔬' }
  ];

  // Calculator mode configuration
  const calculatorModes = [
    { id: 'basic', label: '🔧 Basic', icon: '🔧' },
    { id: 'power', label: '⚡ Power', icon: '⚡' },
    { id: 'efficiency', label: '📊 Efficiency', icon: '📊' },
    { id: 'loss', label: '📉 Loss Analysis', icon: '📉' }
  ];

  // Graph data for real-time visualization
  const [graphData, setGraphData] = useState<GraphData>({
    voltage: [],
    current: [],
    power: [],
    efficiency: [],
    time: []
  });

  // Memoized calculations for performance
  const calculations = useMemo(() => {
    const idealSecondaryVoltage = transformer.primaryVoltage / transformer.turnsRatio;
    const actualSecondaryVoltage = idealSecondaryVoltage * (transformer.efficiency / 100);
    const inputPower = transformer.primaryVoltage * transformer.primaryCurrent;
    const secondaryCurrent = actualSecondaryVoltage / transformer.loadResistance;
    const outputPower = actualSecondaryVoltage * secondaryCurrent;
    const powerLoss = inputPower - outputPower;
    const actualEfficiency = inputPower > 0 ? (outputPower / inputPower) * 100 : 0;
    
    return {
      idealSecondaryVoltage,
      actualSecondaryVoltage,
      inputPower,
      secondaryCurrent,
      outputPower,
      powerLoss,
      actualEfficiency
    };
  }, [transformer.primaryVoltage, transformer.turnsRatio, transformer.efficiency, 
      transformer.primaryCurrent, transformer.loadResistance]);

  const { actualSecondaryVoltage, inputPower, secondaryCurrent, outputPower, powerLoss, actualEfficiency } = calculations;

  // Enhanced graph data update with perfect real-time calculations
  useEffect(() => {
    let intervalId: number;
    
    if (transformer.isConnected) {
      // Generate data more frequently for smoother animation
      intervalId = window.setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 0.1; // Increment time by 0.1 seconds
          
          setGraphData(prev => {
            const newData = { ...prev };

            // Perfect electromagnetic calculations with proper frequency
            const angularFrequency = 2 * Math.PI * transformer.frequency; // Use actual frequency
            
            // Real-time voltage calculation (AC waveform)
            const voltageValue = transformer.primaryVoltage * Math.sin(newTime * angularFrequency);
            newData.voltage.push(Math.abs(voltageValue));
            
            // Real-time current calculation (AC waveform)
            const currentValue = transformer.primaryCurrent * Math.sin(newTime * angularFrequency);
            newData.current.push(Math.abs(currentValue));
            
            // Real-time power calculation (instantaneous power)
            const powerValue = voltageValue * currentValue;
            newData.power.push(Math.abs(powerValue));
            
            // Efficiency remains constant (realistic)
            newData.efficiency.push(actualEfficiency);
            newData.time.push(newTime);

            // Keep data points for smooth animation
            const maxPoints = 50;
            if (newData.voltage.length > maxPoints) {
              newData.voltage = newData.voltage.slice(-maxPoints);
              newData.current = newData.current.slice(-maxPoints);
              newData.power = newData.power.slice(-maxPoints);
              newData.efficiency = newData.efficiency.slice(-maxPoints);
              newData.time = newData.time.slice(-maxPoints);
            }

            return newData;
          });
          
          return newTime;
        });
      }, 50); // Update every 50ms for smooth animation
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transformer.isConnected, transformer.frequency, transformer.primaryVoltage, transformer.primaryCurrent, actualEfficiency]);

  // Optimized canvas drawing function with reduced complexity
  const drawTransformer = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Deep electromagnetic space background with gradient
    const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
    bgGradient.addColorStop(0, '#0a0a0f');
    bgGradient.addColorStop(0.5, '#040407');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Subtle electromagnetic grid
    if (state.showGrid) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    
    const centerX = width / 2;
    const centerY = height / 2;
    const coreWidth = width * 0.45;
    const coreHeight = height * 0.4;

    // 🌟 3D TRANSFORMER CONTAINER FRAME 🌟
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - coreWidth/2 - 25, centerY - coreHeight/2 - 25, coreWidth + 50, coreHeight + 50);

    // 3D Iron Core with electromagnetic glow
    const coreShadow = ctx.createLinearGradient(centerX - coreWidth/2, centerY - coreHeight/2, centerX + coreWidth/2, centerY + coreHeight/2);
    coreShadow.addColorStop(0, '#1e293b');
    coreShadow.addColorStop(0.3, '#334155');
    coreShadow.addColorStop(0.7, '#475569');
    coreShadow.addColorStop(1, '#1e293b');
    
    // Core shadow for 3D effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(centerX - coreWidth/2 + 6, centerY - coreHeight/2 + 6, coreWidth, coreHeight);
    
    // Main core with electromagnetic field glow
    ctx.fillStyle = coreShadow;
    ctx.fillRect(centerX - coreWidth/2, centerY - coreHeight/2, coreWidth, coreHeight);
    
    // 🔥 HEAT MAP VISUALIZATION - Based on Power Loss
    const heatIntensity = Math.min(1, powerLoss / 100); // Normalize to 0-1
    
    if (transformer.isConnected && heatIntensity > 0.05) {
      // Create heat gradient overlay on core
      const heatGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(coreWidth, coreHeight) / 2
      );
      
      // Color based on heat intensity: blue (cold) -> yellow -> orange -> red (hot)
      if (heatIntensity < 0.25) {
        // Low heat - blue tint
        heatGradient.addColorStop(0, `rgba(59, 130, 246, ${heatIntensity * 0.4})`);
        heatGradient.addColorStop(0.5, `rgba(59, 130, 246, ${heatIntensity * 0.2})`);
        heatGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else if (heatIntensity < 0.5) {
        // Medium heat - yellow/orange
        heatGradient.addColorStop(0, `rgba(255, 165, 0, ${heatIntensity * 0.6})`);
        heatGradient.addColorStop(0.5, `rgba(255, 165, 0, ${heatIntensity * 0.3})`);
        heatGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
      } else {
        // High heat - red/danger
        heatGradient.addColorStop(0, `rgba(255, 0, 0, ${heatIntensity * 0.8})`);
        heatGradient.addColorStop(0.5, `rgba(255, 0, 0, ${heatIntensity * 0.4})`);
        heatGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      }
      
      ctx.fillStyle = heatGradient;
      ctx.fillRect(centerX - coreWidth/2, centerY - coreHeight/2, coreWidth, coreHeight);
      
      // Pulsing heat effect when running
      const pulseIntensity = Math.sin(time * 2) * 0.3 + 0.7;
      const heatColor = heatIntensity < 0.25 ? '59, 130, 246' : 
                        heatIntensity < 0.5 ? '255, 165, 0' : 
                        '255, 0, 0';
      
      ctx.shadowBlur = 20 * heatIntensity * pulseIntensity;
      ctx.shadowColor = `rgba(${heatColor}, ${heatIntensity})`;
      ctx.strokeStyle = `rgba(${heatColor}, ${heatIntensity * 0.8})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(centerX - coreWidth/2, centerY - coreHeight/2, coreWidth, coreHeight);
      ctx.shadowBlur = 0;
      
      // Heat indicator dots on core
      const numHeatDots = Math.floor(heatIntensity * 10) + 3;
      for (let i = 0; i < numHeatDots; i++) {
        const dotX = centerX - coreWidth/4 + (Math.random() * coreWidth/2);
        const dotY = centerY - coreHeight/4 + (Math.random() * coreHeight/2);
        const dotSize = 2 + Math.random() * 3;
        const dotAlpha = (Math.sin(time * 4 + i) * 0.3 + 0.7) * heatIntensity;
        
        ctx.fillStyle = `rgba(${heatColor}, ${dotAlpha})`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Core electromagnetic border
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - coreWidth/2, centerY - coreHeight/2, coreWidth, coreHeight);

    // Primary Coil (left side) - 3D rectangular coil with windings
    const primaryX = centerX - coreWidth/2 - 70;
    const primaryCoils = Math.floor(transformer.turnsRatio * 4);
    const coilHeight = coreHeight * 0.85;
    const coilWidth = 35;
    
    // Primary coil 3D container
    const primaryGradient = ctx.createLinearGradient(primaryX - coilWidth/2, centerY - coilHeight/2, primaryX + coilWidth/2, centerY + coilHeight/2);
    primaryGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    primaryGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)');
    primaryGradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
    
    // Primary shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(primaryX - coilWidth/2 + 3, centerY - coilHeight/2 + 3, coilWidth, coilHeight);
    
    // Primary main
    ctx.fillStyle = primaryGradient;
    ctx.fillRect(primaryX - coilWidth/2, centerY - coilHeight/2, coilWidth, coilHeight);
    
    // Primary coil windings (⚡⚡⚡⚡⚡⚡⚡)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    for (let i = 0; i < primaryCoils; i++) {
      const y = centerY - coilHeight/2 + (i + 1) * (coilHeight / (primaryCoils + 1));
      ctx.beginPath();
      ctx.moveTo(primaryX - coilWidth/2 + 8, y);
      ctx.lineTo(primaryX + coilWidth/2 - 8, y);
      ctx.stroke();
      
      // Animated current flow particles in primary coil
      if (transformer.isConnected) {
        const particlePhase = (time * 3 + i * 0.2) % (Math.PI * 2);
        const particleX = primaryX - coilWidth/2 + 8 + (Math.sin(particlePhase) * 0.5 + 0.5) * (coilWidth - 16);
        
        ctx.fillStyle = `rgba(255, 255, 0, ${Math.sin(particlePhase) * 0.6 + 0.4})`;
        ctx.beginPath();
        ctx.arc(particleX, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Secondary Coil (right side) - 3D rectangular coil with windings
    const secondaryX = centerX + coreWidth/2 + 70;
    const secondaryCoils = Math.floor(primaryCoils / transformer.turnsRatio);
    
    // Secondary coil 3D container
    const secondaryGradient = ctx.createLinearGradient(secondaryX - coilWidth/2, centerY - coilHeight/2, secondaryX + coilWidth/2, centerY + coilHeight/2);
    secondaryGradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
    secondaryGradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.6)');
    secondaryGradient.addColorStop(1, 'rgba(34, 197, 94, 0.3)');
    
    // Secondary shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(secondaryX - coilWidth/2 + 3, centerY - coilHeight/2 + 3, coilWidth, coilHeight);
    
    // Secondary main
    ctx.fillStyle = secondaryGradient;
    ctx.fillRect(secondaryX - coilWidth/2, centerY - coilHeight/2, coilWidth, coilHeight);
    
    // Secondary coil windings (⚡⚡⚡⚡⚡⚡⚡)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    for (let i = 0; i < secondaryCoils; i++) {
      const y = centerY - coilHeight/2 + (i + 1) * (coilHeight / (secondaryCoils + 1));
      ctx.beginPath();
      ctx.moveTo(secondaryX - coilWidth/2 + 8, y);
      ctx.lineTo(secondaryX + coilWidth/2 - 8, y);
      ctx.stroke();
      
      // Animated current flow particles in secondary coil (opposite phase)
      if (transformer.isConnected) {
        const particlePhase = (time * 3 + i * 0.2 + Math.PI) % (Math.PI * 2);
        const particleX = secondaryX - coilWidth/2 + 8 + (Math.sin(particlePhase) * 0.5 + 0.5) * (coilWidth - 16);
        
        ctx.fillStyle = `rgba(255, 165, 0, ${Math.sin(particlePhase) * 0.6 + 0.4})`;
        ctx.beginPath();
        ctx.arc(particleX, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 🌊 MAGNETIC FLUX LINES (Animated when connected, static when paused)
    if (transformer.isConnected) {
      const fluxLines = 12;
      
      for (let i = 0; i < fluxLines; i++) {
        const fluxY = centerY - coreHeight/2 + (i + 1) * (coreHeight / (fluxLines + 1));
        const fluxPhase = (time * 2 + i * 0.3) % (Math.PI * 2);
        const fluxIntensity = Math.sin(fluxPhase) * 0.5 + 0.5;
        const fluxRadius = (coreWidth/2 + 80) * fluxIntensity;
        
        // Create gradient from blue to red based on intensity (like first image)
        const gradient = ctx.createRadialGradient(centerX, fluxY, 0, centerX, fluxY, fluxRadius);
        if (fluxIntensity > 0.7) {
          gradient.addColorStop(0, `rgba(255, 0, 0, ${fluxIntensity * 0.8})`);
          gradient.addColorStop(0.5, `rgba(255, 165, 0, ${fluxIntensity * 0.6})`);
          gradient.addColorStop(1, `rgba(255, 0, 0, ${fluxIntensity * 0.3})`);
        } else if (fluxIntensity > 0.4) {
          gradient.addColorStop(0, `rgba(255, 165, 0, ${fluxIntensity * 0.8})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 0, ${fluxIntensity * 0.6})`);
          gradient.addColorStop(1, `rgba(255, 165, 0, ${fluxIntensity * 0.3})`);
        } else {
          gradient.addColorStop(0, `rgba(59, 130, 246, ${fluxIntensity * 0.8})`);
          gradient.addColorStop(0.5, `rgba(147, 197, 253, ${fluxIntensity * 0.6})`);
          gradient.addColorStop(1, `rgba(59, 130, 246, ${fluxIntensity * 0.3})`);
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX, fluxY, fluxRadius, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw flux arrows with color-coded intensity
        ctx.strokeStyle = fluxIntensity > 0.7 ? '#ff0000' : fluxIntensity > 0.4 ? '#ffa500' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.ellipse(centerX, fluxY, fluxRadius, 25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      // Static flux lines when transformer is paused/stopped
      const fluxLines = 8;
      
      for (let i = 0; i < fluxLines; i++) {
        const fluxY = centerY - coreHeight/2 + (i + 1) * (coreHeight / (fluxLines + 1));
        const fluxRadius = (coreWidth/2 + 80) * 0.7;
        
        // Static blue flux lines
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.ellipse(centerX, fluxY, fluxRadius, 25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    
    // ⚡ ENHANCED CURRENT FLOW PARTICLES (like first image)
    if (transformer.isConnected) {
      for (let i = 0; i < 30; i++) {
        const particlePhase = (time * 5 + i * 0.2) % (Math.PI * 2);
        const particleX = centerX - coreWidth/2 - 50 + (Math.sin(particlePhase) * 0.5 + 0.5) * (coreWidth + 100);
        const particleY = centerY - coreHeight/2 + (i * 0.1) % coreHeight;
        
        // Particle glow effect with electromagnetic colors
        const glowIntensity = Math.sin(particlePhase) * 0.6 + 0.4;
        ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Particle trail with electromagnetic glow
        ctx.fillStyle = `rgba(59, 130, 246, ${glowIntensity * 0.3})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // High-intensity particles (red glow)
        if (glowIntensity > 0.7) {
          ctx.fillStyle = `rgba(255, 0, 0, ${glowIntensity * 0.5})`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Static current flow particles when transformer is paused/stopped
      for (let i = 0; i < 15; i++) {
        const particleX = centerX - coreWidth/2 - 50 + (i * (coreWidth + 100) / 15);
        const particleY = centerY - coreHeight/2 + (i * 0.1) % coreHeight;
        
        // Static white particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Voltage labels with electromagnetic glow
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${transformer.primaryVoltage}V`, primaryX, centerY - coilHeight/2 - 20);
    
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`${actualSecondaryVoltage.toFixed(1)}V`, secondaryX, centerY - coilHeight/2 - 20);
    
    // 🧲 Iron Core label with electromagnetic glow
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('🧲 Iron Core 🧲', centerX, centerY + coreHeight/2 + 30);
    
    // Turns ratio with electromagnetic effect
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '14px Arial';
    ctx.fillText(`Turns Ratio: ${transformer.turnsRatio}:1`, centerX, centerY + coreHeight/2 + 50);
    
    // 🔌 LOAD TYPE VISUALIZATION (Secondary side)
    const loadX = secondaryX + 80;
    const loadY = centerY;
    const loadSize = 60;
    
    // Determine load type based on load resistance characteristics
    // Low resistance (< 10Ω) = Resistive load (motor, heater)
    // Medium resistance (10-50Ω) = Mixed/Inductive load (transformer, coil)
    // High resistance (> 50Ω) = Light load (LED, electronics)
    const loadType = transformer.loadResistance < 10 ? 'resistive' : 
                     transformer.loadResistance < 50 ? 'inductive' : 'capacitive';
    
    // Load container background
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(loadX - loadSize/2, loadY - loadSize/2, loadSize, loadSize);
    ctx.strokeStyle = loadType === 'resistive' ? '#ef4444' : 
                      loadType === 'inductive' ? '#8b5cf6' : '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(loadX - loadSize/2, loadY - loadSize/2, loadSize, loadSize);
    
    if (loadType === 'resistive') {
      // Resistive Load - Heating element symbol
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      
      // Draw heating coil symbol (zigzag)
      ctx.beginPath();
      ctx.moveTo(loadX - 20, loadY);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(loadX - 15 + i * 8, loadY - 8);
        ctx.lineTo(loadX - 11 + i * 8, loadY + 8);
      }
      ctx.lineTo(loadX + 20, loadY);
      ctx.stroke();
      
      // Heat glow effect if connected
      if (transformer.isConnected) {
        const glowIntensity = Math.sin(time * 3) * 0.3 + 0.7;
        ctx.shadowBlur = 15 * glowIntensity;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = `rgba(239, 68, 68, ${glowIntensity * 0.5})`;
        ctx.fillRect(loadX - 25, loadY - 12, 50, 24);
        ctx.shadowBlur = 0;
      }
      
      // Label
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('RESISTIVE', loadX, loadY + loadSize/2 + 15);
      ctx.font = '9px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Heater/Motor', loadX, loadY + loadSize/2 + 28);
      
    } else if (loadType === 'inductive') {
      // Inductive Load - Coil symbol
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2.5;
      
      // Draw coil windings
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(loadX - 15 + i * 10, loadY, 5, Math.PI, 0, false);
        ctx.stroke();
      }
      
      // Magnetic field lines if connected
      if (transformer.isConnected) {
        const fieldPhase = time * 2;
        for (let i = 0; i < 3; i++) {
          const alpha = (Math.sin(fieldPhase + i * 0.5) * 0.4 + 0.6);
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.ellipse(loadX, loadY, 30 + i * 5, 20 + i * 3, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      
      // Label
      ctx.fillStyle = '#8b5cf6';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('INDUCTIVE', loadX, loadY + loadSize/2 + 15);
      ctx.font = '9px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Coil/Transformer', loadX, loadY + loadSize/2 + 28);
      
    } else {
      // Capacitive Load - Capacitor symbol
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      
      // Draw capacitor plates
      ctx.beginPath();
      ctx.moveTo(loadX - 5, loadY - 18);
      ctx.lineTo(loadX - 5, loadY + 18);
      ctx.moveTo(loadX + 5, loadY - 18);
      ctx.lineTo(loadX + 5, loadY + 18);
      ctx.stroke();
      
      // Connecting wires
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(loadX - 20, loadY);
      ctx.lineTo(loadX - 5, loadY);
      ctx.moveTo(loadX + 5, loadY);
      ctx.lineTo(loadX + 20, loadY);
      ctx.stroke();
      
      // Electric field visualization if connected
      if (transformer.isConnected) {
        const chargePhase = time * 3;
        for (let i = 0; i < 5; i++) {
          const yPos = loadY - 15 + i * 7.5;
          const alpha = Math.sin(chargePhase + i * 0.3) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(loadX - 4, yPos);
          ctx.lineTo(loadX + 4, yPos);
          ctx.stroke();
        }
      }
      
      // Label
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CAPACITIVE', loadX, loadY + loadSize/2 + 15);
      ctx.font = '9px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Electronics/LED', loadX, loadY + loadSize/2 + 28);
    }
    
    // Connection wire from secondary to load
    ctx.strokeStyle = transformer.isConnected ? '#22c55e' : '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(secondaryX + coilWidth/2, loadY);
    ctx.lineTo(loadX - loadSize/2, loadY);
    ctx.stroke();
    
    // Current flow indicator on connection wire
    if (transformer.isConnected) {
      const flowPos = secondaryX + coilWidth/2 + ((time * 50) % (loadX - loadSize/2 - secondaryX - coilWidth/2));
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(flowPos, loadY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Load power display
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${outputPower.toFixed(1)}W`, loadX, loadY - loadSize/2 - 10);
  }, [transformer, time, actualSecondaryVoltage, outputPower, state.showGrid]);

  // Enhanced animation loop with perfect timing and calculations
  useEffect(() => {
    let lastTime = 0;
    let animationId: number;
    
    const animate = (currentTime: number) => {
      // Always render transformer, but only animate effects when connected
      if (currentTime - lastTime >= ANIMATION_THROTTLE) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            
            // Always draw transformer with perfect timing
            drawTransformer(ctx, rect.width, rect.height);
          }
        }
        lastTime = currentTime;
      }
      
      // Continue animation loop for smooth rendering
      animationId = requestAnimationFrame(animate);
    };
    
    // Start animation immediately
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [drawTransformer, transformer.isConnected]);


  // Cleanup on unmount with proper memory management
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clear graph data to prevent memory leaks
      setGraphData({
        voltage: [],
        current: [],
        power: [],
        efficiency: [],
        time: []
      });
    };
  }, []);


  // Voltage graph animation system only
  useEffect(() => {
    const animateVoltageGraph = () => {
      const voltageCanvas = voltageCanvasRef.current;
      if (voltageCanvas) {
        const ctx = voltageCanvas.getContext('2d');
        if (ctx) {
          const rect = voltageCanvas.getBoundingClientRect();
          voltageCanvas.width = rect.width * window.devicePixelRatio;
          voltageCanvas.height = rect.height * window.devicePixelRatio;
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
          
          // Clear canvas
          ctx.clearRect(0, 0, rect.width, rect.height);
          
          if (transformer.isConnected && graphData.voltage.length > 1) {
            // Draw animated voltage waveform
            const data = graphData.voltage;
            const maxVal = Math.max(...data);
            const minVal = Math.min(...data);
            const range = maxVal - minVal || 1;
            
            // Draw background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(0, 0, rect.width, rect.height);
            
            // Draw grid
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
              const y = 10 + (i / 4) * (rect.height - 20);
              ctx.beginPath();
              ctx.moveTo(10, y);
              ctx.lineTo(rect.width - 10, y);
              ctx.stroke();
            }
            
            // Draw waveform
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            
            data.forEach((value, index) => {
              const x = 10 + (index / (data.length - 1)) * (rect.width - 20);
              const y = rect.height - 10 - ((value - minVal) / range) * (rect.height - 20);
              
              if (index === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Draw label
            ctx.fillStyle = '#3b82f6';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('V₁(t)', 15, 20);
          } else {
            // Draw paused state
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, rect.width, rect.height);
            ctx.fillStyle = '#3b82f6';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('V₁(t) - Paused', rect.width / 2, rect.height / 2);
          }
        }
      }
    };

    let animationId: number;
    
    const runAnimation = () => {
      animateVoltageGraph();
      animationId = requestAnimationFrame(runAnimation);
    };

    // Start animation immediately
    animationId = requestAnimationFrame(runAnimation);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [transformer.isConnected, graphData.voltage]);

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
            ⚡ Transformer Laboratory
          </h3>
          <div style={{ fontSize: '12px', color: '#cbd5f5' }}>
            Interactive transformer simulation with real-time analysis
          </div>
        </div>

        {/* Primary Controls */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            📊 Primary Settings
          </h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
              Voltage: {transformer.primaryVoltage}V
            </label>
            <input
              type="range"
              min="100"
              max="480"
              value={transformer.primaryVoltage}
              onChange={(e) => setTransformer(prev => ({ ...prev, primaryVoltage: Number(e.target.value) }))}
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
              Current: {transformer.primaryCurrent}A
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.1"
              value={transformer.primaryCurrent}
              onChange={(e) => setTransformer(prev => ({ ...prev, primaryCurrent: Number(e.target.value) }))}
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
              Turns Ratio: {transformer.turnsRatio}:1
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={transformer.turnsRatio}
              onChange={(e) => setTransformer(prev => ({ ...prev, turnsRatio: Number(e.target.value) }))}
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
              Efficiency: {transformer.efficiency}%
            </label>
            <input
              type="range"
              min="70"
              max="99"
              value={transformer.efficiency}
              onChange={(e) => setTransformer(prev => ({ ...prev, efficiency: Number(e.target.value) }))}
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

        {/* Load Controls */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            ⚡ Load Settings
          </h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
              Load Resistance: {transformer.loadResistance}Ω
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={transformer.loadResistance}
              onChange={(e) => setTransformer(prev => ({ ...prev, loadResistance: Number(e.target.value) }))}
              style={{
                width: '100%',
                height: '6px',
                background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                borderRadius: '3px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
              Frequency: {transformer.frequency}Hz
            </label>
            <input
              type="range"
              min="30"
              max="100"
              value={transformer.frequency}
              onChange={(e) => setTransformer(prev => ({ ...prev, frequency: Number(e.target.value) }))}
              style={{
                width: '100%',
                height: '6px',
                background: 'linear-gradient(90deg, #059669, #10b981)',
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
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>V₂ (Secondary)</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
                {actualSecondaryVoltage.toFixed(1)}V
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>I₂ (Secondary)</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
                {transformer.secondaryCurrent.toFixed(2)}A
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>P₁ (Input)</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>
                {inputPower.toFixed(1)}W
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>P₂ (Output)</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
                {outputPower.toFixed(1)}W
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Loss</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24' }}>
                {powerLoss.toFixed(1)}W
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Efficiency</span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 700, 
                color: actualEfficiency > 90 ? '#22c55e' : '#fbbf24' 
              }}>
                {actualEfficiency.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              // Toggle transformer connection state with enhanced logic
              setTransformer(prev => {
                const newConnectedState = !prev.isConnected;
                
                // When starting, reset time and ensure proper initialization
                if (newConnectedState) {
                  setTime(0);
                  // Reset graph data for clean start
                  setGraphData({
                    voltage: [],
                    current: [],
                    power: [],
                    efficiency: [],
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
              background: transformer.isConnected 
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)' 
                : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: transformer.isConnected 
                ? '0 4px 12px rgba(239,68,68,0.3)' 
                : '0 4px 12px rgba(34,197,94,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {transformer.isConnected ? '⏸️ Pause' : '▶️ Start'}
          </button>
          
          <button
            onClick={() => setTransformer({
              primaryVoltage: 220,
              secondaryVoltage: 110,
              turnsRatio: 2,
              efficiency: 95,
              primaryCurrent: 2.5,
              secondaryCurrent: 5.0,
              loadResistance: 22,
              isConnected: true,
              frequency: 50
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
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Transformer Visualization */}
        <div style={{ 
          height: '400px', // Fixed height for better performance
          position: 'relative',
          background: 'radial-gradient(circle at 25% 25%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(circle at 75% 30%, rgba(139,92,246,0.15), transparent 50%)'
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              maxWidth: '100%',
              objectFit: 'contain'
            }}
          />
          

          {/* Status Indicator */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(15,23,42,0.9)',
            padding: '12px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#f8fafc',
            fontSize: '12px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <span>🔋 Transformer Active</span>
            <span>|</span>
            <span>Ratio: {transformer.turnsRatio}:1</span>
            <span>|</span>
            <span style={{ color: transformer.isConnected ? '#22c55e' : '#ef4444' }}>
              {transformer.isConnected ? '⚡ Connected' : '⏸️ Disconnected'}
            </span>
          </div>
        </div>

        {/* Interactive Cards Panel */}
        <div style={{
          minHeight: '320px', // Reduced height for better fitting
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
          borderTop: '1px solid rgba(59,130,246,0.3)',
          padding: '20px', // Increased padding for better spacing
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)', // Fixed 3 columns for proper alignment
          gap: '20px', // Increased gap for better spacing
          borderRadius: '30px 30px 0 0',
          justifyContent: 'center',
          alignItems: 'stretch'
        }}>
          {/* Voltage Graph Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(30,64,175,0.1) 100%)',
            border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 12px 30px rgba(59,130,246,0.2)',
            transition: 'all 0.3s ease',
            height: '280px', // Consistent height for all cards
            justifyContent: 'space-between'
          }}>
            <h4 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
              📊 Voltage Graph
            </h4>
            <div style={{ height: '140px', position: 'relative', background: 'rgba(0,0,0,0.4)', borderRadius: '15px', border: '1px solid rgba(59,130,246,0.3)', overflow: 'hidden' }}>
              <canvas
                ref={voltageCanvasRef}
                style={{ width: '100%', height: '100%', borderRadius: '8px' }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              Primary: {transformer.primaryVoltage}V | Secondary: {actualSecondaryVoltage.toFixed(1)}V
            </div>
          </div>

          {/* Efficiency Chart Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(21,128,61,0.1) 100%)',
            border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 12px 30px rgba(34,197,94,0.2)',
            transition: 'all 0.3s ease',
            height: '280px', // Consistent height for all cards
            justifyContent: 'space-between'
          }}>
            <h4 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
              📈 Efficiency Chart
            </h4>
            <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `conic-gradient(#22c55e 0deg ${actualEfficiency * 3.6}deg, rgba(34,197,94,0.2) ${actualEfficiency * 3.6}deg 360deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(15,23,42,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: actualEfficiency > 90 ? '#22c55e' : '#fbbf24'
                }}>
                  {actualEfficiency.toFixed(1)}%
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              Power Loss: {powerLoss.toFixed(1)}W
            </div>
          </div>


          {/* Power Transfer Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.1) 100%)',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 12px 30px rgba(139,92,246,0.2)',
            transition: 'all 0.3s ease',
            height: '280px', // Consistent height for all cards
            justifyContent: 'space-between'
          }}>
            <h4 style={{ color: '#8b5cf6', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
              🔋 Power Transfer
            </h4>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Input Power</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>{inputPower.toFixed(1)}W</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Output Power</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e' }}>{outputPower.toFixed(1)}W</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Power Loss</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24' }}>{powerLoss.toFixed(1)}W</span>
              </div>
              <div style={{ 
                height: '8px', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '4px',
                overflow: 'hidden',
                margin: '8px 0'
              }}>
                <div style={{
                  height: '100%',
                  width: `${actualEfficiency}%`,
                  background: 'linear-gradient(90deg, #22c55e, #10b981)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              Transfer Rate: {actualEfficiency.toFixed(1)}% | Frequency: {transformer.frequency}Hz
            </div>
          </div>
        </div>

        {/* Advanced Graph Panel with Physics Equations - Fixed layout to prevent leaking */}
        <div style={{
          minHeight: '400px', // Increased height to prevent overflow
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
          borderTop: '1px solid rgba(59,130,246,0.3)',
          padding: '20px', // Increased padding for better spacing
          display: 'grid',
          gridTemplateColumns: '2fr 1fr', // Better proportions
          gridTemplateRows: 'auto', // Single row to prevent overflow
          gap: '20px', // Increased gap
          borderRadius: '0 0 30px 30px',
          overflow: 'hidden' // Prevent content from leaking
        }}>

          {/* Efficiency vs Load Graph */}
          <div style={{
            height: 'fit-content',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(21,128,61,0.05) 100%)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '20px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 15px 35px rgba(34,197,94,0.15)'
          }}>
            <h4 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
              📈 Efficiency vs Load
            </h4>
            <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <canvas
                style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                ref={(canvas) => {
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      const rect = canvas.getBoundingClientRect();
                      canvas.width = rect.width * window.devicePixelRatio;
                      canvas.height = rect.height * window.devicePixelRatio;
                      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                      
                      ctx.clearRect(0, 0, rect.width, rect.height);
                      
                      // Draw axes
                      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
                      ctx.lineWidth = 1;
                      ctx.beginPath();
                      ctx.moveTo(40, 20);
                      ctx.lineTo(40, rect.height - 40);
                      ctx.lineTo(rect.width - 20, rect.height - 40);
                      ctx.stroke();
                      
                      // Draw grid lines
                      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
                      for (let i = 0; i <= 10; i++) {
                        const y = 20 + (i / 10) * (rect.height - 60);
                        ctx.beginPath();
                        ctx.moveTo(40, y);
                        ctx.lineTo(rect.width - 20, y);
                        ctx.stroke();
                      }
                      
                      // Simple Efficiency vs Load curve
                      ctx.strokeStyle = '#22c55e';
                      ctx.lineWidth = 2;
                      ctx.beginPath();
                      
                      const maxLoad = 100;
                      const maxEfficiency = 98;
                      
                      // Simple efficiency curve
                      for (let load = 1; load <= maxLoad; load += 5) {
                        const efficiency = Math.max(70, 98 - (Math.abs(load - 50) * 0.3));
                        const x = 40 + ((load - 1) / (maxLoad - 1)) * (rect.width - 60);
                        const y = rect.height - 40 - ((efficiency - 70) / (maxEfficiency - 70)) * (rect.height - 60);
                        
                        if (load === 1) {
                          ctx.moveTo(x, y);
                        } else {
                          ctx.lineTo(x, y);
                        }
                      }
                      ctx.stroke();
                      
                      // Animated current point with pulsing effect
                      const currentLoad = transformer.loadResistance;
                      const currentEfficiency = actualEfficiency;
                      const currentX = 40 + ((currentLoad - 1) / (maxLoad - 1)) * (rect.width - 60);
                      const currentY = rect.height - 40 - ((currentEfficiency - 70) / (maxEfficiency - 70)) * (rect.height - 60);
                      
                      // Pulsing effect when transformer is running
                      if (transformer.isConnected) {
                        const pulse = Math.sin(time * 4 + Math.PI/2) * 0.3 + 0.7;
                        ctx.fillStyle = `rgba(245, 158, 11, ${pulse})`;
                        ctx.beginPath();
                        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Glow effect
                        ctx.fillStyle = `rgba(245, 158, 11, ${pulse * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
                        ctx.fill();
                      } else {
                        // Static point when paused
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath();
                        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
                        ctx.fill();
                      }
                      
                      // Draw labels with real-time values
                      ctx.fillStyle = '#f8fafc';
                      ctx.font = '12px Arial';
                      ctx.textAlign = 'center';
                      ctx.fillText('Load Resistance (Ω)', rect.width / 2, rect.height - 10);
                      
                      ctx.save();
                      ctx.translate(15, rect.height / 2);
                      ctx.rotate(-Math.PI / 2);
                      ctx.fillText('Efficiency (%)', 0, 0);
                      ctx.restore();
                      
                      // Current value display with animation
                      ctx.fillStyle = '#f59e0b';
                      ctx.font = 'bold 11px Arial';
                      ctx.fillText(`Load: ${currentLoad.toFixed(0)}Ω`, currentX, currentY - 15);
                      ctx.fillText(`η: ${currentEfficiency.toFixed(1)}%`, currentX, currentY + 25);
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Physics Equations Section */}
          <div style={{
            gridColumn: '2', // Second column
            gridRow: '1 / 3', // Spans both rows
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <h3 style={{ 
              color: '#f8fafc', 
              fontSize: '18px', 
              fontWeight: 700, 
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              📐 Physics Equations
            </h3>

            {/* Faraday's Law Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(194,65,12,0.1) 100%)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '15px',
              padding: '15px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 20px rgba(245,158,11,0.2)',
              height: '180px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h4 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                ⚡ Faraday's Law
              </h4>
              <div style={{
                background: 'rgba(15,23,42,0.8)',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(245,158,11,0.3)',
                textAlign: 'center',
                marginBottom: '8px',
                flex: 1
              }}>
                <div style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                  V₂/V₁ = N₂/N₁
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                  Current Ratio: {transformer.turnsRatio}:1
                </div>
                <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600 }}>
                  {actualSecondaryVoltage.toFixed(1)}V / {transformer.primaryVoltage}V = {transformer.turnsRatio}
                </div>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '0', textAlign: 'center' }}>
                Voltage transformation ratio
              </p>
            </div>

            {/* Power Conservation Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(30,64,175,0.1) 100%)',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: '15px',
              padding: '15px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 20px rgba(59,130,246,0.2)',
              height: '180px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h4 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                ⚡ Power Conservation
              </h4>
              <div style={{
                background: 'rgba(15,23,42,0.8)',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(59,130,246,0.3)',
                textAlign: 'center',
                marginBottom: '8px',
                flex: 1
              }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                  P₁ ≈ P₂ (with losses)
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                  Input: {inputPower.toFixed(1)}W → Output: {outputPower.toFixed(1)}W
                </div>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                  I₁/I₂ = N₂/N₁
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '12px' }}>
                  {transformer.primaryCurrent}A / {secondaryCurrent.toFixed(2)}A = {transformer.turnsRatio}
                </div>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '0', textAlign: 'center' }}>
                Power conservation principle
              </p>
            </div>

            {/* Efficiency Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(21,128,61,0.1) 100%)',
              border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: '15px',
              padding: '15px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 20px rgba(34,197,94,0.2)'
            }}>
              <h4 style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                📊 Efficiency
              </h4>
              <div style={{
                background: 'rgba(15,23,42,0.8)',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(34,197,94,0.3)',
                textAlign: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ color: '#22c55e', fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                  η = (P₂/P₁) × 100%
                </div>
                <div style={{ 
                  color: actualEfficiency > 90 ? '#22c55e' : '#f59e0b', 
                  fontSize: '14px', 
                  fontWeight: 700 
                }}>
                  Current: {actualEfficiency.toFixed(1)}%
                </div>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '0', textAlign: 'center' }}>
                Power transfer efficiency
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Theory Section with Tabs */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
          padding: '30px',
          borderTop: '1px solid rgba(59,130,246,0.3)'
        }}>
          {/* Theory Section Header */}
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ 
              color: '#f8fafc', 
              fontSize: '28px', 
              fontWeight: 700, 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              🎓 Transformer Learning Center
            </h2>
            
            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {theoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTheoryTab(tab.id)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '15px',
                    background: activeTheoryTab === tab.id 
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(30,64,175,0.8) 100%)'
                      : 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(30,64,175,0.1) 100%)',
                    color: activeTheoryTab === tab.id ? '#ffffff' : '#94a3b8',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `1px solid ${activeTheoryTab === tab.id ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.2)'}`,
                    backdropFilter: 'blur(10px)',
                    boxShadow: activeTheoryTab === tab.id 
                      ? '0 8px 25px rgba(59,130,246,0.3)' 
                      : '0 4px 15px rgba(59,130,246,0.1)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Container */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(30,64,175,0.05) 100%)',
            borderRadius: '20px',
            padding: '25px',
            border: '1px solid rgba(59,130,246,0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 15px 35px rgba(59,130,246,0.15)',
            minHeight: '400px'
          }}>
            {/* Basic Theory Tab */}
            {activeTheoryTab === 'basic' && (
              <div>
                <h3 style={{ color: '#3b82f6', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  📖 Basic Transformer Theory
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{
                    padding: '20px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      🎯 Core Concept
                    </h4>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                      Electromagnetic induction transfers energy between primary and secondary windings without electrical connection.
                    </p>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                      The voltage ratio equals the turns ratio: <strong style={{ color: '#3b82f6' }}>V₁/V₂ = N₁/N₂</strong>
                    </p>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(34,197,94,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(34,197,94,0.2)'
                  }}>
                    <h4 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      🔧 How It Works
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                      <p style={{ marginBottom: '8px' }}>1. AC current creates magnetic field in primary</p>
                      <p style={{ marginBottom: '8px' }}>2. Field induces voltage in secondary</p>
                      <p style={{ marginBottom: '8px' }}>3. Voltage ratio = turns ratio</p>
                      <p>4. Power is conserved (P₁ ≈ P₂)</p>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(139,92,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(139,92,246,0.2)'
                  }}>
                    <h4 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      📐 Key Formula
                    </h4>
                    <div style={{ 
                      background: 'rgba(15,23,42,0.8)', 
                      padding: '15px', 
                      borderRadius: '10px',
                      border: '1px solid rgba(139,92,246,0.3)'
                    }}>
                      <p style={{ color: '#8b5cf6', fontSize: '18px', fontWeight: 600, textAlign: 'center', margin: '0' }}>
                        V₁/V₂ = N₁/N₂
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '8px 0 0 0' }}>
                        Voltage ratio = Turns ratio
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Types Tab */}
            {activeTheoryTab === 'types' && (
              <div>
                <h3 style={{ color: '#22c55e', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  ⚡ Types of Transformers
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {[
                    { type: 'Step-Up', ratio: 'N₂ > N₁', voltage: 'Increases voltage', icon: '⬆️', color: '#22c55e' },
                    { type: 'Step-Down', ratio: 'N₂ < N₁', voltage: 'Decreases voltage', icon: '⬇️', color: '#ef4444' },
                    { type: 'Isolation', ratio: 'N₂ = N₁', voltage: 'Same voltage', icon: '⚖️', color: '#f59e0b' },
                    { type: 'Auto', ratio: 'Shared winding', voltage: 'Variable', icon: '🔄', color: '#8b5cf6' }
                  ].map((transformer, index) => (
                    <div key={index} style={{
                      padding: '20px',
                      background: `rgba(${transformer.color === '#22c55e' ? '34,197,94' : 
                        transformer.color === '#ef4444' ? '239,68,68' :
                        transformer.color === '#f59e0b' ? '245,158,11' : '139,92,246'},0.1)`,
                      borderRadius: '15px',
                      border: `1px solid ${transformer.color}40`
                    }}>
                      <h4 style={{ color: transformer.color, fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        {transformer.icon} {transformer.type} Transformer
                      </h4>
                      <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                        <strong>Turns Ratio:</strong> {transformer.ratio}
                      </p>
                      <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
                        <strong>Function:</strong> {transformer.voltage}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applications Tab */}
            {activeTheoryTab === 'applications' && (
              <div>
                <h3 style={{ color: '#f59e0b', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  🏭 Real-World Applications
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {[
                    { area: 'Power Transmission', desc: 'Step-up for long-distance transmission, step-down for distribution', icon: '⚡' },
                    { area: 'Electronics', desc: 'Power supplies, voltage regulation, isolation circuits', icon: '📱' },
                    { area: 'Industry', desc: 'Motor control, welding machines, furnaces', icon: '🏭' },
                    { area: 'Residential', desc: 'Doorbells, low-voltage lighting, HVAC systems', icon: '🏠' }
                  ].map((app, index) => (
                    <div key={index} style={{
                      padding: '20px',
                      background: 'rgba(245,158,11,0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(245,158,11,0.2)'
                    }}>
                      <h4 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                        {app.icon} {app.area}
                      </h4>
                      <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        {app.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safety Tab */}
            {activeTheoryTab === 'safety' && (
              <div>
                <h3 style={{ color: '#ef4444', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  ⚠️ Safety Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{
                    padding: '20px',
                    background: 'rgba(239,68,68,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(239,68,68,0.2)'
                  }}>
                    <h4 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      ⚡ High Voltage Safety
                    </h4>
                    <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
                      <li>Never work on live transformers</li>
                      <li>Use proper PPE and tools</li>
                      <li>Follow lockout/tagout procedures</li>
                      <li>Test for voltage before working</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(34,197,94,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(34,197,94,0.2)'
                  }}>
                    <h4 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      🔧 Installation Guidelines
                    </h4>
                    <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
                      <li>Proper ventilation required</li>
                      <li>Secure mounting and grounding</li>
                      <li>Correct wire sizing</li>
                      <li>Follow local electrical codes</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      🔄 Maintenance
                    </h4>
                    <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
                      <li>Regular visual inspections</li>
                      <li>Monitor temperature and noise</li>
                      <li>Check connections periodically</li>
                      <li>Professional servicing when needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTheoryTab === 'advanced' && (
              <div>
                <h3 style={{ color: '#8b5cf6', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  🔬 Advanced Concepts
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{
                    padding: '20px',
                    background: 'rgba(139,92,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(139,92,246,0.2)'
                  }}>
                    <h4 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      📊 Efficiency Analysis
                    </h4>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                      Real transformers have losses due to:
                    </p>
                    <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
                      <li>Copper losses (I²R heating)</li>
                      <li>Iron losses (hysteresis & eddy currents)</li>
                      <li>Magnetic leakage</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      ⚡ Power Factor
                    </h4>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                      Transformers affect power factor:
                    </p>
                    <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
                      <li>Reactive power consumption</li>
                      <li>Magnetizing current</li>
                      <li>Load-dependent behavior</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(34,197,94,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(34,197,94,0.2)'
                  }}>
                    <h4 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      🔧 Design Considerations
                    </h4>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                      Key design factors:
                    </p>
                    <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
                      <li>Core material selection</li>
                      <li>Winding configuration</li>
                      <li>Cooling methods</li>
                      <li>Insulation systems</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Calculator Section with Modes */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
          padding: '30px',
          borderTop: '1px solid rgba(34,197,94,0.3)'
        }}>
          {/* Calculator Section Header */}
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ 
              color: '#f8fafc', 
              fontSize: '28px', 
              fontWeight: 700, 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              🧮 Interactive Transformer Calculator
            </h2>
            
            {/* Calculator Mode Tabs */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '25px',
              flexWrap: 'wrap'
            }}>
              {calculatorModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveCalculatorMode(mode.id)}
                  style={{
                    padding: '12px 20px',
                    background: activeCalculatorMode === mode.id 
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : 'rgba(34,197,94,0.1)',
                    color: activeCalculatorMode === mode.id ? '#ffffff' : '#22c55e',
                    border: activeCalculatorMode === mode.id 
                      ? '1px solid #22c55e'
                      : '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '25px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
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
          </div>

          {/* Calculator Content */}
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Basic Calculator Mode */}
            {activeCalculatorMode === 'basic' && (
              <div>
                <h3 style={{ color: '#22c55e', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  🔧 Basic Transformer Calculations
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                  
                  {/* Input Parameters */}
                  <div style={{
                    padding: '25px',
                    background: 'rgba(34,197,94,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(34,197,94,0.2)'
                  }}>
                    <h4 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                      📊 Input Parameters
                    </h4>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '5px' }}>
                        Primary Voltage (V₁)
                      </label>
                      <input
                        type="number"
                        value={transformer.primaryVoltage}
                        onChange={(e) => setTransformer(prev => ({ ...prev, primaryVoltage: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(34,197,94,0.3)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '5px' }}>
                        Turns Ratio (N₁:N₂)
                      </label>
                      <input
                        type="number"
                        value={transformer.turnsRatio}
                        onChange={(e) => setTransformer(prev => ({ ...prev, turnsRatio: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(34,197,94,0.3)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '5px' }}>
                        Load Resistance (Ω)
                      </label>
                      <input
                        type="number"
                        value={transformer.loadResistance}
                        onChange={(e) => setTransformer(prev => ({ ...prev, loadResistance: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(34,197,94,0.3)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '5px' }}>
                        Frequency (Hz)
                      </label>
                      <input
                        type="number"
                        value={transformer.frequency}
                        onChange={(e) => setTransformer(prev => ({ ...prev, frequency: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(34,197,94,0.3)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Calculation Results */}
                  <div style={{
                    padding: '25px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
                      📈 Calculation Results
                    </h4>
                    
                    <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px' }}>
                      <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600 }}>Secondary Voltage</div>
                      <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>
                        V₂ = {actualSecondaryVoltage.toFixed(1)} V
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px' }}>
                      <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>Secondary Current</div>
                      <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>

                        I₂ = {secondaryCurrent.toFixed(2)} A
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px' }}>
                      <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600 }}>Input Power</div>
                      <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>
                        P₁ = {inputPower.toFixed(1)} W
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px' }}>
                      <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>Output Power</div>
                      <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>
                        P₂ = {outputPower.toFixed(1)} W
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px' }}>
                      <div style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 600 }}>Efficiency</div>
                      <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>
                        η = {actualEfficiency.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Power Calculator Mode */}
            {activeCalculatorMode === 'power' && (
              <div>
                <h3 style={{ color: '#3b82f6', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  ⚡ Power Analysis Calculator
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{
                    padding: '20px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      ⚡ Power Formulas
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                      <p style={{ marginBottom: '8px' }}><strong>P₁ = V₁ × I₁</strong></p>
                      <p style={{ marginBottom: '8px' }}><strong>P₂ = V₂ × I₂</strong></p>
                      <p style={{ marginBottom: '8px' }}><strong>P_loss = P₁ - P₂</strong></p>
                      <p><strong>η = (P₂/P₁) × 100%</strong></p>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(34,197,94,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(34,197,94,0.2)'
                  }}>
                    <h4 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      📊 Current Values
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                      <p>Input Power: <strong style={{ color: '#3b82f6' }}>{inputPower.toFixed(1)} W</strong></p>
                      <p>Output Power: <strong style={{ color: '#22c55e' }}>{outputPower.toFixed(1)} W</strong></p>
                      <p>Power Loss: <strong style={{ color: '#ef4444' }}>{powerLoss.toFixed(1)} W</strong></p>
                      <p>Efficiency: <strong style={{ color: '#f59e0b' }}>{actualEfficiency.toFixed(1)}%</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Efficiency Calculator Mode */}
            {activeCalculatorMode === 'efficiency' && (
              <div>
                <h3 style={{ color: '#8b5cf6', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  📊 Efficiency Analysis Calculator
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{
                    padding: '20px',
                    background: 'rgba(139,92,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(139,92,246,0.2)'
                  }}>
                    <h4 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      📊 Efficiency Factors
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                      <p style={{ marginBottom: '8px' }}>• Copper losses (I²R)</p>
                      <p style={{ marginBottom: '8px' }}>• Iron losses (hysteresis)</p>
                      <p style={{ marginBottom: '8px' }}>• Eddy current losses</p>
                      <p style={{ marginBottom: '8px' }}>• Magnetic leakage</p>
                      <p>• Load factor effects</p>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(34,197,94,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(34,197,94,0.2)'
                  }}>
                    <h4 style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      🎯 Current Efficiency
                    </h4>
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: `conic-gradient(#22c55e 0deg ${actualEfficiency * 3.6}deg, rgba(34,197,94,0.2) ${actualEfficiency * 3.6}deg 360deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'rgba(15,23,42,0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 700,
                          color: actualEfficiency > 90 ? '#22c55e' : '#fbbf24'
                        }}>
                          {actualEfficiency.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', textAlign: 'center' }}>
                      <p>Power Loss: <strong style={{ color: '#ef4444' }}>{powerLoss.toFixed(1)} W</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loss Analysis Calculator Mode */}
            {activeCalculatorMode === 'loss' && (
              <div>
                <h3 style={{ color: '#ef4444', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  📉 Loss Analysis Calculator
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{
                    padding: '20px',
                    background: 'rgba(239,68,68,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(239,68,68,0.2)'
                  }}>
                    <h4 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      📉 Loss Types
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                      <p style={{ marginBottom: '8px' }}><strong>Copper Losses:</strong> I²R heating</p>
                      <p style={{ marginBottom: '8px' }}><strong>Iron Losses:</strong> Hysteresis & eddy currents</p>
                      <p style={{ marginBottom: '8px' }}><strong>Stray Losses:</strong> Magnetic leakage</p>
                      <p><strong>Total Loss:</strong> {powerLoss.toFixed(1)} W</p>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                      📊 Loss Breakdown
                    </h4>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                      <p>Total Input Power: <strong style={{ color: '#3b82f6' }}>{inputPower.toFixed(1)} W</strong></p>
                      <p>Useful Output: <strong style={{ color: '#22c55e' }}>{outputPower.toFixed(1)} W</strong></p>
                      <p>Power Loss: <strong style={{ color: '#ef4444' }}>{powerLoss.toFixed(1)} W</strong></p>
                      <p>Loss Percentage: <strong style={{ color: '#f59e0b' }}>{((powerLoss/inputPower)*100).toFixed(1)}%</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default EnhancedTransformerSimulator;

