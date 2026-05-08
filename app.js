const STORAGE_KEY = "neuroflow_tiles_v4";
const FOCUS_KEY = "neuroflow_daily_anchor_v3";
const TOTAL_DAYS = 31;

const defaultTiles = [
  {
    id: "deep-focus",
    name: "Deep Focus",
    icon: "🧠",
    color: "green",
    cells: [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0]
  },
  {
    id: "move-my-body",
    name: "Move My Body",
    icon: "🏃",
    color: "blue",
    cells: [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
  },
  {
    id: "brain-dump",
    name: "Brain Dump",
    icon: "📝",
    color: "orange",
    cells: [1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1]
  }
];

const tileGrid = document.getElementById("tile-grid");
const tileTemplate = document.getElementById("tile-template");
const tilesActive = document.getElementById("tiles-active");
const totalCompletions = document.getElementById("total-completions");
const supportMessage = document.getElementById("support-message");
const addTileButton = document.getElementById("add-tile-button");
const resetWeekButton = document.getElementById("reset-week-button");
const restoreDefaultsButton = document.getElementById("restore-defaults-button");
const installAppButton = document.getElementById("install-app-button");
const saveFocusButton = document.getElementById("save-focus-button");
const clearFocusButton = document.getElementById("clear-focus-button");
const loadSampleButton = document.getElementById("load-sample-button");
const focusInput = document.getElementById("focus-input");
const anchorText = document.getElementById("anchor-text");
const emailInput = document.getElementById("email-input");
const magicLinkButton = document.getElementById("magic-link-button");
const signOutButton = document.getElementById("sign-out-button");
const authStatus = document.getElementById("auth-status");
const iosInstallNote = document.getElementById("ios-install-note");
const emptyBoard = document.getElementById("empty-board");

let deferredPrompt = null;
let deferredSyncTimer = null;
let supabase = null;
let currentSession = null;

function isIosSafari() {
  const ua = window.navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isCriOS = /CriOS/.test(ua);
  return isIOS && isWebkit && !isCriOS;
}

function normalizeTile(tile) {
  const cells = Array.isArray(tile.cells) ? [...tile.cells] : [];
  while (cells.length < TOTAL_DAYS) cells.push(0);
  return {
    ...tile,
    cells: cells.slice(0, TOTAL_DAYS)
  };
}

function getDefaultTiles() {
  return defaultTiles.map(normalizeTile);
}

function ensureTilesExist(candidateTiles) {
  return Array.isArray(candidateTiles) && candidateTiles.length > 0 ? candidateTiles : getDefaultTiles();
}

function loadTiles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : defaultTiles;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getDefaultTiles();
    }
    return ensureTilesExist(parsed.map(normalizeTile));
  } catch {
    return getDefaultTiles();
  }
}

function loadFocusAnchor() {
  try {
    return localStorage.getItem(FOCUS_KEY) || "";
  } catch {
    return "";
  }
}

let tiles = loadTiles();
let focusAnchor = loadFocusAnchor();

function setAuthMessage(message) {
  authStatus.textContent = message;
}

function saveTilesLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
}

function saveFocusAnchorLocal() {
  localStorage.setItem(FOCUS_KEY, focusAnchor);
}

function getCompletionCount() {
  return tiles.reduce((sum, tile) => sum + tile.cells.filter(Boolean).length, 0);
}

function getSupportCopy(count) {
  if (count === 0) return "You only need one next step.";
  if (count < 8) return "Momentum still counts, even when it looks tiny.";
  if (count < 18) return "This is progress, not a performance review.";
  return "You are building visible proof that you can return.";
}

function renderStats() {
  const total = getCompletionCount();
  tilesActive.textContent = String(tiles.length);
  totalCompletions.textContent = String(total);
  supportMessage.textContent = getSupportCopy(total);
}

function renderAnchor() {
  focusInput.value = focusAnchor;
  anchorText.textContent = focusAnchor || "You haven’t saved a daily anchor yet.";
}

function buildMiniGrid(id, tile) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  wrap.innerHTML = "";
  tile.cells.slice(0, 21).forEach((isActive) => {
    const cell = document.createElement("span");
    cell.className = `mini-cell${isActive ? ` active ${tile.color}` : ""}`;
    wrap.appendChild(cell);
  });
}

