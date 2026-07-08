import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Moon, ChevronDown, ChevronLeft, Check, Sparkles, Briefcase, HeartPulse, Camera, PenLine, Clock3, ArrowRight, Pill, UtensilsCrossed, Dumbbell, Settings, Download, RotateCcw, CalendarDays, Sparkle } from "lucide-react";
import { storageGet, storageSet, storageDelete, storageList } from "./storage.js";

/* ---------------------------------- BRAND TOKENS ---------------------------------- */
const C = {
  ink: "#14162B", inkSoft: "#1D2040", indigo: "#262B4F", indigoSoft: "#323764",
  parchment: "#F4EEE0", parchmentDim: "#ECE3CE",
  gold: "#D4AF6A", goldDeep: "#B98F45", rose: "#C9838B", sage: "#7FA189",
  muted: "#9195B3", inkText: "#22233A",
};
const FONT_DISPLAY = "'Fraunces', 'Iowan Old Style', Georgia, serif";
const FONT_BODY = "'Karla', 'Helvetica Neue', Arial, sans-serif";
const FONT_MONO = "'Space Mono', 'SFMono-Regular', Menlo, monospace";

/* ---------------------------------- ROTATIONS ---------------------------------- */
const STUDY = {
  Mon: { label: "CISA — Domain 1", sub: "Info Security Governance" },
  Tue: { label: "NSE — Fortinet modules", sub: "Network Security Expert track" },
  Wed: { label: "CISSP — domain review", sub: "" },
  Thu: { label: "Networking — Pearson/Coursera", sub: "" },
  Fri: { label: "Microsoft course module", sub: "" },
  Sat: { label: "Practice questions", sub: "mixed — CISA / NSE / CISSP" },
  Sun: { label: "Review + catch-up", sub: "whichever track is behind" },
};
const MOVEMENT = {
  Mon: { label: "100-Rep Challenge", sub: "Squats + 2 min plank hold" },
  Tue: { label: "Walk", sub: "30 min" },
  Wed: { label: "100-Rep Challenge", sub: "Push-ups + glute bridges" },
  Thu: { label: "Walk", sub: "30 min" },
  Fri: { label: "100-Rep Challenge", sub: "Lunges (50/leg) + mountain climbers" },
  Sat: { label: "Walk", sub: "30 min" },
  Sun: { label: "Rest / stretch", sub: "" },
};
const CONTENT = {
  Mon: "Instagram", Tue: "YouTube", Wed: "Instagram", Thu: "YouTube",
  Fri: "Instagram", Sat: "YouTube", Sun: "Plan + batch",
};
const DEEN_PROMPT = {
  Mon: "A Name of Allah…", Tue: "A Prophet's story…", Wed: "A dua that stood out…",
  Thu: "A verse on ease…", Fri: "Surah Al-Kahf — one lesson…", Sat: "Something I'm grateful for…", Sun: "Whatever's on my heart…",
};
const FOOD = {
  Mon: { b: "Veggie + egg scramble, whole grain toast", l: "Lentil soup + side salad", d: "Baked salmon, quinoa, roasted broccoli" },
  Tue: { b: "Greek yogurt, chia, berries", l: "Chickpea salad, olive oil + lemon", d: "Grilled chicken, brown rice, sautéed greens" },
  Wed: { b: "Oatmeal with flaxseed + walnuts", l: "Turkey + veggie wrap, whole grain tortilla", d: "Tofu stir-fry, mixed vegetables, small brown rice" },
  Thu: { b: "Veggie omelet, avocado", l: "Quinoa bowl, black beans, peppers", d: "Baked cod, roasted sweet potato, green beans" },
  Fri: { b: "Overnight oats, nut butter, cinnamon", l: "Grilled chicken salad, mixed greens", d: "Lentil curry, cauliflower rice" },
  Sat: { b: "Whole grain toast, avocado, boiled egg", l: "Leftovers / meal-prep bowl", d: "Beef or chicken kebabs, grilled vegetables, small pita" },
  Sun: { b: "Smoothie — spinach, avocado, chia, almond milk", l: "Batch-cook day — big salad + protein", d: "Soup + whole grain bread, veg-forward" },
};
const HAIR_FULL = ["Wed", "Sun"];
const HAIR_BRUSH = ["Mon", "Wed", "Fri", "Sun"];
const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dayKey(date) { return DAY_KEYS[date.getDay()]; }

/* ---------------------------------- MOON PHASE ---------------------------------- */
function getMoonPhase(date) {
  const synodic = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const diffDays = (date.getTime() - knownNewMoon) / 86400000;
  let phase = diffDays % synodic; if (phase < 0) phase += synodic;
  const frac = phase / synodic;
  let name = "New Moon";
  if (frac < 0.03 || frac > 0.97) name = "New Moon";
  else if (frac < 0.22) name = "Waxing Crescent";
  else if (frac < 0.28) name = "First Quarter";
  else if (frac < 0.47) name = "Waxing Gibbous";
  else if (frac < 0.53) name = "Full Moon";
  else if (frac < 0.72) name = "Waning Gibbous";
  else if (frac < 0.78) name = "Last Quarter";
  else name = "Waning Crescent";
  return { frac, name };
}
function MoonGlyph({ frac, size = 40 }) {
  const illum = 1 - Math.abs(frac - 0.5) * 2;
  const wax = frac < 0.5;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill={C.indigoSoft} stroke={C.gold} strokeOpacity="0.35" />
      <clipPath id="moonclip"><circle cx="20" cy="20" r="18" /></clipPath>
      <g clipPath="url(#moonclip)">
        <ellipse cx={wax ? 20 + 18 * (1 - illum) : 20 - 18 * (1 - illum)} cy="20" rx={18 * illum} ry="18" fill="url(#glow)" />
      </g>
      <defs><radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.gold} /><stop offset="100%" stopColor="#F0D999" /></radialGradient></defs>
    </svg>
  );
}

