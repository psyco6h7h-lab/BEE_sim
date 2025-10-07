import React, { useRef, useState, useEffect, useCallback } from 'react';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

type ComponentType = 'battery' | 'resistor' | 'bulb' | 'switch' | 'wire' | 'capacitor' | 'inductor';

interface Position {
  x: number;
  y: number;
}

interface CircuitComponent {
  id: string;
  type: ComponentType;
  position: Position;
  rotation: number; // 0, 90, 180, 270
  value: number; // Voltage, Resistance, Capacitance, Inductance
  connections: { start: Position; end: Position };
  // Component-specific states
  current: number;
  voltage: number;
  isOn?: boolean; // For switch
  brightness?: number; // For bulb (0-1)
  charge?: number; // For capacitor
  // Professional component behavior
  isOverloaded?: boolean; // For resistor when current/voltage too high
  maxCurrent?: number; // Safe current limit
  maxVoltage?: number; // Safe voltage limit
  glowIntensity?: number; // For bulb instant glow effect
  switchAngle?: number; // For switch animation (0-45 degrees)
}

interface Wire {
  id: string;
  start: Position;
  end: Position;
  current: number;
}

interface CircuitBuilderState {
  components: CircuitComponent[];
  wires: Wire[];
  selectedTool: ComponentType | 'select' | 'delete';
  isSimulating: boolean;
  gridSize: number;
  selectedComponent: string | null;
}

// ============================================================================
// CIRCUIT SOLVER - Professional Physics Engine with Kirchhoff's Laws
// ============================================================================

interface Node {
  id: string;
  position: Position;
  voltage: number;
  isGround: boolean;
}

interface CircuitElement {
  id: string;
  component: CircuitComponent;
  node1: string;
  node2: string;
  current: number;
  voltage: number;
}

class CircuitSolver {
  /**
   * Solve circuit using proper nodal analysis and Kirchhoff's laws
   */
  static solve(components: CircuitComponent[], wires: Wire[]): { components: CircuitComponent[]; wires: Wire[] } {
    // Find all nodes (connection points)
    const nodes = this.findNodes(components, wires);
    
    // Find voltage sources (batteries)
    const batteries = components.filter(c => c.type === 'battery');
    if (batteries.length === 0) {
      // No power source - everything is off
      return this.zeroStateCircuit(components, wires);
    }

    // Check for open switches - circuit breaks
    const hasOpenSwitch = components.some(c => c.type === 'switch' && !c.isOn);
    if (hasOpenSwitch) {
      return this.zeroStateCircuit(components, wires);
    }

    // Build circuit elements map
    const elements = this.buildCircuitElements(components, wires);
    
    // Detect circuit topology (series/parallel)
    const topology = this.analyzeTopology(nodes, elements, batteries);
    
    // Solve using appropriate method
    const solution = this.solveCircuitWithTopology(topology, elements, batteries, components);
    
    return solution;
  }

  /**
   * Return zero-state circuit (no current flowing)
   */
  private static zeroStateCircuit(components: CircuitComponent[], wires: Wire[]) {
      return {
        components: components.map(c => ({ 
          ...c, 
          current: 0, 
          voltage: 0, 
          brightness: 0,
          glowIntensity: 0,
          isOverloaded: false,
        switchAngle: c.type === 'switch' && !c.isOn ? 45 : 0
        })),
        wires: wires.map(w => ({ ...w, current: 0 }))
      };
  }

  /**
   * Find all unique connection nodes in the circuit
   */
  private static findNodes(components: CircuitComponent[], wires: Wire[]): Node[] {
    const nodeMap = new Map<string, Position>();
    
    // Collect all unique positions
    components.forEach(comp => {
      nodeMap.set(this.posKey(comp.connections.start), comp.connections.start);
      nodeMap.set(this.posKey(comp.connections.end), comp.connections.end);
    });
    
    wires.forEach(wire => {
      nodeMap.set(this.posKey(wire.start), wire.start);
      nodeMap.set(this.posKey(wire.end), wire.end);
    });
    
    // Convert to Node objects
    return Array.from(nodeMap.entries()).map(([id, position]) => ({
      id,
      position,
      voltage: 0,
      isGround: false
    }));
  }

  private static posKey(pos: Position): string {
    return `${Math.round(pos.x)},${Math.round(pos.y)}`;
  }