function renderTile(tile) {
  const fragment = tileTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".tile-card");
  const icon = fragment.querySelector(".tile-icon");
  const title = fragment.querySelector(".tile-title");
  const count = fragment.querySelector(".tile-count");
  const cellsWrap = fragment.querySelector(".cells");

  card.classList.add(tile.color);
  icon.textContent = tile.icon;
  title.textContent = tile.name;
  count.textContent = `${tile.cells.filter(Boolean).length}/${TOTAL_DAYS}`;

  tile.cells.forEach((isActive, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `cell${isActive ? ` active ${tile.color}` : ""}`;
    button.setAttribute("aria-label", `${tile.name} day ${index + 1}`);
    button.addEventListener("click", () => toggleCell(tile.id, index));
    cellsWrap.appendChild(button);
  });

  return fragment;
}

function renderPreviewWidgets() {
  const deepFocus = tiles.find((tile) => tile.id === "deep-focus") || tiles[0];
  const moveMyBody = tiles.find((tile) => tile.id === "move-my-body") || tiles[1] || tiles[0];
  const brainDump = tiles.find((tile) => tile.id === "brain-dump") || tiles[2] || tiles[0];

  if (deepFocus) buildMiniGrid("focus-preview", deepFocus);
  if (moveMyBody) buildMiniGrid("tidy-preview", moveMyBody);
  if (brainDump) buildMiniGrid("winddown-preview", brainDump);
}

function render() {
  tiles = ensureTilesExist(tiles);
  if (emptyBoard) {
    emptyBoard.hidden = tiles.length > 0;
  }
  tileGrid.innerHTML = "";
  tiles.forEach((tile) => {
    tileGrid.appendChild(renderTile(tile));
  });
  renderStats();
  renderAnchor();
  renderPreviewWidgets();
}

function scheduleSync() {
  if (!supabase || !currentSession?.user) return;
  clearTimeout(deferredSyncTimer);
  deferredSyncTimer = setTimeout(() => {
    syncToCloud().catch(() => {
      setAuthMessage("Cloud sync hit a small issue. Your device copy is still safe.");
    });
  }, 250);
}

function persistAndRender() {
  saveTilesLocal();
  saveFocusAnchorLocal();
  render();
  scheduleSync();
}

function toggleCell(tileId, cellIndex) {
  tiles = tiles.map((tile) => {
    if (tile.id !== tileId) return tile;
    const nextCells = [...tile.cells];
    nextCells[cellIndex] = nextCells[cellIndex] ? 0 : 1;
    return { ...tile, cells: nextCells };
  });

  persistAndRender();
}

function addTile(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const palette = ["green", "blue", "orange"][tiles.length % 3];
  const icons = ["✨", "🧠", "🌙", "💧", "📘", "🎯", "📝", "🏃"];
  const icon = icons[tiles.length % icons.length];

  tiles.push(
    normalizeTile({
      id: slug || `tile-${Date.now()}`,
      name,
      icon,
      color: palette,
      cells: new Array(TOTAL_DAYS).fill(0)
    })
  );

  persistAndRender();
}

async function ensureProfile(user) {
  if (!supabase || !user) return;
  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: user.email?.split("@")[0] || "Neuroflow User"
  });
}

async function syncToCloud() {
  if (!supabase || !currentSession?.user) return;
  const user = currentSession.user;

  await ensureProfile(user);

  const trackerRows = tiles.map((tile, index) => ({
    id: tile.id,
    user_id: user.id,
    title: tile.name,
    icon: tile.icon,
    color: tile.color,
    position: index,
    archived: false
  }));

  await supabase.from("trackers").upsert(trackerRows);

  const entryRows = [];
  tiles.forEach((tile) => {
    tile.cells.forEach((completed, dayIndex) => {
      entryRows.push({
        tracker_id: tile.id,
        day_index: dayIndex,
        completed: Boolean(completed)
      });
    });
  });

  if (entryRows.length) {
    await supabase.from("tracker_entries").upsert(entryRows, {
      onConflict: "tracker_id,day_index"
    });
  }

  localStorage.setItem("neuroflow_cloud_anchor", focusAnchor);
  setAuthMessage(`Signed in as ${user.email}. Progress can now sync across devices.`);
}

