"use client"

import React, { useState, useCallback } from "react"
import { ChatInterface } from "../components/chat_ui"
import { NeuralNetworkVisualization } from "../components/nn_ui"
import { NeuralNetworkIllustrative } from "../components/nn_illustrative"
import { BookOpen, Activity } from "lucide-react"

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [tokenEvent, setTokenEvent] = useState<{ id: number; token: string } | null>(null)
  const [chatWidth, setChatWidth] = useState(30)
  const [isDragging, setIsDragging] = useState(false)
  const [visualizationMode, setVisualizationMode] = useState<"interactive" | "illustration">("interactive")

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const container = document.getElementById("main-container")
    if (!container) return

    const rect = container.getBoundingClientRect()
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100

    if (newWidth > 20 && newWidth < 60) {
      setChatWidth(newWidth)
    }
  }

  // Handle new token events from chat
  const handleTokenReceived = useCallback((token: string) => {
    setTokenEvent({ id: Date.now(), token })
  }, [])

  return (
    <div
      id="main-container"
      className="h-screen w-screen bg-background overflow-hidden select-none"
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex h-full">
        {/* Left Panel - Chat (30% default, resizable) */}
        <div style={{ width: `${chatWidth}%` }} className="flex flex-col border-r border-border/50">
          <ChatInterface 
            onProcessingChange={setIsProcessing} 
            onTokenReceived={handleTokenReceived}
          />
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 bg-border hover:bg-yellow-400/50 cursor-col-resize transition-colors"
          style={{ userSelect: "none" }}
        />

        {/* Right Panel - Neural Network Visualization (70% default, resizable) */}
        <div style={{ width: `${100 - chatWidth}%` }} className="flex flex-col bg-background relative">
          {/* Mode Toggle */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button
              onClick={() => setVisualizationMode("interactive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                visualizationMode === "interactive"
                  ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
                  : "bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Interactive
            </button>
            <button
              onClick={() => setVisualizationMode("illustration")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                visualizationMode === "illustration"
                  ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
                  : "bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Learn
            </button>
          </div>

          {visualizationMode === "interactive" ? (
            <NeuralNetworkVisualization 
              isProcessing={isProcessing} 
              tokenEvent={tokenEvent}
            />
          ) : (
            <NeuralNetworkIllustrative />
          )}
        </div>
      </div>
    </div>
  )
}
