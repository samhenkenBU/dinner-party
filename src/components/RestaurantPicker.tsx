import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Search, MapPin, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RESTAURANTS, Restaurant } from "@/data/restaurants";
import { getRestaurantCompatibility, CompatibilityResult } from "@/lib/restaurantCompatibility";

const tierBg: Record<CompatibilityResult["tierColor"], string> = {
  safe: "bg-safe",
  caution: "bg-caution",
  danger: "bg-danger",
};
const tierText: Record<CompatibilityResult["tierColor"], string> = {
  safe: "text-safe",
  caution: "text-caution",
  danger: "text-danger",
};

interface RestaurantPickerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Per-guest lowercase restriction arrays used for compatibility scoring */
  guestRestrictions: string[][];
  onPick: (r: Restaurant) => void;
}

const RestaurantPicker = ({ open, onOpenChange, guestRestrictions, onPick }: RestaurantPickerProps) => {
  const [query, setQuery] = useState("");

  const enriched = useMemo(
    () =>
      RESTAURANTS.map((r) => ({
        restaurant: r,
        compat: getRestaurantCompatibility(r, guestRestrictions),
      })).sort((a, b) => b.compat.score - a.compat.score),
    [guestRestrictions],
  );

  const fuse = useMemo(
    () =>
      new Fuse(enriched, {
        keys: ["restaurant.name", "restaurant.cuisine", "restaurant.neighborhood"],
        threshold: 0.35,
      }),
    [enriched],
  );

  const filtered =
    query.trim().length >= 1 ? fuse.search(query.trim()).map((r) => r.item) : enriched;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] rounded-2xl bg-card p-0 gap-0 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-2">
          <DialogTitle className="font-display text-xl text-foreground">Choose a Restaurant</DialogTitle>
          <DialogDescription className="font-body text-sm text-muted-foreground">
            Ranked by match with your guests' restrictions.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, cuisine, neighborhood..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="px-3 pb-5 space-y-2 overflow-y-auto">
          {filtered.map(({ restaurant: r, compat }) => (
            <button
              key={r.id}
              onClick={() => {
                onPick(r);
                onOpenChange(false);
              }}
              className="w-full text-left rounded-xl border border-border bg-background hover:border-primary/40 p-2.5 flex gap-3 items-center active:scale-[0.98] transition-all"
            >
              <img
                src={r.photoUrl}
                alt={r.name}
                loading="lazy"
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold text-sm text-foreground truncate">{r.name}</p>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${tierBg[compat.tierColor]}`} />
                </div>
                <p className="font-body text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium">{r.cuisine}</span>
                  <MapPin className="h-3 w-3" />
                  {r.neighborhood}
                </p>
              </div>
              <span className={`font-body text-xs font-semibold ${tierText[compat.tierColor]}`}>
                {compat.score}%
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center font-body text-sm text-muted-foreground py-8">
              No restaurants match your search.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantPicker;
