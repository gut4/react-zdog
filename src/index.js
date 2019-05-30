import * as Zdog from 'zdog'
import React, { useContext, useRef, useEffect, useLayoutEffect, useState } from 'react'

export const illuContext = React.createContext()
export const parentContext = React.createContext()

function useMeasure() {
  const ref = useRef()
  const [bounds, set] = useState({ left: 0, top: 0, width: 0, height: 0 })
  const [ro] = useState(() => new ResizeObserver(([entry]) => set(entry.contentRect)))
  useEffect(() => {
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref.current])
  return [{ ref }, bounds]
}

function useZdog(primitive, children, props, initial = () => undefined) {
  const illu = useContext(illuContext)
  const parent = useContext(parentContext)
  const [node] = useState(() => new primitive({ ...initial(), ...props }))
  useLayoutEffect(() => void Zdog.extend(node, props))
  useLayoutEffect(() => {
    if (parent) {
      parent.addChild(node)
      //illu.updateRenderGraph()
      return () => {
        node.remove()
        //illu.updateRenderGraph()
      }
    }
  }, [parent])
  return [<parentContext.Provider value={node} children={children} />, node]
}

export const Illustration = React.memo(({ children, config, style, zoom = 1, ...rest }) => {
  const canvas = useRef()
  const canvasRef = useRef()
  const [bind, size] = useMeasure()
  const [result, node] = useZdog(Zdog.Anchor, children, rest)

  const state = useRef({})
  useEffect(() => {
    state.current.size = size
    state.current.zoom = zoom
  }, [size, zoom])

  useEffect(() => {
    canvas.current = canvasRef.current.getContext('2d')
  }, [])

  useEffect(() => {
    function animate() {
      node.updateGraph()
      render()
      requestAnimationFrame(animate)
    }

    function render() {
      const { size, zoom } = state.current
      if (size.width && size.height && zoom) {
        // clear canvas
        canvas.current.clearRect(0, 0, size.width, size.height)
        canvas.current.save()
        // center canvas & zoom
        canvas.current.translate(size.width / 2, size.height / 2)
        canvas.current.scale(zoom, zoom)
        // set lineJoin and lineCap to round
        canvas.current.lineJoin = 'round'
        canvas.current.lineCap = 'round'
        // render scene graph
        node.renderGraphCanvas(canvas.current)
        canvas.current.restore()
      }
    }

    animate()
  }, [])

  return (
    <div
      ref={bind.ref}
      {...rest}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} width={size.width} height={size.height} />
      <illuContext.Provider value={node} children={result} />
    </div>
  )
})

export const Anchor = React.memo(({ children, ...rest }) => {
  const [bind, size] = useMeasure()
  const [result] = useZdog(Zdog.Anchor, children, rest)
  return result
})

export const Ellipse = React.memo(({ children, ...rest }) => {
  const [bind, size] = useMeasure()
  const [result] = useZdog(Zdog.Ellipse, children, rest)
  return result
})

export const Shape = React.memo(({ children, ...rest }) => {
  const [bind, size] = useMeasure()
  const [result] = useZdog(Zdog.Shape, children, rest)
  return result
})
