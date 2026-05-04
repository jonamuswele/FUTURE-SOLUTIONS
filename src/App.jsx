import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from "recharts";

// ── Future Solutions Ltd Brand Colors ────────────────────────────────────
// Green:  #1a9c3e  (FUTURE)
// Blue:   #1d9cd3  (SOLUTIONS LTD)
// Yellow: #f5c518  (dot accents)

// ── Mock Data ─────────────────────────────────────────────────────────────
const MOCK_NODES = [
  { node_id: "NODE_01", mac: "68:25:dd:e9:98:f4", active: true,  uptime_s: 1634, count: 370, sensor_json: { temp_c: 24.2, humidity: 62, ec: 1.8 } },
  { node_id: "NODE_02", mac: "5c:01:3b:34:29:84", active: true,  uptime_s: 1788, count: 372, sensor_json: { temp_c: 26.8, humidity: 38, ec: 2.4 } },
  { node_id: "NODE_03", mac: "fc:f5:c4:2a:92:38", active: true,  uptime_s: 1244, count: 318, sensor_json: { temp_c: 23.1, humidity: 71, ec: 1.2 } },
  { node_id: "NODE_04", mac: "a4:cf:12:78:3e:91", active: false, uptime_s: 890,  count: 201, sensor_json: { temp_c: 27.4, humidity: 29, ec: 3.1 } },
];

const MOCK_HISTORY = (() => {
  const now = Date.now();
  return Array.from({ length: 48 }, (_, i) => {
    const t = new Date(now - (47 - i) * 30 * 60 * 1000);
    const label = t.getHours().toString().padStart(2,"0") + ":" + t.getMinutes().toString().padStart(2,"0");
    return {
      label,
      NODE_01_hum:  55 + Math.sin(i * 0.3) * 12 + Math.random() * 4,
      NODE_02_hum:  35 + Math.sin(i * 0.2 + 1) * 8 + Math.random() * 4,
      NODE_03_hum:  68 + Math.sin(i * 0.4 + 2) * 10 + Math.random() * 4,
      NODE_04_hum:  28 + Math.sin(i * 0.25) * 6 + Math.random() * 3,
      NODE_01_temp: 24 + Math.sin(i * 0.15) * 3 + Math.random() * 1,
      NODE_02_temp: 27 + Math.sin(i * 0.15 + 0.5) * 4 + Math.random() * 1,
      NODE_03_temp: 23 + Math.sin(i * 0.15 + 1) * 3 + Math.random() * 1,
      NODE_04_temp: 28 + Math.sin(i * 0.15 + 1.5) * 4 + Math.random() * 1,
      NODE_01_ec:   1.8 + Math.sin(i * 0.1) * 0.3,
      NODE_02_ec:   2.4 + Math.sin(i * 0.12) * 0.4,
      NODE_03_ec:   1.2 + Math.sin(i * 0.08) * 0.2,
      NODE_04_ec:   3.1 + Math.sin(i * 0.1) * 0.5,
    };
  });
})();

const DAILY_HISTORY = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return {
    label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
    avg_hum:       45 + Math.sin(i * 0.5) * 15 + Math.random() * 8,
    rainfall_mm:   Math.random() > 0.6 ? Math.random() * 12 : 0,
    irrigation_l:  20 + Math.random() * 30,
  };
});

const WEATHER_FORECAST = [
  { day: "Today",    icon: "☀️",  high: 28, low: 18, rain: 0,  humidity: 55, wind: 12 },
  { day: "Tomorrow", icon: "⛅",  high: 25, low: 16, rain: 20, humidity: 68, wind: 18 },
  { day: "Wed",      icon: "🌧️", high: 22, low: 15, rain: 80, humidity: 82, wind: 22 },
  { day: "Thu",      icon: "🌦️", high: 24, low: 16, rain: 40, humidity: 70, wind: 15 },
  { day: "Fri",      icon: "☀️",  high: 27, low: 17, rain: 5,  humidity: 52, wind: 10 },
  { day: "Sat",      icon: "☀️",  high: 29, low: 19, rain: 0,  humidity: 48, wind: 8  },
  { day: "Sun",      icon: "⛅",  high: 26, low: 17, rain: 15, humidity: 62, wind: 14 },
];

// Node colors : drawn from brand palette
const NODE_COLORS = {
  NODE_01: "#1a9c3e",   // brand green
  NODE_02: "#1d9cd3",   // brand blue
  NODE_03: "#f5c518",   // brand yellow
  NODE_04: "#e8471a",   // warm red complement
};

const MOISTURE_THRESHOLD = 40;

