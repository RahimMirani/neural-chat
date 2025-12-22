"use client"

import React, { useState, useCallback, useEffect } from "react"
import { ChatInterface, LogprobsData } from "../components/chat_ui"
import { NeuralNetworkVisualization } from "../components/nn_ui"
import { NeuralNetworkIllustrative } from "../components/nn_illustrative"
import { TokenPredictionVisualization } from "../components/token_predict"
import { BookOpen, Activity, BarChart3, MessageSquare, Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [tokenEvent, setTokenEvent] = useState<{ id: number; token: string } | null>(null)
  const [logprobsData, setLogprobsData] = useState<LogprobsData | null>(null)
  const [chatWidth, setChatWidth] = useState(30)
  const [isDragging, setIsDragging] = useState(false)
  const [visualizationMode, setVisualizationMode] = useState<"interactive" | "illustration" | "tokens">("interactive")
  
  // Mobile specific state
  const isMobile = useIsMobile()
  const [mobileTab, setMobileTab] = useState<"chat" | "visuals">("chat")
  const { toast } = useToast()
  const [hasShownMobileToast, setHasShownMobileToast] = useState(false)

  // Show toast on mobile mount
  useEffect(() => {
    if (isMobile && !hasShownMobileToast) {
      toast({
        title: "Best Experience on Desktop",
        description: "For the full 3D neural network experience, please visit us on a computer.",
        duration: 5000,
      })
      setHasShownMobileToast(true)
    }
  }, [isMobile, hasShownMobileToast, toast])

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

  // Handle logprobs data for token prediction visualization
  const handleLogprobsReceived = useCallback((data: LogprobsData) => {
    setLogprobsData(data)
  }, [])

  return (
    <div
      id="main-container"
      className="h-screen w-screen bg-background overflow-hidden select-none flex flex-col md:flex-row"
      onMouseMove={isDragging ? handleMouseMove : undefined as any}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Mobile Tab Content Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Panel - Chat */}
        <div 
          style={!isMobile ? { width: `${chatWidth}%` } : undefined} 
          className={`
            flex flex-col border-r border-border/50 bg-background
            ${isMobile ? "w-full absolute inset-0 z-10" : "relative"}
            ${isMobile && mobileTab !== "chat" ? "hidden" : "flex"}
          `}
        >
          <ChatInterface 
            onProcessingChange={setIsProcessing} 
            onTokenReceived={handleTokenReceived}
            onLogprobsReceived={handleLogprobsReceived}
          />
        </div>

        {/* Resizable Divider (Desktop Only) */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDown}
            className="w-1 bg-border hover:bg-yellow-400/50 cursor-col-resize transition-colors z-20"
            style={{ userSelect: "none" }}
          />
        )}

        {/* Right Panel - Neural Network Visualization */}
        <div 
          style={!isMobile ? { width: `${100 - chatWidth}%` } : undefined} 
          className={`
            flex flex-col bg-background relative
            ${isMobile ? "w-full absolute inset-0 z-10" : "relative"}
            ${isMobile && mobileTab !== "visuals" ? "hidden" : "flex"}
          `}
        >
          {/* Mode Toggle */}
          <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
            <button
              onClick={() => setVisualizationMode("interactive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                visualizationMode === "interactive"
                  ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
                  : "bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Interactive</span>
            </button>
            <button
              onClick={() => setVisualizationMode("tokens")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                visualizationMode === "tokens"
                  ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
                  : "bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tokens</span>
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
              <span className="hidden sm:inline">Learn</span>
            </button>
          </div>

          {visualizationMode === "interactive" && (
            <NeuralNetworkVisualization 
              isProcessing={isProcessing} 
              tokenEvent={tokenEvent}
            />
          )}
          {visualizationMode === "illustration" && (
            <NeuralNetworkIllustrative isProcessing={isProcessing} />
          )}
          {visualizationMode === "tokens" && (
            <TokenPredictionVisualization 
              logprobsData={logprobsData}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="h-14 bg-background border-t border-border flex items-center justify-around px-4 z-50 shrink-0">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              mobileTab === "chat" ? "text-yellow-400" : "text-foreground/40"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <button
            onClick={() => setMobileTab("visuals")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              mobileTab === "visuals" ? "text-yellow-400" : "text-foreground/40"
            }`}
          >
            <Brain className="w-5 h-5" />
            <span className="text-[10px] font-medium">Visuals</span>
          </button>
        </div>
      )}
    </div>
  )
}
