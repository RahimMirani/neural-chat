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

