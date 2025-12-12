"use client"

import React, { useEffect, useRef, useState } from "react"

interface Node {
  id: string
  x: number
  y: number
  z: number
  layer: number
  activation: number
  bias: number
  isDragging?: boolean
  dragOffset?: { x: number; y: number }
}

interface Connection {
  fromId: string
  toId: string
  weight: number
  signalFlow: number // 0-1, represents signal currently flowing
}

interface NeuralNetworkVisualizationProps {
  isProcessing: boolean
  tokenEvent?: { id: number; token: string } | null
}

interface TokenPulse {
  id: number
  startTime: number
  intensity: number
  sourceNodes: string[]
  color: string
}

export function NeuralNetworkVisualization({ isProcessing, tokenEvent }: NeuralNetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<Node[]>([])
  const connectionsRef = useRef<Connection[]>([])
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)
  
  // 3D rotation state
  const [rotationX, setRotationX] = useState(-0.3)
  const [rotationY, setRotationY] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  
  // Zoom state
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  // Forward propagation state
  const propagationStepRef = useRef(0)
  
  // Network architecture state - user configurable
  const [layerSizes, setLayerSizes] = useState<number[]>([5, 8, 12, 10, 8, 5])
  const [isEditing, setIsEditing] = useState(false)
  
  // Edit mode temporary values
  const [editNodes, setEditNodes] = useState(48) // Total nodes
  const [editLayers, setEditLayers] = useState(6)
  const [editSpeed, setEditSpeed] = useState<"slow" | "fast">("slow")
  
  // Handle entering edit mode - initialize with current values
  const handleStartEdit = () => {
    setEditNodes(layerSizes.reduce((a, b) => a + b, 0))
    setEditLayers(layerSizes.length)
    setEditSpeed(pulseSpeed > 100 ? "slow" : "fast")
    setIsEditing(true)
  }
  
  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditing(false)
  }
  
  // Handle applying configuration changes
  const handleApplyConfig = () => {
    // Generate layer sizes: distribute nodes across layers in a pyramid shape
    const layers = editLayers
    const totalNodes = editNodes
    
    // Calculate weights for pyramid distribution (middle layers get more nodes)
    const weights: number[] = []
    const mid = (layers - 1) / 2
    for (let i = 0; i < layers; i++) {
      const distFromMid = Math.abs(i - mid)
      weights.push(1 + (mid - distFromMid) * 0.5)
    }
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    
    // Distribute nodes based on weights
    const newLayerSizes = weights.map(w => Math.max(3, Math.round((w / totalWeight) * totalNodes)))
    
    // Adjust to match exact total (add/remove from middle layer)
    const currentTotal = newLayerSizes.reduce((a, b) => a + b, 0)
    const diff = totalNodes - currentTotal
    const midIndex = Math.floor(layers / 2)
    newLayerSizes[midIndex] = Math.max(3, newLayerSizes[midIndex] + diff)
    
    // Apply changes
    setLayerSizes(newLayerSizes)
    setPulseSpeed(editSpeed === "slow" ? 150 : 60)
    setIsEditing(false)
  }
  
  // Pulse speed control (frames per pulse cycle - higher = slower)
  const [pulseSpeed, setPulseSpeed] = useState(120) // Slowed down from 60
  
  // Token pulse state for dramatic per-token visualization
  const tokenPulsesRef = useRef<TokenPulse[]>([])
  const lastTokenIdRef = useRef<number>(0)
  const [tokenCount, setTokenCount] = useState(0)


  // Initialize neural network - rebuilds when layerSizes changes
  useEffect(() => {
    const newNodes: Node[] = []
    let nodeId = 0

    // Create nodes for each layer in a more structured 3D layout
    layerSizes.forEach((size, layer) => {
      const layerZ = (layer - layerSizes.length / 2) * 120
      for (let i = 0; i < size; i++) {
        const angle = (i / size) * Math.PI * 2
        const radius = 80 + layer * 40
        newNodes.push({
          id: `node-${nodeId}`,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: layerZ + (Math.random() - 0.5) * 30,
          layer,
          activation: 0,
          bias: (Math.random() - 0.5) * 0.5,
        })
        nodeId++
      }
    })

    // Create fully connected layers (more realistic neural network)
    const newConnections: Connection[] = []
    for (let layer = 0; layer < layerSizes.length - 1; layer++) {
      const currentLayerStart = layerSizes.slice(0, layer).reduce((a, b) => a + b, 0)
      const nextLayerStart = layerSizes.slice(0, layer + 1).reduce((a, b) => a + b, 0)
      const currentLayerSize = layerSizes[layer]
      const nextLayerSize = layerSizes[layer + 1]

      // Fully connect layers (each node connects to all nodes in next layer)
      for (let i = 0; i < currentLayerSize; i++) {
        for (let j = 0; j < nextLayerSize; j++) {
          newConnections.push({
            fromId: `node-${currentLayerStart + i}`,
            toId: `node-${nextLayerStart + j}`,
            weight: (Math.random() - 0.5) * 2, // Weight between -1 and 1
            signalFlow: 0,
          })
        }
      }
    }

    nodesRef.current = newNodes
    connectionsRef.current = newConnections
    
    // Clear any active pulses when network changes
    tokenPulsesRef.current = []
  }, [layerSizes])

  // Forward propagation algorithm - simulates actual neural network computation
  const performForwardPropagation = () => {
    const nodes = nodesRef.current
    const connections = connectionsRef.current
    
    // Reset signal flow
    connections.forEach(conn => {
      conn.signalFlow = 0
    })

    // Initialize input layer with random activations (simulating input)
    const inputLayerNodes = nodes.filter(n => n.layer === 0)
    inputLayerNodes.forEach(node => {
      node.activation = Math.random() * 0.8 + 0.2 // Input activation
    })

    // Propagate through each layer
    for (let layer = 0; layer < layerSizes.length - 1; layer++) {
      const currentLayerNodes = nodes.filter(n => n.layer === layer)
      const nextLayerNodes = nodes.filter(n => n.layer === layer + 1)

      // For each node in the next layer, calculate weighted sum
      nextLayerNodes.forEach(nextNode => {
        let weightedSum = nextNode.bias

        // Sum weighted inputs from current layer
        currentLayerNodes.forEach(currentNode => {
          const conn = connections.find(
            c => c.fromId === currentNode.id && c.toId === nextNode.id
          )
          if (conn) {
            weightedSum += currentNode.activation * conn.weight
            // Set signal flow based on activation and weight
            conn.signalFlow = Math.abs(currentNode.activation * conn.weight)
          }
        })

        // Apply activation function (ReLU-like)
        nextNode.activation = Math.max(0, Math.min(1, weightedSum / 2))
      })
    }
  }

  // Trigger forward propagation when processing starts
  useEffect(() => {
    if (isProcessing) {
      propagationStepRef.current = 0
      // Reset token count for new response
      setTokenCount(0)
      lastTokenIdRef.current = 0
      tokenPulsesRef.current = []
      
      // Perform forward propagation multiple times during processing
      const propagationInterval = setInterval(() => {
        performForwardPropagation()
        propagationStepRef.current++
      }, 200) // Every 200ms

      return () => clearInterval(propagationInterval)
    } else {
      // Gradually decay activations when not processing
      const decayInterval = setInterval(() => {
        nodesRef.current = nodesRef.current.map(node => ({
          ...node,
          activation: Math.max(0, node.activation * 0.95),
        }))
        connectionsRef.current = connectionsRef.current.map(conn => ({
          ...conn,
          signalFlow: conn.signalFlow * 0.9,
        }))
      }, 50)

      return () => clearInterval(decayInterval)
    }
  }, [isProcessing])

  // Handle token pulse events - creates dramatic burst for each token
  useEffect(() => {
    if (tokenEvent && tokenEvent.id !== lastTokenIdRef.current) {
      lastTokenIdRef.current = tokenEvent.id
      setTokenCount(prev => prev + 1)
      
      // Generate a unique color based on token hash for variety
      const tokenHash = tokenEvent.token.split('').reduce((a, b) => {
        return a + b.charCodeAt(0)
      }, 0)
      
      const hue = (tokenHash * 37) % 360
      const colors = [
        `hsl(${hue}, 90%, 60%)`,
        `hsl(${(hue + 120) % 360}, 85%, 55%)`,
        `hsl(${(hue + 240) % 360}, 80%, 65%)`,
      ]
      const pulseColor = colors[tokenCount % colors.length]
      
      // Select random input nodes to be the source of this token's pulse
      const inputLayerEnd = layerSizes[0]
      const numSourceNodes = Math.min(3, inputLayerEnd)
      const sourceNodeIndices: number[] = []
      
      for (let i = 0; i < numSourceNodes; i++) {
        let idx: number
        do {
          idx = Math.floor(Math.random() * inputLayerEnd)
        } while (sourceNodeIndices.includes(idx))
        sourceNodeIndices.push(idx)
      }
      
      const sourceNodes = sourceNodeIndices.map(i => `node-${i}`)
      
      // Boost activation of source nodes
      nodesRef.current = nodesRef.current.map(node => {
        if (sourceNodes.includes(node.id)) {
          return { ...node, activation: Math.min(1, node.activation + 0.8) }
        }
        return node
      })
      
      // Create the pulse
      const newPulse: TokenPulse = {
        id: tokenEvent.id,
        startTime: timeRef.current,
        intensity: 1,
        sourceNodes,
        color: pulseColor,
      }
      
      tokenPulsesRef.current = [...tokenPulsesRef.current, newPulse]
      
      // Trigger a forward propagation for this token
      performForwardPropagation()
      
      // Clean up old pulses (keep last 10)
      if (tokenPulsesRef.current.length > 10) {
        tokenPulsesRef.current = tokenPulsesRef.current.slice(-10)
      }
    }
  }, [tokenEvent])

  // Mouse/touch handlers for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on a node
    const nodes = nodesRef.current
    const focalLength = 500
    const rotationXRad = rotationX
    const rotationYRad = rotationY

    for (const node of nodes) {
      // Rotate node position
      const cosX = Math.cos(rotationXRad)
      const sinX = Math.sin(rotationXRad)
      const cosY = Math.cos(rotationYRad)
      const sinY = Math.sin(rotationYRad)

      let rotatedX = node.x
      let rotatedY = node.y * cosX - node.z * sinX
      let rotatedZ = node.y * sinX + node.z * cosX

      const finalX = rotatedX * cosY + rotatedZ * sinY
      const finalY = rotatedY
      const finalZ = -rotatedX * sinY + rotatedZ * cosY

      const scale = (focalLength / (focalLength + finalZ)) * zoom
      const screenX = canvas.width / 2 + panOffset.x + finalX * scale
      const screenY = canvas.height / 2 + panOffset.y + finalY * scale

      const distance = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2)
      const nodeRadius = (3 + node.activation * 6) * zoom

      if (distance < nodeRadius * 2) {
        // Clicked on a node - start dragging
        setDraggedNodeId(node.id)
        setIsDragging(true)
        setDragStart({ x, y })
        nodesRef.current = nodesRef.current.map(n =>
          n.id === node.id
            ? { ...n, isDragging: true, dragOffset: { x: screenX - x, y: screenY - y } }
            : n
        )
        return
      }
    }

    // Not clicking on a node - start rotation
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    if (draggedNodeId) {
      // Dragging a node
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Update node position (simplified - would need inverse rotation for proper 3D)
      nodesRef.current = nodesRef.current.map(node => {
        if (node.id === draggedNodeId && node.dragOffset) {
          const focalLength = 500
          const rotationXRad = rotationX
          const rotationYRad = rotationY
          
          // Inverse rotation to get world coordinates
          const cosX = Math.cos(rotationXRad)
          const sinX = Math.sin(rotationXRad)
          const cosY = Math.cos(rotationYRad)
          const sinY = Math.sin(rotationYRad)
          
          // Calculate current screen position
          let rotatedX = node.x
          let rotatedY = node.y * cosX - node.z * sinX
          let rotatedZ = node.y * sinX + node.z * cosX
          const finalX = rotatedX * cosY + rotatedZ * sinY
          const finalY = rotatedY
          const finalZ = -rotatedX * sinY + rotatedZ * cosY
          
          const scale = (focalLength / (focalLength + finalZ)) * zoom
          const worldX = (x - panOffset.x - canvas.width / 2) / scale
          const worldY = (y - panOffset.y - canvas.height / 2) / scale
          
          // Inverse transform back to original space (simplified)
          const invFinalX = worldX * cosY - worldY * sinY
          const invFinalY = worldX * sinY + worldY * cosY
          const invRotatedX = invFinalX
          const invRotatedY = invFinalY * cosX + node.z * sinX
          
          return { ...node, x: invRotatedX, y: invRotatedY }
        }
        return node
      })
    } else {
      // Rotating view
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setRotationY(prev => prev + deltaX * 0.01)
      setRotationX(prev => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev - deltaY * 0.01)))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (draggedNodeId) {
      nodesRef.current = nodesRef.current.map(n =>
        n.id === draggedNodeId ? { ...n, isDragging: false, dragOffset: undefined } : n
      )
      setDraggedNodeId(null)
    }
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as React.MouseEvent)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as React.MouseEvent)
    }
  }

  // Mouse wheel handler for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    setMousePos({ x: mouseX, y: mouseY })

    // Calculate zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(3, zoom * zoomFactor))

    // Calculate the point under the mouse in world coordinates (before zoom)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const worldX = (mouseX - centerX - panOffset.x) / zoom
    const worldY = (mouseY - centerY - panOffset.y) / zoom

    // Calculate new pan offset to keep the point under mouse fixed
    const newPanX = mouseX - centerX - worldX * newZoom
    const newPanY = mouseY - centerY - worldY * newZoom

    setZoom(newZoom)
    setPanOffset({ x: newPanX, y: newPanY })
  }

  // Zoom in/out functions for buttons
  const handleZoomIn = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const newZoom = Math.min(3, zoom * 1.2)
    
    const worldX = (centerX - panOffset.x) / zoom
    const worldY = (centerY - panOffset.y) / zoom
    
    const newPanX = centerX - worldX * newZoom
    const newPanY = centerY - worldY * newZoom
    
    setZoom(newZoom)
    setPanOffset({ x: newPanX, y: newPanY })
  }

  const handleZoomOut = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const newZoom = Math.max(0.3, zoom * 0.8)
    
    const worldX = (centerX - panOffset.x) / zoom
    const worldY = (centerY - panOffset.y) / zoom
    
    const newPanX = centerX - worldX * newZoom
    const newPanY = centerY - worldY * newZoom
    
    setZoom(newZoom)
    setPanOffset({ x: newPanX, y: newPanY })
  }

  const handleResetZoom = () => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Animation loop with 3D rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800
      canvas.height = canvas.parentElement?.clientHeight || 600
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const rotate3D = (x: number, y: number, z: number) => {
      const cosX = Math.cos(rotationX)
      const sinX = Math.sin(rotationX)
      const cosY = Math.cos(rotationY)
      const sinY = Math.sin(rotationY)

      let rotatedX = x
      let rotatedY = y * cosX - z * sinX
      let rotatedZ = y * sinX + z * cosX

      const finalX = rotatedX * cosY + rotatedZ * sinY
      const finalY = rotatedY
      const finalZ = -rotatedX * sinY + rotatedZ * cosY

      return { x: finalX, y: finalY, z: finalZ }
    }

    const animate = () => {
      timeRef.current += 1

      // Clear with trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const nodes = nodesRef.current
      const connections = connectionsRef.current
      const focalLength = 500

      // Sort connections by depth for proper rendering
      const sortedConnections = [...connections].sort((a, b) => {
        const nodeA = nodes.find(n => n.id === a.fromId)
        const nodeB = nodes.find(n => n.id === b.fromId)
        if (!nodeA || !nodeB) return 0
        const posA = rotate3D(nodeA.x, nodeA.y, nodeA.z)
        const posB = rotate3D(nodeB.x, nodeB.y, nodeB.z)
        return posA.z - posB.z
      })

      // Update and clean token pulses
      const currentTime = timeRef.current
      const pulseDuration = pulseSpeed // Use configurable pulse speed
      tokenPulsesRef.current = tokenPulsesRef.current.filter(pulse => {
        const age = currentTime - pulse.startTime
        return age < pulseDuration // Pulses last pulseDuration frames
      })

      // Draw connections with signal flow
      sortedConnections.forEach((conn) => {
        const fromNode = nodes.find((n) => n.id === conn.fromId)
        const toNode = nodes.find((n) => n.id === conn.toId)

        if (!fromNode || !toNode) return

        const fromPos = rotate3D(fromNode.x, fromNode.y, fromNode.z)
        const toPos = rotate3D(toNode.x, toNode.y, toNode.z)

        const scale1 = (focalLength / (focalLength + fromPos.z)) * zoom
        const scale2 = (focalLength / (focalLength + toPos.z)) * zoom

        const x1 = canvas.width / 2 + panOffset.x + fromPos.x * scale1
        const y1 = canvas.height / 2 + panOffset.y + fromPos.y * scale1
        const x2 = canvas.width / 2 + panOffset.x + toPos.x * scale2
        const y2 = canvas.height / 2 + panOffset.y + toPos.y * scale2

        // Check if this connection is part of an active token pulse
        let pulseBoost = 0
        let pulseColor = ""
        tokenPulsesRef.current.forEach(pulse => {
          if (pulse.sourceNodes.includes(conn.fromId)) {
            const age = currentTime - pulse.startTime
            const progress = age / pulseDuration
            // Only boost connections in the appropriate layer based on pulse progress
            const targetLayer = Math.floor(progress * layerSizes.length)
            if (fromNode.layer === targetLayer || fromNode.layer === targetLayer - 1) {
              pulseBoost = Math.max(pulseBoost, (1 - progress) * 0.8)
              pulseColor = pulse.color
            }
          }
        })

        // Draw connection with signal flow
        const signalStrength = conn.signalFlow + pulseBoost
        const weightStrength = Math.abs(conn.weight)
        const opacity = 0.05 + signalStrength * 0.5 + weightStrength * 0.1
        const lineWidth = 0.5 + signalStrength * 3 + weightStrength * 0.5

        if (pulseBoost > 0.1 && pulseColor) {
          ctx.strokeStyle = pulseColor.replace(')', `, ${opacity})`).replace('hsl', 'hsla')
        } else {
          ctx.strokeStyle = conn.weight > 0 
            ? `rgba(34, 197, 94, ${opacity})` // Green for positive weights
            : `rgba(239, 68, 68, ${opacity})` // Red for negative weights
        }
        ctx.lineWidth = lineWidth

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Draw signal pulse along connection
        if (signalStrength > 0.1) {
          const pulsePhase = (timeRef.current % 20) / 20
          const pulseX = x1 + (x2 - x1) * pulsePhase
          const pulseY = y1 + (y2 - y1) * pulsePhase
          
          const pulseSize = 3 + pulseBoost * 5

          ctx.fillStyle = pulseColor || `rgba(250, 204, 21, ${signalStrength * 0.8})`
          ctx.beginPath()
          ctx.arc(pulseX, pulseY, pulseSize * signalStrength, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw token pulse shockwaves emanating from source nodes
      tokenPulsesRef.current.forEach(pulse => {
        const age = currentTime - pulse.startTime
        const progress = age / pulseDuration
        const waveRadius = progress * 300 * zoom
        const waveOpacity = (1 - progress) * 0.3
        
        pulse.sourceNodes.forEach(nodeId => {
          const node = nodes.find(n => n.id === nodeId)
          if (!node) return
          
          const pos = rotate3D(node.x, node.y, node.z)
          const scale = (focalLength / (focalLength + pos.z)) * zoom
          const x = canvas.width / 2 + panOffset.x + pos.x * scale
          const y = canvas.height / 2 + panOffset.y + pos.y * scale
          
          // Draw expanding ring
          ctx.strokeStyle = pulse.color.replace(')', `, ${waveOpacity})`).replace('hsl', 'hsla')
          ctx.lineWidth = 2 + (1 - progress) * 3
          ctx.beginPath()
          ctx.arc(x, y, waveRadius, 0, Math.PI * 2)
          ctx.stroke()
        })
      })

      // Sort nodes by depth
      const sortedNodes = [...nodes].sort((a, b) => {
        const posA = rotate3D(a.x, a.y, a.z)
        const posB = rotate3D(b.x, b.y, b.z)
        return posB.z - posA.z
      })

      // Draw nodes
      sortedNodes.forEach((node) => {
        const pos = rotate3D(node.x, node.y, node.z)
        const scale = (focalLength / (focalLength + pos.z)) * zoom
        const x = canvas.width / 2 + panOffset.x + pos.x * scale
        const y = canvas.height / 2 + panOffset.y + pos.y * scale

        // Check if this node is part of an active token pulse
        let nodePulseBoost = 0
        let nodePulseColor = ""
        tokenPulsesRef.current.forEach(pulse => {
          const age = currentTime - pulse.startTime
          const progress = age / pulseDuration
          const targetLayer = Math.floor(progress * layerSizes.length)
          
          // Boost nodes in the layer the pulse is currently passing through
          if (node.layer === targetLayer || node.layer === targetLayer + 1) {
            if (pulse.sourceNodes.includes(node.id) || 
                (node.layer > 0 && progress > node.layer / layerSizes.length)) {
              const layerProgress = (progress * layerSizes.length) - node.layer
              const boost = Math.max(0, 1 - Math.abs(layerProgress)) * 0.8
              if (boost > nodePulseBoost) {
                nodePulseBoost = boost
                nodePulseColor = pulse.color
              }
            }
          }
        })

        const effectiveActivation = Math.min(1, node.activation + nodePulseBoost)
        const radius = 3 + effectiveActivation * 8
        const glowRadius = radius + 6 + effectiveActivation * 12

        // Glow effect - enhanced when part of pulse
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
        if (nodePulseBoost > 0.1 && nodePulseColor) {
          // Use pulse color for glow
          gradient.addColorStop(0, nodePulseColor.replace(')', `, ${0.6 * effectiveActivation})`).replace('hsl', 'hsla'))
          gradient.addColorStop(0.4, nodePulseColor.replace(')', `, ${0.3 * effectiveActivation})`).replace('hsl', 'hsla'))
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
        } else {
          gradient.addColorStop(0, `rgba(250, 204, 21, ${0.4 * effectiveActivation})`)
          gradient.addColorStop(0.5, `rgba(250, 204, 21, ${0.15 * effectiveActivation})`)
          gradient.addColorStop(1, "rgba(250, 204, 21, 0)")
        }
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
        ctx.fill()

        // Core node - enhanced coloring
        let nodeColor: string
        if (nodePulseBoost > 0.2 && nodePulseColor) {
          nodeColor = nodePulseColor
        } else if (effectiveActivation > 0.5) {
          nodeColor = `rgba(34, 197, 94, ${0.8 + effectiveActivation * 0.2})` // Green for high activation
        } else {
          nodeColor = `rgba(250, 204, 21, ${0.6 + effectiveActivation * 0.4})` // Yellow for medium
        }
        ctx.fillStyle = nodeColor
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()

        // Highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * effectiveActivation})`
        ctx.beginPath()
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.35, 0, Math.PI * 2)
        ctx.fill()

        // Layer indicator - enhanced for input/output
        if (node.layer === 0 || node.layer === layerSizes.length - 1) {
          const indicatorColor = nodePulseBoost > 0.1 && nodePulseColor 
            ? nodePulseColor 
            : `rgba(250, 204, 21, ${0.5 + effectiveActivation * 0.5})`
          ctx.strokeStyle = indicatorColor
          ctx.lineWidth = 2 + nodePulseBoost * 2
          ctx.beginPath()
          ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
          ctx.stroke()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [rotationX, rotationY, zoom, panOffset, isProcessing, pulseSpeed, layerSizes])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Info Panel */}
      <div 
        className="absolute bottom-6 left-6 right-6 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-foreground/60 uppercase tracking-wide font-semibold">Nodes</p>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-yellow-400 w-8">{editNodes}</span>
                  <input
                    type="range"
                    min="12"
                    max="150"
                    value={editNodes}
                    onChange={(e) => setEditNodes(parseInt(e.target.value))}
                    className="w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>
              ) : (
                <p className="text-lg font-bold text-yellow-400">{layerSizes.reduce((a, b) => a + b, 0)}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-foreground/60 uppercase tracking-wide font-semibold">Connections</p>
              <p className="text-lg font-bold text-yellow-400/60">
                {isEditing ? "—" : layerSizes.slice(0, -1).reduce((acc, curr, i) => acc + curr * layerSizes[i + 1], 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60 uppercase tracking-wide font-semibold">Layers</p>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-yellow-400 w-8">{editLayers}</span>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={editLayers}
                    onChange={(e) => setEditLayers(parseInt(e.target.value))}
                    className="w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>
              ) : (
                <p className="text-lg font-bold text-yellow-400">{layerSizes.length}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-foreground/60 uppercase tracking-wide font-semibold">Tokens</p>
              <p className="text-lg font-bold text-cyan-400">{tokenCount}</p>
            </div>
          </div>
          
          {/* Edit/Apply/Cancel Buttons */}
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded text-foreground/80 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyConfig}
                className="px-3 py-1.5 text-xs bg-yellow-400 hover:bg-yellow-500 border border-yellow-400 rounded text-black font-semibold transition-colors"
              >
                Apply
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEdit}
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded text-foreground/80 hover:text-foreground transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        
        {/* Architecture Display */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground/50 mb-1">Architecture</p>
              <p className="text-xs font-mono text-yellow-400/80">{layerSizes.join(" → ")}</p>
            </div>
            
            {/* Speed Toggle/Display */}
            {isEditing ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-foreground/50 mr-2">Speed</span>
                <button
                  onClick={() => setEditSpeed("slow")}
                  className={`px-2 py-1 text-xs rounded-l border transition-colors ${
                    editSpeed === "slow"
                      ? "bg-cyan-400/20 border-cyan-400/50 text-cyan-400"
                      : "bg-white/5 border-white/20 text-foreground/50 hover:bg-white/10"
                  }`}
                >
                  Slow
                </button>
                <button
                  onClick={() => setEditSpeed("fast")}
                  className={`px-2 py-1 text-xs rounded-r border-t border-r border-b transition-colors ${
                    editSpeed === "fast"
                      ? "bg-cyan-400/20 border-cyan-400/50 text-cyan-400"
                      : "bg-white/5 border-white/20 text-foreground/50 hover:bg-white/10"
                  }`}
                >
                  Fast
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/50">Speed</span>
                <span className="text-xs text-cyan-400 font-medium">
                  {pulseSpeed > 100 ? "Slow" : "Fast"}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-foreground/50">
            {isProcessing ? "🔴 Processing..." : "🟢 Idle"}
          </p>
          {isProcessing && (
            <p className="text-xs text-cyan-400 animate-pulse">
              ⚡ Streaming tokens...
            </p>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div 
        className="absolute top-6 left-6 bg-white/5 border border-white/10 rounded-lg p-2 backdrop-blur-sm flex flex-col gap-2"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-foreground transition-colors text-sm font-bold"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-foreground transition-colors text-sm font-bold"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-foreground transition-colors text-xs"
          title="Reset Zoom"
        >
          ⌂
        </button>
        <div className="pt-1 border-t border-white/10">
          <p className="text-xs text-foreground/60 text-center">{Math.round(zoom * 100)}%</p>
        </div>
      </div>

      {/* Controls Legend */}
      <div 
        className="absolute top-6 right-6 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm max-w-xs"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Neural Network</p>
        <div className="space-y-1 text-xs text-foreground/60">
          <p>• Drag to rotate 3D view</p>
          <p>• Scroll to zoom (towards cursor)</p>
          <p>• Click nodes to drag them</p>
          <p>• Green = positive weights</p>
          <p>• Red = negative weights</p>
          <p>• Colored pulses = token streaming</p>
          <p>• Rings = signal propagation</p>
        </div>
      </div>
    </div>
  )
}
