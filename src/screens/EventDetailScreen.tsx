import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import RestrictionTag from "@/components/RestrictionTag";
import { ArrowLeft, Send, Search, ChefHat, Check, X as XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { checkDishSafety, getSafeAlternatives, DishSafetyResult } from "@/lib/dishSafety";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EventDetailScreen = ({ eventId, onBack }: { eventId: string; onBack: () => void }) => {
  const { events } = useApp();
  const { toast } = useToast();
  const event = events.find((e) => e.id === eventId);
  const [dishInput, setDishInput] = useState("");
  const [result, setResult] = useState<DishSafetyResult | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [confirmedDish, setConfirmedDish] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<typeof event.guests[number] | null>(null);

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

  const handleConfirmDish = () => {
    if (!confirmInput.trim()) return;
    setConfirmedDish(confirmInput.trim());
    setIsConfirming(false);
    setConfirmInput("");
    toast({ title: "Dish confirmed!", description: `You're bringing "${confirmInput.trim()}"` });
  };

  if (!event) return null;

  const isPotluck = !!event.isPotluck;

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

      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-bold text-foreground">{event.name}</h1>
        {isPotluck && (
          <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-body font-medium flex items-center gap-1">
            <ChefHat className="h-3 w-3" /> Potluck
          </span>
        )}
      </div>
      <p className="font-body text-sm text-muted-foreground mt-1">{new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      <p className="font-body text-sm text-muted-foreground">{event.location} · Hosted by {event.hostName}</p>
      {event.description && <p className="font-body text-sm text-foreground mt-3">{event.description}</p>}

      {/* Restriction Summary */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {Object.entries(restrictionSummary).map(([r, c]) => (
          <span key={r} className="px-2.5 py-1 rounded-full bg-teal text-primary-foreground text-xs font-body font-medium">{r} ({c})</span>
        ))}
      </div>

      {/* Guests */}
      <h2 className="font-display text-lg font-bold text-foreground mt-6 mb-3">Guests ({event.guests.length})</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {event.guests.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGuest(g)}
            className="flex flex-col items-center gap-1.5 min-w-[64px] active:scale-95 transition-transform"
          >
            <Avatar name={g.name} size={48} />
            <span className="font-body text-xs text-foreground text-center leading-tight w-16 truncate">{g.name.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Guest Profile Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={(open) => !open && setSelectedGuest(null)}>
        <DialogContent className="max-w-[340px] rounded-2xl bg-card p-0 gap-0">
          <DialogHeader className="p-5 pb-3">
            <DialogTitle className="font-display text-xl text-foreground">Guest Profile</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="px-5 pb-5 flex flex-col items-center gap-4">
              <Avatar name={selectedGuest.name} size={72} />
              <p className="font-display text-lg font-bold text-foreground">{selectedGuest.name}</p>
              {selectedGuest.restrictions.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {selectedGuest.restrictions.map((r) => (
                    <RestrictionTag key={r} label={r} size="sm" />
                  ))}
                </div>
              ) : (
                <p className="font-body text-sm text-muted-foreground">No dietary restrictions</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Potluck Section */}
      {isPotluck && (
        <>
          {/* What's Being Brought */}
          {event.dishes && event.dishes.length > 0 && (
            <>
              <h2 className="font-display text-lg font-bold text-foreground mt-6 mb-3">
                What's Being Brought ({event.dishes.length})
              </h2>
              <div className="space-y-2">
                {event.dishes.map((d) => (
                  <div key={d.id} className="bg-primary-foreground rounded-xl shadow-warm p-3 flex items-center gap-3">
                    <Avatar name={d.guestName} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-sm text-foreground">{d.dishName}</p>
                      <p className="font-body text-xs text-muted-foreground">{d.guestName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Your Confirmed Dish */}
          <h2 className="font-display text-lg font-bold text-foreground mt-6 mb-3">Your Dish</h2>
          {confirmedDish ? (
            <div className="bg-primary-foreground rounded-xl shadow-warm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-safe/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-safe" />
                </div>
                <div>
                  <p className="font-body font-medium text-sm text-foreground">{confirmedDish}</p>
                  <p className="font-body text-xs text-muted-foreground">You're bringing this!</p>
                </div>
              </div>
              <button
                onClick={() => { setConfirmedDish(null); setIsConfirming(true); setConfirmInput(""); }}
                className="text-xs font-body text-muted-foreground underline active:scale-95 transition-transform"
              >
                Change
              </button>
            </div>
          ) : isConfirming ? (
            <div className="bg-primary-foreground rounded-xl shadow-warm p-4 space-y-3">
              <input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmDish()}
                placeholder="What are you bringing?"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-body font-medium active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDish}
                  className="flex-1 rounded-lg bg-teal text-primary-foreground px-3 py-2 text-sm font-body font-medium active:scale-95 transition-transform"
                >
                  Confirm Dish
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirming(true)}
              className="w-full rounded-xl border-2 border-dashed border-border py-4 flex flex-col items-center gap-1.5 text-muted-foreground hover:border-primary/40 transition-colors active:scale-[0.98]"
            >
              <ChefHat className="h-5 w-5" />
              <span className="font-body text-sm font-medium">Confirm what you're bringing</span>
            </button>
          )}

          {/* Dish Safety Checker */}
          <h2 className="font-display text-lg font-bold text-foreground mt-6 mb-3">Dish Safety Checker</h2>
          <div className="flex gap-2">
            <input
              value={dishInput}
              onChange={(e) => { setDishInput(e.target.value); setResult(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="Check if a dish is safe..."
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
        </>
      )}

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
