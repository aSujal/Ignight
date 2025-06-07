import React from "react";
import { motion } from "framer-motion";

const ErrorMessage = ({ error }: { error: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto mb-6"
    >
      <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-4 text-destructive-foreground text-center shadow-md">
        <p className="font-medium">Error: {error}</p>
      </div>
    </motion.div>
  );
};

export default ErrorMessage;
