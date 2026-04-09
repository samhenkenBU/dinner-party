import { useState, useCallback } from "react";
import { AppProvider } from "@/context/AppContext";
import SplashScreen from "@/screens/SplashScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import FriendsScreen from "@/screens/FriendsScreen";
import EventsScreen from "@/screens/EventsScreen";
import EventDetailScreen from "@/screens/EventDetailScreen";
import DiscoverScreen from "@/screens/DiscoverScreen";
import BottomNav, { Tab } from "@/components/BottomNav";
import logo from "@/assets/dinner-party-logo.png";

const AppShell = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  if (showSplash) return <SplashScreen onDone={handleSplashDone} />;

  const renderScreen = () => {
    if (selectedEvent) {
      return <EventDetailScreen eventId={selectedEvent} onBack={() => setSelectedEvent(null)} />;
    }
    switch (tab) {
      case "profile": return <ProfileScreen />;
      case "friends": return <FriendsScreen />;
      case "events": return <EventsScreen onSelectEvent={(id) => setSelectedEvent(id)} />;
      case "discover": return <DiscoverScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative">
        {/* Top nav */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background sticky top-0 z-40">
          <img src={logo} alt="Dinner Party" className="w-8 h-8 object-contain" />
          <span className="font-display font-bold text-foreground text-lg">Dinner Party</span>
        </div>
        {renderScreen()}
        <BottomNav active={selectedEvent ? "events" : tab} onNavigate={(t) => { setSelectedEvent(null); setTab(t); }} />
      </div>
    </div>
  );
};

const Index = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default Index;
