import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import RestrictionTag from "@/components/RestrictionTag";
import { ArrowLeft, Send, Search, ChefHat, Check, X as XIcon, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { checkDishSafety, getSafeAlternatives, DishSafetyResult } from "@/lib/dishSafety";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EventDetailScreen = ({ eventId, onBack }: { eventId: string; onBack: () => void }) => {
  const { events, setEvents, user } = useApp();
  const { toast } = useToast();
  const event = events.find((e) => e.id === eventId);
  const [dishInput, setDishInput] = useState("");
  const [result, setResult] = useState<DishSafetyResult | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const [selectedGuest, setSelectedGuest] = useState<(typeof event.guests)[number] | null>(null);
  const [confirmRedOpen, setConfirmRedOpen] = useState(false);
  const [pendingDishName, setPendingDishName] = useState<string | null>(null);

  const restrictionSummary = useMemo(() => {
    if (!event) return {};
    const counts: Record<string, number> = {};
    event.guests.forEach((g) =>
      g.restrictions.forEach((r) => {
        counts[r] = (counts[r] || 0) + 1;
      }),
    );
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

  const commitAddDish = (name: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, dishes: [...(e.dishes || []), { id: `d-${Date.now()}`, guestName: user.name, dishName: name }] }
          : e,
      ),
    );
    setDishInput("");
    setResult(null);
    setAlternatives([]);
    setPendingDishName(null);
    toast({ title: "Dish added!", description: `You're bringing "${name}"` });
  };

  const handleAddDish = (name: string) => {
    const currentResult = result;
    if (currentResult?.rating === "red") {
      setPendingDishName(name);
      setConfirmRedOpen(true);
      return;
    }
    commitAddDish(name);
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

  // Pre-compute safety rating for each confirmed dish
  const dishSafetyMap = useMemo(() => {
    if (!event?.dishes) return {};
    const map: Record<string, DishSafetyResult> = {};
    (event.dishes || []).forEach((d) => {
      map[d.id] = checkDishSafety(d.dishName, guestRestrictions);
    });
    return map;
  }, [event?.dishes, guestRestrictions]);

  return (
    <div className="px-4 pt-4 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-body text-muted-foreground mb-4 active:scale-95 transition-transform"
      >
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
      <p className="font-body text-sm text-muted-foreground mt-1">
        {new Date(event.date).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <p className="font-body text-sm text-muted-foreground">
        {event.location} · Hosted by {event.hostName}
      </p>
      {event.description && <p className="font-body text-sm text-foreground mt-3">{event.description}</p>}

      {/* Restriction Summary */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {Object.entries(restrictionSummary).map(([r, c]) => (
          <span
            key={r}
            className="px-2.5 py-1 rounded-full bg-teal text-primary-foreground text-xs font-body font-medium"
          >
            {r} ({c})
          </span>
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
            <span className="font-body text-xs text-foreground text-center leading-tight w-16 truncate">
              {g.name.split(" ")[0]}
            </span>
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
                {event.dishes.map((d) => {
                  const safetyResult = dishSafetyMap[d.id];
                  return (
                    <div
                      key={d.id}
                      className="bg-primary-foreground rounded-xl shadow-warm p-3 flex items-center gap-3"
                    >
                      <Avatar name={d.guestName} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-sm text-foreground">{d.dishName}</p>
                        <p className="font-body text-xs text-muted-foreground">{d.guestName}</p>
                      </div>
                      {safetyResult && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-body font-medium ${badgeColors[safetyResult.rating]}`}
                        >
                          {badgeEmoji[safetyResult.rating]}
                        </span>
                      )}
                      {d.guestName === user.name && (
                        <button
                          onClick={() =>
                            setEvents((prev) =>
                              prev.map((e) =>
                                e.id === eventId
                                  ? { ...e, dishes: (e.dishes || []).filter((dish) => dish.id !== d.id) }
                                  : e,
                              ),
                            )
                          }
                          className="p-1.5 rounded-full hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors active:scale-95"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Dish Safety Checker + Add */}
          <h2 className="font-display text-lg font-bold text-foreground mt-6 mb-3">Add a Dish</h2>
          <div className="flex gap-2">
            <input
              value={dishInput}
              onChange={(e) => {
                setDishInput(e.target.value);
                setResult(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="Search for a dish to bring..."
              className="flex-1 rounded-lg border border-border bg-primary-foreground px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleCheck}
              className="rounded-lg bg-primary text-primary-foreground p-2.5 active:scale-95 transition-transform"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 rounded-2xl bg-primary-foreground shadow-warm p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{badgeEmoji[result.rating]}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-body font-medium ${badgeColors[result.rating]}`}
                  >
                    {result.rating === "unknown" ? "Unknown Dish" : result.matchedDish}
                  </span>
                </div>
                <p className="font-body text-sm text-foreground mt-2">{result.message}</p>
                {result.flaggedAllergens.length > 0 && (
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Contains: {result.flaggedAllergens.join(", ")}
                  </p>
                )}

                <button
                  onClick={() => handleAddDish(result.matchedDish || dishInput.trim())}
                  className="mt-3 w-full rounded-lg bg-teal text-primary-foreground px-3 py-2.5 text-sm font-body font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <ChefHat className="h-4 w-4" /> Add Dish
                </button>

                {alternatives.length > 0 && (
                  <div className="mt-3">
                    <p className="font-body text-xs font-medium text-foreground mb-1.5">Safe alternatives:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {alternatives.map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            setDishInput(d);
                            setResult(null);
                          }}
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

      {/* Red Dish Confirmation Dialog */}
      <Dialog
        open={confirmRedOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRedOpen(false);
            setPendingDishName(null);
          }
        }}
      >
        <DialogContent className="max-w-[340px] rounded-2xl bg-card p-0 gap-0">
          <DialogHeader className="p-5 pb-3">
            <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger" /> Unsafe Dish
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-5 space-y-4">
            <p className="font-body text-sm text-foreground">
              <span className="font-semibold">{pendingDishName}</span> conflicts with the restrictions of{" "}
              {result?.affectedGuests} {result?.affectedGuests === 1 ? "guest" : "guests"} at this event.
            </p>
            {result?.flaggedAllergens && result.flaggedAllergens.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.flaggedAllergens.map((a) => (
                  <span
                    key={a}
                    className="px-2.5 py-1 rounded-full bg-danger/10 text-danger text-xs font-body font-medium capitalize"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
            <p className="font-body text-xs text-muted-foreground">
              Are you sure you want to bring this dish? Consider choosing a safe alternative instead.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setConfirmRedOpen(false);
                  setPendingDishName(null);
                }}
                className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform"
              >
                Choose Alternative
              </button>
              <button
                onClick={() => {
                  setConfirmRedOpen(false);
                  if (pendingDishName) commitAddDish(pendingDishName);
                }}
                className="flex-1 rounded-lg border border-danger text-danger px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform"
              >
                Bring Anyway
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailScreen;
