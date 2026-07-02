"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Volume2, VolumeX, Compass, ChevronDown, Activity, Layers, Disc, HelpCircle } from "lucide-react";

// Web Audio API Synthesizer controller for immersive cinematic drone
class SynthController {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  public isPlaying: boolean = false;

  constructor() {}

  start() {
    if (this.isPlaying) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Main Gain Node
      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      // Smooth fade-in
      this.gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 2.5);
      
      // Lowpass Filter with high resonance for sweep effect
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(7, this.ctx.currentTime);
      
      // Osc 1 - Deep sub-octave drone (55Hz / A1)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
      
      // Osc 2 - Mid-range textured wave (110.3Hz / detuned A2)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(110.3, this.ctx.currentTime);
      
      // LFO - Very slow breathing modulation (0.15Hz)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(35, this.ctx.currentTime);
      
      // Connections
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.filter.frequency);
      
      this.osc1.connect(this.filter);
      this.osc2.connect(this.filter);
      
      this.filter.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      
      // Start sound
      this.osc1.start();
      this.osc2.start();
      this.lfo.start();
      
      this.isPlaying = true;
    } catch (e) {
      console.error("Failed to start Audio Context:", e);
    }
  }

  stop() {
    if (!this.isPlaying || !this.ctx || !this.gain) return;
    try {
      const now = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      // Smooth fade-out
      this.gain.gain.linearRampToValueAtTime(0, now + 1.2);
      
      const osc1 = this.osc1;
      const osc2 = this.osc2;
      const lfo = this.lfo;
      const filter = this.filter;
      const gain = this.gain;
      const ctx = this.ctx;

      setTimeout(() => {
        try {
          if (osc1) { osc1.stop(); osc1.disconnect(); }
          if (osc2) { osc2.stop(); osc2.disconnect(); }
          if (lfo) { lfo.stop(); lfo.disconnect(); }
          if (filter) filter.disconnect();
          if (gain) gain.disconnect();
          if (ctx) ctx.close();
        } catch (e) {
          console.error("Error cleaning up audio nodes:", e);
        }
      }, 1300);
      
      this.isPlaying = false;
    } catch (e) {
      console.error("Failed to stop Audio Context:", e);
      this.isPlaying = false;
    }
  }

  updateFrequency(progress: number) {
    if (!this.isPlaying || !this.ctx || !this.filter) return;
    // Core peak mapping: peaks at center of scroll (0.5), which is the exploded core phase
    const coreFactor = Math.sin(progress * Math.PI); // Curve going 0 -> 1 -> 0
    const targetFreq = 140 + coreFactor * 420; // range: 140Hz to 560Hz
    this.filter.frequency.setValueAtTime(targetFreq, this.ctx.currentTime);
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  depth: number;
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<SynthController | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [soundOn, setSoundOn] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Refs for tracking animation variables inside the rAF loop (to bypass react render lag)
  const scrollInfo = useRef({
    progress: 0,
    targetFrame: 1,
    currentFrame: 1,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
  });

  // Framer Motion scroll hooks
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Listen to scroll to update target frame and active navigation stage
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    scrollInfo.current.progress = latest;
    // Map progress to [1, 120] frame index
    scrollInfo.current.targetFrame = Math.max(1, Math.min(120, Math.floor(latest * 120) + 1));
    
    // Update synthesizer filter sweep based on scroll position
    if (synthRef.current && synthRef.current.isPlaying) {
      synthRef.current.updateFrequency(latest);
    }

    // Determine current section/stage index
    if (latest < 0.22) {
      setCurrentStage(0);
    } else if (latest >= 0.22 && latest < 0.52) {
      setCurrentStage(1);
    } else if (latest >= 0.52 && latest < 0.82) {
      setCurrentStage(2);
    } else {
      setCurrentStage(3);
    }
  });

  // Handle Navbar hide/show on scroll direction change
  useEffect(() => {
    const handleScrollDir = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScrollDir, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollDir);
  }, [lastScrollY]);

  // Preload all 120 images
  useEffect(() => {
    const totalFrames = 120;
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Initialize audio controller
    synthRef.current = new SynthController();

    const preloadImages = async () => {
      for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        const frameNum = String(i).padStart(4, "0");
        img.src = `/3D Scroll/frame_${frameNum}.png`;
        
        img.onload = () => {
          loadedCount++;
          const percent = Math.floor((loadedCount / totalFrames) * 100);
          setLoadPercentage(percent);
          
          if (loadedCount === totalFrames) {
            // Once all frames are preloaded, add a short premium delay to let the loading animation breathe
            setTimeout(() => {
              setLoading(false);
            }, 1000);
          }
        };

        img.onerror = () => {
          console.error(`Error loading frame_${frameNum}.png`);
          // Continue load progress even on error to avoid landing page getting stuck
          loadedCount++;
          const percent = Math.floor((loadedCount / totalFrames) * 100);
          setLoadPercentage(percent);
          if (loadedCount === totalFrames) {
            setTimeout(() => setLoading(false), 1000);
          }
        };

        loadedImages.push(img);
      }
      setImages(loadedImages);
    };

    preloadImages();

    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  // Main canvas animation and rendering loop
  useEffect(() => {
    if (loading || images.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Responsive Canvas Resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize Volumetric Dust Particles
    const particles: Particle[] = [];
    const particleCount = 75;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.5 + 0.1,
        depth: Math.random() * 1.5 + 0.5, // Parallax depth factor
      });
    }

    // Object-fit: cover implementation for Canvas drawing
    const drawImageCover = (img: HTMLImageElement) => {
      const cw = canvas.width / window.devicePixelRatio;
      const ch = canvas.height / window.devicePixelRatio;
      const iw = img.width;
      const ih = img.height;
      
      const r = Math.min(cw / iw, ch / ih);
      let nw = iw * r;
      let nh = ih * r;
      let ar = 1;
      
      if (nw < cw) ar = cw / nw;
      if (Math.abs(ar - 1) < 1e-14 && nh < ch) ar = ch / nh;
      
      nw *= ar;
      nh *= ar;
      
      const sx = (iw - iw / (nw / cw)) * 0.5;
      const sy = (ih - ih / (nh / ch)) * 0.5;
      const sw = iw / (nw / cw);
      const sh = ih / (nh / ch);
      
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    };

    // Track mouse move for parallax
    const handleMouseMove = (e: MouseEvent) => {
      scrollInfo.current.targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      scrollInfo.current.targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;

    const render = () => {
      // 1. Interpolate Frame Index (Lerp) for ultra-smooth transitions
      const diff = scrollInfo.current.targetFrame - scrollInfo.current.currentFrame;
      scrollInfo.current.currentFrame += diff * 0.08; // Smooth inertia factor
      
      const frameToDraw = Math.round(scrollInfo.current.currentFrame);
      const img = images[frameToDraw - 1] || images[0];

      if (img && img.complete) {
        // Draw the image sequence frame
        drawImageCover(img);

        // 2. Smoothly lerp mouse coordinates for Parallax
        scrollInfo.current.mouseX += (scrollInfo.current.targetMouseX - scrollInfo.current.mouseX) * 0.05;
        scrollInfo.current.mouseY += (scrollInfo.current.targetMouseY - scrollInfo.current.mouseY) * 0.05;

        // Apply a subtle canvas tilt/offset based on mouse position
        ctx.save();
        ctx.translate(scrollInfo.current.mouseX * 0.2, scrollInfo.current.mouseY * 0.2);

        // 3. Render Volumetric Dust Particles
        const cw = canvas.width / window.devicePixelRatio;
        const ch = canvas.height / window.devicePixelRatio;

        particles.forEach((p) => {
          // Update particle position (float up, react to scroll progress delta, and add mouse sway)
          p.y += p.vy - (diff * 0.15 * p.depth);
          p.x += p.vx + (scrollInfo.current.mouseX * 0.02 * p.depth);

          // Wrap boundaries
          if (p.y < 0) {
            p.y = ch;
            p.x = Math.random() * cw;
          }
          if (p.x < 0) p.x = cw;
          if (p.x > cw) p.x = 0;

          // Drawing glowy teal circles
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          
          // As progress reaches center (reactor deconstructed), particles glow brighter
          const intensity = 1 + Math.sin(scrollInfo.current.progress * Math.PI) * 0.8;
          ctx.fillStyle = `rgba(45, 212, 191, ${Math.min(0.8, p.alpha * intensity * p.depth)})`;
          
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(45, 212, 191, 0.4)";
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow for next draws
        });

        // 4. Draw Radial Cinematic Vignette Overlay
        const grad = ctx.createRadialGradient(
          cw / 2, ch / 2, Math.min(cw, ch) * 0.25,
          cw / 2, ch / 2, Math.max(cw, ch) * 0.65
        );
        // Deep black frame matching #050505
        grad.addColorStop(0, "rgba(5, 5, 5, 0)");
        grad.addColorStop(0.5, "rgba(5, 5, 5, 0.15)");
        grad.addColorStop(1, "rgba(5, 5, 5, 0.9)");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [loading, images]);

  // Audio Toggle Action
  const toggleSound = () => {
    if (!synthRef.current) return;
    if (soundOn) {
      synthRef.current.stop();
      setSoundOn(false);
    } else {
      synthRef.current.start();
      setSoundOn(true);
    }
  };

  // Nav indicator scroll action
  const scrollToStage = (stageIndex: number) => {
    if (!containerRef.current) return;
    const scrollHeights = [0, 0.35, 0.68, 0.95];
    const targetScrollFraction = scrollHeights[stageIndex];
    const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
    
    window.scrollTo({
      top: totalHeight * targetScrollFraction,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full text-[#ededed]">
      {/* 1. Cinematic Preloader Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.06)_0%,transparent_70%)]" />
            
            {/* Holographic scanner effect line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent shadow-[0_0_20px_rgba(20,184,166,0.6)] animate-[scan_3s_ease-in-out_infinite]" />

            <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
              {/* Circular percentage loader */}
              <div className="relative w-36 h-36 flex items-center justify-center mb-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-teal-950/20 fill-none"
                    strokeWidth="1.5"
                  />
                  <motion.circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-teal-500 fill-none shadow-lg"
                    strokeWidth="2"
                    strokeDasharray="402"
                    strokeDashoffset={402 - (402 * loadPercentage) / 100}
                    transition={{ ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-syne font-bold tracking-tight text-white glow-teal">
                    {loadPercentage}%
                  </span>
                  <span className="text-[9px] font-mono text-teal-500/70 tracking-widest uppercase mt-0.5">
                    Loading
                  </span>
                </div>
              </div>

              {/* Technical status updates */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-10 mb-8"
              >
                <p className="text-[11px] font-mono text-teal-400/80 tracking-widest uppercase animate-pulse">
                  {loadPercentage < 25 && "Initializing holographic matrix..."}
                  {loadPercentage >= 25 && loadPercentage < 55 && "Mapping stone structures..."}
                  {loadPercentage >= 55 && loadPercentage < 85 && "Calibrating core energy fields..."}
                  {loadPercentage >= 85 && "Welcome to Pillai Euforia..."}
                </p>
                <p className="text-[9px] font-mono text-neutral-600 mt-1 uppercase">
                  Data Stream: SECURE_CORE_ALGN_V{loadPercentage}.99
                </p>
              </motion.div>
              
              <div className="w-48 h-[1px] bg-neutral-900 relative">
                <div className="absolute top-0 left-0 h-full bg-teal-500/30 animate-[loading-bar_2s_infinite]" style={{ width: "30%" }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Glassmorphic Apple-style Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: showNavbar ? 0 : -100 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 w-full z-40 px-6 py-4 md:px-12 flex justify-between items-center transition-all duration-300 border-b border-white/[0.03] backdrop-blur-md bg-black/10"
      >
        {/* Left Side: Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => scrollToStage(0)}>
          <div className="relative w-8 h-8 rounded-full border border-teal-500/40 flex items-center justify-center overflow-hidden bg-teal-950/20 group-hover:border-teal-400 transition-colors">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)] group-hover:scale-125 transition-transform" />
          </div>
          <span className="text-sm font-syne font-bold tracking-[0.25em] text-white">
            EUFORIA
          </span>
        </div>

        {/* Center Links (Minimalist & Glassmorphic hover) */}
        <div className="hidden md:flex items-center space-x-1.5 glass-panel px-4 py-1.5 rounded-full text-xs font-mono tracking-widest text-neutral-400">
          <button onClick={() => scrollToStage(0)} className="hover:text-teal-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
            OVERVIEW
          </button>
          <span className="text-white/10 select-none">•</span>
          <button onClick={() => scrollToStage(1)} className="hover:text-teal-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
            DECONSTRUCT
          </button>
          <span className="text-white/10 select-none">•</span>
          <button onClick={() => scrollToStage(2)} className="hover:text-teal-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
            THE CORE
          </button>
          <span className="text-white/10 select-none">•</span>
          <button onClick={() => scrollToStage(3)} className="hover:text-teal-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
            CT SYSTEM
          </button>
        </div>

        {/* Right Side: Volume Toggle & CTA */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSound}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-neutral-300 relative group cursor-pointer"
            title={soundOn ? "Mute soundtrack" : "Unmute soundtrack"}
          >
            {soundOn ? (
              <>
                <Volume2 size={16} className="text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
              </>
            ) : (
              <VolumeX size={16} className="group-hover:scale-110 transition-transform" />
            )}
          </button>

          <button
            onClick={() => scrollToStage(3)}
            className="relative px-5 py-2 rounded-full text-xs font-mono tracking-widest text-white border border-teal-500/30 overflow-hidden bg-teal-500/5 hover:bg-teal-500/10 transition-all hover:border-teal-400 hover:shadow-[0_0_20px_rgba(45,212,191,0.25)] cursor-pointer"
          >
            ENTER THE TEMPLE
          </button>
        </div>
      </motion.nav>

      {/* 3. Sticky Background Canvas Container */}
      <div className="fixed inset-0 w-full h-screen -z-20 bg-[#050505]">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* 4. Awwwards Side Stage Navigator */}
      <div className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center space-y-6">
        <span className="text-[10px] font-mono tracking-[0.25em] rotate-90 origin-center translate-y-[-10px] text-teal-500/50 uppercase select-none">
          TIMELINE
        </span>
        <div className="w-[1px] h-12 bg-neutral-800" />
        <div className="flex flex-col space-y-4">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => scrollToStage(idx)}
              className="group flex items-center justify-end relative py-1 cursor-pointer focus:outline-none"
            >
              <span className="absolute right-8 text-[9px] font-mono tracking-widest text-teal-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-none select-none uppercase">
                {idx === 0 && "01 // ORIGIN"}
                {idx === 1 && "02 // ANOMALY"}
                {idx === 2 && "03 // ACTIVATION"}
                {idx === 3 && "04 // CONVERGENCE"}
              </span>
              <div
                className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                  currentStage === idx
                    ? "bg-teal-400 border-teal-400 scale-125 shadow-[0_0_10px_rgba(45,212,191,0.8)]"
                    : "bg-transparent border-neutral-700 group-hover:border-teal-500/50"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="w-[1px] h-12 bg-neutral-800" />
        <span className="text-[10px] font-mono text-neutral-600 select-none">
          {String(currentStage + 1).padStart(2, "0")}
        </span>
      </div>

      {/* 5. Audio status tip at the bottom left */}
      <div className="fixed left-6 bottom-6 z-30 hidden sm:flex items-center space-x-2 text-[10px] font-mono text-neutral-500 uppercase select-none pointer-events-none">
        <Disc size={12} className={soundOn ? "animate-spin text-teal-500/70" : ""} />
        <span>Audio feedback: {soundOn ? "MODULATING FILTER" : "DORMANT"}</span>
      </div>

      {/* 6. Scroll Driven Text Overlays - Sticky scroll zones */}
      <div ref={containerRef} className="relative w-full h-[600vh] z-10">
        
        {/* SECTION 1: Intro / Ascent (scroll progress ~0% to ~25%) */}
        <ScrollSection scrollYProgress={scrollYProgress} start={0.02} end={0.20}>
          <div className="max-w-3xl flex flex-col space-y-4">
            <div className="flex items-center space-x-3 text-teal-400 font-mono text-xs tracking-[0.3em]">
              <Compass size={14} className="animate-pulse" />
              <span>01 // ORIGIN</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-syne font-extrabold tracking-tight text-white leading-[1.1]">
              The Sentinel of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 glow-teal">
                the Euforia Canopy
              </span>
            </h1>
            
            <p className="text-sm md:text-base font-sans text-neutral-400 leading-relaxed max-w-xl">
              For millennia, a colossal monolith lay dormant beneath equatorial layers. An impenetrable architecture of unknown composite stone, emitting an electric trace humming in harmony with the surrounding ancient root networks.
            </p>
            
            <div className="pt-6 flex items-center space-x-4">
              <span className="text-[10px] font-mono text-teal-500/60 tracking-widest uppercase animate-pulse">
                SCROLL TO INITIATE DECONSTRUCT SEQUENCE
              </span>
              <ChevronDown size={14} className="text-teal-400 animate-bounce" />
            </div>
          </div>
        </ScrollSection>

        {/* SECTION 2: Exploding structure / Anomaly (scroll progress ~25% to ~55%) */}
        <ScrollSection scrollYProgress={scrollYProgress} start={0.28} end={0.48}>
          <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-16">
            <div className="max-w-xl flex flex-col space-y-4">
              <div className="flex items-center space-x-3 text-teal-400 font-mono text-xs tracking-[0.3em]">
                <Layers size={14} />
                <span>02 // ANOMALY</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-syne font-bold tracking-tight text-white leading-tight">
                Architectural <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-200">
                  Deconstruction
                </span>
              </h2>
              
              <p className="text-sm md:text-base font-sans text-neutral-400 leading-relaxed">
                As the planetary alignment reaches geometric zenith, the locking seals release. Slabs of massive structural masonry detach, floating in zero-gravity magnetic alignment to expose a flawless internal schematic map.
              </p>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl max-w-xs flex flex-col space-y-3 font-mono text-[10px] text-neutral-500 border border-white/[0.04] self-start md:self-auto">
              <div className="flex justify-between items-center text-teal-400 border-b border-white/5 pb-2">
                <span className="font-bold">GRID SCHEMATIC</span>
                <span className="animate-pulse flex h-1.5 w-1.5 rounded-full bg-teal-400" />
              </div>
              <div className="flex justify-between">
                <span>SEAL TYPE:</span>
                <span className="text-white">VOLUMETRIC ROTATIONAL</span>
              </div>
              <div className="flex justify-between">
                <span>STABILITY INDEX:</span>
                <span className="text-emerald-400">99.41% // SYNC</span>
              </div>
              <div className="flex justify-between">
                <span>ELEVATION:</span>
                <span className="text-white">EXPLODED PARALLAX</span>
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* SECTION 3: The Glowing core / Activation (scroll progress ~55% to ~80%) */}
        <ScrollSection scrollYProgress={scrollYProgress} start={0.58} end={0.78}>
          <div className="max-w-3xl ml-auto text-right flex flex-col items-end space-y-4">
            <div className="flex items-center space-x-3 text-teal-400 font-mono text-xs tracking-[0.3em]">
              <span>03 // ACTIVATION</span>
              <Activity size={14} className="animate-[pulse_1s_infinite]" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-syne font-bold tracking-tight text-white leading-tight">
              The Mystical <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300 glow-teal">
                Glowing Core
              </span>
            </h2>
            
            <p className="text-sm md:text-base font-sans text-neutral-400 leading-relaxed max-w-xl">
              Deep within the exploded vaults of stone sits the Euforia Core. A reactor chamber of concentrated light channels, drawing bio-electric currents from the Earth. Volumetric light cones pierce the forest dust, signaling the active core matrix.
            </p>
            
            <div className="flex items-center space-x-2 text-[10px] font-mono text-teal-500/60 uppercase">
              <span>FREQUENCY SHIFT REACHING MAX</span>
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
            </div>
          </div>
        </ScrollSection>

        {/* SECTION 4: Reassembly & Synthesis (scroll progress ~80% to ~100%) */}
        <ScrollSection scrollYProgress={scrollYProgress} start={0.84} end={1.0} keepVisible>
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-3 text-teal-400 font-mono text-xs tracking-[0.3em]">
              <HelpCircle size={14} />
              <span>04 // CONVERGENCE</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-syne font-extrabold tracking-tight text-white leading-none">
              Reassembled <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 glow-teal">
                Dormancy
              </span>
            </h2>
            
            <p className="text-sm md:text-base font-sans text-neutral-400 leading-relaxed max-w-lg">
              The segments re-align, sliding back into eternal stonemasonry geometry. The core’s light settles back into deep conduits. The structure sleeps once more, but the threshold is unlocked.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="pt-4"
            >
              <button
                onClick={() => {
                  alert("Welcome to Pillai Euforia");
                }}
                className="px-8 py-4 rounded-full text-sm font-syne font-bold tracking-widest text-[#050505] bg-teal-400 hover:bg-teal-300 hover:shadow-[0_0_30px_rgba(45,212,191,0.6)] transition-all cursor-pointer"
              >
                ENTER THE CORE
              </button>
            </motion.div>
          </div>
        </ScrollSection>

      </div>

      {/* Subtle styles that are component specific */}
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes loading-bar {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

// Optimized Scroll Section component driving editorial fade-in-out effects outside React loop
interface ScrollSectionProps {
  scrollYProgress: any;
  start: number;
  end: number;
  children: React.ReactNode;
  keepVisible?: boolean;
}

function ScrollSection({ scrollYProgress, start, end, children, keepVisible = false }: ScrollSectionProps) {
  // Drive transitions on GPU utilizing Framer Motion values
  const opacity = useTransform(
    scrollYProgress,
    keepVisible 
      ? [start, start + 0.05, 1.0, 1.0]
      : [start, start + 0.04, end - 0.04, end],
    keepVisible
      ? [0, 1, 1, 1]
      : [0, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    keepVisible
      ? [start, start + 0.05, 1.0, 1.0]
      : [start, start + 0.04, end - 0.04, end],
    keepVisible
      ? [40, 0, 0, 0]
      : [40, 0, 0, -40]
  );

  return (
    <div className="h-screen w-full flex items-center justify-center sticky top-0 px-6 md:px-24 pointer-events-none select-none">
      <motion.div
        style={{ opacity, y }}
        className="w-full max-w-6xl pointer-events-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}
