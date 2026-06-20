"use client";
import { motion } from 'framer-motion';

export const Background = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-50 dark:bg-[#030712] pointer-events-none">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]"></div>

      {/* Floating Animated Orbs */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-blue-500/20 dark:bg-blue-600/20 blur-[100px] mix-blend-normal"
      />
      
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px] mix-blend-normal"
      />
      
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[90px] mix-blend-normal"
      />
    </div>
  );
};
