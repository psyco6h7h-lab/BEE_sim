# Electrical Engineering 3D Simulator - Setup Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.0 or higher
- **npm** 7.0 or higher (or yarn 1.22+)
- **Modern browser** with WebGL support (Chrome, Firefox, Safari, Edge)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd electrical-engineering-3d-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Development Setup

### Environment Configuration

Create a `.env` file in the root directory:
```env
# Development settings
REACT_APP_DEBUG_MODE=true
REACT_APP_PERFORMANCE_MONITORING=true
REACT_APP_HOT_RELOAD=true

# API endpoints (if needed)
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000/ws

# Feature flags
REACT_APP_ENABLE_ADVANCED_CALCULATIONS=true
REACT_APP_ENABLE_EXPORT=true
REACT_APP_ENABLE_ANIMATIONS=true
REACT_APP_ENABLE_SOUND=false
```

### Development Scripts

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Eject from Create React App (not recommended)
npm run eject

# Analyze bundle size
npm run analyze
```

### Code Quality Tools

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format
```

## 🏗️ Build Configuration

### Webpack Configuration
The project uses Create React App's default webpack configuration with the following customizations:

```javascript
// webpack.config.js (if ejected)
module.exports = {
  module: {
    rules: [
      {
        test: /\.(gltf|glb)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'assets/models/',
          },
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'assets/images/',
          },
        },
      },
    ],
  },
};
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

## 🎨 Styling Configuration

### Styled Components Setup
```typescript
// src/theme.ts
export const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#ef4444',
    background: '#0c0c0c',
    surface: '#1a1a2e',
    text: '#ffffff',
    textSecondary: '#9ca3af'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px'
  }
};
```

### CSS Variables
```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  --color-error: #ef4444;
  --color-background: #0c0c0c;
  --color-surface: #1a1a2e;
  --color-text: #ffffff;
  --color-text-secondary: #9ca3af;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --border-radius: 8px;
  --box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}
```

## 🧪 Testing Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/setupTests.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Setup
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock WebGL context
const mockWebGLContext = {
  getParameter: jest.fn(),
  createShader: jest.fn(),
  createProgram: jest.fn(),
  // ... other WebGL methods
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext);
```

## 🚀 Production Deployment

### Build Optimization
```bash
# Production build
npm run build

# Analyze bundle
npm run analyze

# Test production build locally
npm install -g serve
serve -s build
```

### Environment Variables for Production
```env
# Production settings
REACT_APP_DEBUG_MODE=false
REACT_APP_PERFORMANCE_MONITORING=false
REACT_APP_HOT_RELOAD=false

# API endpoints
REACT_APP_API_BASE_URL=https://api.example.com
REACT_APP_WS_URL=wss://api.example.com/ws

# Feature flags
REACT_APP_ENABLE_ADVANCED_CALCULATIONS=true
REACT_APP_ENABLE_EXPORT=true
REACT_APP_ENABLE_ANIMATIONS=true
REACT_APP_ENABLE_SOUND=false
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:16-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔧 Development Tools

### VS Code Configuration
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "html"
  }
}
```

### VS Code Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Git Hooks
```bash
# Install husky
npm install --save-dev husky lint-staged

# Setup pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## 🐛 Debugging

### Development Debugging
```typescript
// Enable React DevTools
if (process.env.NODE_ENV === 'development') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.parent.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

// Enable Three.js debugging
import { extend } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
extend({ OrbitControls });
```

### Performance Debugging
```typescript
// Performance monitoring
const performanceMonitor = {
  start: (name: string) => {
    performance.mark(`${name}-start`);
  },
  end: (name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
};
```

## 📱 Mobile Development

### Responsive Design
```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};
```

### Touch Controls
```typescript
// Touch event handling for 3D controls
const handleTouchStart = (event: TouchEvent) => {
  event.preventDefault();
  // Handle touch start
};

const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault();
  // Handle touch move
};

const handleTouchEnd = (event: TouchEvent) => {
  event.preventDefault();
  // Handle touch end
};
```

## 🔒 Security Considerations

### Content Security Policy
```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' ws: wss:;
">
```

### Input Validation
```typescript
// Sanitize user inputs
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

// Validate component properties
const validateComponentProperties = (properties: any): boolean => {
  return Object.values(properties).every(value => 
    typeof value === 'number' && !isNaN(value) && isFinite(value)
  );
};
```

## 📊 Monitoring and Analytics

### Performance Monitoring
```typescript
// Performance metrics
const performanceMetrics = {
  fps: 0,
  renderTime: 0,
  memoryUsage: 0,
  componentCount: 0
};

// Monitor performance
const monitorPerformance = () => {
  setInterval(() => {
    performanceMetrics.fps = calculateFPS();
    performanceMetrics.renderTime = measureRenderTime();
    performanceMetrics.memoryUsage = getMemoryUsage();
    performanceMetrics.componentCount = getComponentCount();
  }, 1000);
};
```

### Error Tracking
```typescript
// Error boundary
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }
}
```

---

This setup guide provides comprehensive instructions for developing, building, and deploying the Electrical Engineering 3D Simulator. Follow these steps to get started with the project.
