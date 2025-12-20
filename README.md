# Neural Chat

An interactive AI chat application that visualizes neural network processing in real-time. Features three distinct visualization modes to help users understand how LLMs work.

## Features

### 1. Interactive Mode (3D)
A visually immersive 3D visualization of a neural network.
- **Real-time Activation:** Watch neurons light up as the AI generates text.
- **Signal Flow:** Weighted connections pulse with activity.
- **Interactive Controls:** Rotate, zoom, and explore the network structure.

### 2. Token Predictions
See what the model is "thinking" as it generates each word.
- **Probability Bars:** Animated bar chart showing top 5 token candidates.
- **Live Streaming:** Predictions update in real-time as tokens are generated.
- **Token History:** Click any past token to review its probability distribution.

### 3. Learn Mode (2D)
A clean, educational view designed for understanding the math.
- **Math Reveal:** Click any neuron to see the exact calculation (Weighted Sum + Activation).
- **Synced Propagation:** Visual waves show how data flows from Input → Hidden → Output layers.
- **Explanations:** Tooltips explain the role of inputs, hidden features, and output probabilities.

## Tech Stack
- **Next.js 14** (App Router)
- **React** (Hooks & State)
- **Canvas API** (No heavy 3D libraries, pure performance)
- **OpenAI API** (GPT-4o mini)
- **Tailwind CSS**

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-...
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
