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
      const contactPanel = containerRef.current!.querySelector('.panel-contact')

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
          { type: 'output', text: '  skills                    - Output technical stack & proficiencies.' },
          { type: 'output', text: '  resume                    - Print localized academic and project credentials.' },
          { type: 'output', text: '  contact                   - Display secure comms channels.' },
          { type: 'output', text: '  download                  - Fetch full resume payload (.pdf).' },
          { type: 'output', text: '  search <concept>          - Run WASM semantic search and sweeps 3D camera to target.' },
          { type: 'output', text: '  query <question>          - Stream RAG response from academic REDSEA & Nexturn papers.' },
          { type: 'output', text: '  clear                     - Flush terminal output buffer.' },
          { type: 'output', text: '  exit                      - Flush terminal overlay and restore visual glass UI.' }
        ])
        break

      case 'skills':
        setTerminalHistory(prev => [
          ...prev,
          { type: 'output', text: '> [ CORE LANGUAGES ]: C++ (DSA), Python, JavaScript, TypeScript, GLSL' },
          { type: 'output', text: '> [ AI/ML STACK ]: Ollama, Hugging Face, NumPy, Pandas, Transformers.js' },
          { type: 'output', text: '> [ ARCHITECTURE ]: Next.js, React, Tailwind CSS, Three.js, WebGL' },
          { type: 'output', text: '> [ INFRASTRUCTURE ]: Vercel, Git, GitHub Pipelines' }
        ])
        break

      case 'resume':
        setTerminalHistory(prev => [
          ...prev,
          { type: 'system', text: 'LOADING SECURE PAYLOAD...' },
          { type: 'output', text: '=========================================' },
          { type: 'system', text: 'NAME: Kunal Saini // Artificer // ML Developer Student' },
          { type: 'system', text: 'LOCATION: Delhi, India // SYSTEM ONLINE' },
          { type: 'output', text: '=========================================' },
          { type: 'output', text: 'EDUCATION:' },
          { type: 'output', text: ' - B.Tech in Artificial Intelligence & Machine Learning' },
          { type: 'output', text: '   MDU University, Delhi Institute of Technology & Management (2024 - 2028)' },
          { type: 'output', text: '=========================================' },
          { type: 'output', text: 'EXPERIENCE & PROJECTS:' },
          { type: 'output', text: ' - Nexturn Connect [Tech Head]: Engineered core pipeline & centralized architecture.' },
          { type: 'output', text: ' - Project REDSEA: Developed and deployed scalable Reddit Sentiment Analyzer.' },
          { type: 'output', text: ' - Kreative Spark [Co-Founder]: Scaled media-based digital agency.' },
          { type: 'output', text: ' - Production Apps: Full-stack deployment for Printingpoint.net & santeriors.com.' },
          { type: 'output', text: '=========================================' },
          { type: 'output', text: 'CERTIFICATIONS:' },
          { type: 'output', text: ' - GEN-AI VAC (ICE) - Scored 90+' },
          { type: 'output', text: ' - Applied LLMs, Model Testing & Deployment (Coding Blocks)' },
          { type: 'output', text: '=========================================' },
          { type: 'system', text: "Type 'download' to fetch full PDF." }
        ])
        break

      case 'contact':
        setTerminalHistory(prev => [
          ...prev,
          { type: 'system', text: 'INITIATING SECURE HANDSHAKE...' },
          { type: 'output', text: 'EMAIL: kunalsaini20090360@gmail.com' },
          { type: 'output', text: 'GITHUB: github.com/sainiks' },
          { type: 'output', text: 'LINKEDIN: linkedin.com/in/kunal-saini' }
        ])
        break

      case 'download':
        setTerminalHistory(prev => [
          ...prev,
          { type: 'system', text: 'DOWNLOADING KUNAL_SAINI_RESUME.PDF... [OK]' }
        ])
        window.open('/Kunal_Saini_resume.pdf', '_blank')
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

          {/* PANEL 4: CINEMATIC BRUTALIST CONTACT FOOTER */}
          <section className="scroll-panel panel-contact" id="contact">
            {/* The Minimalist Brutalist Grid */}
            <div className="brutalist-grid-container">
              <div className="brutalist-grid">
                
                {/* Column 1: Identity & Brand */}
                <div className="brutalist-col-left">
                  <div>
                    <h2 className="brutalist-brand-title">Artificer.</h2>
                    <p className="brutalist-brand-mono">
                      Kunal Saini // System Online
                    </p>
                  </div>
                  <div className="brutalist-location-coordinates">
                    DELHI, INDIA // [LAT: 28.7041, LON: 77.1025]
                  </div>
                </div>

                {/* Column 2 & 3: Architectural Resume Data */}
                <div className="brutalist-col-right">
                  
                  {/* Experience & Engineering */}
                  <div>
                    <div className="brutalist-sec-title">
                      / Experience & Research
                    </div>
                    <ul className="brutalist-list">
                      <li className="brutalist-item">
                        <span className="brutalist-item-title">Nexturn Connect</span>
                        <span className="brutalist-item-desc">Tech Head // System Architecture</span>
                      </li>
                      <li className="brutalist-item">
                        <span className="brutalist-item-title">Project REDSEA</span>
                        <span className="brutalist-item-desc">Academic Research // Sentiment Analysis</span>
                      </li>
                      <li className="brutalist-item">
                        <span className="brutalist-item-title">Kreative Spark</span>
                        <span className="brutalist-item-desc">Co-Founder // Digital Agency</span>
                      </li>
                    </ul>
                  </div>

                  {/* Background & Stack */}
                  <div>
                    <div className="brutalist-sec-title">
                      / Background & Stack
                    </div>
                    <ul className="brutalist-list">
                      <li className="brutalist-item">
                        <span className="brutalist-item-title">MDU University</span>
                        <span className="brutalist-item-desc">B.Tech AI & ML (2024 - 2028)</span>
                      </li>
                      <li className="brutalist-item">
                        <span className="brutalist-item-title">Core Intelligence</span>
                        <span className="brutalist-item-desc">Python, C++, PyTorch, WebGL</span>
                      </li>
                      <li className="brutalist-download-wrapper">
                        <a href="/Kunal_Saini_resume.pdf" target="_blank" rel="noopener noreferrer" className="brutalist-download-link">
                          [ Download Full Record ]
                        </a>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* The Massive Cinematic Handshake Footer */}
              <div className="brutalist-handshake-wrapper">
                <a 
                  href="mailto:kunalsaini20090360@gmail.com" 
                  className="brutalist-handshake-banner"
                >
                  <div className="brutalist-handshake-content">
                    <span className="brutalist-handshake-text">
                      INITIATE.
                    </span>
                    <svg 
                      className="brutalist-handshake-arrow" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                  
                  <div className="brutalist-handshake-email">
                    kunalsaini20090360@gmail.com
                  </div>
                  
                  {/* Subtle hover gradient sweep */}
                  <div className="brutalist-handshake-sweep"></div>
                </a>
              </div>

            </div>
          </section>

        </div>
      </div>
    </>
  )
}
