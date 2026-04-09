import React, { createContext, useContext, useState, ReactNode } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  restrictions: string[];
}

export interface EventGuest {
  id: string;
  name: string;
  restrictions: string[];
  confirmedDish?: string;
}

export interface AppEvent {
  id: string;
  name: string;
  description?: string;
  date: string;
  location: string;
  hostName: string;
  imageUrl?: string;
  isPotluck?: boolean;
  coHosts?: string[];
  guests: EventGuest[];
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  restrictions: string[];
}

interface AppContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  friends: Friend[];
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  events: AppEvent[];
  setEvents: React.Dispatch<React.SetStateAction<AppEvent[]>>;
  hasOnboarded: boolean;
  setHasOnboarded: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultUser: UserProfile = {
  id: "1",
  name: "Alex Chen",
  email: "alex@email.com",
  phone: "(555) 123-4567",
  restrictions: ["Gluten", "Tree Nuts"],
};

const defaultFriends: Friend[] = [
  { id: "f1", name: "Jordan Lee", email: "jordan@email.com", restrictions: ["Dairy", "Soy"] },
  { id: "f2", name: "Sam Rivera", email: "sam@email.com", restrictions: ["Peanuts", "Shellfish", "Eggs"] },
  { id: "f3", name: "Taylor Kim", email: "taylor@email.com", restrictions: ["Gluten", "Dairy", "Sesame"] },
];

const defaultEvents: AppEvent[] = [
  {
    id: "e1",
    name: "Summer Potluck",
    date: "2026-06-15",
    location: "Central Park Pavilion",
    hostName: "Alex Chen",
    isPotluck: true,
    guests: [
      { id: "g1", name: "Alex Chen", restrictions: ["Gluten", "Tree Nuts"], confirmedDish: "Fruit Salad" },
      { id: "g2", name: "Jordan Lee", restrictions: ["Dairy", "Soy"], confirmedDish: "Guacamole" },
      { id: "g3", name: "Sam Rivera", restrictions: ["Peanuts", "Shellfish", "Eggs"] },
      { id: "g4", name: "Taylor Kim", restrictions: ["Gluten", "Dairy", "Sesame"], confirmedDish: "Grilled Chicken" },
    ],
  },
  {
    id: "e2",
    name: "Office Holiday Dinner",
    date: "2026-12-18",
    location: "The Rustic Table Restaurant",
    hostName: "Jordan Lee",
    isPotluck: false,
    guests: [
      { id: "g5", name: "Jordan Lee", restrictions: ["Dairy", "Soy"] },
      { id: "g6", name: "Alex Chen", restrictions: ["Gluten", "Tree Nuts"] },
      { id: "g7", name: "Casey Morgan", restrictions: ["Fish", "Wheat"] },
    ],
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [friends, setFriends] = useState<Friend[]>(defaultFriends);
  const [events, setEvents] = useState<AppEvent[]>(defaultEvents);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  return (
    <AppContext.Provider value={{ user, setUser, friends, setFriends, events, setEvents, hasOnboarded, setHasOnboarded }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
