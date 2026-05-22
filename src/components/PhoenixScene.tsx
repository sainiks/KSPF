import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Float, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import React, { useEffect, useRef, Suspense, useMemo } from 'react'
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

const COLOR_OBSIDIAN = new THREE.Color('#3d3d3d')
const COLOR_GLASS = new THREE.Color('#0c1b20')

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
    const scroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)

    // Calculate organic freeze factor: slow down sways and flaps down to 0 at the Narrative Ending (scroll 0.72 -> 1.0)
    const freezeFactor = THREE.MathUtils.clamp((1.0 - scroll) / 0.28, 0, 1)

    // 1. Fluid, waving wing flap
    const speed = 4.2
    const amplitude = 0.22

    leftWingBones.current.forEach(({ bone, depth, x, z }) => {
      // Phase shifts down the wing tip
      const phaseOffset = depth * 0.22
      const wave = Math.sin(time * speed - phaseOffset) * amplitude * freezeFactor
      bone.rotation.z = z + wave
      bone.rotation.x = x + wave * 0.15
    })

    rightWingBones.current.forEach(({ bone, depth, x, z }) => {
      const phaseOffset = depth * 0.22
      const wave = Math.sin(time * speed - phaseOffset) * amplitude * freezeFactor
      // Mirror Z-axis flap and roll on the right side
      bone.rotation.z = z - wave
      bone.rotation.x = x - wave * 0.15
    })

    // 2. Snake-like horizontal tail feather sway
    tailBones.current.forEach(({ bone, depth, y, z }) => {
      const phaseOffset = depth * 0.35
      const wave = Math.sin(time * 2.2 - phaseOffset) * 0.12 * freezeFactor
      bone.rotation.y = y + wave
      bone.rotation.z = z + wave * 0.5
    })

    // 3. Gentle neck breathing/head stabilization sways
    neckBones.current.forEach(({ bone, depth, x }) => {
      const phaseOffset = depth * 0.18
      const wave = Math.sin(time * 1.5 - phaseOffset) * 0.03 * freezeFactor
      bone.rotation.x = x + wave
    })

    if (headBoneRef.current) {
      const { bone, x } = headBoneRef.current
      bone.rotation.x = x + Math.sin(time * 1.5) * 0.02 * freezeFactor
    }

    // 4. Breathtaking fluid sways for flowing hair & feather crests (B_Hair_ bones)
    // Ensures all secondary wing/tail plumage planes move dynamically and feel alive.
    hairBones.current.forEach(({ bone, depth, y, z }) => {
      const phaseOffset = depth * 0.3
      const waveY = Math.sin(time * 1.8 - phaseOffset) * 0.08 * freezeFactor
      const waveZ = Math.cos(time * 1.8 - phaseOffset) * 0.05 * freezeFactor
      bone.rotation.y = y + waveY
      bone.rotation.z = z + waveZ
    })

    // 5. In-place material morphing: morph into refractive dark frozen glass (scroll 0.72 -> 1.0)
    const glassBlend = THREE.MathUtils.clamp((scroll - 0.72) / 0.28, 0, 1)
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material && (mesh.material as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
          const mat = mesh.material as THREE.MeshPhysicalMaterial
          
          // Lerp base color to deep refractive glass highlight
          mat.color.lerpColors(COLOR_OBSIDIAN, COLOR_GLASS, glassBlend)
          
          // Smoothly lerp physical characteristics
          mat.roughness = THREE.MathUtils.lerp(0.2, 0.04, glassBlend)
          mat.metalness = THREE.MathUtils.lerp(0.95, 0.05, glassBlend)
          mat.transmission = THREE.MathUtils.lerp(0.0, 0.96, glassBlend)
          mat.thickness = THREE.MathUtils.lerp(0.0, 3.2, glassBlend)
          
          // Toggle transparency to prevent sorting artifacts until transmission is active
          mat.transparent = glassBlend > 0.02
        }
      }
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
          scrub: 0.5, // Extremely responsive, tight 1:1 synchronization with DOM
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

      // 3. Dwell in About (1.85s to 2.15s), then sweep to Contact (Center, elevated in the empty top 60% viewport)
      .to(group.position, {
        x: 0,               // Center perfectly
        y: 0.8,             // Elevate high into empty space above brutalist grid
        z: 2.2,             // Pull close enough to reveal high-fidelity detail
        ease: 'power2.inOut',
        duration: 0.7,
      }, 2.15)

      // 4. Narrative Ending Contact Dwell (2.85s to 4.0s) - Keep position stable instead of diving
      .to(group.position, {
        x: 0,
        y: 0.8,
        z: 2.2,
        ease: 'none',
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
        x: 0.0,             // Pitch completely level
        y: Math.PI * 2.0,   // Face directly forward
        z: 0.0,             // Wings level, stable hover
        ease: 'power2.inOut',
        duration: 0.7,
      }, 2.15)

      // 4. Narrative Ending Contact Dwell (2.85s to 4.0s) - Introduce slow, majestic, icy turn to show glass facets
      .to(group.rotation, {
        x: 0.0,
        y: Math.PI * 2.15,  // Slow turn to profile view
        z: 0.0,
        ease: 'power1.out',
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

      <group ref={phoenixGroupRef} name="phoenix-group" position={[0, 0.2, 1.0]} rotation={[0.05, -0.2, 0]}>
        <Float
          speed={2} 
          rotationIntensity={0.25} 
          floatIntensity={0.4} 
          floatingRange={[-0.2, 0.2]}
        >
          <primitive object={scene} scale={scale} />
        </Float>
      </group>

      {/* Render the inference cloud inside the suspended content to synchronize frame loops and prevent loading jumps */}
      <ArtificerInferenceCloud />
    </>
  )
}

