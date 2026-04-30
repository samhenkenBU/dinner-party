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
}

export interface EventDish {
  id: string;
  guestName: string;
  dishName: string;
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
  dishes?: EventDish[];
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  restrictions: string[];
}

export interface EventPrefill {
  name?: string;
  location?: string;
  description?: string;
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
  eventPrefill: EventPrefill | null;
  setEventPrefill: React.Dispatch<React.SetStateAction<EventPrefill | null>>;
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
  { id: "f4", name: "Morgan Patel", email: "morgan@email.com", restrictions: ["Eggs"] },
  { id: "f5", name: "Riley Nguyen", email: "riley@email.com", restrictions: ["Soy", "Fish"] },
  { id: "f6", name: "Casey Brooks", email: "casey@email.com", restrictions: [] },
  { id: "f7", name: "Avery Tanaka", email: "avery@email.com", restrictions: ["Dairy", "Tree Nuts"] },
  { id: "f8", name: "Jamie Okafor", email: "jamie@email.com", restrictions: ["Wheat", "Sesame"] },
  { id: "f9", name: "Quinn Alvarez", email: "quinn@email.com", restrictions: ["Vegetarian"] },
];

const defaultEvents: AppEvent[] = [
  {
    id: "e1",
    name: "End of Summer Cookout",
    description: "A big end-of-summer celebration with the whole crew. Every guest has at least one dietary restriction — we planned dishes to cover everyone.",
    date: "2026-08-23",
    location: "Olmsted Park, Boston",
    hostName: "Alex Chen",
    isPotluck: true,
    coHosts: ["Jordan Lee"],
    guests: [
      { id: "g1", name: "Alex Chen",    restrictions: ["Gluten", "Tree Nuts"] },
      { id: "g2", name: "Jordan Lee",   restrictions: ["Dairy", "Soy"] },
      { id: "g3", name: "Sam Rivera",   restrictions: ["Peanuts", "Shellfish", "Eggs"] },
      { id: "g4", name: "Taylor Kim",   restrictions: ["Gluten", "Dairy", "Sesame"] },
      { id: "g5", name: "Morgan Patel", restrictions: ["Eggs"] },
      { id: "g6", name: "Riley Nguyen", restrictions: ["Soy", "Fish"] },
      { id: "g7", name: "Casey Brooks", restrictions: [] },
      { id: "g8", name: "Avery Tanaka", restrictions: ["Dairy", "Tree Nuts"] },
      { id: "g9", name: "Jamie Okafor", restrictions: ["Wheat", "Sesame"] },
    ],
    dishes: [
      { id: "d1",  guestName: "Jordan Lee",   dishName: "Guacamole" },
      { id: "d2",  guestName: "Casey Brooks", dishName: "Chips and Salsa" },
      { id: "d3",  guestName: "Sam Rivera",   dishName: "Grilled Chicken" },
      { id: "d4",  guestName: "Jamie Okafor", dishName: "Pulled Pork" },
      { id: "d5",  guestName: "Morgan Patel", dishName: "Carnitas" },
      { id: "d6",  guestName: "Riley Nguyen", dishName: "Quinoa Salad" },
      { id: "d7",  guestName: "Avery Tanaka", dishName: "Roasted Vegetables" },
      { id: "d8",  guestName: "Taylor Kim",   dishName: "Fruit Salad" },
      { id: "d9",  guestName: "Alex Chen",    dishName: "Chili" },
      { id: "d10", guestName: "Casey Brooks", dishName: "Cauliflower Rice" },
      { id: "d11", guestName: "Jordan Lee",   dishName: "Baked Salmon" },
      { id: "d12", guestName: "Sam Rivera",   dishName: "Hummus" },
    ],
  },
  {
    id: "e2",
    name: "Restaurant Dinner",
    description: "Non-potluck example — dish tools are intentionally hidden for this event.",
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
  const [eventPrefill, setEventPrefill] = useState<EventPrefill | null>(null);

  return (
    <AppContext.Provider value={{ user, setUser, friends, setFriends, events, setEvents, hasOnboarded, setHasOnboarded, eventPrefill, setEventPrefill }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
