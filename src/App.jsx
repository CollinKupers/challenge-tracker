import React, { useState, useEffect, useCallback } from "react";

const CHALLENGE_DAYS = 75;
const WATER_GOAL = 128;

const PLAYERS = [
  { key: "david", label: "David" },
  { key: "collin", label: "Collin" },
];

const RULES = [
  {
    id: "workout", label: "Workout", sub: "45 min", icon: "🏋️",
    description: "Complete a minimum 45-minute workout every single day. No exceptions.",
    detail: "Strength training, cardio, sports, hiking, HIIT — anything intentional that gets your body moving for at least 45 minutes. A walk to the mailbox doesn't count.",
  },
  {
    id: "read", label: "Read", sub: "10 pages", icon: "📖",
    description: "Read at least 10 pages of a non-fiction book every day.",
    detail: "Audiobooks don't count. Podcasts don't count. Sit down with a physical or digital book. Non-fiction only: self-improvement, biography, history, science, business, health.",
  },
  {
    id: "recovery", label: "Recovery", sub: "15 min", icon: "🧘",
    description: "Dedicate 15 minutes to active recovery every day.",
    detail: "Stretching, yoga, foam rolling, meditation, breathing work, hot tub — or any combination. Intentional rest and repair. Your body needs maintenance as much as it needs work.",
  },
  {
    id: "diet", label: "Diet", sub: "100% clean", icon: "🥗",
    description: "Follow your chosen diet with zero deviation. 100% adherence, every day.",
    detail: "Pick your diet before you start and stick to it completely. No cheat meals. No 'just this once.' The discipline is the point.",
  },
  {
    id: "noAlcohol", label: "No Alcohol", sub: "zero", icon: "🚫",
    description: "No alcohol. Zero. None. Not even a sip.",
    detail: "No beer, wine, liquor, or anything containing alcohol for 75 days. Social pressure is part of the challenge. Your response to that pressure tells you something important about yourself.",
  },
];

const PLACEHOLDERS = {
  workout:   "e.g. 5 mile run, chest day, 45 min HIIT...",
  read:      "e.g. 10 pages Atomic Habits, Ch. 3 of...",
  recovery:  "e.g. yoga, hot tub, ice bath, foam roll...",
  diet:      "e.g. meal prepped, stayed clean...",
  noAlcohol: "e.g. turned down a beer at dinner...",
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultDay = () => ({
  workout: false, read: false, recovery: false, diet: false, noAlcohol: false,
  water: 0, completed: false, timestamp: null,
  workoutNote: "", readNote: "", recoveryNote: "", dietNote: "", noAlcoholNote: "",
});

async function loadData(key) {
  try {
    const res = await fetch(`/api/store?key=${encodeURIComponent(key)}`);
    if (res.ok) { const j = await res.json(); return j.value ? JSON.parse(j.value) : null; }
  } catch {}
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}

async function saveData(key, value) {
  const str = JSON.stringify(value);
  try {
    await fetch("/api/store", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: str }),
    });
  } catch {}
  try { localStorage.setItem(key, str); } catch {}
}

