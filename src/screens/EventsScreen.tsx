import { useState } from "react";
import { useApp, AppEvent } from "@/context/AppContext";
import RestrictionTag from "@/components/RestrictionTag";
import { CalendarDays, MapPin, Users, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const EventsScreen = ({ onSelectEvent }: { onSelectEvent: (id: string) => void }) => {
  const { events, setEvents, user } = useApp();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", location: "" });

  const createEvent = () => {
    if (!form.name || !form.date || !form.location) {
      toast({ title: "Please fill all required fields" });
      return;
    }
    if (new Date(form.date) <= new Date()) {
      toast({ title: "Date must be in the future" });
      return;
    }
    const newEvent: AppEvent = {
      id: `e${Date.now()}`,
      name: form.name,
      date: form.date,
      location: form.location,
      hostName: user.name,
      guests: [{ id: user.id, name: user.name, restrictions: user.restrictions }],
    };
    setEvents([...events, newEvent]);
    setForm({ name: "", date: "", location: "" });
    setShowForm(false);
    toast({ title: "Event created!", description: `${form.name} has been added.` });
  };

  const allRestrictions = (e: AppEvent) => {
    const counts: Record<string, number> = {};
    e.guests.forEach((g) => g.restrictions.forEach((r) => { counts[r] = (counts[r] || 0) + 1; }));
    return counts;
  };

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">My Events</h1>
        <button onClick={() => setShowForm(true)} className="rounded-full bg-primary text-primary-foreground p-2 active:scale-95 transition-transform shadow-warm">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="bg-primary-foreground rounded-2xl shadow-warm p-4 space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Event name *" className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm" />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm" />
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location *" className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform">Cancel</button>
                <button onClick={createEvent} className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform">Create</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {events.map((e) => {
          const rc = allRestrictions(e);
          return (
            <button key={e.id} onClick={() => onSelectEvent(e.id)} className="w-full text-left bg-primary-foreground rounded-2xl shadow-warm p-4 active:scale-[0.98] transition-transform">
              <h3 className="font-display font-bold text-lg text-foreground">{e.name}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-body">
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(e.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.location}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{e.guests.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(rc).map(([r, c]) => (
                  <span key={r} className="px-2 py-0.5 rounded-full bg-teal text-primary-foreground text-xs font-body">{r} ({c})</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EventsScreen;
