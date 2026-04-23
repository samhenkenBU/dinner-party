import { useState, useRef, useEffect } from "react";
import { useApp, AppEvent } from "@/context/AppContext";
import { CalendarDays, MapPin, Users, Plus, Image, X, ChefHat, ChevronDown, UserPlus, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import Avatar from "@/components/Avatar";

interface EventForm {
  name: string;
  description: string;
  date: string;
  location: string;
  isPotluck: boolean;
  imagePreview: string | null;
  coHosts: string[];
  invitees: string[];
}

const defaultForm: EventForm = {
  name: "",
  description: "",
  date: "",
  location: "",
  isPotluck: false,
  imagePreview: null,
  coHosts: [],
  invitees: [],
};

const EventsScreen = ({ onSelectEvent }: { onSelectEvent: (id: string) => void }) => {
  const { events, setEvents, user, friends } = useApp();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(defaultForm);
  const [coHostOpen, setCoHostOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imagePreview: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const toggleCoHost = (id: string) => {
    setForm((f) => ({
      ...f,
      coHosts: f.coHosts.includes(id) ? f.coHosts.filter((c) => c !== id) : [...f.coHosts, id],
      // ensure co-hosts are also invited as guests
      invitees: f.invitees.includes(id) || f.coHosts.includes(id) ? f.invitees : [...f.invitees, id],
    }));
  };

  const toggleInvitee = (id: string) => {
    setForm((f) => ({
      ...f,
      invitees: f.invitees.includes(id) ? f.invitees.filter((c) => c !== id) : [...f.invitees, id],
      // removing an invitee also removes them as co-host
      coHosts: f.invitees.includes(id) ? f.coHosts.filter((c) => c !== id) : f.coHosts,
    }));
  };

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
      description: form.description || undefined,
      date: form.date,
      location: form.location,
      hostName: user.name,
      isPotluck: form.isPotluck,
      imageUrl: form.imagePreview || undefined,
      coHosts: form.coHosts.length ? form.coHosts.map((id) => friends.find((f) => f.id === id)?.name || id) : undefined,
      guests: [
        { id: user.id, name: user.name, restrictions: user.restrictions },
        ...form.invitees.map((id) => {
          const fr = friends.find((f) => f.id === id);
          return { id: `g-${id}-${Date.now()}`, name: fr?.name || id, restrictions: fr?.restrictions || [] };
        }),
      ],
    };
    setEvents([...events, newEvent]);
    setForm(defaultForm);
    setOpen(false);
    toast({ title: "Event created!", description: `${form.name} has been added.` });
  };

  const allRestrictions = (e: AppEvent) => {
    const counts: Record<string, number> = {};
    e.guests.forEach((g) =>
      g.restrictions.forEach((r) => {
        counts[r] = (counts[r] || 0) + 1;
      }),
    );
    return counts;
  };

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">My Events</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-primary text-primary-foreground p-2 active:scale-95 transition-transform shadow-warm"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Create Event Dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setForm(defaultForm);
        }}
      >
        <DialogContent className="max-w-[400px] rounded-2xl bg-card p-0 gap-0 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-5 pb-2">
            <DialogTitle className="font-display text-xl text-foreground">Create Event</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Fill in the details for your new event.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 pb-5 space-y-4">
            {/* Name */}
            <div>
              <label className="font-body text-xs font-medium text-muted-foreground mb-1 block">Event Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Summer Potluck"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-body text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell guests what to expect..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Date & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs font-medium text-muted-foreground mb-1 block">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-muted-foreground mb-1 block">Location *</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Central Park"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Potluck Checkbox */}
            <div className="flex items-center gap-3 py-1">
              <Checkbox
                id="potluck"
                checked={form.isPotluck}
                onCheckedChange={(v) => setForm({ ...form, isPotluck: !!v })}
                className="border-teal data-[state=checked]:bg-teal data-[state=checked]:border-teal"
              />
              <label
                htmlFor="potluck"
                className="font-body text-sm text-foreground flex items-center gap-1.5 cursor-pointer"
              >
                <ChefHat className="h-4 w-4 text-teal" />
                This is a potluck
              </label>
            </div>

            {/* Image Upload */}
            <div>
              <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block">Cover Image</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              {form.imagePreview ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={form.imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                  <button
                    onClick={() => setForm({ ...form, imagePreview: null })}
                    className="absolute top-2 right-2 bg-foreground/60 text-background rounded-full p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border py-6 flex flex-col items-center gap-1.5 text-muted-foreground hover:border-primary/40 transition-colors"
                >
                  <Image className="h-5 w-5" />
                  <span className="font-body text-xs">Tap to add image</span>
                </button>
              )}
            </div>

            {/* Invite Guests */}
            <div>
              <button
                type="button"
                onClick={() => setInviteOpen((v) => !v)}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 hover:border-muted-foreground/30 transition-colors"
              >
                <span className="flex items-center gap-2 font-body text-sm text-foreground">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Invite Guests
                  {form.invitees.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                      {form.invitees.length}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${inviteOpen ? "rotate-180" : ""}`}
                />
              </button>
              {inviteOpen && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleInvitee(f.id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors text-left ${
                        form.invitees.includes(f.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <Avatar name={f.name} size={32} />
                      <span className="font-body text-sm text-foreground flex-1">{f.name}</span>
                      {form.invitees.includes(f.id) && (
                        <span className="text-xs font-body font-medium text-primary">Invited</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Co-hosts */}
            <div>
              <button
                type="button"
                onClick={() => setCoHostOpen((v) => !v)}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 hover:border-muted-foreground/30 transition-colors"
              >
                <span className="flex items-center gap-2 font-body text-sm text-foreground">
                  <Crown className="h-4 w-4 text-teal" />
                  Add Co-hosts
                  {form.coHosts.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-teal/15 text-teal text-xs font-medium">
                      {form.coHosts.length}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${coHostOpen ? "rotate-180" : ""}`}
                />
              </button>
              {coHostOpen && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleCoHost(f.id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors text-left ${
                        form.coHosts.includes(f.id)
                          ? "border-teal bg-teal/10"
                          : "border-border bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <Avatar name={f.name} size={32} />
                      <span className="font-body text-sm text-foreground flex-1">{f.name}</span>
                      {form.coHosts.includes(f.id) && (
                        <span className="text-xs font-body font-medium text-teal">Co-host</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setForm(defaultForm);
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={createEvent}
                className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform"
              >
                Create Event
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event List */}
      <div className="space-y-3">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-4 opacity-40"
            >
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
              <path
                d="M28 40h24M40 28v24"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-muted-foreground"
              />
              <circle cx="40" cy="40" r="6" fill="currentColor" className="text-muted" />
            </svg>
            <p className="font-display text-lg font-bold text-foreground mb-1">No events yet</p>
            <p className="font-body text-sm text-muted-foreground mb-5">
              Create your first event to start coordinating meals with friends.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-body font-medium active:scale-95 transition-transform"
            >
              Create an Event
            </button>
          </div>
        )}
        {events.map((e) => {
          const rc = allRestrictions(e);
          return (
            <button
              key={e.id}
              onClick={() => onSelectEvent(e.id)}
              className="w-full text-left bg-primary-foreground rounded-2xl shadow-warm p-4 active:scale-[0.98] transition-transform"
            >
              {e.imageUrl && <img src={e.imageUrl} alt={e.name} className="w-full h-28 object-cover rounded-xl mb-3" />}
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-foreground">{e.name}</h3>
                {e.isPotluck && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-body font-medium flex items-center gap-1">
                    <ChefHat className="h-3 w-3" /> Potluck
                  </span>
                )}
              </div>
              {e.description && <p className="mt-2 font-body text-sm text-muted-foreground">{e.description}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-body">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(e.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {e.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {e.guests.length}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-body font-medium ${
                    e.isPotluck ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <ChefHat className="h-3 w-3" />
                  {e.isPotluck ? "Dish tools enabled" : "Dish tools disabled"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(rc).map(([r, c]) => (
                  <span key={r} className="px-2 py-0.5 rounded-full bg-teal text-primary-foreground text-xs font-body">
                    {r} ({c})
                  </span>
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