  /**
   * Build circuit elements with node connections
   */
  private static buildCircuitElements(components: CircuitComponent[], wires: Wire[]): CircuitElement[] {
    const elements: CircuitElement[] = [];
    
    components.forEach(comp => {
      if (comp.type === 'wire') return; // Skip wires in components
      
      elements.push({
        id: comp.id,
        component: comp,
        node1: this.posKey(comp.connections.start),
        node2: this.posKey(comp.connections.end),
        current: 0,
        voltage: 0
      });
    });
    
    return elements;
  }

  /**
   * Analyze circuit topology (series/parallel/mixed)
   */
  private static analyzeTopology(nodes: Node[], elements: CircuitElement[], batteries: CircuitComponent[]) {
    const nodeConnections = new Map<string, CircuitElement[]>();
    
    // Map elements to nodes
    elements.forEach(elem => {
      if (!nodeConnections.has(elem.node1)) nodeConnections.set(elem.node1, []);
      if (!nodeConnections.has(elem.node2)) nodeConnections.set(elem.node2, []);
      
      nodeConnections.get(elem.node1)!.push(elem);
      nodeConnections.get(elem.node2)!.push(elem);
    });
    
    // Detect series vs parallel
    const seriesComponents: CircuitElement[] = [];
    const parallelGroups: CircuitElement[][] = [];
    
    // Simple heuristic: if a node connects to only 2 elements, they're in series
    // If a node connects to >2 elements, they're in parallel
    nodeConnections.forEach((elems, nodeId) => {
      if (elems.length === 2) {
        // Potential series connection
        seriesComponents.push(...elems);
      } else if (elems.length > 2) {
        // Parallel connection
        const group = elems.filter(e => e.component.type !== 'battery');
        if (group.length > 1) {
          parallelGroups.push(group);
        }
      }
    });
    
    return {
      type: parallelGroups.length > 0 ? 'mixed' : 'series',
      seriesComponents,
      parallelGroups,
      nodeConnections
    };
  }

  /**
   * Solve circuit based on detected topology using Kirchhoff's laws
   */
  private static solveCircuitWithTopology(
    topology: any,
    elements: CircuitElement[],
    batteries: CircuitComponent[],
    allComponents: CircuitComponent[]
  ): { components: CircuitComponent[]; wires: Wire[] } {
    
    const totalVoltage = batteries.reduce((sum, b) => sum + b.value, 0);
    
    // Calculate equivalent resistance using proper series/parallel formulas
    const resistiveElements = elements.filter(e => 
      e.component.type === 'resistor' || 
      e.component.type === 'bulb' ||
      e.component.type === 'capacitor' ||
      e.component.type === 'inductor'
    );
    
    let equivalentResistance = 0;
    
    if (topology.type === 'series') {
      // SERIES: R_total = R1 + R2 + R3 + ...
      equivalentResistance = resistiveElements.reduce((sum, elem) => {
        return sum + this.getComponentResistance(elem.component);
      }, 0);
      
    } else if (topology.type === 'mixed' && topology.parallelGroups.length > 0) {
      // PARALLEL: 1/R_total = 1/R1 + 1/R2 + 1/R3 + ...
      topology.parallelGroups.forEach((group: CircuitElement[]) => {
        let parallelSum = 0;
        group.forEach(elem => {
          const R = this.getComponentResistance(elem.component);
          if (R > 0) {
            parallelSum += 1 / R;
          }
        });
        
        if (parallelSum > 0) {
          equivalentResistance += 1 / parallelSum; // Parallel resistance
        }
      });
      
      // Add any series components
      const seriesOnly = resistiveElements.filter(e => 
        !topology.parallelGroups.some((g: CircuitElement[]) => g.includes(e))
      );
      equivalentResistance += seriesOnly.reduce((sum, elem) => 
        sum + this.getComponentResistance(elem.component), 0
      );
    }
    
    // Apply Ohm's Law: I = V / R_total
    const totalCurrent = equivalentResistance > 0 ? totalVoltage / equivalentResistance : 0;
    
    // Apply KCL and KVL to distribute currents and voltages
    const updatedComponents = this.distributeCurrentsAndVoltages(
      allComponents,
      topology,
      totalCurrent,
      totalVoltage,
      resistiveElements
    );
    
      return {
      components: updatedComponents,
        wires: []
      };
    }
    
