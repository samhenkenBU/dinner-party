import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import RestrictionTag from "@/components/RestrictionTag";
import { Share2, Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/dinner-party-logo.png";

const PREDEFINED = ["Peanuts", "Tree Nuts", "Dairy", "Gluten", "Shellfish", "Soy", "Eggs", "Wheat", "Fish", "Sesame"];

const ProfileScreen = () => {
  const { user, setUser } = useApp();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [tagInput, setTagInput] = useState("");
  const [showCard, setShowCard] = useState(false);

  const suggestions = tagInput.length >= 2
    ? PREDEFINED.filter((r) => r.toLowerCase().includes(tagInput.toLowerCase()) && !draft.restrictions.includes(r))
    : [];

  const addRestriction = (r: string) => {
    if (!draft.restrictions.includes(r)) {
      setDraft({ ...draft, restrictions: [...draft.restrictions, r] });
    }
    setTagInput("");
  };

  const save = () => {
    setUser(draft);
    setEditing(false);
    toast({ title: "Profile saved!", description: "Your dietary profile has been updated." });
  };

  const cancel = () => {
    setDraft(user);
    setEditing(false);
    setTagInput("");
  };

  const shareCard = () => {
    const slug = user.name.toLowerCase().replace(/\s+/g, "-");
    navigator.clipboard.writeText(`dinnerparty.app/u/${slug}`);
    toast({ title: "Link copied!", description: "Share your card with friends." });
    setShowCard(true);
  };

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Card */}
      <div className="bg-primary-foreground rounded-2xl shadow-warm p-6 text-center">
        <div className="flex justify-center mb-4">
          <Avatar name={user.name} size={72} />
        </div>
        {editing ? (
          <div className="space-y-3 text-left">
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" />
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
            <div className="relative">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add restriction..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    addRestriction(tagInput.trim());
                  }
                }}
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-primary-foreground border border-border rounded-lg shadow-warm z-10">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => addRestriction(s)} className="block w-full text-left px-3 py-2 text-sm font-body hover:bg-background transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-foreground">{user.name}</h2>
            <p className="font-body text-sm text-muted-foreground mt-1">{user.email}</p>
            <p className="font-body text-sm text-muted-foreground">{user.phone}</p>
          </>
        )}

        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <AnimatePresence>
            {(editing ? draft : user).restrictions.map((r) => (
              <RestrictionTag key={r} label={r} onRemove={editing ? () => setDraft({ ...draft, restrictions: draft.restrictions.filter((x) => x !== r) }) : undefined} />
            ))}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 mt-6">
          {editing ? (
            <>
              <button onClick={cancel} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform">Cancel</button>
              <button onClick={save} className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform">Save</button>
            </>
          ) : (
            <>
              <button onClick={() => { setDraft(user); setEditing(true); }} className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform">
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button onClick={shareCard} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform">
                <Share2 className="h-4 w-4" /> Share My Card
              </button>
            </>
          )}
        </div>
      </div>

      {/* Share Card Modal */}
      <AnimatePresence>
        {showCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-dark/60 z-50 flex items-center justify-center p-6" onClick={() => setShowCard(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-cream rounded-2xl shadow-warm-lg p-8 max-w-[340px] w-full text-center relative">
              <button onClick={() => setShowCard(false)} className="absolute top-3 right-3 text-muted-foreground"><X className="h-5 w-5" /></button>
              <img src={logo} alt="Dinner Party" className="w-10 h-10 mx-auto mb-2 object-contain" />
              <h3 className="font-display text-2xl font-bold text-teal mt-2">{user.name}</h3>
              <p className="text-sm font-body text-muted-foreground mt-1">Dietary Profile Card</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {user.restrictions.map((r) => (
                  <RestrictionTag key={r} label={r} size="sm" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-6 font-body">dinnerparty.app/u/{user.name.toLowerCase().replace(/\s+/g, "-")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileScreen;
