"use client"

import React, { useRef, useEffect, useState } from "react"

interface TooltipState {
  x: number
  y: number
  title: string
  text: string
}

interface NeuralNetworkIllustrativeProps {
  isProcessing: boolean
}

export function NeuralNetworkIllustrative({ isProcessing }: NeuralNetworkIllustrativeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  
  // Animation state
  const timeRef = useRef(0)
  const nodesRef = useRef<{x: number, y: number, r: number, layer: number}[]>([])

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
            // The wave moves from 0 to (layers.length - 1). 
            // We want it to loop every ~3 units of time.
            const cycleLength = 4 
            const normalizedTime = timeRef.current % cycleLength
            
            // Connection is "active" if the wave is passing between its layers
            // Connection is between layerIndex and layerIndex + 1
            // So peak activity is at layerIndex + 0.5
            const connectionPos = layerIndex + 0.5
            const dist = Math.abs(normalizedTime - connectionPos)
            
            // Use a Gaussian-like curve for smooth fade in/out
            const intensity = Math.max(0, 1 - (dist * 2)) // Sharpness of the pulse
            
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
        
        // ... Layer Labels (unchanged) ...
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
          
          // Activation logic: 
          // If close to the wave front, light up.
          const activation = isProcessing ? Math.max(0, 1 - dist * 1.5) : 0
          
          // Store for hit testing
          nodesRef.current.push({ x, y, r, layer: layerIndex })

          // Glow effect
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, r + 15)
          if (activation > 0.1) {
             gradient.addColorStop(0, `rgba(250, 204, 21, ${activation * 0.8})`) // Stronger glow
          } else {
             gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)") 
          }
          gradient.addColorStop(1, "rgba(0,0,0,0)")
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, r + 15, 0, Math.PI * 2)
          ctx.fill()

          // Node border
          ctx.strokeStyle = activation > 0.3 ? "rgba(250, 204, 21, 1)" : "rgba(255, 255, 255, 0.3)"
          ctx.lineWidth = activation > 0.3 ? 3 : 2
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.stroke()

          // Inner fill
          ctx.fillStyle = "rgba(0, 0, 0, 0.9)"
          ctx.fill()

          // Educational: Show activation values (simulated)
          ctx.fillStyle = activation > 0.3 ? "rgba(250, 204, 21, 1)" : "rgba(255, 255, 255, 0.5)"
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
  }, [isProcessing]) // Add isProcessing to dependency

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
      let title = "Neuron"
      let text = "A computational unit."

      if (hitNode.layer === 0) {
        title = "Input Neuron"
        text = "Receives raw data (numbers) from your input text."
      } else if (hitNode.layer === 1) {
        title = "Hidden Neuron"
        text = "Processes combinations of inputs to find patterns."
      } else {
        title = "Output Neuron"
        text = "Produces the final probability for the next token."
      }

      setTooltip({ x: mouseX + 20, y: mouseY, title, text })
    } else {
      setTooltip(null)
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
      />
      
      {tooltip && (
        <div 
            style={{ left: tooltip.x, top: tooltip.y }}
            className="absolute bg-black/90 border border-yellow-400/30 p-3 rounded-lg shadow-xl backdrop-blur-md max-w-xs pointer-events-none z-50"
        >
            <h4 className="text-yellow-400 font-bold text-xs mb-1 uppercase tracking-wider">{tooltip.title}</h4>
            <p className="text-white/80 text-xs leading-relaxed">{tooltip.text}</p>
        </div>
      )}
    </div>
  )
}
