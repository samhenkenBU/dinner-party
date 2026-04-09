import { motion } from "framer-motion";
import { X } from "lucide-react";

interface RestrictionTagProps {
  label: string;
  onRemove?: () => void;
  size?: "sm" | "md";
}

const RestrictionTag = ({ label, onRemove, size = "md" }: RestrictionTagProps) => (
  <motion.span
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className={`inline-flex items-center gap-1 rounded-full bg-coral font-body font-medium text-secondary-foreground ${
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    }`}
  >
    {label}
    {onRemove && (
      <button onClick={onRemove} className="ml-0.5 hover:opacity-70 active:scale-90 transition-transform">
        <X className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
    )}
  </motion.span>
);

export default RestrictionTag;
