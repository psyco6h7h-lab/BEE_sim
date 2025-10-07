# Electrical Engineering 3D Simulator - Architecture Documentation

## 🏗️ System Architecture

### High-Level Overview
The Electrical Engineering 3D Simulator is built as a modern React application using React Three Fiber for 3D rendering, Zustand for state management, and TypeScript for type safety. The architecture follows a modular, component-based design with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  React Components  │  UI Controls  │  3D Scenes  │  Layout  │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  State Management  │  Calculations  │  Validation  │  Utils  │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Simulation Store  │  Component Data  │  Export/Import      │
├─────────────────────────────────────────────────────────────┤
│                    Rendering Layer                          │
├─────────────────────────────────────────────────────────────┤
│  React Three Fiber  │  Three.js  │  WebGL  │  Canvas        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── components/                 # React UI Components
│   ├── 3d/                   # 3D-specific components
│   │   ├── CircuitComponent.tsx
│   │   ├── Wire.tsx
│   │   ├── Grid.tsx
│   │   ├── CurrentFlow.tsx
│   │   ├── OhmLawVisualization.tsx
│   │   ├── KirchhoffVisualization.tsx
│   │   ├── TransformerVisualization.tsx
│   │   └── MotorVisualization.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── ControlPanel.tsx
│   └── LoadingScreen.tsx
├── scenes/                    # 3D Scene Components
│   ├── CircuitScene.tsx
│   ├── OhmLawScene.tsx
│   ├── KirchhoffScene.tsx
│   ├── TransformerScene.tsx
│   └── MotorScene.tsx
├── store/                     # State Management
│   └── simulationStore.ts
├── utils/                     # Utility Functions
│   ├── calculations.ts
│   ├── validation.ts
│   ├── export.ts
│   ├── sampleCircuits.ts
│   └── constants.ts
├── types/                     # TypeScript Definitions
│   └── index.ts
├── App.tsx                    # Main Application
└── index.tsx                 # Entry Point
```

## 🔄 Data Flow Architecture

### State Management Flow
```
User Action → Component → Store Update → State Change → Re-render → UI Update
```

### 3D Rendering Flow
```
State Change → Scene Update → Three.js Render → WebGL Pipeline → Canvas Output
```

### Calculation Flow
```
Component Values → Validation → Calculation Engine → Results → State Update
```

## 🧩 Component Architecture

### 1. Presentation Components
- **Header**: Navigation and scene selection
- **Sidebar**: Component library and controls
- **ControlPanel**: Real-time metrics and actions
- **LoadingScreen**: Initial loading experience

### 2. 3D Components
- **CircuitComponent**: Individual electrical components
- **Wire**: Connection visualization
- **Grid**: Workspace reference
- **CurrentFlow**: Animated current particles
- **Visualization Components**: Specialized 3D visualizations

### 3. Scene Components
- **CircuitScene**: Main circuit simulation
- **OhmLawScene**: Ohm's Law calculator
- **KirchhoffScene**: Kirchhoff's Laws simulation
- **TransformerScene**: Transformer simulation
- **MotorScene**: Motor simulation

## 🗄️ State Management Architecture

### Zustand Store Structure
```typescript
interface SimulationState {
  // Loading and UI state
  isLoading: boolean;
  currentScene: SceneType;
  
  // Circuit simulation
  components: CircuitComponent[];
  addComponent: (component: CircuitComponent) => void;
  updateComponent: (id: string, updates: Partial<CircuitComponent>) => void;
  
  // Motor simulation
  motorState: MotorState;
  updateMotorState: (updates: Partial<MotorState>) => void;
  
  // Transformer simulation
  transformerState: TransformerState;
  updateTransformerState: (updates: Partial<TransformerState>) => void;
  
  // Ohm's Law
  ohmLawState: OhmLawState;
  updateOhmLawState: (updates: Partial<OhmLawState>) => void;
  
  // Kirchhoff's Laws
  kirchhoffState: KirchhoffState;
  updateKirchhoffState: (updates: Partial<KirchhoffState>) => void;
  
  // Simulation control
  isSimulationRunning: boolean;
  simulationSpeed: number;
  
  // UI preferences
  showGrid: boolean;
  showLabels: boolean;
  darkMode: boolean;
  
  // Calculation methods
  calculateCircuitValues: () => void;
  calculateMotorValues: () => void;
  calculateTransformerValues: () => void;
  calculateOhmLawValues: () => void;
  calculateKirchhoffValues: () => void;
}
```

## 🎨 Rendering Architecture

### React Three Fiber Integration
```typescript
<Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
  <Environment preset="night" />
  <ambientLight intensity={0.3} />
  <directionalLight position={[10, 10, 5]} intensity={1} />
  <OrbitControls enablePan={true} enableZoom={true} />
  {renderScene()}