// ── CSS ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Nunito+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green:      #1a9c3e;
    --green-dark: #157a30;
    --green-pale: #e8f7ed;
    --green-mid:  #c3e8cf;
    --blue:       #1d9cd3;
    --blue-dark:  #1580ae;
    --blue-pale:  #e6f5fb;
    --blue-mid:   #b3dff0;
    --yellow:     #f5c518;
    --yellow-pale:#fffbe6;
    --yellow-mid: #fde68a;
    --red:        #e8471a;
    --red-pale:   #fef0ec;
    --bg:         #f7f9f7;
    --surface:    #ffffff;
    --border:     #e2ebe4;
    --text:       #0d2416;
    --muted:      #5a7a65;
    --divider:    #ddeee2;
  }

  body {
    font-family: 'Nunito Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  /* ── HEADER ── */
  .app-header {
    background: #ffffff;
    border-bottom: 3px solid var(--green);
    padding: 0 32px;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(26,156,62,.08);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .brand-logo {
    height: 44px;
    width: auto;
    display: block;
  }

  .brand-divider {
    width: 1px;
    height: 32px;
    background: var(--border);
  }

  .brand-product {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--green);
    letter-spacing: .02em;
    text-transform: uppercase;
  }

  .brand-product-sub {
    font-size: 11px;
    color: var(--muted);
    font-weight: 400;
    margin-top: 1px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .live-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    background: var(--green-pale);
    border: 1px solid var(--green-mid);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    color: var(--green-dark);
    font-family: 'Nunito', sans-serif;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 0 2px var(--green-mid);
    animation: livepulse 2s infinite;
  }

  @keyframes livepulse {
    0%,100% { box-shadow: 0 0 0 2px var(--green-mid); }
    50%      { box-shadow: 0 0 0 5px rgba(26,156,62,.15); }
  }

  .update-time {
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
  }

  /* ── NAV ── */
  .nav-bar {
    background: #fff;
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    display: flex;
    gap: 2px;
  }

  .nav-tab {
    padding: 14px 20px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Nunito', sans-serif;
    color: var(--muted);
    cursor: pointer;
    border: none;
    background: none;
    position: relative;
    transition: color .2s;
    letter-spacing: .01em;
    white-space: nowrap;
  }

  .nav-tab:hover { color: var(--green); }

  .nav-tab.active { color: var(--green); }

  .nav-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--green);
    border-radius: 3px 3px 0 0;
  }

  /* ── MAIN ── */
  .app-main {
    padding: 28px 32px;
    max-width: 1440px;
    margin: 0 auto;
  }

  /* ── CARD ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
  }

  .card-title {
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 2px;
  }

  .card-sub {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 20px;
  }

  /* ── STAT STRIP ── */
  .stat-strip {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-tile {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-tile-accent {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    border-radius: 12px 0 0 12px;
  }

  .stat-tile-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
    padding-left: 10px;
  }

  .stat-tile-val {
    font-family: 'Nunito', sans-serif;
    font-size: 32px;
    font-weight: 800;
    line-height: 1.1;
    padding-left: 10px;
  }

  .stat-tile-detail {
    font-size: 12px;
    color: var(--muted);
    padding-left: 10px;
  }

  /* ── SENSOR CARDS ── */
  .sensor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px,1fr));
    gap: 14px;
    margin-bottom: 24px;
  }

  .sensor-node-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 18px;
    transition: transform .2s, box-shadow .2s;
    position: relative;
    overflow: hidden;
  }

  .sensor-node-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(26,156,62,.1);
  }

  .sensor-node-card.online  { border-color: var(--green-mid); }
  .sensor-node-card.offline { opacity: .65; border-color: #e8c8c0; }

  .node-color-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    border-radius: 12px 12px 0 0;
  }

  .node-name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    margin-top: 6px;
  }

  .node-name {
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 14px;
    color: var(--text);
  }

  .node-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    font-family: 'Nunito', sans-serif;
  }

  .node-badge.online  { background: var(--green-pale); color: var(--green-dark); }
  .node-badge.offline { background: var(--red-pale);   color: var(--red); }

  .sensor-val-row { display: flex; flex-direction: column; gap: 10px; }

  .sensor-val {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .sensor-key {
    font-size: 11px;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
    white-space: nowrap;
  }

  .sensor-num {
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    font-weight: 700;
  }

  .sensor-bar-wrap {
    height: 5px;
    border-radius: 3px;
    background: var(--bg);
    overflow: hidden;
    margin-top: 3px;
  }

  .sensor-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width .6s ease;
  }

  /* ── ALERTS ── */
  .alert-strip {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .alert-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-radius: 10px;
    padding: 14px 18px;
    flex: 1;
    min-width: 220px;
    border: 1.5px solid;
  }

  .alert-card.danger  { background: var(--red-pale);    border-color: #f0b4a0; }
  .alert-card.warning { background: var(--yellow-pale); border-color: var(--yellow-mid); }
  .alert-card.ok      { background: var(--green-pale);  border-color: var(--green-mid); }

  .alert-icon { font-size: 22px; line-height: 1; flex-shrink: 0; margin-top: 1px; }

  .alert-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    font-family: 'Nunito', sans-serif;
  }

  .alert-desc {
    font-size: 12px;
    color: var(--muted);
    margin-top: 2px;
    line-height: 1.5;
  }

  /* ── CHART TOGGLE ── */
  .chart-toggle {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .toggle-btn {
    padding: 6px 16px;
    border-radius: 20px;
    border: 1.5px solid var(--border);
    background: #fff;
    font-size: 12px;
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    transition: all .2s;
  }

  .toggle-btn:hover  { border-color: var(--green); color: var(--green); }
  .toggle-btn.active { background: var(--green); border-color: var(--green); color: #fff; }

  /* ── NODE TOGGLE ── */
  .node-toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    border-radius: 20px;
    border: 1.5px solid;
    cursor: pointer;
    font-size: 12px;
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    transition: all .2s;
    background: #fff;
  }

  .ntdot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── WEATHER ── */
  .weather-strip {
    display: grid;
    grid-template-columns: repeat(7,1fr);
    gap: 10px;
    margin-bottom: 24px;
  }

  .weather-day {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 16px 10px;
    text-align: center;
    transition: transform .2s, box-shadow .2s;
  }

  .weather-day:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(29,156,211,.12);
  }

  .weather-day.today {
    border-color: var(--blue-mid);
    background: var(--blue-pale);
  }

  .weather-day-name {
    font-size: 10px;
    font-weight: 800;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
    margin-bottom: 8px;
    font-family: 'Nunito', sans-serif;
  }

  .weather-icon { font-size: 26px; margin-bottom: 8px; }

  .weather-temps {
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 4px;
  }

  .weather-rain      { font-size: 11px; font-weight: 600; color: var(--blue); }
  .weather-rain.none { color: var(--muted); }

  /* ── CROP ── */
  .crop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
    gap: 16px;
  }

  .crop-card {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .crop-top-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    border-radius: 12px 12px 0 0;
  }

  .crop-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    margin-top: 8px;
  }

  .crop-node-label {
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 14px;
    color: var(--text);
  }

  .form-field { margin-bottom: 12px; }

  .form-label {
    font-size: 11px;
    color: var(--muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    display: block;
    margin-bottom: 5px;
  }

  .form-input, .form-select {
    width: 100%;
    padding: 9px 12px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    font-family: 'Nunito Sans', sans-serif;
    font-size: 13px;
    color: var(--text);
    outline: none;
    transition: border-color .2s;
  }

  .form-input:focus, .form-select:focus { border-color: var(--green); }

  .days-since {
    font-size: 11px;
    font-weight: 700;
    color: var(--green);
    margin-top: 4px;
    font-family: 'Nunito', sans-serif;
  }

  .save-btn {
    width: 100%;
    padding: 9px;
    background: var(--green);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    transition: background .2s;
    margin-top: 4px;
    letter-spacing: .02em;
  }

  .save-btn:hover { background: var(--green-dark); }

  /* ── RECOMMENDATIONS ── */
  .rec-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px,1fr));
    gap: 16px;
  }

  .rec-card {
    border-radius: 12px;
    padding: 20px;
    border: 1.5px solid;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
  }

  .rec-card.urgent  { border-color: #f0b4a0; background: var(--red-pale); }
  .rec-card.warning { border-color: var(--yellow-mid); background: var(--yellow-pale); }
  .rec-card.good    { border-color: var(--green-mid);  background: var(--green-pale); }
  .rec-card.info    { border-color: var(--blue-mid);   background: var(--blue-pale); }

  .rec-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
  }

  .rec-icon { font-size: 24px; line-height: 1; flex-shrink: 0; }

  .rec-title {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: var(--text);
    line-height: 1.3;
  }

  .rec-node {
    font-size: 11px;
    color: var(--muted);
    font-weight: 600;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  .rec-body {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.6;
    margin-bottom: 14px;
  }

  .rec-action {
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 6px;
    display: inline-block;
    font-family: 'Nunito', sans-serif;
    letter-spacing: .02em;
  }

  .rec-card.urgent  .rec-action { background: rgba(232,71,26,.12);  color: var(--red); }
  .rec-card.warning .rec-action { background: rgba(245,197,24,.2);  color: #9a7a00; }
  .rec-card.good    .rec-action { background: rgba(26,156,62,.12);  color: var(--green-dark); }
  .rec-card.info    .rec-action { background: rgba(29,156,211,.12); color: var(--blue-dark); }

  /* ── SECTION HEADINGS ── */
  .section-heading {
    font-family: 'Nunito', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-heading::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 22px;
    background: var(--green);
    border-radius: 2px;
    flex-shrink: 0;
  }

  .section-desc {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 24px;
    padding-left: 14px;
  }

  /* ── FOOTER BRAND STRIP ── */
  .brand-footer {
    background: #fff;
    border-top: 1px solid var(--border);
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 40px;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--muted);
  }

  .footer-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--green);
  }

  .history-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .scroll-hint {
    font-size: 11px;
    color: var(--muted);
    margin-left: auto;
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .stat-strip { grid-template-columns: repeat(2,1fr); }
    .weather-strip { grid-template-columns: repeat(4,1fr); }
    .app-main { padding: 16px; }
    .nav-bar  { padding: 0 16px; overflow-x: auto; }
    .app-header { padding: 0 16px; }
  }
