import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initMLEngine, semanticSearch } from '../utils/mlEngine'

gsap.registerPlugin(ScrollTrigger)

interface HistoryItem {
  type: 'input' | 'output' | 'system' | 'rag' | 'error';
  text: string;
}

export default function Overlay() {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalInputRef = useRef<HTMLInputElement>(null)
  const terminalOutputRef = useRef<HTMLDivElement>(null)

  // System States
  const [terminalActive, setTerminalActive] = useState(false)
  const [mlStatus, setMlStatus] = useState({ status: 'idle', progress: 0 })
  const [searchVal, setSearchVal] = useState('')
  const [cmdVal, setCmdVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // Terminal Logs Initialization
  const [terminalHistory, setTerminalHistory] = useState<HistoryItem[]>([
    { type: 'system', text: 'ARTIFICER DEEP RETRIEVAL KERNEL v1.0.4-WASM' },
    { type: 'system', text: 'Initializing local Edge ML semantic weights...' },
    { type: 'system', text: 'Edge Wasm status: OPERATION READY' },
    { type: 'system', text: '---------------------------------------------------' },
    { type: 'system', text: 'Type "help" to display operational intelligence commands.' },
    { type: 'system', text: 'Press ~ or type "exit" to resume standard glass overlay.' }
  ])

  // 1. Core GSAP Scrollytelling Timeline
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      const heroPanel = containerRef.current!.querySelector('.panel-hero')
      const projectsPanel = containerRef.current!.querySelector('.panel-left')
      const aboutPanel = containerRef.current!.querySelector('.panel-right')
      const contactPanel = containerRef.current!.querySelector('.panel-center')

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#portfolio-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
        },
      })

      tl.set(heroPanel, { opacity: 1, y: 0, autoAlpha: 1 }, 0)
      tl.set([projectsPanel, aboutPanel, contactPanel], { opacity: 0, y: 60, autoAlpha: 0 }, 0)

      // Hero slides out
      tl.to(heroPanel, {
        opacity: 0,
        y: -60,
        autoAlpha: 0,
        ease: 'power2.inOut',
        duration: 0.35,
      }, 0.15)

      // Projects slides in
      .to(projectsPanel, {
        opacity: 1,
        y: 0,
        autoAlpha: 1,
        ease: 'power2.out',
        duration: 0.30,
      }, 0.55)
      // Projects slides out
      .to(projectsPanel, {
        opacity: 0,
        y: -60,
        autoAlpha: 0,
        ease: 'power2.inOut',
        duration: 0.35,
      }, 1.15)

      // About slides in
      .to(aboutPanel, {
        opacity: 1,
        y: 0,
        autoAlpha: 1,
        ease: 'power2.out',
        duration: 0.30,
      }, 1.55)
      // About slides out
      .to(aboutPanel, {
        opacity: 0,
        y: -60,
        autoAlpha: 0,
        ease: 'power2.inOut',
        duration: 0.35,
      }, 2.15)

      // Contact slides in
      .to(contactPanel, {
        opacity: 1,
        y: 0,
        autoAlpha: 1,
        ease: 'power2.out',
        duration: 0.30,
      }, 2.55)
      // Contact slides out
      .to(contactPanel, {
        opacity: 0,
        y: -80,
        autoAlpha: 0,
        ease: 'power2.inOut',
        duration: 0.50,
      }, 3.15)

    }, containerRef)

    return () => {
      ctx.revert()
    }
  }, [])

  // 2. Terminal Override (~ Key) Global Listener & GSAP Dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault()
        setTerminalActive(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const wrapper = containerRef.current?.querySelector('.sticky-viewport')
    if (!wrapper) return

    if (terminalActive) {
      // Dismiss visual glass interface (slide out up)
      gsap.to(wrapper, {
        y: '-100vh',
        opacity: 0,
        duration: 0.55,
        ease: 'power3.inOut'
      })
      // Auto focus console input after opening
      setTimeout(() => {
        terminalInputRef.current?.focus()
      }, 200)
    } else {
      // Restore visual glass interface
      gsap.to(wrapper, {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: 'power3.out'
      })
    }
  }, [terminalActive])

  // 3. Initialize ML engine in background on mount
  useEffect(() => {
    initMLEngine()

    const handleMLEngineStatus = (e: Event) => {
      const customEvent = e as CustomEvent
      setMlStatus(customEvent.detail)
    }
    window.addEventListener('ml-engine-status', handleMLEngineStatus)
    return () => window.removeEventListener('ml-engine-status', handleMLEngineStatus)
  }, [])

  // 4. Scroll Helper matching 650vh container bounds
  const scrollToSection = (index: number) => {
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight
    
    // Target exact midpoint scrolls inside the dwells:
    // Index 0: 0% scroll
    // Index 1 (Projects): 22% scroll
    // Index 2 (About): 47% scroll
    // Index 3 (Contact): 72% scroll
    let targetRatio = 0
    if (index === 1) targetRatio = 0.22
    else if (index === 2) targetRatio = 0.47
    else if (index === 3) targetRatio = 0.72

    window.scrollTo({
      top: scrollMax * targetRatio,
      behavior: 'smooth',
    })
  }

  // 5. Semantic Search execution inside visual navbar input
  const handleNavbarSemanticSearch = async (query: string) => {
    if (!query.trim()) return

    try {
      console.log(`[Semantic Search] Inferencing query: "${query}"...`)
      const results = await semanticSearch(query)
      const best = results[0]

      if (best && best.score > 0.15) {
        console.log(`[Semantic Search] Closest match: ${best.doc.title} (${(best.score * 100).toFixed(1)}%)`)
        
        // Scroll camera to section plateau
        scrollToSection(best.doc.sectionIndex)

        // Trigger dynamic lights morphing if matching nexturn or redsea cards
        if (best.doc.projectKey) {
          window.dispatchEvent(new CustomEvent('project-hover', { detail: best.doc.projectKey }))
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('project-hover', { detail: null }))
          }, 6000)
        }
      } else {
        console.log('[Semantic Search] Low confidence match, staying on current view.')
      }
    } catch (err) {
      console.error(err)
    }
    setSearchVal('')
  }

  // 6. Character typewriter output streams for RAG
  const streamTerminalText = (text: string, type: 'rag' | 'output' | 'system') => {
    setIsTyping(true)
    let currentText = ''
    setTerminalHistory(prev => [...prev, { type, text: '' }])

    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        currentText += text.charAt(i)
        setTerminalHistory(prev => {
          const next = [...prev]
          next[next.length - 1] = { type, text: currentText }
          return next
        })
        i++
        if (terminalOutputRef.current) {
          terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight
        }
      } else {
        clearInterval(interval)
        setIsTyping(false)
        setTimeout(() => {
          terminalInputRef.current?.focus()
        }, 50)
      }
    }, 10)
  }

  // 7. Interactive Terminal command parser
  const handleTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = cmdVal.trim()
    if (!input || isTyping) return

    setCmdVal('')

    // Append raw input line to logs
    setTerminalHistory(prev => [...prev, { type: 'input', text: `> ${input}` }])

    const parts = input.split(' ')
    const cmd = parts[0].toLowerCase()
    const arg = parts.slice(1).join(' ')

    switch (cmd) {
      case 'help':
        setTerminalHistory(prev => [
          ...prev,
          { type: 'output', text: 'AVAILABLE OPERATIONS:' },
          { type: 'output', text: '  help                      - Display active intelligence operations.' },
          { type: 'output', text: '  status                    - Read WebGL engine and Edge ML vector variables.' },
          { type: 'output', text: '  clear                     - Flush terminal output buffer.' },
          { type: 'output', text: '  search <concept>          - Run WASM semantic search and sweeps 3D camera to target.' },
          { type: 'output', text: '  query <question>          - Stream RAG response from academic REDSEA & Nexturn papers.' },
          { type: 'output', text: '  exit                      - Flush terminal overlay and restore visual glass UI.' }
        ])
        break

      case 'clear':
        setTerminalHistory([])
        break

      case 'status':
        setTerminalHistory(prev => [
          ...prev,
          { type: 'system', text: 'CORE HARDWARE & VECTOR VARIABLES:' },
          { type: 'system', text: '  - 3D Engine: React Three Fiber + PerspectiveCamera (Z=12)' },
          { type: 'system', text: '  - Material physical: Brushed Graphite (Physical clearcoat)' },
          { type: 'system', text: '  - Environment mapping: HDR Studio preset (Intensity 0.85)' },
          { type: 'system', text: '  - Math background: GLSL Tensor Grid Fragment Shader (Active)' },
          { type: 'system', text: '  - Clustering Logic: Real-time K-Means (2,000 Fibonacci nodes)' },
          { type: 'system', text: '  - Edge ML Engine: quantized all-MiniLM-L6-v2 vector model loaded' },
          { type: 'system', text: `  - Edge ML Status: ${mlStatus.status.toUpperCase()}` },
          { type: 'system', text: '  - Latency projection: ~14ms (Local WASM execution)' }
        ])
        break

      case 'exit':
        setTerminalActive(false)
        break

      case 'search':
        if (!arg) {
          setTerminalHistory(prev => [...prev, { type: 'error', text: 'Error: concept argument required. Usage: search <concept>' }])
          break
        }
        setTerminalHistory(prev => [...prev, { type: 'system', text: `Searching local vector database for concept: "${arg}"...` }])
        
        try {
          const results = await semanticSearch(arg)
          const match = results[0]
          
          if (match && match.score > 0.15) {
            setTerminalHistory(prev => [
              ...prev,
              { type: 'output', text: `Match found: "${match.doc.title}" (Confidence: ${(match.score * 100).toFixed(1)}%)` },
              { type: 'output', text: `Executing autonomous camera sweep to section index ${match.doc.sectionIndex}...` }
            ])
            scrollToSection(match.doc.sectionIndex)
            if (match.doc.projectKey) {
              window.dispatchEvent(new CustomEvent('project-hover', { detail: match.doc.projectKey }))
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('project-hover', { detail: null }))
              }, 5000)
            }
          } else {
            setTerminalHistory(prev => [...prev, { type: 'error', text: 'Search query yielded zero high-confidence matches.' }])
          }
        } catch (err) {
          setTerminalHistory(prev => [...prev, { type: 'error', text: `Inference error: ${String(err)}` }])
        }
        break

      case 'query':
        if (!arg) {
          setTerminalHistory(prev => [...prev, { type: 'error', text: 'Error: question context required. Usage: query <question>' }])
          break
        }
        
        setTerminalHistory(prev => [...prev, { type: 'system', text: `Streaming local RAG query over custom intelligence layers...` }])
        
        try {
          const results = await semanticSearch(arg)
          const match = results[0]
          
          if (match && match.score > 0.15) {
            const answer = `[SOURCE: ${match.doc.title} | CONFIDENCE: ${(match.score * 100).toFixed(1)}%]\n\n${match.doc.content}`
            streamTerminalText(answer, 'rag')
          } else {
            streamTerminalText(`System failed to retrieve high-confidence contextual matches for query: "${arg}". Try asking about "REDSEA research model" or "Nexturn system database migrations".`, 'output')
          }
        } catch (err) {
          setTerminalHistory(prev => [...prev, { type: 'error', text: `Inference error: ${String(err)}` }])
        }
        break

      default:
        setTerminalHistory(prev => [...prev, { type: 'error', text: `Unknown operation: "${cmd}". Type "help" for available console vectors.` }])
        break
    }
  }

  // Auto-scroll output log
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight
    }
  }, [terminalHistory])

  return (
    <>
      {/* 1. Standard visual glass interface header */}
      <nav className="navbar">
        <a href="#" className="nav-logo" onClick={() => scrollToSection(0)}>
          ARTIFICER<span>.</span>
        </a>
        <ul className="nav-links">
          <li>
            <a href="#hero" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection(0); }}>
              Home
            </a>
          </li>
          <li>
            <a href="#projects" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection(1); }}>
              Projects
            </a>
          </li>
          <li>
            <a href="#about" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection(2); }}>
              About
            </a>
          </li>
          <li>
            <a href="#contact" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection(3); }}>
              Contact
            </a>
          </li>
        </ul>

        {/* Dynamic Edge ML search field */}
        <div className="search-bar-container">
          <input 
            type="text" 
            placeholder={
              mlStatus.status === 'loading'
                ? `WASM ML LOADING (${Math.round(mlStatus.progress)}%)...`
                : mlStatus.status === 'ready'
                ? "Semantic search (e.g. neural models)..."
                : "Initialize ML (Press ~ for terminal)..."
            }
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="semantic-search-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNavbarSemanticSearch(e.currentTarget.value)
              }
            }}
          />
          <span className={`ml-status-dot ${mlStatus.status}`}></span>
        </div>
      </nav>

      {/* 2. Interactive Terminal Override CLI Pane */}
      <div className={`terminal-overlay ${terminalActive ? 'active' : ''}`}>
        <div className="terminal-header">
          <div>// ARTIFICER SYSTEM NODE: ONLINE | INTEGRATION: WEBASEMBLY COGNITIVE ENGINE</div>
          <div>ML PIPELINE STATE: <span className="terminal-status-ok">{mlStatus.status.toUpperCase()}</span></div>
        </div>

        <div className="terminal-output" ref={terminalOutputRef}>
          {terminalHistory.map((item, idx) => (
            <div key={idx} className={`terminal-row ${item.type}`}>
              {item.text}
            </div>
          ))}
        </div>

        <form className="terminal-input-line" onSubmit={handleTerminalCommand}>
          <span className="terminal-prompt">$</span>
          <input
            ref={terminalInputRef}
            type="text"
            className="terminal-input"
            value={cmdVal}
            onChange={(e) => setCmdVal(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "Engine streaming..." : "Type command (e.g. status, query, search)..."}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </form>

        <div className="terminal-exit-hint">
          [Press ~ to flush overlay & return to standard GUI]
        </div>
      </div>

      {/* 3. Main visual sticky scrollytelling container */}
      <div id="portfolio-container" ref={containerRef}>
        
        {/* Pinned Sticky Viewport */}
        <div className="sticky-viewport">
          
          {/* PANEL 1: HERO */}
          <section className="scroll-panel panel-hero" id="hero" style={{ position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              top: '3rem', 
              left: '3rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px', 
              fontSize: '10px', 
              letterSpacing: '2px', 
              color: '#55555a', 
              fontFamily: 'var(--font-mono)', 
              textAlign: 'left',
              pointerEvents: 'none'
            }}>
              <span>// SYSTEM: OPERATIONAL</span>
              <span>// INFERENCE: WASM_L6_V2</span>
            </div>

            <div className="animate-content">
              <h1 className="hero-title" style={{ 
                fontSize: '7.5rem', 
                fontWeight: 500, 
                letterSpacing: '-0.04em', 
                color: '#ffffff', 
                textTransform: 'initial', 
                textShadow: 'none',
                marginBottom: '1rem',
                filter: 'none'
              }}>
                Artificer.
              </h1>
              <p className="hero-subtitle" style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.85rem', 
                letterSpacing: '4px', 
                color: '#a1a1a6', 
                textTransform: 'uppercase',
                marginBottom: '2.5rem'
              }}>
                CREATIVE DEVELOPER
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                <button className="glow-button" onClick={() => scrollToSection(1)}>
                  EXPLORE WORK
                </button>
                <button className="secondary-button" onClick={() => scrollToSection(2)}>
                  ABOUT ME
                </button>
              </div>
            </div>

            <div className="scroll-down" style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '10px', 
              letterSpacing: '2px', 
              color: '#55555a' 
            }}>
              <span>[ SCROLL TO OVERRIDE ]</span>
            </div>
          </section>

          {/* PANEL 2: PROJECTS */}
          <section className="scroll-panel panel-left" id="projects">
            
            <div className="projects-header-group">
              <div className="projects-header-meta">
                <div className="projects-header-line"></div>
                <span className="projects-subtitle">Architecture & Works</span>
              </div>
              <h2 className="projects-title">Selected Projects.</h2>
            </div>

            <div className="projects-list-container">

              {/* PROJECT 01: NEXTURN CONNECT */}
              <div 
                className="project-detail-card"
                onMouseEnter={() => window.dispatchEvent(new CustomEvent('project-hover', { detail: 'nexturn' }))}
                onMouseLeave={() => window.dispatchEvent(new CustomEvent('project-hover', { detail: null }))}
              >
                <div className="project-card-glow"></div>

                <div className="project-card-content">
                  <div className="project-card-header">
                    <div>
                      <h3 className="project-card-title">Nexturn Connect</h3>
                      <p className="project-card-mono-meta">Platform Architecture</p>
                    </div>
                    <div className="project-role-pill">
                      Tech Head
                    </div>
                  </div>
                  
                  <p className="project-card-description">
                    Engineered the core digital infrastructure and interface following the structural merger. Designed to streamline operations and centralize the talent pipeline into a single, cohesive ecosystem.
                  </p>

                  <div className="project-card-footer">
                    <div className="project-tech-pills">
                      {['React', 'System Design', 'UI/UX'].map((tech) => (
                        <span key={tech} className="project-tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <a 
                      href="https://nexturn-vision.vercel.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="project-launch-btn"
                    >
                      <span>Launch</span>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* PROJECT 02: REDSEA RESEARCH */}
              <div 
                className="project-detail-card"
                onMouseEnter={() => window.dispatchEvent(new CustomEvent('project-hover', { detail: 'redsea' }))}
                onMouseLeave={() => window.dispatchEvent(new CustomEvent('project-hover', { detail: null }))}
              >
                <div className="project-card-glow"></div>

                <div className="project-card-content">
                  <div className="project-card-header">
                    <div>
                      <h3 className="project-card-title">Project REDSEA</h3>
                      <p className="project-card-mono-meta">Academic Research</p>
                    </div>
                    <div className="project-role-pill">
                      AI & ML
                    </div>
                  </div>
                  
                  <p className="project-card-description">
                    A comprehensive 50-page academic research paper detailing advanced integrations in artificial intelligence and machine learning architectures under direct academic supervision.
                  </p>

                  <div className="project-card-footer">
                    <div className="project-tech-pills">
                      {['AI', 'Machine Learning', 'Neural Networks'].map((tech) => (
                        <span key={tech} className="project-tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <a 
                      href="https://red-sea-omega.vercel.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="project-launch-btn"
                    >
                      <span>Launch</span>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* PANEL 3: ABOUT */}
          <section className="scroll-panel panel-right" id="about">
            <div className="animate-content about-content">
              <h2>Kunal Saini</h2>
              <p className="about-description">
                Operating under the handle <strong>Artificer</strong>, I am a developer specializing in premium 3D graphics, interactive WebGL canvases, and rich scroll-driven animations.
                <br /><br />
                I combine mathematical rigor with cutting-edge visual aesthetics, creating digital experiences that leave standard 2D web interfaces in the dust. My stack is calibrated for speed, performance, and extreme visual fidelity.
              </p>
              <div className="tech-badges-grid">
                <span className="tech-badge">Three.js</span>
                <span className="tech-badge">React Three Fiber</span>
                <span className="tech-badge">GSAP</span>
                <span className="tech-badge">Shaders (GLSL)</span>
                <span className="tech-badge">Vite</span>
                <span className="tech-badge">TypeScript</span>
                <span className="tech-badge">Bun</span>
                <span className="tech-badge">Helix Editor</span>
                <span className="tech-badge">Ghostty Terminal</span>
              </div>
            </div>
          </section>

          {/* PANEL 4: CONTACT */}
          <section className="scroll-panel panel-center" id="contact">
            <div className="animate-content glass-panel" style={{ width: '100%', maxWidth: '550px' }}>
              <div className="contact-header">
                <h2>Establish Connection</h2>
                <p style={{ color: '#a1a1a6', fontSize: '0.95rem' }}>
                  Looking to build something monumental? Drop a transmission.
                </p>
              </div>
              
              <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="name">IDENTIFIER</label>
                  <input 
                    type="text" 
                    id="name" 
                    className="contact-input" 
                    placeholder="Your Name" 
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">COMMS CHANNEL</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="contact-input" 
                    placeholder="your@email.com" 
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">TRANSMISSION DATA</label>
                  <textarea 
                    id="message" 
                    className="contact-input" 
                    placeholder="Describe your vision..." 
                    required
                  />
                </div>
                
                <button type="submit" className="glow-button" style={{ marginTop: '0.5rem', width: '100%' }}>
                  SEND TRANSMISSION
                </button>
              </form>

              <p className="footer-text">
                © {new Date().getFullYear()} Artificer. Crafted with blood, metal, and code.
              </p>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