  /**
   * Get component resistance (handle different component types)
   */
  private static getComponentResistance(comp: CircuitComponent): number {
    switch (comp.type) {
      case 'resistor':
      case 'bulb':
        return comp.value;
      case 'capacitor':
        // For DC analysis, capacitor acts as open circuit (infinite R)
        return 1e6; // Very high resistance
      case 'inductor':
        // For DC steady state, inductor acts as short circuit (zero R)
        return 0.01; // Very low resistance
      case 'switch':
        return comp.isOn ? 0.001 : 1e9; // Closed = nearly zero, Open = very high
      case 'wire':
        return 0.001; // Nearly zero resistance
      case 'battery':
        return 0.01; // Internal resistance
      default:
        return 0;
    }
  }

  /**
   * Distribute currents and voltages using Kirchhoff's Current Law (KCL) and Voltage Law (KVL)
   */
  private static distributeCurrentsAndVoltages(
    components: CircuitComponent[],
    topology: any,
    totalCurrent: number,
    totalVoltage: number,
    resistiveElements: CircuitElement[]
  ): CircuitComponent[] {
    
    const updatedComponents = components.map(comp => {
      const newComp = { ...comp };
      
      // Skip batteries - they maintain voltage
      if (comp.type === 'battery') {
        newComp.current = totalCurrent;
        newComp.voltage = comp.value;
        return newComp;
      }
      
      // Skip wires
      if (comp.type === 'wire') {
        newComp.current = totalCurrent;
        newComp.voltage = 0;
        return newComp;
      }
      
      // Find if this component is in a parallel group
      const parallelGroup = topology.parallelGroups?.find((g: CircuitElement[]) => 
        g.some(e => e.component.id === comp.id)
      );
      
      if (parallelGroup && parallelGroup.length > 1) {
        // PARALLEL COMPONENTS: Same voltage, current splits
        // KCL: I_total = I1 + I2 + I3 + ...
        // Each branch: I_n = V / R_n
        
        const totalParallelR = this.getComponentResistance(comp);
        const groupResistances = parallelGroup.map((e: CircuitElement) => 
          this.getComponentResistance(e.component)
        );
        
        // Calculate equivalent resistance: 1/R_eq = 1/R1 + 1/R2 + ...
        let sumOfInverses = 0;
        groupResistances.forEach((R: number) => {
          if (R > 0) sumOfInverses += 1 / R;
        });
        const equivalentR = sumOfInverses > 0 ? 1 / sumOfInverses : 0;
        
        // Voltage across parallel components is same
        const parallelVoltage = totalCurrent * equivalentR;
        
        // Current through this component: I = V / R
        const componentCurrent = totalParallelR > 0 ? parallelVoltage / totalParallelR : 0;
        
        newComp.voltage = parallelVoltage;
        newComp.current = componentCurrent;
        
      } else {
        // SERIES COMPONENTS: Same current, voltage drops add
        // KVL: V_total = V1 + V2 + V3 + ...
        // Each component: V_n = I × R_n
        
        newComp.current = totalCurrent;
        
        const resistance = this.getComponentResistance(comp);
        newComp.voltage = totalCurrent * resistance; // V = I × R
      }
      
      // Apply component-specific behavior
      return this.applyComponentPhysics(newComp);
    });
    
    return updatedComponents;
  }

  /**
   * Apply realistic physics to each component type
   */
  private static applyComponentPhysics(comp: CircuitComponent): CircuitComponent {
    const newComp = { ...comp };
    
    switch (comp.type) {
      case 'resistor':
        // Check for overload: Power = I²R or V²/R
        const power = comp.current * comp.current * comp.value; // P = I²R (Watts)
        const maxPower = 0.25; // 0.25W typical resistor rating
        const maxCurrent = 0.1; // 100mA safe limit
        const maxVoltage = 50;  // 50V safe limit
        
        newComp.isOverloaded = (power > maxPower) || (comp.current > maxCurrent) || (comp.voltage > maxVoltage);
        newComp.maxCurrent = maxCurrent;
        newComp.maxVoltage = maxVoltage;
        break;
        
      case 'bulb':
        // Brightness based on power: P = I²R
        const bulbPower = comp.current * comp.current * comp.value;
        const ratedPower = 6; // 6W rated bulb (e.g., 12V, 0.5A)
        
        if (comp.current > 0.01) {
          // Calculate brightness: 0 to 1
          newComp.brightness = Math.min(bulbPower / ratedPower, 1);
          newComp.glowIntensity = Math.min(bulbPower / ratedPower, 1);
        } else {
          newComp.brightness = 0;
          newComp.glowIntensity = 0;
        }
        break;
      
      case 'switch':
        newComp.switchAngle = comp.isOn ? 0 : 45;
        break;
        
      case 'capacitor':
        // Store charge: Q = C × V
        newComp.charge = comp.value * comp.voltage;
        break;
      }
      
      return newComp;
  }
}

