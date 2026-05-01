import React, { useState, useEffect, useCallback, useRef } from "react";
import { dbGet, dbSet, dbListen } from "./firebase";

const CHALLENGE_DAYS = 75;
const WATER_GOAL    = 128;
const CAL_GOAL      = 2500;
const PROT_GOAL     = 150;

const RULES = [
  { id: "workout",   label: "Workout",    sub: "45 min",     icon: "🏋️",
    description: "Complete a minimum 45-minute workout every single day.",
    detail: "Strength training, cardio, sports, hiking, HIIT — anything intentional for at least 45 minutes. A walk to the mailbox doesn't count." },
  { id: "read",      label: "Read",       sub: "10 pages",   icon: "📖",
    description: "Read at least 10 pages of a non-fiction book every day.",
    detail: "Audiobooks don't count. Sit down with a physical or digital book. Non-fiction only." },
  { id: "recovery",  label: "Recovery",   sub: "15 min",     icon: "🧘",
    description: "Dedicate 15 minutes to active recovery every day.",
    detail: "Stretching, yoga, foam rolling, meditation, hot tub — intentional rest and repair." },
  { id: "diet",      label: "Diet",       sub: "100% clean", icon: "🥗",
    description: "Follow your diet with zero deviation.",
    detail: "No cheat meals. No 'just this once.' The discipline is the point." },
  { id: "noAlcohol", label: "No Alcohol", sub: "zero",       icon: "🚫",
    description: "No alcohol. Zero. None. Not even a sip.",
    detail: "No beer, wine, liquor, or anything containing alcohol for 75 days." },
];

const QUOTES = [
  "The hardest part is starting. David almost never found out.",
  "Some people talk about it. You are about it.",
  "Every day you grind, the gap between who you are and who you could be closes.",
  "75 days. Two people who actually showed up.",
  "Hard things done together hit different.",
  "Day by day. That's all it takes.",
  "Discipline is freedom in disguise.",
  "You are building something most people only dream about.",
  "The person you were before this challenge is fading. Good.",
  "Keep the streak. Change the story.",
  "Each day you finish makes the next one easier to start.",
  "Consistency compounds. Show up anyway.",
  "You don't have to feel ready. You just have to start.",
  "Strong bodies are built in the minutes you don't want to be there.",
  "We are what we repeatedly do. Excellence is a habit.",
  "The secret of getting ahead is getting started.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The pain of discipline weighs ounces. The pain of regret weighs tons.",
  "Don't wish it were easier. Wish you were better.",
  "Push yourself because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "It's going to be hard, but hard is not impossible.",
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
  "Strength does not come from the body. It comes from the will.",
  "Comfort is the enemy of progress.",
  "Motivation gets you started. Discipline keeps you going.",
  "The body achieves what the mind believes.",
  "Success is not owned. It is rented. And rent is due every day.",
  "There is no traffic on the extra mile.",
  "Earn it.",
  "What you do today is what matters.",
  "Iron sharpens iron.",
  "75 days of choosing yourselves.",
  "This discomfort is temporary. The results are not.",
  "Two people, one mission, zero excuses.",
  "The version of you that finishes this is someone worth becoming.",
  "Side by side or miles apart — the commitment is the same.",
  "Champions aren't made when they feel like it.",
  "Your future self is watching. Don't let them down.",
  "Every rep, every page, every sober choice — it adds up.",
  "You are proving something every single day.",
  "The gap between average and elite is just consistency.",
  "Nobody said it would be easy. They said it would be worth it.",
  "Showing up is the whole game.",
  "75 days from now you'll be glad you didn't quit today.",
  "Progress is progress, no matter how small.",
  "You earn the right to be proud by doing the hard thing.",
  "The grind doesn't care about your mood.",
  "Built different. Forged by discipline.",
  "Every day you don't quit, you win.",
  "Trust the process even when you can't see the progress.",
  "Uncomfortable today, unstoppable tomorrow.",
  "Your habits are your destiny.",
  "Do it for the person you're becoming.",
  "Hard work beats talent when talent doesn't work hard.",
  "Today's effort is tomorrow's result.",
  "The only bad workout is the one that didn't happen.",
  "You are closer than you were yesterday.",
  "Finish what you started.",
];

// Per-rule ruthless shame messages
const SHAME_MESSAGES = {
  workout: {
    emoji: "🏋️",
    title: "NO WORKOUT. REALLY?",
    lines: [
      "45 minutes. Out of 1,440 in a day, you couldn't find 45.",
      "Your body stays exactly as soft as it was yesterday. Zero progress.",
      "Every excuse you made today will still be there tomorrow — but so will the regret.",
      "The gym doesn't care about your feelings. Neither does the clock.",
    ],
  },
  read: {
    emoji: "📖",
    title: "10 PAGES. YOU SKIPPED 10 PAGES.",
    lines: [
      "A child reads faster. You chose scrolling over growing.",
      "Your mind is exactly as small as it was yesterday.",
      "Every page you skipped is a lesson your competition read instead.",
      "You had time. You chose to waste it.",
    ],
  },
  recovery: {
    emoji: "🧘",
    title: "15 MINUTES. YOU COULDN'T GIVE 15 MINUTES.",
    lines: [
      "Less than a sitcom episode. Your body asked for care and you said no.",
      "Enjoy the stiffness. You earned it.",
      "Recovery isn't optional — it's how you show up tomorrow.",
      "You worked out but wouldn't recover. That's not discipline, that's just dumb.",
    ],
  },
  diet: {
    emoji: "🥗",
    title: "YOU BLEW THE DIET.",
    lines: [
      "Your body is not a garbage can, but you treated it like one today.",
      "Every extra bite was a vote against the person you're trying to become.",
      "All that willpower — gone. Just like that.",
      "You can't outrun your fork. You know this.",
    ],
  },
  dietProtein: {
    emoji: "💪",
    title: "PROTEIN. YOU FORGOT PROTEIN.",
    lines: [
      "You worked out but forgot to fuel it.",
      "Your muscles are eating themselves right now. Great work.",
      "The whole point of lifting is to rebuild. You denied your body the tools.",
      "Hitting the gym without hitting protein is theater, not training.",
    ],
  },
  noAlcohol: {
    emoji: "🍺",
    title: "YOU DRANK. YOU ACTUALLY DRANK.",
    lines: [
      "Was it worth it? Really think about it. Was that drink worth starting over?",
      "Because it is. The streak is gone. You chose alcohol over your own commitment.",
      "You looked your challenge in the face and blinked.",
      "Social pressure beat your discipline. Remember that feeling.",
    ],
  },
  water: {
    emoji: "💧",
    title: "YOU DIDN'T DRINK ENOUGH WATER.",
    lines: [
      "This is the easiest rule on the list. A gallon of water.",
      "Your body is 60% water and you couldn't be bothered.",
      "No excuses exist for this one. None.",
      "You failed the simplest thing. Let that sink in.",
    ],
  },
};

