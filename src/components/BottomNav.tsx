import { UtensilsCrossed, CalendarDays, Sparkles } from "lucide-react";

type Tab = "profile" | "events" | "discover";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: UtensilsCrossed },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "discover", label: "Discover", icon: Sparkles },
];

const BottomNav = ({ active, onNavigate }: { active: Tab; onNavigate: (tab: Tab) => void }) => (
  <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-teal flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50">
    {tabs.map((t) => {
      const Icon = t.icon;
      const isActive = active === t.id;
      return (
        <button
          key={t.id}
          onClick={() => onNavigate(t.id)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all active:scale-95 ${
            isActive ? "text-coral" : "text-primary-foreground/60"
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px] font-body font-medium">{t.label}</span>
          {isActive && <span className="w-1 h-1 rounded-full bg-coral" />}
        </button>
      );
    })}
  </nav>
);

export default BottomNav;
export type { Tab };
