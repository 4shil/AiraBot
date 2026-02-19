/**
 * Travel & Tourism - KSRTC, Railways, Kerala tourism
 */

export interface TouristSpot {
  name: string;
  district: string;
  type: "hill_station" | "beach" | "backwaters" | "temple" | "wildlife" | "heritage";
  rating: number;
  bestSeason: string;
  activities: string[];
  nearbyStays: string[];
}

export interface BusRoute {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  busType: "ordinary" | "fast_passenger" | "limited_stop" | "superfast";
  fare: number;
}

export interface TrainRoute {
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  class: string[];
  fare: number;
}

const KERALA_TOURISM: TouristSpot[] = [
  {
    name: "Munnar",
    district: "Idukki",
    type: "hill_station",
    rating: 4.7,
    bestSeason: "Sep-May",
    activities: ["Tea estates", "Trekking", "Eravikulam National Park", "Photography"],
    nearbyStays: ["Tea County", "Windermere Estate", "KTDC Tea County"],
  },
  {
    name: "Alleppey Backwaters",
    district: "Alappuzha",
    type: "backwaters",
    rating: 4.6,
    bestSeason: "Nov-Feb",
    activities: ["Houseboat cruise", "Village tour", "Toddy tasting", "Canoeing"],
    nearbyStays: ["Punnamada Resort", "Lemon Tree Vembanad Lake"],
  },
  {
    name: "Kovalam Beach",
    district: "Thiruvananthapuram",
    type: "beach",
    rating: 4.4,
    bestSeason: "Oct-Mar",
    activities: ["Swimming", "Surfing", "Lighthouse visit", "Ayurvedic massage"],
    nearbyStays: ["Taj Green Cove", "Leela Kovalam"],
  },
  {
    name: "Wayanad",
    district: "Wayanad",
    type: "hill_station",
    rating: 4.5,
    bestSeason: "Oct-May",
    activities: ["Trekking", "Wildlife safari", "Waterfalls", "Spice plantations"],
    nearbyStays: ["Vythiri Resort", "Banasura Hill Resort"],
  },
];

export async function getTouristSpots(type?: TouristSpot["type"]): Promise<TouristSpot[]> {
  if (type) {
    return KERALA_TOURISM.filter((s) => s.type === type);
  }
  return KERALA_TOURISM;
}

export async function getBusRoute(from: string, to: string): Promise<BusRoute[]> {
  // Simulated KSRTC API - replace with actual API
  return [
    {
      from,
      to,
      departureTime: "08:00 AM",
      arrivalTime: "11:30 AM",
      busType: "superfast",
      fare: 150,
    },
    {
      from,
      to,
      departureTime: "10:30 AM",
      arrivalTime: "02:00 PM",
      busType: "ordinary",
      fare: 100,
    },
  ];
}

export async function getTrainPNR(pnr: string): Promise<string> {
  // Simulated PNR check
  return `PNR ${pnr}: Confirmed, Coach B3, Berth 45`;
}

export function formatTourismManglish(spot: TouristSpot): string {
  return `${spot.name} (${spot.district})
${spot.rating}⭐ - ${spot.type}
Best time: ${spot.bestSeason}
Activities: ${spot.activities.join(", ")}
Stays: ${spot.nearbyStays.slice(0, 2).join(", ")}`;
}

