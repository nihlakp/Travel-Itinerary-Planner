import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Landing from "./pages/Landing.jsx";
import { createDemoItinerary, sampleTrips } from "./demoData.js";

const TRIPS_KEY = "wayfold-demo-trips";
const THEME_KEY = "wayfold-demo-theme";

function readTrips() {
  try {
    const saved = window.localStorage.getItem(TRIPS_KEY);
    if (!saved) return sampleTrips;
    const trips = JSON.parse(saved);
    return Array.isArray(trips) ? trips : sampleTrips;
  } catch {
    return sampleTrips;
  }
}

function readTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function AppLayout({ children, theme, onToggleTheme, trips, toast }) {
  const location = useLocation();

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <Link to="/dashboard" className="brand"><span className="brand-mark">✦</span> Wayfold</Link>
        <p className="sidebar-caption">YOUR TRAVEL SPACE</p>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <Link className={`nav-item ${location.pathname === "/dashboard" && location.hash !== "#saved-trips" ? "active" : ""}`} to="/dashboard">
            <span aria-hidden="true">▦</span> Overview
          </Link>
          <Link className={`nav-item ${location.hash === "#saved-trips" || location.pathname.startsWith("/trips") ? "active" : ""}`} to="/dashboard#saved-trips">
            <span aria-hidden="true">⌑</span> My trips <span className="nav-count">{trips.length}</span>
          </Link>
          <Link className="nav-item" to="/trips/new"><span aria-hidden="true">＋</span> Plan a trip</Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="planner-badge"><span className="status-dot" /> Trip planner</div>
          <p>Your trips are saved in this browser.</p>
          <Link className="sidebar-home" to="/">← Back to home</Link>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>My travel</strong></div>
          <div className="topbar-actions">
            <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
        </header>
        {toast && <div className="toast" role="status">{toast}</div>}
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

function TripForm({ initialTrip, onSave, onCancel }) {
  const [form, setForm] = useState(() => initialTrip ? {
    ...initialTrip,
    budget: initialTrip.budget ?? "",
    interests: initialTrip.interests || [],
    travel_style: activityStyle(initialTrip.travel_style),
    pace: initialTrip.pace || "Balanced",
  } : {
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
    travelers: 1,
    travel_style: "Adventure",
    interests: [],
    pace: "Balanced",
  });
  const [error, setError] = useState("");
  const styles = ["Adventure", "Relaxation", "Culture", "Romance", "Family"];
  const interests = ["Food", "Nature", "Beaches", "History", "Shopping", "Sightseeing"];
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.destination.trim() || !form.start_date || !form.end_date) {
      setError("Please complete the destination and travel dates.");
      return;
    }
    if (form.end_date < form.start_date) {
      setError("The return date must be on or after the departure date.");
      return;
    }
    if (form.end_date && (new Date(`${form.end_date}T12:00:00`) - new Date(`${form.start_date}T12:00:00`)) / 86400000 > 30) {
      setError("Trips can be up to 31 days long.");
      return;
    }
    onSave({
      ...form,
      destination: form.destination.trim(),
      budget: form.budget === "" ? 0 : Number(form.budget),
      travelers: Number(form.travelers),
      itinerary: createDemoItinerary({ ...form, destination: form.destination.trim() }),
      image: initialTrip?.image || destinationImage(form.destination),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="page-width">
      <div className="page-heading">
        <div><p className="eyebrow">TRIP BUILDER</p><h1>{initialTrip ? "Edit your trip" : "Create a new trip"}</h1>
          <p>Tell us what you have in mind. Your itinerary will be created here.</p></div>
      </div>
      <form className="panel trip-form" onSubmit={submit}>
        <div className="form-section-title"><span className="step-number">1</span><div><h2>The essentials</h2><p>Where and when are you going?</p></div></div>
        <div className="form-grid">
          <label className="field field-wide">Destination
            <input required maxLength="100" placeholder="e.g. Kyoto, Japan" value={form.destination} onChange={(event) => update("destination", event.target.value)} />
          </label>
          <label className="field">Start date
            <input required type="date" value={form.start_date} onChange={(event) => update("start_date", event.target.value)} />
          </label>
          <label className="field">End date
            <input required type="date" min={form.start_date || undefined} value={form.end_date} onChange={(event) => update("end_date", event.target.value)} />
          </label>
          <label className="field"><span>Total trip budget <span className="field-hint">USD estimate</span></span>
            <input type="number" min="0" step="50" placeholder="1200" value={form.budget} onChange={(event) => update("budget", event.target.value)} />
          </label>
          <label className="field">Travelers
            <input required type="number" min="1" max="20" value={form.travelers} onChange={(event) => update("travelers", event.target.value)} />
          </label>
        </div>

        <div className="form-section-title section-divider"><span className="step-number">2</span><div><h2>Your travel personality</h2><p>Your itinerary will reflect these preferences.</p></div></div>
        <fieldset className="choice-fieldset">
          <legend>Travel style</legend>
          <div className="choice-grid">
            {styles.map((style, index) => (
              <label className={`choice-card ${form.travel_style === style ? "selected" : ""}`} key={style}>
                <input type="radio" name="travel-style" value={style} checked={form.travel_style === style} onChange={() => update("travel_style", style)} />
                <span aria-hidden="true">{["⛰", "☼", "⌂", "♡", "♧"][index]}</span>{style}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="choice-fieldset">
          <legend>Things you enjoy</legend>
          <div className="interest-grid">
            {interests.map((interest) => (
              <label className="check-chip" key={interest}>
                <input type="checkbox" checked={form.interests.includes(interest)} onChange={(event) => update(
                  "interests",
                  event.target.checked ? [...form.interests, interest] : form.interests.filter((item) => item !== interest),
                )} />
                <span>{interest}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field pace-field">Preferred activity pace
          <select value={form.pace} onChange={(event) => update("pace", event.target.value)}>
            <option>Easygoing</option><option>Balanced</option><option>Full days</option>
          </select>
        </label>
        <div className="form-footer">
          <p>✦ Your plan includes activity, dining, and transit ideas.</p>
          <div className="button-row">
            <button type="button" className="button button-quiet" onClick={onCancel}>Cancel</button>
            <button type="submit" className="button button-primary">{initialTrip ? "Save changes" : "Create itinerary"} <span aria-hidden="true">→</span></button>
          </div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}

function MainApp() {
  const [trips, setTrips] = useState(readTrips);
  const [theme, setTheme] = useState(readTheme);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      window.localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    } catch {
      setToast("Browser storage is unavailable. Changes may not remain after refresh.");
    }
  }, [trips]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Theme still works for this session if browser storage is disabled.
    }
  }, [theme]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function saveTrip(values, id) {
    if (id) {
      setTrips((current) => current.map((trip) => trip.id === id ? { ...trip, ...values } : trip));
      setToast("Trip details saved. Your itinerary is ready to review.");
      return id;
    }
    const newTrip = { ...values, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTrips((current) => [newTrip, ...current]);
    setToast("Your trip and itinerary have been created.");
    return newTrip.id;
  }

  function deleteTrip(id) {
    const trip = trips.find((item) => item.id === id);
    if (!trip || !window.confirm(`Delete your ${trip.destination} trip? This cannot be undone.`)) return false;
    setTrips((current) => current.filter((item) => item.id !== id));
    setToast("Trip deleted.");
    return true;
  }

  function regenerateTrip(id) {
    const trip = trips.find((item) => item.id === id);
    if (!trip) return;
    setTrips((current) => current.map((item) => item.id === id
      ? { ...item, itinerary: createDemoItinerary(item), updatedAt: new Date().toISOString() }
      : item));
    setToast("Your itinerary has been refreshed.");
  }

  return (
    <Routes>
      <Route path="/" element={<Landing theme={theme} onToggleTheme={() => setTheme((value) => value === "dark" ? "light" : "dark")} />} />
      <Route path="/dashboard" element={
        <AppLayout theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} trips={trips} toast={toast}>
          <Dashboard trips={trips} onDelete={deleteTrip} />
        </AppLayout>
      } />
      <Route path="/trips/new" element={
        <AppLayout theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} trips={trips} toast={toast}>
          <CreateTrip onSave={saveTrip} />
        </AppLayout>
      } />
      <Route path="/trips/:tripId/edit" element={
        <AppLayout theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} trips={trips} toast={toast}>
          <EditTrip trips={trips} onSave={saveTrip} />
        </AppLayout>
      } />
      <Route path="/trips/:tripId" element={
        <AppLayout theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} trips={trips} toast={toast}>
          <TripDetails trips={trips} onDelete={deleteTrip} onRegenerate={regenerateTrip} />
        </AppLayout>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function EditTrip({ trips, onSave }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tripId = location.pathname.split("/")[2];
  const trip = trips.find((item) => item.id === tripId);
  if (!trip) return <Navigate to="/dashboard" replace />;
  return <TripForm initialTrip={trip} onSave={(values) => {
    onSave(values, trip.id);
    navigate(`/trips/${trip.id}`);
  }} onCancel={() => navigate(`/trips/${trip.id}`)} />;
}

function CreateTrip({ onSave }) {
  const navigate = useNavigate();
  return <TripForm onSave={(values) => navigate(`/trips/${onSave(values)}`)} onCancel={() => navigate("/dashboard")} />;
}

function TripDetails({ trips, onDelete, onRegenerate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tripId = location.pathname.split("/")[2];
  const trip = trips.find((item) => item.id === tripId);
  if (!trip) return <Navigate to="/dashboard" replace />;

  function remove() {
    if (onDelete(trip.id)) navigate("/dashboard");
  }

  return (
    <section className="page-width">
      <div className="page-heading">
        <div><p className="eyebrow">YOUR TRIP</p><h1>{trip.destination}</h1>
          <p>{formatDate(trip.start_date)} – {formatDate(trip.end_date)} <span className="separator">·</span> {trip.travelers} travelers</p></div>
        <div className="button-row">
          <Link className="button button-quiet" to={`/trips/${trip.id}/edit`}>✎ Edit trip</Link>
          <button className="button button-primary" type="button" onClick={() => onRegenerate(trip.id)}>↻ Refresh itinerary</button>
        </div>
      </div>
      <div className="itinerary-note" role="note"><strong>Planning note</strong><span>Ideas and cost figures are estimates. Confirm details, prices, and availability before booking.</span></div>
      <div className="trip-summary panel">
        <div><span>Travel style</span><strong>{trip.travel_style}</strong></div>
        <div><span>Activity pace</span><strong>{trip.pace || "Balanced"}</strong></div>
        <div><span>Group size</span><strong>{trip.travelers} {trip.travelers === 1 ? "traveler" : "travelers"}</strong></div>
        <div><span>Budget estimate</span><strong>{formatMoney(trip.budget)}</strong></div>
      </div>
      <div className="itinerary-topline"><div><h2>Your day-by-day plan</h2><p>Organized around your travel preferences.</p></div>
        <span className="estimate-pill">TOTAL ESTIMATE · {formatMoney(trip.itinerary?.totalEstimatedCost || 0)}</span></div>
      <div className="days-list">
        {(trip.itinerary?.days || []).map((day, index) => (
          <article className="day-card panel" key={day.date}>
            <div className="day-date"><span>DAY {String(index + 1).padStart(2, "0")}</span><strong>{formatDate(day.date)}</strong><small>{formatMoney(day.estimatedCost)} est.</small></div>
            <div className="day-content">
              <div className="activity-grid">
                {["morning", "afternoon", "evening"].map((period) => {
                  const activity = day[period];
                  return <section className="activity" key={period}><p className="activity-time">{period === "morning" ? "☼ MORNING" : period === "afternoon" ? "◷ AFTERNOON" : "☾ EVENING"}</p><h3>{activity.title}</h3><p>{activity.description}</p><small className="activity-cost">${activity.estimatedCost} est.</small></section>;
                })}
              </div>
              <div className="day-extras">
                <p><span aria-hidden="true">♨</span><strong>Dining ideas</strong> {day.dining.join(" · ")}</p>
                <p><span aria-hidden="true">↗</span><strong>Getting around</strong> {day.transport}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="details-footer"><button type="button" className="button button-danger" onClick={remove}>Delete trip</button><p>Costs are estimates. Confirm current prices before booking.</p></div>
    </section>
  );
}

function formatDate(value) {
  if (!value) return "Dates not set";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function activityStyle(value) {
  return ["Adventure", "Relaxation", "Culture", "Romance", "Family"].includes(value) ? value : "Culture";
}

function destinationImage(destination) {
  const value = destination.toLowerCase();
  if (value.includes("kyoto") || value.includes("japan")) return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1100&q=85";
  if (value.includes("lisbon") || value.includes("portugal")) return "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1100&q=85";
  if (value.includes("bali") || value.includes("indonesia")) return "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1100&q=85";
  return "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1100&q=85";
}

export default function App() {
  return <MainApp />;
}
