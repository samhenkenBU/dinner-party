import { useState, useCallback, useEffect } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import SplashScreen from "@/screens/SplashScreen";
import ProfileScreen from "@/screens/ProfileScreen";

import EventsScreen from "@/screens/EventsScreen";
import EventDetailScreen from "@/screens/EventDetailScreen";
import DineOutScreen from "@/screens/DineOutScreen";
import BottomNav, { Tab } from "@/components/BottomNav";
import logo from "@/assets/dinner-party-logo.png";

const AppShell = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const { eventPrefill } = useApp();

  // When Dine Out triggers a prefill, jump to Events tab so the dialog can mount
  useEffect(() => {
    if (eventPrefill) {
      setSelectedEvent(null);
      setTab("events");
    }
  }, [eventPrefill]);

  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  if (showSplash) return <SplashScreen onDone={handleSplashDone} />;

  const renderScreen = () => {
    if (selectedEvent) {
      return <EventDetailScreen eventId={selectedEvent} onBack={() => setSelectedEvent(null)} />;
    }
    switch (tab) {
      case "profile": return <ProfileScreen />;
      case "events": return <EventsScreen onSelectEvent={(id) => setSelectedEvent(id)} />;
      case "dineout": return <DineOutScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative">
        {/* Top nav */}
        <div className="flex items-center justify-start px-4 py-1 border-b border-border bg-background sticky top-0 z-40">
          <img src={logo} alt="Dinner Party" className="w-20 h-20 -my-3 object-contain relative z-50" />
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