// 1. GLSL Tensor Field Background Shader Component
function GLSLTensorField() {
  const { size, pointer } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const hasMoved = useRef(false)

  useEffect(() => {
    const handleMove = () => {
      hasMoved.current = true
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
    }
  }, [])
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.getElapsedTime()
      
      if (hasMoved.current) {
        // Smoothly interpolate mouse coordinate for visual fluidness
        const targetX = pointer.x
        const targetY = pointer.y
        const currentX = materialRef.current.uniforms.u_mouse.value.x
        const currentY = materialRef.current.uniforms.u_mouse.value.y
        
        materialRef.current.uniforms.u_mouse.value.set(
          THREE.MathUtils.lerp(currentX, targetX, 0.05),
          THREE.MathUtils.lerp(currentY, targetY, 0.05)
        )
      } else {
        // Keep it completely offscreen on load
        materialRef.current.uniforms.u_mouse.value.set(0, -999)
      }
    }
  })
  
  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_mouse: { value: new THREE.Vector2(0, -999) },
    u_resolution: { value: new THREE.Vector2(size.width, size.height) }
  }), [])
  
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_resolution.value.set(size.width, size.height)
    }
  }, [size])
  
  return (
    <mesh ref={meshRef} position={[0, 0, -20]}>
      <planeGeometry args={[75, 75]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float u_time;
          uniform vec2 u_mouse;
          uniform vec2 u_resolution;
          varying vec2 vUv;
          
          void main() {
            // Perfect screen-space UV coordinates covering 100% of the screen
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            
            // Map mouse to UV space [0, 1]
            vec2 mouseUv = u_mouse * 0.5 + 0.5;
            
            // Correct for screen aspect ratio to get circular mouse distortion
            vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
            float distToMouse = distance(uv * aspect, mouseUv * aspect);
            
            // Distortion well (gravity falloff)
            float gravity = smoothstep(0.42, 0.0, distToMouse);
            vec2 toMouse = (uv - mouseUv) * aspect;
            
            // Distort UVs (dividing by aspect corrects the direction back to screen space)
            vec2 distortedUv = uv - (toMouse / (length(toMouse) + 0.0001)) * gravity * 0.038 / aspect;
            
            // Adjust grid scale for screen aspect ratio to get perfect square grid cells
            vec2 gridScale = vec2(45.0, 45.0 * (u_resolution.y / u_resolution.x));
            
            // Generate matrix grid weights
            vec2 gridUv = fract(distortedUv * gridScale - 0.5) - 0.5;
            
            // Intersection dots
            float dotDist = length(gridUv);
            float dotMask = smoothstep(0.08 + gravity * 0.03, 0.0, dotDist);
            
            // Grid lines
            float lineX = smoothstep(0.015, 0.0, abs(gridUv.x));
            float lineY = smoothstep(0.015, 0.0, abs(gridUv.y));
            float lineMask = max(lineX, lineY) * 0.055;
            
            // Math weight pulse cells
            vec2 cellIdx = floor(distortedUv * gridScale);
            float nodePulse = sin(cellIdx.x * 0.55 + cellIdx.y * 0.78 + u_time * 1.35) * 0.5 + 0.5;
            nodePulse *= step(0.68, fract(sin(cellIdx.x * 12.9898 + cellIdx.y * 78.233) * 43758.5453));
            
            float gridIntensity = (dotMask * (0.28 + nodePulse * 0.72) + lineMask);
            
            // Interactive glow (uses aspect-corrected distance for perfect circular glow)
            float mouseGlow = exp(-distToMouse * 3.8) * 0.42;
            
            // Curated deep obsidian color design matching visual depth fog (#030303)
            vec3 bgColor = vec3(0.0117, 0.0117, 0.0117);
            vec3 gridColor = vec3(0.0, 0.82, 1.0) * gridIntensity; // Cyan grid
            vec3 pulseColor = vec3(0.0, 1.0, 0.53) * dotMask * nodePulse * 0.48; // Neon green weights
            vec3 glowColor = vec3(0.0, 0.82, 1.0) * mouseGlow;
            
            vec3 finalColor = bgColor + gridColor + pulseColor + glowColor;
            
            // Vignette shading
            float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
            vignette = clamp(pow(16.0 * vignette, 0.22), 0.0, 1.0);
            finalColor *= vignette;
            
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}

// 2. ArtificerInferenceCloud Particle System with K-Means & Wing Attraction
export function ArtificerInferenceCloud() {
  const pointsRef = useRef<THREE.Points>(null)
  const geomRef = useRef<THREE.BufferGeometry>(null)

  // Skeleton bone caches to trace actual physical model geometry
  const leftBonesRef = useRef<THREE.Object3D[]>([])
  const rightBonesRef = useRef<THREE.Object3D[]>([])
  const tailBonesRef = useRef<THREE.Object3D[]>([])

  const count = 2000
  const { spherePositions, colors, clusterIds, randomFriction } = useMemo(() => {
    const spherePositions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const clusterIds = new Uint8Array(count)
    const randomFriction = new Float32Array(count)

    const colorBase = new THREE.Color('#00D2FF') // Cyan
    const colorAccent = new THREE.Color('#00FF87') // Neon Green
    const colorPurple = new THREE.Color('#8b5cf6') // Purple

    let offset = 2 / count
    let increment = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < count; i++) {
      let y = ((i * offset) - 1) + (offset / 2)
      let r = Math.sqrt(1 - Math.pow(y, 2))
      let phi = ((i + 1) % count) * increment

      // Set Fibonacci sphere coordinates
      spherePositions[i * 3] = Math.cos(phi) * r * 7.5
      spherePositions[i * 3 + 1] = y * 7.5
      spherePositions[i * 3 + 2] = Math.sin(phi) * r * 7.5

      // Assign to K-Means clusters
      const cid = i % 4
      clusterIds[i] = cid

      // Random friction speed variations
      randomFriction[i] = 0.025 + Math.random() * 0.065

      // Cluster color mixes
      let c = colorBase.clone()
      if (cid === 1) c.lerp(colorAccent, 0.5)
      else if (cid === 2) c = colorAccent.clone()
      else if (cid === 3) c = colorPurple.clone()
      
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { spherePositions, colors, clusterIds, randomFriction }
  }, [])

  const activePositions = useMemo(() => new Float32Array(count * 3), [])

  useEffect(() => {
    activePositions.set(spherePositions)
  }, [spherePositions])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const phoenix = state.scene.getObjectByName('phoenix-group')
    
    // Explicitly update matrices of the entire hierarchy to ensure absolute bone tracking synchronization
    if (phoenix) {
      phoenix.updateMatrixWorld(true)
    }

    const scroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)
    
    // Dynamically retrieve bone systems on first available frame
    if (phoenix && (leftBonesRef.current.length === 0 || rightBonesRef.current.length === 0 || tailBonesRef.current.length === 0)) {
      console.log('[Inference Cloud] Parsing physical skeleton bones for direct tracking...')
      const leftTemp: THREE.Object3D[] = []
      const rightTemp: THREE.Object3D[] = []
      const tailTemp: THREE.Object3D[] = []

      phoenix.traverse((child) => {
        if (child.name.startsWith('B_Left_Wing_')) {
          leftTemp.push(child)
        } else if (child.name.startsWith('B_Right_Wing_')) {
          rightTemp.push(child)
        } else if (child.name.startsWith('B_Tail_')) {
          tailTemp.push(child)
        }
      })

      // Sort bones to ensure progressive tracking along the wing skeleton chains
      const sortByName = (a: THREE.Object3D, b: THREE.Object3D) => a.name.localeCompare(b.name, undefined, { numeric: true })
      leftBonesRef.current = leftTemp.sort(sortByName)
      rightBonesRef.current = rightTemp.sort(sortByName)
      tailBonesRef.current = tailTemp.sort(sortByName)
    }

    // Centroid definitions representing architectural states
    const centroids = [
      new THREE.Vector3(0, 0.5, 0),    // Hero (Center)
      new THREE.Vector3(5.2, 0.2, -2.5),  // Projects (Right)
      new THREE.Vector3(-4.8, -0.2, 1.2), // About (Left)
      new THREE.Vector3(0, 1.2, -3.2),   // Contact (Center Back)
    ]

    // Sine sways representing weight gradient convergence
    centroids[0].add(new THREE.Vector3(Math.sin(time) * 0.35, Math.cos(time * 0.8) * 0.25, 0))
    centroids[1].add(new THREE.Vector3(Math.cos(time * 0.7) * 0.45, Math.sin(time) * 0.35, Math.sin(time * 0.5) * 0.25))
    centroids[2].add(new THREE.Vector3(Math.sin(time * 0.9) * 0.35, Math.cos(time * 0.6) * 0.35, 0))
    centroids[3].add(new THREE.Vector3(Math.cos(time * 1.2) * 0.25, 0, Math.sin(time) * 0.45))

    if (pointsRef.current && geomRef.current) {
      // Keep points container rotation strictly at 0 to match World coordinates perfectly, 
      // avoiding coordinate desynchronization with moving skeletal bones.
      const posAttr = geomRef.current.getAttribute('position') as THREE.BufferAttribute
      const positionsArray = posAttr.array as Float32Array

      // Pre-calculate quaternion for beautiful, low-overhead cosmic sphere rotation inside the loop
      const sphereRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, time * 0.025, Math.sin(time * 0.04) * 0.04))
      const tempSphere = new THREE.Vector3()

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const cid = clusterIds[i]
        const friction = randomFriction[i]

        // Rotate the Fibonacci landing sphere position in local space manually to retain rotation aesthetics
        tempSphere.set(spherePositions[i3], spherePositions[i3 + 1], spherePositions[i3 + 2])
        tempSphere.applyQuaternion(sphereRotation)
        const sphereX = tempSphere.x
        const sphereY = tempSphere.y
        const sphereZ = tempSphere.z

        const centroid = centroids[cid]
        const noiseX = Math.sin(i * 0.05 + time) * 1.0
        const noiseY = Math.cos(i * 0.08 + time * 1.1) * 1.0
        const noiseZ = Math.sin(i * 0.12 + time * 0.7) * 1.0
        const clusterTargetX = centroid.x + noiseX
        const clusterTargetY = centroid.y + noiseY
        const clusterTargetZ = centroid.z + noiseZ

        let wingTargetX = clusterTargetX
        let wingTargetY = clusterTargetY
        let wingTargetZ = clusterTargetZ

        if (phoenix) {
          const isLeft = i < 900
          const isTail = i >= 1700
          const isRight = !isLeft && !isTail
          
          const bonesList = isLeft ? leftBonesRef.current : (isRight ? rightBonesRef.current : tailBonesRef.current)
          
          if (bonesList.length > 0) {
            const progress = isLeft ? (i / 900) : (isRight ? ((i - 900) / 800) : ((i - 1700) / 300))
            
            // Interpolate cleanly along the active bone chains for continuous distribution
            const boneFloatIdx = progress * (bonesList.length - 1)
            const boneIdxA = Math.floor(boneFloatIdx)
            const boneIdxB = Math.min(boneIdxA + 1, bonesList.length - 1)
            const t = boneFloatIdx - boneIdxA

            const posA = new THREE.Vector3().setFromMatrixPosition(bonesList[boneIdxA].matrixWorld)
            const posB = new THREE.Vector3().setFromMatrixPosition(bonesList[boneIdxB].matrixWorld)
            
            const attractor = new THREE.Vector3().copy(posA).lerp(posB, t)
            
            // Add slight natural feather dispersion
            wingTargetX = attractor.x + (Math.random() - 0.5) * 0.22
            wingTargetY = attractor.y + (Math.random() - 0.5) * 0.22
            wingTargetZ = attractor.z + (Math.random() - 0.5) * 0.22
          } else {
            // High-fidelity fallback math if bone instances are still loading in canvas
            const side = isLeft ? -1 : 1
            const progress = isLeft ? (i / 900) : (isRight ? ((i - 900) / 800) : ((i - 1700) / 300))
            const localAttractor = new THREE.Vector3()
            
            if (isTail) {
              localAttractor.set(
                Math.sin(time * 3.2 - progress * 4.0) * 0.7,
                -1.2 - progress * 3.5,
                -progress * 4.5
              )
            } else {
              const flapSpeed = 4.2
              const phaseOffset = progress * 2.0
              const flapY = Math.sin(time * flapSpeed - phaseOffset) * 1.8
              
              localAttractor.set(
                side * (1.0 + progress * 5.0),
                flapY * (0.28 + progress * 0.72),
                -progress * 1.6
              )
            }
            
            localAttractor.applyMatrix4(phoenix.matrixWorld)
            
            wingTargetX = localAttractor.x + (Math.random() - 0.5) * 0.18
            wingTargetY = localAttractor.y + (Math.random() - 0.5) * 0.18
            wingTargetZ = localAttractor.z + (Math.random() - 0.5) * 0.18
          }
        }

        // Blend layouts based on scroll positions
        let targetX = sphereX
        let targetY = sphereY
        let targetZ = sphereZ

        if (scroll > 0.02) {
          const blendToClustering = THREE.MathUtils.clamp((scroll - 0.02) * 5.0, 0, 1)
          const blendToWings = THREE.MathUtils.clamp((scroll - 0.02) * 6.0, 0, 1)

          // Sphere -> Cluster
          let tx = THREE.MathUtils.lerp(sphereX, clusterTargetX, blendToClustering)
          let ty = THREE.MathUtils.lerp(sphereY, clusterTargetY, blendToClustering)
          let tz = THREE.MathUtils.lerp(sphereZ, clusterTargetZ, blendToClustering)

          // Cluster -> Wing wrap
          targetX = THREE.MathUtils.lerp(tx, wingTargetX, blendToWings)
          targetY = THREE.MathUtils.lerp(ty, wingTargetY, blendToWings)
          targetZ = THREE.MathUtils.lerp(tz, wingTargetZ, blendToWings)
        }

        // 6. Halo Vortex Transition: detach particles to form a slow circular vortex around the frozen bird (scroll 0.72 -> 1.0)
        if (scroll > 0.72) {
          const blendToHalo = THREE.MathUtils.clamp((scroll - 0.72) / 0.28, 0, 1)
          const radius = 3.5 + Math.sin(i + time * 0.2) * 1.5
          const angle = (i * 0.02) + time * (0.05 + friction * 0.5)
          const haloX = Math.cos(angle) * radius
          const haloY = Math.sin(i * 0.05) * 2.5 + Math.sin(time * 0.1 + i) * 0.5
          const haloZ = Math.sin(angle) * radius - 1.0

          targetX = THREE.MathUtils.lerp(targetX, haloX, blendToHalo)
          targetY = THREE.MathUtils.lerp(targetY, haloY, blendToHalo)
          targetZ = THREE.MathUtils.lerp(targetZ, haloZ, blendToHalo)
        }

        positionsArray[i3] = THREE.MathUtils.lerp(positionsArray[i3], targetX, friction)
        positionsArray[i3 + 1] = THREE.MathUtils.lerp(positionsArray[i3 + 1], targetY, friction)
        positionsArray[i3 + 2] = THREE.MathUtils.lerp(positionsArray[i3 + 2], targetZ, friction)
      }

      posAttr.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[activePositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.05} 
        vertexColors 
        transparent 
        opacity={0.6} 
        sizeAttenuation={true} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
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

          {/* Real-time Math GLSL background shader */}
          <GLSLTensorField />

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
