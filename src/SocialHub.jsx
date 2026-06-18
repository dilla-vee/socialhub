import { useState, useEffect, useRef } from "react";
import { SignInPage } from "../components/ui/sign-in-flow-1";
import { isAuthenticated, apiFetch, logout as authLogout } from "./lib/auth";

/* ═══════════════════════════════════════════
   THEME PALETTES
═══════════════════════════════════════════ */
const DARK = {
  base:        "#1A1E21",
  surface:     "#21262B",
  surfaceHigh: "#2A3038",
  accent:      "#0197F6",
  accentLight: "#53BFFC",
  text:        "#E8F4FD",
  textMuted:   "#6B8A9E",
  border:      "rgba(1,151,246,0.15)",
  borderHover: "rgba(1,151,246,0.4)",
  cardBg:      "#21262B",
  statBg:      "#21262B",
  rowBg:       "rgba(1,151,246,0.04)",
  rowBorder:   "rgba(1,151,246,0.12)",
  inputBg:     "rgba(1,151,246,0.04)",
  inputBorder: "rgba(1,151,246,0.18)",
  scrollThumb: "rgba(1,151,246,0.35)",
  overlayBg:   "rgba(26,30,33,0.92)",
};

const LIGHT = {
  base:        "#F0F6FF",
  surface:     "#FFFFFF",
  surfaceHigh: "#E4EFFA",
  accent:      "#0197F6",
  accentLight: "#0070B8",
  text:        "#0D1B2A",
  textMuted:   "#4A6880",
  border:      "rgba(1,151,246,0.2)",
  borderHover: "rgba(1,151,246,0.5)",
  cardBg:      "#FFFFFF",
  statBg:      "#FFFFFF",
  rowBg:       "rgba(1,151,246,0.05)",
  rowBorder:   "rgba(1,151,246,0.15)",
  inputBg:     "rgba(1,151,246,0.04)",
  inputBorder: "rgba(1,151,246,0.25)",
  scrollThumb: "rgba(1,151,246,0.4)",
  overlayBg:   "rgba(240,246,255,0.92)",
};

/* ═══════════════════════════════════════════
   PLATFORM CONFIG WITH MULTIPLE ACCOUNTS
═══════════════════════════════════════════ */
const PLATFORMS = [
  { 
    id:"facebook",  label:"Facebook",  color:"#1877F2", icon:"f", 
    accounts: [
      { id:"fb_1", handle:"@dillavee.page", followers:"12.4K", connected:true, apiKey:"", apiSecret:"" },
      { id:"fb_2", handle:"@business.hub", followers:"8.2K", connected:true, apiKey:"", apiSecret:"" },
    ]
  },
  { 
    id:"instagram", label:"Instagram", color:"#E1306C", icon:"📷", 
    accounts: [
      { id:"ig_1", handle:"@dilla.vee", followers:"8.9K", connected:true, apiKey:"", apiSecret:"" },
      { id:"ig_2", handle:"@team.hub", followers:"4.5K", connected:true, apiKey:"", apiSecret:"" },
    ]
  },
  { 
    id:"twitter",   label:"X / Twitter", color:"#1DA1F2", icon:"𝕏", 
    accounts: [
      { id:"tw_1", handle:"@dilla_vee", followers:"5.2K", connected:true, apiKey:"", apiSecret:"" },
    ]
  },
  { 
    id:"linkedin",  label:"LinkedIn",  color:"#0A66C2", icon:"in", 
    accounts: [
      { id:"li_1", handle:"Not connected", followers:"—", connected:false, apiKey:"", apiSecret:"" },
    ]
  },
];

/* ═══════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════ */
const POSTS = [
  { id:1, text:"🌊 Diani Beach is calling — luxury stays, fresh seafood, and unforgettable excursions await. Book now via PiNKeY 19! #DianiBeach #CoastalKenya", platforms:["facebook","instagram","twitter"], status:"published", date:"Jun 8, 2025", likes:342, comments:28, reach:4100 },
  { id:2, text:"New project drop 🚀 — built a full-stack real-time chat app with Socket.io. Clean architecture, instant messaging, auth included. Check GitHub 👇", platforms:["twitter","linkedin"], status:"scheduled", date:"Jun 10, 2025", likes:0, comments:0, reach:0 },
  { id:3, text:"What separates good UX from great UX? The moments users don't notice — smooth transitions, zero friction, and zero confusion. Thread 🧵", platforms:["twitter"], status:"draft", date:"—", likes:0, comments:0, reach:0 },
  { id:4, text:"Building in public: M-Pesa STK Push integration on a PHP/MySQL stack. Here's what I learned about the Daraja API after 3 days of debugging...", platforms:["linkedin","twitter"], status:"published", date:"Jun 5, 2025", likes:189, comments:41, reach:3200 },
  { id:5, text:"Swahili coast vibes 🌴 New gallery drop for PiNKeY 19. Seafood fresh from the ocean, sunsets over the Indian Ocean. Come through.", platforms:["instagram","facebook"], status:"published", date:"Jun 3, 2025", likes:520, comments:63, reach:7800 },
];

const ANALYTICS = [
  { day:"Mon", facebook:420, instagram:380, twitter:210, linkedin:90 },
  { day:"Tue", facebook:380, instagram:490, twitter:280, linkedin:120 },
  { day:"Wed", facebook:510, instagram:420, twitter:190, linkedin:145 },
  { day:"Thu", facebook:460, instagram:550, twitter:310, linkedin:200 },
  { day:"Fri", facebook:590, instagram:610, twitter:350, linkedin:180 },
  { day:"Sat", facebook:720, instagram:800, twitter:420, linkedin:90 },
  { day:"Sun", facebook:640, instagram:730, twitter:380, linkedin:75 },
];

const CALENDAR_POSTS = {
  "2025-06-10": [{text:"Socket.io project drop", platforms:["twitter","linkedin"], status:"scheduled"}],
  "2025-06-12": [{text:"UX thread", platforms:["twitter"], status:"draft"}],
  "2025-06-15": [{text:"Client case study", platforms:["linkedin"], status:"scheduled"}],
  "2025-06-18": [{text:"Beach content", platforms:["instagram","facebook"], status:"scheduled"}],
  "2025-06-22": [{text:"Weekly dev tip", platforms:["twitter"], status:"draft"}],
  "2025-06-25": [{text:"M-Pesa follow-up", platforms:["twitter","linkedin"], status:"scheduled"}],
};

