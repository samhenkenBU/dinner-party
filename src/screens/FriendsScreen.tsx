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
    const found = friends.some((f) => f.name.toLowerCase() === input.toLowerCase() || f.email.toLowerCase() === input.toLowerCase());
    toast({
      title: found ? "Already friends!" : Math.random() > 0.5 ? "Request sent!" : "User not found",
      description: found ? "This person is already your friend." : undefined,
    });
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
        <button onClick={handleAdd} className="rounded-lg bg-primary text-primary-foreground p-2.5 active:scale-95 transition-transform">
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
