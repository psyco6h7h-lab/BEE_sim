import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useLightweightStore } from '../store/lightweightStore';

interface Component {
  id: string;
  type: 'resistor' | 'battery' | 'wire' | 'switch' | 'capacitor' | 'inductor' | 'bulb';
  x: number;
  y: number;
  value: number;
  isSelected: boolean;
  connections: string[];
  isOn?: boolean; // For switches
  brightness?: number; // For bulbs
  isOverloaded?: boolean; // For resistors
}

interface Wire {
  id: string;
  from: string;
  to: string;
}

const LightweightCircuitSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wireDraft, setWireDraft] = useState<string | null>(null);
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null);
  const [_statusMessage, setStatusMessage] = useState<string>('Place components and connect with wires. Circuit runs automatically.');
  const [bulbIntensity, setBulbIntensity] = useState<Record<string, number>>({});
  const [simulation, setSimulation] = useState({
    voltage: 0,
    current: 0,
    resistance: 0,
    power: 0,
    reactance: 0,
    powerFactor: 1,
    isRunning: true // Always running automatically
  });
  const [appState, store] = useLightweightStore();
  const [frequencyHz, setFrequencyHz] = useState(60);
  const [circuitStartTime, setCircuitStartTime] = useState(Date.now());

  // Animation frame for smooth rendering
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Component library
  const componentTypes = useMemo(() => ([
    { type: 'resistor', name: 'Resistor', symbol: 'R', defaultValue: 100, color: '#22c55e' },
    { type: 'battery', name: 'Battery', symbol: 'V', defaultValue: 12, color: '#ef4444' },
    { type: 'switch', name: 'Switch', symbol: 'S', defaultValue: 1, color: '#eab308' },
    { type: 'capacitor', name: 'Capacitor', symbol: 'C', defaultValue: 0.001, color: '#a855f7' },
    { type: 'inductor', name: 'Inductor', symbol: 'L', defaultValue: 0.01, color: '#0891b2' },
    { type: 'bulb', name: 'Bulb', symbol: 'Lamp', defaultValue: 60, color: '#f97316' }
  ]), []);

  const selectedComponent = useMemo(() => components.find(component => component.isSelected) ?? null, [components]);
  const componentControlMap = useMemo(() => ({
    battery: { label: 'Voltage (V)', min: 1, max: 240, step: 1 },
    resistor: { label: 'Resistance (Ω)', min: 1, max: 1000, step: 1 },
    capacitor: { label: 'Capacitance (F)', min: 0.0001, max: 0.05, step: 0.0001 },
    inductor: { label: 'Inductance (H)', min: 0.0001, max: 1, step: 0.0001 },
    bulb: { label: 'Wattage (W)', min: 10, max: 200, step: 5 }
  } as const), []);

  type AdjustableType = keyof typeof componentControlMap;
  const isAdjustableComponent = (component: Component): component is Component & { type: AdjustableType } =>
    ['battery', 'resistor', 'capacitor', 'inductor', 'bulb'].includes(component.type);


  // Draw functions
  const drawComponent = useCallback((ctx: CanvasRenderingContext2D, component: Component) => {
    const { x, y, type, value, isSelected } = component;
    
    // Selection glow
    if (isSelected) {
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowBlur = 0;
    }

    const componentInfo = componentTypes.find(c => c.type === type);
    const color = componentInfo?.color || '#6b7280';
    
    ctx.fillStyle = color;
    ctx.strokeStyle = isSelected ? '#3b82f6' : color;
    ctx.lineWidth = isSelected ? 3 : 2;

    // Simple geometric shapes instead of complex 3D
    switch (type) {
      case 'resistor':
        // 🔌 REALISTIC RESISTOR - With color bands and overload
        const isOverloaded = component.isOverloaded;
        
        // Resistor body (cylinder)
        const bodyGrad = ctx.createLinearGradient(x - 18, y - 12, x + 18, y + 12);
        if (isOverloaded) {
          // OVERLOADED - glowing red
          bodyGrad.addColorStop(0, '#fca5a5');
          bodyGrad.addColorStop(0.5, '#ef4444');
          bodyGrad.addColorStop(1, '#b91c1c');
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ef4444';
        } else {
          // NORMAL - beige/tan like real resistor
          bodyGrad.addColorStop(0, '#fef3c7');
          bodyGrad.addColorStop(0.5, '#fde68a');
          bodyGrad.addColorStop(1, '#fcd34d');
        }
        
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(x - 18, y - 12, 36, 24);
        ctx.strokeStyle = isOverloaded ? '#dc2626' : '#ca8a04';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 18, y - 12, 36, 24);
        ctx.shadowBlur = 0;
        
        // Color bands (like real resistors)
        const bandColors = isOverloaded 
          ? ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'] 
          : ['#8b5cf6', '#6366f1', '#3b82f6', '#ca8a04'];
        
        const bandPositions = [-10, -3, 4, 11];
        bandPositions.forEach((pos, i) => {
          ctx.fillStyle = bandColors[i];
          ctx.fillRect(x + pos, y - 12, 3, 24);
        });
        
        // Wire leads (metallic)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 28, y);
        ctx.lineTo(x - 18, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 18, y);
        ctx.lineTo(x + 28, y);
        ctx.stroke();
        
        // End caps
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x - 18, y - 12, 2, 24);
        ctx.fillRect(x + 16, y - 12, 2, 24);
        
        // Value label with background
        const labelBg = isOverloaded ? '#ef4444' : '#22c55e';
        ctx.fillStyle = labelBg;
        ctx.fillRect(x - 22, y - 35, 44, 14);
        ctx.strokeStyle = labelBg;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 22, y - 35, 44, 14);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}Ω`, x, y - 25);
        
        if (isOverloaded) {
          // Overload warning
          ctx.font = 'bold 9px Arial';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('⚠ OVERLOAD', x, y + 30);
        } else {
          // Normal status
          ctx.font = '9px Arial';
          ctx.fillStyle = '#22c55e';
          ctx.fillText('✓ OK', x, y + 30);
        }
        break;
      
      case 'battery':
        // 🔋 MODERN BATTERY - 3D style with gradient
        const batteryGradient = ctx.createLinearGradient(x - 15, y - 20, x + 15, y + 20);
        batteryGradient.addColorStop(0, '#ef4444');
        batteryGradient.addColorStop(0.5, '#dc2626');
        batteryGradient.addColorStop(1, '#b91c1c');
        
        // Battery body with 3D effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        
        // Negative terminal (larger plate)
        ctx.strokeStyle = batteryGradient;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 18);
        ctx.lineTo(x - 12, y + 18);
        ctx.stroke();
        
        // Positive terminal (smaller plate)
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + 12, y - 12);
        ctx.lineTo(x + 12, y + 12);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        // Terminal symbols
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', x + 12, y - 20);
        ctx.fillText('−', x - 12, y - 22);
        
        // Voltage label with background
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(x - 20, y - 38, 40, 16);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 20, y - 38, 40, 16);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`${value}V`, x, y - 27);
        break;
      
      case 'switch':
        // 🔀 ADVANCED SWITCH - 3D mechanical lever
        const isClosed = component.isOn;
        
        // Base platform with shadow
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 25, y - 5, 50, 10);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 25, y - 5, 50, 10);
        ctx.shadowBlur = 0;
        
        // Terminal posts (metallic)
        const terminalGradient = ctx.createRadialGradient(x - 20, y, 0, x - 20, y, 6);
        terminalGradient.addColorStop(0, '#94a3b8');
        terminalGradient.addColorStop(1, '#64748b');
        
        ctx.fillStyle = terminalGradient;
        ctx.beginPath();
        ctx.arc(x - 20, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = terminalGradient;
        ctx.beginPath();
        ctx.arc(x + 20, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Switch lever (animated)
        ctx.save();
        ctx.translate(x - 20, y);
        
        if (isClosed) {
          // CLOSED - lever horizontal with glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#22c55e';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(40, 0);
          ctx.stroke();
          
          // Lever handle
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.arc(40, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // OPEN - lever angled with warning
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ef4444';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          
          const endX = 35 * Math.cos(45 * Math.PI / 180);
          const endY = -35 * Math.sin(45 * Math.PI / 180);
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          
          // Lever handle
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.arc(endX, endY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Status indicator LED
        ctx.shadowBlur = 8;
        ctx.shadowColor = isClosed ? '#22c55e' : '#ef4444';
        ctx.fillStyle = isClosed ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y - 25, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Status text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isClosed ? '● ON' : '○ OFF', x, y - 35);
        
        ctx.font = '8px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(click)', x, y + 25);
        
        // Status indicator
        ctx.fillStyle = isClosed ? '#22c55e' : '#ef4444';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isClosed ? 'ON' : 'OFF', x, y + 20);
        break;
      
      case 'capacitor':
        // 🔋 REALISTIC CAPACITOR - Cylindrical with terminals
        const capGradient = ctx.createLinearGradient(x - 12, y - 15, x + 12, y + 15);
        capGradient.addColorStop(0, '#a855f7');
        capGradient.addColorStop(0.5, '#8b5cf6');
        capGradient.addColorStop(1, '#7c3aed');
        
        // Capacitor body (cylinder)
        ctx.fillStyle = capGradient;
        ctx.fillRect(x - 12, y - 15, 24, 30);
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 12, y - 15, 24, 30);
        
        // Terminal wires (metallic)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x - 12, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 12, y);
        ctx.lineTo(x + 20, y);
        ctx.stroke();
        
        // Polarity markings
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', x - 6, y - 5);
        ctx.fillText('−', x + 6, y - 5);
        
        // Value label
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(x - 18, y - 30, 36, 12);
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 18, y - 30, 36, 12);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`${value}C`, x, y - 22);
        break;
      
      case 'inductor':
        // 🌀 REALISTIC INDUCTOR - Coiled wire with core
        const inductorGradient = ctx.createLinearGradient(x - 15, y - 10, x + 15, y + 10);
        inductorGradient.addColorStop(0, '#0891b2');
        inductorGradient.addColorStop(0.5, '#0e7490');
        inductorGradient.addColorStop(1, '#155e75');
        
        // Core (magnetic material)
        ctx.fillStyle = '#374151';
        ctx.fillRect(x - 15, y - 8, 30, 16);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 15, y - 8, 30, 16);
        
        // Coiled wire (detailed)
        ctx.strokeStyle = inductorGradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const startX = x - 12 + i * 6;
          const endX = x - 6 + i * 6;
          ctx.moveTo(startX, y - 6);
          ctx.quadraticCurveTo(startX + 3, y, endX, y + 6);
          ctx.moveTo(endX, y + 6);
          ctx.quadraticCurveTo(endX + 3, y, startX + 6, y - 6);
        }
        ctx.stroke();
        
        // Terminal wires
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x - 15, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 15, y);
        ctx.lineTo(x + 20, y);
        ctx.stroke();
        
        // Value label
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(x - 18, y - 30, 36, 12);
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 18, y - 30, 36, 12);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`${value}L`, x, y - 22);
        break;

      case 'bulb': {
        const intensity = bulbIntensity[component.id] ?? 0;
        const glow = Math.max(0, Math.min(1, intensity));
        const isLit = glow > 0.01;

        // 💡 REALISTIC BULB - Multi-layer glow effect
        if (isLit) {
          // OUTER RADIANT GLOW (4 layers for realism)
          for (let i = 4; i >= 1; i--) {
            const glowRadius = 22 + i * 8;
            const glowOpacity = (0.2 * glow) / i;
            
            const outerGrad = ctx.createRadialGradient(x, y, 22, x, y, glowRadius);
            outerGrad.addColorStop(0, `rgba(255, 255, 200, ${glowOpacity * 0.8})`);
            outerGrad.addColorStop(0.5, `rgba(255, 191, 36, ${glowOpacity * 0.4})`);
            outerGrad.addColorStop(1, `rgba(255, 191, 36, 0)`);
            
            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // GLASS BULB (realistic gradient)
        const bulbGrad = ctx.createRadialGradient(x - 8, y - 8, 5, x, y, 24);
        if (isLit) {
          // Glowing bulb
          bulbGrad.addColorStop(0, `rgba(255, 255, 200, ${0.9 * glow})`);
          bulbGrad.addColorStop(0.3, `rgba(255, 191, 36, ${0.7 * glow})`);
          bulbGrad.addColorStop(0.7, `rgba(255, 146, 60, ${0.5 * glow})`);
          bulbGrad.addColorStop(1, `rgba(234, 88, 12, ${0.3 * glow})`);
        } else {
          // Dark bulb
          bulbGrad.addColorStop(0, '#4b5563');
          bulbGrad.addColorStop(0.5, '#374151');
          bulbGrad.addColorStop(1, '#1f2937');
        }
        
        ctx.fillStyle = bulbGrad;
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.fill();
        
        // Glass reflection highlight
        ctx.fillStyle = isLit ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.ellipse(x - 7, y - 7, 8, 5, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Glass outline
        ctx.strokeStyle = isLit ? '#fbbf24' : '#6b7280';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.stroke();
        
        // FILAMENT (tungsten coil)
        if (isLit && glow > 0.05) {
          ctx.shadowBlur = 8 * glow;
          ctx.shadowColor = '#fff';
          ctx.strokeStyle = glow > 0.5 ? '#ffffff' : '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          
          // Coiled filament design
          ctx.beginPath();
          for (let i = -8; i <= 8; i += 2) {
            ctx.moveTo(x + i, y - 6);
            ctx.lineTo(x + i, y + 6);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          // Dark filament
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - 8, y);
          ctx.lineTo(x + 8, y);
          ctx.stroke();
        }
        
        // Base screw
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x - 6, y + 20, 12, 8);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 6, y + 22 + i * 2);
          ctx.lineTo(x + 6, y + 22 + i * 2);
          ctx.stroke();
        }
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LAMP', x, y - 35);
        
        // Brightness indicator
        if (simulation.isRunning) {
          ctx.font = 'bold 9px Arial';
          ctx.fillStyle = isLit ? '#fbbf24' : '#6b7280';
          ctx.fillText(isLit ? `⚡${(glow * 100).toFixed(0)}%` : 'OFF', x, y + 40);
        }
        break;
      }
    }

    // Value label (skip for bulb to avoid number display)
    if (type !== 'bulb') {
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${value}${componentInfo?.symbol || ''}`, x, y + 25);
    }
  }, [componentTypes]);

  const drawWire = useCallback((ctx: CanvasRenderingContext2D, wire: Wire, isActive: boolean) => {
    const fromComponent = components.find(component => component.id === wire.from);
    const toComponent = components.find(component => component.id === wire.to);

    if (!fromComponent || !toComponent) {
      return;
    }

    // Check if current is flowing through this wire
    const hasCurrent = simulation.current > 0;
    
    ctx.strokeStyle = hasCurrent ? '#0ea5e9' : (isActive ? '#3b82f6' : '#6b7280');
    ctx.lineWidth = hasCurrent ? 4 : (isActive ? 3 : 2);
    ctx.shadowBlur = hasCurrent ? 8 : (isActive ? 5 : 0);
    ctx.shadowColor = hasCurrent ? '#0ea5e9' : '#3b82f6';
    ctx.lineJoin = 'round';

    const midX = (fromComponent.x + toComponent.x) / 2;
    
    ctx.beginPath();
    ctx.moveTo(fromComponent.x, fromComponent.y);
    ctx.lineTo(midX, fromComponent.y);
    ctx.lineTo(midX, toComponent.y);
    ctx.lineTo(toComponent.x, toComponent.y);
    ctx.stroke();

    // ENHANCED CURRENT FLOW PARTICLES (Physics-accurate)
    if (hasCurrent) {
      const time = Date.now() * 0.003 * Math.sqrt(Math.abs(simulation.current)); // Speed based on current
      const particleCount = Math.max(4, Math.floor(Math.abs(simulation.current) * 10) + 3);
      
      for (let i = 0; i < particleCount; i++) {
        const progress = ((time + i / particleCount) % 1);
        
        // Follow the exact wire path with proper alignment
        let x, y;
        if (progress < 0.33) {
          // First segment: horizontal to midpoint
          const segmentProgress = progress / 0.33;
          x = fromComponent.x + (midX - fromComponent.x) * segmentProgress;
          y = fromComponent.y;
        } else if (progress < 0.66) {
          // Second segment: vertical from midpoint
          const segmentProgress = (progress - 0.33) / 0.33;
          x = midX;
          y = fromComponent.y + (toComponent.y - fromComponent.y) * segmentProgress;
        } else {
          // Third segment: horizontal to end
          const segmentProgress = (progress - 0.66) / 0.34;
          x = midX + (toComponent.x - midX) * segmentProgress;
          y = toComponent.y;
        }
        
        // Particle size based on current magnitude
        const particleSize = 2.5 + Math.min(2, simulation.current * 0.3);
        
        // Draw glowing particle with enhanced glow
        ctx.save();
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 15 + simulation.current * 3;
        
        // Outer glow gradient
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, particleSize + 3);
        glowGradient.addColorStop(0, '#60a5fa');
        glowGradient.addColorStop(0.5, '#0ea5e9');
        glowGradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, particleSize + 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Main particle body
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright core
        ctx.shadowBlur = 0;
        const coreGradient = ctx.createRadialGradient(
          x - particleSize * 0.3, y - particleSize * 0.3, 0,
          x, y, particleSize
        );
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.5, '#60a5fa');
        coreGradient.addColorStop(1, '#0ea5e9');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(x, y, particleSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }, [components, simulation]);

  const render = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid background
    if (appState.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      }
    }

    // Draw wires
    wires.forEach(wire => {
      drawWire(ctx, wire, simulation.isRunning);
    });

    // Draw components
    components.forEach(component => {
      drawComponent(ctx, component);
    });

    // Wire preview when drafting
    if (selectedTool === 'wire' && wireDraft) {
      const fromComponent = components.find(component => component.id === wireDraft);
      if (fromComponent && pointerPosition) {
        ctx.save();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(fromComponent.x, fromComponent.y);
        ctx.lineTo(pointerPosition.x, pointerPosition.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Pointer indicator
    if (pointerPosition) {
      ctx.save();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.beginPath();
      ctx.arc(pointerPosition.x, pointerPosition.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Performance info
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    const fps = 1000 / (currentTime - lastTimeRef.current || 16);
    ctx.fillText(`FPS: ${fps.toFixed(1)} | Components: ${components.length}`, 10, 20);
    
    // Circuit status with current info
    const hasCurrent = simulation.current > 0;
    const hasBulb = components.some(c => c.type === 'bulb');
    const circuitActive = simulation.isRunning && hasCurrent;
    ctx.fillStyle = circuitActive ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(circuitActive ? 'CIRCUIT ACTIVE' : 'CIRCUIT INACTIVE', 10, 40);
    
    // Current flow indicator
    if (hasCurrent) {
      ctx.fillStyle = '#0ea5e9';
      ctx.font = '12px Arial';
      ctx.fillText(`Current: ${simulation.current.toFixed(3)}A`, 10, 60);
      ctx.fillText(`Voltage: ${simulation.voltage.toFixed(1)}V`, 10, 80);
    }
    
    // Bulb status
    if (!hasBulb) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('NO BULB - Add bulb to see it glow!', 10, 60);
    }
    
    lastTimeRef.current = currentTime;
  }, [components, wires, simulation, drawComponent, drawWire, pointerPosition, selectedTool, wireDraft, appState.showGrid]);

  // Animation loop
  useEffect(() => {
    const animate = (time: number) => {
      render(time);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Event handlers
  const getComponentAtPosition = useCallback((x: number, y: number) => {
    return components.find(component => Math.abs(component.x - x) < 25 && Math.abs(component.y - y) < 25);
  }, [components]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const snapCoordinate = (value: number) => {
      const gridSize = 20;
      return Math.round(value / gridSize) * gridSize;
    };

    const x = snapCoordinate(e.clientX - rect.left);
    const y = snapCoordinate(e.clientY - rect.top);

    if (selectedTool === 'wire') {
      const targetComponent = getComponentAtPosition(x, y);

      if (!targetComponent) {
        setWireDraft(null);
        setStatusMessage('Wire cancelled. Select a component to start a new connection.');
        return;
      }

      if (!wireDraft) {
        setWireDraft(targetComponent.id);
        setComponents(prev => prev.map(component => ({
          ...component,
          isSelected: component.id === targetComponent.id
        })));
        if (targetComponent.type === 'switch') {
          setStatusMessage('Switch selected. Connect it between battery and load to control the circuit.');
        } else if (targetComponent.type === 'battery') {
          setStatusMessage('Battery selected as start. Connect to components to power the circuit.');
        } else if (targetComponent.type === 'bulb') {
          setStatusMessage('Bulb selected. Link it with a battery and switch to light it up.');
        } else {
          setStatusMessage('Wire start point selected. Click another component to connect.');
        }
      } else if (wireDraft !== targetComponent.id) {
        const exists = wires.some(wire => (
          (wire.from === wireDraft && wire.to === targetComponent.id) ||
          (wire.from === targetComponent.id && wire.to === wireDraft)
        ));

        if (!exists) {
          const newWire: Wire = {
            id: `wire_${Date.now()}`,
            from: wireDraft,
            to: targetComponent.id
          };

          setWires(prev => [...prev, newWire]);
          setComponents(prev => prev.map(component => {
            if (component.id === wireDraft) {
              return { ...component, connections: [...component.connections, targetComponent.id] };
            }
            if (component.id === targetComponent.id) {
              return { ...component, connections: [...component.connections, wireDraft] };
            }
            return component;
          }));
          if (targetComponent.type === 'bulb') {
            setStatusMessage('Bulb connected! Adjust voltage or close the switch to see it glow.');
          } else if (targetComponent.type === 'switch') {
            setStatusMessage('Switch connected. Toggle it to open or close the circuit.');
          } else {
            setStatusMessage('Wire created successfully.');
          }
        } else {
          setStatusMessage('These components are already connected.');
        }

        setWireDraft(null);
      }

      return;
    }

    if (selectedTool === 'delete') {
      const targetComponent = getComponentAtPosition(x, y);

      if (targetComponent) {
        setComponents(prev => prev.filter(component => component.id !== targetComponent.id));
        setWires(prev => prev.filter(wire => wire.from !== targetComponent.id && wire.to !== targetComponent.id));
        setStatusMessage(`${targetComponent.type} removed.`);
      } else {
        const hitWire = wires.find(wire => {
          const fromComponent = components.find(component => component.id === wire.from);
          const toComponent = components.find(component => component.id === wire.to);

          if (!fromComponent || !toComponent) {
            return false;
          }

          const numerator = Math.abs((toComponent.y - fromComponent.y) * x - (toComponent.x - fromComponent.x) * y + toComponent.x * fromComponent.y - toComponent.y * fromComponent.x);
          const denominator = Math.sqrt(Math.pow(toComponent.y - fromComponent.y, 2) + Math.pow(toComponent.x - fromComponent.x, 2));
          const distance = denominator ? numerator / denominator : Number.MAX_VALUE;

          return distance < 10;
        });

        if (hitWire) {
          setWires(prev => prev.filter(wire => wire.id !== hitWire.id));
          setComponents(prev => prev.map(component => ({
            ...component,
            connections: component.connections.filter(connection => connection !== hitWire.from && connection !== hitWire.to)
          })));
          setStatusMessage('Wire removed. Reconnect components to restore current flow.');
        }
      }

      return;
    }

    if (selectedTool !== 'select') {
      // Add component
      const componentType = componentTypes.find(c => c.type === selectedTool);
      if (componentType) {
        const canvasBounds = canvas.getBoundingClientRect();
        const clampedX = Math.min(Math.max(x, 40), canvasBounds.width - 40);
        const clampedY = Math.min(Math.max(y, 40), canvasBounds.height - 40);

        const newComponent: Component = {
          id: `${selectedTool}_${Date.now()}`,
          type: selectedTool as any,
          x: clampedX,
          y: clampedY,
          value: componentType.defaultValue,
          isSelected: false,
          connections: [],
          // Initialize component-specific properties
          isOn: selectedTool === 'switch' ? true : undefined, // Switches start ON
          brightness: selectedTool === 'bulb' ? 0 : undefined, // Bulbs start off
          isOverloaded: selectedTool === 'resistor' ? false : undefined // Resistors start normal
        };

        setComponents(prev => {
          const clearedSelection = prev.map(component => ({ ...component, isSelected: false }));
          return [...clearedSelection, newComponent];
        });

        setStatusMessage(`${componentType.name} added. Connect components with wires to complete the circuit.`);
      }
      return;
    }

    // Select component or toggle switch
    const clickedComponent = getComponentAtPosition(x, y);

    if (clickedComponent && clickedComponent.type === 'switch') {
      // 🔀 TOGGLE SWITCH - Click to toggle ON/OFF
      setComponents(prev => prev.map(comp => ({
        ...comp,
        isSelected: comp.id === clickedComponent.id,
        isOn: comp.id === clickedComponent.id ? !comp.isOn : comp.isOn
      })));
      
      const newState = !clickedComponent.isOn;
      setStatusMessage(`Switch ${newState ? 'turned ON' : 'turned OFF'} - ${newState ? 'Current flows' : 'No current'}.`);
    } else {
      // Select other components
      setComponents(prev => prev.map(comp => ({
        ...comp,
        isSelected: comp.id === clickedComponent?.id
      })));

      if (clickedComponent) {
        if (clickedComponent.type === 'battery') {
          // Increase voltage when clicking battery
          setComponents(prev => prev.map(comp => {
            if (comp.id === clickedComponent.id) {
              const newVoltage = Math.min(50, comp.value + 6); // Increase by 6V, max 50V
              return { ...comp, value: newVoltage };
            }
            return comp;
          }));
          setStatusMessage(`Battery voltage increased! Bulb will glow brighter with higher voltage.`);
        } else if (clickedComponent.type === 'bulb') {
          setStatusMessage('Bulb selected. Click battery to increase voltage and make it glow brighter.');
        } else {
          setStatusMessage(`Selected ${clickedComponent.type}. Drag to reposition, or use delete tool to remove.`);
        }
      } else {
        setStatusMessage('No component selected.');
      }
    }
  }, [selectedTool, components, componentTypes, getComponentAtPosition, wires, wireDraft]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'select') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const snappingGrid = 20;
    const x = Math.round((e.clientX - rect.left) / snappingGrid) * snappingGrid;
    const y = Math.round((e.clientY - rect.top) / snappingGrid) * snappingGrid;

    const clickedComponent = getComponentAtPosition(x, y);

    if (clickedComponent) {
      setDraggedComponent(clickedComponent.id);
      setDragOffset({
        x: x - clickedComponent.x,
        y: y - clickedComponent.y
      });
    }
  }, [selectedTool, components, getComponentAtPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const snapCoordinate = (value: number) => {
      const gridSize = 20;
      return Math.round(value / gridSize) * gridSize;
    };

    const x = snapCoordinate(e.clientX - rect.left);
    const y = snapCoordinate(e.clientY - rect.top);
    setPointerPosition({ x, y });

    if (!draggedComponent) return;

    const newX = snapCoordinate(e.clientX - rect.left - dragOffset.x);
    const newY = snapCoordinate(e.clientY - rect.top - dragOffset.y);

    setComponents(prev => prev.map(comp => 
      comp.id === draggedComponent ? { ...comp, x: newX, y: newY } : comp
    ));
  }, [draggedComponent, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedComponent(null);
    if (draggedComponent) {
      setStatusMessage('Component repositioned.');
    }
  }, [draggedComponent]);

  // PROFESSIONAL CIRCUIT SIMULATION with Kirchhoff's Laws
  const calculateCircuit = useCallback(() => {
    const batteries = components.filter(component => component.type === 'battery');
    const resistors = components.filter(component => component.type === 'resistor');
    const bulbs = components.filter(component => component.type === 'bulb');
    const switches = components.filter(component => component.type === 'switch');

    // Check if any switch is open
    const anyOpenSwitch = switches.some(switchComp => !switchComp.isOn);
    
    // If no battery or any switch is open, circuit is inactive
    if (batteries.length === 0 || anyOpenSwitch) {
      setSimulation(prev => ({
        ...prev,
        voltage: 0,
        current: 0,
        resistance: 0,
        power: 0,
        isRunning: false
      }));
      
      // Clear all bulb intensities
      const clearBulbIntensity: Record<string, number> = {};
      bulbs.forEach(bulb => {
        clearBulbIntensity[bulb.id] = 0;
      });
      setBulbIntensity(clearBulbIntensity);
      
      // Update components to turn off
      setComponents(prev => prev.map(comp => {
        if (comp.type === 'bulb') {
          return { ...comp, brightness: 0 };
        }
        if (comp.type === 'resistor') {
          return { ...comp, isOverloaded: false };
        }
        return comp;
      }));
      
      return;
    }

    // AUTO-CONNECT COMPONENTS if no wires exist
    if (wires.length === 0 && components.length > 1) {
      // Create automatic series connections
      const sortedComponents = [...components].sort((a, b) => a.x - b.x);
      const newWires = [];
      
      for (let i = 0; i < sortedComponents.length - 1; i++) {
        const current = sortedComponents[i];
        const next = sortedComponents[i + 1];
        
        newWires.push({
          id: `auto-wire-${i}`,
          from: current.id,
          to: next.id,
          fromX: current.x + 20,
          fromY: current.y,
          toX: next.x - 20,
          toY: next.y
        });
      }
      
      // Connect last component back to first (close the loop)
      if (sortedComponents.length > 2) {
        const first = sortedComponents[0];
        const last = sortedComponents[sortedComponents.length - 1];
        
        newWires.push({
          id: `auto-wire-close`,
          from: last.id,
          to: first.id,
          fromX: last.x + 20,
          fromY: last.y,
          toX: first.x - 20,
          toY: first.y
        });
      }
      
      setWires(newWires);
    }

    // KIRCHHOFF'S LAWS IMPLEMENTATION
    // Step 1: Calculate total voltage (KVL)
    const totalVoltage = batteries.reduce((sum, battery) => sum + battery.value, 0);
    
    // Step 2: Calculate total resistance (series circuit)
    let totalResistance = 0;
    
    // Add resistor resistances
    resistors.forEach(resistor => {
      totalResistance += resistor.value;
    });
    
    // Add bulb resistances (bulbs act as resistors)
    bulbs.forEach(bulb => {
      // Bulb resistance: R = V²/P where V is rated voltage and P is rated power
      // For a typical bulb: 12V, 6W → R = 144/6 = 24Ω
      // But we'll use a more realistic value based on the bulb's value property
      const bulbResistance = Math.max(1, bulb.value / 10); // More realistic resistance
      totalResistance += bulbResistance;
    });
    
    // Add capacitor equivalent resistance (for DC steady state)
    const capacitors = components.filter(component => component.type === 'capacitor');
    const inductors = components.filter(component => component.type === 'inductor');
    
    // For DC circuits: Capacitors = open circuit, Inductors = short circuit
    // But we'll simulate charging/discharging behavior
    const totalCapacitance = capacitors.reduce((sum, cap) => sum + cap.value, 0);
    const totalInductance = inductors.reduce((sum, ind) => sum + ind.value, 0);
    
    // Time-based charging simulation (simplified)
    const currentTime = Date.now() * 0.001; // Convert to seconds
    const timeConstant = totalResistance * totalCapacitance; // RC time constant
    
    // If capacitors are present, simulate charging behavior
    let capacitorResistance = 0;
    if (totalCapacitance > 0 && timeConstant > 0) {
      // Initially capacitors act like short circuits, then gradually become open
      const chargingProgress = Math.min(1, currentTime / (timeConstant * 5)); // 5 time constants to fully charge
      capacitorResistance = (1 - chargingProgress) * 0.001; // Start as short circuit, become open
      
      // Add very high resistance when fully charged (simulate open circuit)
      if (chargingProgress > 0.95) {
        capacitorResistance = 10000; // Very high resistance = open circuit
      }
    }
    
    totalResistance += capacitorResistance;
    
    // Step 3: Apply Ohm's Law (I = V/R)
    const current = totalResistance > 0 ? totalVoltage / totalResistance : 0;
    const power = current * current * totalResistance; // P = I²R
    
    
    // Update simulation state
    setSimulation(prev => ({
      ...prev,
      voltage: totalVoltage,
      current,
      resistance: totalResistance,
      power,
      isRunning: true
    }));

    // BULB BRIGHTNESS CALCULATION (Same as Kirchhoff simulator)
    const newBulbIntensity: Record<string, number> = {};
    
    // Only glow if circuit is ACTIVE (switch ON) AND current flows
    if (current > 0.001 && bulbs.length > 0 && !anyOpenSwitch) {
      bulbs.forEach(bulb => {
        // Power-based brightness (same as Kirchhoff simulator)
        // Brightness based on power: P = I²R
        const bulbResistance = Math.max(1, bulb.value / 10);
        const bulbPower = current * current * bulbResistance;
        const ratedPower = 6; // 6W rated bulb
        
        if (current > 0.01) {
          // Calculate brightness: 0 to 1
          const brightness = Math.min(bulbPower / ratedPower, 1);
          newBulbIntensity[bulb.id] = brightness;
          
          // 🐛 DEBUG: Bulb brightness calculation
          console.log(`💡 Bulb ${bulb.id}:`, {
            resistance: bulbResistance.toFixed(2) + 'Ω',
            power: bulbPower.toFixed(2) + 'W',
            brightness: (brightness * 100).toFixed(0) + '%'
          });
        } else {
          newBulbIntensity[bulb.id] = 0;
        }
      });
    } else {
      // Circuit inactive OR switch open = no glow
      bulbs.forEach(bulb => {
        newBulbIntensity[bulb.id] = 0;
      });
      
      if (bulbs.length > 0) {
        console.log('💡 Bulbs OFF because:', anyOpenSwitch ? 'Switch is OPEN' : current <= 0.001 ? 'No current (I=' + current.toFixed(4) + 'A)' : 'Unknown');
      }
    }
    setBulbIntensity(newBulbIntensity);
    
    // 🐛 DEBUG: Log circuit state for troubleshooting (AFTER bulb calculation)
    console.log('🔌 Circuit Calculation:', {
      batteries: batteries.length,
      totalVoltage: totalVoltage.toFixed(2) + 'V',
      resistors: resistors.length,
      bulbs: bulbs.length,
      switches: switches.length,
      anyOpenSwitch,
      totalResistance: totalResistance.toFixed(2) + 'Ω',
      current: current.toFixed(4) + 'A',
      power: power.toFixed(2) + 'W',
      bulbsGlowing: Object.keys(newBulbIntensity).length
    });

    // UPDATE COMPONENT STATES - Only if values actually changed to prevent infinite loops
    setComponents(prev => {
      let hasChanges = false;
      const updated = prev.map(comp => {
        const updatedComp = { ...comp };
        
        // 💡 BULB: Power-based brightness (same as Kirchhoff simulator)
        if (comp.type === 'bulb') {
          let newBrightness = 0;
          if (current > 0.01 && !anyOpenSwitch) {
            // Power-based brightness: P = I²R
            const bulbResistance = Math.max(1, comp.value / 10);
            const bulbPower = current * current * bulbResistance;
            const ratedPower = 6; // 6W rated bulb
            
            newBrightness = Math.min(bulbPower / ratedPower, 1);
          }
          
          // Only update if brightness changed significantly (avoid infinite re-renders)
          if (Math.abs((comp.brightness || 0) - newBrightness) > 0.001) {
            updatedComp.brightness = newBrightness;
            hasChanges = true;
          }
        }
        
        // 🔌 RESISTOR: Overload detection
        if (comp.type === 'resistor') {
          const maxCurrent = 0.1; // 100mA
          const maxVoltage = 50;  // 50V
          const maxPower = 0.25;  // 0.25W
          
          const resistorCurrent = current;
          const resistorVoltage = current * comp.value;
          const resistorPower = current * current * comp.value;
          
          const newOverloadState = (resistorCurrent > maxCurrent) || 
                                    (resistorVoltage > maxVoltage) || 
                                    (resistorPower > maxPower);
          
          if (comp.isOverloaded !== newOverloadState) {
            updatedComp.isOverloaded = newOverloadState;
            hasChanges = true;
          }
        }
        
        return updatedComp;
      });
      
      // Only update state if something actually changed
      return hasChanges ? updated : prev;
    });
  }, [components, frequencyHz]);

  // Auto-calculate circuit whenever components change
  useEffect(() => {
    calculateCircuit();
  }, [components, wires, frequencyHz]); // Must include components for real-time updates!

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth - 320; // Account for sidebar
      canvas.height = window.innerHeight - 80; // Account for header
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', marginTop: '60px', background: '#040407', color: '#f8fafc', transition: 'background 0.3s ease, color 0.3s ease' }}>
      {/* Sidebar */}
      <div style={{
        width: '320px',
        background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
        padding: '24px',
        overflowY: 'auto',
        borderRight: '1px solid rgba(59, 130, 246, 0.4)',
        boxShadow: '4px 0 16px rgba(15,23,42,0.45)'
      }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#3b82f6', marginBottom: '6px', fontSize: '20px', fontWeight: 700 }}>Circuit Builder</h3>
            <div style={{ fontSize: '12px', color: '#cbd5f5' }}>
              Design circuits, connect components, and analyze real-time values.
            </div>
          </div>
          <div style={{ width: '38px', height: '38px' }} />
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
          {components.some(c => c.type === 'bulb') ? 
            (simulation.current > 0 ? 
              'Bulb connected! Increase voltage and close switches to see it glow brighter.' : 
              'Bulb added. Connect it with wires to see it glow automatically.') :
            'Add a bulb to your circuit! Click "Bulb" then place it on the canvas and connect with wires.'}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600 }}>Tools</h4>
            <button
              onClick={() => store.toggleGrid()}
              style={{
                borderRadius: '10px',
                border: '1px solid rgba(148,163,184,0.3)',
                background: appState.showGrid ? 'rgba(34,197,94,0.15)' : 'transparent',
                color: appState.showGrid ? '#22c55e' : '#a5b4fc',
                padding: '6px 10px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {appState.showGrid ? 'Grid On' : 'Grid Off'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { id: 'select', label: 'Select', icon: '🖱️' },
              { id: 'wire', label: 'Wire', icon: '🔌' },
              { id: 'delete', label: 'Delete', icon: '🗑️' }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedTool(tool.id);
                  setWireDraft(null);
                  setStatusMessage(`Tool switched to ${tool.label}.`);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: selectedTool === tool.id ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(148,163,184,0.2)',
                  background: selectedTool === tool.id ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.12))' : 'transparent',
                  color: selectedTool === tool.id ? '#3b82f6' : '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'transform 0.15s ease, background 0.2s ease'
                }}
              >
                <span style={{ fontSize: '18px' }}>{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Components</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {componentTypes.map(comp => (
              <button
                key={comp.type}
                onClick={() => {
                  setSelectedTool(comp.type);
                  setWireDraft(null);
                  setStatusMessage(`${comp.name} tool selected. Click on canvas to place.`);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: selectedTool === comp.type ? `linear-gradient(135deg, ${comp.color}33, ${comp.color}11)` : 'rgba(148,163,184,0.08)',
                  border: selectedTool === comp.type ? `1px solid ${comp.color}55` : '1px solid rgba(148,163,184,0.15)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '6px',
                  boxShadow: selectedTool === comp.type ? `0 12px 24px ${comp.color}33` : 'none'
                }}
              >
                <span style={{ fontSize: '16px' }}>{comp.name}</span>
                <span style={{ fontSize: '10px', opacity: 0.75, letterSpacing: '0.05em' }}>{comp.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedComponent && isAdjustableComponent(selectedComponent) && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(15,23,42,0.65)',
            border: '1px solid rgba(59,130,246,0.2)'
          }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Selected Component</h4>
            <div style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '10px' }}>{selectedComponent.type.toUpperCase()} · ID: {selectedComponent.id}</div>
            <label style={{ fontSize: '12px', color: '#f8fafc' }}>
              {componentControlMap[selectedComponent.type].label}
              <input
                type="range"
                min={componentControlMap[selectedComponent.type].min}
                max={componentControlMap[selectedComponent.type].max}
                step={componentControlMap[selectedComponent.type].step}
                value={selectedComponent.value}
                onChange={(e) => {
                  const newValue = Number(e.target.value);
                  setComponents(prev => prev.map(component => component.id === selectedComponent.id ? { ...component, value: newValue } : component));
                  setStatusMessage(`${selectedComponent.type} value adjusted to ${newValue}.`);
                }}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </label>
          </div>
        )}
          
        {selectedComponent && selectedComponent.type === 'switch' && (
          <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Switch Info</h4>
            <div style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '8px', padding: '10px', background: 'rgba(15,23,42,0.5)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Status:</span>
                <strong style={{ color: selectedComponent.isOn ? '#22c55e' : '#ef4444' }}>
                  {selectedComponent.isOn ? '● ON' : '○ OFF'}
                </strong>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              💡 <strong>Tip:</strong> Click the switch on the canvas to toggle it ON/OFF and control current flow.
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>RF / AC Settings</h4>
          <label style={{ fontSize: '12px', color: '#f8fafc' }}>
            Frequency: {frequencyHz.toFixed(0)} Hz
            <input
              type="range"
              min="10"
              max="200"
              value={frequencyHz}
              onChange={(e) => setFrequencyHz(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(30,64,175,0.18)',
          border: '1px solid rgba(30,64,175,0.35)',
          color: '#dbeafe',
          marginBottom: '24px',
          fontSize: '12px',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>Tips</div>
          <div>• Use the Wire tool to connect component terminals.</div>
          <div>• Switch tool toggles between open and closed states.</div>
          <div>• Drag components on the grid for precise alignment.</div>
        </div>

        <div>
          <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Circuit Analysis</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(15,23,42,0.65)',
            border: '1px solid rgba(59,130,246,0.2)'
          }}>
            {[{ label: 'Voltage', value: `${simulation.voltage.toFixed(2)} V` },
              { label: 'Current', value: `${simulation.current.toFixed(2)} A` },
              { label: 'Resistance', value: `${simulation.resistance.toFixed(2)} Ω` },
              { label: 'Power', value: `${simulation.power.toFixed(2)} W` },
              { label: 'Reactance', value: `${simulation.reactance.toFixed(2)} Ω` },
              { label: 'Power Factor', value: `${simulation.powerFactor.toFixed(2)}` }].map(stat => (
              <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{stat.label}</span>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>{stat.value}</span>
              </div>
            ))}
          </div>
          
        </div>
      </div>

      {/* Main Canvas */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 80% 30%, rgba(139,92,246,0.2), transparent 50%), radial-gradient(circle at 50% 80%, rgba(14,165,233,0.18), transparent 50%)',
          pointerEvents: 'none',
          transition: 'background 0.3s ease'
        }} />

        <div style={{ flex: 1, position: 'relative', background: 'rgba(2,6,23,0.92)', borderLeft: '1px solid rgba(30, 64, 175, 0.3)' }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
              width: '100%',
              height: '100%',
              cursor: selectedTool === 'select' ? 'default' : selectedTool === 'wire' ? 'crosshair' : 'cell',
              position: 'relative',
              zIndex: 2
            }}
          />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '6px 10px',
              borderRadius: '10px',
              background: 'rgba(59,130,246,0.15)',
              color: '#3b82f6',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              {selectedTool === 'select' ? 'Select mode' : selectedTool === 'wire' ? 'Wire mode: click two points to connect' : 'Delete mode: click component or wire to remove'}
            </div>
            {pointerPosition && (
              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                Cursor: ({pointerPosition.x}, {pointerPosition.y})
              </div>
            )}
          </div>

          <div style={{
            fontSize: '11px',
            color: '#22c55e',
            fontFamily: 'monospace'
          }}>
            {simulation.current > 0 ? 'Circuit Active' : 'Circuit Inactive'}
          </div>
        </div>

        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '12px' }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#f1f5f9',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 12px 24px rgba(15,23,42,0.25)'
          }}>
            <span>⚡ Ultra-Lightweight Mode</span>
            <span>|</span>
            <span>Components: {components.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightweightCircuitSimulator;