export default function App() {
  const [view, setView]                 = useState("dashboard");
  const [data, setData]                 = useState({ david: {}, collin: {} });
  const [streak, setStreak]             = useState(0);
  const [startDate, setStartDate]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [lastSync, setLastSync]         = useState(null);
  const [noteModal, setNoteModal]       = useState(null);
  const [noteDraft, setNoteDraft]       = useState("");
  const [expandedRule, setExpandedRule] = useState(null);
  const savingRef = React.useRef(false);
  const dataRef   = React.useRef({ david: {}, collin: {} });

  const loadAll = useCallback(async () => {
    if (savingRef.current) return;
    const [davidData, collinData, streakData, startData] = await Promise.all([
      loadData("challenge:david"),
      loadData("challenge:collin"),
      loadData("challenge:streak"),
      loadData("challenge:startDate"),
    ]);
    const t  = todayKey();
    const md = davidData  || {};
    const mc = collinData || {};
    const ld = dataRef.current.david;
    const lc = dataRef.current.collin;
    if (ld[t] && md[t]) md[t].water = Math.max(md[t].water || 0, ld[t].water || 0);
    if (lc[t] && mc[t]) mc[t].water = Math.max(mc[t].water || 0, lc[t].water || 0);
    const merged = { david: md, collin: mc };
    dataRef.current = merged;
    setData(merged);
    setStreak(streakData || 0);
    const sd = startData || t;
    setStartDate(sd);
    if (!startData) await saveData("challenge:startDate", sd);
    setLastSync(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 8000);
    return () => clearInterval(id);
  }, [loadAll]);

  const getDay = (player) => dataRef.current[player]?.[todayKey()] || defaultDay();

  const updateDay = async (player, updates) => {
    savingRef.current = true;
    const t       = todayKey();
    const current = dataRef.current[player]?.[t] || defaultDay();
    const updated = { ...current, ...updates };
    if (current.water >= WATER_GOAL && updated.water < WATER_GOAL) updated.water = WATER_GOAL;
    const allDone = updated.workout && updated.read && updated.recovery &&
                    updated.diet && updated.noAlcohol && updated.water >= WATER_GOAL;
    updated.completed = allDone;
    if (allDone && !current.completed) updated.timestamp = new Date().toISOString();
    const newPD   = { ...(dataRef.current[player] || {}), [t]: updated };
    const newData = { ...dataRef.current, [player]: newPD };
    dataRef.current = newData;
    setData({ ...newData });
    await saveData(`challenge:${player}`, newPD);
    savingRef.current = false;
    await recalcStreak(newData);
  };

  const recalcStreak = async (d) => {
    let s = 0;
    const cur = new Date(startDate || todayKey());
    const now = new Date(todayKey());
    while (cur <= now) {
      const k = cur.toISOString().slice(0, 10);
      if (d.david?.[k]?.completed && d.collin?.[k]?.completed) s++;
      else if (k < todayKey()) s = 0;
      cur.setDate(cur.getDate() + 1);
    }
    setStreak(s);
    await saveData("challenge:streak", s);
  };

  const toggleRule = (player, rule) => updateDay(player, { [rule]: !getDay(player)[rule] });
  const addWater   = (player, amt)  => updateDay(player, { water: Math.min(getDay(player).water + amt, WATER_GOAL + 32) });

  const openNote = (player, ruleId) => {
    setNoteModal({ player, field: `${ruleId}Note`, ruleId });
    setNoteDraft(getDay(player)[`${ruleId}Note`] || "");
  };
  const saveNote = async () => {
    if (!noteModal) return;
    await updateDay(noteModal.player, { [noteModal.field]: noteDraft });
    setNoteModal(null); setNoteDraft("");
  };

  const waterPct  = (oz) => Math.min((oz / WATER_GOAL) * 100, 100);
  const dayNumber = () => !startDate ? 1 : Math.min(Math.floor((new Date(todayKey()) - new Date(startDate)) / 86400000) + 1, CHALLENGE_DAYS);
  const pct       = () => ((dayNumber() - 1) / CHALLENGE_DAYS) * 100;
  const doneCount = (player) => {
    const d = getDay(player);
    return [d.workout, d.read, d.recovery, d.diet, d.noAlcohol, d.water >= WATER_GOAL].filter(Boolean).length;
  };

  if (loading) return (
    <div style={s.loading}>
      <div style={s.pulse} />
      <p style={{ color: "#64748b", marginTop: 14, fontSize: 11, letterSpacing: "0.15em", fontFamily: "monospace" }}>SYNCING</p>
    </div>
  );

  const nm     = noteModal;
  const rLabel = nm ? (RULES.find(r => r.id === nm.ruleId)?.label || "") : "";
  const rIcon  = nm ? (RULES.find(r => r.id === nm.ruleId)?.icon  || "") : "";
  const pLabel = nm ? (nm.player === "david" ? "David" : "Collin") : "";

  return (
    <div style={s.root}>
      <div style={s.bg} />
      <header style={s.header}>
        <div style={s.hRow}>
          <div>
            <div style={s.dayLabel}>DAY {dayNumber()} · {CHALLENGE_DAYS}</div>
            <h1 style={s.title}>THE CHALLENGE</h1>
          </div>
          <div style={s.streakPill}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={s.streakNum}>{streak}</span>
            <span style={s.streakSub}>days</span>
          </div>
        </div>
        <div style={s.barTrack}><div style={{ ...s.barFill, width: `${pct()}%` }} /></div>
        <div style={s.barLabel}>{Math.round(pct())}% · {CHALLENGE_DAYS - dayNumber() + 1} days left</div>
      </header>
      <nav style={s.nav}>
        {[["dashboard","TODAY"],["history","HISTORY"],["rules","RULES"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ ...s.navBtn, ...(view === v ? s.navOn : {}) }}>{label}</button>
        ))}
      </nav>
      {view === "dashboard" && (
        <div style={s.grid}>
          {PLAYERS.map(({ key, label }) => {
            const day  = getDay(key);
            const done = doneCount(key);
            return (
              <div key={key} style={{ ...s.col, ...(day.completed ? s.colDone : {}) }}>
                <div style={s.colHead}>
                  <span style={s.colName}>{label}</span>
                  <span style={{ ...s.colScore, ...(done === 6 ? s.colScoreDone : {}) }}>{done}/6</span>
                </div>
                {day.completed && <div style={s.doneBanner}>✓ DONE</div>}
                {RULES.map(rule => {
                  const nf = `${rule.id}Note`;
                  const hn = !!day[nf];
                  return (
                    <div key={rule.id} style={s.ruleBlock}>
                      <button onClick={() => toggleRule(key, rule.id)}
                        style={{ ...s.ruleBtn, ...(day[rule.id] ? s.ruleDone : {}) }}>
                        <span style={s.rIcon}>{rule.icon}</span>
                        <span style={s.rInner}>
                          <span style={s.rName}>{rule.label}</span>
                          <span style={s.rSub}>{rule.sub}</span>
                        </span>
                        <span style={{ ...s.check, ...(day[rule.id] ? s.checkDone : {}) }}>
                          {day[rule.id] ? "✓" : "○"}
                        </span>
                      </button>
                      <button onClick={() => openNote(key, rule.id)}
                        style={{ ...s.noteBtn, ...(hn ? s.noteFilled : {}) }}>
                        {hn ? <span style={s.notePreview}>{day[nf]}</span>
                            : <span style={s.notePh}>+ note</span>}
                      </button>
                    </div>
                  );
                })}
                <div style={{ ...s.water, ...(day.water >= WATER_GOAL ? s.waterDone : {}) }}>
                  <div style={s.wTop}>
                    <span style={s.rIcon}>💧</span>
                    <span style={s.rName}>Water</span>
                    {day.water >= WATER_GOAL
                      ? <span style={s.wComplete}>✓ GOAL</span>
                      : <span style={s.wOz}>{day.water}<span style={s.wGoal}>/{WATER_GOAL}</span></span>}
                  </div>
                  <div style={s.wBar}>
                    <div style={{
                      ...s.wFill, width: `${waterPct(day.water)}%`,
                      background: day.water >= WATER_GOAL ? "linear-gradient(90deg,#22d3ee,#22c55e)"
                        : day.water >= 64 ? "linear-gradient(90deg,#0ea5e9,#38bdf8)"
                        : "linear-gradient(90deg,#1d4ed8,#3b82f6)",
                    }} />
                    <div style={s.wMid} />
                  </div>
                  {day.water < WATER_GOAL ? (
                    <div style={s.wBtns}>
                      {[8,16,32].map(a => <button key={a} onClick={() => addWater(key, a)} style={s.wBtn}>+{a}</button>)}
                      <button onClick={() => updateDay(key, { water: Math.max(0, day.water - 8) })} style={s.wMinus}>-8</button>
                    </div>
                  ) : (
                    <div style={s.wLocked}>gallon complete 💪</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {view === "history" && <HistoryView data={data} startDate={startDate} />}
      {view === "rules"   && <RulesView expandedRule={expandedRule} setExpandedRule={setExpandedRule} />}
      <div style={s.syncBar}>
        <span style={s.syncDot} />
        <span style={s.syncTxt}>live · {lastSync?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
      </div>
      {nm && (
        <div style={s.overlay} onClick={() => setNoteModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>{rIcon} {rLabel}<span style={s.modalSub}> · {pLabel}</span></div>
            <textarea style={s.textarea} value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
              placeholder={PLACEHOLDERS[nm.ruleId] || "Add a note..."} rows={4} autoFocus />
            <div style={s.modalBtns}>
              <button onClick={() => setNoteModal(null)} style={s.cancelBtn}>Cancel</button>
              <button onClick={saveNote} style={s.saveBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryView({ data, startDate }) {
  if (!startDate) return null;
  const days = [];
  const cur = new Date(startDate), now = new Date(todayKey());
  while (cur <= now) { days.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1); }
  days.reverse();
  return (
    <div style={s.hist}>
      <div style={s.histHead}>
        <span style={{ ...s.hCell, flex: 0.5 }}>Day</span>
        <span style={{ ...s.hCell, flex: 0.8 }}>Date</span>
        <span style={{ ...s.hCell, flex: 1, textAlign: "center" }}>David</span>
        <span style={{ ...s.hCell, flex: 1, textAlign: "center" }}>Collin</span>
      </div>
      {days.map(d => {
        const dv = data.david?.[d], co = data.collin?.[d];
        const n  = Math.floor((new Date(d) - new Date(startDate)) / 86400000) + 1;
        return (
          <div key={d} style={s.histRow}>
            <span style={{ ...s.hCell, flex: 0.5, color: "#94a3b8" }}>{n}</span>
            <span style={{ ...s.hCell, flex: 0.8, color: "#64748b" }}>{new Date(d+"T12:00:00").toLocaleDateString([],{month:"short",day:"numeric"})}</span>
            <span style={{ ...s.hBadge, flex: 1, background: dv?.completed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.08)", color: dv?.completed ? "#22c55e" : "#ef4444" }}>{dv?.completed ? "✓" : "✗"}</span>
            <span style={{ ...s.hBadge, flex: 1, background: co?.completed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.08)", color: co?.completed ? "#22c55e" : "#ef4444" }}>{co?.completed ? "✓" : "✗"}</span>
          </div>
        );
      })}
    </div>
  );
}

function RulesView({ expandedRule, setExpandedRule }) {
  const cards = [...RULES, {
    id: "water", label: "Water", sub: "1 gallon / 128 oz", icon: "💧",
    description: "Drink one full gallon of water every day — 128 oz / ~3.8 liters.",
    detail: "Plain water only. Coffee and tea don't count. Use the tracker on the Today tab. The midpoint marker is your checkpoint — if you're not at 64 oz by dinner, you're behind.",
  }];
  return (
    <div style={s.rulesView}>
      <div style={{ padding: "16px 0 12px" }}>
        <p style={s.rulesIntro}>75 days. 6 rules. No exceptions. Miss one rule on any day and the streak resets — both of you. That's the deal.</p>
      </div>
      {cards.map((rule, i) => {
        const open = expandedRule === rule.id;
        return (
          <div key={rule.id} style={{ ...s.rCard, ...(open ? s.rCardOpen : {}) }}>
            <button onClick={() => setExpandedRule(open ? null : rule.id)} style={s.rCardBtn}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, color: "#334155", fontWeight: 700, minWidth: 20 }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontSize: 18 }}>{rule.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{rule.label}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{rule.sub}</div>
                </div>
              </div>
              <span style={{ fontSize: 14, color: "#475569", transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </button>
            {open && (
              <div style={s.rCardBody}>
                <p style={{ margin: "14px 0 8px", fontSize: 12, color: "#94a3b8", lineHeight: 1.7, fontWeight: 600 }}>{rule.description}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.8 }}>{rule.detail}</p>
              </div>
            )}
          </div>
        );
      })}
      <div style={s.rFooter}>
        <p style={{ margin: 0, fontSize: 11, color: "#78716c", lineHeight: 1.7, fontStyle: "italic", textAlign: "center" }}>
          The rules aren't the hard part. Showing up when you don't feel like it is. The rules just make it official.
        </p>
      </div>
    </div>
  );
}

const s = {
  root:        { minHeight: "100vh", background: "#080d1a", color: "#e2e8f0", fontFamily: "'DM Mono','Courier New',monospace", position: "relative", paddingBottom: 52, overflowX: "hidden", paddingTop: "env(safe-area-inset-top, 20px)" },
  bg:          { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "radial-gradient(ellipse at 15% 40%, rgba(14,165,233,0.06) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(99,102,241,0.06) 0%, transparent 50%)" },
  loading:     { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080d1a" },
  pulse:       { width: 10, height: 10, borderRadius: "50%", background: "#0ea5e9" },
  header:      { position: "relative", zIndex: 1, padding: "24px 14px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  hRow:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  dayLabel:    { fontSize: 9, letterSpacing: "0.25em", color: "#0ea5e9", fontWeight: 700, marginBottom: 3 },
  title:       { margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "0.06em", color: "#f1f5f9" },
  streakPill:  { display: "flex", alignItems: "center", gap: 4, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 10, padding: "8px 12px" },
  streakNum:   { fontSize: 22, fontWeight: 800, color: "#f97316", lineHeight: 1 },
  streakSub:   { fontSize: 9, color: "#94a3b8", letterSpacing: "0.1em" },
  barTrack:    { height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: 5 },
  barFill:     { height: "100%", background: "linear-gradient(90deg,#0ea5e9,#6366f1)", borderRadius: 3, transition: "width 0.6s ease" },
  barLabel:    { fontSize: 9, color: "#475569", letterSpacing: "0.1em", textAlign: "right" },
  nav:         { position: "relative", zIndex: 1, display: "flex", padding: "10px 14px", gap: 6 },
  navBtn:      { flex: 1, padding: "7px 0", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, background: "transparent", color: "#475569", fontSize: 9, letterSpacing: "0.15em", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  navOn:       { background: "rgba(14,165,233,0.12)", borderColor: "rgba(14,165,233,0.4)", color: "#38bdf8" },
  grid:        { position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 8px" },
  col:         { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 8px", transition: "border-color 0.3s" },
  colDone:     { borderColor: "rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.04)" },
  colHead:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  colName:     { fontSize: 14, fontWeight: 800, color: "#f1f5f9", letterSpacing: "0.04em" },
  colScore:    { fontSize: 11, color: "#64748b" },
  colScoreDone:{ color: "#22c55e" },
  doneBanner:  { textAlign: "center", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "#22c55e", background: "rgba(34,197,94,0.1)", borderRadius: 5, padding: "5px 0", marginBottom: 8 },
  ruleBlock:   { marginBottom: 5 },
  ruleBtn:     { display: "flex", alignItems: "center", width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 6px", cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Mono',monospace" },
  ruleDone:    { background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)" },
  rIcon:       { fontSize: 13, marginRight: 5, minWidth: 18 },
  rInner:      { flex: 1, display: "flex", flexDirection: "column", textAlign: "left" },
  rName:       { fontSize: 10, color: "#cbd5e1", fontWeight: 600, letterSpacing: "0.04em" },
  rSub:        { fontSize: 9, color: "#475569", marginTop: 1 },
  check:       { fontSize: 12, color: "#334155", minWidth: 14, textAlign: "right" },
  checkDone:   { color: "#22c55e" },
  noteBtn:     { width: "100%", textAlign: "left", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "0 0 8px 8px", borderTop: "none", padding: "4px 8px", cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  noteFilled:  { background: "rgba(14,165,233,0.05)", borderColor: "rgba(14,165,233,0.2)", borderStyle: "solid" },
  notePreview: { fontSize: 9, color: "#94a3b8", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  notePh:      { fontSize: 9, color: "#2d3f55" },
  water:       { background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.12)", borderRadius: 8, padding: "8px 6px", marginTop: 4 },
  waterDone:   { background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)" },
  wTop:        { display: "flex", alignItems: "center", marginBottom: 6 },
  wComplete:   { marginLeft: "auto", fontSize: 10, color: "#22c55e", fontWeight: 800, letterSpacing: "0.1em" },
  wOz:         { marginLeft: "auto", fontSize: 11, color: "#38bdf8", fontWeight: 700 },
  wGoal:       { fontSize: 9, color: "#475569" },
  wBar:        { height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 7, position: "relative" },
  wFill:       { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  wMid:        { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.15)" },
  wBtns:       { display: "flex", gap: 4 },
  wBtn:        { flex: 1, padding: "5px 0", borderRadius: 6, background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", color: "#38bdf8", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  wMinus:      { padding: "5px 6px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  wLocked:     { fontSize: 9, color: "#22c55e", textAlign: "center", paddingTop: 4, letterSpacing: "0.05em" },
  hist:        { position: "relative", zIndex: 1, padding: "0 14px" },
  histHead:    { display: "flex", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 },
  histRow:     { display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  hCell:       { fontSize: 10, letterSpacing: "0.05em" },
  hBadge:      { fontSize: 12, fontWeight: 700, textAlign: "center", padding: "3px 0", borderRadius: 6 },
  syncBar:     { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", background: "rgba(8,13,26,0.97)", borderTop: "1px solid rgba(255,255,255,0.05)" },
  syncDot:     { width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" },
  syncTxt:     { fontSize: 9, color: "#334155", letterSpacing: "0.12em" },
  overlay:     { position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" },
  modal:       { width: "100%", maxWidth: 380, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px" },
  modalTitle:  { fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 14, letterSpacing: "0.04em" },
  modalSub:    { color: "#64748b", fontWeight: 400 },
  textarea:    { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, padding: "10px 12px", fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 },
  modalBtns:   { display: "flex", gap: 8, marginTop: 12 },
  cancelBtn:   { flex: 1, padding: "9px 0", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  saveBtn:     { flex: 2, padding: "9px 0", borderRadius: 8, background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.4)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  rulesView:   { position: "relative", zIndex: 1, padding: "0 14px 20px" },
  rulesIntro:  { margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.7, borderLeft: "2px solid rgba(14,165,233,0.4)", paddingLeft: 12 },
  rCard:       { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 8, overflow: "hidden", transition: "border-color 0.2s" },
  rCardOpen:   { borderColor: "rgba(14,165,233,0.3)" },
  rCardBtn:    { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  rCardBody:   { padding: "0 14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" },
  rFooter:     { marginTop: 20, padding: "16px", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 12 },
};
