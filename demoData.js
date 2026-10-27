const activityIdeas = {
  Adventure: [
    ["Scenic trail walk", "Start the day with a guided-style self-paced walk and a few photo stops.", 18],
    ["Neighborhood bike loop", "Explore local streets and waterfront paths at your own pace.", 24],
    ["Sunset viewpoint", "Finish with an easy hike to a popular overlook before sunset.", 8],
  ],
  Relaxation: [
    ["Slow morning coffee", "Enjoy a relaxed breakfast and take in the neighborhood atmosphere.", 16],
    ["Garden and gallery stroll", "Wander through a peaceful green space and nearby galleries.", 14],
    ["Golden-hour waterfront", "Take a gentle evening walk along the water or a scenic boulevard.", 10],
  ],
  Culture: [
    ["Historic district walk", "Discover local architecture and the stories behind the old town.", 12],
    ["Museum afternoon", "Spend time with regional art, history, and cultural exhibits.", 22],
    ["Local music evening", "Look for a neighborhood performance or a relaxed cultural venue.", 28],
  ],
  Romance: [
    ["Breakfast for two", "Start with a leisurely cafe breakfast in a charming neighborhood.", 26],
    ["Scenic garden visit", "Share an unhurried walk through a garden or beautiful public square.", 14],
    ["Dinner with a view", "Choose a cozy dinner spot and enjoy the evening atmosphere.", 48],
  ],
  Family: [
    ["Family-friendly market", "Browse a lively local market and pick up a few treats together.", 20],
    ["Hands-on museum visit", "Explore interactive exhibits with time for a snack break.", 32],
    ["Park and early dinner", "Wind down with open space for the group and an early meal nearby.", 34],
  ],
};

const interestIdeas = {
  Food: ["Try a neighborhood bakery", "Visit a local food market", "Sample a regional dinner special"],
  Nature: ["Explore a botanical garden", "Walk a scenic greenway", "Pause at a city nature lookout"],
  Beaches: ["Take a morning coastal walk", "Spend a relaxed afternoon by the shore", "Watch the sunset near the water"],
  History: ["Visit a historic landmark", "Explore a local history exhibit", "Walk a heritage neighborhood"],
  Shopping: ["Browse independent boutiques", "Explore a craft and design market", "Visit a lively shopping street"],
  Sightseeing: ["See a famous city viewpoint", "Explore a signature city attraction", "Take an evening landmark stroll"],
};

function asDate(value) {
  return new Date(`${value}T12:00:00`);
}

function formatISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function activity(title, destination, cost, interest) {
  const note = interest ? ` A good fit for your interest in ${interest.toLowerCase()}.` : "";
  return {
    title,
    description: `An idea for your visit to ${destination}.${note} Check local details before your trip.`,
    estimatedCost: cost,
  };
}

export function createDemoItinerary(trip) {
  const start = asDate(trip.start_date);
  const end = asDate(trip.end_date);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return { totalEstimatedCost: 0, days: [] };
  }

  const preferences = Array.isArray(trip.interests) ? trip.interests : [];
  const style = activityIdeas[trip.travel_style] ? trip.travel_style : "Culture";
  const styleActivities = activityIdeas[style];
  const daysInTrip = Math.round((end - start) / 86400000) + 1;
  const travelers = Math.max(1, Number(trip.travelers) || 1);
  const styleRates = { Adventure: 175, Relaxation: 180, Culture: 160, Romance: 210, Family: 170 };
  const styleEstimate = styleRates[style] * (0.7 + travelers * 0.3);
  const dailyEstimate = Number(trip.budget) > 0
    ? Math.min(styleEstimate, Number(trip.budget) / daysInTrip)
    : styleEstimate;
  const days = [];
  const cursor = new Date(start);
  let dayNumber = 0;

  while (cursor <= end && dayNumber < 31) {
    const interest = preferences[dayNumber % Math.max(preferences.length, 1)];
    const idea = interest && interestIdeas[interest]
      ? interestIdeas[interest]
      : null;
    const offset = dayNumber % styleActivities.length;
    const scale = Math.max(0.6, dailyEstimate / 105);
    const cost = Math.round(dailyEstimate);
    const morningTitle = idea?.[0] || styleActivities[offset][0];
    const afternoonTitle = idea?.[1] || styleActivities[(offset + 1) % styleActivities.length][0];
    const eveningTitle = idea?.[2] || styleActivities[(offset + 2) % styleActivities.length][0];

    days.push({
      date: formatISO(cursor),
      estimatedCost: cost,
      morning: activity(morningTitle, trip.destination, Math.round(styleActivities[offset][2] * scale), interest),
      afternoon: activity(afternoonTitle, trip.destination, Math.round(styleActivities[(offset + 1) % styleActivities.length][2] * scale), interest),
      evening: activity(eveningTitle, trip.destination, Math.round(styleActivities[(offset + 2) % styleActivities.length][2] * scale), interest),
      dining: [
        `A local cafe in ${trip.destination}`,
        preferences.includes("Food") ? "A regional food market or casual restaurant" : "A relaxed neighborhood restaurant",
      ],
      transport: trip.pace === "Easygoing"
        ? "Keep transfers simple: walk where practical and use local transit or a taxi for longer hops."
        : "Use local transit for longer hops, then explore nearby stops on foot. Check routes on the day.",
    });
    cursor.setDate(cursor.getDate() + 1);
    dayNumber += 1;
  }

  return {
    totalEstimatedCost: Math.round(days.reduce((total, day) => total + day.estimatedCost, 0)),
    days,
  };
}

const tripSeeds = [
  {
    id: "sample-kyoto",
    destination: "Kyoto, Japan",
    start_date: "2026-11-15",
    end_date: "2026-11-18",
    budget: 1800,
    travelers: 2,
    travel_style: "Culture",
    interests: ["Food", "History", "Nature"],
    pace: "Balanced",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1100&q=85",
  },
  {
    id: "sample-lisbon",
    destination: "Lisbon, Portugal",
    start_date: "2026-12-04",
    end_date: "2026-12-07",
    budget: 1450,
    travelers: 2,
    travel_style: "Relaxation",
    interests: ["Food", "Sightseeing"],
    pace: "Easygoing",
    image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1100&q=85",
  },
  {
    id: "sample-bali",
    destination: "Bali, Indonesia",
    start_date: "2027-01-12",
    end_date: "2027-01-17",
    budget: 2300,
    travelers: 3,
    travel_style: "Adventure",
    interests: ["Beaches", "Nature", "Food"],
    pace: "Full days",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1100&q=85",
  },
];

export const sampleTrips = tripSeeds.map((trip) => ({
  ...trip,
  createdAt: "2026-10-01T12:00:00.000Z",
  itinerary: createDemoItinerary(trip),
}));
