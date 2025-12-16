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
      // Clean white background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calculate network positions
      const width = canvas.width
      const height = canvas.height
      const layerCount = 3
      const layers = [3, 4, 3] // Input: 3, Hidden: 4, Output: 3
      
      const layerGap = width / (layerCount + 1)
      
      // Draw Connections first (so they are behind nodes)
      ctx.strokeStyle = "#e5e7eb" // Light gray for connections
      ctx.lineWidth = 2

      layers.forEach((nodeCount, layerIndex) => {
        if (layerIndex >= layers.length - 1) return // No connections from last layer

        const nextLayerCount = layers[layerIndex + 1]
        const currentX = layerGap * (layerIndex + 1)
        const nextX = layerGap * (layerIndex + 2)

        for (let i = 0; i < nodeCount; i++) {
          const currentY = (height / (nodeCount + 1)) * (i + 1)

          for (let j = 0; j < nextLayerCount; j++) {
            const nextY = (height / (nextLayerCount + 1)) * (j + 1)
            
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
          
          // Outer circle (border)
          ctx.beginPath()
          ctx.arc(x, y, 20, 0, Math.PI * 2)
          ctx.fillStyle = "#ffffff"
          ctx.fill()
          ctx.lineWidth = 2
          ctx.strokeStyle = "#000000"
          ctx.stroke()

          // Inner circle (activation hint)
          ctx.beginPath()
          ctx.arc(x, y, 15, 0, Math.PI * 2)
          ctx.fillStyle = "#f3f4f6" // Very light gray
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
      className="w-full h-full relative bg-white overflow-hidden"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}

