/**
 * Food Delivery Integration
 * Swiggy, Zomato, local restaurant recommendations
 */

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  deliveryTime: number; // minutes
  priceRange: "₹" | "₹₹" | "₹₹₹";
  location: string;
  distance: number; // km
  isOpen: boolean;
  popularDishes: string[];
}

export interface FoodOrder {
  restaurant: Restaurant;
  items: OrderItem[];
  total: number;
  deliveryAddress: string;
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered";
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

export interface FoodDeliveryService {
  searchRestaurants(query: string, location: string): Promise<Restaurant[]>;
  getRestaurantDetails(id: string): Promise<Restaurant>;
  placeOrder(restaurantId: string, items: OrderItem[], address: string): Promise<FoodOrder>;
  trackOrder(orderId: string): Promise<FoodOrder>;
  getFavorites(userId: string): Promise<Restaurant[]>;
  getRecommendations(location: string, cuisine?: string): Promise<Restaurant[]>;
}

// Kerala-specific restaurant database (simulated)
const KERALA_RESTAURANTS: Restaurant[] = [
  {
    id: "rest_001",
    name: "Kayees Rahmathulla Hotel",
    cuisine: ["Biriyani", "Kerala", "Mughlai"],
    rating: 4.5,
    deliveryTime: 35,
    priceRange: "₹₹",
    location: "Kochi",
    distance: 2.5,
    isOpen: true,
    popularDishes: ["Chicken Biriyani", "Mutton Biriyani", "Beef Fry"],
  },
  {
    id: "rest_002",
    name: "Paragon Restaurant",
    cuisine: ["Kerala", "North Indian", "Chinese"],
    rating: 4.4,
    deliveryTime: 40,
    priceRange: "₹₹",
    location: "Kozhikode",
    distance: 3.0,
    isOpen: true,
    popularDishes: ["Chicken Biriyani", "Malabar Parotta", "Chicken Curry"],
  },
  {
    id: "rest_003",
    name: "Saravana Bhavan",
    cuisine: ["South Indian", "Vegetarian"],
    rating: 4.3,
    deliveryTime: 25,
    priceRange: "₹",
    location: "Thiruvananthapuram",
    distance: 1.5,
    isOpen: true,
    popularDishes: ["Masala Dosa", "Idli", "Vada", "Sambhar"],
  },
  {
    id: "rest_004",
    name: "Hotel Aryaas",
    cuisine: ["Kerala", "Vegetarian", "North Indian"],
    rating: 4.2,
    deliveryTime: 30,
    priceRange: "₹₹",
    location: "Kottayam",
    distance: 2.0,
    isOpen: true,
    popularDishes: ["Meals", "Thali", "Parotta", "Chicken Curry"],
  },
  {
    id: "rest_005",
    name: "Dhe Puttu",
    cuisine: ["Kerala", "Traditional"],
    rating: 4.6,
    deliveryTime: 35,
    priceRange: "₹₹",
    location: "Kochi",
    distance: 3.5,
    isOpen: true,
    popularDishes: ["Puttu Varieties", "Kadala Curry", "Banana Chips"],
  },
];

class FoodDeliveryServiceImpl implements FoodDeliveryService {
  private favorites = new Map<string, string[]>(); // userId -> restaurantIds

  async searchRestaurants(query: string, location: string): Promise<Restaurant[]> {
    const lowerQuery = query.toLowerCase();

    return KERALA_RESTAURANTS.filter((r) => {
      const matchesQuery =
        r.name.toLowerCase().includes(lowerQuery) ||
        r.cuisine.some((c) => c.toLowerCase().includes(lowerQuery)) ||
        r.popularDishes.some((d) => d.toLowerCase().includes(lowerQuery));

      const matchesLocation = r.location.toLowerCase().includes(location.toLowerCase());

      return matchesQuery && (matchesLocation || location === "any");
    }).sort((a, b) => b.rating - a.rating);
  }

  async getRestaurantDetails(id: string): Promise<Restaurant> {
    const restaurant = KERALA_RESTAURANTS.find((r) => r.id === id);
    if (!restaurant) {
      throw new Error(`Restaurant ${id} not found`);
    }
    return restaurant;
  }