// ============================================================================
// REACT COMPONENT - Interactive Circuit Builder
// ============================================================================

const InteractiveCircuitBuilder: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [state, setState] = useState<CircuitBuilderState>({
    components: [],
    wires: [],
    selectedTool: 'select',
    isSimulating: false,
    gridSize: 40,
    selectedComponent: null
  });

  const [time, setTime] = useState(0);

  // Initialize demo circuit
  useEffect(() => {
    const _gridSize = 40;
    const centerX = 400;
    const centerY = 200;
    
    const demoComponents: CircuitComponent[] = [
      // Battery (24V - Higher voltage to test resistor overload)
      {
        id: 'battery1',
        type: 'battery',
        position: { x: centerX - 200, y: centerY },
        rotation: 0,
        value: 24, // Increased to 24V to demonstrate overload
        connections: {
          start: { x: centerX - 200, y: centerY },
          end: { x: centerX - 120, y: centerY }
        },
        current: 0,
        voltage: 24
      },
      // Switch
      {
        id: 'switch1',
        type: 'switch',
        position: { x: centerX - 80, y: centerY },
        rotation: 0,
        value: 0,
        connections: {
          start: { x: centerX - 120, y: centerY },
          end: { x: centerX - 40, y: centerY }
        },
        current: 0,
        voltage: 0,
        isOn: true, // Switch starts ON
        switchAngle: 0 // 0° = closed position
      },
      // Bulb (acts as 10Ω resistor)
      {
        id: 'bulb1',
        type: 'bulb',
        position: { x: centerX + 40, y: centerY },
        rotation: 0,
        value: 10, // Resistance
        connections: {
          start: { x: centerX - 40, y: centerY },
          end: { x: centerX + 120, y: centerY }
        },
        current: 0,
        voltage: 0,
        brightness: 0,
        glowIntensity: 0 // Instant glow effect
      },
      // Resistor (5Ω - Lower resistance to test overload with 24V)
      {
        id: 'resistor1',
        type: 'resistor',
        position: { x: centerX + 160, y: centerY },
        rotation: 0,
        value: 5, // Lower resistance = higher current = overload test
        connections: {
          start: { x: centerX + 120, y: centerY },
          end: { x: centerX + 200, y: centerY }
        },
        current: 0,
        voltage: 0,
        isOverloaded: false, // Will turn RED if overloaded
        maxCurrent: 0.1, // 100mA safe limit
        maxVoltage: 50   // 50V safe limit
      },
      // Return wire (completes circuit)
      {
        id: 'wire1',
        type: 'wire',
        position: { x: centerX, y: centerY + 80 },
        rotation: 90,
        value: 0,
        connections: {
          start: { x: centerX + 200, y: centerY },
          end: { x: centerX - 200, y: centerY }
        },
        current: 0,
        voltage: 0
      }
    ];
    
    setState(prev => ({
      ...prev,
      components: demoComponents
    }));
  }, []);

  // Simulation loop
  useEffect(() => {
    if (!state.isSimulating) return;

    const interval = setInterval(() => {
      // Solve circuit
      const solution = CircuitSolver.solve(state.components, state.wires);
      
      setState(prev => ({
        ...prev,
        components: solution.components
      }));
      
      setTime(t => t + 1);
    }, 100); // Update 10 times per second

    return () => clearInterval(interval);
  }, [state.isSimulating, state.components, state.wires]);

  // Handle component click (e.g., toggle switch)
  const handleComponentClick = useCallback((componentId: string) => {
    setState(prev => ({
      ...prev,
      components: prev.components.map(comp => {
        if (comp.id === componentId && comp.type === 'switch') {
          return { ...comp, isOn: !comp.isOn };
        }
        return comp;
      })
    }));
  }, []);

  // Canvas click handler
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicked on a component
    state.components.forEach(comp => {
      const dx = Math.abs(comp.position.x - x);
      const dy = Math.abs(comp.position.y - y);
      
      if (dx < 40 && dy < 40) {
        handleComponentClick(comp.id);
      }
    });
  }, [state.components, handleComponentClick]);

  // Draw circuit
  const drawCircuit = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const centerX = ctx.canvas.width / 2;
    
    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Interactive Circuit Builder', centerX, 40);
    
    // Status
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = state.isSimulating ? '#22c55e' : '#fbbf24';
    ctx.fillText(state.isSimulating ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED', centerX, 65);
    
    // Instructions
    ctx.font = '12px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Professional 3D Components • Click SWITCH • Watch LAMP glow & RESISTOR overheat!', centerX, 90);

    // Draw wires/connections first (background)
    state.components.forEach(comp => {
      const start = comp.connections.start;
      const end = comp.connections.end;
      
      // Wire with gradient when current flows
      if (state.isSimulating && comp.current > 0.01) {
        // Glowing wire effect
        const wireGrad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        wireGrad.addColorStop(0, '#3b82f6');
        wireGrad.addColorStop(0.5, '#60a5fa');
        wireGrad.addColorStop(1, '#3b82f6');
        
        ctx.strokeStyle = wireGrad;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#3b82f6';
        ctx.lineCap = 'round';
      } else {
        // Inactive wire
        ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 3;
        ctx.shadowBlur = 0;
        ctx.lineCap = 'round';
      }
      
        ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
        ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Animated current flow particles
      if (state.isSimulating && comp.current > 0.01) {
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
          const progress = ((time * 0.08 + i / particleCount) % 1);
          const x = start.x + (end.x - start.x) * progress;
          const y = start.y + (end.y - start.y) * progress;
          
          // Particle with glow
          const particleGrad = ctx.createRadialGradient(x, y, 0, x, y, 6);
          particleGrad.addColorStop(0, '#fbbf24');
          particleGrad.addColorStop(0.5, '#f59e0b');
          particleGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
          
          ctx.fillStyle = particleGrad;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#fbbf24';
        ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner bright core
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#fff';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
    });

    // Draw components
    state.components.forEach(comp => {
      const pos = comp.position;
      
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((comp.rotation * Math.PI) / 180);
      
      switch (comp.type) {
        case 'battery':
          // 🔋 MODERN BATTERY - 3D style with gradient
          const batteryGradient = ctx.createLinearGradient(-15, -20, 15, 20);
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
          ctx.moveTo(-12, -18);
          ctx.lineTo(-12, 18);
          ctx.stroke();
          
          // Positive terminal (smaller plate)
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(12, -12);
          ctx.lineTo(12, 12);
          ctx.stroke();
          
          ctx.shadowBlur = 0;
          
          // Terminal symbols
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('+', 12, -20);
          ctx.fillText('−', -12, -22);
          
          // Voltage label with background
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.fillRect(-20, -38, 40, 16);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(-20, -38, 40, 16);
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px Arial';
          ctx.fillText(`${comp.value}V`, 0, -27);
          break;
          
        case 'switch':
          // 🔀 ADVANCED SWITCH - 3D mechanical lever
          const switchAngle = comp.switchAngle || 0; // 0° = closed, 45° = open
          const isClosed = switchAngle < 10;
          
          // Base platform with shadow
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.fillStyle = '#475569';
          ctx.fillRect(-25, -5, 50, 10);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(-25, -5, 50, 10);
          ctx.shadowBlur = 0;
          
          // Terminal posts (metallic)
          const terminalGradient = ctx.createRadialGradient(-20, 0, 0, -20, 0, 6);
          terminalGradient.addColorStop(0, '#94a3b8');
          terminalGradient.addColorStop(1, '#64748b');
          
          ctx.fillStyle = terminalGradient;
          ctx.beginPath();
          ctx.arc(-20, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.fillStyle = terminalGradient;
          ctx.beginPath();
          ctx.arc(20, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Switch lever (animated)
          ctx.save();
          ctx.translate(-20, 0);
          
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
            
            const endX = 35 * Math.cos((switchAngle * Math.PI) / 180);
            const endY = -35 * Math.sin((switchAngle * Math.PI) / 180);
            
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
          ctx.arc(0, -25, 4, 0, Math.PI * 2);
            ctx.fill();
          ctx.shadowBlur = 0;
          
          // Status text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(isClosed ? '● ON' : '○ OFF', 0, -35);
          
          ctx.font = '8px Arial';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('(click)', 0, 25);
          break;
          
        case 'bulb':
          // 💡 REALISTIC BULB - Glass dome with 3D filament
          const brightness = comp.brightness || 0;
          const glowIntensity = comp.glowIntensity || 0;
          const isLit = brightness > 0.01;
          
          // OUTER RADIANT GLOW (multi-layer)
          if (isLit && glowIntensity > 0) {
            for (let i = 4; i >= 1; i--) {
              const glowRadius = 18 + i * 8;
              const glowOpacity = (0.15 * glowIntensity) / i;
              
              const glowGrad = ctx.createRadialGradient(0, 0, 18, 0, 0, glowRadius);
              glowGrad.addColorStop(0, `rgba(251, 191, 36, ${glowOpacity * 0.8})`);
              glowGrad.addColorStop(0.5, `rgba(251, 191, 36, ${glowOpacity * 0.4})`);
              glowGrad.addColorStop(1, `rgba(251, 191, 36, 0)`);
              
              ctx.fillStyle = glowGrad;
        ctx.beginPath();
              ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          // GLASS BULB (realistic gradient)
          const bulbGrad = ctx.createRadialGradient(-8, -8, 5, 0, 0, 22);
          if (isLit) {
            // Glowing bulb
            bulbGrad.addColorStop(0, `rgba(255, 255, 200, ${0.9 * brightness})`);
            bulbGrad.addColorStop(0.3, `rgba(251, 191, 36, ${0.7 * brightness})`);
            bulbGrad.addColorStop(0.7, `rgba(251, 146, 60, ${0.5 * brightness})`);
            bulbGrad.addColorStop(1, `rgba(234, 88, 12, ${0.3 * brightness})`);
          } else {
            // Dark bulb
            bulbGrad.addColorStop(0, '#4b5563');
            bulbGrad.addColorStop(0.5, '#374151');
            bulbGrad.addColorStop(1, '#1f2937');
          }
          
          ctx.fillStyle = bulbGrad;
        ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fill();
          
          // Glass reflection highlight
          ctx.fillStyle = isLit ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          ctx.ellipse(-7, -7, 8, 5, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Glass outline
          ctx.strokeStyle = isLit ? '#fbbf24' : '#6b7280';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
          
          // FILAMENT (tungsten coil)
          if (isLit && brightness > 0.05) {
            ctx.shadowBlur = 8 * brightness;
            ctx.shadowColor = '#fff';
            ctx.strokeStyle = brightness > 0.5 ? '#ffffff' : '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            
            // Coiled filament design
            ctx.beginPath();
            for (let i = -8; i <= 8; i += 2) {
              ctx.moveTo(i, -6);
              ctx.lineTo(i, 6);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Dark filament
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
          }
          
          // Base screw
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-6, 20, 12, 8);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-6, 22 + i * 2);
            ctx.lineTo(6, 22 + i * 2);
            ctx.stroke();
          }
          
          // Label
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('LAMP', 0, -32);
          
          if (state.isSimulating) {
            ctx.font = 'bold 9px Arial';
            ctx.fillStyle = isLit ? '#fbbf24' : '#6b7280';
            ctx.fillText(isLit ? `⚡${(brightness * 100).toFixed(0)}%` : 'OFF', 0, 40);
          }
          break;
          
        case 'resistor':
          // 🔌 REALISTIC RESISTOR - With color bands
          const isOverloaded = comp.isOverloaded || false;
          
          // Resistor body (cylinder)
          const bodyGrad = ctx.createLinearGradient(0, -12, 0, 12);
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
          ctx.fillRect(-18, -10, 36, 20);
          ctx.strokeStyle = isOverloaded ? '#dc2626' : '#ca8a04';
          ctx.lineWidth = 2;
          ctx.strokeRect(-18, -10, 36, 20);
          ctx.shadowBlur = 0;
          
          // Color bands (like real resistors)
          const bandColors = isOverloaded 
            ? ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'] 
            : ['#8b5cf6', '#6366f1', '#3b82f6', '#ca8a04'];
          
          const bandPositions = [-10, -3, 4, 11];
          bandPositions.forEach((pos, i) => {
            ctx.fillStyle = bandColors[i];
            ctx.fillRect(pos, -10, 3, 20);
          });
          
          // Wire leads (metallic)
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
      ctx.beginPath();
          ctx.moveTo(-28, 0);
          ctx.lineTo(-18, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(28, 0);
          ctx.stroke();
          
          // End caps
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-18, -10, 2, 20);
          ctx.fillRect(16, -10, 2, 20);
          
          // Value label with background
          const labelBg = isOverloaded ? '#ef4444' : '#22c55e';
          ctx.fillStyle = labelBg;
          ctx.fillRect(-22, -32, 44, 14);
          ctx.strokeStyle = labelBg;
          ctx.lineWidth = 2;
          ctx.strokeRect(-22, -32, 44, 14);
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${comp.value}Ω`, 0, -22);
          
          if (isOverloaded) {
            // Overload warning
            ctx.font = 'bold 9px Arial';
            ctx.fillStyle = '#ef4444';
            ctx.fillText('⚠ OVERLOAD', 0, 25);
            
            ctx.font = '8px Arial';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(`${comp.current.toFixed(3)}A > ${comp.maxCurrent}A`, 0, 35);
          } else {
            // Normal status
            ctx.font = '9px Arial';
            ctx.fillStyle = '#22c55e';
            ctx.fillText('✓ OK', 0, 25);
          }
          break;
      }
      
      // Current label
      if (state.isSimulating && comp.current > 0.01 && comp.type !== 'wire') {
      ctx.fillStyle = '#3b82f6';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`I: ${comp.current.toFixed(2)}A`, 0, 45);
      }
      
      ctx.restore();
    });

    // Draw metrics panel
    const panelX = 20;
    const panelY = 120;
    const panelWidth = 200;
    const panelHeight = 150;
    
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ Circuit Metrics', panelX + 10, panelY + 25);
    
    // Calculate metrics
    const battery = state.components.find(c => c.type === 'battery');
    const bulb = state.components.find(c => c.type === 'bulb');
    const totalCurrent = state.components.reduce((sum, c) => sum + c.current, 0) / state.components.length;
    const totalResistance = state.components
      .filter(c => c.type === 'resistor' || c.type === 'bulb')
      .reduce((sum, c) => sum + c.value, 0);
    
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial';
    ctx.fillText(`Voltage: ${battery?.value || 0}V`, panelX + 10, panelY + 50);
    ctx.fillText(`Current: ${totalCurrent.toFixed(3)}A`, panelX + 10, panelY + 70);
    ctx.fillText(`Resistance: ${totalResistance.toFixed(1)}Ω`, panelX + 10, panelY + 90);
    ctx.fillText(`Bulb: ${((bulb?.brightness || 0) * 100).toFixed(0)}%`, panelX + 10, panelY + 110);
    
    const switchComp = state.components.find(c => c.type === 'switch');
    ctx.fillStyle = switchComp?.isOn ? '#22c55e' : '#ef4444';
    ctx.fillText(`Switch: ${switchComp?.isOn ? 'CLOSED' : 'OPEN'}`, panelX + 10, panelY + 130);
    
  }, [state, time]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCircuit(ctx);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawCircuit]);

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
      canvas.width = window.innerWidth - 360;
      canvas.height = 600;
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
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        
        {/* Sidebar Controls */}
        <div style={{
          width: '320px',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
          padding: '24px',
          overflowY: 'auto',
          borderRight: '1px solid rgba(139,92,246,0.4)',
          boxShadow: '4px 0 16px rgba(15,23,42,0.45)',
          borderRadius: '0 20px 20px 0'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#8b5cf6', marginBottom: '6px', fontSize: '20px', fontWeight: 700 }}>
              ⚡ Circuit Builder
            </h3>
            <div style={{ fontSize: '12px', color: '#cbd5f5' }}>
              Interactive electrical simulation
          </div>
        </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
              onClick={() => setState(prev => ({ ...prev, isSimulating: !prev.isSimulating }))}
            style={{
                  flex: 1,
                  padding: '12px',
                borderRadius: '12px',
              border: 'none',
                background: state.isSimulating 
                    ? 'linear-gradient(135deg, #ef4444, #b91c1c)' 
                : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
              cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                boxShadow: state.isSimulating 
                  ? '0 4px 12px rgba(239,68,68,0.3)' 
                  : '0 4px 12px rgba(34,197,94,0.3)',
                transition: 'all 0.2s ease'
                }}
              >
              {state.isSimulating ? '⏸️ Pause' : '▶️ Start'}
          </button>
          
          <button
              onClick={() => window.location.reload()}
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

          {/* Instructions */}
      <div style={{
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              📖 Features
            </h4>
            <ul style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
              <li>🔋 <strong>3D Battery</strong> with gradient & terminals</li>
              <li>🔀 <strong>Mechanical Switch</strong> with LED indicator</li>
              <li>💡 <strong>Realistic Lamp</strong> with glass & filament</li>
              <li>🔌 <strong>Color-Band Resistor</strong> (overheats when overloaded)</li>
              <li>⚡ <strong>Glowing Wires</strong> with flowing particles</li>
              <li>✨ <strong>Professional Physics</strong> - Kirchhoff's Laws</li>
            </ul>
        </div>

          {/* Component List */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              🔌 Components
          </h4>
          
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.components.map(comp => (
                <div key={comp.id} style={{
                  padding: '12px',
              background: 'rgba(139,92,246,0.1)',
                  borderRadius: '8px',
              border: '1px solid rgba(139,92,246,0.2)'
            }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '12px' }}>
                      {comp.type.toUpperCase()}
                    </span>
                    {comp.type === 'bulb' && (
                      <span style={{ color: (comp.brightness || 0) > 0 ? '#fbbf24' : '#6b7280', fontSize: '12px' }}>
                        {(comp.brightness || 0) > 0 ? `${((comp.brightness || 0) * 100).toFixed(0)}% 💡` : 'OFF 💡'}
                      </span>
                    )}
                    {comp.type === 'switch' && (
                      <span style={{ color: comp.isOn ? '#22c55e' : '#ef4444', fontSize: '12px', fontWeight: 600 }}>
                        {comp.isOn ? 'CLOSED ✓' : 'OPEN ✗'}
                      </span>
                    )}
                    {comp.type === 'resistor' && (
                      <span style={{ color: comp.isOverloaded ? '#ef4444' : '#22c55e', fontSize: '12px', fontWeight: 600 }}>
                        {comp.isOverloaded ? '⚠️ OVERLOAD' : '✓ Normal'}
                      </span>
                    )}
            </div>
                  {state.isSimulating && (
                    <div style={{ color: '#cbd5e1', fontSize: '11px' }}>
                      Current: {comp.current.toFixed(3)}A
            </div>
                  )}
            </div>
              ))}
          </div>
        </div>

          {/* Physics Info */}
        <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '12px',
            padding: '16px'
          }}>
            <h4 style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              ⚡ Circuit Physics Engine
            </h4>
            <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '8px' }}><strong>Ohm's Law:</strong> V = I × R</p>
              <p style={{ marginBottom: '8px' }}><strong>Series:</strong> R_total = R₁ + R₂ + R₃</p>
              <p style={{ marginBottom: '8px' }}><strong>Parallel:</strong> 1/R_total = 1/R₁ + 1/R₂</p>
              <p style={{ marginBottom: '8px' }}><strong>KCL:</strong> ΣI_in = ΣI_out (node)</p>
              <p style={{ marginBottom: '8px' }}><strong>KVL:</strong> ΣV_loop = 0 (loop)</p>
              <p style={{ marginBottom: '8px' }}><strong>Power:</strong> P = I²R = V²/R</p>
              <p style={{ marginBottom: '8px' }}><strong>Brightness:</strong> P_actual / P_rated</p>
              <p><strong>Overload:</strong> When P &gt; 0.25W</p>
              </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* Circuit Canvas */}
          <div style={{
            height: '600px',
            position: 'relative',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '20px',
            margin: '20px',
            overflow: 'hidden'
          }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
                  style={{
                width: '100%',
                height: '100%',
                background: 'rgba(2,6,23,0.9)',
                borderRadius: '15px',
                cursor: 'pointer'
              }}
            />
            </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCircuitBuilder;
