import React, { useState, useEffect, useCallback } from "react";

const CHALLENGE_DAYS = 75;
const WATER_GOAL = 128;
const CAL_GOAL   = 2500;
const PROT_GOAL  = 175;

const RULES = [
  { id: "workout",   label: "Workout",    sub: "45 min",      icon: "🏋️",
    description: "Complete a minimum 45-minute workout every single day. No exceptions.",
    detail: "Strength training, cardio, sports, hiking, HIIT — anything intentional that gets your body moving for at least 45 minutes. A walk to the mailbox doesn't count." },
  { id: "read",      label: "Read",       sub: "10 pages",    icon: "📖",
    description: "Read at least 10 pages of a non-fiction book every day.",
    detail: "Audiobooks don't count. Podcasts don't count. Sit down with a physical or digital book. Non-fiction only: self-improvement, biography, history, science, business, health." },
  { id: "recovery",  label: "Recovery",   sub: "15 min",      icon: "🧘",
    description: "Dedicate 15 minutes to active recovery every day.",
    detail: "Stretching, yoga, foam rolling, meditation, breathing work, hot tub — or any combination. Intentional rest and repair. Your body needs maintenance as much as it needs work." },
  { id: "diet",      label: "Diet",       sub: "100% clean",  icon: "🥗",
    description: "Follow your chosen diet with zero deviation. 100% adherence, every day.",
    detail: "Pick your diet before you start and stick to it completely. No cheat meals. No 'just this once.' The discipline is the point." },
  { id: "noAlcohol", label: "No Alcohol", sub: "zero",        icon: "🚫",
    description: "No alcohol. Zero. None. Not even a sip.",
    detail: "No beer, wine, liquor, or anything containing alcohol for 75 days. Social pressure is part of the challenge. Your response to that pressure tells you something important about yourself." },
];

const PLACEHOLDERS = {
  workout:   "e.g. 5 mile run, chest day, 45 min HIIT...",
  read:      "e.g. 10 pages Atomic Habits, Ch. 3 of...",
  recovery:  "e.g. yoga, hot tub, ice bath, foam roll...",
  diet:      "e.g. meal prepped, stayed clean...",
  noAlcohol: "e.g. turned down a beer at dinner...",
};

const QUOTES = [
  "The hardest part is starting. David never found out.",
  "Collin showed up. David did not.",
  "Some people talk about it. Collin is about it.",
  "Every day you grind, David wonders what he was capable of.",
  "David had the same 24 hours. He just used them differently.",
  "It takes courage to start alone. David didn't have it. You did.",
  "Showing up solo is the hardest flex of all.",
  "David will always wonder. Collin will always know.",
  "The gap between who you are and who you could be is called discipline. Collin is closing it.",
  "You don't need a partner. You just needed a reason. You have 75 of them.",
  "75 days. One person who actually showed up.",
  "David chose comfort on Day 1. You chose discipline every day since.",
  "Hard things done alone hit different.",
  "David is watching. Keep going.",
  "David said maybe. You said yes.",
  "Some people spectate. Some people compete. David chose the couch.",
  "The version of you that finishes this is someone David never became.",
  "David saw the same challenge and blinked first.",
  "Not everyone has what it takes to start. David proved that.",
  "Every rep you do is one David never will.",
  "Day by day. That's all it takes.",
  "Discipline is freedom in disguise.",
  "You are building something David will never have.",
  "The man you are becoming started on Day 1.",
  "75 days of choosing yourself.",
  "This discomfort is temporary. The results are not.",
  "You already did the hardest thing — you started.",
  "Another day. Another proof.",
  "The person you were before this challenge is fading. Good.",
  "Keep the streak. Change the story.",
  "Each day you finish makes the next one easier to start.",
  "Consistency compounds. Show up anyway.",
  "You don't have to feel ready. You just have to start.",
  "Strong bodies are built in the minutes you don't want to be there.",
  "We are what we repeatedly do. Excellence is not an act, but a habit.",
  "The secret of getting ahead is getting started.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "The pain of discipline weighs ounces. The pain of regret weighs tons.",
  "Don't wish it were easier. Wish you were better.",
  "Push yourself because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "It's going to be hard, but hard is not impossible.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "You don't have to be great to start, but you have to start to be great.",
  "Your only limit is your mind.",
  "Be stronger than your excuses.",
  "You've survived 100% of your hardest days.",
  "One day or day one. You decide.",
  "Make yourself proud.",
  "No shortcuts. No excuses. No regrets.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The best project you'll ever work on is you.",
  "Strive for progress, not perfection.",
  "Fall in love with the process and the results will come.",
  "You are one workout away from a good mood.",
  "The difference between who you are and who you want to be is what you do.",
  "Strength does not come from the body. It comes from the will.",
  "On Day 75, everything changes. Keep going.",
  "David never started. You never stopped.",
  "Comfort is the enemy of progress. David lives there. You don't.",
  "You are proving something every single day. David is not.",
  "75 days from now you'll wish you had started today. You did.",
  "Iron sharpens iron. Collin sharpens himself.",
  "Motivation gets you started. Discipline keeps you going.",
  "The body achieves what the mind believes.",
  "Success is not owned. It is rented. And rent is due every day.",
  "David opted out. You opted in. Remember that on the hard days.",
  "There is no traffic on the extra mile.",
  "Earn it.",
  "David watched from the sideline. You're the one on the field.",
  "What you do today is what matters.",
];