  async placeOrder(
    restaurantId: string,
    items: OrderItem[],
    address: string
  ): Promise<FoodOrder> {
    const restaurant = await this.getRestaurantDetails(restaurantId);

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      restaurant,
      items,
      total,
      deliveryAddress: address,
      status: "pending",
    };
  }

  async trackOrder(orderId: string): Promise<FoodOrder> {
    // Simulated order tracking
    throw new Error("Order tracking not implemented yet");
  }

  async getFavorites(userId: string): Promise<Restaurant[]> {
    const favoriteIds = this.favorites.get(userId) || [];
    return KERALA_RESTAURANTS.filter((r) => favoriteIds.includes(r.id));
  }

  async getRecommendations(location: string, cuisine?: string): Promise<Restaurant[]> {
    let restaurants = KERALA_RESTAURANTS.filter((r) =>
      r.location.toLowerCase().includes(location.toLowerCase())
    );

    if (cuisine) {
      restaurants = restaurants.filter((r) =>
        r.cuisine.some((c) => c.toLowerCase().includes(cuisine.toLowerCase()))
      );
    }

    // Sort by rating
    return restaurants.sort((a, b) => b.rating - a.rating).slice(0, 5);
  }

  addFavorite(userId: string, restaurantId: string): void {
    const favorites = this.favorites.get(userId) || [];
    if (!favorites.includes(restaurantId)) {
      favorites.push(restaurantId);
      this.favorites.set(userId, favorites);
    }
  }
}

let instance: FoodDeliveryService | null = null;

export function getFoodDeliveryService(): FoodDeliveryService {
  if (!instance) {
    instance = new FoodDeliveryServiceImpl();
  }
  return instance;
}

// Manglish food ordering interface
export async function orderFood(query: string, location: string): Promise<string> {
  const service = getFoodDeliveryService();

  // Parse query
  const isBiriyani = query.toLowerCase().includes("biriyani");
  const isParotta = query.toLowerCase().includes("parotta");
  const isPuttu = query.toLowerCase().includes("puttu");

  let searchQuery = query;
  if (isBiriyani) searchQuery = "biriyani";
  if (isParotta) searchQuery = "parotta";
  if (isPuttu) searchQuery = "puttu";

  const restaurants = await service.searchRestaurants(searchQuery, location);

  if (restaurants.length === 0) {
    return `${location} il ${searchQuery} kittyila bro. Try different cuisine?`;
  }

  const top = restaurants[0];
  return `${top.name} (${top.rating}⭐) - ${top.deliveryTime} min delivery
Popular: ${top.popularDishes.join(", ")}
Location: ${top.location} (${top.distance}km)

Order cheyyan parayeda!`;
}

// Get best biriyani in location
export async function getBestBiriyani(location: string): Promise<string> {
  const service = getFoodDeliveryService();
  const restaurants = await service.searchRestaurants("biriyani", location);

  if (restaurants.length === 0) {
    return `${location} il biriyani spot kittyila. Nearby try cheyy?`;
  }

  const best = restaurants[0];
  return `${location} il best biriyani: ${best.name}
Rating: ${best.rating}⭐
Delivery: ${best.deliveryTime} min
Must try: ${best.popularDishes[0]}
Distance: ${best.distance}km

Pwoli ayt undavannu!`;
}

// Quick recommendations by mood
export async function getFoodByMood(mood: string, location: string): Promise<string> {
  const moodToCuisine: Record<string, string> = {
    hungry: "biriyani",
    comfort: "kerala",
    healthy: "vegetarian",
    spicy: "north indian",
    quick: "fast food",
    traditional: "kerala",
  };

  const cuisine = moodToCuisine[mood.toLowerCase()] || "any";
  const service = getFoodDeliveryService();
  const restaurants = await service.getRecommendations(location, cuisine);

  if (restaurants.length === 0) {
    return `${location} il options illa ippo. Try later?`;
  }

  return `${mood} mood anel ivide try cheyy:\n${restaurants
    .slice(0, 3)
    .map((r, i) => `${i + 1}. ${r.name} - ${r.popularDishes[0]} (${r.rating}⭐)`)
    .join("\n")}`;
}
