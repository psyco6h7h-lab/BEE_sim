import React, { useState, useEffect } from 'react';

const NewMotorLab: React.FC = () => {
  
  // DC Motor State
  const [dcMotor, setDcMotor] = useState({
    magneticField: 1.8,
    batteryVoltage: 5.0,
    numberOfLoops: 2,
    animationSpeed: 1.0,
    isRunning: true
  });

  // Send messages to iframe to control it (no reloading!)
  useEffect(() => {
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
  }, [dcMotor]);



  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 60px)',
      marginTop: '60px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#ffffff'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '320px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRight: '1px solid rgba(59, 130, 246, 0.3)',
        padding: '24px',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)'
      }}>

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
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '18px'
          }}>
            ⚡
          </div>
          <div>
            <h2 style={{ 
              color: '#f1f5f9', 
              margin: 0,
              fontSize: '18px',
              fontWeight: '700'
            }}>
              DC Motor Lab
            </h2>
            <p style={{ 
              color: '#94a3b8', 
              margin: 0,
              fontSize: '12px'
            }}>
              3D Interactive Visualization
            </p>
          </div>
        </div>

        {/* DC Motor Controls */}
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

            {/* DC Motor Parameters */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: '#cbd5f5', 
                fontSize: '13px', 
                marginBottom: '16px', 
                fontWeight: '600',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Motor Parameters
              </h4>
              
              {/* Magnetic Field */}
              <div style={{ marginBottom: '18px' }}>
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
              <div style={{ marginBottom: '18px' }}>
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
              <div style={{ marginBottom: '18px' }}>
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
              <div style={{ marginBottom: '18px' }}>
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
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: '#cbd5f5', 
                fontSize: '13px', 
                marginBottom: '12px', 
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

               {/* Status */}
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '10px',
          padding: '12px',
          marginTop: '20px'
        }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></div>
                   <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '600' }}>
                     DC Motor Active
                   </span>
                 </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15), transparent 55%)' }}>
        {/* 3D DC Motor Physics Simulation */}
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {/* 3D Motor Container - Stationary View */}
            <div style={{
              width: '600px',
              height: '600px',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: 'rotateX(15deg) rotateY(0deg)', // Fixed 3D angle, no auto-rotation
              animation: 'none' // Always stationary 3D view
            }}>
              {/* Magnetic Field Lines */}
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: '2px',
                  height: '350px',
                  background: 'linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.6), transparent)',
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'center center',
                  transform: `translate(-50%, -50%) translateZ(-50px) rotateZ(${i * 30}deg)`,
                  opacity: 0.3 + (dcMotor.magneticField - 1) * 0.7
                }} />
              ))}

              {/* Stator Housing */}
              <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) translateZ(-100px)',
                border: '3px solid rgba(59, 130, 246, 0.6)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(30, 64, 175, 0.1), rgba(15, 23, 42, 0.3))',
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.1)'
              }} />

              {/* North Pole Magnet */}
              <div style={{
                position: 'absolute',
                width: '120px',
                height: '200px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                left: '50%',
                top: '0',
                transform: 'translate(-50%, -20px) translateZ(50px)',
                borderRadius: '10px',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
              }}>
                N
              </div>

              {/* South Pole Magnet */}
              <div style={{
                position: 'absolute',
                width: '120px',
                height: '200px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                left: '50%',
                bottom: '0',
                transform: 'translate(-50%, 20px) translateZ(50px)',
                borderRadius: '10px',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
              }}>
                S
              </div>

              {/* Rotating Armature */}
              <div style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) translateZ(0px)',
                transformStyle: 'preserve-3d',
                animation: dcMotor.isRunning ? `rotateArmature ${2 / dcMotor.animationSpeed}s linear infinite` : 'none'
              }}>
                {/* Main Coil */}
                <div style={{
                  position: 'absolute',
                  width: '160px',
                  height: '160px',
                  border: '6px solid #f59e0b',
                  borderRadius: '10px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 20px rgba(245, 158, 11, 0.8), inset 0 0 20px rgba(245, 158, 11, 0.3)`,
                  filter: `brightness(${0.8 + (dcMotor.batteryVoltage - 1) * 0.5})`
                }} />

                {/* Additional Coils */}
                {dcMotor.numberOfLoops >= 2 && (
                  <div style={{
                    position: 'absolute',
                    width: '160px',
                    height: '160px',
                    border: '6px solid #fb923c',
                    borderRadius: '10px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotateZ(45deg)',
                    boxShadow: `0 0 20px rgba(251, 146, 60, 0.8), inset 0 0 20px rgba(251, 146, 60, 0.3)`,
                    filter: `brightness(${0.8 + (dcMotor.batteryVoltage - 1) * 0.5})`
                  }} />
                )}

                {dcMotor.numberOfLoops >= 3 && (
                  <div style={{
                    position: 'absolute',
                    width: '160px',
                    height: '160px',
                    border: '6px solid #fdba74',
                    borderRadius: '10px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotateZ(90deg)',
                    boxShadow: `0 0 20px rgba(253, 186, 116, 0.8), inset 0 0 20px rgba(253, 186, 116, 0.3)`,
                    filter: `brightness(${0.8 + (dcMotor.batteryVoltage - 1) * 0.5})`
                  }} />
                )}

                {/* Commutator */}
                <div style={{
                  position: 'absolute',
                  width: '80px',
                  height: '80px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%) translateZ(10px)',
                  borderRadius: '50%',
                  background: 'linear-gradient(90deg, #fbbf24 50%, #6b7280 50%)',
                  boxShadow: '0 0 15px rgba(251, 191, 36, 0.6)',
                  animation: dcMotor.isRunning ? `rotateCommutator ${2 / dcMotor.animationSpeed}s linear infinite` : 'none'
                }} />

                {/* Central Shaft */}
                <div style={{
                  position: 'absolute',
                  width: '30px',
                  height: '30px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%) translateZ(15px)',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #94a3b8, #475569)',
                  boxShadow: '0 0 10px rgba(148, 163, 184, 0.5)'
                }} />
              </div>

              {/* Carbon Brushes */}
              <div style={{
                position: 'absolute',
                width: '40px',
                height: '80px',
                background: 'linear-gradient(180deg, #374151, #1f2937)',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -180px) translateZ(20px)',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(55, 65, 81, 0.6)'
              }} />

              <div style={{
                position: 'absolute',
                width: '40px',
                height: '80px',
                background: 'linear-gradient(180deg, #1f2937, #374151)',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, 100px) translateZ(20px)',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(55, 65, 81, 0.6)'
              }} />

              {/* Current Flow Particles */}
              {dcMotor.isRunning && [...Array(4)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: '8px',
                  height: '8px',
                  background: '#22c55e',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px #22c55e, 0 0 20px #22c55e',
                  animation: `flowCurrent ${2 / dcMotor.animationSpeed}s linear infinite`,
                  animationDelay: `${i * 0.5}s`
                }} />
              ))}

              {/* Force Arrows */}
              {dcMotor.isRunning && (
                <>
                  <div style={{
                    position: 'absolute',
                    width: '60px',
                    height: '4px',
                    background: '#22c55e',
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'left center',
                    transform: 'translate(-80px, -80px) translateZ(30px) rotateZ(45deg)',
                    boxShadow: '0 0 10px #22c55e'
                  }}>
                    <div style={{
                      position: 'absolute',
                      right: '-10px',
                      top: '-6px',
                      width: '0',
                      height: '0',
                      borderLeft: '15px solid #22c55e',
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent'
                    }} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    width: '60px',
                    height: '4px',
                    background: '#22c55e',
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'left center',
                    transform: 'translate(20px, -80px) translateZ(30px) rotateZ(135deg)',
                    boxShadow: '0 0 10px #22c55e'
                  }}>
                    <div style={{
                      position: 'absolute',
                      right: '-10px',
                      top: '-6px',
                      width: '0',
                      height: '0',
                      borderLeft: '15px solid #22c55e',
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent'
                    }} />
                  </div>
                </>
              )}

              {/* Component Labels */}
              <div style={{
                position: 'absolute',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#3b82f6',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                top: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap'
              }}>
                North Pole (N)
              </div>

              <div style={{
                position: 'absolute',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#3b82f6',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                bottom: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap'
              }}>
                South Pole (S)
              </div>

              <div style={{
                position: 'absolute',
                background: 'rgba(245, 158, 11, 0.9)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                whiteSpace: 'nowrap'
              }}>
                Rotating Armature Coil
              </div>

              <div style={{
                position: 'absolute',
                background: 'rgba(251, 191, 36, 0.9)',
                color: '#0a0a0a',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                right: '80px',
                top: '50%',
                transform: 'translateY(-50%)',
                whiteSpace: 'nowrap'
              }}>
                Commutator (Current Switch)
              </div>
            </div>

            {/* DC Power Source */}
            <div style={{
              position: 'absolute',
              left: '50px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #1f2937, #374151)',
              border: '2px solid #22c55e',
              borderRadius: '8px',
              padding: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
            }}>
              <div style={{ color: '#ef4444', marginBottom: '4px' }}>+</div>
              <div style={{ color: '#22c55e', marginBottom: '4px' }}>-</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>DC Power Source</div>
              <div style={{ fontSize: '16px', color: '#22c55e', marginTop: '4px' }}>
                {dcMotor.batteryVoltage.toFixed(1)}V
              </div>
            </div>

            {/* CSS Animations */}
            <style>{`
              @keyframes autoRotate {
                from { transform: rotateX(15deg) rotateY(0deg); }
                to { transform: rotateX(15deg) rotateY(360deg); }
              }
              
              @keyframes rotateArmature {
                from { transform: translate(-50%, -50%) translateZ(0px) rotateZ(0deg); }
                to { transform: translate(-50%, -50%) translateZ(0px) rotateZ(360deg); }
              }
              
              @keyframes rotateCommutator {
                from { transform: translate(-50%, -50%) translateZ(10px) rotateZ(0deg); }
                to { transform: translate(-50%, -50%) translateZ(10px) rotateZ(360deg); }
              }
              
              @keyframes flowCurrent {
                0% { 
                  left: 50%;
                  top: 0%;
                  opacity: 0;
                }
                25% {
                  left: 100%;
                  top: 50%;
                  opacity: 1;
                }
                50% {
                  left: 50%;
                  top: 100%;
                  opacity: 1;
                }
                75% {
                  left: 0%;
                  top: 50%;
                  opacity: 1;
                }
                100% {
                  left: 50%;
                  top: 0%;
                  opacity: 0;
                }
              }
            `}</style>
          </div>

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
                     DC Motor Physics Lab
                   </div>
                   <div style={{ color: '#3b82f6', fontSize: '11px' }}>
                     3D Visualization
                   </div>
                 </div>
          <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: '600' }}>
            ⚡ Ready
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMotorLab;