import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import RestrictionTag from "@/components/RestrictionTag";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FriendsScreen = () => {
  const { friends } = useApp();
  const { toast } = useToast();
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    const trimmed = input.trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^[\d\s\-().+]{7,}$/.test(trimmed);

    const alreadyFriend = friends.some((f) => f.name.toLowerCase() === trimmed || f.email.toLowerCase() === trimmed);

    if (alreadyFriend) {
      toast({ title: "Already friends!", description: "This person is already in your friends list." });
    } else if (isEmail || isPhone) {
      toast({ title: "Request sent!", description: `An invite was sent to ${input.trim()}.` });
    } else if (trimmed.length < 3) {
      toast({ title: "Too short", description: "Enter a full name, email, or phone number." });
    } else {
      toast({ title: "User not found", description: "No Dinner Party account found for that name or contact." });
    }
    setInput("");
  };

  return (
    <div className="px-4 pt-4 pb-24">
      <h1 className="font-display text-2xl font-bold text-foreground mb-4">Friends</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Name, email, or phone..."
          className="flex-1 rounded-lg border border-border bg-primary-foreground px-3 py-2.5 font-body text-sm"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-primary text-primary-foreground p-2.5 active:scale-95 transition-transform"
        >
          <UserPlus className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        {friends.map((f) => (
          <div key={f.id} className="bg-primary-foreground rounded-2xl shadow-warm p-4 flex items-start gap-3">
            <Avatar name={f.name} size={44} />
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-foreground">{f.name}</p>
              <p className="font-body text-xs text-muted-foreground">{f.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {f.restrictions.map((r) => (
                  <RestrictionTag key={r} label={r} size="sm" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsScreen;
