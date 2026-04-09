import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import RestrictionTag from "@/components/RestrictionTag";
import { ArrowLeft, Send, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { checkDishSafety, getSafeAlternatives, DishSafetyResult } from "@/lib/dishSafety";

const EventDetailScreen = ({ eventId, onBack }: { eventId: string; onBack: () => void }) => {
  const { events } = useApp();
  const { toast } = useToast();
  const event = events.find((e) => e.id === eventId);
  const [dishInput, setDishInput] = useState("");
  const [result, setResult] = useState<DishSafetyResult | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const restrictionSummary = useMemo(() => {
    if (!event) return {};
    const counts: Record<string, number> = {};
    event.guests.forEach((g) => g.restrictions.forEach((r) => { counts[r] = (counts[r] || 0) + 1; }));
    return counts;
  }, [event]);

  const guestRestrictions = useMemo(() => {
    if (!event) return [];
    return event.guests.map((g) => g.restrictions.map((r) => r.toLowerCase()));
  }, [event]);

  const handleCheck = () => {
    if (!dishInput.trim()) return;
    const res = checkDishSafety(dishInput.trim(), guestRestrictions);
    setResult(res);
    if (res.rating === "red" || res.rating === "yellow") {
      setAlternatives(getSafeAlternatives(guestRestrictions, res.matchedDish || undefined));
    } else {
      setAlternatives([]);
    }
  };

  if (!event) return null;

  const badgeColors: Record<string, string> = {
    green: "bg-safe text-primary-foreground",
    yellow: "bg-caution text-foreground",
    red: "bg-danger text-primary-foreground",
    unknown: "bg-muted text-muted-foreground",
  };
  const badgeEmoji: Record<string, string> = { green: "🟢", yellow: "🟡", red: "🔴", unknown: "🟡" };

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
          onChange={(e) => { setDishInput(e.target.value); setResult(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          placeholder="What dish are you bringing?"
          className="flex-1 rounded-lg border border-border bg-primary-foreground px-3 py-2.5 font-body text-sm"
        />
        <button onClick={handleCheck} className="rounded-lg bg-primary text-primary-foreground p-2.5 active:scale-95 transition-transform">
          <Search className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 rounded-2xl bg-primary-foreground shadow-warm p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{badgeEmoji[result.rating]}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-body font-medium ${badgeColors[result.rating]}`}>
                {result.rating === "unknown" ? "Unknown Dish" : result.matchedDish}
              </span>
            </div>
            <p className="font-body text-sm text-foreground mt-2">{result.message}</p>
            {result.flaggedAllergens.length > 0 && (
              <p className="font-body text-xs text-muted-foreground mt-1">Contains: {result.flaggedAllergens.join(", ")}</p>
            )}
            {alternatives.length > 0 && (
              <div className="mt-3">
                <p className="font-body text-xs font-medium text-foreground mb-1.5">Safe alternatives:</p>
                <div className="flex flex-wrap gap-1.5">
                  {alternatives.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDishInput(d); setResult(null); }}
                      className="px-2.5 py-1 rounded-full bg-safe/20 text-safe text-xs font-body font-medium active:scale-95 transition-transform"
                    >
                      {d}
                    </button>
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
