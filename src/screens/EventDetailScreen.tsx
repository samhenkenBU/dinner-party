import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import RestrictionTag from "@/components/RestrictionTag";
import { ArrowLeft, Send, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const DISH_MAP: Record<string, string[]> = {
  "pasta salad": ["gluten", "dairy"],
  "caesar salad": ["dairy", "eggs", "fish"],
  "chocolate cake": ["gluten", "dairy", "eggs", "tree nuts"],
  "fruit salad": [],
  "hummus & veggies": ["sesame"],
  "hummus and veggies": ["sesame"],
};

const SAFE_DISHES = ["Fruit Salad", "Grilled Vegetables", "Rice & Beans"];

const EventDetailScreen = ({ eventId, onBack }: { eventId: string; onBack: () => void }) => {
  const { events } = useApp();
  const { toast } = useToast();
  const event = events.find((e) => e.id === eventId);
  const [dishInput, setDishInput] = useState("");
  const [checkedDish, setCheckedDish] = useState<string | null>(null);

  const restrictionSummary = useMemo(() => {
    if (!event) return {};
    const counts: Record<string, number> = {};
    event.guests.forEach((g) => g.restrictions.forEach((r) => { counts[r] = (counts[r] || 0) + 1; }));
    return counts;
  }, [event]);

  const checkDish = () => {
    if (!dishInput.trim()) return;
    setCheckedDish(dishInput.trim());
  };

  const getDishResult = () => {
    if (!checkedDish || !event) return null;
    const key = checkedDish.toLowerCase();
    const ingredients = DISH_MAP[key];

    if (ingredients === undefined) {
      return { level: "unknown" as const, label: "Unknown Dish", overlaps: [] as string[], affectedCount: 0 };
    }

    const guestRestrictions = event.guests.flatMap((g) => g.restrictions.map((r) => r.toLowerCase()));
    const overlaps = ingredients.filter((i) => guestRestrictions.includes(i));
    const affectedGuests = event.guests.filter((g) => g.restrictions.some((r) => ingredients.includes(r.toLowerCase())));
    const count = affectedGuests.length;

    if (count === 0) return { level: "safe" as const, label: "Safe for all guests!", overlaps, affectedCount: 0 };
    if (count === 1) return { level: "caution" as const, label: `Conflicts with 1 guest's restrictions`, overlaps, affectedCount: 1 };
    return { level: "danger" as const, label: `Conflicts with ${count} guests' restrictions`, overlaps, affectedCount: count };
  };

  const result = getDishResult();

  if (!event) return null;

  const badgeColors = { safe: "bg-safe text-primary-foreground", caution: "bg-caution text-foreground", danger: "bg-danger text-primary-foreground", unknown: "bg-muted text-muted-foreground" };
  const badgeEmoji = { safe: "🟢", caution: "🟡", danger: "🔴", unknown: "🟡" };

  return (
    <div className="px-4 pt-4 pb-24">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-body text-muted-foreground mb-4 active:scale-95 transition-transform">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-foreground">{event.name}</h1>
      <p className="font-body text-sm text-muted-foreground mt-1">{new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      <p className="font-body text-sm text-muted-foreground">{event.location} · Hosted by {event.hostName}</p>

      {/* Restriction Summary */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {Object.entries(restrictionSummary).map(([r, c]) => (
          <span key={r} className="px-2.5 py-1 rounded-full bg-teal text-primary-foreground text-xs font-body font-medium">{r} ({c})</span>
        ))}
      </div>

      {/* Guests */}
      <h2 className="font-display text-lg font-bold text-foreground mt-6 mb-3">Guests ({event.guests.length})</h2>
      <div className="space-y-2">
        {event.guests.map((g) => (
          <div key={g.id} className="bg-primary-foreground rounded-xl shadow-warm p-3 flex items-center gap-3">
            <Avatar name={g.name} size={36} />
            <div className="flex-1 min-w-0">
              <p className="font-body font-medium text-sm text-foreground">{g.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {g.restrictions.map((r) => <RestrictionTag key={r} label={r} size="sm" />)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dish Checker */}
      <h2 className="font-display text-lg font-bold text-foreground mt-6 mb-3">Dish Safety Checker</h2>
      <div className="flex gap-2">
        <input
          value={dishInput}
          onChange={(e) => { setDishInput(e.target.value); setCheckedDish(null); }}
          onKeyDown={(e) => e.key === "Enter" && checkDish()}
          placeholder="What dish are you bringing?"
          className="flex-1 rounded-lg border border-border bg-primary-foreground px-3 py-2.5 font-body text-sm"
        />
        <button onClick={checkDish} className="rounded-lg bg-primary text-primary-foreground p-2.5 active:scale-95 transition-transform">
          <Search className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 rounded-2xl bg-primary-foreground shadow-warm p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{badgeEmoji[result.level]}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-body font-medium ${badgeColors[result.level]}`}>
                {result.label}
              </span>
            </div>
            {result.overlaps.length > 0 && (
              <p className="font-body text-xs text-muted-foreground mt-2">Contains: {result.overlaps.join(", ")}</p>
            )}
            {(result.level === "caution" || result.level === "danger") && (
              <div className="mt-3">
                <p className="font-body text-xs font-medium text-foreground mb-1.5">Safe alternatives:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SAFE_DISHES.map((d) => (
                    <span key={d} className="px-2.5 py-1 rounded-full bg-safe/20 text-safe text-xs font-body font-medium">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(`dinnerparty.app/event/${event.id}`);
          toast({ title: "Invite link copied!", description: "Share this link to invite guests." });
        }}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 font-body font-medium active:scale-95 transition-transform"
      >
        <Send className="h-4 w-4" /> Invite Guests
      </button>
    </div>
  );
};

export default EventDetailScreen;
