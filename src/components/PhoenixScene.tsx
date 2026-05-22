import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Float, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import React, { useEffect, useRef, Suspense } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CanvasLoader from './CanvasLoader'

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger)

// Configure Draco decoder path globally from Google's static CDN
useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

// Custom Error Boundary for 3D Canvas Diagnostics
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (msg: string) => void },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('3D Canvas Crash Caught:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error?.message || String(error))
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(15, 5, 5, 0.95)',
          color: '#ffffff',
          padding: '1.2rem',
          borderRadius: '8px',
          zIndex: 999999,
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          border: '1px solid #ff3300',
          boxShadow: '0 0 30px rgba(255, 51, 0, 0.3)',
          maxWidth: '400px',
          pointerEvents: 'auto',
        }}>
          <strong style={{ color: '#ff3300', display: 'block', marginBottom: '0.4rem' }}>
            3D ENGINE ERROR
          </strong>
          <p style={{ margin: 0, wordBreak: 'break-all', color: '#a1a1a6', lineHeight: '1.4' }}>
            {this.state.error?.message || String(this.state.error)}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

interface AnimatedBone {
  bone: THREE.Object3D
  depth: number
  x: number
  y: number
  z: number
}

// Inner Content Component sitting inside R3F Canvas
function PhoenixSceneContent() {
  const phoenixGroupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/phoenix.glb')
  const [scale, setScale] = React.useState<number | null>(null)

  // Skeletal Bone References
  const leftWingBones = useRef<AnimatedBone[]>([])
  const rightWingBones = useRef<AnimatedBone[]>([])
  const tailBones = useRef<AnimatedBone[]>([])
  const neckBones = useRef<AnimatedBone[]>([])
  const headBoneRef = useRef<AnimatedBone | null>(null)
  const hairBones = useRef<AnimatedBone[]>([])

  // Dynamic Lighting Refs for Interactive Hover States
  const rimLightRef = useRef<THREE.SpotLight>(null)
  const keyLightRef = useRef<THREE.DirectionalLight>(null)

  // Listen to interactive hover states from the Projects overlay panel
  useEffect(() => {
    const handleHover = (e: Event) => {
      const customEvent = e as CustomEvent
      const project = customEvent.detail

      if (project === 'redsea') {
        // Project REDSEA (AI & ML research) - Intensify ice-blue halo rim lighting
        if (rimLightRef.current) {
          gsap.to(rimLightRef.current, {
            intensity: 45.0,
            angle: 0.38,
            duration: 0.4,
            ease: 'power2.out',
          })
          gsap.to(rimLightRef.current.color, {
            r: 0.75,
            g: 0.92,
            b: 1.0,
            duration: 0.4,
          })
        }
        if (keyLightRef.current) {
          gsap.to(keyLightRef.current, {
            intensity: 0.8, // Dim key light to make the rim halo glow dramatically
            duration: 0.4,
            ease: 'power2.out',
          })
        }
      } else if (project === 'nexturn') {
        // Nexturn Connect (Platform architecture) - Stark, bright key-lighting to outline structures
        if (rimLightRef.current) {
          gsap.to(rimLightRef.current, {
            intensity: 32.0,
            angle: 0.5,
            duration: 0.4,
            ease: 'power2.out',
          })
          gsap.to(rimLightRef.current.color, {
            r: 1.0,
            g: 1.0,
            b: 1.0,
            duration: 0.4,
          })
        }
        if (keyLightRef.current) {
          gsap.to(keyLightRef.current, {
            intensity: 3.5, // Bright key light to reveal every polished graphite feather vector
            duration: 0.4,
            ease: 'power2.out',
          })
        }
      } else {
        // Restore standard museum studio gallery lighting levels
        if (rimLightRef.current) {
          gsap.to(rimLightRef.current, {
            intensity: 15.0,
            angle: 0.5,
            duration: 0.6,
            ease: 'power2.out',
          })
          gsap.to(rimLightRef.current.color, {
            r: 1.0,
            g: 1.0,
            b: 1.0,
            duration: 0.6,
          })
        }
        if (keyLightRef.current) {
          gsap.to(keyLightRef.current, {
            intensity: 2.0,
            duration: 0.6,
            ease: 'power2.out',
          })
        }
      }
    }

    window.addEventListener('project-hover', handleHover)
    return () => {
      window.removeEventListener('project-hover', handleHover)
    }
  }, [])

  useEffect(() => {
    if (!scene) return

    // 1. Calculate bounding box using THREE's native robust setFromObject.
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    console.log('Phoenix Mesh Bounds Size:', [size.x, size.y, size.z])

    const maxDim = Math.max(size.x, size.y, size.z)
    let scaleFactor = 8.0 / 963.8 // safe fallback
    if (maxDim > 0) {
      scaleFactor = 8.0 / maxDim
    }
    console.log('Phoenix Calculated Scale Factor:', scaleFactor)
    setScale(scaleFactor)

    // 2. Bone traversal and dynamic hierarchy depth calculations
    const leftBones: AnimatedBone[] = []
    const rightBones: AnimatedBone[] = []
    const tBones: AnimatedBone[] = []
    const nBones: AnimatedBone[] = []
    let hBone: AnimatedBone | null = null
    const hrBones: AnimatedBone[] = []

    scene.traverse((child) => {
      const name = child.name
      if (name.startsWith('B_') || name.startsWith('b_')) {
        // Calculate skeletal depth dynamically by climbing up the bone parent hierarchy.
        let depth = 0
        let p = child.parent
        while (p && (p.name.startsWith('B_') || p.name.startsWith('b_'))) {
          depth++
          p = p.parent
        }

        const boneData: AnimatedBone = {
          bone: child,
          depth,
          x: child.rotation.x,
          y: child.rotation.y,
          z: child.rotation.z,
        }

        if (name.startsWith('B_Left_Wing_')) {
          leftBones.push(boneData)
        } else if (name.startsWith('B_Right_Wing_')) {
          rightBones.push(boneData)
        } else if (name.startsWith('B_Tail_')) {
          tBones.push(boneData)
        } else if (name.startsWith('b_Neck_')) {
          nBones.push(boneData)
        } else if (name === 'b_Head_06') {
          hBone = boneData
        } else if (name.startsWith('B_Hair_') || name.startsWith('b_Hair_')) {
          hrBones.push(boneData)
        }
      }
    })

    // Store parsed systems inside refs
    leftWingBones.current = leftBones
    rightWingBones.current = rightBones
    tailBones.current = tBones
    neckBones.current = nBones
    headBoneRef.current = hBone
    hairBones.current = hrBones

    // 3. Perform in-place material modification to upgrade to a premium Polished Obsidian / Dark Glass Material.
    // Preserves all original high-fidelity textures (feathers, alpha cutouts, normals) while applying
    // a high-gloss, liquid-smooth physical surface with rich clearcoat reflections.
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = false
        mesh.receiveShadow = false

        if (mesh.material) {
          const originalMat = mesh.material as THREE.MeshStandardMaterial
          
          const newMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#3d3d3d'), // Lifted slightly from #2d2d2d to #3d3d3d for sculpted dark, polished metal look
            metalness: 0.95, // Increased slightly to give a richer, more polished metal feel
            roughness: 0.2, // Sharpened brush roughness for high-end metal sheens
            clearcoat: 1.0, // Sleek premium lacquer clearcoat
            clearcoatRoughness: 0.05, // Extra smooth premium clearcoat
            side: THREE.DoubleSide,
            
            // Turn off blending to completely resolve hollow sorting glitches
            transparent: false,
            depthWrite: true,
            depthTest: true,
            alphaTest: 0.3,
          })

          // Copy original high-fidelity maps (preserves feathers, details, and normal curves)
          if (originalMat.map) newMat.map = originalMat.map
          if (originalMat.alphaMap) newMat.alphaMap = originalMat.alphaMap
          if (originalMat.normalMap) newMat.normalMap = originalMat.normalMap
          if (originalMat.roughnessMap) newMat.roughnessMap = originalMat.roughnessMap
          if (originalMat.metalnessMap) newMat.metalnessMap = originalMat.metalnessMap

          // Apply upgraded material
          mesh.material = newMat
        }
      }
    })

    // Trigger ScrollTrigger refresh after rendering to adjust timeline heights
    setTimeout(() => {
      ScrollTrigger.refresh()
    }, 100)
  }, [scene])

  // R3F frame loop driving organic bone flapping and multiaxial sways
  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // 1. Fluid, waving wing flap
    const speed = 4.2
    const amplitude = 0.22

    leftWingBones.current.forEach(({ bone, depth, x, z }) => {
      // Phase shifts down the wing tip
      const phaseOffset = depth * 0.22
      const wave = Math.sin(time * speed - phaseOffset) * amplitude
      bone.rotation.z = z + wave
      bone.rotation.x = x + wave * 0.15
    })

    rightWingBones.current.forEach(({ bone, depth, x, z }) => {
      const phaseOffset = depth * 0.22
      const wave = Math.sin(time * speed - phaseOffset) * amplitude
      // Mirror Z-axis flap and roll on the right side
      bone.rotation.z = z - wave
      bone.rotation.x = x - wave * 0.15
    })

    // 2. Snake-like horizontal tail feather sway
    tailBones.current.forEach(({ bone, depth, y, z }) => {
      const phaseOffset = depth * 0.35
      const wave = Math.sin(time * 2.2 - phaseOffset) * 0.12
      bone.rotation.y = y + wave
      bone.rotation.z = z + wave * 0.5
    })

    // 3. Gentle neck breathing/head stabilization sways
    neckBones.current.forEach(({ bone, depth, x }) => {
      const phaseOffset = depth * 0.18
      const wave = Math.sin(time * 1.5 - phaseOffset) * 0.03
      bone.rotation.x = x + wave
    })

    if (headBoneRef.current) {
      const { bone, x } = headBoneRef.current
      bone.rotation.x = x + Math.sin(time * 1.5) * 0.02
    }

    // 4. Breathtaking fluid sways for flowing hair & feather crests (B_Hair_ bones)
    // Ensures all secondary wing/tail plumage planes move dynamically and feel alive.
    hairBones.current.forEach(({ bone, depth, y, z }) => {
      const phaseOffset = depth * 0.3
      const waveY = Math.sin(time * 1.8 - phaseOffset) * 0.08
      const waveZ = Math.cos(time * 1.8 - phaseOffset) * 0.05
      bone.rotation.y = y + waveY
      bone.rotation.z = z + waveZ
    })
  })

  useEffect(() => {
    // Only initialize GSAP ScrollTrigger timeline when scale is resolved and group ref is mounted.
    if (scale === null || !phoenixGroupRef.current) return

    console.log('Initializing continuous, screen-optimized ScrollTrigger with Dwell plateaus...')
    const ctx = gsap.context(() => {
      const group = phoenixGroupRef.current!

      // Create a fluid scroll-scrubbed GSAP timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#portfolio-container', // Main DOM container track
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5, // Reduced from 1.0 to 0.5 for much snappier, instant-feeling feedback and zero jitter
        },
      })

      // Structured timeline layout with Dwell plateaus to align perfectly with scroll text cards
      // Time values from 0.0s to 4.0s map to scroll percent 0% to 100%

      // --- POSITION PATH ---
      // 0. Enforce initial Hero pose at Scroll = 0 (Facing forward, front side visible)
      tl.set(group.position, { x: 0, y: 0.2, z: 1.0 }, 0)
      
      // 1. Dwell in Hero (0 to 0.15s), then sweep to Projects (Positioned massive on the far right to clear left text cards)
      .to(group.position, {
        x: 4.2,             // Shift further right to fully clear left-aligned projects card
        y: 0.2,             // Centered vertically
        z: 2.2,             // Zoomed in closer to the camera to make it massive and highly detailed
        ease: 'power2.inOut',
        duration: 0.7,
      }, 0.15)

      // 2. Dwell in Projects (0.85s to 1.15s), then sweep to About (Left, Zoomed In Close-up)
      .to(group.position, {
        x: -2.8,            // Shift further left to clear right-aligned about card
        y: -0.1,            // Keep centered vertically
        z: 1.4,             // Zoom in close-up for spectacular detail
        ease: 'power2.inOut',
        duration: 0.7,
      }, 1.15)

      // 3. Dwell in About (1.85s to 2.15s), then sweep to Contact (Center, Zoomed Out behind form)
      .to(group.position, {
        x: 0,               // Return center
        y: 0.4,             // Perfectly align behind glass contact form
        z: -2.8,            // Zoom out behind glass card
        ease: 'power2.inOut',
        duration: 0.7,
      }, 2.15)

      // 4. Dwell in Contact (2.85s to 3.15s), then plunge into the deep dark abyss
      .to(group.position, {
        x: 0,
        y: -3.5,            // Steep downward dive
        z: -12.0,           // Epic deep-dive straight back into pitch black abyss
        ease: 'power2.in',
        duration: 0.85,
      }, 3.15)

      // --- ROTATION PATH ---
      // 0. Enforce initial Hero rotation at Scroll = 0 (Centering Y rotation around 0 so face points directly forward)
      tl.set(group.rotation, { x: 0.05, y: -0.2, z: 0 }, 0)

      // 1. Sweep rotation: Pitch slightly forward, turn diagonally left towards projects cards (y = -Math.PI * 0.25), bank LEFT (positive Z)
      .to(group.rotation, {
        x: 0.1,
        y: -Math.PI * 0.25, // Turn diagonally forward-left to face projects cards
        z: 0.12,            // Aerodynamically correct bank LEFT
        ease: 'power2.inOut',
        duration: 0.7,
      }, 0.15)

      // 2. Sweep rotation: Turn diagonally right towards about text (y = Math.PI * 0.25), bank RIGHT (negative Z)
      .to(group.rotation, {
        x: 0.05,
        y: Math.PI * 0.25,  // Turn diagonally forward-right to face about text
        z: -0.12,           // Aerodynamically correct bank RIGHT
        ease: 'power2.inOut',
        duration: 0.7,
      }, 1.15)

      // 3. Sweep rotation: Graceful sweeping turn to face directly towards user (y = Math.PI * 2.0)
      .to(group.rotation, {
        x: 0.12,
        y: Math.PI * 2.0,   // Face directly forward to the user behind the form (completing a gorgeous 360 spin from projects/about)
        z: 0,               // Level wings, stable hover
        ease: 'power2.inOut',
        duration: 0.7,
      }, 2.15)

      // 4. Final sweep: Plunge away from camera into the screen depth (facing away: Math.PI * 3.0)
      .to(group.rotation, {
        x: 1.2,             // Steep pitch down
        y: Math.PI * 3.0,   // Spin and turn away into the abyss depth
        z: -0.2,
        ease: 'power2.in',
        duration: 0.85,
      }, 3.15)

      // Refresh ScrollTrigger to guarantee it calculates bounds correctly!
      ScrollTrigger.refresh()
    })

    return () => {
      ctx.revert()
    }
  }, [scale])

  if (scale === null) return null

  return (
    <>
      {/* 2. The "Designer" Dynamic Lighting Rig inside the Canvas Context */}
      <ambientLight intensity={0.2} color="#ffffff" />
      
      {/* Intense Rim Light (Placed behind the model to trace perfect wing/body contours) */}
      <spotLight 
        ref={rimLightRef}
        position={[0, 10, -10]} 
        intensity={15.0} 
        color="#ffffff" 
        angle={0.5} 
        penumbra={1.0} 
      />
      
      {/* Front Key Light. This illuminates the face and chest */}
      <directionalLight 
        ref={keyLightRef}
        position={[-5, 5, 5]} 
        intensity={2.0} 
        color="#fcfcfc" 
      />

      {/* Bottom Fill Light. Catches the underside of the wings and chest in detail */}
      <directionalLight 
        position={[2.5, -6, 3]} 
        intensity={2.5} 
        color="#ffffff" 
      />
      
      {/* Left Bottom Fill Light. Balances underlight so no voids exist when model banks */}
      <directionalLight 
        position={[-2.5, -6, 3]} 
        intensity={2.0} 
        color="#ffffff" 
      />

      <group ref={phoenixGroupRef} position={[0, 0.2, 1.0]} rotation={[0.05, -0.2, 0]}>
        <Float
          speed={2} 
          rotationIntensity={0.25} 
          floatIntensity={0.4} 
          floatingRange={[-0.2, 0.2]}
        >
          <primitive object={scene} scale={scale} />
        </Float>
      </group>
    </>
  )
}

// Fixed 3D Scene containing Canvas, Fog, Studio Environment, and Suspended Content
export default function PhoenixScene() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none', // Allow clicking HTML layers underneath
        background: 'transparent',
      }}
    >
      <CanvasErrorBoundary>
        <Canvas
          dpr={[1, 2]}
          gl={{ 
            antialias: true, 
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            powerPreference: 'high-performance', // Explicitly request high-performance discrete GPU
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} near={0.1} far={50} />

          {/* Obsidian & Structure Minimalist Fog */}
          <fog attach="fog" args={['#030303', 8, 25]} />

          {/* 1. Realistic Studio Environment (Provides the high-fidelity reflections) */}
          <Environment preset="studio" background={false} environmentIntensity={0.85} />

          {/* Ground shadow to ground the model in physical space */}
          <ContactShadows position={[0, -3.0, 0]} opacity={0.5} scale={10} blur={2} far={4} />

          <Suspense fallback={<CanvasLoader />}>
            <PhoenixSceneContent />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}

// Preload GLTF with Draco path set to avoid loading glitches
useGLTF.preload('/phoenix.glb')
