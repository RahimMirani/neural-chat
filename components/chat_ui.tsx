"use client"

import React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Send, Brain } from "lucide-react"

// Type for token prediction data
export interface TokenPrediction {
  token: string
  logprob: number
  probability: number // Converted from logprob: Math.exp(logprob)
}

export interface LogprobsData {
  chosenToken: string
  topTokens: TokenPrediction[]
  timestamp: number
}

interface ChatInterfaceProps {
  onProcessingChange: (isProcessing: boolean) => void
  onTokenReceived?: (token: string) => void
  onLogprobsReceived?: (data: LogprobsData) => void
}

export function ChatInterface({ onProcessingChange, onTokenReceived, onLogprobsReceived }: ChatInterfaceProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastContentLengthRef = useRef(0)
  const lastLogprobsLengthRef = useRef(0) // Separate ref for logprobs tracking

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    onProcessingChange(status === "submitted" || status === "streaming")
  }, [status, onProcessingChange])

  // Detect new tokens by watching message content changes during streaming
  useEffect(() => {
    if (status === "streaming" && messages.length > 0 && onTokenReceived) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "assistant") {
        // Get the current content length
        const currentContent = lastMessage.parts
          .filter(part => part.type === "text")
          .map(part => (part as { type: "text"; text: string }).text)
          .join("")
        
        const currentLength = currentContent.length
        
        // If content grew, we received new tokens
        if (currentLength > lastContentLengthRef.current) {
          const newContent = currentContent.slice(lastContentLengthRef.current)
          // Emit token event for each character chunk (simulating tokens)
          onTokenReceived(newContent)
        }
        
        lastContentLengthRef.current = currentLength
      }
    } else if (status !== "streaming") {
      // Reset when not streaming
      lastContentLengthRef.current = 0
    }
  }, [messages, status, onTokenReceived])

  // Generate token predictions when new tokens arrive
  // This creates plausible alternative tokens for visualization
  useEffect(() => {
    if (status === "streaming" && messages.length > 0 && onLogprobsReceived) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "assistant") {
        const currentContent = lastMessage.parts
          .filter(part => part.type === "text")
          .map(part => (part as { type: "text"; text: string }).text)
          .join("")
        
        const currentLength = currentContent.length
        
        // If content grew, generate predictions for the new token
        if (currentLength > lastLogprobsLengthRef.current) {
          const newContent = currentContent.slice(lastLogprobsLengthRef.current)
          
          // Generate plausible alternative tokens based on context
          const generateAlternatives = (token: string): TokenPrediction[] => {
            // Common word alternatives for demonstration
            const alternatives: Record<string, string[]> = {
              "the": ["a", "an", "this", "that"],
              "is": ["was", "are", "will", "has"],
              "a": ["the", "an", "one", "some"],
              "to": ["for", "with", "into", "and"],
              "and": ["or", "but", "with", "then"],
              "of": ["for", "with", "from", "about"],
              "in": ["on", "at", "with", "for"],
              "that": ["which", "this", "what", "it"],
              "it": ["this", "that", "he", "she"],
              "for": ["to", "with", "about", "from"],
            }
            
            const cleanToken = token.toLowerCase().trim()
            const alts = alternatives[cleanToken] || ["...", "the", "and", "is"]
            
            // Generate probability distribution (chosen token gets highest)
            const chosenProb = 40 + Math.random() * 35 // 40-75%
            const remaining = 100 - chosenProb
            
            const predictions: TokenPrediction[] = [
              { token: token, logprob: Math.log(chosenProb / 100), probability: chosenProb }
            ]
            
            // Distribute remaining probability among alternatives
            let remainingProb = remaining
            alts.slice(0, 4).forEach((alt, i) => {
              const prob = i < 3 ? remainingProb * (0.5 - i * 0.1) : remainingProb
              remainingProb -= prob
              predictions.push({
                token: alt,
                logprob: Math.log(prob / 100),
                probability: Math.max(0.1, prob)
              })
            })
            
            return predictions.sort((a, b) => b.probability - a.probability).slice(0, 5)
          }
          
          // Split into word-like tokens and emit predictions
          const tokens = newContent.split(/(\s+)/).filter(t => t.length > 0)
          tokens.forEach(token => {
            if (token.trim()) {
              onLogprobsReceived({
                chosenToken: token,
                topTokens: generateAlternatives(token),
                timestamp: Date.now(),
              })
            }
          })
          
          // Update the ref after processing
          lastLogprobsLengthRef.current = currentLength
        }
      }
    } else if (status !== "streaming") {
      // Reset when not streaming
      lastLogprobsLengthRef.current = 0
    }
  }, [messages, status, onLogprobsReceived])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    sendMessage({ text: input })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSend(e as any)
    }
  }

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
             <Brain className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">
              Neural Chat
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${status === "streaming" ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
              {status === "streaming" ? "Processing" : "Ready"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container - Removed scrollbar visibility with custom scrollbar styling */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center space-y-6 max-w-sm">
              <div className="relative mx-auto w-20 h-20">
                 <div className="w-20 h-20 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shadow-2xl">
                     <Brain className="w-10 h-10 text-yellow-400" />
                 </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-foreground font-bold text-lg bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                  Welcome to Neural Chat
                </h2>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Ask me anything and watch the neural network come alive with real-time activations and signal propagation
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {["What are LLMs?", "Explain neural networks", "What's AI?"].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(suggestion)
                      inputRef.current?.focus()
                    }}
                    className="px-4 py-2 text-xs bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 rounded-full text-foreground/80 transition-all hover:scale-105 hover:border-yellow-400/50 cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, idx) => (
            <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-3 py-2 rounded-lg border text-xs leading-relaxed ${
                  message.role === "user"
                    ? "bg-yellow-400/15 border-yellow-400/40 text-foreground ml-auto"
                    : "bg-white/5 border-border/30 text-foreground"
                }`}
              >
                {message.parts.map((part, i) => (
                  <div key={i}>{part.type === "text" && part.text}</div>
                ))}
              </div>
            </div>
          ))
        )}

        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-border/30 rounded-lg px-3 py-2">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 p-3 bg-gradient-to-t from-yellow-400/5 to-transparent">
        <form onSubmit={handleSend} className="space-y-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Ctrl+Enter to send)"
            className="w-full bg-white/5 border border-border/40 rounded-md px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-yellow-400/60 focus:bg-white/10 transition-colors resize-none h-20"
          />
          <Button
            type="submit"
            disabled={status === "streaming" || !input.trim()}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold gap-2 h-9 text-sm disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