/* ═══════════════════════════════════════════
   GLOBAL STYLES — theme-aware function
═══════════════════════════════════════════ */
const makeStyles = (C) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body, #root { height:100%; }

  body {
    background: ${C.base};
    color: ${C.text};
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  }

  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.scrollThumb}; border-radius:4px; }

  .app-shell {
    display: grid;
    grid-template-columns: 68px 1fr;
    grid-template-rows: 1fr;
    height: 100vh;
    overflow: hidden;
  }
  @media (min-width: 769px) and (max-width: 1024px) {
    .app-shell { grid-template-columns: 58px 1fr; }
  }
  @media (max-width: 768px) {
    .app-shell { grid-template-columns: 1fr; grid-template-rows: 1fr 56px; }
  }

  /* ── SIDEBAR ── */
  .sidebar {
    background: ${C.surface};
    border-right: 1px solid ${C.border};
    display: flex; flex-direction: column;
    align-items: center;
    padding: 1.2rem 0;
    gap: 0.2rem;
    z-index: 50;
    overflow: hidden;
  }
  @media (min-width: 769px) and (max-width: 1024px) {
    .sidebar { padding: 0.9rem 0; }
  }
  @media (max-width: 768px) {
    .sidebar {
      border-right: none;
      border-top: 1px solid ${C.border};
      flex-direction: row;
      padding: 0; gap: 0; order: 2;
    }
  }
  .sidebar-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 1.15rem;
    background: linear-gradient(135deg, #0197F6, #53BFFC);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1.4rem;
    letter-spacing: -0.03em;
  }

  @media (max-width: 768px) {
    .sidebar-logo {
      display: none;
    }
  }
  .nav-item {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 1.15rem;
    transition: background 0.2s, transform 0.15s;
    position: relative;
    color: #6B8A9E;
    border: 1px solid transparent;
    flex-shrink: 0;
  }
  @media (min-width: 769px) and (max-width: 1024px) {
    .nav-item { width: 38px; height: 38px; border-radius: 10px; font-size: 1rem; }
  }
  @media (max-width: 768px) {
    .nav-item { flex: 1; border-radius: 0; height: 56px; width: auto; font-size: 1.2rem; }
  }
  .nav-item:hover { background: rgba(1,151,246,0.12); color: #53BFFC; transform: scale(1.08); }
  .nav-item.active {
    background: rgba(1,151,246,0.18);
    border-color: rgba(1,151,246,0.45);
    color: #0197F6;
    box-shadow: 0 0 20px rgba(1,151,246,0.2);
  }
  .nav-item .tooltip {
    position: absolute; left: calc(100% + 12px);
    background: ${C.surface}; border: 1px solid ${C.border};
    color: ${C.text}; font-family: 'Space Mono', monospace;
    font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 0.3rem 0.7rem; border-radius: 6px; white-space: nowrap;
    opacity: 0; pointer-events: none;
    transition: opacity 0.15s;
    z-index: 100;
  }
  @media (max-width: 1024px) { .nav-item .tooltip { display: none; } }
  .nav-item:hover .tooltip { opacity: 1; }
  .sidebar-spacer { flex: 1; }

  @media (max-width: 768px) {
    .sidebar-spacer {
      display: none;
    }
  }

  /* ── MAIN ── */
  .main-area {
    display: flex; flex-direction: column;
    overflow: hidden; min-width: 0;
  }
  @media (max-width: 768px) { .main-area { order: 1; } }

  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.9rem 2rem;
    background: ${C.surface};
    border-bottom: 1px solid ${C.border};
    flex-shrink: 0;
    gap: 1rem;
  }
  @media (min-width: 769px) and (max-width: 1024px) { .topbar { padding: 0.8rem 1.4rem; } }
  @media (max-width: 768px) { .topbar { padding: 0.75rem 1rem; } }
  .topbar-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem; font-weight: 700;
    color: ${C.text};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  @media (max-width: 768px) { .topbar-title { font-size: 0.95rem; } }

  .topbar-right { display:flex; align-items:center; gap:0.9rem; flex-shrink:0; }
  @media (max-width: 768px) { .topbar-right { gap: 0.5rem; } }

  .topbar-badge {
    font-family:'Space Mono',monospace; font-size:0.65rem;
    letter-spacing:0.1em; text-transform:uppercase;
    padding:0.28rem 0.75rem; border-radius:50px;
    background:rgba(1,151,246,0.12); border:1px solid rgba(1,151,246,0.4);
    color:#0197F6; white-space:nowrap;
  }
  @media (max-width: 480px) { .topbar-badge { display: none; } }

  .avatar {
    width:34px;height:34px;border-radius:50%;
    background:linear-gradient(135deg,#0197F6,#0070B8);
    display:flex;align-items:center;justify-content:center;
    font-weight:700;font-size:0.8rem;color:#FFFFFF;cursor:pointer;
    flex-shrink:0; border:1px solid rgba(1,151,246,0.4);
  }
  @media (max-width: 768px) { .avatar { width:30px; height:30px; font-size:0.72rem; } }
  .page-content {
    flex:1;overflow-y:auto;padding:1.8rem 2rem;
  }
  @media (min-width: 769px) and (max-width: 1024px) { .page-content { padding: 1.4rem 1.4rem; } }
  @media (max-width: 768px)  { .page-content { padding: 1rem 0.9rem; } }
  @media (max-width: 480px)  { .page-content { padding: 0.8rem 0.75rem; } }

  /* ── CARDS ── */
  .card {
    background: ${C.cardBg};
    border: 1px solid ${C.border};
    border-radius: 14px;
    padding: 1.4rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    min-width: 0;
  }
  @media (min-width: 769px) and (max-width: 1024px) { .card { padding: 1.1rem; border-radius: 12px; } }
  @media (max-width: 768px) { .card { padding: 1rem; border-radius: 10px; } }
  .card:hover { border-color: ${C.borderHover}; box-shadow: 0 0 24px rgba(1,151,246,0.08); }

  /* ── BUTTONS ── */
  .btn {
    display:inline-flex; align-items:center; gap:0.45rem;
    font-family:'Space Mono',monospace; font-size:0.72rem;
    letter-spacing:0.08em; font-weight:700;
    padding:0.6rem 1.3rem; border-radius:8px; border:none;
    cursor:pointer; transition:all 0.2s; text-transform:uppercase;
    white-space:nowrap;
  }
  @media (min-width: 769px) and (max-width: 1024px) { .btn { padding: 0.55rem 1.1rem; font-size: 0.68rem; } }
  @media (max-width: 768px) { .btn { padding: 0.5rem 0.9rem; font-size: 0.65rem; } }
  .btn-primary {
    background:linear-gradient(135deg,#0197F6,#0070B8);
    color:#fff;
    border:1px solid rgba(1,151,246,0.4);
    box-shadow:0 4px 20px rgba(1,151,246,0.25);
  }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(1,151,246,0.45); background:linear-gradient(135deg,#1AAAF6,#0197F6); border-color:rgba(1,151,246,0.7); }
  .btn-teal {
    background:linear-gradient(135deg,#53BFFC,#0197F6);
    color:#1A1E21;
    box-shadow:0 4px 20px rgba(1,151,246,0.2);
  }
  .btn-teal:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(1,151,246,0.35); }
  .btn-ghost {
    background:transparent; color:#6B8A9E;
    border:1px solid rgba(1,151,246,0.2);
  }
  .btn-ghost:hover { border-color:#0197F6; color:#53BFFC; background:rgba(1,151,246,0.08); }
  .btn-danger { background:rgba(255,92,92,0.12); color:#FF5C5C; border:1px solid rgba(255,92,92,0.25); }
  .btn-danger:hover { background:rgba(255,92,92,0.2); }
  .btn:disabled, .btn:disabled:hover {
    opacity: 0.55;
    cursor: not-allowed;
    background: rgba(255,255,255,0.05) !important;
    color: #4A4E6A !important;
    border: 1px solid rgba(255,255,255,0.05) !important;
    box-shadow: none !important;
    transform: none !important;
  }

  /* ── LABELS ── */
  .label {
    font-family:'Space Mono',monospace; font-size:0.62rem;
    letter-spacing:0.14em; text-transform:uppercase;
    color:${C.textMuted}; margin-bottom:0.6rem; display:block;
  }

  /* Login page — kept for legacy */
  .login-shell {
    position:relative; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background: ${C.base};
  }

  .section-heading {
    font-family:'Syne',sans-serif; font-weight:700;
    font-size:1.35rem; color:${C.text}; margin-bottom:0.3rem;
  }
  @media (min-width: 769px) and (max-width: 1024px) { .section-heading { font-size: 1.2rem; } }
  @media (max-width: 768px) { .section-heading { font-size: 1.05rem; } }

  .section-sub { font-size:0.85rem; color:${C.textMuted}; margin-bottom:1.6rem; line-height:1.6; }
  @media (max-width: 768px) { .section-sub { margin-bottom: 1rem; font-size: 0.8rem; } }

  /* ── STATUS PILLS ── */
  .pill {
    display:inline-flex; align-items:center; gap:0.3rem;
    font-family:'Space Mono',monospace; font-size:0.6rem;
    letter-spacing:0.1em; text-transform:uppercase;
    padding:0.22rem 0.65rem; border-radius:50px;
    white-space: nowrap;
  }
  .pill-published { background:rgba(0,229,160,0.12); color:#00E5A0; border:1px solid rgba(0,229,160,0.25); }
  .pill-scheduled { background:rgba(1,151,246,0.12); color:#0197F6; border:1px solid rgba(1,151,246,0.3); }
  .pill-draft     { background:rgba(107,138,158,0.15); color:#6B8A9E; border:1px solid rgba(107,138,158,0.25); }
  .pill-failed    { background:rgba(255,92,92,0.12); color:#FF5C5C; border:1px solid rgba(255,92,92,0.25); }

  /* ── PLATFORM CHIP ── */
  .pchip {
    display:inline-flex; align-items:center; gap:0.3rem;
    font-family:'Space Mono',monospace; font-size:0.58rem;
    padding:0.18rem 0.55rem; border-radius:4px;
    border:1px solid; font-weight:700; white-space:nowrap;
  }

  /* ── INPUT ── */
  .input, .textarea {
    width:100%; background:${C.inputBg};
    border:1px solid ${C.inputBorder}; border-radius:8px;
    padding:0.75rem 1rem; color:${C.text};
    font-family:'Inter',sans-serif; font-size:0.9rem;
    outline:none; transition:border-color 0.2s, box-shadow 0.2s;
    resize:none;
  }
  @media (max-width: 768px) { .input, .textarea { font-size: 16px; padding: 0.75rem 0.9rem; } }
  .input:focus,.textarea:focus { border-color:#0197F6; box-shadow:0 0 0 3px rgba(1,151,246,0.12); }
  .input::placeholder,.textarea::placeholder { color:${C.textMuted}; }

  /* ── GRID HELPERS ── */
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; }
  .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1.2rem; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:1.2rem; }

  @media (min-width: 769px) and (max-width: 1024px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .grid-3 { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .grid-2 { gap: 1rem; }
  }
  @media (max-width: 768px) {
    .grid-2 { grid-template-columns: 1fr; gap: 0.9rem; }
    .grid-3 { grid-template-columns: 1fr; gap: 0.9rem; }
    .grid-4 { grid-template-columns: repeat(2,1fr); gap: 0.75rem; }
  }
  @media (max-width: 400px) {
    .grid-4 { grid-template-columns: 1fr; }
  }

  .flex-row { display:flex; align-items:center; }
  .flex-between { display:flex; align-items:center; justify-content:space-between; }
  @media (max-width: 768px) { .flex-between { flex-wrap: wrap; gap: 0.75rem; } }

  .gap-sm { gap:0.6rem; }
  .gap-md { gap:1rem; }
  .gap-lg { gap:1.5rem; }

  /* ── DIVIDER ── */
  .divider { height:1px; background:rgba(1,151,246,0.1); margin:1.2rem 0; }

  /* ── PULSE ANIMATION ── */
  @keyframes pulseRing {
    0% { transform:scale(0.8); opacity:0.8; }
    100% { transform:scale(2.2); opacity:0; }
  }
  @keyframes slideIn {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes broadcastWave {
    0%   { transform:scale(1); opacity:0.6; }
    100% { transform:scale(3); opacity:0; }
  }
  @keyframes checkPop {
    0%   { transform:scale(0); opacity:0; }
    60%  { transform:scale(1.3); }
    100% { transform:scale(1); opacity:1; }
  }
  @keyframes shimmer {
    0%   { background-position:200% 0; }
    100% { background-position:-200% 0; }
  }
  .animate-in { animation: slideIn 0.35s ease both; }

  /* ── BROADCAST OVERLAY ── */
  .broadcast-overlay {
    position:fixed; inset:0; z-index:200;
    display:flex; align-items:center; justify-content:center;
    background:${C.overlayBg};
    backdrop-filter:blur(8px);
    animation:fadeIn 0.3s ease;
    padding: 1rem;
  }
  .broadcast-stage {
    position:relative; width:320px; height:320px;
    display:flex; align-items:center; justify-content:center;
  }
  @media (max-width: 480px) { .broadcast-stage { width:260px; height:260px; } }
  .broadcast-core {
    width:72px; height:72px; border-radius:50%;
    background:linear-gradient(135deg,#0197F6,#0070B8);
    display:flex; align-items:center; justify-content:center;
    font-size:1.8rem; z-index:2; position:relative;
    box-shadow:0 0 40px rgba(1,151,246,0.4);
  }
  .wave {
    position:absolute; border-radius:50%;
    border:2px solid rgba(1,151,246,0.3);
    animation:broadcastWave 2s ease-out infinite;
  }
  .w1 { width:80px;  height:80px;  animation-delay:0s; }
  .w2 { width:80px;  height:80px;  animation-delay:0.5s; }
  .w3 { width:80px;  height:80px;  animation-delay:1s; }
  .platform-orbit {
    position:absolute; width:48px; height:48px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:1.1rem; font-weight:700; font-family:'Syne',sans-serif;
    border:2px solid; transition:all 0.4s;
  }
  @media (max-width: 480px) { .platform-orbit { width:40px; height:40px; font-size:0.9rem; } }

  /* ── STAT CARD ── */
  .stat-card {
    background:${C.statBg}; border:1px solid ${C.border};
    border-radius:14px; padding:1.2rem 1.4rem;
    transition:border-color 0.2s, transform 0.2s;
    min-width: 0;
  }
  @media (min-width: 769px) and (max-width: 1024px) { .stat-card { padding: 1rem 1.1rem; border-radius: 12px; } }
  @media (max-width: 768px) { .stat-card { padding: 0.85rem 1rem; border-radius: 10px; } }
  .stat-card:hover { border-color:${C.borderHover}; transform:translateY(-2px); box-shadow:0 0 20px rgba(1,151,246,0.1); }
  .stat-val {
    font-family:'Syne',sans-serif; font-size:2rem; font-weight:800;
    background:linear-gradient(135deg,${C.accentLight},${C.accent});
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    line-height:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }
  @media (min-width: 769px) and (max-width: 1024px) { .stat-val { font-size: 1.65rem; } }
  @media (max-width: 768px) { .stat-val { font-size: 1.4rem; } }
  .stat-label { font-family:'Space Mono',monospace; font-size:0.62rem; color:${C.textMuted}; letter-spacing:0.1em; text-transform:uppercase; margin-top:0.4rem; }
  .stat-delta { font-family:'Space Mono',monospace; font-size:0.65rem; margin-top:0.5rem; }
  .delta-up   { color:#00E5A0; }
  .delta-down { color:#FF5C5C; }

  /* ── CHART BAR ── */
  .bar-wrap { display:flex; flex-direction:column; gap:0.6rem; }
  .bar-row  { display:flex; align-items:center; gap:0.7rem; font-family:'Space Mono',monospace; font-size:0.62rem; color:${C.textMuted}; }
  .bar-track { flex:1; height:6px; background:${C.rowBg}; border-radius:3px; overflow:hidden; }
  .bar-fill  { height:100%; border-radius:3px; transition:width 1s cubic-bezier(.34,1.56,.64,1); }

  /* ── TOGGLE (account connect toggle) ── */
  .toggle-wrap { display:flex; align-items:center; gap:0.5rem; cursor:pointer; }
  .toggle-track {
    width:38px; height:20px; border-radius:10px;
    background:${C.rowBg}; border:1px solid ${C.border};
    position:relative; transition:background 0.2s;
  }
  .toggle-track.on { background:rgba(1,151,246,0.25); border-color:rgba(1,151,246,0.6); }
  .toggle-thumb {
    position:absolute; top:2px; left:2px; width:14px; height:14px;
    border-radius:50%; background:${C.textMuted};
    transition:left 0.25s cubic-bezier(.34,1.56,.64,1), background 0.2s;
  }
  .toggle-track.on .toggle-thumb { left:20px; background:#0197F6; }

  /* ── THEME TOGGLE BUTTON ── */
  .theme-toggle {
    display:flex; align-items:center; justify-content:center;
    width:34px; height:34px; border-radius:50%; border:1px solid ${C.border};
    background:${C.rowBg}; cursor:pointer; transition:all 0.2s; flex-shrink:0;
    color:${C.text}; font-size:1rem;
  }
  .theme-toggle:hover { border-color:${C.accent}; background:rgba(1,151,246,0.12); color:${C.accent}; }
`;

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function PlatformChip({ id }) {
  const p = PLATFORMS.find(x => x.id === id);
  if (!p) return null;
  return (
    <span className="pchip" style={{ color:p.color, borderColor:`${p.color}44`, background:`${p.color}15` }}>
      {p.icon} {p.label}
    </span>
  );
}

function getPostPlatformIds(post) {
  return [...new Set((post.accounts || []).map((a) => a.platformId).filter(Boolean))];
}

function formatPostDate(post) {
  if (post.date) return post.date;
  if (!post.createdAt) return "—";
  return new Date(post.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

function AccountChip({ account, platformId }) {
  const p = PLATFORMS.find(x => x.id === platformId);
  if (!p) return null;
  return (
    <span className="pchip" style={{ color:p.color, borderColor:`${p.color}44`, background:`${p.color}15`, fontSize:"0.55rem" }}>
      {p.icon} {account.handle}
    </span>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div className="toggle-wrap" onClick={() => onChange(!on)}>
      <div className={`toggle-track ${on?"on":""}`}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.facebook + d.instagram + d.twitter + d.linkedin));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:64 }}>
      {data.map((d, i) => {
        const total = d.facebook + d.instagram + d.twitter + d.linkedin;
        const h = (total / max) * 64;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{
              width:"100%", height:h, borderRadius:3,
              background:`linear-gradient(to top, #0197F6, #53BFFC)`,
              transition:"height 0.8s cubic-bezier(.34,1.56,.64,1)",
            }} />
            <span style={{ fontFamily:"Space Mono", fontSize:"0.52rem", color:"#6B8A9E" }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: DASHBOARD
═══════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    onLogin();
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div style={{ marginBottom: "1.2rem" }}>
          <h1>Welcome back</h1>
          <p>Sign in to continue to the SocialHub dashboard.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <div style={{ color: "#FF7B7B", marginBottom: "1rem" }}>{error}</div>}
          <div className="login-actions">
            <button type="submit" className="login-button" disabled={!email || !password}>
              Sign in
            </button>
            <button type="button" className="login-button" style={{ background: "rgba(255,255,255,0.08)", color: "#F0F0FF" }} onClick={() => onLogin()}>
              Continue as guest
            </button>
          </div>
        </form>

        <div className="login-footer">
          Need help? <a href="#">Reset your password</a> or <a href="#">contact support</a>.
        </div>
      </div>
    </div>
  );
}

function Dashboard({ posts = POSTS, platforms = PLATFORMS, onNavigate }) {
  const stats = [
    { val:"26.5K", label:"Total Reach", delta:"+12%", up:true },
    { val:"1,051", label:"Engagements", delta:"+8.3%", up:true },
    { val: String(posts.length), label:"Posts This Month", delta:"+2", up:true },
    { val: String(platforms.reduce((count, p) => count + p.accounts.filter(a => a.connected).length, 0)), label:"Accounts Live", delta:"1 pending", up:null },
  ];
  return (
    <div className="animate-in">
      <div className="flex-between" style={{ marginBottom:"1.6rem" }}>
        <div>
          <h2 className="section-heading">Good morning, Dilla 👋</h2>
          <p className="section-sub" style={{ marginBottom:0 }}>Here's what's happening across your networks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate("composer")}>+ New Post</button>
      </div>

      {/* Stat row */}
      <div className="grid-4" style={{ marginBottom:"1.4rem" }}>
        {stats.map((s,i) => (
          <div className="stat-card" key={i}>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
            {s.delta && (
              <div className={`stat-delta ${s.up===true?"delta-up":s.up===false?"delta-down":""}`} style={{ color: s.up===null?"#4A4E6A":undefined }}>
                {s.up===true?"↑":s.up===false?"↓":"·"} {s.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap:"1.2rem" }}>
        {/* Recent posts */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom:"1rem" }}>
            <span style={{ fontFamily:"Syne", fontWeight:700, fontSize:"0.95rem" }}>Recent Posts</span>
            <button className="btn btn-ghost" style={{ padding:"0.3rem 0.7rem", fontSize:"0.6rem" }} onClick={() => onNavigate("scheduled")}>View all</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.8rem" }}>
            {posts.slice(0,4).map((p) => {
              const platformsForPost = getPostPlatformIds(p);
              return (
                <div key={p.id} style={{ padding:"0.85rem", background:"rgba(1,151,246,0.04)", borderRadius:10, border:"1px solid rgba(1,151,246,0.12)" }}>
                  <div className="flex-between" style={{ marginBottom:"0.5rem" }}>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {platformsForPost.map((pl) => <PlatformChip key={pl} id={pl} />)}
                    </div>
                    <span className={`pill pill-${p.status}`}>{p.status}</span>
                  </div>
                  <p style={{ fontSize:"0.8rem", color:"#A8C5D8", lineHeight:1.55 }}>
                    {p.text.length > 90 ? p.text.slice(0,90)+"…" : p.text}
                  </p>
                  {p.status === "published" && (
                    <div style={{ display:"flex", gap:"1.2rem", marginTop:"0.5rem" }}>
                      {[["❤️", p.likes ?? 0],["💬", p.comments ?? 0],["📡", (p.reach ?? 0).toLocaleString()]].map(([icon,val]) => (
                        <span key={icon} style={{ fontFamily:"Space Mono", fontSize:"0.6rem", color:"#6B8A9E" }}>{icon} {val}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right col */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.2rem" }}>
          {/* Engagement chart */}
          <div className="card">
            <span className="label">Weekly Engagement</span>
            <MiniBarChart data={ANALYTICS} />
            <div className="flex-row gap-sm" style={{ marginTop:"0.9rem", flexWrap:"wrap" }}>
              {[["#1877F2","Facebook"],["#E1306C","Instagram"],["#1DA1F2","Twitter"],["#0A66C2","LinkedIn"]].map(([c,l]) => (
                <span key={l} style={{ fontFamily:"Space Mono", fontSize:"0.58rem", color:"#4A4E6A", display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:c, display:"inline-block" }} />{l}
                </span>
              ))}
            </div>
          </div>

          {/* Connected accounts */}
          <div className="card">
            <span className="label">Connected Accounts</span>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
              {platforms.flatMap(p => p.accounts.filter(a => a.connected).map(acc => ({ platform: p, account: acc })).slice(0, 4)).map(({ platform, account }) => (
                <div key={`${platform.id}_${account.id}`} className="flex-between" style={{ padding:"0.6rem 0.8rem", borderRadius:8, background:"rgba(1,151,246,0.04)", border:"1px solid rgba(1,151,246,0.12)" }}>
                  <div className="flex-row gap-sm">
                    <div style={{ width:28, height:28, borderRadius:7, background:`${platform.color}22`, border:`1px solid ${platform.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:700, color:platform.color }}>
                      {platform.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:"0.8rem" }}>{platform.label}</div>
                      <div style={{ fontFamily:"Space Mono", fontSize:"0.58rem", color:"#4A4E6A" }}>{account.handle}</div>
                    </div>
                  </div>
                  <span className="pill pill-published">Live</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   BROADCAST ANIMATION
═══════════════════════════════════════════ */
function BroadcastOverlay({ selectedAccounts, onDone }) {
  const [step, setStep] = useState(0);
  const positions = [
    { top:"10%",  left:"50%", transform:"translateX(-50%)" },
    { top:"50%",  right:"6%", transform:"translateY(-50%)" },
    { bottom:"10%",left:"50%",transform:"translateX(-50%)" },
    { top:"50%",  left:"6%",  transform:"translateY(-50%)" },
  ];

  useEffect(() => {
    const timers = selectedAccounts.map((_, i) =>
      setTimeout(() => setStep(i + 1), 600 + i * 500)
    );
    const done = setTimeout(onDone, 600 + selectedAccounts.length * 500 + 1200);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [selectedAccounts.length]);

  return (
    <div className="broadcast-overlay">
      <div style={{ textAlign:"center" }}>
        <div className="broadcast-stage">
          <div className="wave w1" />
          <div className="wave w2" />
          <div className="wave w3" />
          <div className="broadcast-core">📡</div>
          {selectedAccounts.map((acc, i) => {
            const platform = PLATFORMS.find(p => acc.platformId === p.id);
            return (
              <div key={acc.accountId} className="platform-orbit" style={{
                ...positions[i % 4],
                borderColor: step > i ? platform.color : "rgba(255,255,255,0.08)",
                background:  step > i ? `${platform.color}20` : "rgba(13,13,18,0.95)",
                color:       step > i ? platform.color : "#4A4E6A",
                boxShadow:   step > i ? `0 0 24px ${platform.color}50` : "none",
                transform:   `${positions[i%4].transform || ""} scale(${step>i?1.15:1})`,
                transition:"all 0.4s cubic-bezier(.34,1.56,.64,1)",
              }}>
                {step > i ? "✓" : platform.icon}
              </div>
            );
          })}
        </div>
        <p style={{ fontFamily:"Syne", fontWeight:700, fontSize:"1.1rem", color:"#F0F0FF", marginTop:"0.5rem" }}>
          {step < selectedAccounts.length ? "Broadcasting…" : "Published! 🎉"}
        </p>
        <p style={{ fontFamily:"Space Mono", fontSize:"0.68rem", color:"#4A4E6A", marginTop:"0.3rem", letterSpacing:"0.1em" }}>
          {step} / {selectedAccounts.length} account{selectedAccounts.length>1?"s":""}
        </p>
      </div>
    </div>
  );
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😊",
    emojis: ["😊", "😂", "🤣", "❤️", "😍", "🥰", "😘", "😭", "😩", "😔", "🥺", "😉", "😎", "🤔", "🤫", "🙄", "😬", "🥱", "😴", "🤢", "🤮", "😡", "🤬", "😱", "😨", "🤯", "🥳", "😇", "🔥", "✨", "🎉", "👏", "👍", "🙌"]
  },
  {
    name: "Gestures",
    icon: "👍",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "✊", "👊", "👋", "👏", "🙌", "👐", "🤲", "🙏", "✍️", "💪", "🧠", "👀", "👤", "👥"]
  },
  {
    name: "Nature",
    icon: "🌲",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "🍀", "🍁", "🍂", "🍃", "🌹", "🌸", "🌺", "🌻", "🌼"]
  },
  {
    name: "Food",
    icon: "🍔",
    emojis: ["🍏", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", "🥥", "🥝", "🥑", "🥦", "🥐", "🥖", "🧀", "🍳", "🥞", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮", "🥗", "🍿", "🍩", "🍪", "🎂", "🧁", "🍫", "🍬", "🍭", "☕", "🍵", "🍺", "🍻", "🥂", "🍷"]
  },
  {
    name: "Travel",
    icon: "🚗",
    emojis: ["🚗", "🏎️", "🚓", "🚒", "🚚", "🚜", "🏍️", "🛵", "🚲", "⛵", "🛶", "✈️", "🚀", "🛸", "⏰", "☀️", "🌤️", "⛅", "🌧️", "❄️", "⛄", "🔥", "💧", "🌊", "⛰️", "🌋", "🏖️", "🏠", "🏢", "🏰"]
  },
  {
    name: "Objects",
    icon: "💡",
    emojis: ["💻", "🖥️", "⌨️", "🖱️", "📷", "📸", "🎥", "🎙️", "⏱️", "⏳", "🔋", "🔌", "💡", "🔦", "💸", "💵", "🪙", "💰", "💳", "💎", "🔧", "🔨", "📦", "✉️", "📧", "💌", "✏️", "✒️", "📝", "📁", "📅", "🔒", "🔑"]
  },
  {
    name: "Symbols",
    icon: "❤️",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️", "💕", "🎯", "🌟", "✨", "⚡", "💥", "🛑", "⛔", "🚫", "🏁", "🚩", "🏳️‍🌈"]
  }
];

const EMOJI_KEYWORDS = {
  "😊": "smile happy content pleased friendly",
  "😂": "laugh cry tear lol funny",
  "🤣": "rofl laugh rolling funny lol",
  "❤️": "heart love red like",
  "😍": "heart eyes love adore like",
  "🥰": "hearts loving affectionate warm",
  "😘": "kiss blow heart love affectionate",
  "😭": "cry sob sad upset devastated",
  "😩": "weary tired stressed exhausted sad",
  "😔": "sad pensive down blue regret",
  "🥺": "pleading begging puppy eyes cute",
  "😉": "wink play flirt cheeky",
  "😎": "cool sunglasses chill awesome style",
  "🤔": "think ponder wonder question doubt",
  "🤫": "shush quiet secret silent whisper",
  "🙄": "roll eyes annoyed unimpressed sarcasm",
  "😬": "grimace awkward tense nervous ouch",
  "🥱": "yawn tired sleepy bored",
  "😴": "sleep zzz resting tired snoring",
  "🤢": "sick green nauseous unwell gross",
  "🤮": "vomit throw up sick unwell disgusting",
  "😡": "angry mad furious annoyed red",
  "🤬": "curse swear angry mad furious",
  "😱": "scream shock fear scared surprised",
  "😨": "fear scared anxious worried",
  "🤯": "mindblown explode shock amazing wow",
  "🥳": "party celebrate birthday hats noise",
  "😇": "angel innocent good holy pure",
  "🔥": "fire hot lit awesome popular trend",
  "✨": "sparkles shine magic clean glowing",
  "🎉": "tada celebrate party congratulations pop",
  "👏": "clap praise well done congrats",
  "👍": "thumbs up yes agree approve like",
  "👎": "thumbs down no disagree reject dislike",
  "👌": "ok okay good perfect correct fine",
  "✌️": "peace victory two fingers sign",
  "🤞": "fingers crossed luck hope wish",
  "✊": "fist raise power strength solidarity",
  "👊": "fist bump punch hit greeting",
  "👋": "wave hello goodbye hi greeting",
  "🙌": "hands raise celebrate high five cheer",
  "👐": "open hands open friendly",
  "🤲": "palms up request prayer book open",
  "🙏": "please thank you pray hands bow",
  "✍️": "write pen hand signing note",
  "💪": "muscle flex strength power biceps strong",
  "🧠": "brain mind intellect smart thinking",
  "👀": "eyes look see watch attention",
  "👤": "shadow user silhouette profile person",
  "👥": "shadows users profiles group people",
  "🐶": "dog puppy pet canine animal",
  "🐱": "cat kitten pet feline animal",
  "🐭": "mouse rodent animal pet",
  "🐹": "hamster rodent pet animal",
  "🐰": "rabbit bunny animal pet",
  "🦊": "fox wild animal red",
  "🐻": "bear wild animal brown grizzly",
  "🐼": "panda animal bear chinese",
  "🐨": "koala bear animal australian",
  "🐯": "tiger cat wild animal striped",
  "🦁": "lion cat wild animal king",
  "🐮": "cow cattle farm animal milk",
  "🐷": "pig farm animal pink",
  "🐸": "frog amphibian green animal jumping",
  "🐵": "monkey ape animal clever",
  "🌲": "evergreen pine tree forest nature wood",
  "🌳": "deciduous tree forest nature green leaves",
  "🌴": "palm tree beach tropical vacation warm",
  "🌵": "cactus desert dry prick spike nature",
  "🌾": "rice sheaf grain crop agriculture farm",
  "🌿": "herb leaf foliage plant medicine green",
  "🍀": "four leaf clover luck lucky green irish",
  "🍁": "maple leaf autumn fall orange nature",
  "🍂": "fallen leaf autumn fall season dry",
  "🍃": "leaf wind green nature breeze fresh",
  "🌹": "rose red flower love romantic beauty",
  "🌸": "cherry blossom pink flower spring japan",
  "🌺": "hibiscus pink flower tropical exotic hawaii",
  "🌻": "sunflower yellow flower summer sunny",
  "🌼": "blossom yellow flower spring garden",
  "🍏": "green apple fruit food healthy",
  "🍎": "red apple fruit food healthy",
  "🍊": "tangerine orange citrus fruit food",
  "🍋": "lemon yellow citrus sour fruit food",
  "🍌": "banana yellow fruit food potassium",
  "🍉": "watermelon slice red green summer fruit",
  "🍇": "grapes purple vine fruit food wine",
  "🍓": "strawberry red sweet berry fruit food",
  "🍒": "cherries red double fruit food sweet",
  "🍑": "peach orange sweet fruit food",
  "🍍": "pineapple tropical spike sweet fruit food",
  "🥥": "coconut tropical brown nut fruit food",
  "🥝": "kiwi green fuzzy fruit food slice",
  "🥑": "avocado green healthy fat seed food",
  "🥦": "broccoli green vegetable healthy tree",
  "🥐": "croissant pastry bread bakery breakfast French",
  "🥯": "bagel bread bakery breakfast round",
  "🍞": "bread loaf toast bakery grain carb",
  "🥖": "baguette bread French bakery long",
  "🧀": "cheese yellow dairy slice Swiss",
  "🍳": "cooking egg frying pan breakfast food",
  "🥞": "pancakes stack breakfast syrup sweet",
  "🥓": "bacon meat pork strip breakfast crispy",
  "🥩": "steak beef meat raw cooked grill",
  "🍗": "poultry drumstick chicken turkey meat leg",
  "🍖": "meat bone barbecue grill rib",
  "🌭": "hotdog sausage bun mustard fastfood",
  "🍔": "hamburger burger beef cheese fastfood",
  "🍟": "fries french fries potato fastfood snack",
  "🍕": "pizza slice cheese pepperoni Italian food",
  "🥪": "sandwich bread lunch snack toast",
  "🌮": "taco Mexican shell meat wrap food",
  "🌯": "burrito Mexican wrap tortilla beans rice",
  "🥗": "salad green healthy vegetable bowl",
  "🍿": "popcorn movie theater snack salty corn",
  "🍩": "donut doughnut pastry sweet pink glazed",
  "🍪": "cookie chocolate chip sweet biscuit snack",
  "🎂": "birthday cake candles dessert sweet celebration",
  "🧁": "cupcake dessert sweet muffin frosting",
  "🍫": "chocolate bar sweet candy cocoa",
  "🍬": "candy sweet wrapping sugar",
  "🍭": "lollipop sweet sucker candy sugar spiral",
  "☕": "coffee hot cup mug tea cafe breakfast",
  "🍵": "tea green teacup hot Japanese drink",
  "🍺": "beer glass alcohol drink mug cold",
  "🍻": "beers cheers clinking mugs alcohol party",
  "🥂": "champagne cheers clinking glasses toast party",
  "🍷": "wine glass red alcohol drink grape",
  "🚗": "car automobile red drive vehicle road",
  "🏎️": "racing car F1 speed sport drive",
  "🚓": "police car patrol siren emergency",
  "🚒": "fire engine truck siren emergency water",
  "🚚": "delivery truck transport shipping vehicle",
  "🚜": "tractor farm agriculture vehicle machinery",
  "🏍️": "motorcycle bike speed vehicle rider",
  "🛵": "scooter motor vespa vehicle transport",
  "🚲": "bicycle bike cycle sport exercise ride",
  "⛵": "sailboat boat yacht wind water sailing",
  "🛶": "canoe boat paddle water row sport",
  "✈️": "airplane plane flight travel sky airport",
  "🚀": "rocket space launch mission shuttle speed",
  "🛸": "ufo flying saucer alien space mystery",
  "⏰": "alarm clock time wake morning hour",
  "☀️": "sun sunny warm weather light summer",
  "🌤️": "sun behind small cloud weather partial",
  "⛅": "sun behind cloud weather overcast",
  "🌧️": "rain shower cloud weather wet water",
  "❄️": "snowflake snow winter cold ice freeze",
  "⛄": "snowman snow winter cold holiday freeze",
  "💧": "droplet water sweat tear liquid clean",
  "🌊": "wave water ocean sea surf beach wind",
  "⛰️": "mountain peak climb nature range land",
  "🌋": "volcano mountain lava eruption hot fire",
  "🏖️": "beach umbrella sand sun sea vacation resort",
  "🏠": "house home building residential living",
  "🏢": "office building business workplace skyscraper",
  "🏰": "castle medieval fortress royal palace tower",
  "💻": "laptop computer pc tech screen work office",
  "🖥️": "desktop monitor computer screen tech display",
  "⌨️": "keyboard typing input computer tech keys",
  "🖱️": "mouse click cursor pointer computer tech",
  "📷": "camera photo picture photography lens snap",
  "📸": "camera flash photo picture photography capture",
  "🎥": "movie camera video film recording cinema",
  "🎙️": "microphone studio recording podcast audio singing",
  "⏱️": "stopwatch timer clock time sport seconds",
  "⏳": "hourglass flowing time sand waiting history",
  "🔋": "battery power charge energy tech status",
  "🔌": "electric plug power adapter connection wire tech",
  "💡": "lightbulb idea light bulb electric creative inspiration",
  "🔦": "flashlight torch light dark beam portable",
  "💸": "money wings cash fly loss spend wealth",
  "💵": "dollar bill cash money green currency",
  "🪙": "coin money gold cents change payment",
  "💰": "money bag gold cash wealth rich dollar",
  "💳": "credit card payment bank finance visa shopping",
  "💎": "gem stone diamond jewelry precious wealth crystal",
  "🔧": "wrench tool spanner fix repair mechanic",
  "🔨": "hammer tool nail build construction repair",
  "📦": "package box delivery parcel cardboard shipping",
  "✉️": "envelope letter mail post send receive message",
  "📧": "email e-mail mail post digital letter electronic",
  "💌": "love letter envelope heart romantic message",
  "✏️": "pencil write draw sketch school tool",
  "✒️": "fountain pen write sign signature ink tool",
  "📝": "memo note notebook paper page list writing",
  "📁": "folder file directory office organize document storage",
  "📅": "calendar date schedule day month event time",
  "🔒": "lock padlocked secure closed privacy safety",
  "🔑": "key lock unlock secure code access tool",
  "🧡": "orange heart love friendship color",
  "💛": "yellow heart love friendship color",
  "💚": "green heart love nature organic color",
  "💙": "blue heart love peace trust color",
  "💜": "purple heart love royalty honor color",
  "🖤": "black heart love dark grief sorrow",
  "🤍": "white heart love peace purity clean",
  "💔": "broken heart sad upset heartbreak love separation",
  "❣️": "heart exclamation punctuation mark red love",
  "💕": "two hearts love hearts romance pink",
  "🎯": "bullseye target goal hit direct focus accurate",
  "🌟": "star glowing shine yellow night sky gold",
  "⚡": "lightning bolt electricity power energy danger flash",
  "💥": "collision explosion boom clash spark burst",
  "🛑": "stop sign red octagonal traffic road halt",
  "⛔": "no entry sign red white bar warning traffic",
  "🚫": "prohibited ban forbidden red circle slash no",
  "🏁": "flag checkered racing finish start sport",
  "🚩": "red flag marker warning alert post sign",
  "🏳️‍🌈": "rainbow flag pride lgbtq community diversity rights"
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/* ═══════════════════════════════════════════
   PAGE: COMPOSER
═══════════════════════════════════════════ */
function Composer({ platforms = PLATFORMS, loading = false, onPostCreated, onNavigate }) {
  const [text, setText] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [scheduled, setScheduled] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [done, setDone] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVariants, setAiVariants] = useState([]);
  const [accountVariants, setAccountVariants] = useState({});
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const maxChars = 280;

  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Smileys");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [fileAccept, setFileAccept] = useState("image/*,video/*");

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (loading || selectedAccounts.length > 0 || !platforms.length) return;
    const defaults = platforms.flatMap(p => p.accounts.filter(acc => acc.connected).slice(0, 1)
      .map(acc => ({ platformId: p.id, accountId: acc.id })));
    if (defaults.length) setSelectedAccounts(defaults);
  }, [loading, platforms, selectedAccounts.length]);

  const callApi = async (path, method = "GET", body) => {
    const opts = { method };
    if (body) opts.body = JSON.stringify(body);
    const response = await apiFetch(`/api${path}`, opts);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`API ${method} ${path}:`, response.status, data);
      throw new Error(data.message || `API request failed (${response.status}).`);
    }
    return data;
  };

  const handlePublish = async () => {
    if ((!text.trim() && attachments.length === 0) || selectedAccounts.length === 0) return;
    setPublishError("");
    setPublishing(true);

    try {
      const payload = {
        text,
        accounts: selectedAccounts,
        scheduled,
        schedDate,
      };
      
      if (attachments.length > 0) {
        payload.attachments = attachments.map(att => ({
          name: att.name,
          type: att.type,
          preview: att.preview || "",
          caption: att.caption || "",
        }));
      }
      
      await callApi("/posts", "POST", payload);
      setBroadcasting(true);
      setDone(false);
    } catch (err) {
      console.error(err);
      setPublishError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const accountsByPlatform = {};
  platforms.forEach(p => {
    accountsByPlatform[p.id] = p.accounts || [];
  });

  const toggleAccount = (platformId, accountId) => {
    setSelectedAccounts(s => {
      const exists = s.find(a => a.platformId === platformId && a.accountId === accountId);
      if (exists) {
        return s.filter(a => !(a.platformId === platformId && a.accountId === accountId));
      } else {
        return [...s, { platformId, accountId }];
      }
    });
  };

  const handleAI = async () => {
    setAiLoading(true);
    setAiVariants([]);
    setPublishError("");
    try {
      const count = Math.max(1, selectedAccounts.length || 1);
      const theme = text.trim() || "From the Kenyan coast to your screen — building delightful digital products that solve real problems.";
      const data = await callApi("/ai/variants", "POST", { theme, count });
      const variants = (data && data.variants) || [];
      if (variants.length) {
        setAiVariants(variants);
        setText(variants[0]);
        // auto-assign variants to currently selected accounts in order
        setAccountVariants((prev) => {
          const map = { ...prev };
          selectedAccounts.forEach((a, idx) => {
            const key = `${a.platformId}|${a.accountId}`;
            map[key] = variants[idx % variants.length];
          });
          return map;
        });
      } else {
        setPublishError("AI did not return any variants.");
      }
    } catch (err) {
      console.error("AI caption generation failed:", err);
      setPublishError(err.message || "AI caption generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const assignVariantToAccount = (platformId, accountId, variant) => {
    const key = `${platformId}|${accountId}`;
    setAccountVariants((prev) => ({ ...prev, [key]: variant }));
  };

  const useVariant = (variant) => {
    setText(variant);
  };

  const handleInsertEmoji = (emoji) => {
    if (!textareaRef.current) {
      setText((prev) => prev + emoji);
      return;
    }
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const value = textarea.value;

    const newValue = value.substring(0, startPos) + emoji + value.substring(endPos);
    setText(newValue);

    const newCursorPos = startPos + emoji.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleAttach = (type) => {
    if (type === "image") {
      setFileAccept("image/*");
    } else if (type === "video") {
      setFileAccept("video/*");
    } else {
      setFileAccept("image/*,video/*");
    }
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    try {
      const newAttachments = await Promise.all(
        files.map(async (file) => {
          const base64 = await fileToBase64(file);
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            preview: base64,
            caption: "",
          };
        })
      );
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err) {
      console.error("Error converting file to Base64:", err);
    }
  };

  const handleAddLink = (url, title) => {
    if (!url) return;
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      formattedUrl = 'https://' + url;
    }
    const newAttachment = {
      name: title || url,
      type: "link",
      size: 0,
      preview: formattedUrl,
      caption: "",
    };
    setAttachments((prev) => [...prev, newAttachment]);
  };

  const updateAttachmentCaption = (index, caption) => {
    setAttachments((prev) => {
      const updated = [...prev];
      updated[index].caption = caption;
      return updated;
    });
  };

  const handleBroadcastDone = () => {
    setBroadcasting(false);
    setDone(true);
    setText("");
    setAttachments([]);
    setAiVariants([]);
    setAccountVariants({});
    const defaults = platforms.flatMap(p => p.accounts.filter(acc => acc.connected).slice(0, 1)
      .map(acc => ({ platformId: p.id, accountId: acc.id })));
    setSelectedAccounts(defaults);
    if (onPostCreated) onPostCreated();
    if (onNavigate) {
      setTimeout(() => {
        setDone(false);
        onNavigate("dashboard");
      }, 1500);
    } else {
      setTimeout(() => setDone(false), 4000);
    }
  };

  return (
    <div className="animate-in">
      {broadcasting && <BroadcastOverlay selectedAccounts={selectedAccounts} onDone={handleBroadcastDone} />}
      <h2 className="section-heading">Compose Post</h2>
      <p className="section-sub">Create once. Publish everywhere.</p>

      {done && (
        <div style={{ padding:"0.9rem 1.2rem", background:"rgba(0,229,160,0.08)", border:"1px solid rgba(0,229,160,0.25)", borderRadius:10, marginBottom:"1.2rem", display:"flex", alignItems:"center", gap:"0.7rem", color:"#00E5A0", fontFamily:"Space Mono", fontSize:"0.75rem" }}>
          ✓ Post published to {selectedAccounts.length} account{selectedAccounts.length>1?"s":""}!
        </div>
      )}

      <div className="grid-2" style={{ gap:"1.4rem", alignItems:"start" }}>
        {/* Left: editor */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.1rem" }}>
          <div className="card">
            <span className="label">Content</span>
            <textarea
              ref={textareaRef}
              className="textarea" rows={7} value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What's on your mind? Write something worth sharing…"
              maxLength={maxChars * 2}
              style={{ marginBottom:"0.7rem" }}
            />
            <div className="flex-between">
              <div className="flex-row gap-sm" style={{ position: "relative" }}>
                <button type="button" className="btn btn-ghost" style={{ padding:"0.35rem 0.6rem", fontSize:"0.85rem" }} onClick={() => handleAttach("image")}>🖼️</button>
                <button type="button" className="btn btn-ghost" style={{ padding:"0.35rem 0.6rem", fontSize:"0.85rem" }} onClick={() => handleAttach("video")}>🎥</button>
                <button type="button" className="btn btn-ghost" style={{ padding:"0.35rem 0.6rem", fontSize:"0.85rem" }} onClick={() => setShowLinkModal(true)}>🔗</button>
                
                <div ref={emojiPickerRef} style={{ display: "inline-block" }}>
                  <button type="button" className="btn btn-ghost" style={{ padding:"0.35rem 0.6rem", fontSize:"0.85rem" }} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                  {showEmojiPicker && (
                    <div style={{
                      position: "absolute",
                      bottom: "100%",
                      left: "0",
                      marginBottom: "8px",
                      width: "320px",
                      height: "380px",
                      background: "rgba(15, 23, 42, 0.95)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      zIndex: 1000,
                    }}>
                      <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Search emojis..."
                          value={emojiSearch}
                          onChange={(e) => setEmojiSearch(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                      </div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        background: "rgba(0, 0, 0, 0.2)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      }}>
                        {EMOJI_CATEGORIES.map((cat) => (
                          <button
                            key={cat.name}
                            type="button"
                            title={cat.name}
                            onClick={() => {
                              setActiveCategory(cat.name);
                              setEmojiSearch("");
                            }}
                            style={{
                              border: "none",
                              fontSize: "1.1rem",
                              padding: "4px 6px",
                              cursor: "pointer",
                              borderRadius: "6px",
                              background: activeCategory === cat.name ? "rgba(255,255,255,0.1)" : "transparent",
                            }}
                          >
                            {cat.icon}
                          </button>
                        ))}
                      </div>
                      <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "10px",
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: "6px",
                        alignContent: "start",
                      }}>
                        {(emojiSearch.trim()
                          ? Object.keys(EMOJI_KEYWORDS).filter((key) =>
                              EMOJI_KEYWORDS[key].toLowerCase().includes(emojiSearch.toLowerCase())
                            )
                          : EMOJI_CATEGORIES.find((c) => c.name === activeCategory)?.emojis || []
                        ).map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleInsertEmoji(emoji)}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "1.4rem",
                              padding: "4px",
                              cursor: "pointer",
                              borderRadius: "6px",
                              textAlign: "center",
                              transition: "transform 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={fileAccept}
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex-row gap-sm">
                <span style={{ fontFamily:"Space Mono", fontSize:"0.62rem", color: text.length > maxChars ? "#FF5C5C" : "#4A4E6A" }}>
                  {text.length}/{maxChars}
                </span>
                <button className="btn btn-ghost" onClick={handleAI} disabled={aiLoading}
                  style={{ fontSize:"0.62rem", padding:"0.35rem 0.8rem", borderColor:"rgba(255,255,255,0.2)", color:"#fff" }}>
                  {aiLoading ? "✦ Generating…" : "✦ AI Caption"}
                </button>
              </div>
            </div>
          </div>
          {attachments.length > 0 && (
            <div className="card" style={{ padding:"1rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", display:"grid", gap:"0.75rem" }}>
              <span className="label">Attachments & Captions</span>
              <div style={{ display:"grid", gap:"1rem" }}>
                {attachments.map((attachment, index) => (
                  <div key={`${attachment.name}-${index}`} style={{ display:"grid", gap:"0.6rem", padding:"0.75rem", background:"rgba(255,255,255,0.02)", borderRadius:8, border:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.9rem" }}>
                      <div style={{ width:48, height:48, borderRadius:12, background:"rgba(255,255,255,0.06)", overflow:"hidden", display:"grid", placeItems:"center" }}>
                        {attachment.type?.startsWith("image/") ? (
                          <img src={attachment.preview} alt={attachment.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        ) : attachment.type === "link" ? (
                          <span style={{ fontSize:"1.2rem" }}>🔗</span>
                        ) : (
                          <span style={{ fontSize:"1.2rem" }}>🎬</span>
                        )}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"Syne", fontWeight:600, fontSize:"0.92rem" }}>{attachment.name}</div>
                        {attachment.type === "link" ? (
                          <div style={{ fontFamily:"Space Mono", fontSize:"0.7rem", color:"#8B94B6", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{attachment.preview}</div>
                        ) : (
                          <div style={{ fontFamily:"Space Mono", fontSize:"0.7rem", color:"#8B94B6" }}>{Math.round(attachment.size / 1024)} KB</div>
                        )}
                      </div>
                      <button className="btn btn-ghost" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} style={{ padding:"0.4rem 0.6rem", fontSize:"0.8rem" }}>✕</button>
                    </div>
                    <div>
                      <input type="text" className="input" placeholder={attachment.type === "link" ? "Add details or a description for this link…" : "Add a caption for this media…"} value={attachment.caption} onChange={(e) => updateAttachmentCaption(index, e.target.value)} style={{ fontSize:"0.85rem" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiVariants.length > 0 && (
            <div className="card" style={{ padding:"1rem", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.1)", display:"grid", gap:"0.6rem" }}>
              <span className="label">AI Variants</span>
              <div style={{ display:"grid", gap:"0.5rem" }}>
                {aiVariants.map((v, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.8rem" }}>
                    <div style={{ flex:1, minWidth:0, fontFamily:"Space Mono", fontSize:"0.9rem", color:"#E6E9F2" }}>{v}</div>
                    <div style={{ display:"flex", gap:"0.5rem" }}>
                      <button className="btn btn-ghost" onClick={() => useVariant(v)} style={{ fontSize:"0.8rem" }}>Use</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule toggle */}
          <div className="card">
            <div className="flex-between">
              <div>
                <span className="label" style={{ marginBottom:0 }}>Schedule for later</span>
                <p style={{ fontSize:"0.78rem", color:"#4A4E6A", marginTop:"0.2rem" }}>Choose a date & time to auto-publish</p>
              </div>
              <Toggle on={scheduled} onChange={setScheduled} />
            </div>
            {scheduled && (
              <div style={{ marginTop:"1rem" }}>
                <input type="datetime-local" className="input"
                  value={schedDate} onChange={e=>setSchedDate(e.target.value)}
                  style={{ colorScheme:"dark" }} />
              </div>
            )}
          </div>

          {/* Publish button */}
          <button className="btn btn-teal" style={{ width:"100%", justifyContent:"center", padding:"0.9rem", background: "#fff", color: "#000" }}
            onClick={handlePublish} disabled={(!text.trim() && attachments.length === 0) || selectedAccounts.length === 0 || publishing}>
            {publishing ? "Publishing…" : scheduled ? `⏰ Schedule to ${selectedAccounts.length} Account${selectedAccounts.length>1?"s":""}` : `📡 Publish to ${selectedAccounts.length} Account${selectedAccounts.length>1?"s":""}`}
          </button>
          {publishError && (
            <div style={{ marginTop:"0.9rem", color:"#FF5C5C", fontFamily:"Space Mono", fontSize:"0.78rem" }}>
              {publishError}
            </div>
          )}
        </div>

        {/* Right: account selector + preview */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.1rem" }}>
          <div className="card">
            <span className="label">Select Accounts</span>
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              {PLATFORMS.map(p => (
                <div key={p.id}>
                  <div style={{ fontFamily:"Syne", fontWeight:600, fontSize:"0.8rem", marginBottom:"0.6rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                    <span style={{ color:p.color }}>{p.icon}</span> {p.label}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginLeft:"0.4rem" }}>
                    {(accountsByPlatform[p.id] || []).map(account => (
                      <div key={account.id}>
                        <div onClick={() => account.connected && toggleAccount(p.id, account.id)}
                        style={{
                          display:"flex", alignItems:"center", justifyContent:"space-between",
                          padding:"0.65rem 0.85rem", borderRadius:8, cursor: account.connected?"pointer":"not-allowed",
                           border:`1px solid ${selectedAccounts.find(a => a.platformId === p.id && a.accountId === account.id) ? "#fff" : "rgba(255,255,255,0.06)"}`,
                          background: selectedAccounts.find(a => a.platformId === p.id && a.accountId === account.id) ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                          transition:"all 0.2s", opacity: account.connected?1:0.45,
                        }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                          <div style={{ fontFamily:"Space Mono", fontSize:"0.65rem", color:p.color }}>{account.handle}</div>
                          <div style={{ fontFamily:"Space Mono", fontSize:"0.55rem", color:"#4A4E6A" }}>{account.followers}</div>
                        </div>
                        <div style={{
                          width:18, height:18, borderRadius:"50%",
                          border:`2px solid ${selectedAccounts.find(a => a.platformId === p.id && a.accountId === account.id)?p.color:"#4A4E6A"}`,
                          background: selectedAccounts.find(a => a.platformId === p.id && a.accountId === account.id)?p.color:"transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          transition:"all 0.2s",
                        }}>
                          {selectedAccounts.find(a => a.platformId === p.id && a.accountId === account.id) && <span style={{ color:"#fff", fontSize:"0.5rem", fontWeight:700 }}>✓</span>}
                        </div>
                        </div>

                        {/* Per-account variant preview & selector when selected */}
                        {selectedAccounts.find(a => a.platformId === p.id && a.accountId === account.id) && (
                          <div style={{ marginLeft:12, marginTop:8, marginBottom:6 }}>
                            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                              <select
                                value={accountVariants[`${p.id}|${account.id}`] ?? ""}
                                onChange={(e) => assignVariantToAccount(p.id, account.id, e.target.value)}
                                style={{ flex:1, padding:"0.45rem 0.6rem", borderRadius:8, background:"rgba(255,255,255,0.02)", color:"#E6E9F2" }}>
                                <option value="">Use editor text</option>
                                {aiVariants.map((v, idx) => (
                                  <option key={idx} value={v}>{`Variant ${idx+1}`}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ marginTop:8, fontFamily:"Space Mono", fontSize:"0.78rem", color:"#C0C4E0" }}>
                              {accountVariants[`${p.id}|${account.id}`] || aiVariants[0] || text || "No preview"}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {text && (
            <div className="card">
              <span className="label">Preview</span>
              <div style={{ padding:"1rem", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex-row gap-sm" style={{ marginBottom:"0.7rem" }}>
                  <div className="avatar" style={{ width:30, height:30, fontSize:"0.7rem" }}>DV</div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:"0.8rem" }}>Dilla.Vee</div>
                    <div style={{ fontFamily:"Space Mono", fontSize:"0.58rem", color:"#4A4E6A" }}>Just now</div>
                  </div>
                </div>
                <p style={{ fontSize:"0.82rem", lineHeight:1.65, color:"#C0C4E0" }}>{text}</p>
                <div className="flex-row gap-sm" style={{ marginTop:"0.8rem", paddingTop:"0.7rem", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                  {["👍 Like","💬 Comment","↗ Share"].map(a => (
                    <button key={a} className="btn btn-ghost" style={{ flex:1, justifyContent:"center", padding:"0.28rem 0", fontSize:"0.62rem" }}>{a}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showLinkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="card"
            style={{
              width: "400px",
              padding: "1.5rem",
              background: "rgba(13, 13, 18, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "1.2rem", margin: 0, color: "#fff" }}>
              Attach Link
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <span className="label" style={{ marginBottom: 0 }}>Link URL</span>
              <input
                type="text"
                className="input"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{ fontSize: "0.9rem" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <span className="label" style={{ marginBottom: 0 }}>Link Title (Optional)</span>
              <input
                type="text"
                className="input"
                placeholder="Example Website"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                style={{ fontSize: "0.9rem" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl("");
                  setLinkTitle("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-teal"
                onClick={() => {
                  handleAddLink(linkUrl, linkTitle);
                  setShowLinkModal(false);
                  setLinkUrl("");
                  setLinkTitle("");
                }}
                disabled={!linkUrl.trim()}
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: SCHEDULED / POSTS
═══════════════════════════════════════════ */
function Scheduled({ posts = [], loading = false, onDeletePost }) {
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [engagementMetric, setEngagementMetric] = useState("likes");
  const [minEngagement, setMinEngagement] = useState("");
  const [error, setError] = useState("");
  const filters = ["all","published","scheduled","draft"];

  const parsePostDate = (post) => {
    const date = Date.parse(post.date);
    return Number.isNaN(date) ? null : new Date(date);
  };

  const now = new Date();
  const filtered = posts.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;

    if (dateRange !== "all") {
      const postDate = parsePostDate(p);
      if (!postDate) return false;
      const days = dateRange === "7" ? 7 : dateRange === "30" ? 30 : 90;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      if (postDate < cutoff) return false;
    }

    if (minEngagement) {
      const minimum = Number(minEngagement);
      if (!Number.isNaN(minimum)) {
        const value = engagementMetric === "comments" ? p.comments : engagementMetric === "reach" ? p.reach : p.likes;
        if (value < minimum) return false;
      }
    }

    return true;
  });

  const deletePost = async (postId) => {
    try {
      setError("");
      if (onDeletePost) {
        const success = await onDeletePost(postId);
        if (!success) {
          setError("Failed to delete post.");
        }
      }
    } catch (err) {
      setError(err.message || "Unable to delete post.");
    }
  };

  return (
    <div className="animate-in">
      <div className="flex-between" style={{ marginBottom:"1.5rem" }}>
        <div>
          <h2 className="section-heading">Posts</h2>
          <p className="section-sub" style={{ marginBottom:0 }}>All your content in one place.</p>
        </div>
        <div style={{ display:"grid", gap:"0.9rem", width:"100%" }}>
          <div className="flex-row gap-sm" style={{ flexWrap:"wrap" }}>
            {filters.map(f => (
              <button key={f} className={`btn ${filter===f?"btn-primary":"btn-ghost"}`}
                style={{ padding:"0.4rem 0.9rem", fontSize:"0.62rem" }}
                onClick={()=>setFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding:"1rem", display:"grid", gap:"0.75rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.75rem", alignItems:"center" }}>
              <div style={{ minWidth:120 }}>
                <div className="label">Date Range</div>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="input" style={{ width:"100%" }}>
                  <option value="all">All dates</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>

              <div style={{ minWidth:120 }}>
                <div className="label">Engagement metric</div>
                <select value={engagementMetric} onChange={e => setEngagementMetric(e.target.value)} className="input" style={{ width:"100%" }}>
                  <option value="likes">Likes</option>
                  <option value="comments">Comments</option>
                  <option value="reach">Reach</option>
                </select>
              </div>

              <div style={{ minWidth:120, flex:1, maxWidth:200 }}>
                <div className="label">Minimum engagements</div>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minEngagement}
                  onChange={e => setMinEngagement(e.target.value)}
                  className="input"
                  style={{ width:"100%" }}
                />
              </div>
            </div>
            <div style={{ fontFamily:"Space Mono", fontSize:"0.8rem", color:"#A0A4C0" }}>
              Filter posts by publish status, recent dates, and minimum engagement counts.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0.9rem" }}>
        {loading && <div style={{ padding:"1rem", textAlign:"center", color:"#A0A4C0" }}>Loading posts…</div>}
        {error && <div style={{ padding:"1rem", background:"rgba(255,92,92,0.1)", border:"1px solid rgba(255,92,92,0.3)", borderRadius:8, color:"#FF5C5C", fontFamily:"Space Mono", fontSize:"0.8rem" }}>{error}</div>}
        {!loading && filtered.length === 0 && <div style={{ padding:"1rem", textAlign:"center", color:"#4A4E6A" }}>No posts yet. Create one to get started!</div>}
        {filtered.map(p => (
          <div key={p.id} className="card" style={{ display:"flex", gap:"1.2rem", alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div className="flex-row gap-sm" style={{ marginBottom:"0.6rem", flexWrap:"wrap" }}>
                {p.platforms.map(pl => <PlatformChip key={pl} id={pl} />)}
                <span className={`pill pill-${p.status}`}>{p.status}</span>
                <span style={{ fontFamily:"Space Mono", fontSize:"0.6rem", color:"#4A4E6A", marginLeft:"auto" }}>{p.date}</span>
              </div>
              <p style={{ fontSize:"0.88rem", color:"#C0C4E0", lineHeight:1.6 }}>{p.text}</p>
              {p.attachments && p.attachments.length > 0 && (
                <div style={{
                  marginTop: "0.75rem",
                  display: "grid",
                  gap: "0.8rem",
                  gridTemplateColumns: p.attachments.length > 1 ? "repeat(auto-fit, minmax(180px, 1fr))" : "1fr"
                }}>
                  {p.attachments.map((att, idx) => (
                    <div key={idx} style={{
                      padding: "0.6rem",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}>
                      {att.preview && (
                        <div style={{
                          width: "100%",
                          maxHeight: "220px",
                          borderRadius: 6,
                          overflow: "hidden",
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(0,0,0,0.2)"
                        }}>
                          {att.type?.startsWith("image/") ? (
                            <img src={att.preview} alt={att.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : att.type?.startsWith("video/") ? (
                            <video src={att.preview} controls style={{ width: "100%", maxHeight: "220px", objectFit: "contain" }} />
                          ) : att.type === "link" ? (
                            <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", background: "rgba(123,97,255,0.05)", borderRadius: 6 }}>
                              <span style={{ fontSize: "1.5rem" }}>🔗</span>
                              <a href={att.preview} target="_blank" rel="noopener noreferrer" style={{ color: "#00E5CC", fontWeight: "600", fontSize: "0.85rem", textDecoration: "underline", wordBreak: "break-all" }}>
                                {att.name || att.preview}
                              </a>
                            </div>
                          ) : (
                            <span style={{ fontSize: "1.5rem" }}>📁</span>
                          )}
                        </div>
                      )}
                      
                      {att.type !== "link" ? (
                        <div>
                          <div style={{ fontFamily: "Syne", fontWeight: 600, fontSize: "0.78rem", marginBottom: "0.1rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {att.name}
                          </div>
                          {att.caption && (
                            <div style={{ fontFamily: "Space Mono", fontSize: "0.72rem", color: "#A0A4C0", marginTop: "0.15rem" }}>
                              {att.caption}
                            </div>
                          )}
                        </div>
                      ) : (
                        att.caption && (
                          <div style={{ fontFamily: "Space Mono", fontSize: "0.72rem", color: "#A0A4C0", padding: "0 0.2rem" }}>
                            {att.caption}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
              {p.status==="published" && (
                <div className="flex-row gap-md" style={{ marginTop:"0.7rem" }}>
                  {[["❤️ Likes",p.likes],["💬 Comments",p.comments],["📡 Reach",p.reach.toLocaleString()]].map(([l,v])=>(
                    <div key={l}>
                      <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:"0.95rem", color:"#F0F0FF" }}>{v}</div>
                      <div style={{ fontFamily:"Space Mono", fontSize:"0.58rem", color:"#4A4E6A" }}>{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-row gap-sm" style={{ flexShrink:0 }}>
              <button className="btn btn-ghost" style={{ padding:"0.35rem 0.7rem", fontSize:"0.62rem" }}>✏️ Edit</button>
              <button
                className="btn btn-danger"
                style={{ padding:"0.35rem 0.7rem", fontSize:"0.62rem" }}
                onClick={() => deletePost(p.id)}
                disabled={loading}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: CALENDAR
═══════════════════════════════════════════ */
function Calendar() {
  const [current] = useState(new Date(2025, 5, 1)); // June 2025
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = 9;
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = current.toLocaleString('default', { month:'long', year:'numeric' });

  return (
    <div className="animate-in">
      <div className="flex-between" style={{ marginBottom:"1.5rem" }}>
        <div>
          <h2 className="section-heading">Content Calendar</h2>
          <p className="section-sub" style={{ marginBottom:0 }}>Your schedule at a glance — {monthName}.</p>
        </div>
        <div className="flex-row gap-sm">
          <button className="btn btn-ghost" style={{ padding:"0.4rem 0.8rem", fontSize:"0.68rem" }}>‹ Prev</button>
          <button className="btn btn-ghost" style={{ padding:"0.4rem 0.8rem", fontSize:"0.68rem" }}>Next ›</button>
        </div>
      </div>

      <div className="card" style={{ padding:"1.2rem" }}>
        {/* Weekday headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ textAlign:"center", fontFamily:"Space Mono", fontSize:"0.58rem", color:"#6B8A9E", padding:"0.4rem 0", letterSpacing:"0.08em" }}>{d}</div>
          ))}
        </div>
        {/* Day grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const key = `2025-06-${String(day).padStart(2,"0")}`;
            const posts = CALENDAR_POSTS[key] || [];
            const isToday = day === today;
            return (
              <div key={i}
                className="cal-day"
                style={{
                  border:`1px solid ${isToday?"rgba(1,151,246,0.6)":"rgba(1,151,246,0.12)"}`,
                  background: isToday?"rgba(1,151,246,0.12)":"rgba(1,151,246,0.03)",
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(1,151,246,0.35)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=isToday?"rgba(1,151,246,0.6)":"rgba(1,151,246,0.12)"}>
                <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:"0.78rem", color: isToday?"#53BFFC":"#E8F4FD", marginBottom:"0.25rem" }}>{day}</div>
                {posts.map((p,pi) => (
                  <div key={pi} style={{
                    fontSize:"0.55rem", fontFamily:"Space Mono",
                    padding:"0.12rem 0.3rem", borderRadius:3, marginBottom:2,
                    background: p.status==="scheduled"?"rgba(1,151,246,0.15)":"rgba(107,138,158,0.15)",
                    color: p.status==="scheduled"?"#53BFFC":"#6B8A9E",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>
                    {p.text}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: ANALYTICS
═══════════════════════════════════════════ */
function Analytics({ posts = [] }) {
  const publishedPosts = posts.filter(p => p.status === "published");

  const dynamicAnalytics = ANALYTICS.map(item => ({ ...item }));
  
  publishedPosts.forEach(post => {
    if (post.createdAt) {
      const date = new Date(post.createdAt);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
      const targetDay = dynamicAnalytics.find(item => item.day === dayName);
      if (targetDay) {
        const platformsForPost = post.platforms || [];
        if (platformsForPost.length > 0) {
          const reachPerPlatform = Math.round((post.reach || 0) / platformsForPost.length);
          platformsForPost.forEach(platformId => {
            if (targetDay[platformId] !== undefined) {
              targetDay[platformId] += reachPerPlatform;
            } else {
              targetDay[platformId] = reachPerPlatform;
            }
          });
        }
      }
    }
  });

  const totalByPlatform = PLATFORMS.map(p => ({
    ...p,
    total: dynamicAnalytics.reduce((s,d)=>s+(d[p.id]||0),0),
    max: Math.max(...dynamicAnalytics.map(d=>d[p.id]||0)),
  }));
  const grandMax = Math.max(...totalByPlatform.map(p=>p.total)) || 1;

  const totalReach = publishedPosts.reduce((sum, p) => sum + (p.reach || 0), 0);
  const totalEngagement = publishedPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0);
  const avgEngagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) + "%" : "0.00%";
  
  const bestPost = publishedPosts.length > 0
    ? [...publishedPosts].sort((a,b) => (b.likes || 0) - (a.likes || 0))[0]
    : null;
  const bestPostLikes = bestPost ? bestPost.likes : 0;
  const bestPostText = bestPost ? (bestPost.text.length > 20 ? bestPost.text.slice(0, 20) + "..." : bestPost.text) : "No posts";

  return (
    <div className="animate-in">
      <h2 className="section-heading">Analytics</h2>
      <p className="section-sub">Engagement across all platforms this week.</p>

      <div className="grid-4" style={{ marginBottom:"1.4rem" }}>
        {[
          { val: totalReach.toLocaleString(), label:"Total Reach", sub:"Real-time impression count" },
          { val: totalEngagement.toLocaleString(), label:"Engagements", sub:"Total likes & comments" },
          { val: avgEngagementRate, label:"Avg Engagement Rate", sub:"Engagement / Reach" },
          { val: bestPostLikes.toString(),   label:"Best Post Likes", sub: bestPostText },
        ].map((s,i)=>(
          <div key={i} style={{ background:"#1C1C1C", border:"1px solid rgba(191,255,0,0.18)", borderRadius:14, padding:"1.2rem 1.4rem", transition:"border-color 0.2s, transform 0.2s" }}>
            <div style={{ fontFamily:"Syne", fontSize:"2rem", fontWeight:800, background:"linear-gradient(135deg,#BFFF00,#8DB800)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", lineHeight:1 }}>{s.val}</div>
            <div style={{ fontFamily:"Space Mono", fontSize:"0.62rem", color:"#8DB800", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:"0.4rem" }}>{s.label}</div>
            <div style={{ fontFamily:"Space Mono", fontSize:"0.62rem", color:"rgba(191,255,0,0.5)", marginTop:"0.4rem" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:"1.4rem" }}>
        {/* Engagement by day */}
        <div className="card">
          <span className="label">Daily Impressions (7 days)</span>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem", marginTop:"0.5rem" }}>
            {dynamicAnalytics.map((d,i) => {
              const total = (d.facebook || 0) + (d.instagram || 0) + (d.twitter || 0) + (d.linkedin || 0);
              const w = (total / (grandMax * 4)) * 100;
              return (
                <div key={i} className="flex-row gap-sm">
                  <span style={{ fontFamily:"Space Mono", fontSize:"0.62rem", color:"#4A4E6A", width:28 }}>{d.day}</span>
                  <div style={{ flex:1, height:8, background:"rgba(255,255,255,0.05)", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${w}%`, height:"100%", borderRadius:4, background:"linear-gradient(90deg,#FFFFFF,#27272A)", transition:"width 1s ease" }} />
                  </div>
                  <span style={{ fontFamily:"Space Mono", fontSize:"0.62rem", color:"#4A4E6A", width:36, textAlign:"right" }}>{total}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-platform breakdown */}
        <div className="card">
          <span className="label">Platform Breakdown</span>
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem", marginTop:"0.5rem" }}>
            {totalByPlatform.map(p => (
              <div key={p.id}>
                <div className="flex-between" style={{ marginBottom:"0.35rem" }}>
                  <span style={{ fontFamily:"Syne", fontWeight:700, fontSize:"0.82rem", color:"#F0F0FF", display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:p.color }}>{p.icon}</span> {p.label}
                  </span>
                  <span style={{ fontFamily:"Space Mono", fontSize:"0.62rem", color:"#4A4E6A" }}>{p.total.toLocaleString()} impressions</span>
                </div>
                <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${(p.total/grandMax)*100}%`, height:"100%", background:p.color, borderRadius:3, opacity:0.85, transition:"width 1.2s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top posts */}
      <div className="card">
        <span className="label">Top Performing Posts</span>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem", marginTop:"0.5rem" }}>
          {publishedPosts.sort((a,b)=>b.likes-a.likes).map(p=>(
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.8rem", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ flex:1 }}>
                <div className="flex-row gap-sm" style={{ marginBottom:"0.4rem" }}>
                  {p.platforms.map(pl=><PlatformChip key={pl} id={pl}/>)}
                </div>
                <p style={{ fontSize:"0.8rem", color:"#A0A4C0" }}>{p.text.slice(0,80)}…</p>
              </div>
              <div className="flex-row gap-md" style={{ flexShrink:0 }}>
                {[["❤️",p.likes],["💬",p.comments],["📡",p.reach.toLocaleString()]].map(([ic,v])=>(
                  <div key={ic} style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:"1rem" }}>{v}</div>
                    <div style={{ fontFamily:"Space Mono", fontSize:"0.55rem", color:"#4A4E6A" }}>{ic}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: ACCOUNTS
═══════════════════════════════════════════ */
function Accounts({ platforms = PLATFORMS, setPlatforms, loading, error, setError }) {
  const callApi = async (path, method = "GET", body) => {
    const opts = { method };
    if (body) opts.body = JSON.stringify(body);
    const response = await apiFetch(`/api${path}`, opts);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "API request failed.");
    return data;
  };

  // Local update only — avoid calling API on every keystroke to prevent race conditions.
  const updateAccount = (platformId, accountId, patch) => {
    setPlatforms(current => current.map(p => p.id === platformId ? {
      ...p,
      accounts: p.accounts.map(acc => acc.id === accountId ? { ...acc, ...patch } : acc)
    } : p));
  };

  const connectAccount = async (platformId, accountId, patchOverride = null) => {
    try {
      let payload = {};
      if (patchOverride) {
        payload = patchOverride;
      } else {
        const platform = platforms.find(p => p.id === platformId);
        const account = platform?.accounts.find(a => a.id === accountId);
        if (!account) throw new Error("Account not found.");
        payload = {
          apiKey: account.apiKey,
          apiSecret: account.apiSecret,
          accessToken: account.accessToken,
          accessTokenSecret: account.accessTokenSecret,
        };
      }

      // persist provided credentials first
      await callApi(`/accounts/${platformId}/${accountId}`, "PUT", payload);

      // then trigger connect which validates the saved credentials
      const data = await callApi(`/accounts/${platformId}/${accountId}/connect`, "POST");
      if (data.platforms) setPlatforms(data.platforms);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect account.");
    }
  };

  const disconnectAccount = async (platformId, accountId) => {
    try {
      const data = await callApi(`/accounts/${platformId}/${accountId}/disconnect`, "POST");
      if (data.platforms) setPlatforms(data.platforms);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const addAccountToPlatform = async (platformId) => {
    try {
      const data = await callApi(`/accounts/${platformId}`, "POST");
      if (data.platforms) setPlatforms(data.platforms);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="animate-in">
        <h2 className="section-heading">Connected Accounts</h2>
        <p className="section-sub">Loading linked accounts from the backend...</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {error && (
        <div style={{ marginBottom:"1rem", padding:"0.9rem 1rem", borderRadius:10, background:"rgba(255,92,92,0.1)", border:"1px solid rgba(255,92,92,0.25)", color:"#FF5C5C", fontFamily:"Space Mono", fontSize:"0.84rem" }}>
          {error}
        </div>
      )}
      <h2 className="section-heading">Connected Accounts</h2>
      <p className="section-sub">Link social accounts using API credentials and manage each account individually.</p>

      <div style={{ display:"flex", flexDirection:"column", gap:"1.2rem", marginBottom:"1.4rem" }}>
        {platforms.map(p => (
          <div key={p.id} className="card">
            <div className="flex-between" style={{ marginBottom:"1.2rem", paddingBottom:"1rem", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex-row gap-sm">
                <div style={{ width:44, height:44, borderRadius:12, background:`${p.color}18`, border:`1px solid ${p.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", fontWeight:700, color:p.color }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:"1rem" }}>{p.label}</div>
                  <div style={{ fontFamily:"Space Mono", fontSize:"0.62rem", color:"#4A4E6A" }}>{p.accounts.filter(a=>a.connected).length} of {p.accounts.length} connected</div>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ padding:"0.45rem 0.8rem", fontSize:"0.62rem" }} onClick={() => addAccountToPlatform(p.id)}>
                + Add Account
              </button>
            </div>

            {/* Accounts list */}
            <div style={{ display:"flex", flexDirection:"column", gap:"0.8rem" }}>
              {p.accounts.map(account => (
                <div key={account.id} style={{ padding:"1rem", background:"rgba(255,255,255,0.02)", borderRadius:10, border:`1px solid ${account.connected?`${p.color}33`:"rgba(255,255,255,0.06)"}` }}>
                  <div className="flex-between" style={{ marginBottom:"0.8rem", gap:"1rem", flexWrap:"wrap" }}>
                    <div className="flex-row gap-sm" style={{ minWidth:240, flex:1 }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:`${p.color}15`, border:`1px solid ${p.color}33`, display:"flex", alignItems:"center", justifyContent:"center", color:p.color, fontSize:"0.7rem", fontWeight:700 }}>
                        {account.handle.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily:"Syne", fontWeight:600, fontSize:"0.9rem", color:"#F0F0FF" }}>{account.handle}</div>
                        <div style={{ fontFamily:"Space Mono", fontSize:"0.58rem", color:"#4A4E6A" }}>{account.followers} followers</div>
                        <div style={{ fontFamily:"Space Mono", fontSize:"0.58rem", color: account.connected ? "#00E5A0" : "#FFB547", marginTop:"0.2rem" }}>
                          {account.connected ? "Connected" : "Not connected"}
                        </div>
                      </div>
                    </div>
                    <div className="flex-row gap-sm" style={{ flexShrink:0, flexWrap:"wrap" }}>
                      <button
                        className={`btn ${account.connected?"btn-danger":"btn-teal"}`}
                        style={{ padding:"0.35rem 0.7rem", fontSize:"0.62rem" }}
                        onClick={() => account.connected ? disconnectAccount(p.id, account.id) : connectAccount(p.id, account.id, {
                          apiKey: account.apiKey,
                          apiSecret: account.apiSecret,
                          accessToken: account.accessToken,
                          accessTokenSecret: account.accessTokenSecret
                        })}
                        disabled={!account.connected && (
                          p.id === "twitter" ? (!account.apiKey || !account.apiSecret || !account.accessToken || !account.accessTokenSecret) :
                          p.id === "linkedin" ? (!account.apiSecret) :
                          (!account.apiKey || !account.apiSecret)
                        )}>
                        {account.connected ? "Disconnect" : (
                          p.id === "twitter" ? (account.apiKey && account.apiSecret && account.accessToken && account.accessTokenSecret ? "Save & Connect" : "Enter Credentials") :
                          p.id === "linkedin" ? (account.apiSecret ? "Save & Connect" : "Enter Token") :
                          (account.apiKey && account.apiSecret ? "Save & Connect" : "Enter Credentials")
                        )}
                      </button>
                      <button className="btn btn-ghost" style={{ padding:"0.35rem 0.6rem", fontSize:"0.62rem" }}>⋯</button>
                    </div>
                  </div>

                  {p.id === "twitter" ? (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.9rem" }}>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>API Key (Consumer Key)</label>
                        <input
                          className="input"
                          type="text"
                          value={account.apiKey || ""}
                          onChange={e => updateAccount(p.id, account.id, { apiKey: e.target.value })}
                          placeholder="Enter API key"
                        />
                      </div>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>API Secret (Consumer Secret)</label>
                        <input
                          className="input"
                          type="text"
                          value={account.apiSecret || ""}
                          onChange={e => updateAccount(p.id, account.id, { apiSecret: e.target.value })}
                          placeholder="Enter API secret"
                        />
                      </div>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>Access Token</label>
                        <input
                          className="input"
                          type="text"
                          value={account.accessToken || ""}
                          onChange={e => updateAccount(p.id, account.id, { accessToken: e.target.value })}
                          placeholder="Enter Access Token"
                        />
                      </div>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>Access Token Secret</label>
                        <input
                          className="input"
                          type="text"
                          value={account.accessTokenSecret || ""}
                          onChange={e => updateAccount(p.id, account.id, { accessTokenSecret: e.target.value })}
                          placeholder="Enter Access Token Secret"
                        />
                      </div>
                    </div>
                  ) : p.id === "facebook" ? (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.9rem" }}>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>Facebook Page ID</label>
                        <input
                          className="input"
                          type="text"
                          value={account.apiKey || ""}
                          onChange={e => updateAccount(p.id, account.id, { apiKey: e.target.value })}
                          placeholder="Enter Page ID"
                        />
                      </div>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>Page Access Token</label>
                        <input
                          className="input"
                          type="text"
                          value={account.apiSecret || ""}
                          onChange={e => updateAccount(p.id, account.id, { apiSecret: e.target.value })}
                          placeholder="Enter Page Access Token"
                        />
                      </div>
                    </div>
                  ) : p.id === "instagram" ? (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.9rem" }}>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>Instagram Business Account ID</label>
                        <input
                          className="input"
                          type="text"
                          value={account.apiKey || ""}
                          onChange={e => updateAccount(p.id, account.id, { apiKey: e.target.value })}
                          placeholder="Enter Instagram Business ID"
                        />
                      </div>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>Facebook Page Access Token</label>
                        <input
                          className="input"
                          type="text"
                          value={account.apiSecret || ""}
                          onChange={e => updateAccount(p.id, account.id, { apiSecret: e.target.value })}
                          placeholder="Enter Page Access Token"
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"0.9rem" }}>
                      <div>
                        <label className="label" style={{ marginBottom:"0.35rem" }}>LinkedIn Access Token</label>
                        <input
                          className="input"
                          type="text"
                          value={account.apiSecret || ""}
                          onChange={e => updateAccount(p.id, account.id, { apiSecret: e.target.value })}
                          placeholder="Enter LinkedIn Access Token"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <span className="label">API Rate Limits</span>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem", marginTop:"0.5rem" }}>
          {[
            { name:"Facebook / Instagram", used:38, max:200, unit:"calls/hour", color:"#1877F2" },
            { name:"Twitter / X",          used:8,  max:17,  unit:"tweets/day (free)", color:"#1DA1F2" },
            { name:"LinkedIn",             used:0,  max:500, unit:"calls/day", color:"#0A66C2" },
          ].map(r => (
            <div key={r.name}>
              <div className="flex-between" style={{ marginBottom:"0.35rem" }}>
                <span style={{ fontFamily:"Syne", fontWeight:600, fontSize:"0.82rem" }}>{r.name}</span>
                <span style={{ fontFamily:"Space Mono", fontSize:"0.6rem", color:"#4A4E6A" }}>{r.used} / {r.max} {r.unit}</span>
              </div>
              <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:3 }}>
                <div style={{ width:`${(r.used/r.max)*100}%`, height:"100%", background:r.color, borderRadius:3, opacity:0.8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Profile({ profile, loading, error }) {
  if (loading) {
    return (
      <div className="animate-in">
        <h2 className="section-heading">My Profile</h2>
        <p className="section-sub">Loading your profile data from the server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in">
        <h2 className="section-heading">My Profile</h2>
        <div style={{ marginTop:"1rem", padding:"1rem", borderRadius:10, background:"rgba(255,92,92,0.1)", border:"1px solid rgba(255,92,92,0.25)", color:"#FF5C5C", fontFamily:"Space Mono", fontSize:"0.95rem" }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <h2 className="section-heading">My Profile</h2>
      <p className="section-sub">Manage your account access and review your profile details.</p>

      <div className="card" style={{ maxWidth:680, width:"100%" }}>
        <div className="flex-between" style={{ gap:"1rem", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
            <div className="avatar" style={{ width:64, height:64, fontSize:"1.4rem" }}>
              {profile?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:"1.1rem" }}>{profile?.email || "Unknown user"}</div>
              <div style={{ fontFamily:"Space Mono", fontSize:"0.82rem", color:"#4A4E6A" }}>{profile?.role === "admin" ? "Administrator" : "Registered user"}</div>
            </div>
          </div>
          <div style={{ textAlign:"right", minWidth:160 }}>
            <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:"0.94rem" }}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</div>
            <div style={{ fontFamily:"Space Mono", fontSize:"0.68rem", color:"#4A4E6A" }}>Member since</div>
          </div>
        </div>

        <div style={{ marginTop:"1.4rem", display:"grid", gap:"0.9rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.8rem" }}>
            <div>
              <span className="label">Email</span>
              <div className="card" style={{ padding:"0.9rem 1rem", borderRadius:10 }}>{profile?.email || "—"}</div>
            </div>
            <div>
              <span className="label">Role</span>
              <div className="card" style={{ padding:"0.9rem 1rem", borderRadius:10 }}>{profile?.role || "user"}</div>
            </div>
          </div>

          <div>
            <span className="label">Connected accounts</span>
            <div className="card" style={{ padding:"0.9rem 1rem", borderRadius:10 }}>
              Manage connected social accounts and link new platforms on the Accounts page.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════ */
const NAV = [
  { id:"dashboard", icon:"⊞", label:"Dashboard" },
  { id:"composer",  icon:"✦", label:"Compose"  },
  { id:"scheduled", icon:"☰", label:"Posts"    },
  { id:"calendar",  icon:"⊟", label:"Calendar" },
  { id:"analytics", icon:"◈", label:"Analytics"},
  { id:"accounts",  icon:"⊕", label:"Accounts" },
  { id:"profile",  icon:"☺", label:"Profile" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [platforms, setPlatforms] = useState(PLATFORMS);
  const [posts, setPosts] = useState(POSTS);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [platformsError, setPlatformsError] = useState("");
  const [postsError, setPostsError] = useState("");
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  // Initialize from stored token so refreshing the page keeps you logged in
  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("socialhub_theme");
    return saved ? saved === "dark" : true; // default dark
  });

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("socialhub_theme", next ? "dark" : "light");
      return next;
    });
  };

  const C = darkMode ? DARK : LIGHT;

  useEffect(() => {
    if (!loggedIn) return;
    const loadPlatforms = async () => {
      try {
        setLoadingPlatforms(true);
        setPlatformsError("");
        const response = await apiFetch("/api/accounts");
        if (response.status === 401) { handleLogout(); return; }
        if (!response.ok) throw new Error("Could not load connected accounts.");
        const data = await response.json();
        setPlatforms(data.platforms || PLATFORMS);
      } catch (err) {
        console.error(err);
        setPlatformsError(err.message || "Could not load accounts.");
      } finally {
        setLoadingPlatforms(false);
      }
    };
    loadPlatforms();
  }, [loggedIn]);

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      setPostsError("");
      const response = await apiFetch("/api/posts");
      if (response.status === 401) { handleLogout(); return; }
      if (!response.ok) throw new Error("Could not load posts.");
      const data = await response.json();
      
      const transformedPosts = (data.posts || []).map((post) => ({
        id: post.id,
        text: post.text,
        platforms: post.accounts?.map(acc => acc.platformId) || [],
        status: post.status || "published",
        date: post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—",
        likes: post.likes || 0,
        comments: post.comments || 0,
        reach: post.reach || 0,
        attachments: post.attachments || [],
        createdAt: post.createdAt,
      }));

      const mergedPosts = [...transformedPosts, ...POSTS.filter(p => !transformedPosts.some(tp => tp.id === p.id))];
      setPosts(mergedPosts);
    } catch (err) {
      console.error(err);
      setPostsError(err.message || "Could not load posts.");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    loadPosts();
  }, [loggedIn]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return false;
    try {
      const response = await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to delete post.");
      }
      await loadPosts();
      return true;
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to delete post.");
      return false;
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setProfileError("");
        const response = await apiFetch("/api/auth/me");
        if (response.status === 401) { handleLogout(); return; }
        if (!response.ok) throw new Error("Could not load profile.");
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setProfileError(err.message || "Could not load profile.");
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [loggedIn]);

  const handleLogout = async () => {
    await authLogout();
    setLoggedIn(false);
    setPage("dashboard");
    setPlatforms(PLATFORMS);
    setPosts(POSTS);
  };

  if (!loggedIn) {
    return <SignInPage onLogin={() => setLoggedIn(true)} />;
  }

  const PAGE_TITLES = {
    dashboard:"Dashboard", composer:"Compose Post",
    scheduled:"Posts", calendar:"Calendar",
    analytics:"Analytics", accounts:"Accounts",
    profile:"Profile",
  };

  const renderPage = () => {
    switch(page) {
      case "dashboard": return <Dashboard posts={posts} platforms={platforms} onNavigate={setPage} />;
      case "composer":  return <Composer platforms={platforms} loading={loadingPlatforms} onPostCreated={loadPosts} onNavigate={setPage} />;
      case "scheduled": return <Scheduled posts={posts} loading={loadingPosts} onDeletePost={handleDeletePost} />;
      case "calendar":  return <Calendar />;
      case "analytics": return <Analytics posts={posts} />;
      case "accounts":  return <Accounts platforms={platforms} setPlatforms={setPlatforms} loading={loadingPlatforms} error={platformsError} setError={setPlatformsError} />;
      case "profile":   return <Profile profile={profile} loading={loadingProfile} error={profileError} />;
      default:          return <Dashboard posts={posts} platforms={platforms} onNavigate={setPage} />;
    }
  };

  return (
    <>
      <style>{makeStyles(C)}</style>
      <div className="app-shell" style={{ background: C.base }}>
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">SH</div>
          {NAV.map(n => (
            <div key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
              {n.icon}
              <span className="tooltip">{n.label}</span>
            </div>
          ))}
          <div className="sidebar-spacer" />
          <div className="nav-item" title="Settings">
            <span style={{ fontSize:"0.7rem" }}>⚙</span>
            <span className="tooltip">Settings</span>
          </div>
          {/* Logout button */}
          <div
            className="nav-item"
            title="Sign out"
            onClick={handleLogout}
            style={{ color: "#FF5C5C" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:18, height:18 }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="tooltip">Sign Out</span>
          </div>
          <div className="avatar" style={{ width:34, height:34, fontSize:"0.72rem", marginTop:"0.4rem" }}>DV</div>
        </aside>

        {/* MAIN */}
        <main className="main-area">
          <div className="topbar">
            <span className="topbar-title">{PAGE_TITLES[page]}</span>
            <div className="topbar-right">
              <span className="topbar-badge">{profile?.role === "admin" ? "Admin" : "User"}</span>
              <div style={{ position:"relative", cursor:"pointer" }}>
                <span style={{ fontSize:"1.1rem", color:"#4A4E6A" }}>🔔</span>
                <span style={{ position:"absolute", top:-2, right:-2, width:8, height:8, borderRadius:"50%", background:"#FFFFFF", border:"2px solid #07080F" }} />
              </div>
              <div
                className="avatar"
                title="Sign out"
                onClick={handleLogout}
                style={{ cursor:"pointer" }}
              >
                {profile?.email?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          </div>
          <div className="page-content">
            {renderPage()}
          </div>
        </main>
      </div>
    </>
  );
}
