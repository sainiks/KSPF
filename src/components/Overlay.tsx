import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Overlay() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      const heroPanel = containerRef.current!.querySelector('.panel-hero')
      const projectsPanel = containerRef.current!.querySelector('.panel-left')
      const aboutPanel = containerRef.current!.querySelector('.panel-right')
      const contactPanel = containerRef.current!.querySelector('.panel-center')

      // Create a single scrollytelling timeline linked to parent container scroll progress
      // Timeline time values 0.0s to 4.0s map to scroll percentages 0% to 100%
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#portfolio-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5, // Reduced from 1.0 to 0.5 to prevent desync jitter between overlays and 3D canvas
        },
      })

      // Enforce clean, self-contained initial states inside the timeline at Scroll = 0
      tl.set(heroPanel, { opacity: 1, y: 0, autoAlpha: 1 }, 0)
      tl.set([projectsPanel, aboutPanel, contactPanel], { opacity: 0, y: 60, autoAlpha: 0 }, 0)

      // --- TIMELINE DEFINITIONS ---

      // 1. Hero panel fades and slides out upwards (0.15s to 0.50s)
      tl.to(heroPanel, {
        opacity: 0,
        y: -60,
        autoAlpha: 0,
        ease: 'power2.inOut',
        duration: 0.35,
      }, 0.15)

      // 2. Projects panel fades and slides up in place (0.55s to 0.85s)
      .to(projectsPanel, {
        opacity: 1,
        y: 0,
        autoAlpha: 1,
        ease: 'power2.out',
        duration: 0.30,
      }, 0.55)
      // Projects panel fades and slides out upwards (1.15s to 1.50s)
      .to(projectsPanel, {
        opacity: 0,
        y: -60,
        autoAlpha: 0,
        ease: 'power2.inOut',
        duration: 0.35,
      }, 1.15)

      // 3. About panel fades and slides up in place (1.55s to 1.85s)
      .to(aboutPanel, {
        opacity: 1,
        y: 0,
        autoAlpha: 1,
        ease: 'power2.out',
        duration: 0.30,
      }, 1.55)
      // About panel fades and slides out upwards (2.15s to 2.50s)
      .to(aboutPanel, {
        opacity: 0,
        y: -60,
        autoAlpha: 0,
        ease: 'power2.inOut',
        duration: 0.35,
      }, 2.15)

      // 4. Contact panel fades and slides up in place (2.55s to 2.85s)
      .to(contactPanel, {
        opacity: 1,
        y: 0,
        autoAlpha: 1,
        ease: 'power2.out',
        duration: 0.30,
      }, 2.55)
      // Contact panel fades and slides out during the deep abyss plunge (3.15s to 3.65s)
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

  // Quick navigation helper (scrolls window to center active sections within dwells)
  const scrollToSection = (index: number) => {
    const scrollHeight = window.innerHeight * index
    window.scrollTo({
      top: scrollHeight,
      behavior: 'smooth',
    })
  }

  return (
    <>
      {/* Sleek Devilish Navigation Bar */}
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
      </nav>

      {/* Main scrollytelling overlay track */}
      <div id="portfolio-container" ref={containerRef}>
        
        {/* Pinned Sticky Viewport */}
        <div className="sticky-viewport">
          
          {/* PANEL 1: HERO */}
          <section className="scroll-panel panel-hero" id="hero" style={{ position: 'relative' }}>
            {/* Micro-typography for that technical, engineered developer feel */}
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
              <span>// SYSTEM: ONLINE</span>
              <span>// ENG: R3F_WEBGL</span>
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
              <span>[ SCROLL TO EXPLORE ]</span>
            </div>
          </section>

          {/* PANEL 2: PROJECTS */}
          <section className="scroll-panel panel-left" id="projects">
            
            {/* Section Header */}
            <div className="projects-header-group">
              <div className="projects-header-meta">
                <div className="projects-header-line"></div>
                <span className="projects-subtitle">Architecture & Works</span>
              </div>
              <h2 className="projects-title">Selected Projects.</h2>
            </div>

            {/* Projects Grid Container */}
            <div className="projects-list-container">

              {/* PROJECT 01: NEXTURN CONNECT */}
              <div 
                className="project-detail-card"
                onMouseEnter={() => window.dispatchEvent(new CustomEvent('project-hover', { detail: 'nexturn' }))}
                onMouseLeave={() => window.dispatchEvent(new CustomEvent('project-hover', { detail: null }))}
              >
                {/* Ambient Internal Glow */}
                <div className="project-card-glow"></div>

                <div className="project-card-content">
                  <div className="project-card-header">
                    <div>
                      <h3 className="project-card-title">Nexturn Connect</h3>
                      <p className="project-card-mono-meta">Platform Architecture</p>
                    </div>
                    {/* Sleek Pill Badge for Role */}
                    <div className="project-role-pill">
                      Tech Head
                    </div>
                  </div>
                  
                  <p className="project-card-description">
                    Engineered the core digital infrastructure and interface following the structural merger. Designed to streamline operations and centralize the talent pipeline into a single, cohesive ecosystem.
                  </p>

                  {/* Footer: Tech Stack & Live Link */}
                  <div className="project-card-footer">
                    <div className="project-tech-pills">
                      {['React', 'System Design', 'UI/UX'].map((tech) => (
                        <span key={tech} className="project-tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Solid Action Pill Button */}
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
                {/* Ambient Internal Glow */}
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

                  {/* Footer: Tech Stack */}
                  <div className="project-card-footer">
                    <div className="project-tech-pills">
                      {['AI', 'Machine Learning', 'Neural Networks'].map((tech) => (
                        <span key={tech} className="project-tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Solid Action Pill Button */}
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
