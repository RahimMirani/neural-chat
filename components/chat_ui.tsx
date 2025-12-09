"use client"

import React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Zap } from "lucide-react"

interface ChatInterfaceProps {
  onProcessingChange: (isProcessing: boolean) => void
}

export function ChatInterface({ onProcessingChange }: ChatInterfaceProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    onProcessingChange(status === "in_progress")
  }, [status, onProcessingChange])

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3 bg-gradient-to-b from-yellow-400/5 to-transparent">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <div>
            <h1 className="text-sm font-semibold text-foreground">Neural Chat</h1>
            <p className="text-xs text-foreground/50">Real-time visualization</p>
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
        `}</style>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-foreground font-semibold text-sm mb-1">Welcome to Neural Chat</h2>
                <p className="text-foreground/60 text-xs max-w-xs">
                  Ask me anything and watch the neural network activate
                </p>
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

        {status === "in_progress" && (
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
            disabled={status === "in_progress" || !input.trim()}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold gap-2 h-9 text-sm disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
