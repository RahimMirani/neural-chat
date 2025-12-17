"use client"

import React, { useRef, useEffect } from "react"

export function NeuralNetworkIllustrative() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
      // Dark background to match app theme
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calculate network positions
      const width = canvas.width
      const height = canvas.height
      const layerCount = 3
      const layers = [3, 4, 3] // Input: 3, Hidden: 4, Output: 3
      
      const layerGap = width / (layerCount + 1)
      
      // Draw Connections first
      ctx.lineWidth = 2

      layers.forEach((nodeCount, layerIndex) => {
        const x = layerGap * (layerIndex + 1)
        
        // Draw Layer Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.font = "bold 14px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "alphabetic" // Reset baseline for standard text
        
        let label = "Hidden Layer"
        if (layerIndex === 0) label = "Input Layer"
        if (layerIndex === layers.length - 1) label = "Output Layer"
        
        ctx.fillText(label, x, 50)

        // Draw Flow Arrow between layers
        if (layerIndex < layers.length - 1) {
          const nextX = layerGap * (layerIndex + 2)
          const midX = (x + nextX) / 2
          const arrowY = height - 50 // Near bottom

          ctx.fillStyle = "rgba(6, 182, 212, 0.5)" // Cyan, semi-transparent
          ctx.strokeStyle = "rgba(6, 182, 212, 0.5)"
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
          ctx.fillStyle = "rgba(6, 182, 212, 0.8)"
          ctx.font = "12px sans-serif"
          ctx.fillText("Forward Prop", midX, arrowY + 20)
        }

        if (layerIndex >= layers.length - 1) return

        const nextLayerCount = layers[layerIndex + 1]
        const currentX = layerGap * (layerIndex + 1)
        const nextX = layerGap * (layerIndex + 2)

        for (let i = 0; i < nodeCount; i++) {
          const currentY = (height / (nodeCount + 1)) * (i + 1)

          for (let j = 0; j < nextLayerCount; j++) {
            const nextY = (height / (nextLayerCount + 1)) * (j + 1)
            
            // Subtle connection lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"
            ctx.beginPath()
            ctx.moveTo(currentX, currentY)
            ctx.lineTo(nextX, nextY)
            ctx.stroke()

            // Educational: Show some weight values
            if (i === 1 && j === 1) { // Pick a specific connection to label
                const midX = (currentX + nextX) / 2
                const midY = (currentY + nextY) / 2
                
                ctx.fillStyle = "rgba(250, 204, 21, 0.8)" // Yellow text
                ctx.font = "10px monospace"
                ctx.fillText("w: 0.5", midX, midY - 5)
            }
          }
        }
      })

      // Draw Nodes
      layers.forEach((nodeCount, layerIndex) => {
        const x = layerGap * (layerIndex + 1)
        
        for (let i = 0; i < nodeCount; i++) {
          const y = (height / (nodeCount + 1)) * (i + 1)
          
          // Glow effect
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25)
          gradient.addColorStop(0, "rgba(250, 204, 21, 0.2)") // Yellow glow
          gradient.addColorStop(1, "rgba(250, 204, 21, 0)")
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, 25, 0, Math.PI * 2)
          ctx.fill()

          // Node border
          ctx.strokeStyle = "rgba(250, 204, 21, 0.8)" // Yellow border
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(x, y, 12, 0, Math.PI * 2)
          ctx.stroke()

          // Inner fill
          ctx.fillStyle = "rgba(0, 0, 0, 0.9)"
          ctx.fill()

          // Educational: Show activation values (simulated)
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
          ctx.font = "10px monospace"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          
          let val = "0.0"
          if (layerIndex === 0) val = (0.2 + i * 0.3).toFixed(1) // Fake input values
          else val = (Math.random() * 0.9).toFixed(1) // Fake hidden values (flickering slightly is okay for now)
          
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
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative bg-black overflow-hidden"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}

