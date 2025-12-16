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

      // Placeholder text
      ctx.fillStyle = "#000000"
      ctx.font = "20px monospace"
      ctx.textAlign = "center"
      ctx.fillText("Illustration Mode (Coming Soon)", canvas.width / 2, canvas.height / 2)

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

