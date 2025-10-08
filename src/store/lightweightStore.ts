import * as React from 'react';

// Lightweight state management without heavy Zustand dependency
interface LightweightState {
  currentScene: 'circuit' | 'motor' | 'transformer' | 'ohm' | 'kirchhoff';
  showGrid: boolean;
  isSimulationRunning: boolean;
  selectedTool: string;
}

class LightweightStateManager {
  private state: LightweightState = {
    currentScene: 'circuit',
    showGrid: true,
    isSimulationRunning: false,
    selectedTool: 'select'
  };

  private listeners: Set<(state: LightweightState) => void> = new Set();

  getState(): LightweightState {
    return { ...this.state };
  }

  setState(updates: Partial<LightweightState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  subscribe(listener: (state: LightweightState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Scene management
  setCurrentScene(scene: LightweightState['currentScene']): void {
    console.log('Store: setCurrentScene called with:', scene); // Debug log
    this.setState({ currentScene: scene });
  }

  // UI controls
  toggleGrid(): void {
    this.setState({ showGrid: !this.state.showGrid });
  }

  toggleDarkMode(): void {
    // no-op: theme is fixed to dark mode after design refresh
    this.notifyListeners();
  }

  // Simulation controls
  toggleSimulation(): void {
    this.setState({ isSimulationRunning: !this.state.isSimulationRunning });
  }

  setSelectedTool(tool: string): void {
    this.setState({ selectedTool: tool });
  }
}

// Singleton instance
export const lightweightStore = new LightweightStateManager();

// React hook for using the store
export function useLightweightStore(): [LightweightState, LightweightStateManager] {
  const [state, setState] = React.useState(lightweightStore.getState());

  React.useEffect(() => {
    return lightweightStore.subscribe(setState);
  }, []);

  return [state, lightweightStore];
}