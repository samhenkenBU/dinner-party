import { useEffect } from "react";
import { motion } from "framer-motion";
import logo from "@/assets/dinner-party-logo.png";

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-dark z-50">
      <motion.img
        src={logo}
        alt="Dinner Party"
        className="w-[200px] h-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.p
        className="mt-6 font-display text-3xl text-coral font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Dinner Party
      </motion.p>
      <motion.p
        className="mt-2 font-body text-light-blue text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Eat together. Safely.
      </motion.p>
    </div>
  );
};

export default SplashScreen;
