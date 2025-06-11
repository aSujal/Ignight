import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ScreenLoaderProps {
  title: string;
  description: string;
}

const ScreenLoader = ({ title, description }: ScreenLoaderProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <Loader2 className="mx-auto h-16 w-16 text-blue-400 animate-spin mb-6" />
        <p className="text-2xl font-semibold mb-2">{title}</p>
        <p className="text-lg text-muted-foreground">{description}</p>
      </motion.div>
    </div>
  );
};

export default ScreenLoader;