async function loadFromCloud() {
  if (!supabase || !currentSession?.user) return;
  const user = currentSession.user;

  const { data: trackerRows, error: trackerError } = await supabase
    .from("trackers")
    .select("id,title,icon,color,position")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("position", { ascending: true });

  if (trackerError) throw trackerError;

  if (!trackerRows || trackerRows.length === 0) {
    tiles = ensureTilesExist(tiles);
    await syncToCloud();
    render();
    return;
  }

  const trackerIds = trackerRows.map((row) => row.id);
  const { data: entryRows, error: entryError } = await supabase
    .from("tracker_entries")
    .select("tracker_id,day_index,completed")
    .in("tracker_id", trackerIds);

  if (entryError) throw entryError;

  tiles = ensureTilesExist(
    trackerRows.map((row) => {
    const base = new Array(TOTAL_DAYS).fill(0);
    entryRows
      .filter((entry) => entry.tracker_id === row.id)
      .forEach((entry) => {
        base[entry.day_index] = entry.completed ? 1 : 0;
      });

    return normalizeTile({
      id: row.id,
      name: row.title,
      icon: row.icon,
      color: row.color,
      cells: base
    });
    })
  );

  focusAnchor = localStorage.getItem("neuroflow_cloud_anchor") || focusAnchor;
  saveTilesLocal();
  saveFocusAnchorLocal();
  render();
  setAuthMessage(`Signed in as ${user.email}. Cloud version loaded.`);
}

function getSupabaseConfig() {
  return window.NEUROFLOW_SUPABASE_CONFIG || { url: "", anonKey: "" };
}

async function initSupabase() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !window.supabase?.createClient) {
    setAuthMessage("Guest mode is active. Add Supabase keys later to enable sign-in and sync.");
    return;
  }

  supabase = window.supabase.createClient(url, anonKey);

  const {
    data: { session }
  } = await supabase.auth.getSession();

  currentSession = session;
  signOutButton.hidden = !currentSession;

  if (currentSession?.user) {
    await loadFromCloud();
  } else {
    setAuthMessage("Guest mode is active. Sign in when you want your progress across devices.");
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentSession = session;
    signOutButton.hidden = !session;

    if (session?.user) {
      await loadFromCloud();
    } else {
      setAuthMessage("Signed out. Guest mode is active on this device.");
    }
  });
}

addTileButton.addEventListener("click", () => {
  const name = prompt("Name your next focus tile");
  if (!name) return;
  addTile(name);
});

resetWeekButton.addEventListener("click", () => {
  tiles = tiles.map((tile) => ({ ...tile, cells: tile.cells.map(() => 0) }));
  persistAndRender();
});

saveFocusButton.addEventListener("click", () => {
  focusAnchor = focusInput.value.trim();
  persistAndRender();
});

clearFocusButton.addEventListener("click", () => {
  focusAnchor = "";
  persistAndRender();
});

loadSampleButton.addEventListener("click", () => {
  focusAnchor = "Do deep focus for a bit, move my body, and empty my mind onto the page.";
  persistAndRender();
});

restoreDefaultsButton.addEventListener("click", () => {
  tiles = getDefaultTiles();
  persistAndRender();
});

magicLinkButton.addEventListener("click", async () => {
  if (!supabase) {
    setAuthMessage("Supabase is not connected yet. You can keep using guest mode for now.");
    return;
  }

  const email = emailInput.value.trim();
  if (!email) {
    setAuthMessage("Add your email first, then I can send the magic link.");
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href
    }
  });

  if (error) {
    setAuthMessage("Magic link failed to send. Double-check your Supabase setup.");
    return;
  }

  setAuthMessage(`Magic link sent to ${email}. Open your email to continue.`);
});

signOutButton.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installAppButton.hidden = false;
});

installAppButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installAppButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

if (isIosSafari() && iosInstallNote) {
  iosInstallNote.hidden = false;
}

render();
initSupabase().catch(() => {
  tiles = ensureTilesExist(tiles);
  saveTilesLocal();
  render();
  setAuthMessage("Guest mode is active. Supabase can be connected when you are ready.");
});
