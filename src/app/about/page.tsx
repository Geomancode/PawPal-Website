"use client";

import { motion } from "framer-motion";
import { Users, Heart, Shield, Globe } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">About <span className="text-amber-500">PawPal</span></h1>
        <p className="text-lg text-gray-600">
          We are on a mission to build the world's most connected ecosystem for pets and their humans.
          PawPal empowers a global network of pet lovers to help, share, and protect every animal.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        {[
          { icon: Users, title: "Community First", desc: "Built by pet lovers, for pet lovers. We believe in the power of local packs." },
          { icon: Shield, title: "Safe & Verified", desc: "Every user and pet is verified through our AI network ensuring safe physical meetups." },
          { icon: Globe, title: "Global Reach", desc: "Our Smart Map links missions across the world in real-time." },
          { icon: Heart, title: "Animal Welfare", desc: "Dedicated spaces for adoption, rescue, and finding lost pets quickly." }
        ].map((feat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border border-gray-100 hover:border-amber-400/50 transition-colors shadow-sm hover:shadow-md"
          >
            <feat.icon className="w-10 h-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-800">{feat.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