</Canvas>
```

### 3D Component Lifecycle
1. **Mount**: Component added to scene
2. **Update**: Properties changed, re-render
3. **Animate**: Frame-by-frame updates
4. **Unmount**: Component removed from scene

## ⚡ Performance Architecture

### Rendering Optimization
- **Frustum Culling**: Only render visible objects
- **Level of Detail**: Reduce complexity for distant objects
- **Instanced Rendering**: Efficient rendering of repeated components
- **Texture Compression**: Optimized texture loading

### State Optimization
- **Selective Updates**: Only update changed components
- **Memoization**: Cache expensive calculations
- **Lazy Loading**: Load components on demand

### Memory Management
- **Component Pooling**: Reuse component instances
- **Texture Caching**: Cache loaded textures
- **Geometry Sharing**: Share geometry between similar components

## 🔧 Calculation Engine Architecture

### Electrical Calculations
```typescript
// Ohm's Law: V = I × R
const calculateOhmLaw = (voltage: number, current: number, resistance: number) => {
  if (voltage && resistance) return { current: voltage / resistance };
  if (voltage && current) return { resistance: voltage / current };
  if (current && resistance) return { voltage: current * resistance };
};

// Series Resistance: R_total = R1 + R2 + R3 + ...
const calculateSeriesResistance = (resistors: number[]) => {
  return resistors.reduce((sum, r) => sum + r, 0);
};

// Parallel Resistance: 1/R_total = 1/R1 + 1/R2 + 1/R3 + ...
const calculateParallelResistance = (resistors: number[]) => {
  const reciprocalSum = resistors.reduce((sum, r) => sum + (1 / r), 0);
  return 1 / reciprocalSum;
};
```

### Motor Calculations
```typescript
// Motor Torque: τ = (V × I) / ω
const calculateMotorTorque = (voltage: number, current: number, speed: number) => {
  return (voltage * current) / (speed * Math.PI / 30);
};

// Motor Power: P = V × I
const calculateMotorPower = (voltage: number, current: number) => {
  return voltage * current;
};
```

### Transformer Calculations
```typescript
// Secondary Voltage: V2 = (V1 / N1) × N2
const calculateSecondaryVoltage = (primaryVoltage: number, turnsRatio: number) => {
  return primaryVoltage / turnsRatio;
};

// Efficiency: η = (P_out / P_in) × 100%
const calculateEfficiency = (inputPower: number, outputPower: number) => {
  return (outputPower / inputPower) * 100;
};
```

## 🧪 Validation Architecture

### Input Validation
```typescript
const validateComponent = (component: CircuitComponent): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for valid values
  if (component.properties.resistance <= 0) {
    errors.push('Resistance must be positive');
  }
  
  // Check for safety limits
  if (component.properties.voltage > SAFETY_LIMITS.HIGH_VOLTAGE) {
    warnings.push('High voltage detected');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};
```

### Circuit Validation
```typescript
const validateCircuit = (components: CircuitComponent[]): ValidationResult => {
  // Check for voltage source
  const hasVoltageSource = components.some(comp => comp.type === 'battery');
  if (!hasVoltageSource) {
    errors.push('Circuit must have at least one voltage source');
  }
  
  // Check for closed loops
  const hasConnections = components.some(comp => comp.connections.length > 0);
  if (!hasConnections) {
    errors.push('Circuit components must be connected');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};
```

## 📤 Export Architecture

### Export Pipeline
```
Simulation Data → Format Conversion → File Generation → Download
```

### Supported Formats
- **JSON**: Complete simulation data
- **CSV**: Tabular component data
- **PDF**: Formatted report with diagrams
- **PNG/JPG**: Circuit diagrams
- **XML**: Structured data exchange
- **LaTeX**: Academic paper format

## 🔒 Security Architecture

### Input Sanitization
- Validate all user inputs
- Sanitize component properties
- Check for malicious values
- Limit input ranges

### Data Validation
- Type checking with TypeScript
- Runtime validation
- Boundary condition checks
- Error handling

## 🚀 Deployment Architecture

### Build Process
```
Source Code → TypeScript Compilation → React Build → Static Assets → Deployment
```

### Production Optimization
- Code splitting
- Tree shaking
- Asset optimization
- Compression
- Caching strategies

## 🔄 Update Architecture

### State Updates
```typescript
// Immutable updates
const updateComponent = (id: string, updates: Partial<CircuitComponent>) => {
  set(state => ({
    components: state.components.map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    )
  }));
};
```

### Re-rendering Strategy
- React's virtual DOM diffing
- Selective component updates
- Memoization for expensive calculations
- Debounced updates for real-time changes

## 📊 Monitoring Architecture

### Performance Metrics
- Frame rate monitoring
- Memory usage tracking
- Component count limits
- Render time measurement

### Error Handling
- Error boundaries for React components
- Try-catch blocks for calculations
- Validation error reporting
- User-friendly error messages

## 🔧 Configuration Architecture

### Environment Configuration
```typescript
const config = {
  development: {
    debugMode: true,
    performanceMonitoring: true,
    hotReload: true
  },
  production: {
    debugMode: false,
    performanceMonitoring: false,
    hotReload: false
  }
};
```

### Feature Flags
```typescript
const features = {
  enableAdvancedCalculations: true,
  enableExport: true,
  enableAnimations: true,
  enableSound: false
};
```

## 🎯 Future Architecture Considerations

### Scalability
- Microservices architecture
- Database integration
- User authentication
- Cloud deployment

### Extensibility
- Plugin system
- Custom components
- Third-party integrations
- API endpoints

### Performance
- Web Workers for calculations
- WebAssembly for heavy computations
- Service Workers for offline support
- CDN for asset delivery

---

This architecture provides a solid foundation for the Electrical Engineering 3D Simulator while maintaining flexibility for future enhancements and scalability.
