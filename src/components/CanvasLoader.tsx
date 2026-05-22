import { useProgress, Html } from '@react-three/drei'
import { useEffect, useState } from 'react'

export default function CanvasLoader() {
  const { active, progress } = useProgress()
  const [show, setShow] = useState(true)

  useEffect(() => {
    // If not active (nothing is loading/already cached) or progress is 100, hide loader
    if (!active || progress === 100) {
      const timer = setTimeout(() => {
        setShow(false)
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setShow(true)
    }
  }, [active, progress])

  if (!show) return null

  return (
    <Html
      center
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        background: 'transparent', // Transparent background to prevent covering the canvas
        color: '#ffffff',
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          background: 'rgba(5, 5, 5, 0.85)',
          padding: '2rem 3rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 51, 0, 0.25)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.8rem',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: '#fff',
            textShadow: '0 0 10px rgba(255, 51, 0, 0.5)',
            margin: 0,
          }}
        >
          Artificer
        </h2>
        
        {/* Loading Progress Bar Container */}
        <div
          style={{
            width: '200px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff3300, #ff8800)',
              boxShadow: '0 0 8px #ff3300',
              transition: 'width 0.1s ease-out',
            }}
          />
        </div>
        
        <span
          style={{
            fontSize: '0.8rem',
            color: '#a1a1a6',
            letterSpacing: '2px',
            fontWeight: 500,
          }}
        >
          SUMMONING THE PHOENIX... {Math.round(progress)}%
        </span>
      </div>
    </Html>
  )
}
