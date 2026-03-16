"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Globe from "@/components/Globe";
import { ArrowRight, MapPin, Search, ShieldCheck, Heart, Globe as GlobeIcon, Users, Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative w-full overflow-hidden bg-[#fffdf9]">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen">
        {/* Soft background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] rounded-full bg-amber-100/60 blur-[100px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-100/40 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-0">
          <div className="flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-5rem)] gap-8">

            {/* Left: Text */}
            <motion.div
              className="w-full lg:w-1/2 flex flex-col justify-center space-y-7 z-10"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit">
                <span className="flex w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-medium text-amber-600">Next Gen Pet Community</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight text-gray-900">
                The Smart Map<br />
                For <span className="text-gradient">Pet Lovers</span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-500 max-w-lg leading-relaxed">
                Discover real-time pet missions, adopt animals globally, or simply walk your dog with a community that cares.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.5)] hover:-translate-y-0.5">
                  Download App
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push("/globe")}
                  className="flex items-center justify-center gap-2 glass hover:bg-white/70 text-amber-700 px-8 py-4 rounded-full font-bold text-lg transition-all border border-amber-200"
                >
                  Explore Globe
                </button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                {[
                  { icon: MapPin, color: "text-amber-500", label: "Live Missions" },
                  { icon: Search, color: "text-emerald-500", label: "AI Pet ID" },
                  { icon: ShieldCheck, color: "text-blue-500", label: "Safe Network" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-500">
                    <t.icon className={`w-5 h-5 ${t.color}`} />
                    <span className="text-sm font-medium">{t.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Globe */}
            <motion.div
              className="w-full lg:w-1/2 flex justify-center items-center h-[420px] lg:h-[700px] relative"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.15 }}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                <Globe />
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-1.5 rounded-full text-xs text-amber-600 animate-pulse pointer-events-none font-medium">
                Drag to spin · Click a label to explore
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-12 border-y border-gray-100 bg-white/60">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Pet Lovers" },
            { value: "50+", label: "Countries" },
            { value: "5K+", label: "Missions Completed" },
            { value: "2K+", label: "Pets Adopted" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-extrabold text-gradient">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Why PawPal?
        </motion.h2>
        <p className="text-center text-gray-500 max-w-xl mx-auto mb-12">
          Everything you need to keep your furry (or scaly) friends happy and connected.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: GlobeIcon, title: "Global Map", desc: "See live missions around the world on our interactive 3D globe.", color: "bg-blue-50 text-blue-500" },
            { icon: Heart, title: "Adopt & Rescue", desc: "Find pets near you who need a loving home. Every click saves a life.", color: "bg-rose-50 text-rose-500" },
            { icon: Users, title: "Community", desc: "Connect with local pet owners, walkers, and sitters in your area.", color: "bg-emerald-50 text-emerald-500" },
            { icon: Sparkles, title: "AI Pet ID", desc: "Point your camera at any animal and let our AI identify breed, age, and more.", color: "bg-amber-50 text-amber-500" },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass p-6 rounded-2xl border border-gray-100 hover:border-amber-300/50 transition-all hover:shadow-lg group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-gradient-to-r from-amber-50 to-emerald-50">
        <div className="max-w-3xl mx-auto text-center px-4">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to Join the Pack?
          </motion.h2>
          <p className="text-gray-500 mb-8 text-lg">
            Download PawPal today and start connecting with pet lovers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:-translate-y-0.5">
              Get PawPal Free
            </button>
            <button
              onClick={() => router.push("/globe")}
              className="glass hover:bg-white/70 text-amber-700 px-8 py-4 rounded-full font-bold text-lg transition-all border border-amber-200"
            >
              Explore the Globe →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