`;

// ── Tooltip ───────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0d2416", borderRadius: 10, padding: "10px 14px",
      fontFamily: "Nunito Sans, sans-serif", fontSize: 12, color: "#fff",
      boxShadow: "0 8px 24px rgba(0,0,0,.25)", border: "1px solid rgba(26,156,62,.3)"
    }}>
      <div style={{ color: "#74c99a", marginBottom: 6, fontWeight: 700 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 3, fontWeight: 600 }}>
          {p.name}: <span style={{ color: "#fff" }}>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
};

// ── LOGO SVG (inline : matches the brand) ────────────────────────────────
// Using text fallback since we cannot embed binary in JSX
const BrandLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <svg width="36" height="36" viewBox="0 0 100 100">
      {/* Simplified dot-globe from logo */}
      <circle cx="55" cy="20" r="7" fill="#1a9c3e"/>
      <circle cx="70" cy="32" r="6" fill="#1a9c3e"/>
      <circle cx="75" cy="50" r="7" fill="#1a9c3e"/>
      <circle cx="68" cy="68" r="6" fill="#1a9c3e"/>
      <circle cx="52" cy="78" r="5" fill="#1a9c3e"/>
      <ellipse cx="45" cy="30" rx="7" ry="11" fill="#1d9cd3"/>
      <ellipse cx="35" cy="52" rx="7" ry="13" fill="#1d9cd3"/>
      <ellipse cx="43" cy="72" rx="6" ry="9"  fill="#1d9cd3"/>
      <circle cx="28" cy="30" r="6"  fill="#f5c518"/>
      <circle cx="22" cy="50" r="5"  fill="#f5c518"/>
      <circle cx="28" cy="70" r="6"  fill="#f5c518"/>
    </svg>
    <div>
      <div style={{ fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:15, color:"#1a9c3e", letterSpacing:".06em", textTransform:"uppercase", lineHeight:1 }}>FUTURE</div>
      <div style={{ fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:11, color:"#1d9cd3", letterSpacing:".08em", textTransform:"uppercase", lineHeight:1, marginTop:1 }}>SOLUTIONS LTD</div>
    </div>
  </div>
);

// ── TAB 1: Dashboard ──────────────────────────────────────────────────────
function DashboardTab({ nodes, history }) {
  const [metric, setMetric] = useState("humidity");

  const active      = nodes.filter(n => n.active);
  const avgHumidity = active.length ? (active.reduce((a,n)=>a+(n.sensor_json?.humidity||0),0)/active.length).toFixed(1) : ":";
  const avgTemp     = active.length ? (active.reduce((a,n)=>a+(n.sensor_json?.temp_c||0),0)/active.length).toFixed(1)    : ":";
  const needsWater  = active.filter(n => (n.sensor_json?.humidity||0) < MOISTURE_THRESHOLD);

  const metricCfg = {
    humidity: { label:"Soil Humidity", unit:"%",      domain:[0,100],  refLine: MOISTURE_THRESHOLD },
    temp_c:   { label:"Temperature",   unit:"°C",     domain:[10,45],  refLine: null },
    ec:       { label:"EC",            unit:" mS/cm", domain:[0,5],    refLine: null },
  };

  const chartData = history.map(h => {
    const row = { label: h.label };
    nodes.forEach(n => {
      if (metric==="humidity") row[n.node_id] = +h[`${n.node_id}_hum`].toFixed(1);
      if (metric==="temp_c")   row[n.node_id] = +h[`${n.node_id}_temp`].toFixed(1);
      if (metric==="ec")       row[n.node_id] = +h[`${n.node_id}_ec`].toFixed(2);
    });
    return row;
  });

  const tickFmt = (_,i) => i%6===0 ? _ : "";

  return (
    <div>
      {/* STATS */}
      <div className="stat-strip">
        {[
          { label:"Active Nodes",  val:`${active.length}/${nodes.length}`, detail:"Sensors online",        color:"var(--green)",  tc:"var(--green)" },
          { label:"Avg Humidity",  val:`${avgHumidity}%`,                  detail:"Across all active nodes", color:"var(--blue)",   tc:"var(--blue)" },
          { label:"Avg Temp",      val:`${avgTemp}°C`,                     detail:"Field average",          color:"var(--yellow)", tc:"#9a7a00" },
          { label:"Need Water",    val:`${needsWater.length}`,             detail:`Below ${MOISTURE_THRESHOLD}% threshold`, color:needsWater.length?"var(--red)":"var(--green)", tc:needsWater.length?"var(--red)":"var(--green)" },
        ].map(s => (
          <div key={s.label} className="stat-tile">
            <div className="stat-tile-accent" style={{ background: s.color }}/>
            <div className="stat-tile-label">{s.label}</div>
            <div className="stat-tile-val" style={{ color: s.tc }}>{s.val}</div>
            <div className="stat-tile-detail">{s.detail}</div>
          </div>
        ))}
      </div>

      {/* ALERTS */}
      {needsWater.length > 0 && (
        <div className="alert-strip">
          {needsWater.map(n => (
            <div key={n.node_id} className="alert-card warning">
              <div className="alert-icon">💧</div>
              <div>
                <div className="alert-title">{n.node_id} needs irrigation</div>
                <div className="alert-desc">Humidity at {n.sensor_json?.humidity?.toFixed(1)}% : below {MOISTURE_THRESHOLD}% threshold</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SENSOR CARDS */}
      <div className="sensor-grid">
        {nodes.map(n => {
          const hum = n.sensor_json?.humidity||0;
          const col = NODE_COLORS[n.node_id]||"#1a9c3e";
          const humColor = hum<30 ? "var(--red)" : hum<MOISTURE_THRESHOLD ? "var(--yellow)" : "var(--green)";
          return (
            <div key={n.node_id} className={`sensor-node-card ${n.active?"online":"offline"}`}>
              <div className="node-color-bar" style={{ background: col }}/>
              <div className="node-name-row">
                <span className="node-name">{n.node_id}</span>
                <span className={`node-badge ${n.active?"online":"offline"}`}>{n.active?"LIVE":"OFFLINE"}</span>
              </div>
              <div className="sensor-val-row">
                <div>
                  <div className="sensor-val">
                    <span className="sensor-key">Humidity</span>
                    <span className="sensor-num" style={{ color:humColor }}>{hum.toFixed(1)}%</span>
                  </div>
                  <div className="sensor-bar-wrap">
                    <div className="sensor-bar-fill" style={{ width:`${hum}%`, background:humColor }}/>
                  </div>
                </div>
                <div className="sensor-val">
                  <span className="sensor-key">Temp</span>
                  <span className="sensor-num" style={{ color:"var(--blue)" }}>{(n.sensor_json?.temp_c||0).toFixed(1)}°C</span>
                </div>
                <div className="sensor-val">
                  <span className="sensor-key">EC</span>
                  <span className="sensor-num" style={{ color:"var(--text)" }}>{(n.sensor_json?.ec||0).toFixed(2)} mS/cm</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHART */}
      <div className="card">
        <div className="card-title">Live Sensor Readings : Last 24h</div>
        <div className="card-sub">30-minute intervals across all nodes</div>
        <div className="chart-toggle">
          {Object.entries(metricCfg).map(([k,v]) => (
            <button key={k} className={`toggle-btn ${metric===k?"active":""}`} onClick={()=>setMetric(k)}>{v.label}</button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{top:5,right:10,left:-10,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)"/>
            <XAxis dataKey="label" tick={{fontSize:10,fontFamily:"Nunito Sans",fill:"var(--muted)"}} tickFormatter={tickFmt}/>
            <YAxis domain={metricCfg[metric].domain} tick={{fontSize:10,fontFamily:"Nunito Sans",fill:"var(--muted)"}} unit={metricCfg[metric].unit}/>
            <Tooltip content={<CustomTooltip unit={metricCfg[metric].unit}/>}/>
            <Legend wrapperStyle={{fontSize:12,fontFamily:"Nunito Sans",fontWeight:600}}/>
            {metricCfg[metric].refLine && (
              <ReferenceLine y={metricCfg[metric].refLine} stroke="var(--yellow)" strokeDasharray="5 4"
                label={{value:"Min",fill:"var(--yellow)",fontSize:10,fontWeight:700}}/>
            )}
            {nodes.map(n => (
              <Line key={n.node_id} type="monotone" dataKey={n.node_id}
                stroke={NODE_COLORS[n.node_id]||"#1a9c3e"} strokeWidth={2.5} dot={false} activeDot={{r:5}}/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── TAB 2: History ────────────────────────────────────────────────────────
function HistoryTab({ nodes, history }) {
  const [sel, setSel]       = useState(nodes.map(n=>n.node_id));
  const [metric, setMetric] = useState("humidity");

  const toggle = id => setSel(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const metricUnit  = { humidity:"%", temp_c:"°C", ec:" mS/cm" };
  const metricLabel = { humidity:"Soil Humidity", temp_c:"Temperature", ec:"Electrical Conductivity" };

  const chartData = history.map(h => {
    const row = { label: h.label };
    sel.forEach(id => {
      if (metric==="humidity") row[id] = +h[`${id}_hum`]?.toFixed(1);
      if (metric==="temp_c")   row[id] = +h[`${id}_temp`]?.toFixed(1);
      if (metric==="ec")       row[id] = +h[`${id}_ec`]?.toFixed(2);
    });
    return row;
  });

  const tickFmt = (_,i) => i%6===0 ? _ : "";

  return (
    <div>
      <div className="section-heading">Historical Data</div>
      <div className="section-desc">Compare sensor readings over time : select nodes and metric</div>

      <div className="card" style={{marginBottom:24}}>
        <div className="card-title">{metricLabel[metric]} : 24h History</div>
        <div className="card-sub">Toggle nodes to compare</div>

        <div className="history-controls">
          <div className="chart-toggle" style={{marginBottom:0}}>
            {Object.entries(metricLabel).map(([k,v]) => (
              <button key={k} className={`toggle-btn ${metric===k?"active":""}`} onClick={()=>setMetric(k)}>{v}</button>
            ))}
          </div>
          <span className="scroll-hint">Select nodes below ↓</span>
        </div>

        <div className="history-controls">
          {nodes.map(n => {
            const on  = sel.includes(n.node_id);
            const col = NODE_COLORS[n.node_id]||"#1a9c3e";
            return (
              <button key={n.node_id} className="node-toggle" onClick={()=>toggle(n.node_id)}
                style={{ borderColor:on?col:"var(--border)", color:on?col:"var(--muted)", opacity:on?1:.5 }}>
                <div className="ntdot" style={{background:on?col:"var(--muted)"}}/>
                {n.node_id}
              </button>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={chartData} margin={{top:5,right:10,left:-10,bottom:5}}>
            <defs>
              {sel.map(id => (
                <linearGradient key={id} id={`g_${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={NODE_COLORS[id]||"#1a9c3e"} stopOpacity={0.18}/>
                  <stop offset="95%" stopColor={NODE_COLORS[id]||"#1a9c3e"} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)"/>
            <XAxis dataKey="label" tick={{fontSize:10,fontFamily:"Nunito Sans",fill:"var(--muted)"}} tickFormatter={tickFmt}/>
            <YAxis tick={{fontSize:10,fontFamily:"Nunito Sans",fill:"var(--muted)"}} unit={metricUnit[metric]}/>
            <Tooltip content={<CustomTooltip unit={metricUnit[metric]}/>}/>
            <Legend wrapperStyle={{fontSize:12,fontFamily:"Nunito Sans",fontWeight:600}}/>
            {metric==="humidity" && (
              <ReferenceLine y={MOISTURE_THRESHOLD} stroke="var(--yellow)" strokeDasharray="5 4"
                label={{value:"Threshold",fill:"#9a7a00",fontSize:10,fontWeight:700}}/>
            )}
            {sel.map(id => (
              <Area key={id} type="monotone" dataKey={id}
                stroke={NODE_COLORS[id]||"#1a9c3e"} strokeWidth={2.5}
                fill={`url(#g_${id})`} dot={false} activeDot={{r:5}}/>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-title">Daily Water Summary : Last 14 Days</div>
        <div className="card-sub">Average soil humidity, rainfall, and irrigation applied per day</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={DAILY_HISTORY} margin={{top:5,right:10,left:-10,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)"/>
            <XAxis dataKey="label" tick={{fontSize:10,fontFamily:"Nunito Sans",fill:"var(--muted)"}}/>
            <YAxis tick={{fontSize:10,fontFamily:"Nunito Sans",fill:"var(--muted)"}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:12,fontFamily:"Nunito Sans",fontWeight:600}}/>
            <Bar dataKey="avg_hum"      name="Avg Humidity (%)"       fill="#1a9c3e" radius={[4,4,0,0]}/>
            <Bar dataKey="rainfall_mm"  name="Rainfall (mm)"          fill="#1d9cd3" radius={[4,4,0,0]}/>
            <Bar dataKey="irrigation_l" name="Irrigation Applied (L)" fill="#f5c518" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── TAB 3: Crops ──────────────────────────────────────────────────────────
function CropsTab({ nodes }) {
  const [crops, setCrops] = useState(() =>
    Object.fromEntries(nodes.map(n => [n.node_id, { crop:"", planted:"", notes:"" }]))
  );
  const [saved, setSaved] = useState({});

  const update = (id,f,v) => setCrops(p=>({...p,[id]:{...p[id],[f]:v}}));
  const daysSince = ds => { if(!ds)return null; const d=(Date.now()-new Date(ds))/86400000; return d>0?Math.floor(d):null; };
  const save = id => { setSaved(p=>({...p,[id]:true})); setTimeout(()=>setSaved(p=>({...p,[id]:false})),2000); };

  const cropOptions = ["Maize","Wheat","Rice","Tomato","Cassava","Yam","Pepper",
    "Groundnut","Sorghum","Soybean","Okra","Spinach","Cabbage","Onion","Garlic","Other"];

  return (
    <div>
      <div className="section-heading">Crop Management</div>
      <div className="section-desc">Record the crop and planting date for each sensor node</div>
      <div className="crop-grid">
        {nodes.map(n => {
          const col = NODE_COLORS[n.node_id]||"#1a9c3e";
          const d   = daysSince(crops[n.node_id]?.planted);
          return (
            <div key={n.node_id} className="crop-card">
              <div className="crop-top-bar" style={{background:col}}/>
              <div className="crop-card-header">
                <span className="crop-node-label">{n.node_id}</span>
                <span className={`node-badge ${n.active?"online":"offline"}`}>{n.active?"LIVE":"OFFLINE"}</span>
              </div>
              <div className="form-field">
                <label className="form-label">Crop</label>
                <select className="form-select" value={crops[n.node_id]?.crop||""} onChange={e=>update(n.node_id,"crop",e.target.value)}>
                  <option value="">: Select crop :</option>
                  {cropOptions.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Planting Date</label>
                <input type="date" className="form-input" value={crops[n.node_id]?.planted||""} onChange={e=>update(n.node_id,"planted",e.target.value)}/>
                {d!==null && <div className="days-since">🌱 {d} days since planting</div>}
              </div>
              <div className="form-field">
                <label className="form-label">Notes</label>
                <input type="text" className="form-input" placeholder="e.g. Row 3, east plot" value={crops[n.node_id]?.notes||""} onChange={e=>update(n.node_id,"notes",e.target.value)}/>
              </div>
              <button className="save-btn" style={{background:saved[n.node_id]?"var(--blue)":"var(--green)"}} onClick={()=>save(n.node_id)}>
                {saved[n.node_id]?"✓ Saved":"Save"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TAB 4: Weather ────────────────────────────────────────────────────────
function WeatherTab() {
  const rainDays = WEATHER_FORECAST.filter(d=>d.rain>=60);
  return (
    <div>
      <div className="section-heading">Weather Forecast</div>
      <div className="section-desc">7-day outlook and historical water data for your field</div>

      <div className="weather-strip">
        {WEATHER_FORECAST.map((d,i)=>(
          <div key={d.day} className={`weather-day ${i===0?"today":""}`}>
            <div className="weather-day-name">{d.day}</div>
            <div className="weather-icon">{d.icon}</div>
            <div className="weather-temps">{d.high}° / {d.low}°</div>
            <div className={`weather-rain ${d.rain===0?"none":""}`}>{d.rain>0?`${d.rain}% rain`:"Dry"}</div>
            <div style={{fontSize:11,color:"var(--blue)",fontWeight:700,marginTop:4}}>💧{d.humidity}%</div>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{d.wind} km/h</div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:24}}>
        <div className="card-title">Irrigation Recommendation Based on Forecast</div>
        <div className="card-sub">Adjust your watering schedule around expected rainfall</div>
        <div className="alert-strip" style={{marginBottom:0}}>
          {rainDays.length>0 ? (
            <div className="alert-card ok">
              <div className="alert-icon">🌧️</div>
              <div>
                <div className="alert-title">Rain expected: hold irrigation on {rainDays.map(d=>d.day).join(", ")}</div>
                <div className="alert-desc">Over 60% chance of rainfall. Save water and avoid irrigating on these days.</div>
              </div>
            </div>
          ) : (
            <div className="alert-card warning">
              <div className="alert-icon">☀️</div>
              <div>
                <div className="alert-title">No significant rain forecast this week</div>
                <div className="alert-desc">Monitor soil humidity closely and irrigate based on sensor readings.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Daily Water History: Last 14 Days</div>
        <div className="card-sub">Soil humidity, rainfall received, and irrigation applied</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={DAILY_HISTORY} margin={{top:5,right:10,left:-10,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)"/>
            <XAxis dataKey="label" tick={{fontSize:10,fontFamily:"Nunito Sans",fill:"var(--muted)"}}/>
            <YAxis tick={{fontSize:10,fontFamily:"Nunito Sans",fill:"var(--muted)"}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:12,fontFamily:"Nunito Sans",fontWeight:600}}/>
            <Bar dataKey="avg_hum"      name="Avg Soil Humidity (%)"   fill="#1a9c3e" radius={[4,4,0,0]}/>
            <Bar dataKey="rainfall_mm"  name="Rainfall (mm)"           fill="#1d9cd3" radius={[4,4,0,0]}/>
            <Bar dataKey="irrigation_l" name="Irrigation Applied (L)"  fill="#f5c518" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── TAB 5: Recommendations ────────────────────────────────────────────────
function RecommendationsTab({ nodes }) {
  const recs = [];

  nodes.forEach(n => {
    const hum  = n.sensor_json?.humidity||0;
    const temp = n.sensor_json?.temp_c||0;
    const ec   = n.sensor_json?.ec||0;

    if (!n.active) {
      recs.push({ type:"warning", icon:"📡", title:`${n.node_id} is offline`, node:n.node_id,
        body:"This sensor has not sent data recently. Check device power and mesh connection.",
        action:"Check device" });
      return;
    }
    if (hum<25) {
      recs.push({ type:"urgent", icon:"🚨", title:`Critical moisture: irrigate ${n.node_id} now`, node:n.node_id,
        body:`Soil humidity critically low at ${hum.toFixed(1)}%. Crops at immediate risk of stress. Irrigate right away.`,
        action:"Irrigate immediately" });
    } else if (hum<MOISTURE_THRESHOLD) {
      recs.push({ type:"warning", icon:"💧", title:`${n.node_id} needs irrigation soon`, node:n.node_id,
        body:`Humidity at ${hum.toFixed(1)}% : below ${MOISTURE_THRESHOLD}% threshold. Plan irrigation within 12 hours.`,
        action:"Schedule irrigation" });
    } else if (hum>80) {
      recs.push({ type:"info", icon:"🌊", title:`${n.node_id} : excess moisture detected`, node:n.node_id,
        body:`Humidity at ${hum.toFixed(1)}% is very high. Risk of root disease. Pause irrigation and check drainage.`,
        action:"Check drainage" });
    } else {
      recs.push({ type:"good", icon:"✅", title:`${n.node_id} : moisture optimal`, node:n.node_id,
        body:`Soil humidity at ${hum.toFixed(1)}% is within the ideal range. No irrigation action needed.`,
        action:"No action needed" });
    }
    if (ec>3.0) {
      recs.push({ type:"warning", icon:"⚡", title:`High salt levels at ${n.node_id}`, node:n.node_id,
        body:`EC at ${ec.toFixed(2)} mS/cm : possible over-fertilization or salt buildup. Flush with fresh water.`,
        action:"Flush with water" });
    } else if (ec<0.8) {
      recs.push({ type:"info", icon:"🌿", title:`Low nutrients at ${n.node_id}`, node:n.node_id,
        body:`EC at ${ec.toFixed(2)} mS/cm suggests low nutrients. Apply balanced fertilizer at next irrigation.`,
        action:"Apply fertilizer" });
    }
    if (temp>35) {
      recs.push({ type:"warning", icon:"🌡️", title:`High soil temperature at ${n.node_id}`, node:n.node_id,
        body:`Soil at ${temp.toFixed(1)}°C. Apply mulch to reduce temperature and retain moisture. Water in early morning.`,
        action:"Apply mulch" });
    }
  });

  const rainDays = WEATHER_FORECAST.filter(d=>d.rain>=60).length;
  if (rainDays>=2) {
    recs.push({ type:"info", icon:"🌧️", title:"Rain forecast : reduce irrigation", node:"All nodes",
      body:`${rainDays} days of significant rainfall expected. Reduce scheduled irrigation to avoid waterlogging.`,
      action:"Adjust schedule" });
  }

  return (
    <div>
      <div className="section-heading">Recommendations</div>
      <div className="section-desc">Actions based on live sensor readings, historical trends, and weather forecast</div>
      {recs.length===0 ? (
        <div className="card" style={{textAlign:"center",padding:"48px 0"}}>
          <div style={{fontSize:32,marginBottom:12}}>🌿</div>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:16,color:"var(--green)"}}>All systems healthy</div>
          <div style={{fontSize:13,color:"var(--muted)",marginTop:6}}>No actions required at this time</div>
        </div>
      ) : (
        <div className="rec-grid">
          {recs.map((r,i) => (
            <div key={i} className={`rec-card ${r.type}`}>
              <div className="rec-header">
                <div className="rec-icon">{r.icon}</div>
                <div>
                  <div className="rec-title">{r.title}</div>
                  <div className="rec-node">{r.node}</div>
                </div>
              </div>
              <div className="rec-body">{r.body}</div>
              <span className="rec-action">{r.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]         = useState("dashboard");
  const [nodes, setNodes]     = useState(MOCK_NODES);
  const [history]             = useState(MOCK_HISTORY);
  const [lastUpdate, setLast] = useState(new Date());

  useEffect(() => {
    const poll = async () => {
      try {
        
        setLast(new Date());
      } catch(e) { console.error(e); }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const TABS = [
    { id:"dashboard",       label:"Dashboard" },
    { id:"history",         label:"History" },
    { id:"crops",           label:"Crops" },
    { id:"weather",         label:"Weather" },
    { id:"recommendations", label:"Recommendations" },
  ];

  return (
    <>
      <style>{css}</style>

      <header className="app-header">
        <div className="brand">
          <BrandLogo/>
          <div className="brand-divider"/>
          <div>
            <div className="brand-product">Farmer Solutions</div>
            <div className="brand-product-sub">Dashboard</div>
          </div>
        </div>
        <div className="header-right">
          <div className="live-pill">
            <div className="live-dot"/>
            Live
          </div>
          <div className="update-time">Updated {lastUpdate.toLocaleTimeString()}</div>
        </div>
      </header>

      <nav className="nav-bar">
        {TABS.map(t => (
          <button key={t.id} className={`nav-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab==="dashboard"       && <DashboardTab nodes={nodes} history={history}/>}
        {tab==="history"         && <HistoryTab   nodes={nodes} history={history}/>}
        {tab==="crops"           && <CropsTab     nodes={nodes}/>}
        {tab==="weather"         && <WeatherTab/>}
        {tab==="recommendations" && <RecommendationsTab nodes={nodes}/>}
      </main>

      <footer className="brand-footer">
        <div className="footer-brand">
          <div className="footer-dot"/>
          <span>© 2026 Future Solutions Ltd : Farmer Solutions</span>
        </div>
        <div style={{fontSize:12,color:"var(--muted)"}}>
          {nodes.filter(n=>n.active).length} of {nodes.length} nodes active
        </div>
      </footer>
    </>
  );
}
