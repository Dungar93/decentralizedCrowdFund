import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { FiShield, FiHeart, FiActivity, FiGlobe, FiLock, FiCpu, FiCheckCircle, FiUploadCloud, FiXCircle, FiUsers, FiDollarSign, FiAward, FiArrowRight } from "react-icons/fi";
import ThemeToggle from "../components/ui/ThemeToggle";

/* ─── Animated Counter Component ─── */
function AnimatedCounter({ target, suffix = "", prefix = "", duration = 2 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── Floating Particle Field ─── */
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -200 - Math.random() * 300],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Track mouse for interactive glow
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // Parallax effects
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -300]);
  const o1 = useTransform(scrollY, [0, 400], [0.3, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.95]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.6]);

  const floatAnim: any = {
    y: [-20, 20],
    rotate: [-1.5, 1.5],
    transition: { duration: 5, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" }
  };

  const floatPulseAnim: any = {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  const testimonials = [
    { name: "Dr. Priya Sharma", role: "Apollo Hospitals, Delhi", text: "MedTrustFund has revolutionized how we receive and manage patient funding. The escrow system gives donors unmatched confidence.", avatar: "PS" },
    { name: "Rajesh Kumar", role: "Donor, 47 campaigns funded", text: "For the first time, I can see exactly where my donations go. The blockchain transparency is incredible — every rupee accounted for.", avatar: "RK" },
    { name: "Anita Desai", role: "Patient, Heart Surgery Funded", text: "My surgery was fully funded in 3 weeks. The AI verification made hospitals trust the platform immediately.", avatar: "AD" },
  ];


  return (
    <div className="min-h-screen bg-[#070514] text-white overflow-hidden relative selection:bg-fuchsia-500/40">
      
      {/* Particle Field */}
      <ParticleField />

      {/* Cursor Glow Effect */}
      <div 
        className="fixed w-[500px] h-[500px] rounded-full pointer-events-none z-[1] opacity-20 mix-blend-screen"
        style={{
          background: "radial-gradient(circle, rgba(192,38,211,0.15) 0%, transparent 70%)",
          left: mousePosition.x - 250,
          top: mousePosition.y - 250,
          transition: "left 0.3s ease-out, top 0.3s ease-out",
        }}
      />

      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 bg-[url('https://api.typedream.com/v0/document/public/80f7bc74-6869-45d2-a7d5-dacedaab59f7_Noise_Background_png.png')] opacity-[0.15] pointer-events-none mix-blend-overlay z-0"></div>
      <motion.div style={{ y: y1, opacity: o1 }} className="fixed top-[-20%] left-[-15%] w-[1000px] h-[1000px] bg-fuchsia-600/20 rounded-full blur-[200px] pointer-events-none" />
      <motion.div style={{ y: y2, opacity: o1 }} className="fixed top-[20%] right-[-20%] w-[900px] h-[900px] bg-cyan-600/15 rounded-full blur-[180px] pointer-events-none" />
      <motion.div animate={floatPulseAnim} className="fixed bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      {/* ─── Navigation ─── */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 py-3 bg-black/30 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center font-black text-lg text-white shadow-[0_0_20px_rgba(192,38,211,0.5)] group-hover:shadow-[0_0_30px_rgba(192,38,211,0.8)] transition-shadow">
              M
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-black tracking-tight text-white block leading-none">MedTrustFund</span>
              <span className="text-[10px] font-bold text-fuchsia-400/80 tracking-[0.15em] uppercase">Decentralized Healthcare</span>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
            className="flex items-center gap-3 sm:gap-5"
          >
            <button onClick={() => navigate('/campaigns')} className="hidden md:block text-slate-400 hover:text-white font-semibold transition-colors text-sm">
              Campaigns
            </button>
            <button onClick={() => navigate('/login')} className="hidden md:block text-slate-400 hover:text-white font-semibold transition-colors text-sm">
              Sign In
            </button>
            <ThemeToggle />
            <button onClick={() => navigate('/signup')} className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] transition-all text-white border border-white/10">
              Get Started
            </button>
          </motion.div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <motion.main style={{ scale: heroScale, opacity: heroOpacity }} className="relative pt-36 sm:pt-44 pb-20 px-6 sm:px-10 z-10 flex flex-col items-center">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left Text */}
          <div className="flex-1 text-center lg:text-left relative z-20">
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, type: "spring" }} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,1)]" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 text-xs font-black tracking-[0.2em] uppercase">
                Mainnet Active • Polygon Network
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, type: "spring" }}
              className="text-[2.8rem] sm:text-[4.5rem] lg:text-[5.5rem] font-black leading-[1.02] tracking-tighter mb-6 relative"
            >
              <span className="text-white drop-shadow-2xl">Fund Healthcare,</span><br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-indigo-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(192,38,211,0.3)]">
                Cryptographically.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed font-medium"
            >
              The world's first AI-verified, blockchain-escrowed medical crowdfunding protocol. Every donation is locked until hospitals confirm treatment milestones on-chain.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button 
                onClick={() => navigate('/campaigns')}
                className="group relative w-full sm:w-auto px-8 py-4 bg-white rounded-2xl font-black text-slate-900 transition-all overflow-hidden hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2">Explore Campaigns <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              </button>
              <button 
                onClick={() => navigate('/create-campaign')}
                className="group w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-md text-white"
              >
                <FiHeart className="text-fuchsia-400 w-5 h-5" />
                <span className="text-slate-200 group-hover:text-white transition-colors">Start Fundraising</span>
              </button>
            </motion.div>

            {/* Mini trust badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center justify-center lg:justify-start gap-6 mt-10 text-slate-500 text-xs font-medium">
              <span className="flex items-center gap-1.5"><FiShield className="text-emerald-500" /> AI Verified</span>
              <span className="flex items-center gap-1.5"><FiLock className="text-fuchsia-500" /> Escrow Locked</span>
              <span className="flex items-center gap-1.5"><FiGlobe className="text-cyan-500" /> On-Chain</span>
            </motion.div>
          </div>

          {/* Right Holographic Visual */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none hidden lg:block z-20">
            {/* Floating sub-card 1 */}
            <motion.div 
              animate={{ y: [-15, 15], x: [-5, 5], rotateZ: [-3, 3] }} transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute -left-16 top-8 z-30 glass-card p-4 rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50 text-emerald-400"><FiShield /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Escrow Status</p>
                  <p className="text-sm font-bold text-white">Funds Locked 🔒</p>
                </div>
              </div>
            </motion.div>

            {/* Floating sub-card 2 */}
            <motion.div 
              animate={{ y: [15, -15], x: [5, -5], rotateZ: [3, -3] }} transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute -right-10 bottom-16 z-30 glass-card p-4 rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/50 text-fuchsia-400"><FiActivity /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Milestone</p>
                  <p className="text-sm font-bold text-white">Treatment Verified ✓</p>
                </div>
              </div>
            </motion.div>

            {/* Floating sub-card 3 - NEW */}
            <motion.div 
              animate={{ y: [-10, 10], x: [3, -3] }} transition={{ duration: 4.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute -right-8 top-4 z-30 glass-card p-3 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md shadow-xl"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 text-cyan-400 text-xs"><FiDollarSign /></div>
                <div>
                  <p className="text-[9px] uppercase font-black tracking-wider text-slate-500">Just Donated</p>
                  <p className="text-xs font-bold text-emerald-400">+ 0.5 ETH</p>
                </div>
              </div>
            </motion.div>

            {/* Main Center Card */}
            <motion.div animate={floatAnim} className="relative z-10 glass-panel p-8 rounded-3xl border border-white/15 shadow-[0_0_80px_rgba(192,38,211,0.15)] bg-gradient-to-b from-white/10 to-black/50 backdrop-blur-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-fuchsia-500/15 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 mix-blend-screen" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-purple-500/30 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/30">
                    <FiActivity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Smart Contract</p>
                    <p className="text-xs text-emerald-400 font-mono">0x7F...3B9A • Active</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full text-emerald-400 text-[10px] font-black tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  Verified
                </div>
              </div>

              <div className="space-y-3 mb-6 relative z-10">
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ duration: 2, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 relative rounded-full"
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-full"><div className="w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]" /></div>
                  </motion.div>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 tracking-wide">
                  <span>7.2 ETH Raised</span>
                  <span className="text-slate-500">10.0 ETH Goal</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-black/40 p-4 rounded-2xl border border-cyan-500/10 hover:bg-cyan-900/10 transition-colors group/card">
                  <FiCpu className="text-cyan-400 w-5 h-5 mb-2 group-hover/card:scale-110 transition-transform" />
                  <p className="text-white font-bold text-sm">AI Analyzed</p>
                  <p className="text-slate-500 text-[11px]">Medical documents</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-fuchsia-500/10 hover:bg-fuchsia-900/10 transition-colors group/card">
                  <FiLock className="text-fuchsia-400 w-5 h-5 mb-2 group-hover/card:scale-110 transition-transform" />
                  <p className="text-white font-bold text-sm">Escrow Locked</p>
                  <p className="text-slate-500 text-[11px]">Until treatment</p>
                </div>
              </div>
            </motion.div>

            {/* Orbit traces */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute w-[130%] h-[130%] border border-white/[0.06] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-dashed pointer-events-none" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 65, repeat: Infinity, ease: "linear" }} className="absolute w-[160%] h-[160%] border border-cyan-500/10 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-dashed pointer-events-none" />
          </div>
        </div>
      </motion.main>

      {/* ─── Live Stats Strip ─── */}
      <section className="relative py-16 z-10 border-y border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-2">
              <div className="w-12 h-12 mx-auto bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20 mb-3"><FiHeart className="w-5 h-5" /></div>
              <p className="text-3xl sm:text-4xl font-black text-white"><AnimatedCounter target={2847} suffix="+" /></p>
              <p className="text-sm text-slate-400 font-medium">Campaigns Funded</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="space-y-2">
              <div className="w-12 h-12 mx-auto bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 mb-3"><FiDollarSign className="w-5 h-5" /></div>
              <p className="text-3xl sm:text-4xl font-black text-white"><AnimatedCounter target={142} suffix=" ETH" /></p>
              <p className="text-sm text-slate-400 font-medium">Total Raised</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="space-y-2">
              <div className="w-12 h-12 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-3"><FiUsers className="w-5 h-5" /></div>
              <p className="text-3xl sm:text-4xl font-black text-white"><AnimatedCounter target={18400} suffix="+" /></p>
              <p className="text-sm text-slate-400 font-medium">Verified Donors</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="space-y-2">
              <div className="w-12 h-12 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20 mb-3"><FiAward className="w-5 h-5" /></div>
              <p className="text-3xl sm:text-4xl font-black text-white"><AnimatedCounter target={96} suffix="%" /></p>
              <p className="text-sm text-slate-400 font-medium">Success Rate</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Infinite Marquee Ticker ─── */}
      <div className="w-full bg-white/[0.03] border-b border-white/5 overflow-hidden py-3.5 z-20 relative">
        <motion.div 
          animate={{ x: [0, -1035] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap items-center font-mono text-xs tracking-widest text-slate-500 font-bold uppercase"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex shrink-0">
               <span className="mx-6 text-fuchsia-400/70">◆ Hardhat Ethereum</span>
               <span className="mx-6 text-cyan-400/70">◆ AI Document Verification</span>
               <span className="mx-6 text-emerald-400/70">◆ Automated Escrow</span>
               <span className="mx-6 text-amber-400/70">◆ Zero-Trust Architecture</span>
               <span className="mx-6 text-indigo-400/70">◆ KYC Hospital Governance</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── Features Grid ─── */}
      <section className="relative py-28 sm:py-32 z-10 bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-900/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
          <div className="text-center mb-20">
            <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="inline-block px-4 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-fuchsia-400 text-xs font-black tracking-widest uppercase mb-6">Core Technology</motion.span>
            <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6 drop-shadow-lg">Engineering Unbreakable Trust</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">By fusing Deep Learning document analysis with immutable blockchain escrows, we cryptographically eliminate medical fundraising fraud.</p>
          </div>
          
          <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <motion.div variants={itemVariants} className="glass-card p-8 sm:p-10 rounded-[2rem] border border-white/10 group hover:border-cyan-500/40 transition-all hover:-translate-y-3 relative overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-7 border border-cyan-500/20 group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                <FiCpu className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">AI Fraud Detection</h3>
              <p className="text-slate-400 leading-relaxed text-sm font-medium">Our isolated Python Neural Network grades hospital documents in real-time, cross-referencing metadata patterns to block fabricated invoices before they go live.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card p-8 sm:p-10 rounded-[2rem] border border-white/10 group hover:border-fuchsia-500/40 transition-all hover:-translate-y-3 relative overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500/15 blur-3xl pointer-events-none group-hover:bg-fuchsia-500/30 transition-colors duration-500" />
              <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-fuchsia-400 mb-7 border border-fuchsia-500/20 group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(217,70,239,0.15)]">
                <FiShield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Automated Escrow</h3>
              <p className="text-slate-400 leading-relaxed text-sm font-medium">Funds are mathematically locked into a Hardhat smart contract. They are only released when verified hospitals confirm treatment milestones on-chain.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card p-8 sm:p-10 rounded-[2rem] border border-white/10 group hover:border-emerald-500/40 transition-all hover:-translate-y-3 relative overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-7 border border-emerald-500/20 group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                <FiGlobe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">5-Year Audit Trail</h3>
              <p className="text-slate-400 leading-relaxed text-sm font-medium">A continuous compliance pipeline logs every blockchain operation, user access event, and AI verification state for maximum regulatory retention.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section className="relative py-28 sm:py-32 z-10 bg-black/50 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://api.typedream.com/v0/document/public/80f7bc74-6869-45d2-a7d5-dacedaab59f7_Noise_Background_png.png')] opacity-[0.08] pointer-events-none mix-blend-overlay z-0"></div>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
          <div className="text-center mb-20">
            <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="inline-block px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-black tracking-widest uppercase mb-6">Workflow</motion.span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 drop-shadow-lg">How The Platform Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">A seamless fusion of Web2 User Experience and Web3 Cryptographic Security.</p>
          </div>

          <div className="space-y-14 sm:space-y-16 relative">
             <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-fuchsia-500 via-cyan-500 to-emerald-500 opacity-20 -translate-x-1/2 rounded-full hidden md:block" />

             {[
               { step: "1", title: "Publish & Authenticate", color: "fuchsia", icon: <FiUploadCloud className="w-6 h-6" />, desc: "Patients publish their campaign alongside official hospital invoices and medical reports. Everything is securely uploaded through our modern React frontend.", card: (
                 <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl bg-black/40">
                   <div className="h-3 w-1/3 bg-slate-800 rounded-full mb-3" />
                   <div className="h-3 w-2/3 bg-slate-800 rounded-full mb-3" />
                   <div className="h-20 w-full bg-fuchsia-900/10 border border-fuchsia-500/20 rounded-xl flex items-center justify-center text-fuchsia-500/40">
                     <FiUploadCloud className="w-7 h-7" />
                   </div>
                 </div>
               )},
               { step: "2", title: "Deep AI Validation", color: "cyan", icon: <FiCpu className="w-6 h-6" />, desc: "Documents are piped to our isolated Python Neural Network. It scans for watermarks, layout authenticity, and hospital stamps to block forged campaigns.", card: (
                 <div className="glass-card p-6 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.08)] bg-cyan-900/10 backdrop-blur-xl">
                   <span className="text-cyan-400 font-mono text-xs block mb-1 opacity-70">{'>'} Checking document_hash...</span>
                   <span className="text-emerald-400 font-mono text-xs block mb-1">{'>'} Match: Verified Hospital DB</span>
                   <span className="text-cyan-400 font-mono text-xs block font-bold">{'>'} Neural Check Passed: 98.4%</span>
                 </div>
               )},
               { step: "3", title: "Smart Contract Deploy", color: "emerald", icon: <FiLock className="w-6 h-6" />, desc: "Once AI-approved, Administrators deploy a Polygon Smart Contract bound to the campaign's milestone timeline. Funds are locked automatically.", card: (
                 <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.08)] bg-emerald-900/10 backdrop-blur-xl">
                   <span className="text-emerald-400 font-mono text-xs block mb-1 opacity-60">// Contract compiled</span>
                   <span className="text-emerald-400 font-mono text-sm block font-bold">Escrowed: 0x7F2A...3B9A</span>
                   <span className="text-slate-500 font-mono text-[11px] block mt-1">Confirmations: 12/12</span>
                 </div>
               )},
               { step: "4", title: "Hospital Escrow Release", color: "amber", icon: <FiCheckCircle className="w-6 h-6" />, desc: "Donations sit sealed on the network. Funds are algorithmically released ONLY when the KYC-verified hospital confirms treatment on-chain.", card: (
                 <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 backdrop-blur-xl">
                   <div className="w-full h-10 bg-amber-500 rounded-xl flex justify-center items-center font-black text-amber-950 text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                     Release Funds to Hospital
                   </div>
                 </div>
               )},
             ].map((item, index) => (
               <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: index * 0.05 }} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center justify-between gap-8`}>
                 <div className={`md:w-1/2 text-left ${index % 2 === 0 ? 'md:text-right md:pr-14' : 'md:pl-14'}`}>
                   <h3 className={`text-2xl sm:text-3xl font-black text-${item.color}-400 mb-3`}>{item.step}. {item.title}</h3>
                   <p className="text-slate-400 text-base sm:text-lg leading-relaxed">{item.desc}</p>
                 </div>
                 <div className={`absolute hidden md:flex left-1/2 w-14 h-14 bg-black border-[3px] border-${item.color}-500 rounded-full items-center justify-center -translate-x-1/2 shadow-[0_0_25px_rgba(0,0,0,0.5)] z-10`}>
                   <span className={`text-${item.color}-400`}>{item.icon}</span>
                 </div>
                 <div className={`md:w-1/2 w-full ${index % 2 === 0 ? 'md:pl-14' : 'md:pr-14'}`}>
                   {item.card}
                 </div>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* ─── Paradigm Shift ─── */}
      <section className="relative py-28 sm:py-32 z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
           <div className="text-center mb-16">
              <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black tracking-widest uppercase mb-6">Why Choose Us</motion.span>              
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">The Paradigm Shift</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">Why Web3 Escrows and AI are permanently retiring traditional charity platforms.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-8 sm:p-10 rounded-[2rem] border border-red-500/15 bg-red-950/5 backdrop-blur-xl">
                 <div className="flex items-center gap-4 mb-8 text-red-400">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20"><FiXCircle className="w-6 h-6"/></div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Traditional Platforms</h3>
                 </div>
                 <ul className="space-y-5 text-slate-400 font-medium">
                    {["Fabricated invoices pass through manual moderation unchecked", "Funds route directly to personal accounts with 0% guarantee of use", "Zero post-donation transparency — donors can't track outcomes"].map((t, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm sm:text-base">
                        <span className="text-red-500 mt-0.5 px-1.5 py-0.5 bg-red-500/10 rounded text-xs font-black shrink-0">✗</span>
                        <p className="leading-relaxed">{t}</p>
                      </li>
                    ))}
                 </ul>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-8 sm:p-10 rounded-[2rem] border border-emerald-500/25 bg-emerald-950/10 backdrop-blur-xl relative overflow-hidden group hover:-translate-y-2 transition-all shadow-[0_0_40px_rgba(16,185,129,0.08)]">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                 <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/15 blur-[80px]" />
                 <div className="flex items-center gap-4 mb-8 text-emerald-400 relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><FiCheckCircle className="w-6 h-6"/></div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">MedTrustFund Escrow</h3>
                 </div>
                 <ul className="space-y-5 text-slate-300 font-medium relative z-10">
                    {["Deep Learning networks cross-reference documents to expose fraud instantly", "Smart Contracts lock funds in Escrow — inaccessible to personal control", "Only KYC-verified hospitals trigger automated release on proof of treatment"].map((t, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm sm:text-base">
                        <span className="text-emerald-400 mt-0.5 px-1.5 py-0.5 bg-emerald-500/15 rounded text-xs font-black shrink-0">✓</span>
                        <p className="leading-relaxed">{t}</p>
                      </li>
                    ))}
                 </ul>
              </motion.div>
           </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="relative py-28 sm:py-32 z-10 bg-black/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
          <div className="text-center mb-16">
            <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-black tracking-widest uppercase mb-6">Testimonials</motion.span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">Trusted by Thousands</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Real stories from hospitals, donors, and patients who trust our protocol.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-8 rounded-2xl border border-white/10 relative group hover:-translate-y-2 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 blur-3xl pointer-events-none group-hover:bg-fuchsia-500/20 transition-colors" />
                <div className="flex items-start gap-2 mb-4 text-fuchsia-400">
                  {Array.from({ length: 5 }).map((_, j) => <span key={j} className="text-lg">★</span>)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center text-white font-black text-xs">{t.avatar}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Compact CTA ─── */}
      <section className="relative py-16 mb-4 z-10">
        <div className="max-w-4xl mx-auto px-6 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(192,38,211,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-indigo-600 opacity-90" />
            <div className="absolute inset-0 bg-[url('https://api.typedream.com/v0/document/public/80f7bc74-6869-45d2-a7d5-dacedaab59f7_Noise_Background_png.png')] opacity-20 mix-blend-overlay" />
            
            <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Ready to get started?</h2>
                <p className="text-fuchsia-100 text-sm font-medium opacity-80">Join the most secure medical fundraising protocol.</p>
              </div>
              <button onClick={() => navigate('/signup')} className="px-8 py-3.5 bg-white text-indigo-900 font-black rounded-xl text-sm shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 transition-all flex items-center gap-2 shrink-0">
                Get Started <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative border-t border-white/10 pt-16 pb-10 z-10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 cursor-pointer mb-4" onClick={() => navigate('/')}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(192,38,211,0.4)]">M</div>
                <span className="text-xl font-black tracking-tight text-white">MedTrustFund</span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">The first end-to-end decentralized framework eliminating intermediary trust through localized AI models and immutable blockchain ledgers.</p>
            </div>
            <div>
              <h4 className="text-sm font-black text-white mb-4 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li className="hover:text-fuchsia-400 cursor-pointer transition-colors" onClick={() => navigate('/campaigns')}>Campaigns</li>
                <li className="hover:text-fuchsia-400 cursor-pointer transition-colors" onClick={() => navigate('/create-campaign')}>Start Fundraising</li>
                <li className="hover:text-fuchsia-400 cursor-pointer transition-colors" onClick={() => navigate('/login')}>Sign In</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black text-white mb-4 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Documentation</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Blockchain Explorer</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Hospital Partners</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-600">
            <span>MedTrustFund © 2026. All rights cryptographically secured.</span>
            <span>Powered by Hardhat, React & Polygon. Building decentralized futures.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