const SHAME_COLLIN = {
  title: "COLLIN BROKE IT 🍺",
  body: "Really? A drink? You're doing this solo — no one else to blame, no one else to drag down. Just you and 75 days and you couldn't say no. Start over. No excuses.",
  confirm: "Yeah, I drank. I'm a loser.",
  cancel:  "Wait — I didn't drink!",
};

// Always use Pacific time so midnight rollover is correct regardless of where you are
const pacificDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
const todayKey = pacificDate;

const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(d);
};

// One fixed quote per calendar day — changes at Pacific midnight
const dailyQuote = () => {
  const parts = pacificDate().split("-").map(Number);
  const start = new Date(parts[0], 0, 1);
  const today = new Date(parts[0], parts[1]-1, parts[2]);
  const dayOfYear = Math.floor((today - start) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
};

// Compute which rules were missed for a given day's data
const getMissedRules = (d) => {
  if (!d) return ["Everything — the app wasn't even opened"];
  const m = [];
  if (!d.workout)  m.push("🏋️  Workout — didn't do it");
  if (!d.read)     m.push("📖  Read — skipped");
  if (!d.recovery) m.push("🧘  Recovery — skipped");
  if (!d.diet) {
    if (d.calories > CAL_GOAL)           m.push(`🥗  Diet — went over at ${d.calories} cal`);
    else if ((d.protein || 0) < PROT_GOAL) m.push(`🥗  Diet — only ${d.protein || 0}g protein`);
    else                                   m.push("🥗  Diet — not tracked");
  }
  if (d.noAlcohol === false) m.push("🚫  No Alcohol — you drank");
  if ((d.water || 0) < WATER_GOAL) m.push(`💧  Water — only ${d.water || 0} of ${WATER_GOAL} oz`);
  return m;
};

const defaultDay = () => ({
  workout: false, read: false, recovery: false, diet: false, noAlcohol: true,
  water: 0, calories: 0, protein: 0, completed: false, timestamp: null,
  workoutNote: "", readNote: "", recoveryNote: "", dietNote: "", noAlcoholNote: "",
});

function loadData(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}

function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function App() {
  const [view, setView]                 = useState("dashboard");
  const [data, setData]                 = useState({ david: {}, collin: {} });
  const [streak, setStreak]             = useState(0);
  const [startDate, setStartDate]       = useState(null);
  const [started, setStarted]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const [lastSync, setLastSync]         = useState(null);
  const [noteModal, setNoteModal]       = useState(null);
  const [noteDraft, setNoteDraft]       = useState("");
  const [expandedRule, setExpandedRule] = useState(null);
  const [shameModal, setShameModal]     = useState(false);
  const [dayShame,  setDayShame]        = useState(null); // { date, missed[] }
  const [calInput,  setCalInput]        = useState("");
  const [protInput, setProtInput]       = useState("");
  const savingRef   = React.useRef(false);
  const dataRef     = React.useRef({ david: {}, collin: {} });
  const shamedRef   = React.useRef(null); // tracks which date we already shamed for this session

  const loadAll = useCallback(() => {
    if (savingRef.current) return;
    const collinData  = loadData("challenge:collin");
    const startData   = loadData("challenge:startDate");
    const startedData = loadData("challenge:started");
    const t  = todayKey();
    const mc = collinData || {};
    const lc = dataRef.current.collin;
    if (lc[t] && mc[t]) mc[t].water = Math.max(mc[t].water || 0, lc[t].water || 0);
    const merged = { david: {}, collin: mc };
    dataRef.current = merged;
    setData(merged);

    // Determine start date — reset if any past day was missed, shame if so
    let sd  = startData || t;
    let st  = startedData ?? false;
    if (startData && startData < t) {
      const cur = new Date(sd);
      const yest = yesterdayKey();
      const yesterday = new Date(yest);
      while (cur <= yesterday) {
        const k = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(cur);
        if (!mc[k]?.completed) {
          if (shamedRef.current !== k) {
            shamedRef.current = k;
            setDayShame({ date: k, missed: getMissedRules(mc[k]) });
          }
          sd = t;
          st = false;
          saveData("challenge:startDate", t);
          saveData("challenge:streak", 0);
          saveData("challenge:started", false);
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    setStarted(st);
    setStartDate(sd);
    if (!startData) saveData("challenge:startDate", sd);

    let s = 0;
    const c = new Date(sd), now = new Date(t);
    while (c <= now) {
      const k = `${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,'0')}-${String(c.getDate()).padStart(2,'0')}`;
      if (mc[k]?.completed) s++;
      c.setDate(c.getDate() + 1);
    }
    setStreak(s);
    saveData("challenge:streak", s);
    setLastSync(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    // Reload when user comes back to the app (tab focus or phone unlock)
    window.addEventListener("focus", loadAll);
    return () => window.removeEventListener("focus", loadAll);
  }, [loadAll]);

  const getDay = () => dataRef.current.collin?.[todayKey()] || defaultDay();

  const updateDay = (updates) => {
    savingRef.current = true;
    const t       = todayKey();
    const current = dataRef.current.collin?.[t] || defaultDay();
    const updated = { ...current, ...updates };
    if (current.water >= WATER_GOAL && updated.water < WATER_GOAL) updated.water = WATER_GOAL;
    const calOk  = updated.calories > 0 && updated.calories <= CAL_GOAL;
    const protOk = updated.protein >= PROT_GOAL;
    updated.diet = calOk && protOk;
    const allDone = updated.workout && updated.read && updated.recovery &&
                    updated.diet && updated.noAlcohol && updated.water >= WATER_GOAL;
    updated.completed = allDone;
    if (allDone && !current.completed) updated.timestamp = new Date().toISOString();
    const newPD   = { ...(dataRef.current.collin || {}), [t]: updated };
    const newData = { david: {}, collin: newPD };
    dataRef.current = newData;
    setData({ ...newData });
    saveData("challenge:collin", newPD);
    savingRef.current = false;
    recalcStreak(newPD);
  };

  const recalcStreak = (collinPD) => {
    const today = todayKey();
    let sd = startDate || today;
    if (sd < today) {
      const cur       = new Date(sd);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      while (cur <= yesterday) {
        const k = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
        if (!collinPD[k]?.completed) {
          sd = today;
          setStartDate(today);
          setStarted(false);
          saveData("challenge:startDate", today);
          saveData("challenge:started", false);
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    let s = 0;
    const c = new Date(sd), now = new Date(today);
    while (c <= now) {
      const k = `${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,'0')}-${String(c.getDate()).padStart(2,'0')}`;
      if (collinPD[k]?.completed) s++;
      c.setDate(c.getDate() + 1);
    }
    setStreak(s);
    saveData("challenge:streak", s);
  };

  const toggleRule = (rule) => {
    if (rule === "noAlcohol" && getDay().noAlcohol === true) { setShameModal(true); return; }
    updateDay({ [rule]: !getDay()[rule] });
  };

  const confirmDrinking = () => { updateDay({ noAlcohol: false }); setShameModal(false); };

  const markStarted = () => {
    setStarted(true);
    saveData("challenge:started", true);
    const today = todayKey();
    setStartDate(today);
    saveData("challenge:startDate", today);
  };

  const addWater = (amt) => updateDay({ water: Math.min(getDay().water + amt, WATER_GOAL + 32) });

  const submitCalories = () => {
    const amt = parseInt(calInput);
    if (!isNaN(amt) && amt !== 0) updateDay({ calories: Math.max(0, (getDay().calories || 0) + amt) });
    setCalInput("");
  };
  const submitProtein = () => {
    const amt = parseInt(protInput);
    if (!isNaN(amt) && amt !== 0) updateDay({ protein: Math.max(0, (getDay().protein || 0) + amt) });
    setProtInput("");
  };

  const openNote = (ruleId) => {
    setNoteModal({ field: `${ruleId}Note`, ruleId });
    setNoteDraft(getDay()[`${ruleId}Note`] || "");
  };
  const saveNote = () => {
    if (!noteModal) return;
    updateDay({ [noteModal.field]: noteDraft });
    setNoteModal(null); setNoteDraft("");
  };

  const waterPct  = (oz) => Math.min((oz / WATER_GOAL) * 100, 100);
  const dayNumber = () => !startDate || !started ? 1
    : Math.min(Math.floor((new Date(todayKey()) - new Date(startDate)) / 86400000) + 1, CHALLENGE_DAYS);
  const pct = () => !started ? 0 : ((dayNumber() - 1) / CHALLENGE_DAYS) * 100;
  const doneCount = () => {
    const d = getDay();
    return [d.workout, d.read, d.recovery, d.diet, d.noAlcohol, d.water >= WATER_GOAL].filter(Boolean).length;
  };

  if (loading) return (
    <div style={s.loading}>
      <div style={s.pulse} />
      <p style={{ color: "#94a3b8", marginTop: 14, fontSize: 11, letterSpacing: "0.15em", fontFamily: "monospace" }}>SYNCING</p>
    </div>
  );

  const nm     = noteModal;
  const rLabel = nm ? (RULES.find(r => r.id === nm.ruleId)?.label || "") : "";
  const rIcon  = nm ? (RULES.find(r => r.id === nm.ruleId)?.icon  || "") : "";
  const day    = getDay();
  const done   = doneCount();
  const calOver = day.calories > CAL_GOAL;

  return (
    <div style={s.root}>
      <div style={s.bg} />

      {/* ── Header ── */}
      <header style={s.header}>
        <div style={s.hRow}>
          <div>
            <div style={s.dayLabel}>
              {started ? `DAY ${dayNumber()} · ${CHALLENGE_DAYS}` : "READY TO START"}
            </div>
            <h1 style={s.title}>THE CHALLENGE</h1>
          </div>
          <div style={s.streakPill}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={s.streakNum}>{streak}</span>
            <span style={s.streakSub}>days</span>
          </div>
        </div>
        <div style={s.barTrack}><div style={{ ...s.barFill, width: `${pct()}%` }} /></div>
        <div style={s.barLabel}>
          {started ? `${Math.round(pct())}% · ${CHALLENGE_DAYS - dayNumber() + 1} days left` : "solo challenge · tap to begin"}
        </div>
      </header>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        {[["dashboard","TODAY"],["history","HISTORY"],["rules","RULES"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ ...s.navBtn, ...(view === v ? s.navOn : {}) }}>{label}</button>
        ))}
      </nav>

      {/* ── Dashboard ── */}
      {view === "dashboard" && (
        <>
          {/* Start Banner */}
          {!started && (
            <div style={s.startBanner}>
              <div style={s.startTitle}>SOLO CHALLENGE · ARE YOU READY?</div>
              <button onClick={markStarted} style={s.startSoloBtn}>Collin: I'm In — Let's Go 🔥</button>
            </div>
          )}
          {started && (
            <div style={{ ...s.startBanner, ...s.startBannerDone }}>
              <div style={s.startActive}>🔥 CHALLENGE ACTIVE · DAY {dayNumber()} OF {CHALLENGE_DAYS}</div>
            </div>
          )}

          {/* Two columns — Collin active, David's shame wall */}
          <div style={s.grid}>

            {/* David — never started */}
            <div style={s.davidCol}>
              <div style={s.davidHead}>
                <span style={s.davidName}>David</span>
                <span style={s.davidBadge}>NEVER STARTED</span>
              </div>
              <div style={s.quoteBox}>
                <div style={s.quoteText}>"{dailyQuote()}"</div>
              </div>
            </div>

            {/* Collin — active tracker */}
            <div style={{ ...s.col, ...(day.completed ? s.colDone : {}) }}>
              <div style={s.colHead}>
                <span style={s.colName}>Collin</span>
                <span style={{ ...s.colScore, ...(done === 6 ? s.colScoreDone : {}) }}>{done}/6</span>
              </div>
              {day.completed && <div style={s.doneBanner}>✓ DONE</div>}

              {RULES.map(rule => {
                const nf          = `${rule.id}Note`;
                const hn          = !!day[nf];
                const isDiet      = rule.id === "diet";
                const dietFail    = isDiet && calOver;
                return (
                  <div key={rule.id} style={s.ruleBlock}>
                    <button
                      onClick={() => !isDiet && toggleRule(rule.id)}
                      style={{
                        ...s.ruleBtn,
                        ...(day[rule.id] ? s.ruleDone : {}),
                        ...(dietFail ? s.ruleFail : {}),
                        ...(isDiet ? { cursor: "default" } : {}),
                      }}>
                      <span style={s.rIcon}>{rule.icon}</span>
                      <span style={s.rInner}>
                        <span style={s.rName}>{rule.label}</span>
                        <span style={s.rSub}>{isDiet ? "auto-tracked" : rule.sub}</span>
                      </span>
                      <span style={{ ...s.check, ...(day[rule.id] ? s.checkDone : {}), ...(dietFail ? { color: "#ef4444" } : {}) }}>
                        {dietFail ? "✗" : day[rule.id] ? "✓" : "○"}
                      </span>
                    </button>
                    {isDiet && (
                      <div style={{ marginTop: 4 }}>
                        {/* Calories */}
                        <div style={{ ...s.macroCard, marginBottom: 4, ...(calOver ? s.macroCardFail : day.calories > 0 ? s.macroCardDone : {}) }}>
                          <div style={s.macroCardTop}>
                            <span style={{ fontSize: 13 }}>🔥</span>
                            <span style={s.macroCardLabel}>Cal</span>
                            {calOver
                              ? <span style={s.macroBadgeFail}>OVER</span>
                              : day.calories > 0
                                ? <span style={s.macroBadgeDone}>✓ {day.calories}<span style={{ fontSize: 9, fontWeight: 400, color: "#86efac" }}>/{CAL_GOAL}</span></span>
                                : <span style={s.macroCardVal}>0<span style={s.macroCardGoal}>/{CAL_GOAL}</span></span>}
                          </div>
                          <div style={s.macroBar}>
                            <div style={{ ...s.macroFill, width: `${Math.min((day.calories/CAL_GOAL)*100,100)}%`,
                              background: calOver ? "#ef4444" : day.calories > CAL_GOAL*0.9 ? "linear-gradient(90deg,#f97316,#ef4444)" : day.calories > 0 ? "linear-gradient(90deg,#22d3ee,#22c55e)" : "rgba(255,255,255,0.05)" }} />
                          </div>
                          <div style={s.macroInputRow}>
                            <input type="number" inputMode="numeric" placeholder="add cal"
                              value={calInput} onChange={e => setCalInput(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && submitCalories()}
                              style={s.macroInput} />
                            <button onClick={submitCalories} style={s.macroAdd}>+</button>
                            <button onClick={() => updateDay({ calories: 0 })} style={s.macroReset}>↺</button>
                          </div>
                        </div>
                        {/* Protein */}
                        <div style={{ ...s.macroCard, ...(day.protein >= PROT_GOAL ? s.macroCardDone : day.protein > 0 ? s.macroCardOk : {}) }}>
                          <div style={s.macroCardTop}>
                            <span style={{ fontSize: 13 }}>💪</span>
                            <span style={s.macroCardLabel}>Protein</span>
                            {day.protein >= PROT_GOAL
                              ? <span style={s.macroBadgeDone}>✓ {PROT_GOAL}g</span>
                              : <span style={s.macroCardVal}>{day.protein}<span style={s.macroCardGoal}>/{PROT_GOAL}g</span></span>}
                          </div>
                          <div style={s.macroBar}>
                            <div style={{ ...s.macroFill, width: `${Math.min((day.protein/PROT_GOAL)*100,100)}%`,
                              background: day.protein >= PROT_GOAL ? "linear-gradient(90deg,#22d3ee,#22c55e)" : day.protein >= PROT_GOAL*0.6 ? "linear-gradient(90deg,#0ea5e9,#38bdf8)" : "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                          </div>
                          <div style={s.macroInputRow}>
                            <input type="number" inputMode="numeric" placeholder="add g"
                              value={protInput} onChange={e => setProtInput(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && submitProtein()}
                              style={s.macroInput} />
                            <button onClick={submitProtein} style={s.macroAdd}>+</button>
                            <button onClick={() => updateDay({ protein: 0 })} style={s.macroReset}>↺</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Water */}
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
                    {[8,16,32].map(a => <button key={a} onClick={() => addWater(a)} style={s.wBtn}>+{a}</button>)}
                    <button onClick={() => updateDay({ water: Math.max(0, day.water - 8) })} style={s.wMinus}>-8</button>
                  </div>
                ) : (
                  <div style={s.wLocked}>gallon complete 💪</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {view === "history" && <HistoryView data={data.collin} startDate={startDate} />}
      {view === "rules"   && <RulesView expandedRule={expandedRule} setExpandedRule={setExpandedRule} />}

      {/* ── Sync bar ── */}
      <div style={s.syncBar}>
        <span style={s.syncDot} />
        <span style={s.syncTxt}>live · {lastSync?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
      </div>

      {/* ── Note modal ── */}
      {nm && (
        <div style={s.overlay} onClick={() => setNoteModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>{rIcon} {rLabel}</div>
            <textarea style={s.textarea} value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
              placeholder={PLACEHOLDERS[nm.ruleId] || "Add a note..."} rows={4} autoFocus />
            <div style={s.modalBtns}>
              <button onClick={() => setNoteModal(null)} style={s.cancelBtn}>Cancel</button>
              <button onClick={saveNote} style={s.saveBtn}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alcohol shame modal ── */}
      {shameModal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, ...s.shameModal }}>
            <div style={s.shameEmoji}>🍺</div>
            <div style={s.shameTitle}>{SHAME_COLLIN.title}</div>
            <p style={s.shameBody}>{SHAME_COLLIN.body}</p>
            <div style={s.modalBtns}>
              <button onClick={() => setShameModal(false)} style={s.cancelBtn}>{SHAME_COLLIN.cancel}</button>
              <button onClick={confirmDrinking} style={s.shameConfirmBtn}>{SHAME_COLLIN.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Missed day shame modal ── */}
      {dayShame && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, ...s.shameModal }}>
            <div style={s.shameEmoji}>💀</div>
            <div style={s.shameTitle}>YOU FAILED {dayShame.date}</div>
            <p style={{ ...s.shameBody, marginBottom: 10 }}>
              You didn't finish the day. The streak is gone. Here's what you couldn't do:
            </p>
            {dayShame.missed.map((m, i) => (
              <div key={i} style={s.shameMissedRow}>{m}</div>
            ))}
            <p style={{ ...s.shameBody, marginTop: 12, fontSize: 11 }}>
              The challenge resets. Hit "I'm In" again when you're actually ready to commit.
            </p>
            <div style={s.modalBtns}>
              <button onClick={() => setDayShame(null)} style={s.shameConfirmBtn}>I know. I messed up.</button>
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
  while (cur <= now) {
    days.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`);
    cur.setDate(cur.getDate()+1);
  }
  days.reverse();
  return (
    <div style={s.hist}>
      <div style={s.histHead}>
        <span style={{ ...s.hCell, flex: 0.5 }}>Day</span>
        <span style={{ ...s.hCell, flex: 1 }}>Date</span>
        <span style={{ ...s.hCell, flex: 1, textAlign: "center" }}>Status</span>
      </div>
      {days.map(d => {
        const co = data?.[d];
        const n  = Math.floor((new Date(d) - new Date(startDate)) / 86400000) + 1;
        return (
          <div key={d} style={s.histRow}>
            <span style={{ ...s.hCell, flex: 0.5, color: "#94a3b8" }}>{n}</span>
            <span style={{ ...s.hCell, flex: 1, color: "#94a3b8" }}>{new Date(d+"T12:00:00").toLocaleDateString([],{month:"short",day:"numeric"})}</span>
            <span style={{ ...s.hBadge, flex: 1, background: co?.completed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.08)", color: co?.completed ? "#22c55e" : "#ef4444" }}>{co?.completed ? "✓ DONE" : "✗"}</span>
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
        <p style={s.rulesIntro}>75 days. 6 rules. No exceptions. Miss one rule on any day and the streak resets. That's the deal.</p>
      </div>
      {cards.map((rule, i) => {
        const open = expandedRule === rule.id;
        return (
          <div key={rule.id} style={{ ...s.rCard, ...(open ? s.rCardOpen : {}) }}>
            <button onClick={() => setExpandedRule(open ? null : rule.id)} style={s.rCardBtn}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, color: "#7e96b0", fontWeight: 700, minWidth: 20 }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontSize: 18 }}>{rule.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{rule.label}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{rule.sub}</div>
                </div>
              </div>
              <span style={{ fontSize: 14, color: "#94a3b8", transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </button>
            {open && (
              <div style={s.rCardBody}>
                <p style={{ margin: "14px 0 8px", fontSize: 12, color: "#94a3b8", lineHeight: 1.7, fontWeight: 600 }}>{rule.description}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>{rule.detail}</p>
              </div>
            )}
          </div>
        );
      })}
      <div style={s.rFooter}>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.7, fontStyle: "italic", textAlign: "center" }}>
          The rules aren't the hard part. Showing up when you don't feel like it is.
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
  header:      { position: "relative", zIndex: 1, padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  hRow:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  dayLabel:    { fontSize: 11, letterSpacing: "0.25em", color: "#0ea5e9", fontWeight: 700, marginBottom: 3 },
  title:       { margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "0.06em", color: "#f1f5f9" },
  streakPill:  { display: "flex", alignItems: "center", gap: 4, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 10, padding: "6px 10px" },
  streakNum:   { fontSize: 22, fontWeight: 800, color: "#f97316", lineHeight: 1 },
  streakSub:   { fontSize: 11, color: "#94a3b8", letterSpacing: "0.1em" },
  barTrack:    { height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  barFill:     { height: "100%", background: "linear-gradient(90deg,#0ea5e9,#6366f1)", borderRadius: 3, transition: "width 0.6s ease" },
  barLabel:    { fontSize: 11, color: "#7e96b0", letterSpacing: "0.1em", textAlign: "right" },
  nav:         { position: "relative", zIndex: 1, display: "flex", padding: "6px 14px", gap: 6 },
  navBtn:      { flex: 1, padding: "8px 0", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, background: "transparent", color: "#7e96b0", fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  navOn:       { background: "rgba(14,165,233,0.12)", borderColor: "rgba(14,165,233,0.4)", color: "#38bdf8" },

  // Start banner
  startBanner:     { position: "relative", zIndex: 1, margin: "6px 8px", padding: "12px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12 },
  startBannerDone: { background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.25)" },
  startActive:     { fontSize: 11, color: "#22c55e", fontWeight: 700, letterSpacing: "0.12em", textAlign: "center" },
  startTitle:      { fontSize: 10, color: "#94a3b8", letterSpacing: "0.2em", fontWeight: 700, textAlign: "center", marginBottom: 10 },
  startSoloBtn:    { width: "100%", padding: "12px 0", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: "0.04em" },

  // Grid
  grid:        { position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "2fr 3fr", gap: 8, padding: "4px 8px 8px", alignItems: "stretch" },

  // David's shame column
  davidCol:    { background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "10px 8px", display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" },
  davidHead:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  davidName:   { fontSize: 16, fontWeight: 800, color: "#475569", letterSpacing: "0.04em" },
  davidBadge:  { fontSize: 8, fontWeight: 700, color: "#ef4444", letterSpacing: "0.12em", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, padding: "2px 5px" },
  quoteBox:    { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 2px", overflow: "hidden", minHeight: 0 },
  quoteText:   { writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 16, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.6, fontStyle: "italic", textAlign: "center", maxHeight: "100%" },

  // Collin's active column
  col:         { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "10px 8px", transition: "border-color 0.3s", minWidth: 0, overflow: "hidden" },
  colDone:     { borderColor: "rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.04)" },
  colHead:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  colName:     { fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: "0.04em" },
  colScore:    { fontSize: 15, color: "#94a3b8" },
  colScoreDone:{ color: "#22c55e" },
  doneBanner:  { textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#22c55e", background: "rgba(34,197,94,0.1)", borderRadius: 5, padding: "4px 0", marginBottom: 6 },
  ruleBlock:   { marginBottom: 4 },
  ruleBtn:     { display: "flex", alignItems: "center", width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 6px", cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Mono',monospace" },
  ruleDone:    { background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)" },
  ruleFail:    { background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.3)" },
  rIcon:       { fontSize: 15, marginRight: 5, minWidth: 20 },
  rInner:      { flex: 1, display: "flex", flexDirection: "column", textAlign: "left" },
  rName:       { fontSize: 14, color: "#cbd5e1", fontWeight: 600, letterSpacing: "0.04em" },
  rSub:        { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  check:       { fontSize: 16, color: "#7e96b0", minWidth: 16, textAlign: "right" },
  checkDone:   { color: "#22c55e" },
  noteBtn:     { width: "100%", textAlign: "left", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "0 0 8px 8px", borderTop: "none", padding: "5px 8px", cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  noteFilled:  { background: "rgba(14,165,233,0.05)", borderColor: "rgba(14,165,233,0.2)", borderStyle: "solid" },
  notePreview: { fontSize: 11, color: "#94a3b8", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  notePh:      { fontSize: 11, color: "#64748b" },

  // Water
  water:       { background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.12)", borderRadius: 8, padding: "7px 6px", marginTop: 3 },
  waterDone:   { background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)" },
  wTop:        { display: "flex", alignItems: "center", marginBottom: 5 },
  wComplete:   { marginLeft: "auto", fontSize: 14, color: "#22c55e", fontWeight: 800, letterSpacing: "0.1em" },
  wOz:         { marginLeft: "auto", fontSize: 15, color: "#38bdf8", fontWeight: 700 },
  wGoal:       { fontSize: 12, color: "#94a3b8" },
  wBar:        { height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 6, position: "relative" },
  wFill:       { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  wMid:        { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.15)" },
  wBtns:       { display: "flex", gap: 4 },
  wBtn:        { flex: 1, padding: "7px 0", borderRadius: 6, background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", color: "#38bdf8", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  wMinus:      { padding: "7px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  wLocked:     { fontSize: 13, color: "#22c55e", textAlign: "center", paddingTop: 3, letterSpacing: "0.05em" },

  // Macros
  macroCard:        { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px" },
  macroCardOk:      { borderColor: "rgba(14,165,233,0.3)" },
  macroCardFail:    { background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.3)" },
  macroCardDone:    { background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.3)" },
  macroCardTop:     { display: "flex", alignItems: "center", gap: 5, marginBottom: 6 },
  macroCardLabel:   { fontSize: 13, color: "#cbd5e1", fontWeight: 600, flex: 1 },
  macroCardVal:     { fontSize: 14, color: "#38bdf8", fontWeight: 700 },
  macroCardGoal:    { fontSize: 11, color: "#64748b", fontWeight: 400 },
  macroBadgeFail:   { fontSize: 12, color: "#ef4444", fontWeight: 800 },
  macroBadgeDone:   { fontSize: 12, color: "#22c55e", fontWeight: 800 },
  macroBar:         { height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden", marginBottom: 7 },
  macroFill:        { height: "100%", borderRadius: 3, transition: "width 0.4s ease" },
  macroInputRow:    { display: "flex", gap: 4 },
  macroInput:       { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#e2e8f0", fontSize: 11, padding: "5px 6px", fontFamily: "'DM Mono',monospace", outline: "none", minWidth: 0 },
  macroAdd:         { padding: "5px 9px", borderRadius: 6, background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", color: "#38bdf8", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  macroReset:       { padding: "5px 7px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono',monospace" },

  // History
  hist:        { position: "relative", zIndex: 1, padding: "0 14px" },
  histHead:    { display: "flex", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 },
  histRow:     { display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  hCell:       { fontSize: 10, letterSpacing: "0.05em" },
  hBadge:      { fontSize: 12, fontWeight: 700, textAlign: "center", padding: "3px 0", borderRadius: 6 },

  // Sync
  syncBar:     { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", background: "rgba(8,13,26,0.97)", borderTop: "1px solid rgba(255,255,255,0.05)" },
  syncDot:     { width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" },
  syncTxt:     { fontSize: 9, color: "#64748b", letterSpacing: "0.12em" },

  // Modals
  overlay:     { position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" },
  modal:       { width: "100%", maxWidth: 380, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px" },
  modalTitle:  { fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 14, letterSpacing: "0.04em" },
  textarea:    { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, padding: "10px 12px", fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 },
  modalBtns:   { display: "flex", gap: 8, marginTop: 12 },
  cancelBtn:   { flex: 1, padding: "9px 0", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  saveBtn:     { flex: 2, padding: "9px 0", borderRadius: 8, background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.4)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  shameModal:      { border: "1px solid rgba(239,68,68,0.4)", background: "#100a0a" },
  shameEmoji:      { fontSize: 48, textAlign: "center", marginBottom: 10 },
  shameTitle:      { fontSize: 16, fontWeight: 800, color: "#ef4444", textAlign: "center", letterSpacing: "0.06em", marginBottom: 12 },
  shameBody:       { fontSize: 12, color: "#fca5a5", lineHeight: 1.75, margin: "0 0 4px", textAlign: "center" },
  shameConfirmBtn: { flex: 2, padding: "9px 0", borderRadius: 8, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  shameMissedRow:  { fontSize: 12, color: "#fca5a5", fontWeight: 700, padding: "4px 0", borderBottom: "1px solid rgba(239,68,68,0.1)", letterSpacing: "0.02em" },

  // Rules
  rulesView:   { position: "relative", zIndex: 1, padding: "0 14px 20px" },
  rulesIntro:  { margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.7, borderLeft: "2px solid rgba(14,165,233,0.4)", paddingLeft: 12 },
  rCard:       { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 8, overflow: "hidden", transition: "border-color 0.2s" },
  rCardOpen:   { borderColor: "rgba(14,165,233,0.3)" },
  rCardBtn:    { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  rCardBody:   { padding: "0 14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" },
  rFooter:     { marginTop: 20, padding: "16px", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 12 },
};