const pacificDate = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(d);
};

// Parse a YYYY-MM-DD string as LOCAL midnight (avoids UTC-vs-PT timezone offset bugs)
const parseDateStr = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Format a YYYY-MM-DD string as "Month Day, Year" (e.g., "May 1, 2026")
const formatDisplayDate = (str) =>
  new Date(str + "T12:00:00").toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });

const dailyQuote = () => {
  const parts = pacificDate().split("-").map(Number);
  const start = new Date(parts[0], 0, 1);
  const today = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayOfYear = Math.floor((today - start) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
};

const defaultDay = () => ({
  workout: false, read: false, recovery: false, diet: false, noAlcohol: true,
  water: 0, calories: 0, protein: 0, completed: false, timestamp: null,
  workoutNote: "", readNote: "", recoveryNote: "",
});

// Migrate any existing localStorage data to Firebase on first load
const LS_TO_FB = {
  "challenge:collin":    "challenge/days/collin",
  "challenge:startDate": "challenge/meta/startDate",
  "challenge:started":   "challenge/meta/collinStarted",
  "challenge:streak":    "challenge/meta/streak",
  "challenge:weight":    "challenge/weights/collin",
};

async function migrateLocalStorage() {
  // Only migrate once — flag stored in Firebase
  const already = await dbGet("challenge/migratedAt");
  if (already) return;
  let any = false;
  for (const [lsKey, fbKey] of Object.entries(LS_TO_FB)) {
    const raw = localStorage.getItem(lsKey);
    if (!raw) continue;
    try { await dbSet(fbKey, JSON.parse(raw)); any = true; } catch {}
  }
  if (any) await dbSet("challenge/migratedAt", new Date().toISOString());
}

export default function App() {
  const [view, setView]               = useState("dashboard");
  const [collinDays, setCollinDays]   = useState({});
  const [davidDays,  setDavidDays]    = useState({});
  const [meta, setMeta]               = useState({ startDate: null, collinStarted: false, davidStarted: false, streak: 0, davidStartDate: null });
  const [weights, setWeights]         = useState({ collin: {}, david: {} });
  const [loading, setLoading]         = useState(true);
  const [lastSync, setLastSync]       = useState(null);
  const [whoAmI, setWhoAmI]           = useState(null); // "collin" | "david"
  const [expandedRule, setExpandedRule] = useState(null);
  const [shameModal, setShameModal]   = useState(null); // { rule, user }
  const [dayShame, setDayShame]       = useState(null); // { user, date, shameKey }
  const [davidJoinModal, setDavidJoinModal] = useState(false);
  const [calInput,  setCalInput]      = useState("");
  const [protInput, setProtInput]     = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [noteModal, setNoteModal]     = useState(null); // { user, ruleId }
  const [noteDraft, setNoteDraft]     = useState("");
  const shamedRef  = useRef({});
  const listeningRef = useRef(false);

  // On mount: who is this user?
  useEffect(() => {
    const stored = localStorage.getItem("whoAmI");
    if (stored === "collin" || stored === "david") {
      setWhoAmI(stored);
    } else {
      // Ask
      setWhoAmI("ask");
    }
  }, []);

  // Set up Firebase real-time listeners
  useEffect(() => {
    if (!whoAmI || whoAmI === "ask") return;
    if (listeningRef.current) return;
    listeningRef.current = true;

    migrateLocalStorage().then(() => {
      dbListen("challenge", (val) => {
        const v = val || {};
        setCollinDays(v.days?.collin || {});
        setDavidDays(v.days?.david  || {});
        setMeta({
          startDate:      v.meta?.startDate      || null,
          firstStartDate: v.meta?.firstStartDate || v.meta?.startDate || null,
          collinStarted:  v.meta?.collinStarted  ?? false,
          davidStarted:   v.meta?.davidStarted   ?? false,
          streak:         v.meta?.streak         || 0,
          davidStartDate: v.meta?.davidStartDate || null,
        });
        setWeights({
          collin: v.weights?.collin || {},
          david:  v.weights?.david  || {},
        });
        setLastSync(new Date());
        setLoading(false);

        // Check for missed days (past days not completed)
        checkMissedDays(v.days?.collin || {}, v.meta?.startDate, "collin");
        if (v.meta?.davidStarted) {
          checkMissedDays(v.days?.david || {}, v.meta?.davidStartDate, "david");
        }
      });
    });
  }, [whoAmI]);

  const checkMissedDays = (days, startDate, user) => {
    if (!startDate) return;
    const today = pacificDate();
    if (startDate >= today) return;
    const cur = parseDateStr(startDate);
    const yest = parseDateStr(yesterdayKey());
    while (cur <= yest) {
      const k = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(cur);
      if (!days[k]?.completed) {
        const shameKey = `${user}-${k}`;
        if (!shamedRef.current[shameKey]) {
          shamedRef.current[shameKey] = true;
          const missed = getMissedRules(days[k], user);
          setDayShame({ user, date: k, missed, shameKey });
        }
        break;
      }
      cur.setDate(cur.getDate() + 1);
    }
  };

  const getMissedRules = (d, user) => {
    const name = user === "collin" ? "Collin" : "David";
    if (!d) return [{ key: "workout", name }];
    const m = [];
    if (!d.workout)  m.push({ key: "workout", name });
    if (!d.read)     m.push({ key: "read", name });
    if (!d.recovery) m.push({ key: "recovery", name });
    if (!d.diet) {
      if (d.calories > CAL_GOAL) m.push({ key: "diet", name });
      else if ((d.protein || 0) < PROT_GOAL) m.push({ key: "dietProtein", name });
      else m.push({ key: "diet", name });
    }
    if (d.noAlcohol === false) m.push({ key: "noAlcohol", name });
    if ((d.water || 0) < WATER_GOAL) m.push({ key: "water", name });
    return m;
  };

  const today = pacificDate();

  const getDay = (user) => {
    const days = user === "collin" ? collinDays : davidDays;
    return days[today] || defaultDay();
  };

  const updateDay = async (user, updates) => {
    const days = user === "collin" ? collinDays : davidDays;
    const current = days[today] || defaultDay();
    const updated = { ...current, ...updates };

    // Collin: diet auto-calculated from calories + protein
    // David: diet is a simple manual toggle — don't auto-override
    if (user === "collin") {
      const calOk  = updated.calories > 0 && updated.calories <= CAL_GOAL;
      const protOk = (updated.protein || 0) >= PROT_GOAL;
      updated.diet = calOk && protOk;
    }

    const allDone = updated.workout && updated.read && updated.recovery &&
                    updated.diet && updated.noAlcohol && (updated.water || 0) >= WATER_GOAL;
    updated.completed = allDone;
    if (allDone && !current.completed) updated.timestamp = new Date().toISOString();

    const newDays = { ...days, [today]: updated };
    if (user === "collin") setCollinDays(newDays);
    else setDavidDays(newDays);

    await dbSet(`challenge/days/${user}`, newDays);
    await recalcStreak(
      user === "collin" ? newDays : collinDays,
      user === "david"  ? newDays : davidDays,
    );
  };

  const recalcStreak = async (cDays, dDays) => {
    const sd = meta.startDate || today;
    let s = 0;
    const cur = parseDateStr(sd), now = parseDateStr(today);
    while (cur <= now) {
      const k = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(cur);
      const collinDone = cDays[k]?.completed;
      const davidDone  = meta.davidStarted && meta.davidStartDate && k >= meta.davidStartDate
        ? dDays[k]?.completed : true; // before David joined, only Collin counts
      if (collinDone && davidDone) s++;
      cur.setDate(cur.getDate() + 1);
    }
    await dbSet("challenge/meta/streak", s);
  };

  const markCollinStarted = async () => {
    const sd = today;
    await dbSet("challenge/meta/collinStarted", true);
    await dbSet("challenge/meta/startDate", sd);
    // firstStartDate never resets — it anchors the full history
    const existing = await dbGet("challenge/meta/firstStartDate");
    if (!existing) await dbSet("challenge/meta/firstStartDate", sd);
    setMeta(m => ({ ...m, collinStarted: true, startDate: sd }));
  };

  const markDavidStarted = async () => {
    // Show shame/warning modal first
    setDavidJoinModal(true);
  };

  const confirmDavidStart = async () => {
    await dbSet("challenge/meta/davidStarted", true);
    await dbSet("challenge/meta/davidStartDate", today);
    // Reset shared streak — both start fresh from today
    await dbSet("challenge/meta/streak", 0);
    await dbSet("challenge/meta/startDate", today);
    setDavidJoinModal(false);
  };

  const toggleRule = (user, rule) => {
    if (rule === "noAlcohol" && getDay(user).noAlcohol === true) {
      setShameModal({ rule, user });
      return;
    }
    updateDay(user, { [rule]: !getDay(user)[rule] });
  };

  const confirmDrinking = async () => {
    await updateDay(shameModal.user, { noAlcohol: false });
    setShameModal(null);
  };

  const addWater = (user, amt) => {
    const current = getDay(user).water || 0;
    updateDay(user, { water: Math.min(current + amt, WATER_GOAL + 32) });
  };

  const submitCalories = (user) => {
    const amt = parseInt(calInput);
    if (!isNaN(amt) && amt > 0) updateDay(user, { calories: (getDay(user).calories || 0) + amt });
    setCalInput("");
  };

  const submitProtein = (user) => {
    const amt = parseInt(protInput);
    if (!isNaN(amt) && amt > 0) updateDay(user, { protein: Math.max(0, (getDay(user).protein || 0) + amt) });
    setProtInput("");
  };

  const saveWeight = async (user) => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    const newW = { ...(weights[user] || {}), [today]: val };
    setWeights(w => ({ ...w, [user]: newW }));
    await dbSet(`challenge/weights/${user}`, newW);
    setWeightInput("");
  };

  const openNote = (user, ruleId) => {
    const day = getDay(user);
    setNoteDraft(day[`${ruleId}Note`] || "");
    setNoteModal({ user, ruleId });
  };

  const saveNote = async () => {
    if (!noteModal) return;
    await updateDay(noteModal.user, { [`${noteModal.ruleId}Note`]: noteDraft });
    setNoteModal(null);
    setNoteDraft("");
  };

  const dayNumber = () => {
    if (!meta.startDate || !meta.collinStarted) return 1;
    return Math.min(Math.floor((new Date(today) - new Date(meta.startDate)) / 86400000) + 1, CHALLENGE_DAYS);
  };
  const pct = () => !meta.collinStarted ? 0 : ((dayNumber() - 1) / CHALLENGE_DAYS) * 100;

  const doneCount = (user) => {
    const d = getDay(user);
    return [d.workout, d.read, d.recovery, d.diet, d.noAlcohol, (d.water || 0) >= WATER_GOAL].filter(Boolean).length;
  };

  if (!whoAmI || whoAmI === "ask") return (
    <div style={s.root}>
      <div style={s.bg} />
      <div style={s.whoBox}>
        <div style={s.whoTitle}>WHO ARE YOU?</div>
        <p style={s.whoSub}>Pick your name. This device will always be yours.</p>
        <button onClick={() => { localStorage.setItem("whoAmI","collin"); setWhoAmI("collin"); }} style={s.whoBtn}>
          I'm Collin
        </button>
        <button onClick={() => { localStorage.setItem("whoAmI","david"); setWhoAmI("david"); }} style={{ ...s.whoBtn, ...s.whoBtnD }}>
          I'm David
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={s.loading}>
      <div style={s.pulse} />
      <p style={{ color: "#94a3b8", marginTop: 14, fontSize: 11, letterSpacing: "0.15em", fontFamily: "monospace" }}>SYNCING</p>
    </div>
  );

  const myDay    = getDay(whoAmI);
  const theirDay = getDay(whoAmI === "collin" ? "david" : "collin");
  const them     = whoAmI === "collin" ? "david" : "collin";
  const theirName = whoAmI === "collin" ? "David" : "Collin";
  const myName    = whoAmI === "collin" ? "Collin" : "David";
  const myDone   = doneCount(whoAmI);
  const theirDone = doneCount(them);
  const myStarted = whoAmI === "collin" ? meta.collinStarted : meta.davidStarted;
  const theirStarted = whoAmI === "collin" ? meta.davidStarted : meta.collinStarted;
  const calOver  = myDay.calories > CAL_GOAL;
  const theirCalOver = theirDay.calories > CAL_GOAL;

  const collinStreak = meta.streak;

  return (
    <div style={s.root}>
      <div style={s.bg} />

      {/* Header */}
      <header style={s.header}>
        <div style={s.hRow}>
          <div>
            <div style={s.dayLabel}>{meta.collinStarted ? `DAY ${dayNumber()} · ${CHALLENGE_DAYS}` : "READY TO START"}</div>
            <h1 style={s.title}>THE CHALLENGE</h1>
          </div>
          <div style={s.streakPill}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={s.streakNum}>{meta.streak}</span>
            <span style={s.streakSub}>days</span>
          </div>
        </div>
        <div style={s.barTrack}><div style={{ ...s.barFill, width: `${pct()}%` }} /></div>
        <div style={s.barLabel}>
          {meta.collinStarted ? `${Math.round(pct())}% · ${CHALLENGE_DAYS - dayNumber() + 1} days left` : "tap to begin"}
        </div>
      </header>

      {/* Nav */}
      <nav style={s.nav}>
        {[["dashboard","TODAY"],["history","HISTORY"],["weight","WEIGHT"],["rules","RULES"]].map(([v,label]) => (
          <button key={v} onClick={() => setView(v)} style={{ ...s.navBtn, ...(view===v ? s.navOn : {}) }}>{label}</button>
        ))}
      </nav>

      {/* Dashboard */}
      {view === "dashboard" && (
        <>
          {/* Start banners */}
          {!myStarted && (
            <div style={s.startBanner}>
              <div style={s.startTitle}>ARE YOU READY TO COMMIT?</div>
              <button onClick={whoAmI === "collin" ? markCollinStarted : markDavidStarted} style={s.startBtn}>
                {myName}: I'm In — Let's Go 🔥
              </button>
            </div>
          )}
          {myStarted && (
            <div style={{ ...s.startBanner, ...s.startBannerDone }}>
              <div style={s.startActive}>🔥 CHALLENGE ACTIVE · DAY {dayNumber()} OF {CHALLENGE_DAYS}</div>
            </div>
          )}

          {/* Weight logger */}
          <div style={s.weightCard}>
            <div style={s.weightCardTop}>
              <span style={{ fontSize: 16 }}>⚖️</span>
              <span style={s.weightCardLabel}>Weight</span>
              {weights[whoAmI]?.[today] && (
                <span style={s.weightCardToday}>{weights[whoAmI][today]} lbs today</span>
              )}
            </div>
            <div style={s.weightInputRow}>
              <input type="number" inputMode="decimal" placeholder="Enter weight in lbs"
                value={weightInput} onChange={e => setWeightInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveWeight(whoAmI)}
                style={s.weightInput} />
              <button onClick={() => saveWeight(whoAmI)} style={s.weightLogBtn}>Log</button>
            </div>
          </div>

          {/* Two columns — equal size */}
          <div style={s.grid}>
            {/* My column */}
            <TrackerCol
              user={whoAmI} name={myName} day={myDay} done={myDone} calOver={calOver}
              isMe={true} started={myStarted} calInput={calInput} protInput={protInput}
              setCalInput={setCalInput} setProtInput={setProtInput}
              toggleRule={r => toggleRule(whoAmI, r)}
              addWater={a => addWater(whoAmI, a)}
              removeWater={() => updateDay(whoAmI, { water: Math.max(0, (myDay.water||0) - 8) })}
              submitCalories={() => submitCalories(whoAmI)}
              submitProtein={() => submitProtein(whoAmI)}
              resetCalories={() => updateDay(whoAmI, { calories: 0 })}
              resetProtein={() => updateDay(whoAmI, { protein: 0 })}
              openNote={ruleId => openNote(whoAmI, ruleId)}
            />
            {/* Their column */}
            <TrackerCol
              user={them} name={theirName} day={theirDay} done={theirDone} calOver={theirCalOver}
              isMe={false} started={theirStarted}
              onJoin={them === "david" && !theirStarted ? markDavidStarted : null}
              calInput={""} protInput={""}
              setCalInput={() => {}} setProtInput={() => {}}
              toggleRule={() => {}} addWater={() => {}} removeWater={() => {}}
              submitCalories={() => {}} submitProtein={() => {}}
              resetCalories={() => {}} resetProtein={() => {}}
              openNote={() => {}}
            />
          </div>

          {/* Daily quote — bottom */}
          <div style={s.quoteBar}>
            <span style={s.quoteTxt}>"{dailyQuote()}"</span>
          </div>
        </>
      )}

      {view === "history" && <HistoryView collinDays={collinDays} davidDays={davidDays} meta={meta} />}
      {view === "weight"  && <WeightView  weights={weights} />}
      {view === "rules"   && <RulesView   expandedRule={expandedRule} setExpandedRule={setExpandedRule} />}

      {/* Sync bar */}
      <div style={s.syncBar}>
        <span style={s.syncDot} />
        <span style={s.syncTxt}>live · {lastSync?.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}</span>
      </div>

      {/* Note modal */}
      {noteModal && (
        <div style={s.overlay} onClick={() => setNoteModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>
              {RULES.find(r => r.id === noteModal.ruleId)?.icon} {RULES.find(r => r.id === noteModal.ruleId)?.label} — Note
            </div>
            <textarea
              style={s.textarea} value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              placeholder={`What did you do for ${noteModal.ruleId}?`}
              rows={4} autoFocus />
            <div style={s.modalBtns}>
              <button onClick={() => setNoteModal(null)} style={s.cancelBtn}>Cancel</button>
              <button onClick={saveNote} style={s.saveBtn}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Alcohol shame modal */}
      {shameModal && (() => {
        const sm = SHAME_MESSAGES.noAlcohol;
        return (
          <div style={s.overlay}>
            <div style={{ ...s.modal, ...s.shameModal }}>
              <div style={s.shameEmoji}>{sm.emoji}</div>
              <div style={s.shameTitle}>{sm.title}</div>
              {sm.lines.map((l,i) => <p key={i} style={s.shameBody}>{l}</p>)}
              <div style={s.modalBtns}>
                <button onClick={() => setShameModal(null)} style={s.cancelBtn}>Wait — I didn't drink!</button>
                <button onClick={confirmDrinking} style={s.shameConfirmBtn}>Yeah. I drank.</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Missed day shame modal */}
      {dayShame && (() => {
        const missed = dayShame.missed;
        const first = missed[0];
        const sm = SHAME_MESSAGES[first?.key] || SHAME_MESSAGES.workout;
        const userName = first?.name || "You";
        return (
          <div style={s.overlay}>
            <div style={{ ...s.modal, ...s.shameModal }}>
              <div style={s.shameEmoji}>{sm.emoji}</div>
              <div style={s.shameTitle}>{userName.toUpperCase()} FAILED {formatDisplayDate(dayShame.date)}</div>
              {sm.lines.map((l,i) => <p key={i} style={s.shameBody}>{l}</p>)}
              {missed.length > 1 && (
                <div style={{ marginTop: 8 }}>
                  {missed.slice(1).map((m,i) => (
                    <div key={i} style={s.shameMissedRow}>
                      {SHAME_MESSAGES[m.key]?.emoji} {SHAME_MESSAGES[m.key]?.title}
                    </div>
                  ))}
                </div>
              )}
              <p style={{ ...s.shameBody, marginTop: 12, fontSize: 11 }}>The streak resets. Start over when you're actually ready.</p>
              <button onClick={() => setDayShame(null)} style={{ ...s.shameConfirmBtn, marginTop: 12, width: "100%" }}>
                I know. I messed up.
              </button>
            </div>
          </div>
        );
      })()}

      {/* David join modal */}
      {davidJoinModal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, ...s.davidJoinModal }}>
            <div style={s.shameEmoji}>⚠️</div>
            <div style={{ ...s.shameTitle, color: "#f97316" }}>HOLD ON, DAVID.</div>
            <p style={s.davidJoinBody}>
              Collin has been grinding for <strong style={{ color: "#f97316" }}>DAY {dayNumber()}</strong> while you sat on the sidelines.
              He showed up every single day. You didn't.
            </p>
            <p style={s.davidJoinBody}>
              If you hit confirm right now, <strong style={{ color: "#ef4444" }}>Collin's streak resets to zero.</strong> His entire run — gone.
              Because of you. That's the weight you're carrying into this.
            </p>
            <p style={s.davidJoinBody}>
              Don't you dare start this and quit in a week. Don't waste his reset on your halfhearted attempt.
              If you're not absolutely sure you're ready to match his energy every single day for 75 days — walk away right now.
            </p>
            <p style={{ ...s.davidJoinBody, color: "#22c55e", fontWeight: 700 }}>
              But if you ARE ready? Then welcome. Prove it starts today. Make the reset worth it.
            </p>
            <div style={s.modalBtns}>
              <button onClick={() => setDavidJoinModal(false)} style={s.cancelBtn}>Not yet — I'm not ready</button>
              <button onClick={confirmDavidStart} style={s.davidJoinConfirmBtn}>I'm ready. Let's go. 🔥</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const NOTE_RULES = ["workout", "read", "recovery"];

function TrackerCol({ user, name, day, done, calOver, isMe, started, onJoin,
  calInput, protInput, setCalInput, setProtInput,
  toggleRule, addWater, removeWater, submitCalories, submitProtein, resetCalories, resetProtein,
  openNote }) {

  const colStyle = {
    ...s.col,
    ...(day.completed ? s.colDone : {}),
    ...(user === "collin" ? { borderColor: "rgba(14,165,233,0.3)" } : { borderColor: "rgba(99,102,241,0.3)" }),
  };

  if (!started && !isMe) return (
    <div style={{ ...s.col, alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 28 }}>😴</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#475569", textAlign: "center" }}>{name}</div>
      <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, letterSpacing: "0.1em", textAlign: "center" }}>NOT STARTED</div>
      {onJoin && (
        <button onClick={onJoin} style={s.joinBtn}>Join Now</button>
      )}
    </div>
  );

  return (
    <div style={colStyle}>
      <div style={s.colHead}>
        <span style={{ ...s.colName, color: user === "collin" ? "#38bdf8" : "#a5b4fc" }}>{name}</span>
        <span style={{ ...s.colScore, ...(done === 6 ? s.colScoreDone : {}) }}>{done}/6</span>
      </div>
      {day.completed && <div style={s.doneBanner}>✓ DONE</div>}

      {RULES.map(rule => {
        const isDiet = rule.id === "diet";
        const isSimpleDiet = isDiet && user === "david"; // David uses a plain toggle for diet
        return (
          <div key={rule.id} style={s.ruleBlock}>
            <button
              onClick={() => isMe && (!isDiet || isSimpleDiet) && toggleRule(rule.id)}
              style={{
                ...s.ruleBtn,
                ...(day[rule.id] ? s.ruleDone : {}),
                ...(isDiet && !isSimpleDiet && calOver ? s.ruleFail : {}),
                ...(!isMe || (isDiet && !isSimpleDiet) ? { cursor: "default" } : {}),
              }}>
              <span style={s.rIcon}>{rule.icon}</span>
              <span style={s.rInner}>
                <span style={s.rName}>{rule.label}</span>
                <span style={s.rSub}>{isDiet && !isSimpleDiet ? "auto-tracked" : rule.sub}</span>
              </span>
              <span style={{ ...s.check, ...(day[rule.id] ? s.checkDone : {}), ...(isDiet && !isSimpleDiet && calOver ? { color: "#ef4444" } : {}) }}>
                {isDiet && !isSimpleDiet && calOver ? "✗" : day[rule.id] ? "✓" : "○"}
              </span>
            </button>

            {/* Collin's full macro tracking */}
            {isDiet && !isSimpleDiet && isMe && (
              <div style={{ marginTop: 4 }}>
                {/* Calories — additive, success unless over goal */}
                <div style={{ ...s.macroCard, marginBottom: 4, ...(calOver ? s.macroCardFail : day.calories > 0 ? s.macroCardDone : {}) }}>
                  <div style={s.macroCardTop}>
                    <span style={{ fontSize: 13 }}>🔥</span>
                    <span style={s.macroCardLabel}>Cal</span>
                    {calOver
                      ? <span style={s.macroBadgeFail}>OVER {day.calories}</span>
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
                    <button onClick={resetCalories} style={s.macroReset}>↺</button>
                  </div>
                </div>
                {/* Protein */}
                <div style={{ ...s.macroCard, ...((day.protein||0) >= PROT_GOAL ? s.macroCardDone : (day.protein||0) > 0 ? s.macroCardOk : {}) }}>
                  <div style={s.macroCardTop}>
                    <span style={{ fontSize: 13 }}>💪</span>
                    <span style={s.macroCardLabel}>Protein</span>
                    {(day.protein||0) >= PROT_GOAL
                      ? <span style={s.macroBadgeDone}>✓ {PROT_GOAL}g</span>
                      : <span style={s.macroCardVal}>{day.protein||0}<span style={s.macroCardGoal}>/{PROT_GOAL}g</span></span>}
                  </div>
                  <div style={s.macroBar}>
                    <div style={{ ...s.macroFill, width: `${Math.min(((day.protein||0)/PROT_GOAL)*100,100)}%`,
                      background: (day.protein||0) >= PROT_GOAL ? "linear-gradient(90deg,#22d3ee,#22c55e)" : "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                  </div>
                  <div style={s.macroInputRow}>
                    <input type="number" inputMode="numeric" placeholder="add g"
                      value={protInput} onChange={e => setProtInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && submitProtein()}
                      style={s.macroInput} />
                    <button onClick={submitProtein} style={s.macroAdd}>+</button>
                    <button onClick={resetProtein} style={s.macroReset}>↺</button>
                  </div>
                </div>
              </div>
            )}
            {/* Viewing Collin's macro stats from David's side */}
            {isDiet && !isSimpleDiet && !isMe && (
              <div style={{ ...s.macroCard, marginTop: 4 }}>
                <div style={s.macroCardTop}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Cal: {theirDayCalDisplay(day)} · Protein: {day.protein||0}g</span>
                </div>
              </div>
            )}

            {/* Notes for workout, read, recovery — always show area; read-only for other person */}
            {NOTE_RULES.includes(rule.id) && (
              <div style={s.noteRow}>
                {day[`${rule.id}Note`] ? (
                  <button onClick={() => isMe && openNote(rule.id)} style={{ ...s.noteBtn, ...(isMe ? {} : { cursor: "default" }) }}>
                    <span style={s.noteIcon}>📝</span>
                    <span style={s.noteText}>{day[`${rule.id}Note`]}</span>
                  </button>
                ) : isMe ? (
                  <button onClick={() => openNote(rule.id)} style={s.noteAddBtn}>
                    + add note
                  </button>
                ) : (
                  <div style={{ ...s.noteAddBtn, cursor: "default", color: "#334155", borderColor: "rgba(255,255,255,0.04)" }}>
                    no note yet
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Water */}
      <div style={{ ...s.water, ...((day.water||0) >= WATER_GOAL ? s.waterDone : {}) }}>
        <div style={s.wTop}>
          <span style={s.rIcon}>💧</span>
          <span style={s.rName}>Water</span>
          {(day.water||0) >= WATER_GOAL
            ? <span style={s.wComplete}>✓ GOAL</span>
            : <span style={s.wOz}>{day.water||0}<span style={s.wGoal}>/{WATER_GOAL}</span></span>}
        </div>
        <div style={s.wBar}>
          <div style={{ ...s.wFill, width: `${Math.min(((day.water||0)/WATER_GOAL)*100,100)}%`,
            background: (day.water||0) >= WATER_GOAL ? "linear-gradient(90deg,#22d3ee,#22c55e)"
              : (day.water||0) >= 64 ? "linear-gradient(90deg,#0ea5e9,#38bdf8)"
              : "linear-gradient(90deg,#1d4ed8,#3b82f6)" }} />
          <div style={s.wMid} />
        </div>
        {isMe && (day.water||0) < WATER_GOAL ? (
          <div style={s.wBtns}>
            {[8,16,26].map(a => <button key={a} onClick={() => addWater(a)} style={s.wBtn}>+{a}</button>)}
            <button onClick={removeWater} style={s.wMinus}>-8</button>
          </div>
        ) : isMe ? (
          <div style={s.wLocked}>gallon complete 💪</div>
        ) : null}
      </div>
    </div>
  );
}

function theirDayCalDisplay(day) {
  if (!day.calories) return "—";
  return `${day.calories}`;
}

function WeightView({ weights }) {
  const cEntries = Object.entries(weights.collin || {}).sort(([a],[b]) => a.localeCompare(b)).filter(([,v]) => v > 0);
  const dEntries = Object.entries(weights.david  || {}).sort(([a],[b]) => a.localeCompare(b)).filter(([,v]) => v > 0);
  const allEntries = [...cEntries, ...dEntries];
  if (allEntries.length === 0) return (
    <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
      No weight entries yet. Log your weight on the TODAY tab.
    </div>
  );

  const W = 340, H = 200, PL = 44, PR = 16, PT = 16, PB = 36;
  const gW = W - PL - PR, gH = H - PT - PB;
  const allWeights = allEntries.map(([,v]) => v);
  const minW = Math.floor(Math.min(...allWeights)) - 2;
  const maxW = Math.ceil(Math.max(...allWeights)) + 2;

  // Build unified date axis
  const allDates = [...new Set(allEntries.map(([d]) => d))].sort();
  const cx = (date) => {
    const i = allDates.indexOf(date);
    return PL + (allDates.length > 1 ? (i / (allDates.length - 1)) * gW : gW / 2);
  };
  const cy = (w) => PT + (1 - (w - minW) / (maxW - minW)) * gH;

  const makePath = (entries) => entries.length < 1 ? "" :
    entries.map(([d,w],i) => `${i===0?"M":"L"}${cx(d).toFixed(1)},${cy(w).toFixed(1)}`).join(" ");

  const cPath = makePath(cEntries);
  const dPath = makePath(dEntries);
  const yTicks = [minW, Math.round((minW+maxW)/2), maxW];

  const statCard = (label, val, color, bg, border) => (
    <div style={{ flex: 1, background: bg || "rgba(255,255,255,0.03)", border: `1px solid ${border || "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "10px 8px" }}>
      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.12em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color }}>{val}</div>
    </div>
  );

  const cFirst = cEntries[0]?.[1], cLast = cEntries[cEntries.length-1]?.[1];
  const dFirst = dEntries[0]?.[1], dLast = dEntries[dEntries.length-1]?.[1];
  const cDiff = cFirst && cLast ? (cLast - cFirst).toFixed(1) : null;
  const dDiff = dFirst && dLast ? (dLast - dFirst).toFixed(1) : null;

  return (
    <div style={{ position: "relative", zIndex: 1, padding: "0 14px 24px" }}>
      {/* Collin stats */}
      <div style={{ fontSize: 10, color: "#38bdf8", letterSpacing: "0.15em", fontWeight: 700, margin: "12px 0 6px" }}>COLLIN</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {statCard("START", cFirst ? `${cFirst} lbs` : "—", "#94a3b8")}
        {statCard("NOW",   cLast  ? `${cLast} lbs`  : "—", "#f1f5f9")}
        {cDiff !== null && statCard("CHANGE", `${cDiff > 0 ? "+" : ""}${cDiff} lbs`,
          cDiff <= 0 ? "#22c55e" : "#ef4444",
          cDiff <= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          cDiff <= 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)")}
      </div>
      {/* David stats */}
      {dEntries.length > 0 && <>
        <div style={{ fontSize: 10, color: "#a5b4fc", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 6 }}>DAVID</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {statCard("START", dFirst ? `${dFirst} lbs` : "—", "#94a3b8")}
          {statCard("NOW",   dLast  ? `${dLast} lbs`  : "—", "#f1f5f9")}
          {dDiff !== null && statCard("CHANGE", `${dDiff > 0 ? "+" : ""}${dDiff} lbs`,
            dDiff <= 0 ? "#22c55e" : "#ef4444",
            dDiff <= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            dDiff <= 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)")}
        </div>
      </>}

      {/* Shared graph */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {yTicks.map((w,i) => (
            <g key={i}>
              <line x1={PL} y1={cy(w)} x2={W-PR} y2={cy(w)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PL-6} y={cy(w)+4} textAnchor="end" fill="#475569" fontSize="10">{w}</text>
            </g>
          ))}
          {cPath && <path d={cPath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {dPath && <path d={dPath} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {cEntries.map(([d,w]) => (
            <g key={`c-${d}`}>
              <circle cx={cx(d)} cy={cy(w)} r="6" fill="#ef4444" fillOpacity="0.15" />
              <circle cx={cx(d)} cy={cy(w)} r="3.5" fill="#ef4444" />
            </g>
          ))}
          {dEntries.map(([d,w]) => (
            <g key={`d-${d}`}>
              <circle cx={cx(d)} cy={cy(w)} r="6" fill="#94a3b8" fillOpacity="0.15" />
              <circle cx={cx(d)} cy={cy(w)} r="3.5" fill="#94a3b8" />
            </g>
          ))}
          {allDates.filter((_,i,a) => i===0 || i===a.length-1 || (a.length>4 && i===Math.floor(a.length/2))).map(d => (
            <text key={d} x={cx(d)} y={H-6} textAnchor="middle" fill="#475569" fontSize="9">
              {new Date(d+"T12:00:00").toLocaleDateString([],{month:"short",day:"numeric"})}
            </text>
          ))}
        </svg>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 3, background: "#ef4444", borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: "#ef4444" }}>Collin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 3, background: "#94a3b8", borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: "#94a3b8" }}>David</span>
        </div>
      </div>
    </div>
  );
}

function HistoryView({ collinDays, davidDays, meta }) {
  // Use firstStartDate so history never disappears after resets
  const histStart = meta.firstStartDate || meta.startDate;
  if (!histStart) return null;

  const today = pacificDate();
  const days = [];
  const cur = parseDateStr(histStart), now = parseDateStr(today);
  while (cur <= now) {
    days.push(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(cur));
    cur.setDate(cur.getDate() + 1);
  }
  days.reverse();

  const davidJoined = meta.davidStarted && meta.davidStartDate;

  // Day number within current streak (resets when David joins)
  const streakStart = meta.startDate || histStart;

  return (
    <div style={s.hist}>
      <div style={s.histHead}>
        <span style={{ ...s.hCell, flex: 0.4 }}>Day</span>
        <span style={{ ...s.hCell, flex: 1 }}>Date</span>
        <span style={{ ...s.hCell, flex: 1, textAlign: "center", color: "#ef4444" }}>Collin</span>
        {davidJoined && <span style={{ ...s.hCell, flex: 1, textAlign: "center", color: "#94a3b8" }}>David</span>}
      </div>
      {days.map(d => {
        const isToday     = d === today;
        const co          = collinDays?.[d];
        const dv          = davidDays?.[d];
        const inStreak    = d >= streakStart;
        const davidActive = davidJoined && d >= meta.davidStartDate;
        // Day number: only count days within current streak
        const n = inStreak ? Math.floor((new Date(d) - new Date(streakStart)) / 86400000) + 1 : null;

        // Collin badge
        const cBg    = isToday ? "rgba(14,165,233,0.08)" : co?.completed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.08)";
        const cColor = isToday ? "#38bdf8" : co?.completed ? "#22c55e" : "#ef4444";
        const cLabel = isToday ? "—" : co?.completed ? "✓" : "✗";

        return (
          <div key={d} style={{ ...s.histRow, ...(isToday ? { background: "rgba(14,165,233,0.03)" } : {}), ...(!inStreak ? { opacity: 0.5 } : {}) }}>
            <span style={{ ...s.hCell, flex: 0.4, color: inStreak ? "#94a3b8" : "#334155" }}>
              {n ? n : "—"}{isToday ? " ←" : ""}
            </span>
            <span style={{ ...s.hCell, flex: 1, color: "#94a3b8" }}>
              {formatDisplayDate(d)}
            </span>
            <span style={{ ...s.hBadge, flex: 1, background: cBg, color: cColor }}>{cLabel}</span>
            {davidJoined && (
              <span style={{ ...s.hBadge, flex: 1,
                background: !davidActive ? "transparent" : isToday ? "rgba(14,165,233,0.08)" : dv?.completed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.08)",
                color: !davidActive ? "#334155" : isToday ? "#38bdf8" : dv?.completed ? "#22c55e" : "#ef4444"
              }}>
                {!davidActive ? "—" : isToday ? "—" : dv?.completed ? "✓" : "✗"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RulesView({ expandedRule, setExpandedRule }) {
  const cards = [...RULES, {
    id: "water", label: "Water", sub: "1 gallon / 128 oz", icon: "💧",
    description: "Drink one full gallon of water every day.",
    detail: "Plain water only. Coffee and tea don't count. The midpoint marker is your checkpoint.",
  }];
  return (
    <div style={s.rulesView}>
      <div style={{ padding: "16px 0 12px" }}>
        <p style={s.rulesIntro}>75 days. 6 rules. No exceptions. Miss one and the streak resets.</p>
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
              <span style={{ fontSize: 14, color: "#94a3b8", transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
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
    </div>
  );
}

const s = {
  root:        { minHeight: "100vh", background: "#080d1a", color: "#e2e8f0", fontFamily: "'DM Mono','Courier New',monospace", position: "relative", paddingBottom: 52, overflowX: "hidden", paddingTop: "env(safe-area-inset-top, 20px)" },
  bg:          { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "radial-gradient(ellipse at 15% 40%, rgba(14,165,233,0.06) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(99,102,241,0.06) 0%, transparent 50%)" },
  loading:     { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080d1a" },
  pulse:       { width: 10, height: 10, borderRadius: "50%", background: "#0ea5e9" },

  // Who am I screen
  whoBox:      { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 30px", gap: 16 },
  whoTitle:    { fontSize: 22, fontWeight: 800, letterSpacing: "0.1em", color: "#f1f5f9" },
  whoSub:      { fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 8 },
  whoBtn:      { width: "100%", maxWidth: 300, padding: "16px 0", borderRadius: 12, background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.4)", color: "#38bdf8", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: "0.05em" },
  whoBtnD:     { background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc" },

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
  navBtn:      { flex: 1, padding: "8px 0", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, background: "transparent", color: "#7e96b0", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  navOn:       { background: "rgba(14,165,233,0.12)", borderColor: "rgba(14,165,233,0.4)", color: "#38bdf8" },

  startBanner:     { position: "relative", zIndex: 1, margin: "6px 8px", padding: "12px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12 },
  startBannerDone: { background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.25)" },
  startActive:     { fontSize: 11, color: "#22c55e", fontWeight: 700, letterSpacing: "0.12em", textAlign: "center" },
  startTitle:      { fontSize: 10, color: "#94a3b8", letterSpacing: "0.2em", fontWeight: 700, textAlign: "center", marginBottom: 10 },
  startBtn:        { width: "100%", padding: "12px 0", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },

  weightCard:     { position: "relative", zIndex: 1, margin: "0 8px 6px", background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 14, padding: "10px 12px" },
  weightCardTop:  { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  weightCardLabel:{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", flex: 1 },
  weightCardToday:{ fontSize: 12, color: "#38bdf8", fontWeight: 700 },
  weightInputRow: { display: "flex", gap: 8 },
  weightInput:    { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 8, color: "#e2e8f0", fontSize: 14, padding: "8px 10px", fontFamily: "'DM Mono',monospace", outline: "none", minWidth: 0 },
  weightLogBtn:   { padding: "8px 16px", borderRadius: 8, background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.4)", color: "#38bdf8", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },

  grid:        { position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "4px 8px 8px", alignItems: "stretch" },
  col:         { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "10px 8px", transition: "border-color 0.3s", minWidth: 0, overflow: "hidden" },
  colDone:     { background: "rgba(34,197,94,0.04)" },
  colHead:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  colName:     { fontSize: 16, fontWeight: 800, letterSpacing: "0.04em" },
  colScore:    { fontSize: 14, color: "#94a3b8" },
  colScoreDone:{ color: "#22c55e" },
  doneBanner:  { textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "#22c55e", background: "rgba(34,197,94,0.1)", borderRadius: 5, padding: "4px 0", marginBottom: 6 },
  ruleBlock:   { marginBottom: 4 },
  ruleBtn:     { display: "flex", alignItems: "center", width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 5px", cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Mono',monospace" },
  ruleDone:    { background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)" },
  ruleFail:    { background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.3)" },
  rIcon:       { fontSize: 14, marginRight: 4, minWidth: 18 },
  rInner:      { flex: 1, display: "flex", flexDirection: "column", textAlign: "left" },
  rName:       { fontSize: 12, color: "#cbd5e1", fontWeight: 600, letterSpacing: "0.02em" },
  rSub:        { fontSize: 10, color: "#94a3b8", marginTop: 1 },
  check:       { fontSize: 14, color: "#7e96b0", minWidth: 14, textAlign: "right" },
  checkDone:   { color: "#22c55e" },
  noteRow:     { marginTop: 2, marginBottom: 2 },
  noteBtn:     { width: "100%", textAlign: "left", background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 6, padding: "5px 7px", cursor: "pointer", fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "flex-start", gap: 5 },
  noteIcon:    { fontSize: 10, marginTop: 1 },
  noteText:    { fontSize: 10, color: "#94a3b8", lineHeight: 1.5, flex: 1, wordBreak: "break-word" },
  noteAddBtn:  { width: "100%", textAlign: "left", background: "transparent", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 7px", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#475569" },
  modalTitle:  { fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12, letterSpacing: "0.04em" },
  textarea:    { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, padding: "10px 12px", fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 },
  saveBtn:     { flex: 2, padding: "9px 0", borderRadius: 8, background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.4)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  joinBtn:     { padding: "8px 16px", borderRadius: 8, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },

  water:       { background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.12)", borderRadius: 8, padding: "7px 6px", marginTop: 3 },
  waterDone:   { background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)" },
  wTop:        { display: "flex", alignItems: "center", marginBottom: 5 },
  wComplete:   { marginLeft: "auto", fontSize: 13, color: "#22c55e", fontWeight: 800, letterSpacing: "0.1em" },
  wOz:         { marginLeft: "auto", fontSize: 13, color: "#38bdf8", fontWeight: 700 },
  wGoal:       { fontSize: 11, color: "#94a3b8" },
  wBar:        { height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 6, position: "relative" },
  wFill:       { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  wMid:        { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.15)" },
  wBtns:       { display: "flex", gap: 3 },
  wBtn:        { flex: 1, padding: "6px 0", borderRadius: 6, background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  wMinus:      { padding: "6px 7px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  wLocked:     { fontSize: 12, color: "#22c55e", textAlign: "center", paddingTop: 3, letterSpacing: "0.05em" },

  macroCard:        { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "7px" },
  macroCardOk:      { borderColor: "rgba(14,165,233,0.3)" },
  macroCardFail:    { background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.3)" },
  macroCardDone:    { background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.3)" },
  macroCardTop:     { display: "flex", alignItems: "center", gap: 4, marginBottom: 5 },
  macroCardLabel:   { fontSize: 12, color: "#cbd5e1", fontWeight: 600, flex: 1 },
  macroCardVal:     { fontSize: 13, color: "#38bdf8", fontWeight: 700 },
  macroCardGoal:    { fontSize: 10, color: "#64748b", fontWeight: 400 },
  macroBadgeFail:   { fontSize: 11, color: "#ef4444", fontWeight: 800 },
  macroBadgeDone:   { fontSize: 11, color: "#22c55e", fontWeight: 800 },
  macroBar:         { height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  macroFill:        { height: "100%", borderRadius: 3, transition: "width 0.4s ease" },
  macroInputRow:    { display: "flex", gap: 3 },
  macroInput:       { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#e2e8f0", fontSize: 11, padding: "5px 5px", fontFamily: "'DM Mono',monospace", outline: "none", minWidth: 0 },
  macroAdd:         { padding: "5px 8px", borderRadius: 6, background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  macroReset:       { padding: "5px 6px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace" },

  // Quote bar
  quoteBar:    { position: "relative", zIndex: 1, margin: "4px 8px 8px", padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 },
  quoteTxt:    { fontSize: 11, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.7, display: "block", textAlign: "center" },

  hist:        { position: "relative", zIndex: 1, padding: "0 14px" },
  histHead:    { display: "flex", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 },
  histRow:     { display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  hCell:       { fontSize: 10, letterSpacing: "0.05em" },
  hBadge:      { fontSize: 12, fontWeight: 700, textAlign: "center", padding: "3px 0", borderRadius: 6 },

  syncBar:     { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", background: "rgba(8,13,26,0.97)", borderTop: "1px solid rgba(255,255,255,0.05)" },
  syncDot:     { width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" },
  syncTxt:     { fontSize: 9, color: "#64748b", letterSpacing: "0.12em" },

  overlay:     { position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" },
  modal:       { width: "100%", maxWidth: 380, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px", maxHeight: "85vh", overflowY: "auto" },
  modalBtns:   { display: "flex", gap: 8, marginTop: 14 },
  cancelBtn:   { flex: 1, padding: "9px 0", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace" },

  shameModal:      { border: "1px solid rgba(239,68,68,0.4)", background: "#100a0a" },
  shameEmoji:      { fontSize: 48, textAlign: "center", marginBottom: 10 },
  shameTitle:      { fontSize: 15, fontWeight: 800, color: "#ef4444", textAlign: "center", letterSpacing: "0.06em", marginBottom: 10 },
  shameBody:       { fontSize: 12, color: "#fca5a5", lineHeight: 1.75, margin: "0 0 6px", textAlign: "center" },
  shameConfirmBtn: { flex: 2, padding: "9px 0", borderRadius: 8, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  shameMissedRow:  { fontSize: 11, color: "#fca5a5", fontWeight: 700, padding: "4px 0", borderBottom: "1px solid rgba(239,68,68,0.1)" },

  davidJoinModal:      { border: "1px solid rgba(249,115,22,0.4)", background: "#0f0a00" },
  davidJoinBody:       { fontSize: 12, color: "#fed7aa", lineHeight: 1.8, margin: "0 0 10px", textAlign: "center" },
  davidJoinConfirmBtn: { flex: 2, padding: "9px 0", borderRadius: 8, background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)", color: "#22c55e", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" },

  rulesView:   { position: "relative", zIndex: 1, padding: "0 14px 20px" },
  rulesIntro:  { margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.7, borderLeft: "2px solid rgba(14,165,233,0.4)", paddingLeft: 12 },
  rCard:       { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 8, overflow: "hidden" },
  rCardOpen:   { borderColor: "rgba(14,165,233,0.3)" },
  rCardBtn:    { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace" },
  rCardBody:   { padding: "0 14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" },
};
