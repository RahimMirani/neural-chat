"use client"

import React, { useRef, useEffect, useState } from "react"

interface TooltipState {
  x: number
  y: number
  title: string
  text: string
}

interface SelectedNodeState {
  layer: number
  index: number
  x: number
  y: number
}

interface NeuralNetworkIllustrativeProps {
  isProcessing: boolean
}

export function NeuralNetworkIllustrative({ isProcessing }: NeuralNetworkIllustrativeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [selectedNode, setSelectedNode] = useState<SelectedNodeState | null>(null)
  
  // Animation state
  const timeRef = useRef(0)
  const nodesRef = useRef<{x: number, y: number, r: number, layer: number, index: number}[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth
        canvas.height = containerRef.current.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const animate = () => {
      // Update animation time
      if (isProcessing) {
        timeRef.current += 0.05 // Slower, smoother speed
      } else {
        // Decay to closest integer to finish the current pulse, then stop
        const target = Math.ceil(timeRef.current)
        if (timeRef.current < target) {
             timeRef.current += 0.05
        }
      }

      // Dark background to match app theme
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calculate network positions
      const width = canvas.width
      const height = canvas.height
      const layers = [3, 4, 3] 
      
      const layerGap = width / (layers.length + 1)
      
      // Clear nodes for this frame
      nodesRef.current = []

      // Draw Connections first
      ctx.lineWidth = 2

      layers.forEach((nodeCount, layerIndex) => {
        if (layerIndex >= layers.length - 1) return

        const nextLayerCount = layers[layerIndex + 1]
        const currentX = layerGap * (layerIndex + 1)
        const nextX = layerGap * (layerIndex + 2)

        for (let i = 0; i < nodeCount; i++) {
          const currentY = (height / (nodeCount + 1)) * (i + 1)

          for (let j = 0; j < nextLayerCount; j++) {
            const nextY = (height / (nextLayerCount + 1)) * (j + 1)
            
            // IMPROVED WAVE LOGIC:
            const cycleLength = 4 
            const normalizedTime = timeRef.current % cycleLength
            
            const connectionPos = layerIndex + 0.5
            const dist = Math.abs(normalizedTime - connectionPos)
            const intensity = Math.max(0, 1 - (dist * 2)) 
            const isActive = intensity > 0.1 && isProcessing
            
            // Connection style
            if (isActive) {
                ctx.strokeStyle = `rgba(250, 204, 21, ${intensity})` // Variable opacity
                ctx.lineWidth = 1 + intensity * 2 // Thicker when active
            } else {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.1)" // Dim white
                ctx.lineWidth = 1
            }

            ctx.beginPath()
            ctx.moveTo(currentX, currentY)
            ctx.lineTo(nextX, nextY)
            ctx.stroke()

            // Educational: Show some weight values
            if (i === 1 && j === 1) { 
                const midX = (currentX + nextX) / 2
                const midY = (currentY + nextY) / 2
                
                ctx.fillStyle = isActive ? "rgba(250, 204, 21, 1)" : "rgba(255, 255, 255, 0.4)"
                ctx.font = "10px monospace"
                ctx.fillText("w: 0.5", midX, midY - 5)
            }
          }
        }
      })

      // Draw Nodes
      layers.forEach((nodeCount, layerIndex) => {
        const x = layerGap * (layerIndex + 1)
        
        // Draw Layer Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.font = "bold 14px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "alphabetic" 
        
        let label = "Hidden Layer"
        if (layerIndex === 0) label = "Input Layer"
        if (layerIndex === layers.length - 1) label = "Output Layer"
        
        ctx.fillText(label, x, 50)

        // Draw Flow Arrow between layers
        if (layerIndex < layers.length - 1) {
          const nextX = layerGap * (layerIndex + 2)
          const midX = (x + nextX) / 2
          const arrowY = height - 50 

          // Animate arrow color too
          const cycleLength = 4
          const normalizedTime = timeRef.current % cycleLength
          const arrowPos = layerIndex + 0.5
          const dist = Math.abs(normalizedTime - arrowPos)
          const arrowIntensity = Math.max(0.3, 1 - dist)

          ctx.fillStyle = `rgba(6, 182, 212, ${arrowIntensity * 0.5})`
          ctx.strokeStyle = `rgba(6, 182, 212, ${arrowIntensity})`
          ctx.lineWidth = 2
          
          // Arrow Line
          ctx.beginPath()
          ctx.moveTo(midX - 20, arrowY)
          ctx.lineTo(midX + 20, arrowY)
          ctx.stroke()
          
          // Arrow Head
          ctx.beginPath()
          ctx.moveTo(midX + 20, arrowY)
          ctx.lineTo(midX + 15, arrowY - 5)
          ctx.lineTo(midX + 15, arrowY + 5)
          ctx.fill()
          
          // Label
          ctx.fillStyle = `rgba(6, 182, 212, ${arrowIntensity})`
          ctx.font = "12px sans-serif"
          ctx.fillText("Forward Prop", midX, arrowY + 20)
        }
        
        for (let i = 0; i < nodeCount; i++) {
          const y = (height / (nodeCount + 1)) * (i + 1)
          const r = 25
          
          // Calculate activation based on wave
          const cycleLength = 4
          const normalizedTime = timeRef.current % cycleLength
          const dist = Math.abs(normalizedTime - layerIndex)
          const activation = isProcessing ? Math.max(0, 1 - dist * 1.5) : 0
          
          // Store for hit testing
          nodesRef.current.push({ x, y, r, layer: layerIndex, index: i })

          // Glow effect
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, r + 15)
          
          // Check if selected
          const isSelected = selectedNode?.layer === layerIndex && selectedNode?.index === i
          
          if (isSelected) {
             gradient.addColorStop(0, "rgba(6, 182, 212, 0.6)") // Cyan selection glow
          } else if (activation > 0.1) {
             gradient.addColorStop(0, `rgba(250, 204, 21, ${activation * 0.8})`) // Active Yellow Glow
          } else {
             gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)") 
          }
          gradient.addColorStop(1, "rgba(0,0,0,0)")
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, r + 15, 0, Math.PI * 2)
          ctx.fill()

          // Node border
          if (isSelected) {
             ctx.strokeStyle = "rgba(6, 182, 212, 1)"
             ctx.lineWidth = 3
          } else {
             ctx.strokeStyle = activation > 0.3 ? "rgba(250, 204, 21, 1)" : "rgba(255, 255, 255, 0.3)"
             ctx.lineWidth = activation > 0.3 ? 3 : 2
          }
          
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.stroke()

          // Inner fill
          ctx.fillStyle = "rgba(0, 0, 0, 0.9)"
          ctx.fill()

          // Educational: Show activation values (simulated)
          ctx.fillStyle = activation > 0.3 || isSelected ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.5)"
          ctx.font = "10px monospace"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          
          // Show "1.0" when active, random low value when not
          let val = activation > 0.1 ? activation.toFixed(1) : (Math.random() * 0.1).toFixed(1)
          
          ctx.fillText(val, x, y)
        }
      })

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [isProcessing, selectedNode]) // Add selectedNode to dependency

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Check nodes
    const hitNode = nodesRef.current.find(node => {
      const dx = mouseX - node.x
      const dy = mouseY - node.y
      return Math.sqrt(dx * dx + dy * dy) < node.r
    })

    if (hitNode) {
      // Don't show tooltip if we have a selection panel open (to avoid clutter)
      if (selectedNode) {
        setTooltip(null)
        return
      }

      let title = "Neuron"
      let text = "A computational unit."

      if (hitNode.layer === 0) {
        title = "Input Neuron"
        text = "Click to see input details."
      } else if (hitNode.layer === 1) {
        title = "Hidden Neuron"
        text = "Click to see the math."
      } else {
        title = "Output Neuron"
        text = "Click to see prediction math."
      }

      setTooltip({ x: mouseX + 20, y: mouseY, title, text })
    } else {
      setTooltip(null)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Check nodes
    const hitNode = nodesRef.current.find(node => {
      const dx = mouseX - node.x
      const dy = mouseY - node.y
      return Math.sqrt(dx * dx + dy * dy) < node.r
    })

    if (hitNode) {
        if (selectedNode?.layer === hitNode.layer && selectedNode?.index === hitNode.index) {
            setSelectedNode(null) // Toggle off
        } else {
            setSelectedNode({ layer: hitNode.layer, index: hitNode.index, x: hitNode.x, y: hitNode.y })
            setTooltip(null)
        }
    } else {
        setSelectedNode(null) // Click background to close
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative bg-black overflow-hidden"
    >
      <canvas 
        ref={canvasRef} 
        className="block cursor-crosshair" 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleClick}
      />
      
      {tooltip && !selectedNode && (
        <div 
            style={{ left: tooltip.x, top: tooltip.y }}
            className="absolute bg-black/90 border border-yellow-400/30 p-3 rounded-lg shadow-xl backdrop-blur-md max-w-xs pointer-events-none z-50"
        >
            <h4 className="text-yellow-400 font-bold text-xs mb-1 uppercase tracking-wider">{tooltip.title}</h4>
            <p className="text-white/80 text-xs leading-relaxed">{tooltip.text}</p>
        </div>
      )}

      {selectedNode && (
          <div 
            className="absolute bottom-6 right-6 w-80 bg-black/90 border border-cyan-400/50 p-4 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300"
          >
              <div className="flex justify-between items-start mb-3">
                  <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">
                      {selectedNode.layer === 0 ? "Input Neuron" : selectedNode.layer === 1 ? "Hidden Neuron Math" : "Output Neuron Math"}
                  </h3>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="text-white/40 hover:text-white"
                  >
                      ✕
                  </button>
              </div>

              {selectedNode.layer === 0 ? (
                  <div className="space-y-3">
                      <p className="text-white/80 text-xs">This neuron represents a specific feature of your input text.</p>
                      <div className="bg-white/5 p-2 rounded border border-white/10 font-mono text-xs text-yellow-400">
                          Value = {Math.random().toFixed(2)}
                      </div>
                  </div>
              ) : (
                  <div className="space-y-3">
                      <p className="text-white/60 text-xs mb-2">Each neuron sums up inputs from the previous layer, weighted by connection strength.</p>
                      
                      <div className="space-y-1 font-mono text-xs">
                          <div className="flex justify-between text-white/40">
                              <span>Weights (w)</span>
                              <span>Inputs (x)</span>
                          </div>
                          <div className="flex justify-between text-white/80 border-b border-white/10 pb-1">
                              <span>(0.5 × 0.2)</span>
                              <span className="text-yellow-400">0.10</span>
                          </div>
                          <div className="flex justify-between text-white/80 border-b border-white/10 pb-1">
                              <span>(0.8 × -0.1)</span>
                              <span className="text-red-400">-0.08</span>
                          </div>
                          <div className="flex justify-between text-white/80 border-b border-white/10 pb-1">
                              <span>(0.3 × 0.9)</span>
                              <span className="text-yellow-400">0.27</span>
                          </div>
                          
                          <div className="flex justify-between pt-2 font-bold">
                              <span className="text-cyan-400">Sum + Bias</span>
                              <span className="text-white">0.29</span>
                          </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/10">
                          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Activation Function (ReLU)</p>
                          <div className="flex items-center gap-2 bg-white/5 p-2 rounded">
                              <span className="text-white/60">Math.max(0, 0.29) = </span>
                              <span className="text-yellow-400 font-bold text-lg">0.29</span>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  )
}
