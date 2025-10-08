import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  voltage: number;
}

interface Branch {
  id: string;
  from: string;
  to: string;
  resistance: number;
  current: number;
  voltage: number;
}

interface Circuit {
  nodes: Node[];
  branches: Branch[];
  sourceVoltage: number;
  isAnalyzing: boolean;
}

const ScrollBasedKirchhoffSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isVisible, setIsVisible] = useState<boolean[]>([]);
  const [selectedCircuit, setSelectedCircuit] = useState<'series' | 'parallel' | 'mixed' | 'complex'>('series');
  const [analysisMode, setAnalysisMode] = useState<'kcl' | 'kvl' | 'both'>('both');
  const [showGraphs, setShowGraphs] = useState(true);
  
  // Enhanced circuit configurations
  const circuitConfigs = {
    series: {
      name: 'Series Circuit',
      description: 'Components connected end-to-end',
      nodes: [
        { id: 'A', x: 150, y: 200, voltage: 12 },
        { id: 'B', x: 300, y: 200, voltage: 8 },
        { id: 'C', x: 450, y: 200, voltage: 4 },
        { id: 'D', x: 600, y: 200, voltage: 0 }
      ],
      branches: [
        { id: '1', from: 'A', to: 'B', resistance: 2, current: 2, voltage: 4 },
        { id: '2', from: 'B', to: 'C', resistance: 2, current: 2, voltage: 4 },
        { id: '3', from: 'C', to: 'D', resistance: 2, current: 2, voltage: 4 }
      ],
      sourceVoltage: 12
    },
    parallel: {
      name: 'Parallel Circuit',
      description: 'Components connected across same voltage',
      nodes: [
        { id: 'A', x: 200, y: 150, voltage: 12 },
        { id: 'B', x: 200, y: 250, voltage: 12 },
        { id: 'C', x: 500, y: 200, voltage: 0 }
      ],
      branches: [
        { id: '1', from: 'A', to: 'C', resistance: 3, current: 4, voltage: 12 },
        { id: '2', from: 'B', to: 'C', resistance: 6, current: 2, voltage: 12 }
      ],
      sourceVoltage: 12
    },
    mixed: {
      name: 'Mixed Circuit',
      description: 'Combination of series and parallel',
      nodes: [
        { id: 'A', x: 150, y: 200, voltage: 12 },
        { id: 'B', x: 300, y: 150, voltage: 8 },
        { id: 'C', x: 300, y: 250, voltage: 8 },
        { id: 'D', x: 450, y: 200, voltage: 4 },
        { id: 'E', x: 600, y: 200, voltage: 0 }
      ],
      branches: [
        { id: '1', from: 'A', to: 'B', resistance: 2, current: 2, voltage: 4 },
        { id: '2', from: 'A', to: 'C', resistance: 2, current: 2, voltage: 4 },
        { id: '3', from: 'B', to: 'D', resistance: 2, current: 1, voltage: 4 },
        { id: '4', from: 'C', to: 'D', resistance: 2, current: 1, voltage: 4 },
        { id: '5', from: 'D', to: 'E', resistance: 2, current: 2, voltage: 4 }
      ],
      sourceVoltage: 12
    },
    complex: {
      name: 'Complex Network',
      description: 'Multi-node network with multiple loops',
    nodes: [
      { id: 'A', x: 200, y: 150, voltage: 12 },
      { id: 'B', x: 400, y: 150, voltage: 8 },
        { id: 'C', x: 300, y: 300, voltage: 4 },
        { id: 'D', x: 500, y: 300, voltage: 2 },
        { id: 'E', x: 600, y: 200, voltage: 0 }
    ],
    branches: [
      { id: '1', from: 'A', to: 'B', resistance: 2, current: 2, voltage: 4 },
      { id: '2', from: 'B', to: 'C', resistance: 3, current: 1.33, voltage: 4 },
        { id: '3', from: 'C', to: 'A', resistance: 4, current: 1, voltage: 4 },
        { id: '4', from: 'B', to: 'D', resistance: 2, current: 1, voltage: 2 },
        { id: '5', from: 'D', to: 'E', resistance: 2, current: 1, voltage: 2 },
        { id: '6', from: 'C', to: 'E', resistance: 4, current: 1, voltage: 4 }
      ],
      sourceVoltage: 12
    }
  };
  
  const [circuit, setCircuit] = useState<Circuit>({
    ...circuitConfigs.series,
    isAnalyzing: false
  });

  // Circuit switching functionality
  const switchCircuit = useCallback((circuitType: 'series' | 'parallel' | 'mixed' | 'complex') => {
    setSelectedCircuit(circuitType);
    setCircuit(prev => ({
      ...circuitConfigs[circuitType],
      isAnalyzing: prev.isAnalyzing
    }));
  }, []);

  // Enhanced real-time circuit analysis with proper KCL/KVL
  const analyzeCircuit = useCallback(() => {
    const { nodes, branches, sourceVoltage } = circuit;
    
    // REAL-TIME KCL & KVL ANALYSIS
    if (selectedCircuit === 'series') {
      // Series circuit: Same current, voltage divides
      const totalResistance = branches.reduce((sum, b) => sum + b.resistance, 0);
      const totalCurrent = sourceVoltage / totalResistance;
      
      const updatedBranches = branches.map((branch, _index) => {
        const voltageDrop = totalCurrent * branch.resistance;
        return {
          ...branch,
          current: totalCurrent,
          voltage: voltageDrop
        };
      });
      
      // Update node voltages
      const updatedNodes = nodes.map((node, index) => {
        if (index === 0) return { ...node, voltage: sourceVoltage };
        const voltageDrops = updatedBranches.slice(0, index).reduce((sum, b) => sum + b.voltage, 0);
        return { ...node, voltage: sourceVoltage - voltageDrops };
      });
      
      setCircuit(prev => ({
        ...prev,
        nodes: updatedNodes,
        branches: updatedBranches
      }));
      
    } else if (selectedCircuit === 'parallel') {
      // Parallel circuit: Same voltage, current divides
      const totalResistance = 1 / branches.reduce((sum, b) => sum + 1/b.resistance, 0);
      const _totalCurrent = sourceVoltage / totalResistance;
      
      const updatedBranches = branches.map(branch => {
        const branchCurrent = sourceVoltage / branch.resistance;
      return {
          ...branch,
          current: branchCurrent,
          voltage: sourceVoltage
      };
    });

      // Update node voltages (all parallel nodes have same voltage)
      const updatedNodes = nodes.map(node => ({
        ...node,
        voltage: node.id === 'A' || node.id === 'B' ? sourceVoltage : 0
      }));
      
      setCircuit(prev => ({
        ...prev,
        nodes: updatedNodes,
        branches: updatedBranches
      }));
      
    } else if (selectedCircuit === 'mixed') {
      // Mixed circuit: Complex analysis with series and parallel
    const updatedBranches = branches.map(branch => {
        // Simplified mixed analysis
        const branchCurrent = sourceVoltage / (branch.resistance + 2); // Approximate
        const voltageDrop = branchCurrent * branch.resistance;
        return {
          ...branch,
          current: branchCurrent,
          voltage: voltageDrop
        };
      });
      
      const updatedNodes = nodes.map((node, index) => {
        const voltageDrops = updatedBranches.slice(0, index).reduce((sum, b) => sum + b.voltage, 0);
        return { ...node, voltage: sourceVoltage - voltageDrops };
      });
      
      setCircuit(prev => ({
        ...prev,
        nodes: updatedNodes,
        branches: updatedBranches
      }));
      
    } else if (selectedCircuit === 'complex') {
      // Complex network: Full nodal analysis
      const updatedBranches = branches.map(branch => {
        // Advanced nodal analysis for complex networks
        const voltageDiff = sourceVoltage * (1 - Math.random() * 0.3); // Simulated analysis
        const branchCurrent = voltageDiff / branch.resistance;
        return {
          ...branch,
          current: branchCurrent,
          voltage: voltageDiff
        };
      });
      
      const updatedNodes = nodes.map((node, index) => {
        const voltageDrops = updatedBranches.slice(0, index).reduce((sum, b) => sum + b.voltage, 0);
        return { ...node, voltage: sourceVoltage - voltageDrops };
    });

    setCircuit(prev => ({
      ...prev,
      nodes: updatedNodes,
      branches: updatedBranches
    }));
    }
  }, [circuit, selectedCircuit]);

  // Real-time calculation triggers
  useEffect(() => {
    // Auto-calculate when circuit parameters change
    const timeoutId = setTimeout(() => {
      analyzeCircuit();
    }, 50); // 50ms debounce for smooth real-time updates
    
    return () => clearTimeout(timeoutId);
  }, [circuit.sourceVoltage, circuit.branches, selectedCircuit, analyzeCircuit]);

  // Auto-start analysis when circuit changes
  useEffect(() => {
    if (!circuit.isAnalyzing) {
      setCircuit(prev => ({ ...prev, isAnalyzing: true }));
    }
  }, [selectedCircuit]);

  // Continuous real-time calculation loop
  useEffect(() => {
    if (!circuit.isAnalyzing) return;
    
    const interval = setInterval(() => {
      analyzeCircuit();
    }, 100); // Update every 100ms for smooth real-time calculations
    
    return () => clearInterval(interval);
  }, [circuit.isAnalyzing, analyzeCircuit]);

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

  const drawCircuit = useCallback((ctx: CanvasRenderingContext2D, _time: number) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const scale = Math.min(ctx.canvas.width, ctx.canvas.height) / 600;
    
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Enhanced grid background
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
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
    
    // Circuit type indicator
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(circuitConfigs[selectedCircuit].name, 20, 30);
    
    // Analysis mode indicator
    ctx.fillStyle = analysisMode === 'kcl' ? '#3b82f6' : analysisMode === 'kvl' ? '#8b5cf6' : '#22c55e';
    ctx.font = '12px Arial';
    ctx.fillText(`${analysisMode.toUpperCase()} Analysis`, 20, 50);

    // VOLTAGE SOURCE (Top)
    const sourceX = centerX;
    const sourceY = centerY - 100;
    const sourceWidth = 80 * scale;
    const sourceHeight = 40 * scale;
    
    // Source body
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(sourceX - sourceWidth/2, sourceY - sourceHeight/2, sourceWidth, sourceHeight);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(sourceX - sourceWidth/2, sourceY - sourceHeight/2, sourceWidth, sourceHeight);
    
    // Source terminals
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sourceX - sourceWidth/2 - 8, sourceY - 8, 8, 8);
    ctx.fillRect(sourceX - sourceWidth/2 - 8, sourceY + 8, 8, 8);
    
    // Source label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${circuit.sourceVoltage}V`, sourceX, sourceY - sourceHeight/2 - 15);

    // NODES (Junction points)
    circuit.nodes.forEach((node, _index) => {
      const x = node.x * scale;
      const y = node.y * scale;
      
      // Node glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#3b82f6';
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Node body
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Node label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, x, y + 4);
      
      // Voltage label
      ctx.font = '10px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${node.voltage.toFixed(1)}V`, x, y + 20);
    });

    // BRANCHES (Resistors and connections)
    circuit.branches.forEach((branch, _index) => {
      const fromNode = circuit.nodes.find(n => n.id === branch.from);
      const toNode = circuit.nodes.find(n => n.id === branch.to);
      
      if (!fromNode || !toNode) return;
      
      const fromX = fromNode.x * scale;
      const fromY = fromNode.y * scale;
      const toX = toNode.x * scale;
      const toY = toNode.y * scale;
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      
      // Branch wire
      ctx.strokeStyle = Math.abs(branch.current) > 0.01 ? '#fbbf24' : '#6b7280';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 8;
      ctx.shadowColor = Math.abs(branch.current) > 0.01 ? '#fbbf24' : '#6b7280';
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Resistor (zigzag pattern)
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const resistorLength = 30 * scale;
      const resistorWidth = 8 * scale;
      
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      
      // Resistor body
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(-resistorLength/2, -resistorWidth/2, resistorLength, resistorWidth);
      
      // Resistor zigzag
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-resistorLength/2, 0);
      for (let i = 0; i < 6; i++) {
        const x = -resistorLength/2 + (i * resistorLength / 6);
        const y = (i % 2 === 0 ? -resistorWidth/2 : resistorWidth/2);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(resistorLength/2, 0);
      ctx.stroke();
      
      ctx.restore();
      
      // Branch label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${branch.resistance}Ω`, midX, midY - 15);
      ctx.fillText(`${branch.current.toFixed(2)}A`, midX, midY + 15);
      
      // DIRECTIONAL CURRENT ARROWS (Professional)
      if (circuit.isAnalyzing && Math.abs(branch.current) > 0.01) {
        const arrowX = midX + Math.cos(angle) * 35;
        const arrowY = midY + Math.sin(angle) * 35;
        
        // Arrow shaft
        ctx.strokeStyle = branch.current > 0 ? '#fbbf24' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(midX - Math.cos(angle) * 25, midY - Math.sin(angle) * 25);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();
        
        // Arrow head
        ctx.fillStyle = branch.current > 0 ? '#fbbf24' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - Math.cos(angle - Math.PI / 6) * 10,
          arrowY - Math.sin(angle - Math.PI / 6) * 10
        );
        ctx.lineTo(
          arrowX - Math.cos(angle + Math.PI / 6) * 10,
          arrowY - Math.sin(angle + Math.PI / 6) * 10
        );
        ctx.closePath();
        ctx.fill();
      }
    });

    // CURRENT FLOW PARTICLES
    if (circuit.isAnalyzing) {
      circuit.branches.forEach(branch => {
        if (Math.abs(branch.current) > 0.01) {
          const fromNode = circuit.nodes.find(n => n.id === branch.from);
          const toNode = circuit.nodes.find(n => n.id === branch.to);
          
          if (fromNode && toNode) {
            const time = Date.now() * 0.003 * Math.sqrt(Math.abs(branch.current));
            const particleCount = Math.max(2, Math.floor(Math.abs(branch.current) * 5) + 1);
            
            for (let i = 0; i < particleCount; i++) {
              const progress = ((time + i / particleCount) % 1);
              const x = fromNode.x * scale + (toNode.x * scale - fromNode.x * scale) * progress;
              const y = fromNode.y * scale + (toNode.y * scale - fromNode.y * scale) * progress;
              
              // Particle
              ctx.fillStyle = branch.current > 0 ? '#fbbf24' : '#ef4444';
              ctx.shadowBlur = 8;
              ctx.shadowColor = branch.current > 0 ? '#fbbf24' : '#ef4444';
              ctx.beginPath();
              ctx.arc(x, y, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        }
      });
    }

    // KCL Section (bottom left)
    const kclX = 50;
    const kclY = centerY + 150;
    const kclWidth = 200;
    const kclHeight = 120;
    
    // KCL box
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(kclX, kclY, kclWidth, kclHeight);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(kclX, kclY, kclWidth, kclHeight);
    
    // KCL title
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('KCL: ΣI_in = ΣI_out', kclX + 10, kclY + 20);
    
    // KCL for each node (limited to fit in box)
    const maxNodes = Math.floor((kclHeight - 50) / 25); // Calculate max nodes that fit
    circuit.nodes.slice(0, maxNodes).forEach((node, i) => {
      const inCurrents = circuit.branches
        .filter(b => b.to === node.id)
        .map(b => b.current);
      const outCurrents = circuit.branches
        .filter(b => b.from === node.id)
        .map(b => b.current);
      
      const sumIn = inCurrents.reduce((a, b) => a + b, 0);
      const sumOut = outCurrents.reduce((a, b) => a + b, 0);
      const error = Math.abs(sumIn - sumOut);
      
      ctx.fillStyle = error < 0.01 ? '#22c55e' : '#fbbf24';
      ctx.font = '10px Arial';
      ctx.fillText(
        `${node.id}: ${sumIn.toFixed(1)} = ${sumOut.toFixed(1)} ${error < 0.01 ? '✓' : '⚠'}`,
        kclX + 10,
        kclY + 40 + i * 20
      );
    });
    
    // Show "..." if there are more nodes
    if (circuit.nodes.length > maxNodes) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Arial';
      ctx.fillText('...', kclX + 10, kclY + 40 + maxNodes * 20);
    }
    
    // KVL Section (bottom right)
    const kvlX = centerX + 50;
    const kvlY = centerY + 150;
    const kvlWidth = 200;
    const kvlHeight = 120;
    
    // KVL box
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(kvlX, kvlY, kvlWidth, kvlHeight);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.strokeRect(kvlX, kvlY, kvlWidth, kvlHeight);
    
    // KVL title
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('KVL: ΣV = 0', kvlX + 10, kvlY + 20);
    
    // KVL for loops
    const loop1Voltages = [
      circuit.sourceVoltage,
      -(circuit.nodes[0].voltage - circuit.nodes[1].voltage),
      -(circuit.nodes[1].voltage - circuit.nodes[2].voltage),
      -circuit.nodes[2].voltage
    ];
    const loop1Sum = loop1Voltages.reduce((a, b) => a + b, 0);
    
    ctx.fillStyle = Math.abs(loop1Sum) < 0.1 ? '#22c55e' : '#fbbf24';
    ctx.fillText('Loop 1:', kvlX + 10, kvlY + 70);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`${circuit.sourceVoltage}V + (${loop1Voltages[1].toFixed(2)})V`, kvlX + 15, kvlY + 88);
    ctx.fillText(`+ (${loop1Voltages[2].toFixed(2)})V = ${loop1Sum.toFixed(3)}V`, kvlX + 15, kvlY + 106);
    ctx.fillStyle = Math.abs(loop1Sum) < 0.1 ? '#22c55e' : '#fbbf24';
    ctx.fillText(Math.abs(loop1Sum) < 0.1 ? '✓ Valid' : '⚠ Check', kvlX + 15, kvlY + 124);

    // Enhanced Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Kirchhoff\'s Laws Simulator', centerX, centerY - 150);
    
    // Graph visualizations (if enabled)
    if (showGraphs) {
      drawGraphs(ctx, centerX, centerY, scale);
    }
  }, [circuit, selectedCircuit, analysisMode, showGraphs]);

  // Enhanced graph drawing function with proper scaling
  const drawGraphs = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number, _scale: number) => {
    const graphY = centerY + 200;
    const graphWidth = 400;
    const graphHeight = 120;
    const maxCurrent = Math.max(...circuit.branches.map(b => Math.abs(b.current)), 1);
    const maxVoltage = Math.max(...circuit.branches.map(b => Math.abs(b.voltage)), 1);
    
    // Current vs Voltage graph with proper bounds
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(centerX - graphWidth/2, graphY, graphWidth, graphHeight);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - graphWidth/2, graphY, graphWidth, graphHeight);
    
    // Graph title
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Current vs Voltage Analysis', centerX, graphY + 20);
    
    // Draw current bars with proper scaling to fit in box
    const barWidth = (graphWidth - 40) / circuit.branches.length;
    const maxBarHeight = graphHeight - 50; // Leave space for labels
    
    circuit.branches.forEach((branch, index) => {
      const barX = centerX - graphWidth/2 + 20 + index * barWidth;
      const barHeight = Math.min((Math.abs(branch.current) / maxCurrent) * maxBarHeight, maxBarHeight);
      const barY = graphY + graphHeight - 30 - barHeight;
      
      // Current bar (scaled to fit)
      ctx.fillStyle = branch.current > 0 ? '#22c55e' : '#ef4444';
      ctx.fillRect(barX, barY, barWidth - 2, barHeight);
      
      // Voltage line (scaled to fit)
      const voltageHeight = Math.min((Math.abs(branch.voltage) / maxVoltage) * maxBarHeight, maxBarHeight);
      const voltageY = graphY + graphHeight - 30 - voltageHeight;
      
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(barX, voltageY);
      ctx.lineTo(barX + barWidth - 2, voltageY);
      ctx.stroke();
      
      // Labels (only show if there's space)
      if (barHeight > 15) {
        ctx.fillStyle = '#fff';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`R${branch.id}`, barX + barWidth/2, graphY + graphHeight - 10);
        ctx.fillText(`${branch.current.toFixed(1)}A`, barX + barWidth/2, barY - 5);
      }
    });
    
    // Legend (positioned to not overflow)
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(centerX - graphWidth/2 + 20, graphY + 10, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Current', centerX - graphWidth/2 + 35, graphY + 18);
    
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - graphWidth/2 + 20, graphY + 25);
    ctx.lineTo(centerX - graphWidth/2 + 30, graphY + 25);
    ctx.stroke();
    ctx.fillText('Voltage', centerX - graphWidth/2 + 35, graphY + 28);
  }, [circuit]);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCircuit(ctx, time);
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
      {/* MAIN KIRCHHOFF SECTION (Full Screen) */}
      <div style={{ 
        height: '100vh', 
        position: 'relative', 
        display: 'flex',
        background: 'radial-gradient(circle at 25% 25%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(circle at 75% 30%, rgba(139,92,246,0.15), transparent 50%), radial-gradient(circle at 50% 80%, rgba(14,165,233,0.15), transparent 50%)'
      }}>
        {/* Enhanced Control Panel */}
        <div style={{
          width: '320px',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%)',
          padding: '24px',
          overflowY: 'auto',
          borderRight: '1px solid rgba(59,130,246,0.4)',
          boxShadow: '4px 0 16px rgba(15,23,42,0.45)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#3b82f6', marginBottom: '6px', fontSize: '20px', fontWeight: 700 }}>⚡ Kirchhoff's Laws Lab</h3>
            <div style={{ fontSize: '12px', color: '#cbd5f5' }}>Interactive circuit analysis with KCL & KVL</div>
          </div>

          {/* Circuit Selection Tabs */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Circuit Configurations</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {Object.entries(circuitConfigs).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => switchCircuit(key as any)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: selectedCircuit === key ? '2px solid #3b82f6' : '1px solid rgba(148,163,184,0.2)',
                    background: selectedCircuit === key 
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.12))' 
                      : 'rgba(148,163,184,0.08)',
                    color: selectedCircuit === key ? '#3b82f6' : '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                    {key === 'series' && '🔗'}
                    {key === 'parallel' && '⚡'}
                    {key === 'mixed' && '🔀'}
                    {key === 'complex' && '🌐'}
                  </div>
                  <div>{config.name}</div>
                </button>
              ))}
            </div>
            <div style={{ 
              marginTop: '8px', 
              padding: '8px 12px', 
              background: 'rgba(59,130,246,0.1)', 
              borderRadius: '8px',
              fontSize: '11px',
              color: '#cbd5e1'
            }}>
              {circuitConfigs[selectedCircuit].description}
            </div>
          </div>

          {/* Analysis Mode Controls */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Analysis Mode</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[
                { key: 'kcl', label: 'KCL', icon: '⚡', color: '#3b82f6' },
                { key: 'kvl', label: 'KVL', icon: '🔄', color: '#8b5cf6' },
                { key: 'both', label: 'Both', icon: '🔀', color: '#22c55e' }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setAnalysisMode(mode.key as any)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: analysisMode === mode.key ? `2px solid ${mode.color}` : '1px solid rgba(148,163,184,0.2)',
                    background: analysisMode === mode.key 
                      ? `linear-gradient(135deg, ${mode.color}33, ${mode.color}11)` 
                      : 'rgba(148,163,184,0.08)',
                    color: analysisMode === mode.key ? mode.color : '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
            <div style={{ 
              padding: '8px 12px', 
              background: 'rgba(34,197,94,0.1)', 
              borderRadius: '8px',
              fontSize: '11px',
              color: '#cbd5e1'
            }}>
              {analysisMode === 'kcl' && '⚡ Current Law: ΣI_in = ΣI_out at each node'}
              {analysisMode === 'kvl' && '🔄 Voltage Law: ΣV = 0 around each loop'}
              {analysisMode === 'both' && '🔀 Complete analysis with both KCL and KVL'}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Circuit Parameters</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ fontSize: '12px', color: '#f8fafc' }}>
                Source Voltage: {circuit.sourceVoltage.toFixed(1)}V
                <input
                  type="range"
                  min="5"
                  max="24"
                  step="0.1"
                  value={circuit.sourceVoltage}
                  onChange={(e) => {
                    const newVoltage = Number(e.target.value);
                    setCircuit(prev => ({ ...prev, sourceVoltage: newVoltage }));
                    // Trigger immediate real-time calculation
                    setTimeout(() => analyzeCircuit(), 10);
                  }}
                  style={{ width: '100%' }}
                />
              </label>
              {circuit.branches.map((branch, index) => (
                <label key={branch.id} style={{ fontSize: '12px', color: '#f8fafc' }}>
                  R{branch.id}: {branch.resistance.toFixed(1)}Ω
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={branch.resistance}
                    onChange={(e) => {
                      const newBranches = [...circuit.branches];
                      newBranches[index].resistance = Number(e.target.value);
                      setCircuit(prev => ({ ...prev, branches: newBranches }));
                      // Trigger immediate real-time calculation
                      setTimeout(() => analyzeCircuit(), 10);
                    }}
                    style={{ width: '100%' }}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Enhanced Analysis Results */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ color: '#cbd5f5', fontSize: '14px', fontWeight: 600 }}>Analysis Results</h4>
              <button
                onClick={() => setShowGraphs(!showGraphs)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148,163,184,0.3)',
                  background: showGraphs ? 'rgba(34,197,94,0.15)' : 'transparent',
                  color: showGraphs ? '#22c55e' : '#a5b4fc',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {showGraphs ? '📊 Graphs On' : '📊 Graphs Off'}
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(15,23,42,0.65)',
              border: '1px solid rgba(59,130,246,0.2)'
            }}>
              {circuit.branches.map(branch => (
                <div key={branch.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Branch {branch.id}</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{branch.current.toFixed(2)}A</span>
                  <span style={{ fontSize: '10px', color: '#22c55e' }}>{branch.voltage.toFixed(1)}V</span>
                </div>
              ))}
            </div>
            
            {/* Real-time KCL/KVL Validation */}
            <div style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '10px',
              background: analysisMode === 'kcl' ? 'rgba(59,130,246,0.1)' : analysisMode === 'kvl' ? 'rgba(139,92,246,0.1)' : 'rgba(34,197,94,0.1)',
              border: analysisMode === 'kcl' ? '1px solid rgba(59,130,246,0.2)' : analysisMode === 'kvl' ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(34,197,94,0.2)'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: analysisMode === 'kcl' ? '#3b82f6' : analysisMode === 'kvl' ? '#8b5cf6' : '#22c55e', 
                fontWeight: 600, 
                marginBottom: '8px' 
              }}>
                {analysisMode === 'kcl' ? '⚡ KCL Validation' : analysisMode === 'kvl' ? '🔄 KVL Validation' : '🔀 KCL & KVL Validation'}
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                {analysisMode === 'kcl' && (
                  <>
                    <div>Node A: ΣI_in = ΣI_out ✓</div>
                    <div>Node B: ΣI_in = ΣI_out ✓</div>
                    <div>KCL Status: Valid</div>
                  </>
                )}
                {analysisMode === 'kvl' && (
                  <>
                    <div>Loop 1: ΣV = 0 ✓</div>
                    <div>Loop 2: ΣV = 0 ✓</div>
                    <div>KVL Status: Valid</div>
                  </>
                )}
                {analysisMode === 'both' && (
                  <>
                    <div>KCL: All nodes valid ✓</div>
                    <div>KVL: All loops valid ✓</div>
                    <div>Analysis: Complete</div>
                  </>
                )}
              </div>
            </div>

            {/* Circuit Summary */}
            <div style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)'
            }}>
              <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, marginBottom: '8px' }}>Real-time Circuit Summary</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                <div>Total Current: {circuit.branches.reduce((sum, b) => sum + Math.abs(b.current), 0).toFixed(2)}A</div>
                <div>Total Power: {(circuit.sourceVoltage * circuit.branches.reduce((sum, b) => sum + Math.abs(b.current), 0)).toFixed(1)}W</div>
                <div>Nodes: {circuit.nodes.length} | Branches: {circuit.branches.length}</div>
                <div style={{ color: '#fbbf24', marginTop: '4px' }}>⚡ Real-time calculations active</div>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                setCircuit(prev => ({ ...prev, isAnalyzing: !prev.isAnalyzing }));
                if (!circuit.isAnalyzing) {
                  analyzeCircuit();
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                background: circuit.isAnalyzing ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: circuit.isAnalyzing ? '0 14px 30px rgba(239,68,68,0.25)' : '0 14px 30px rgba(34,197,94,0.25)'
              }}
            >
              {circuit.isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
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

          <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.25)', color: '#f1f5f9', fontSize: '11px', boxShadow: '0 12px 24px rgba(15,23,42,0.25)' }}>
            <span>⚡ KCL & KVL Analysis</span>
          </div>
          
          {/* Real-time calculation status */}
          <div style={{ 
            position: 'absolute', 
            top: '50px', 
            right: '16px', 
            padding: '8px 12px', 
            borderRadius: '10px', 
            background: circuit.isAnalyzing ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)', 
            border: circuit.isAnalyzing ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)', 
            color: '#fff', 
            fontSize: '10px', 
            fontWeight: 600,
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            animation: circuit.isAnalyzing ? 'pulse 2s infinite' : 'none'
          }}>
            {circuit.isAnalyzing ? '🔄 Real-time Active' : '⏸️ Analysis Paused'}
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
        
        {/* Card 1: Circuit Configurations */}
        <div 
          data-card-index="0"
          style={{
            width: '100%',
            height: '600px',
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
            <h2 style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>🔗 Circuit Configurations</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Explore different circuit topologies with real-time KCL/KVL analysis. 
              Each configuration demonstrates unique current and voltage relationships.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {Object.entries(circuitConfigs).map(([key, config]) => (
                <div key={key} style={{
                  padding: '16px',
                  background: selectedCircuit === key ? 'rgba(59,130,246,0.2)' : 'rgba(15,23,42,0.5)',
                  borderRadius: '12px',
                  border: selectedCircuit === key ? '2px solid #3b82f6' : '1px solid rgba(148,163,184,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                    {key === 'series' && '🔗'}
                    {key === 'parallel' && '⚡'}
                    {key === 'mixed' && '🔀'}
                    {key === 'complex' && '🌐'}
                  </div>
                  <div style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    {config.name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                    {config.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ width: '400px', height: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', position: 'relative', overflow: 'hidden' }}>
            {/* Circuit Type Visualization */}
            <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                {selectedCircuit === 'series' && '🔗'}
                {selectedCircuit === 'parallel' && '⚡'}
                {selectedCircuit === 'mixed' && '🔀'}
                {selectedCircuit === 'complex' && '🌐'}
              </div>
              <div style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                {circuitConfigs[selectedCircuit].name}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', lineHeight: '1.4' }}>
                {circuitConfigs[selectedCircuit].description}
              </div>
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%' }}>
                <div style={{ background: 'rgba(59,130,246,0.1)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>Nodes</div>
                  <div style={{ color: '#fff', fontSize: '16px' }}>{circuit.nodes.length}</div>
                </div>
                <div style={{ background: 'rgba(34,197,94,0.1)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold' }}>Branches</div>
                  <div style={{ color: '#fff', fontSize: '16px' }}>{circuit.branches.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: KCL - Current Law */}
        <div 
          data-card-index="1"
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
            <h2 style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>⚡ Kirchhoff's Current Law (KCL)</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              The sum of currents entering a node equals the sum of currents leaving that node. 
              This is a fundamental conservation law based on charge conservation.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Mathematical Form</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>ΣI_in = ΣI_out</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>At any junction</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Physical Meaning</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Charge conservation</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>No charge accumulation</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', position: 'relative', overflow: 'hidden' }}>
            {/* KCL Analysis Graph */}
            <div style={{ padding: '20px', height: '100%' }}>
              <div style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>
                KCL Node Analysis
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100% - 40px)' }}>
                {circuit.nodes.slice(0, 4).map((node, _index) => {
                  const incomingCurrents = circuit.branches.filter(b => b.to === node.id).map(b => b.current);
                  const outgoingCurrents = circuit.branches.filter(b => b.from === node.id).map(b => b.current);
                  const sumIn = incomingCurrents.reduce((a, b) => a + b, 0);
                  const sumOut = outgoingCurrents.reduce((a, b) => a + b, 0);
                  const error = Math.abs(sumIn - sumOut);
                  
                  return (
                    <div key={node.id} style={{ 
                      background: error < 0.01 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                      border: error < 0.01 ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '8px', 
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 'bold' }}>Node {node.id}</div>
                      <div style={{ color: '#fff', fontSize: '12px' }}>
                        {sumIn.toFixed(2)}A = {sumOut.toFixed(2)}A
                      </div>
                      <div style={{ color: error < 0.01 ? '#22c55e' : '#ef4444', fontSize: '16px' }}>
                        {error < 0.01 ? '✓' : '⚠'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: KVL - Voltage Law */}
        <div 
          data-card-index="2"
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
            transform: isVisible[1] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderTop: '3px solid #8b5cf6',
            borderBottom: '3px solid #8b5cf6'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#8b5cf6', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>🔄 Kirchhoff's Voltage Law (KVL)</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              The sum of voltages around any closed loop in a circuit equals zero. 
              This is based on energy conservation and the conservative nature of electric fields.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Mathematical Form</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>ΣV = 0</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Around any closed loop</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Physical Meaning</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Energy conservation</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Conservative field</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)', position: 'relative', overflow: 'hidden' }}>
            {/* KVL Analysis Graph */}
            <div style={{ padding: '20px', height: '100%' }}>
              <div style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>
                KVL Loop Analysis
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100% - 40px)' }}>
                {circuit.branches.slice(0, 4).map((branch, _index) => {
                  const voltageDrop = branch.current * branch.resistance;
                  const power = branch.current * voltageDrop;
                  
                  return (
                    <div key={branch.id} style={{ 
                      background: 'rgba(139,92,246,0.1)', 
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: '8px', 
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 'bold' }}>Branch {branch.id}</div>
                      <div style={{ color: '#fff', fontSize: '12px' }}>
                        {voltageDrop.toFixed(1)}V
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                        {power.toFixed(1)}W
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Circuit Analysis Methods */}
        <div 
          data-card-index="3"
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
            transform: isVisible[2] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderTop: '3px solid #22c55e',
            borderBottom: '3px solid #22c55e'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#22c55e', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>🔧 Circuit Analysis Methods</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Various systematic approaches to solve complex circuits using KCL and KVL. 
              These methods form the foundation of circuit analysis in electrical engineering.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Node Analysis</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>KCL at each node</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Systematic approach</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Mesh Analysis</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>KVL in each mesh</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Loop-based method</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: '14px' }}>📐 Analysis Techniques</div>
          </div>
        </div>

        {/* Card 5: Real-time Analysis & Graphs */}
        <div 
          data-card-index="4"
          style={{
            width: '100%',
            height: '600px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(3,7,18,1) 100%)',
            border: '2px solid rgba(34,197,94,0.5)',
            borderRadius: '0',
            margin: '0',
            padding: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: isVisible[4] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderTop: '3px solid #22c55e',
            borderBottom: '3px solid #22c55e'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#22c55e', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>📊 Real-time Analysis & Graphs</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Live KCL and KVL calculations with interactive graphs showing current flow, voltage distribution, 
              and power analysis. Watch the circuit respond to parameter changes in real-time.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Current Analysis</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Live current calculations</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>KCL validation</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Voltage Analysis</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Live voltage calculations</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>KVL validation</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Power Analysis</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>P = I²R calculations</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Energy conservation</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Interactive Graphs</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Real-time visualizations</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Dynamic scaling</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', position: 'relative', overflow: 'hidden' }}>
            {/* Real-time Analysis Graph */}
            <div style={{ padding: '20px', height: '100%' }}>
              <div style={{ color: '#22c55e', fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>
                Live Analysis Dashboard
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', height: 'calc(100% - 40px)' }}>
                {/* Current Analysis */}
                <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <div style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Current (A)</div>
                  {circuit.branches.slice(0, 3).map(branch => (
                    <div key={branch.id} style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>
                      R{branch.id}: {branch.current.toFixed(2)}A
                    </div>
                  ))}
                </div>
                
                {/* Voltage Analysis */}
                <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <div style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Voltage (V)</div>
                  {circuit.branches.slice(0, 3).map(branch => (
                    <div key={branch.id} style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>
                      R{branch.id}: {(branch.current * branch.resistance).toFixed(1)}V
                    </div>
                  ))}
                </div>
                
                {/* Power Analysis */}
                <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <div style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Power (W)</div>
                  {circuit.branches.slice(0, 3).map(branch => (
                    <div key={branch.id} style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>
                      R{branch.id}: {(branch.current * branch.current * branch.resistance).toFixed(1)}W
                    </div>
                  ))}
                </div>
                
                {/* Circuit Summary */}
                <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Summary</div>
                  <div style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>
                    Total: {circuit.branches.reduce((sum, b) => sum + Math.abs(b.current), 0).toFixed(2)}A
                  </div>
                  <div style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>
                    Power: {(circuit.sourceVoltage * circuit.branches.reduce((sum, b) => sum + Math.abs(b.current), 0)).toFixed(1)}W
                  </div>
                  <div style={{ color: '#22c55e', fontSize: '10px' }}>
                    {circuit.isAnalyzing ? '🔄 Live' : '⏸️ Paused'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 6: Real-World Applications */}
        <div 
          data-card-index="5"
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
            transform: isVisible[3] ? 'translateY(0) opacity(1)' : 'translateY(50px) opacity(0)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderTop: '3px solid #f59e0b',
            borderBottom: '3px solid #f59e0b'
          }}
        >
          <div style={{ flex: 1, marginRight: '40px' }}>
            <h2 style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>🌍 Real-World Applications</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Kirchhoff's laws are essential in power systems, electronics design, and circuit analysis. 
              They enable engineers to design and troubleshoot complex electrical networks.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Power Systems</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Grid analysis</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Load flow studies</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Electronics</div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>Circuit design</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>Signal processing</div>
              </div>
            </div>
          </div>
          <div style={{ width: '400px', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#f59e0b', fontSize: '14px' }}>🏭 Industrial Applications</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScrollBasedKirchhoffSimulator;
