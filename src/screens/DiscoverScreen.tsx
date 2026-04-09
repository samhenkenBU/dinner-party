import { Sparkles } from "lucide-react";

const DiscoverScreen = () => (
  <div className="px-4 pt-4 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
    <div className="w-20 h-20 rounded-full bg-coral/10 flex items-center justify-center mb-4">
      <Sparkles className="h-10 w-10 text-coral" />
    </div>
    <h2 className="font-display text-xl font-bold text-foreground">Coming Soon</h2>
    <p className="font-body text-sm text-muted-foreground mt-2 text-center max-w-[260px]">
      Discover new recipes, restaurants, and friends who share your dietary needs.
    </p>
  </div>
);

export default DiscoverScreen;
