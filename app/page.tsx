"use client"

import React, { useState } from "react"
import { ChatInterface } from "../components/chat_ui"
import { NeuralNetworkVisualization } from "../components/nn_ui"

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [chatWidth, setChatWidth] = useState(30)
  const [isDragging, setIsDragging] = useState(false)

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
          <ChatInterface onProcessingChange={setIsProcessing} />
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 bg-border hover:bg-yellow-400/50 cursor-col-resize transition-colors"
          style={{ userSelect: "none" }}
        />

        {/* Right Panel - Neural Network Visualization (70% default, resizable) */}
        <div style={{ width: `${100 - chatWidth}%` }} className="flex flex-col bg-background">
          <NeuralNetworkVisualization isProcessing={isProcessing} />
        </div>
      </div>
    </div>
  )
}
