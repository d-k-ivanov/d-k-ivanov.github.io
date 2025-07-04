# Fractal Explorer - WebGPU Educational Application

An interactive fractal visualization tool built with WebGPU to explore the mathematical beauty of Julia and Mandelbrot sets.

## Features

- **Dual-View Mode**: Side-by-side comparison of Mandelbrot and Julia sets
- **High-Performance Rendering**: WebGPU-powered real-time computation
- **Interactive Exploration**: Mouse and keyboard controls for navigation
- **Educational Design**: Clear visual feedback and mathematical precision
- **Responsive Interface**: Works across different screen sizes

## Project Structure

```
fractal-explorer/
├── main.js                    # Application entry point
├── src/
│   ├── core/                  # Core application logic
│   │   ├── Application.js     # Main application coordinator
│   │   ├── WebGPUContext.js   # WebGPU initialization and management
│   │   └── StateManager.js    # Application state management
│   ├── fractals/              # Fractal-specific implementations
│   │   ├── FractalRenderer.js # Main fractal rendering coordinator
│   │   ├── JuliaSet.js        # Julia set mathematics and logic
│   │   ├── MandelbrotSet.js   # Mandelbrot set mathematics and logic
│   │   └── DualViewManager.js # Dual-view mode coordination
│   ├── rendering/             # WebGPU rendering pipeline
│   │   ├── RenderPipeline.js  # WebGPU pipeline management
│   │   ├── BufferManager.js   # Uniform buffer management
│   │   ├── ColorPalette.js    # Color generation and palettes
│   │   └── CanvasManager.js   # Canvas setup and management
│   ├── interaction/           # User interaction handlers
│   │   ├── MouseHandler.js    # Mouse event processing
│   │   ├── KeyboardHandler.js # Keyboard event processing
│   │   ├── ZoomController.js  # Zoom and precision management
│   │   └── NavigationController.js # Pan and navigation logic
│   ├── ui/                    # User interface components
│   │   ├── CoordinateDisplay.js # Real-time coordinate display
│   │   ├── ModeDisplay.js     # Mode indicators and status
│   │   └── HelpOverlay.js     # Help and instructions
│   ├── math/                  # Mathematical utilities
│   │   ├── ComplexMath.js     # Complex number operations
│   │   ├── FractalMath.js     # Fractal-specific mathematics
│   │   └── PrecisionUtils.js  # High-precision calculations
│   ├── config/                # Configuration and constants
│   │   ├── DefaultSettings.js # Default parameters and settings
│   │   ├── RenderModes.js     # Render mode definitions
│   │   └── KeyBindings.js     # Keyboard shortcut mappings
│   ├── shaders/               # WebGPU shaders
│   │   ├── vertex.wgsl        # Vertex shader
│   │   ├── fractal.wgsl       # Fragment shader for fractals
│   │   └── ShaderLoader.js    # Shader loading utilities
│   └── utils/                 # General utilities
│       ├── EventEmitter.js    # Event system
│       ├── Performance.js     # Performance monitoring
│       └── BrowserSupport.js  # Browser compatibility detection
├── assets/                    # Static assets
│   ├── css/                   # Stylesheets
│   └── docs/                  # Documentation
└── tests/                     # Test suites
    ├── unit/                  # Unit tests
    └── integration/           # Integration tests
```

## Controls

- **Mouse**: 
  - Left click: Set Julia parameter (in dual mode)
  - Middle click + drag: Pan view
  - Wheel: Zoom in/out
- **Keyboard**:
  - `M`: Cycle render modes (Mandelbrot → Julia → Dual)
  - `J`: Toggle Julia mode with context awareness
  - `D`: Toggle dual view mode
  - `Tab`: Switch active view in dual mode
  - `R`: Reset parameters
  - `F`: Toggle fullscreen
  - Arrow keys: Navigate
  - `+/-`: Zoom in/out

## Browser Support

Requires WebGPU support:
- Chrome 113+ (enable `chrome://flags/#enable-unsafe-webgpu`)
- Firefox Nightly (enable `dom.webgpu.enabled`)
- Safari Technology Preview 163+
- Edge 113+ (enable `edge://flags/#enable-unsafe-webgpu`)

## Architecture Benefits

- **Modular Design**: Easy to understand and maintain individual components
- **Educational Value**: Clear separation of mathematical, rendering, and interaction concerns
- **Performance**: Optimized WebGPU pipeline with efficient buffer management
- **Extensibility**: Simple to add new fractal types or rendering features
- **Testability**: Each module can be tested independently
