"use client"

import React, { useEffect, useRef } from "react"

interface Node {
  id: string
  x: number
  y: number
  z: number
  layer: number
  activation: number
  vx: number
  vy: number
  vz: number
}

interface Connection {
  fromId: string
  toId: string
  strength: number
  isActive: boolean
}

interface NeuralNetworkVisualizationProps {
  isProcessing: boolean
}

export function NeuralNetworkVisualization({ isProcessing }: NeuralNetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const connectionsRef = useRef<Connection[]>([])
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)

  // Initialize neural network
  useEffect(() => {
    const layerSizes = [5, 8, 12, 10, 8, 5]
    const newNodes: Node[] = []
    let nodeId = 0

    // Create nodes for each layer
    layerSizes.forEach((size, layer) => {
      for (let i = 0; i < size; i++) {
        const angle = (i / size) * Math.PI * 2
        const radius = 150 + layer * 60
        newNodes.push({
          id: `node-${nodeId}`,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: Math.random() * 100 - 50,
          layer,
          activation: Math.random() * 0.3,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          vz: (Math.random() - 0.5) * 0.5,
        })
        nodeId++
      }
    })

    // Create connections between adjacent layers using IDs instead of references
    const newConnections: Connection[] = []
    for (let layer = 0; layer < layerSizes.length - 1; layer++) {
      const currentLayerStart = layerSizes.slice(0, layer).reduce((a, b) => a + b, 0)
      const nextLayerStart = layerSizes.slice(0, layer + 1).reduce((a, b) => a + b, 0)
      const currentLayerSize = layerSizes[layer]
      const nextLayerSize = layerSizes[layer + 1]

      for (let i = 0; i < currentLayerSize; i++) {
        const connectionCount = Math.floor(Math.random() * 2) + 2
        for (let j = 0; j < connectionCount; j++) {
          const targetIdx = Math.floor(Math.random() * nextLayerSize)
          newConnections.push({
            fromId: `node-${currentLayerStart + i}`,
            toId: `node-${nextLayerStart + targetIdx}`,
            strength: Math.random() * 0.8 + 0.2,
            isActive: false,
          })
        }
      }
    }

    nodesRef.current = newNodes
    connectionsRef.current = newConnections
  }, [])

  // Update activations based on processing
  useEffect(() => {
    if (isProcessing) {
      const activationInterval = setInterval(() => {
        nodesRef.current = nodesRef.current.map((node) => ({
          ...node,
          activation: Math.max(0, node.activation - 0.02 + Math.random() * 0.08),
        }))
      }, 50)

      return () => clearInterval(activationInterval)
    } else {
      nodesRef.current = nodesRef.current.map((node) => ({
        ...node,
        activation: Math.max(0, node.activation - 0.05),
      }))
    }
  }, [isProcessing])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800
      canvas.height = canvas.parentElement?.clientHeight || 600
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const animate = () => {
      timeRef.current += 1

      ctx.fillStyle = "rgba(0, 0, 0, 0.08)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const nodes = nodesRef.current
      const connections = connectionsRef.current

      // Update node positions with gentle physics
      const updatedNodes = nodes.map((node) => ({
        ...node,
        x: node.x + node.vx * 0.1,
        y: node.y + node.vy * 0.1,
        z: node.z + node.vz * 0.1,
        vx: node.vx * 0.98 + (Math.random() - 0.5) * 0.01,
        vy: node.vy * 0.98 + (Math.random() - 0.5) * 0.01,
        vz: node.vz * 0.98 + (Math.random() - 0.5) * 0.01,
      }))

      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 1

      // Draw connections
      connections.forEach((conn) => {
        const fromNode = updatedNodes.find((n) => n.id === conn.fromId)
        const toNode = updatedNodes.find((n) => n.id === conn.toId)

        if (!fromNode || !toNode) return

        // Perspective projection
        const focalLength = 500
        const scale1 = focalLength / (focalLength + fromNode.z)
        const scale2 = focalLength / (focalLength + toNode.z)

        const x1 = canvas.width / 2 + fromNode.x * scale1
        const y1 = canvas.height / 2 + fromNode.y * scale1
        const x2 = canvas.width / 2 + toNode.x * scale2
        const y2 = canvas.height / 2 + toNode.y * scale2

        // Draw connection with varying opacity based on node activation
        const maxActivation = Math.max(fromNode.activation, toNode.activation)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + maxActivation * 0.3})`
        ctx.lineWidth = 0.5 + maxActivation * 1.2

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // Draw nodes
      updatedNodes.forEach((node) => {
        const focalLength = 500
        const scale = focalLength / (focalLength + node.z)
        const x = canvas.width / 2 + node.x * scale
        const y = canvas.height / 2 + node.y * scale

        const radius = 2 + node.activation * 4
        const glowRadius = radius + 3 + node.activation * 5

        // Glow effect - yellow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
        gradient.addColorStop(0, `rgba(250, 204, 21, ${0.2 * node.activation})`)
        gradient.addColorStop(1, "rgba(250, 204, 21, 0)")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
        ctx.fill()

        // Core node - white
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + node.activation * 0.4})`
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()

        // Highlight
        ctx.fillStyle = `rgba(250, 204, 21, ${0.5 * node.activation})`
        ctx.beginPath()
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw connection pulses during processing
      if (isProcessing) {
        const pulsePhase = (timeRef.current % 30) / 30
        const pulseSize = Math.sin(pulsePhase * Math.PI) * 0.5 + 0.5

        connections.slice(0, Math.floor(connections.length * (pulsePhase + 0.3))).forEach((conn) => {
          const fromNode = updatedNodes.find((n) => n.id === conn.fromId)
          const toNode = updatedNodes.find((n) => n.id === conn.toId)

          if (!fromNode || !toNode) return

          const focalLength = 500
          const scale1 = focalLength / (focalLength + fromNode.z)
          const scale2 = focalLength / (focalLength + toNode.z)

          const x1 = canvas.width / 2 + fromNode.x * scale1
          const y1 = canvas.height / 2 + fromNode.y * scale1
          const x2 = canvas.width / 2 + toNode.x * scale2
          const y2 = canvas.height / 2 + toNode.y * scale2

          // Interpolate along the line
          const lerpX = x1 + (x2 - x1) * pulsePhase
          const lerpY = y1 + (y2 - y1) * pulsePhase

          ctx.fillStyle = `rgba(250, 204, 21, ${0.6 * (1 - pulseSize)})`
          ctx.beginPath()
          ctx.arc(lerpX, lerpY, 3 * pulseSize, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      nodesRef.current = updatedNodes
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isProcessing])

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 right-6 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-foreground/60 uppercase tracking-wide font-semibold">Nodes</p>
            <p className="text-lg font-bold text-yellow-400">{nodesRef.current.length}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/60 uppercase tracking-wide font-semibold">Connections</p>
            <p className="text-lg font-bold text-yellow-400">{connectionsRef.current.length}</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs text-foreground/50">{isProcessing ? "🔴 Processing..." : "🟢 Idle"}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-6 right-6 bg-white/5 border border-white/10 rounded-lg p-2 backdrop-blur-sm max-w-xs">
        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Neural Network</p>
        <div className="space-y-1 text-xs text-foreground/60">
          <p>• Nodes represent neurons</p>
          <p>• Lines show synaptic connections</p>
          <p>• Brightness indicates activation</p>
        </div>
      </div>
    </div>
  )
}
