"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Building2,
  Users,
  UserRound,
  Activity,
  LockKeyhole,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  BarChart3,
  PieChart,
  LayoutDashboard,
  Mail,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animated counter                                                    */
/* ------------------------------------------------------------------ */
function useCountUp(end: number, duration = 1.5) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;
    let startTime: number | null = null;
    let raf: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, end, duration]);

  return { count, ref };
}

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const { count, ref } = useCountUp(end);
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll direction hook                                               */
/* ------------------------------------------------------------------ */
function useScrollDirection() {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const update = () => {
      const current = window.scrollY;
      if (current > lastScrollY && current > 60) {
        setDirection("down");
      } else if (current < lastScrollY) {
        setDirection("up");
      }
      setScrolled(current > 10);
      lastScrollY = current;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { direction, scrolled };
}

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */
const features = [
  {
    title: "Insurers",
    description:
      "Manage claims, policies, and network partnerships efficiently",
    icon: ShieldCheck,
    color: "blue" as const,
  },
  {
    title: "Hospitals",
    description:
      "Streamline patient verification and claim processing",
    icon: Building2,
    color: "green" as const,
  },
  {
    title: "Corporates",
    description:
      "Manage employee health benefits and corporate policies",
    icon: Users,
    color: "purple" as const,
  },
  {
    title: "Patients",
    description:
      "Access your health records and track claim status",
    icon: UserRound,
    color: "orange" as const,
  },
];

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    borderTop: "border-t-blue-500",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    iconBg: "bg-green-100",
    iconText: "text-green-600",
    borderTop: "border-t-green-500",
    text: "text-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
    borderTop: "border-t-purple-500",
    text: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconText: "text-orange-600",
    borderTop: "border-t-orange-500",
    text: "text-orange-600",
  },
};

const stats = [
  { label: "User Roles", value: 4, suffix: "", icon: Users, color: "blue" as const },
  { label: "Claim Tracking", value: 100, suffix: "%", icon: Activity, color: "green" as const },
  { label: "End-to-End Security", value: 99, suffix: "%", icon: LockKeyhole, color: "purple" as const },
  { label: "AI-Powered", value: 24, suffix: "/7", icon: Sparkles, color: "orange" as const },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { direction, scrolled } = useScrollDirection();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden pt-16">
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />

      {/* Very subtle decorative blobs */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* ==================== HEADER ==================== */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: direction === "down" ? "-100%" : 0,
          opacity: 1,
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 ${scrolled ? "shadow-sm" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                InsureLink
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#stats"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Stats
              </a>
              <Link
                href="/login"
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition-colors shadow-sm hover:shadow"
              >
                Login
              </Link>
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-slate-100 bg-white/95 backdrop-blur-md"
            >
              <div className="px-4 py-4 space-y-3">
                <a
                  href="#features"
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-medium text-slate-600 hover:text-slate-900 py-2"
                >
                  Features
                </a>
                <a
                  href="#stats"
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-medium text-slate-600 hover:text-slate-900 py-2"
                >
                  Stats
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition-colors"
                >
                  Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ==================== HERO ==================== */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100dvh-4rem)] flex flex-col justify-center py-6 md:py-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Pakistan&apos;s Smart Health Insurance Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 mb-5 tracking-tight leading-[1.1]"
              >
                Welcome to{" "}
                <span className="text-blue-600">InsureLink</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base md:text-lg text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              >
                Your comprehensive healthcare insurance management platform.
                Connect insurers, hospitals, corporates, and patients in one
                seamless ecosystem.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
              >
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-all font-semibold text-lg shadow-sm hover:shadow-md"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>

            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:block relative"
            >
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 scale-[0.92] origin-center">
                {/* Fake topbar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-slate-100 rounded-full" />
                    <div className="h-8 w-20 bg-blue-600 rounded-lg" />
                  </div>
                </div>

                {/* Fake stat row */}
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                    >
                      <div className="h-2.5 w-12 bg-slate-200 rounded mb-3" />
                      <div className="h-6 w-16 bg-slate-300 rounded mb-2" />
                      <div className="h-2 w-full bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>

                {/* Fake chart area */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <BarChart3 className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="flex items-end gap-3 h-20">
                    {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-200 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Fake pie + list */}
                <div className="flex gap-4">
                  <div className="w-1/3 bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-center">
                    <PieChart className="w-10 h-10 text-blue-200" />
                  </div>
                  <div className="flex-1 space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-300" />
                        <div className="h-2.5 w-full bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative floating elements around mockup */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white rounded-xl border border-slate-100 shadow-lg p-3"
              >
                <Activity className="w-5 h-5 text-green-500" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-slate-100 shadow-lg p-3"
              >
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2"
          >
            <a
              href="#features"
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="text-xs font-medium uppercase tracking-wider">Scroll</span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </a>
          </motion.div>
        </section>

        {/* ==================== FEATURES ==================== */}
        <section id="features" className="py-16 md:py-24 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Built for every stakeholder
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                A unified platform that brings together the entire health
                insurance ecosystem under one roof.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {features.map((feature) => {
                const c = colorMap[feature.color];
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-shadow text-center group cursor-default"
                  >
                    <div
                      className={`w-14 h-14 ${c.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-7 h-7 ${c.iconText}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ==================== STATS ==================== */}
        <section id="stats" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Trusted & Secure
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Numbers that reflect our commitment to reliability, speed, and
                security across the platform.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => {
                const c = colorMap[stat.color];
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5 }}
                    className={`bg-white rounded-2xl p-8 border border-slate-100 ${c.borderTop} border-t-4 text-center hover:shadow-md transition-shadow`}
                  >
                    <div
                      className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}
                    >
                      <Icon className={`w-6 h-6 ${c.iconText}`} />
                    </div>
                    <p className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-1">
                      <CountUp end={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      {stat.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="relative z-10 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">
                  InsureLink
                </span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed">
                Pakistan&apos;s comprehensive healthcare insurance management
                platform connecting insurers, hospitals, corporates, and
                patients.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Platform
              </h4>
              <ul className="space-y-3">
                {["Features", "Login", "Register"].map((item) => (
                  <li key={item}>
                    <Link
                      href={item === "Features" ? "#features" : item === "Login" ? "/login" : "/register"}
                      className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Stay Updated
              </h4>
              <p className="text-sm text-slate-500 mb-4">
                Get the latest updates on platform features and releases.
              </p>
              <form
                className="flex gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} InsureLink. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">Secured by InsureLink</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
