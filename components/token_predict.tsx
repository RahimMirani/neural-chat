"use client"

import { useState, useEffect, useRef } from "react"
import { Zap } from "lucide-react"
import { LogprobsData, TokenPrediction } from "./chat_ui"

interface TokenPredictionVisualizationProps {
  logprobsData: LogprobsData | null
  isProcessing: boolean
}

// Store full prediction data in history for replay
interface TokenHistoryEntry {
  token: string
  probability: number
  timestamp: number
  topTokens: TokenPrediction[] // Full predictions for this token
}

export function TokenPredictionVisualization({ 
  logprobsData, 
  isProcessing 
}: TokenPredictionVisualizationProps) {
  const [currentPredictions, setCurrentPredictions] = useState<TokenPrediction[]>([])
  const [chosenToken, setChosenToken] = useState<string>("")
  const [tokenHistory, setTokenHistory] = useState<TokenHistoryEntry[]>([])
  const [animatingBars, setAnimatingBars] = useState(false)
  const [tokenCount, setTokenCount] = useState(0)
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null) // For viewing past tokens
  const lastTimestampRef = useRef(0)

  // Process new logprobs data
  useEffect(() => {
    if (logprobsData && logprobsData.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = logprobsData.timestamp
      
      // Trigger bar animation
      setAnimatingBars(true)
      setTimeout(() => setAnimatingBars(false), 300)
      
      // Update current predictions
      setCurrentPredictions(logprobsData.topTokens)
      setChosenToken(logprobsData.chosenToken)
      setTokenCount(prev => prev + 1)
      
      // Clear history selection to follow live stream
      setSelectedHistoryIndex(null)
      
      // Add to history with full prediction data (keep last 50)
      setTokenHistory(prev => {
        const newEntry: TokenHistoryEntry = {
          token: logprobsData.chosenToken,
          probability: logprobsData.topTokens[0]?.probability || 0,
          timestamp: logprobsData.timestamp,
          topTokens: [...logprobsData.topTokens], // Store full predictions
        }
        return [newEntry, ...prev].slice(0, 50)
      })
    }
  }, [logprobsData])

  // Handle clicking on a history item
  const handleHistoryClick = (index: number) => {
    if (selectedHistoryIndex === index) {
      // Clicking same item deselects it (go back to live)
      setSelectedHistoryIndex(null)
      // Restore to latest live data if available
      if (tokenHistory.length > 0) {
        setCurrentPredictions(tokenHistory[0].topTokens)
        setChosenToken(tokenHistory[0].token)
      }
    } else {
      // Select this history item
      setSelectedHistoryIndex(index)
      const entry = tokenHistory[index]
      if (entry) {
        setCurrentPredictions(entry.topTokens)
        setChosenToken(entry.token)
        // Animate the bars
        setAnimatingBars(true)
        setTimeout(() => setAnimatingBars(false), 300)
      }
    }
  }

  // Reset when processing stops
  useEffect(() => {
    if (!isProcessing) {
      // Keep the last predictions visible for review
    }
  }, [isProcessing])

  // Format token for display (handle whitespace, special chars)
  const formatToken = (token: string): string => {
    if (token === " " || token === "  ") return "␣"
    if (token === "\n") return "↵"
    if (token === "\t") return "→"
    if (token.trim() === "") return `"${token}"`
    return token
  }

  // Get bar color based on probability
  const getBarColor = (prob: number, isChosen: boolean): string => {
    if (isChosen) {
      return "bg-gradient-to-r from-yellow-400 to-yellow-500"
    }
    if (prob > 30) return "bg-gradient-to-r from-green-500/80 to-green-400/80"
    if (prob > 15) return "bg-gradient-to-r from-cyan-500/60 to-cyan-400/60"
    if (prob > 5) return "bg-gradient-to-r from-blue-500/50 to-blue-400/50"
    return "bg-gradient-to-r from-white/20 to-white/30"
  }

  // Get glow effect for high probability tokens
  const getGlowClass = (prob: number, isChosen: boolean): string => {
    if (isChosen && prob > 50) return "shadow-lg shadow-yellow-400/40"
    if (isChosen) return "shadow-md shadow-yellow-400/30"
    return ""
  }

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden pt-14">
      {/* Header - with top padding to avoid overlap with tab buttons */}
      <div className="flex-shrink-0 border-b border-white/10 px-6 py-4 bg-black/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Token Predictions</h2>
              <p className="text-[12px] text-white/50 uppercase tracking-wider">
                Real-time probability distribution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-white/40">Tokens Generated</p>
              <p className="text-lg font-bold text-yellow-400 font-mono">{tokenCount}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${isProcessing ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Current Predictions */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Current Token Display */}
          {chosenToken ? (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className={`w-4 h-4 ${selectedHistoryIndex !== null ? "text-cyan-400" : "text-yellow-400"}`} />
                <span className="text-xs text-white/60 uppercase tracking-wider">
                  {selectedHistoryIndex !== null ? "Viewing Historical Token" : "Selected Token"}
                </span>
                {selectedHistoryIndex !== null && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-400 text-[10px] font-bold">
                    #{tokenHistory.length - selectedHistoryIndex} of {tokenHistory.length}
                  </span>
                )}
              </div>
              <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl ${
                selectedHistoryIndex !== null 
                  ? "bg-cyan-400/10 border-2 border-cyan-400/50" 
                  : "bg-yellow-400/10 border-2 border-yellow-400/50"
              } ${animatingBars ? "animate-pulse" : ""}`}>
                <span className={`text-2xl font-bold font-mono ${
                  selectedHistoryIndex !== null ? "text-cyan-400" : "text-yellow-400"
                }`}>
                  {formatToken(chosenToken)}
                </span>
                {currentPredictions[0] && (
                  <span className={`text-lg font-semibold ${
                    selectedHistoryIndex !== null ? "text-cyan-400/70" : "text-yellow-400/70"
                  }`}>
                    {currentPredictions[0].probability.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-lg text-white/40">Waiting for tokens...</span>
              </div>
            </div>
          )}

          {/* Probability Bars */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40 uppercase tracking-wider">Top 5 Candidates</span>
              <span className="text-xs text-white/30">Probability</span>
            </div>
            
            {currentPredictions.length > 0 ? (
              currentPredictions.map((pred, idx) => {
                const isChosen = pred.token === chosenToken
                return (
                  <div 
                    key={`${pred.token}-${idx}`}
                    className={`relative transition-all duration-300 ${animatingBars ? "scale-[1.02]" : "scale-100"}`}
                    style={{ transitionDelay: `${idx * 50}ms` }}
                  >
                    {/* Bar Background */}
                    <div className="relative h-12 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                      {/* Filled Bar */}
                      <div 
                        className={`absolute inset-y-0 left-0 ${getBarColor(pred.probability, isChosen)} ${getGlowClass(pred.probability, isChosen)} transition-all duration-500 ease-out`}
                        style={{ 
                          width: `${Math.max(2, pred.probability)}%`,
                          transitionDelay: `${idx * 30}ms`
                        }}
                      />
                      
                      {/* Content Overlay */}
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        {/* Rank & Token */}
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${isChosen ? "text-yellow-400" : "text-white/40"}`}>
                            #{idx + 1}
                          </span>
                          <span className={`font-mono text-sm font-semibold ${isChosen ? "text-white" : "text-white/80"}`}>
                            {formatToken(pred.token)}
                          </span>
                          {isChosen && (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 text-[10px] font-bold uppercase">
                              Selected
                            </span>
                          )}
                        </div>
                        
                        {/* Probability */}
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm font-bold ${isChosen ? "text-yellow-400" : "text-white/60"}`}>
                            {pred.probability.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              // Empty state
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-12 bg-white/5 rounded-lg border border-white/10 flex items-center px-4">
                  <span className="text-white/20 text-sm">—</span>
                </div>
              ))
            )}
          </div>

          {/* Explanation */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-white/40 leading-relaxed">
              <span className="text-yellow-400 font-semibold">How it works:</span> For each token, the model 
              calculates probabilities across its entire vocabulary (~100k tokens). The bars above show 
              the top 5 candidates and which one was selected.
            </p>
          </div>
        </div>

        {/* Right: Token History */}
        <div className="w-64 border-l border-white/10 bg-white/[0.02] flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Token History</h3>
            {selectedHistoryIndex === null && tokenHistory.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-green-400/20 text-green-400 text-[10px] font-bold uppercase animate-pulse">
                Live
              </span>
            )}
            {selectedHistoryIndex !== null && (
              <button 
                onClick={() => {
                  setSelectedHistoryIndex(null)
                  if (tokenHistory.length > 0) {
                    setCurrentPredictions(tokenHistory[0].topTokens)
                    setChosenToken(tokenHistory[0].token)
                  }
                }}
                className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-400 text-[10px] font-bold uppercase hover:bg-cyan-400/30 transition-colors cursor-pointer"
              >
                ← Back to Live
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {tokenHistory.length > 0 ? (
              tokenHistory.map((entry, idx) => {
                const isSelected = selectedHistoryIndex === idx
                const isLatest = idx === 0 && selectedHistoryIndex === null
                
                return (
                  <div 
                    key={entry.timestamp}
                    onClick={() => handleHistoryClick(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-cyan-400/20 border-2 border-cyan-400/50 scale-[1.02]" 
                        : isLatest 
                          ? "bg-yellow-400/10 border border-yellow-400/30" 
                          : "bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20"
                    }`}
                    style={{ 
                      opacity: isSelected ? 1 : 1 - (idx * 0.02),
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                      <span className={`font-mono text-sm ${
                        isSelected ? "text-cyan-400 font-bold" : isLatest ? "text-yellow-400 font-bold" : "text-white/70"
                      }`}>
                        {formatToken(entry.token)}
                      </span>
                    </div>
                    <span className={`text-xs ${
                      isSelected ? "text-cyan-400/70" : isLatest ? "text-yellow-400/70" : "text-white/40"
                    }`}>
                      {entry.probability.toFixed(0)}%
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-white/30 text-xs">No tokens yet</p>
                <p className="text-white/20 text-[10px] mt-1">Start a conversation to see predictions</p>
              </div>
            )}
          </div>
          
          {/* Stats Footer */}
          {tokenHistory.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10 bg-black/30">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Avg Confidence</span>
                <span className="text-cyan-400 font-mono">
                  {(tokenHistory.reduce((acc, t) => acc + t.probability, 0) / tokenHistory.length).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