/* ---------------------------------- HIJRI ---------------------------------- */
function getHijriDate(date) {
  try { return new Intl.DateTimeFormat("en-TN-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(date); }
  catch (e) { return null; }
}

/* ---------------------------------- PRAYER TIMES (calculated) ---------------------------------- */
function fixAngle(a) { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; }
function fixHour(a) { a = a - 24 * Math.floor(a / 24); return a < 0 ? a + 24 : a; }
const dsin = (d) => Math.sin((d * Math.PI) / 180), dcos = (d) => Math.cos((d * Math.PI) / 180), dtan = (d) => Math.tan((d * Math.PI) / 180);
const darcsin = (x) => (Math.asin(x) * 180) / Math.PI, darccos = (x) => (Math.acos(x) * 180) / Math.PI, darccot = (x) => (Math.atan(1 / x) * 180) / Math.PI;
function julianDate(year, month, day) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}
function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D), q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const dec = darcsin(dsin(e) * dsin(L));
  let RA = (Math.atan2(dcos(e) * dsin(L), dcos(L)) * 180) / Math.PI / 15; RA = fixHour(RA);
  return { declination: dec, eqt: q / 15 - RA };
}
function solarNoon(jd, lng, tz) { const { eqt } = sunPosition(jd); return 12 + tz - lng / 15 - eqt / 60; }
function computeAngleTime(angle, jd, lat, noon, isMorning) {
  const { declination } = sunPosition(jd);
  const cosH = (-dsin(angle) - dsin(lat) * dsin(declination)) / (dcos(lat) * dcos(declination));
  if (cosH > 1 || cosH < -1) return null;
  const H = darccos(cosH) / 15;
  return isMorning ? noon - H : noon + H;
}
function asrTime(jd, lat, noon) {
  const { declination } = sunPosition(jd);
  const angle = -darccot(1 + dtan(Math.abs(lat - declination)));
  return computeAngleTime(angle, jd, lat, noon, false);
}
function formatTime(t) {
  if (t === null || t === undefined || isNaN(t)) return "—";
  t = fixHour(t + 0.5 / 60);
  let hours = Math.floor(t), minutes = Math.floor((t - hours) * 60);
  const period = hours >= 12 ? "PM" : "AM"; let h12 = hours % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${minutes.toString().padStart(2, "0")} ${period}`;
}
function getPrayerTimes(date, lat = 53.5461, lng = -113.4938) {
  const tz = -date.getTimezoneOffset() / 60;
  const jd = julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const noon = solarNoon(jd, lng, tz);
  let fajr = computeAngleTime(15, jd, lat, noon, true);
  const sunrise = computeAngleTime(0.833, jd, lat, noon, true);
  const asr = asrTime(jd, lat, noon);
  const maghrib = computeAngleTime(0.833, jd, lat, noon, false);
  let isha = computeAngleTime(15, jd, lat, noon, false);
  if (fajr === null || isha === null) {
    const nightLength = fixHour(24 - (maghrib - sunrise)), portion = nightLength / 7;
    if (fajr === null) fajr = sunrise - portion;
    if (isha === null) isha = maghrib + portion;
  }
  return { Fajr: formatTime(fajr), Dhuhr: formatTime(noon), Asr: formatTime(asr), Maghrib: formatTime(maghrib), Isha: formatTime(isha) };
}

/* ---------------------------------- STORAGE ---------------------------------- */
async function loadMeta() { try { const r = await storageGet("qamar-meta"); return r ? JSON.parse(r.value) : null; } catch (e) { return null; } }
async function saveMeta(m) { try { await storageSet("qamar-meta", JSON.stringify(m)); } catch (e) {} }
async function loadDay(n) { try { const r = await storageGet(`qamar-day-${n}`); return r ? JSON.parse(r.value) : null; } catch (e) { return null; } }
async function saveDay(n, d) { try { await storageSet(`qamar-day-${n}`, JSON.stringify(d)); } catch (e) {} }
async function loadWeek(n) { try { const r = await storageGet(`qamar-week-${n}`); return r ? JSON.parse(r.value) : null; } catch (e) { return null; } }
async function saveWeek(n, d) { try { await storageSet(`qamar-week-${n}`, JSON.stringify(d)); } catch (e) {} }
function emptyWeekData() { return { instagramPosted: false, youtubePosted: false, ideasLogged: false, resetWin: "", resetAdjust: "" }; }

async function buildExportText(name) {
  let out = `${name || "Sumaya"}'s 75-Day Cycle — exported ${new Date().toLocaleDateString()}\n${"=".repeat(50)}\n\n`;
  for (let n = 1; n <= 75; n++) {
    const d = await loadDay(n);
    if (!d) continue;
    const hasContent = d.niyyah || d.note || d.quranReflection;
    if (!hasContent) continue;
    out += `Day ${n}\n`;
    if (d.niyyah) out += `  Niyyah: ${d.niyyah}\n`;
    if (d.quranText || d.quranReflection) out += `  Quran (${d.quranText || "—"}): ${d.quranReflection || ""}\n`;
    if (d.note) out += `  Note: ${d.note}\n`;
    out += "\n";
  }
  out += "\n" + "=".repeat(50) + "\nWeekly resets\n\n";
  for (let c = 1; c <= 11; c++) {
    const w = await loadWeek(c);
    if (!w || (!w.resetWin && !w.resetAdjust)) continue;
    out += `Cycle ${c}\n`;
    if (w.resetWin) out += `  Win: ${w.resetWin}\n`;
    if (w.resetAdjust) out += `  Adjusting: ${w.resetAdjust}\n\n`;
  }
  return out;
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function emptyDayData() {
  return {
    niyyah: "", note: "", quranText: "", quranReflection: "",
    tasks: {
      freshen: false, oralAM: false, fajr: false, adhkarAM: false, quranDone: false,
      movement: false, shower: false, hair: false,
      hairMassage: false, hairDetangleDry: false, hairShampoo: false, hairMask: false, hairCoolRinse: false, hairDetangleWet: false, hairLeaveIn: false, hairDry: false,
      skinAM: false, study: false, jobaction: false,
      dhuhr: false,
      asr: false, tidy: false,
      maghrib: false,
      isha: false, adhkarPM: false, skinPM: false, oralPM: false, stretch: false,
      metformin: false, psyllium: false, water: 0,
    },
  };
}
function prayersComplete(t) { return t.fajr && t.dhuhr && t.asr && t.maghrib && t.isha; }

/* ---------------------------------- UI PRIMITIVES ---------------------------------- */
function Toggle({ checked, onChange, label, sub }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl transition-colors"
      style={{ background: checked ? "rgba(212,175,106,0.14)" : "transparent", textAlign: "left" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.inkText, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: "#7d7f96", marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: 8, background: checked ? C.goldDeep : "transparent", border: `1.5px solid ${checked ? C.goldDeep : "#c9bfa0"}` }}>
        {checked && <Check size={15} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  );
}
function TimeBlock({ title, icon: Icon, accent, open, onToggle, children, doneCount, total, timeLabel, onMarkDone }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ background: C.parchment }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 999, background: accent + "22" }}><Icon size={15} color={accent} /></div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 16.5, color: C.inkText }}>{title}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: "#9a8f6e" }}>{timeLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8a8da3" }}>{doneCount}/{total}</span>
          <ChevronDown size={16} color="#8a8da3" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-1">
          {children}
          {onMarkDone && doneCount < total && (
            <button onClick={onMarkDone} style={{ marginTop: 4, alignSelf: "flex-start", background: "none", border: "none", color: C.goldDeep, fontFamily: FONT_MONO, fontSize: 10.5, textDecoration: "underline", cursor: "pointer", padding: "4px 12px" }}>
              went as planned — mark this block done
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- MAIN APP ---------------------------------- */
export default function App() {
  const [meta, setMeta] = useState(undefined);
  const [today] = useState(new Date());
  const [dayData, setDayData] = useState(null);
  const [openBlock, setOpenBlock] = useState("morning");
  const [view, setView] = useState("today");
  const [viewingDay, setViewingDay] = useState(null);
  const [pastDayData, setPastDayData] = useState(null);
  const [streaks, setStreaks] = useState({ prayers: 0, study: 0, movement: 0 });
  const [weekData, setWeekData] = useState(null);
  const [previewDk, setPreviewDk] = useState(null);
  const [startDateInput, setStartDateInput] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [closingEntries, setClosingEntries] = useState(null);

  useEffect(() => {
    const link1 = document.createElement("link");
    link1.rel = "stylesheet";
    link1.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Karla:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link1);
    return () => { document.head.removeChild(link1); };
  }, []);

  useEffect(() => { (async () => { setMeta(await loadMeta()); })(); }, []);

  const currentDayNumber = useMemo(() => {
    if (!meta || !meta.startDate) return null;
    const start = new Date(meta.startDate);
    const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.floor((todayMid - startMid) / 86400000);
    return Math.min(Math.max(diff + 1, 1), 75);
  }, [meta, today]);

  useEffect(() => {
    if (!currentDayNumber) return;
    (async () => { let d = await loadDay(currentDayNumber); if (!d) d = emptyDayData(); setDayData(d); })();
  }, [currentDayNumber]);

  useEffect(() => {
    if (!currentDayNumber) return;
    (async () => {
      const s = { prayers: 0, study: 0, movement: 0 };
      for (let n = currentDayNumber; n >= 1; n--) {
        const d = n === currentDayNumber ? dayData : await loadDay(n);
        if (!d) break;
        if (prayersComplete(d.tasks)) s.prayers++; else if (n !== currentDayNumber) break;
        if (d.tasks.study) s.study++; else if (n !== currentDayNumber) break;
        if (d.tasks.movement) s.movement++; else if (n !== currentDayNumber) break;
      }
      setStreaks(s);
    })();
  }, [dayData, currentDayNumber]);

  useEffect(() => {
    if (!currentDayNumber) return;
    const cn = Math.ceil(currentDayNumber / 7);
    (async () => { let w = await loadWeek(cn); if (!w) w = emptyWeekData(); setWeekData(w); })();
  }, [currentDayNumber]);

  const updateTask = useCallback((key, value) => {
    setDayData((prev) => { const next = { ...prev, tasks: { ...prev.tasks, [key]: value } }; saveDay(currentDayNumber, next); return next; });
  }, [currentDayNumber]);
  const updateTasks = useCallback((keys, value) => {
    setDayData((prev) => {
      const updated = { ...prev.tasks };
      keys.forEach((k) => { updated[k] = value; });
      const next = { ...prev, tasks: updated };
      saveDay(currentDayNumber, next);
      return next;
    });
  }, [currentDayNumber]);
  const updateField = useCallback((key, value) => {
    setDayData((prev) => { const next = { ...prev, [key]: value }; saveDay(currentDayNumber, next); return next; });
  }, [currentDayNumber]);
  const updateWeekField = useCallback((key, value) => {
    setWeekData((prev) => {
      const next = { ...(prev || emptyWeekData()), [key]: value };
      const cn = Math.ceil(currentDayNumber / 7);
      saveWeek(cn, next);
      return next;
    });
  }, [currentDayNumber]);

  async function beginJourney() { const m = { startDate: new Date().toISOString(), name: "Sumaya" }; await saveMeta(m); setMeta(m); }
  async function openPastDay(n) { const d = await loadDay(n); setPastDayData(d || emptyDayData()); setViewingDay(n); }

  const updatePastField = useCallback((key, value) => {
    setPastDayData((prev) => { const next = { ...prev, [key]: value }; saveDay(viewingDay, next); return next; });
  }, [viewingDay]);
  const updatePastTask = useCallback((key, value) => {
    setPastDayData((prev) => { const next = { ...prev, tasks: { ...prev.tasks, [key]: value } }; saveDay(viewingDay, next); return next; });
  }, [viewingDay]);
  const updatePastTasks = useCallback((keys, value) => {
    setPastDayData((prev) => {
      const updated = { ...prev.tasks };
      keys.forEach((k) => { updated[k] = value; });
      const next = { ...prev, tasks: updated };
      saveDay(viewingDay, next);
      return next;
    });
  }, [viewingDay]);

  async function changeStartDate(newDateStr) {
    if (!newDateStr) return;
    const m = { ...meta, startDate: new Date(newDateStr + "T00:00:00").toISOString() };
    await saveMeta(m);
    setMeta(m);
  }

  async function resetEverything() {
    try {
      const dayKeys = await storageList("qamar-day-");
      const weekKeys = await storageList("qamar-week-");
      if (dayKeys && dayKeys.keys) for (const k of dayKeys.keys) await storageDelete(k);
      if (weekKeys && weekKeys.keys) for (const k of weekKeys.keys) await storageDelete(k);
      await storageDelete("qamar-meta");
    } catch (e) {}
    setMeta(null);
    setResetConfirm(false);
    setView("today");
  }

  async function openClosing() {
    const entries = [];
    for (let n = 1; n <= 75; n++) {
      const d = await loadDay(n);
      if (d && (d.niyyah || d.note || d.quranReflection)) entries.push({ n, ...d });
    }
    setClosingEntries(entries);
    setView("closing");
  }

  async function handleExport() {
    setExporting(true);
    const text = await buildExportText(meta?.name);
    downloadText(`${(meta?.name || "sumaya").toLowerCase()}-75-day-cycle.txt`, text);
    setExporting(false);
  }

  if (meta === undefined) return <div style={{ minHeight: "100vh", background: C.ink }} />;

  if (meta === null) {
    return (
      <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 30% 0%, #262B4F 0%, ${C.ink} 60%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <MoonGlyph frac={getMoonPhase(new Date()).frac} size={64} />
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: C.gold, marginTop: 22 }}>with sumayah</div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 42, color: C.parchment, marginTop: 10 }}>QAMAR</h1>
        <p style={{ fontFamily: FONT_BODY, color: C.muted, maxWidth: 320, marginTop: 14, fontSize: 14.5, lineHeight: 1.6 }}>
          Your 75-day cycle, walked in the order you actually live it — Deen, career, health, content, self-care.
        </p>
        <button onClick={beginJourney} style={{ marginTop: 34, background: C.gold, color: C.ink, fontFamily: FONT_MONO, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase", padding: "14px 30px", borderRadius: 999, border: "none", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          Begin day one <ArrowRight size={15} />
        </button>
      </div>
    );
  }
  if (!dayData) return <div style={{ minHeight: "100vh", background: C.ink }} />;

  const moon = getMoonPhase(today);
  const hijri = getHijriDate(today);
  const times = getPrayerTimes(today);
  const dk = dayKey(today);
  const cycleNum = Math.ceil(currentDayNumber / 7);
  const dayInCycle = ((currentDayNumber - 1) % 7) + 1;
  const t = dayData.tasks;
  const food = FOOD[dk];
  const study = STUDY[dk];
  const movement = MOVEMENT[dk];

  if (viewingDay) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, fontFamily: FONT_BODY }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
          <button onClick={() => setViewingDay(null)} className="flex items-center gap-1" style={{ color: C.gold, fontFamily: FONT_MONO, fontSize: 12, background: "none", border: "none", cursor: "pointer", marginBottom: 20 }}><ChevronLeft size={14} /> back to cycle map</button>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: C.parchment, fontSize: 24 }}>Day {viewingDay}</h2>
          {pastDayData ? (
            <div style={{ marginTop: 18 }}>
              <div style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.goldDeep, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Niyyah</div>
                <textarea value={pastDayData.niyyah || ""} onChange={(e) => updatePastField("niyyah", e.target.value)} rows={2} placeholder="Nothing written for this day"
                  style={{ width: "100%", border: "none", outline: "none", resize: "none", fontFamily: FONT_BODY, fontSize: 14, color: C.inkText, background: "transparent" }} />
              </div>
              <div style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Quran</div>
                <input value={pastDayData.quranText || ""} onChange={(e) => updatePastField("quranText", e.target.value)} placeholder="What you read"
                  style={{ width: "100%", border: "1px solid #ddd0ab", borderRadius: 8, padding: "6px 10px", fontFamily: FONT_BODY, fontSize: 13.5, color: C.inkText, marginBottom: 6, background: "#fff" }} />
                <textarea value={pastDayData.quranReflection || ""} onChange={(e) => updatePastField("quranReflection", e.target.value)} rows={2} placeholder="Your reflection"
                  style={{ width: "100%", border: "1px solid #ddd0ab", borderRadius: 8, padding: "6px 10px", fontFamily: FONT_BODY, fontSize: 13.5, color: C.inkText, resize: "none", background: "#fff" }} />
              </div>
              <div style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.sage, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Note</div>
                <textarea value={pastDayData.note || ""} onChange={(e) => updatePastField("note", e.target.value)} rows={2} placeholder="Nothing written for this day"
                  style={{ width: "100%", border: "none", outline: "none", resize: "none", fontFamily: FONT_BODY, fontSize: 14, color: C.inkText, background: "transparent" }} />
              </div>
              <div style={{ background: C.parchment, borderRadius: 14, padding: 16 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#8a8da3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Fix the hard rules</div>
                <Toggle checked={prayersComplete(pastDayData.tasks)} onChange={(v) => updatePastTasks(["fajr", "dhuhr", "asr", "maghrib", "isha"], v)} label="All 5 prayers" />
                <Toggle checked={pastDayData.tasks.study} onChange={(v) => updatePastTask("study", v)} label="Study block" />
                <Toggle checked={pastDayData.tasks.movement} onChange={(v) => updatePastTask("movement", v)} label="Movement" />
              </div>
            </div>
          ) : <p style={{ color: C.muted, marginTop: 20, fontSize: 14 }}>No entry recorded for this day yet.</p>}
        </div>
      </div>
    );
  }

  if (previewDk) {
    const pFood = FOOD[previewDk], pStudy = STUDY[previewDk], pMovement = MOVEMENT[previewDk];
    const pHairFull = HAIR_FULL.includes(previewDk), pHairBrush = HAIR_BRUSH.includes(previewDk);
    const fullNames = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
    return (
      <div style={{ minHeight: "100vh", background: C.ink, fontFamily: FONT_BODY }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
          <button onClick={() => setPreviewDk(null)} className="flex items-center gap-1" style={{ color: C.gold, fontFamily: FONT_MONO, fontSize: 12, background: "none", border: "none", cursor: "pointer", marginBottom: 20 }}><ChevronLeft size={14} /> back to today</button>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: C.parchment, fontSize: 24 }}>Previewing {fullNames[previewDk]}</h2>
          <p style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.muted, marginTop: 4 }}>read-only — nothing here saves</p>

          <div style={{ marginTop: 18, background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>Reflection prompt</div>
            <div style={{ color: C.inkText, marginTop: 6, fontSize: 14 }}>{DEEN_PROMPT[previewDk]}</div>
          </div>
          <div style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.goldDeep, textTransform: "uppercase", letterSpacing: "0.08em" }}>Study — {pStudy.label}</div>
            {pStudy.sub && <div style={{ color: "#7d7f96", marginTop: 4, fontSize: 12.5 }}>{pStudy.sub}</div>}
          </div>
          <div style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.sage, textTransform: "uppercase", letterSpacing: "0.08em" }}>Movement — {pMovement.label}</div>
            {pMovement.sub && <div style={{ color: "#7d7f96", marginTop: 4, fontSize: 12.5 }}>{pMovement.sub}</div>}
          </div>
          <div style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.rose, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Hair</div>
            <div style={{ color: C.inkText, fontSize: 13.5 }}>{pHairFull ? "Full routine day — oil, wash, mask, leave-in" : pHairBrush ? "Brush day" : "No hair task"}</div>
          </div>
          <div style={{ background: C.parchment, borderRadius: 14, padding: 16 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#8a8da3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Food ideas</div>
            <div style={{ fontSize: 13, color: C.inkText, marginBottom: 4 }}><b>B</b> — {pFood.b}</div>
            <div style={{ fontSize: 13, color: C.inkText, marginBottom: 4 }}><b>L</b> — {pFood.l}</div>
            <div style={{ fontSize: 13, color: C.inkText }}><b>D</b> — {pFood.d}</div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "settings") {
    const currentStart = meta?.startDate ? new Date(meta.startDate).toISOString().slice(0, 10) : "";
    return (
      <div style={{ minHeight: "100vh", background: C.ink, fontFamily: FONT_BODY }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
          <button onClick={() => setView("today")} className="flex items-center gap-1" style={{ color: C.gold, fontFamily: FONT_MONO, fontSize: 12, background: "none", border: "none", cursor: "pointer", marginBottom: 20 }}><ChevronLeft size={14} /> today</button>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: C.parchment, fontSize: 24, marginBottom: 20 }}>Settings</h2>

          <div style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <CalendarDays size={13} color={C.goldDeep} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.goldDeep, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cycle start date</span>
            </div>
            <p style={{ fontSize: 12.5, color: "#7d7f96", marginBottom: 10 }}>Currently Day {currentDayNumber} of 75, started {currentStart}.</p>
            <input type="date" defaultValue={currentStart} onChange={(e) => setStartDateInput(e.target.value)}
              style={{ width: "100%", border: "1px solid #ddd0ab", borderRadius: 8, padding: "8px 10px", fontFamily: FONT_BODY, fontSize: 13.5, color: C.inkText, background: "#fff", marginBottom: 10 }} />
            <button onClick={() => changeStartDate(startDateInput)} style={{ background: C.goldDeep, color: "#fff", border: "none", borderRadius: 999, padding: "8px 18px", fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer" }}>Update start date</button>
          </div>

          <div style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <Download size={13} color={C.sage} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.sage, textTransform: "uppercase", letterSpacing: "0.08em" }}>Export your journal</span>
            </div>
            <p style={{ fontSize: 12.5, color: "#7d7f96", marginBottom: 10 }}>Downloads every niyyah, Quran reflection, and note across your 75 days as a text file — your data lives only in this app, so keep a copy.</p>
            <button onClick={handleExport} disabled={exporting} style={{ background: C.sage, color: "#fff", border: "none", borderRadius: 999, padding: "8px 18px", fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer" }}>{exporting ? "Exporting…" : "Export as .txt"}</button>
          </div>

          <div style={{ background: C.parchment, borderRadius: 14, padding: 16 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <RotateCcw size={13} color={C.rose} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.rose, textTransform: "uppercase", letterSpacing: "0.08em" }}>Reset everything</span>
            </div>
            {!resetConfirm ? (
              <>
                <p style={{ fontSize: 12.5, color: "#7d7f96", marginBottom: 10 }}>Clears every day, every week, and your start date. This can't be undone — export first if you want to keep anything.</p>
                <button onClick={() => setResetConfirm(true)} style={{ background: "none", border: `1.5px solid ${C.rose}`, color: C.rose, borderRadius: 999, padding: "8px 18px", fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer" }}>Reset everything</button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 12.5, color: C.rose, marginBottom: 10, fontWeight: 700 }}>Are you sure? This permanently deletes all 75 days of data.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={resetEverything} style={{ background: C.rose, color: "#fff", border: "none", borderRadius: 999, padding: "8px 18px", fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer" }}>Yes, reset</button>
                  <button onClick={() => setResetConfirm(false)} style={{ background: "none", border: "1px solid #ccc", color: "#7d7f96", borderRadius: 999, padding: "8px 18px", fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "closing") {
    return (
      <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 30% 0%, #262B4F 0%, ${C.ink} 60%)`, fontFamily: FONT_BODY }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "36px 20px 60px", textAlign: "center" }}>
          <button onClick={() => setView("map")} className="flex items-center gap-1" style={{ color: C.gold, fontFamily: FONT_MONO, fontSize: 12, background: "none", border: "none", cursor: "pointer", marginBottom: 20 }}><ChevronLeft size={14} /> cycle map</button>
          <MoonGlyph frac={1} size={56} />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: C.parchment, fontSize: 28, marginTop: 16 }}>Your Seventy-Five Days</h2>
          <p style={{ color: C.muted, fontSize: 13.5, marginTop: 8, marginBottom: 28 }}>Everything you wrote, gathered in one place.</p>
          <div style={{ textAlign: "left" }}>
            {closingEntries && closingEntries.length > 0 ? closingEntries.map((e) => (
              <div key={e.n} style={{ background: C.parchment, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.goldDeep, marginBottom: 6 }}>DAY {e.n}</div>
                {e.niyyah && <div style={{ fontSize: 13.5, color: C.inkText, marginBottom: 6 }}><i>"{e.niyyah}"</i></div>}
                {e.quranReflection && <div style={{ fontSize: 13, color: "#5c5e78", marginBottom: 6 }}>Quran ({e.quranText || "—"}): {e.quranReflection}</div>}
                {e.note && <div style={{ fontSize: 13, color: "#5c5e78" }}>{e.note}</div>}
              </div>
            )) : <p style={{ color: C.muted, fontSize: 13.5 }}>No journal entries recorded yet.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (view === "map") {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, fontFamily: FONT_BODY }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 90px" }}>
          <button onClick={() => setView("today")} className="flex items-center gap-1" style={{ color: C.gold, fontFamily: FONT_MONO, fontSize: 12, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}><ChevronLeft size={14} /> today</button>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: C.parchment, fontSize: 26, marginBottom: 4 }}>Your Eleven Cycles</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 22 }}>Day {currentDayNumber} of 75</p>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 11 }, (_, i) => i + 1).map((c) => {
              const startD = (c - 1) * 7 + 1, isActive = cycleNum === c, isPast = c < cycleNum;
              return (
                <button key={c} onClick={() => openPastDay(startD)} style={{ aspectRatio: "1", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: isActive ? "rgba(212,175,106,0.18)" : C.indigo, border: isActive ? `1.5px solid ${C.gold}` : "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                  <Moon size={18} color={isPast || isActive ? C.gold : "#565a7c"} fill={isPast ? C.gold : "none"} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: isActive ? C.gold : C.muted }}>{c}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 28 }}>
            <div style={{ textAlign: "center" }}><div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.gold }}>{streaks.prayers}</div><div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted }}>prayer days</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.gold }}>{streaks.study}</div><div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted }}>study days</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.gold }}>{streaks.movement}</div><div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.muted }}>movement days</div></div>
          </div>
          <div style={{ marginTop: 30, textAlign: "center" }}>
            {currentDayNumber >= 75 ? (
              <button onClick={openClosing} style={{ background: C.gold, color: C.ink, fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: "0.05em", textTransform: "uppercase", padding: "12px 24px", borderRadius: 999, border: "none", cursor: "pointer" }}>Read your closing reflection</button>
            ) : (
              <p style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.muted }}>closing reflection unlocks on day 75</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const hairKeys = HAIR_FULL.includes(dk)
    ? ["hairMassage", "hairDetangleDry", "hairShampoo", "hairMask", "hairCoolRinse", "hairDetangleWet", "hairLeaveIn", "hairDry"]
    : HAIR_BRUSH.includes(dk) ? ["hair"] : [];
  const morningKeys = ["freshen", "oralAM", "fajr", "adhkarAM", "quranDone", "movement", "shower", "skinAM", ...hairKeys];
  const morningDone = morningKeys.filter((k) => t[k]).length;
  const morningTotal = morningKeys.length;
  const focusDone = [t.study, t.jobaction].filter(Boolean).length;
  const middayDone = [t.dhuhr].filter(Boolean).length;
  const afternoonDone = [t.asr, t.tidy].filter(Boolean).length;
  const eveningDone = [t.maghrib].filter(Boolean).length;
  const nightDone = [t.isha, t.adhkarPM, t.skinPM, t.oralPM, t.stretch].filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 25% 0%, #232750 0%, ${C.ink} 55%)`, fontFamily: FONT_BODY, paddingBottom: 40 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "26px 18px 0" }}>

        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold }}>Cycle {String(cycleNum).padStart(2, "0")} · Day {dayInCycle} of 7</div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: C.parchment, fontSize: 26, marginTop: 2 }}>Sumaya's Day {currentDayNumber}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView("settings")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Settings size={18} color={C.muted} /></button>
            <button onClick={() => setView("map")} style={{ background: "none", border: "none", cursor: "pointer" }}><MoonGlyph frac={moon.frac} size={44} /></button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted }}>{today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
          {hijri && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted }}>· {hijri}</span>}
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.rose }}>· {moon.name}</span>
        </div>

        {/* DAY PREVIEW SWITCHER */}
        <div style={{ display: "flex", gap: 5, marginTop: 12 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <button key={d} onClick={() => setPreviewDk(d)}
              style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 9.5, background: d === dk ? "rgba(212,175,106,0.25)" : "rgba(255,255,255,0.05)", color: d === dk ? C.gold : C.muted }}>
              {d}
            </button>
          ))}
        </div>

        {/* NIYYAH */}
        <div style={{ marginTop: 20, background: C.parchment, borderRadius: 18, padding: 16 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.goldDeep, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Today's niyyah</div>
          <textarea value={dayData.niyyah} onChange={(e) => updateField("niyyah", e.target.value)} placeholder="One intention for today…" rows={2}
            style={{ width: "100%", border: "none", outline: "none", resize: "none", fontFamily: FONT_BODY, fontSize: 14.5, color: C.inkText, background: "transparent" }} />
        </div>

        {/* PRAYER TIMES REFERENCE */}
        <div style={{ marginTop: 14, background: C.indigo, borderRadius: 18, padding: "14px 16px" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <Clock3 size={13} color={C.gold} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>Edmonton · today's times (estimated)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {Object.entries(times).map(([k, v]) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.muted }}>{k}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.parchment, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.muted, marginTop: 8 }}>Calculated locally — cross-check against a local source when you set your start date.</div>
        </div>

        {/* MEDICATION & WATER */}
        <div style={{ marginTop: 14, background: C.parchment, borderRadius: 18, padding: 16 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <Pill size={13} color={C.goldDeep} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.goldDeep, textTransform: "uppercase", letterSpacing: "0.08em" }}>Medication & water</span>
          </div>
          <Toggle checked={t.metformin} onChange={(v) => updateTask("metformin", v)} label="Metformin" sub="taken with a meal, as prescribed" />
          <Toggle checked={t.psyllium} onChange={(v) => updateTask("psyllium", v)} label="Psyllium husk" sub="2–4 hrs apart from metformin + full glass of water" />
          <div className="px-3 py-2">
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.inkText, fontWeight: 600, marginBottom: 6 }}>Water</div>
            <div style={{ display: "flex", gap: 5 }}>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => updateTask("water", t.water === n ? n - 1 : n)} style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${C.sage}`, background: t.water >= n ? C.sage : "transparent", cursor: "pointer" }} />
              ))}
            </div>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9a8f6e", marginTop: 4, padding: "0 12px" }}>Fiber can reduce medication absorption if taken together — the gap matters more than exact timing.</div>
        </div>

        {/* WEEKLY CONTENT TARGETS */}
        <div style={{ marginTop: 14, background: C.parchment, borderRadius: 18, padding: 16 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <Camera size={13} color={C.rose} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.rose, textTransform: "uppercase", letterSpacing: "0.08em" }}>This week's content</span>
          </div>
          <Toggle checked={weekData?.instagramPosted} onChange={(v) => updateWeekField("instagramPosted", v)} label="Posted to Instagram" />
          <Toggle checked={weekData?.youtubePosted} onChange={(v) => updateWeekField("youtubePosted", v)} label="Posted to YouTube" />
          <Toggle checked={weekData?.ideasLogged} onChange={(v) => updateWeekField("ideasLogged", v)} label="Logged new ideas" />
          <div className="px-3 py-2" style={{ marginTop: 4, borderTop: "1px solid #e3d9c2", paddingTop: 10 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.rose, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Sunday reset</div>
            <input value={weekData?.resetWin || ""} onChange={(e) => updateWeekField("resetWin", e.target.value)} placeholder="One win from this week"
              style={{ width: "100%", border: "1px solid #ddd0ab", borderRadius: 8, padding: "7px 10px", fontFamily: FONT_BODY, fontSize: 13, color: C.inkText, marginBottom: 6, background: "#fff" }} />
            <input value={weekData?.resetAdjust || ""} onChange={(e) => updateWeekField("resetAdjust", e.target.value)} placeholder="One thing to adjust next week"
              style={{ width: "100%", border: "1px solid #ddd0ab", borderRadius: 8, padding: "7px 10px", fontFamily: FONT_BODY, fontSize: 13, color: C.inkText, background: "#fff" }} />
          </div>
        </div>

        {/* MORNING */}
        <div style={{ marginTop: 16 }}>
          <TimeBlock title="Morning" icon={Sparkles} accent={C.gold} timeLabel="wake → prayer → move → prepare" open={openBlock === "morning"} onToggle={() => setOpenBlock(openBlock === "morning" ? "" : "morning")} doneCount={morningDone} total={morningTotal} onMarkDone={() => updateTasks(morningKeys, true)}>
            <Toggle checked={t.freshen} onChange={(v) => updateTask("freshen", v)} label="Wake up + wash up" />
            <Toggle checked={t.oralAM} onChange={(v) => updateTask("oralAM", v)} label="Brush teeth" sub="+ tongue scrape" />
            <Toggle checked={t.fajr} onChange={(v) => updateTask("fajr", v)} label="Fajr" />
            <Toggle checked={t.adhkarAM} onChange={(v) => updateTask("adhkarAM", v)} label="Adhkar — morning" />

            <div className="px-3 py-2">
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.inkText, fontWeight: 600, marginBottom: 6 }}>Quran</div>
              <input value={dayData.quranText} onChange={(e) => updateField("quranText", e.target.value)} placeholder={DEEN_PROMPT[dk]}
                style={{ width: "100%", border: `1px solid #ddd0ab`, borderRadius: 8, padding: "8px 10px", fontFamily: FONT_BODY, fontSize: 13.5, color: C.inkText, marginBottom: 6, background: "#fff" }} />
              <textarea value={dayData.quranReflection} onChange={(e) => updateField("quranReflection", e.target.value)} placeholder="What stood out to you…" rows={2}
                style={{ width: "100%", border: `1px solid #ddd0ab`, borderRadius: 8, padding: "8px 10px", fontFamily: FONT_BODY, fontSize: 13.5, color: C.inkText, resize: "none", background: "#fff" }} />
              <div style={{ marginTop: 6 }}><Toggle checked={t.quranDone} onChange={(v) => updateTask("quranDone", v)} label="Marked as done" /></div>
            </div>

            <Toggle checked={t.movement} onChange={(v) => updateTask("movement", v)} label={movement.label} sub={movement.sub + (movement.label.includes("100") ? " · break into 10×10 / 5×20 / 2×50, whatever fits today" : "")} />
            <Toggle checked={t.shower} onChange={(v) => updateTask("shower", v)} label="Shower + body lotion" />
            {HAIR_FULL.includes(dk) && (
              <div className="px-3 py-2">
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.inkText, fontWeight: 600, marginBottom: 2 }}>Hair — full routine</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: "#9a8f6e", marginBottom: 6 }}>adapted for wavy, natural, breakage-prone hair</div>
                <Toggle checked={t.hairMassage} onChange={(v) => updateTask("hairMassage", v)} label="Oil + scalp massage" sub="2–3 min, focus hairline — supports circulation" />
                <Toggle checked={t.hairDetangleDry} onChange={(v) => updateTask("hairDetangleDry", v)} label="Detangle dry" sub="before water touches it — less breakage than detangling wet from scratch" />
                <Toggle checked={t.hairShampoo} onChange={(v) => updateTask("hairShampoo", v)} label="Gentle shampoo — scalp only" sub="let the runoff cleanse the lengths" />
                <Toggle checked={t.hairMask} onChange={(v) => updateTask("hairMask", v)} label="Conditioner / flaxseed mask" sub="mid-lengths to ends only, skip the roots" />
                <Toggle checked={t.hairCoolRinse} onChange={(v) => updateTask("hairCoolRinse", v)} label="Cool final rinse" sub="helps lay the cuticle flat, less frizz" />
                <Toggle checked={t.hairDetangleWet} onChange={(v) => updateTask("hairDetangleWet", v)} label="Detangle wet" sub="wide-tooth comb, ends to roots" />
                <Toggle checked={t.hairLeaveIn} onChange={(v) => updateTask("hairLeaveIn", v)} label="Leave-in on damp ends" />
                <Toggle checked={t.hairDry} onChange={(v) => updateTask("hairDry", v)} label="Microfiber towel / t-shirt dry" sub="terry towels roughen the cuticle — swap it out" />
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9a8f6e", marginTop: 6, padding: "0 12px" }}>Dusting trim every 8–10 weeks keeps split ends from traveling up the shaft. Silk/satin pillowcase or scarf at night protects the hairline from friction.</div>
              </div>
            )}
            {!HAIR_FULL.includes(dk) && HAIR_BRUSH.includes(dk) && (
              <Toggle checked={t.hair} onChange={(v) => updateTask("hair", v)} label="Hair care" sub="Brush, ends first" />
            )}
            <Toggle checked={t.skinAM} onChange={(v) => updateTask("skinAM", v)} label="Skincare — AM" sub="cleanse → serum → moisturize → SPF" />
          </TimeBlock>

          <TimeBlock title="Focus" icon={Briefcase} accent={C.goldDeep} timeLabel="breakfast → study → job search" open={openBlock === "focus"} onToggle={() => setOpenBlock(openBlock === "focus" ? "" : "focus")} doneCount={focusDone} total={2} onMarkDone={() => updateTasks(["study", "jobaction"], true)}>
            <div className="px-3 py-2" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <UtensilsCrossed size={14} color={C.sage} style={{ marginTop: 2, flexShrink: 0 }} />
              <div><div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.sage, textTransform: "uppercase" }}>Breakfast idea</div><div style={{ fontSize: 13, color: C.inkText, marginTop: 2 }}>{food.b}</div></div>
            </div>
            <Toggle checked={t.study} onChange={(v) => updateTask("study", v)} label={study.label} sub={study.sub} />
            <Toggle checked={t.jobaction} onChange={(v) => updateTask("jobaction", v)} label="1 job-search action" />
          </TimeBlock>

          <TimeBlock title="Midday" icon={Clock3} accent={C.rose} timeLabel="Dhuhr → lunch" open={openBlock === "midday"} onToggle={() => setOpenBlock(openBlock === "midday" ? "" : "midday")} doneCount={middayDone} total={1} onMarkDone={() => updateTasks(["dhuhr"], true)}>
            <Toggle checked={t.dhuhr} onChange={(v) => updateTask("dhuhr", v)} label="Dhuhr" />
            <div className="px-3 py-2" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <UtensilsCrossed size={14} color={C.sage} style={{ marginTop: 2, flexShrink: 0 }} />
              <div><div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.sage, textTransform: "uppercase" }}>Lunch idea</div><div style={{ fontSize: 13, color: C.inkText, marginTop: 2 }}>{food.l}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9a8f6e", marginTop: 4 }}>½ plate veggies · ¼ protein · ¼ whole grain — veggies + protein first</div>
              </div>
            </div>
          </TimeBlock>

          <TimeBlock title="Afternoon" icon={Camera} accent={C.rose} timeLabel="Asr → tidy" open={openBlock === "afternoon"} onToggle={() => setOpenBlock(openBlock === "afternoon" ? "" : "afternoon")} doneCount={afternoonDone} total={2} onMarkDone={() => updateTasks(["asr", "tidy"], true)}>
            <Toggle checked={t.asr} onChange={(v) => updateTask("asr", v)} label="Asr" />
            <Toggle checked={t.tidy} onChange={(v) => updateTask("tidy", v)} label="Tidy space · 5–10 min" />
          </TimeBlock>

          <TimeBlock title="Evening" icon={HeartPulse} accent={C.sage} timeLabel="Maghrib → dinner" open={openBlock === "evening"} onToggle={() => setOpenBlock(openBlock === "evening" ? "" : "evening")} doneCount={eveningDone} total={1} onMarkDone={() => updateTasks(["maghrib"], true)}>
            <Toggle checked={t.maghrib} onChange={(v) => updateTask("maghrib", v)} label="Maghrib" />
            <div className="px-3 py-2" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <UtensilsCrossed size={14} color={C.sage} style={{ marginTop: 2, flexShrink: 0 }} />
              <div><div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.sage, textTransform: "uppercase" }}>Dinner idea</div><div style={{ fontSize: 13, color: C.inkText, marginTop: 2 }}>{food.d}</div></div>
            </div>
          </TimeBlock>

          <TimeBlock title="Night" icon={Moon} accent={C.gold} timeLabel="Isha → wind down → sleep" open={openBlock === "night"} onToggle={() => setOpenBlock(openBlock === "night" ? "" : "night")} doneCount={nightDone} total={5} onMarkDone={() => updateTasks(["isha", "adhkarPM", "skinPM", "oralPM", "stretch"], true)}>
            <Toggle checked={t.isha} onChange={(v) => updateTask("isha", v)} label="Isha" />
            <Toggle checked={t.adhkarPM} onChange={(v) => updateTask("adhkarPM", v)} label="Adhkar — evening" />
            <Toggle checked={t.skinPM} onChange={(v) => updateTask("skinPM", v)} label="Skincare — PM" sub="cleanse → treat → moisturize" />
            <Toggle checked={t.oralPM} onChange={(v) => updateTask("oralPM", v)} label="Oral care — PM" sub="brush + floss + rinse" />
            <Toggle checked={t.stretch} onChange={(v) => updateTask("stretch", v)} label="Stretch before bed" />
          </TimeBlock>
        </div>

        {/* JOURNAL */}
        <div style={{ marginTop: 4, background: C.parchment, borderRadius: 18, padding: 16 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <PenLine size={13} color={C.goldDeep} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.goldDeep, textTransform: "uppercase", letterSpacing: "0.08em" }}>How today felt</span>
          </div>
          <textarea value={dayData.note} onChange={(e) => updateField("note", e.target.value)} placeholder="A win, a struggle, a thought worth keeping…" rows={3}
            style={{ width: "100%", border: "none", outline: "none", resize: "none", fontFamily: FONT_BODY, fontSize: 14, color: C.inkText, background: "transparent" }} />
        </div>

        <p style={{ textAlign: "center", fontFamily: FONT_MONO, fontSize: 10.5, color: C.muted, marginTop: 26 }}>
          {currentDayNumber < 75 ? `${75 - currentDayNumber} days left in this cycle` : "You've reached day 75 — look back through your cycle map"}
        </p>
      </div>
    </div>
  );
}
