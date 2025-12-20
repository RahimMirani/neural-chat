import { streamText, convertToModelMessages } from "ai"
import { openai } from "@ai-sdk/openai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages are required", { status: 400 })
    }

    const prompt = convertToModelMessages(messages)

    const result = streamText({
      model: openai("gpt-4o-mini"), // Using OpenAI provider directly
      // Enable logprobs to get top 5 token alternatives for visualization
      providerOptions: {
        openai: {
          logprobs: true,
          topLogprobs: 5,
        },
      },
      system: `You are the AI assistant for "Neural Chat", an educational application that visualizes how neural networks work in real-time.
      
      Your goal is to help users understand neural networks, deep learning, and how the visualization on their screen relates to the concepts.
      
      CONTEXT ABOUT THE APP:
      1. Two Visualization Modes:
         - "Interactive Mode" (3D): A spinning, beautiful 3D network. Nodes glow yellow when active. Green lines = positive weights, Red lines = negative weights.
         - "Learn Mode" (2D): A clean, educational view. Users can click on neurons to see the actual math (Weighted Sum + ReLU).
      
      2. Key Visual Features:
         - "Forward Propagation": Blue/Cyan arrows showing data flowing from Input -> Hidden -> Output.
         - "Signal Waves": When you (the AI) generate text, yellow pulses travel through the network in real-time.
         - "Math Reveal": In Learn Mode, clicking a neuron shows the calculation: Σ(Input × Weight) + Bias.
      
      3. Terminology to use:
         - Input Layer: Receives the user's text features.
         - Hidden Layers: Extract patterns/meaning.
         - Output Layer: Predicts the next token (word) probability.
         - Activation Function: We use ReLU (rectified linear unit) for hidden layers.
      
      IMPORTANT INSTRUCTIONS:
      - Keep responses SHORT and direct.
      - Avoid filler words or polite fluff.
      - Only explain what is strictly necessary to answer the user's question.
      - Do not hallucinate features not listed above.`,
      messages: prompt, // Use the converted messages
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Error in chat route:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
