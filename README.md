# Neural Chat

An interactive AI chat application with real-time neural network visualization and an illustrative mode. Watch how neural networks process information as you chat with AI, featuring a fully interactive 3D neural network visualization that demonstrates forward propagation, signal flow, and network activations in real-time.

## Interactive Neural Network Visualization

- Real-time forward propagation showing actual neural network computation
- 3D visualization with full rotation capabilities
- Signal flow animation with weighted connections
- Interactive controls:
  - Drag to rotate the 3D view
  - Scroll to zoom (zooms towards cursor position)
  - Click and drag individual neurons to reposition them
  - Manual zoom controls with percentage display
- Visual indicators:
  - Green connections represent positive weights
  - Red connections represent negative weights
  - Node brightness indicates activation level
  - Animated signal pulses during processing
- Illustrative Mode:

## Neural Network Explanation

The visualization implements a simplified but realistic neural network architecture:

- **Architecture**: 6-layer fully connected network (5 → 8 → 12 → 10 → 8 → 5 neurons)
- **Forward Propagation**: Calculates weighted sums layer by layer and applies ReLU-like activation functions
- **Signal Flow**: Visualizes how information propagates through connections with weighted signal strength
- **Real-time Updates**: Activates during AI processing to demonstrate how neural networks compute responses

### Visual Elements

- **Nodes (Neurons)**: Represent individual neurons in the network
  - Size and brightness indicate activation level
  - Green glow indicates high activation
  - Yellow glow indicates medium activation
  
- **Connections**: Show synaptic connections between neurons
  - Green connections represent positive weights (excitatory)
  - Red connections represent negative weights (inhibitory)
  - Line thickness represents connection strength
  - Animated pulses show signal flow during processing

- **Layers**: The network processes information through multiple layers
  - Input layer (leftmost) receives the message
  - Hidden layers process and transform information
  - Output layer (rightmost) generates the response
