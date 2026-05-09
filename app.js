const STORAGE_KEY = "neuroflow_tiles_v5";
const FOCUS_KEY = "neuroflow_daily_anchor_v4";
const TOTAL_DAYS = 31;
const SYNC_DEBOUNCE_MS = 900;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

const legacyTileMigrations = {
  "deep-focus": { id: "to-do-list", name: "To-Do List", icon: "✅", color: "green" },
  "move-my-body": { id: "journaling", name: "Journaling", icon: "📝", color: "blue" },
  "brain-dump": { id: "exercising", name: "Exercising", icon: "🏃", color: "orange" }
};

const defaultTiles = [
  {
    id: "to-do-list",
    name: "To-Do List",
    icon: "✅",
    color: "green",
    cells: [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0]
  },
  {
    id: "journaling",
    name: "Journaling",
    icon: "📝",
    color: "blue",
    cells: [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
  },
  {
    id: "exercising",
    name: "Exercising",
    icon: "🏃",
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
const createTileButton = document.getElementById("create-tile-button");
const tileNameInput = document.getElementById("tile-name-input");
const tileIconSelect = document.getElementById("tile-icon-select");
const tileColorSelect = document.getElementById("tile-color-select");
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
const syncNowButton = document.getElementById("sync-now-button");
const signOutButton = document.getElementById("sign-out-button");
const authStatus = document.getElementById("auth-status");
const syncStatus = document.getElementById("sync-status");
const accountPill = document.getElementById("account-pill");
const iosInstallNote = document.getElementById("ios-install-note");
const emptyBoard = document.getElementById("empty-board");
const weekSignal = document.getElementById("week-signal");
const weeklyCompletions = document.getElementById("weekly-completions");
const bestStreak = document.getElementById("best-streak");
const storageMode = document.getElementById("storage-mode");
const overviewTitle = document.getElementById("overview-title");
const overviewCopy = document.getElementById("overview-copy");
const overviewBadge = document.getElementById("overview-badge");

let deferredPrompt = null;
let syncTimer = null;
let currentUser = null;

const supabaseConfig = window.NEUROFLOW_SUPABASE_CONFIG || {};
const supabaseClient =
  window.supabase?.createClient && supabaseConfig.url && supabaseConfig.anonKey
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
    : null;

function isIosSafari() {
  const ua = window.navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isCriOS = /CriOS/.test(ua);
  return isIOS && isWebkit && !isCriOS;
}

function normalizeTile(tile) {
  const legacy = legacyTileMigrations[tile.id];
  const cells = Array.isArray(tile.cells) ? [...tile.cells] : [];
  while (cells.length < TOTAL_DAYS) cells.push(0);
  return {
    ...tile,
    ...(legacy || {}),
    cells: cells.slice(0, TOTAL_DAYS)
  };
}

function getDefaultTiles() {
  return defaultTiles.map(normalizeTile);
}

function loadTiles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : getDefaultTiles();
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(normalizeTile) : getDefaultTiles();
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

function saveTiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
}

function saveFocusAnchor() {
  localStorage.setItem(FOCUS_KEY, focusAnchor);
}

function setAuthMessage(message) {
  if (authStatus) authStatus.textContent = message;
}

function setSyncMessage(message) {
  if (syncStatus) syncStatus.textContent = message;
}

function getCompletionCount() {
  return tiles.reduce((sum, tile) => sum + tile.cells.filter(Boolean).length, 0);
}

function getWeeklyCompletions() {
  return tiles.reduce((sum, tile) => {
    return sum + tile.cells.slice(-7).filter(Boolean).length;
  }, 0);
}

function getBestStreak() {
  let best = 0;

  tiles.forEach((tile) => {
    let current = 0;
    tile.cells.forEach((value) => {
      if (value) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });
  });

  return best;
}

function getSupportCopy(count) {
  if (count === 0) return "You only need one next step.";
  if (count < 8) return "Momentum still counts, even when it looks tiny.";
  if (count < 18) return "This is progress, not a performance review.";
  return "You are building visible proof that you can return.";
}

function getOverviewState() {
  const total = getCompletionCount();
  const weekly = getWeeklyCompletions();

  if (total === 0) {
    return {
      title: "A steady place to restart",
      copy: "Start with one small return point and let the rest stay quiet for a minute."
    };
  }

  if (weekly < 4) {
    return {
      title: "You are back in motion",
      copy: "Small check-ins count here. The goal is to re-enter, not catch up perfectly."
    };
  }

  if (weekly < 10) {
    return {
      title: "Your rhythm is showing up",
      copy: "You are building a pattern your future self can return to without starting over."
    };
  }

  return {
    title: "You have visible momentum",
    copy: "This is what a supportive system feels like: clear, forgiving, and easy to pick back up."
  };
}

function renderStats() {
  if (tilesActive) tilesActive.textContent = String(tiles.length);
  if (totalCompletions) totalCompletions.textContent = String(getCompletionCount());
  if (supportMessage) supportMessage.textContent = getSupportCopy(getCompletionCount());
  if (weekSignal) {
    const weekly = getWeeklyCompletions();
    weekSignal.textContent = `${weekly} ${weekly === 1 ? "check-in" : "check-ins"}`;
  }
  if (weeklyCompletions) weeklyCompletions.textContent = String(getWeeklyCompletions());
  if (bestStreak) {
    const streak = getBestStreak();
    bestStreak.textContent = `${streak} ${streak === 1 ? "day" : "days"}`;
  }
  if (storageMode) storageMode.textContent = currentUser ? "Cloud sync" : "Local only";
  const overview = getOverviewState();
  if (overviewTitle) overviewTitle.textContent = overview.title;
  if (overviewCopy) overviewCopy.textContent = overview.copy;
}

function renderAnchor() {
  if (focusInput) focusInput.value = focusAnchor;
  if (anchorText) anchorText.textContent = focusAnchor || "You haven’t saved a daily anchor yet.";
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

function getTimelineDays() {
  const days = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let offset = TOTAL_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    days.push({
      dayNumber: date.getDate(),
      weekday: WEEKDAY_FORMATTER.format(date).slice(0, 1),
      fullWeekday: WEEKDAY_FORMATTER.format(date),
      shortDate: SHORT_DATE_FORMATTER.format(date)
    });
  }

  return days;
}

function getTimelineRangeLabel(timelineDays) {
  if (!timelineDays.length) return "";
  const first = timelineDays[0];
  const last = timelineDays[timelineDays.length - 1];
  return `${first.shortDate} - ${last.shortDate}`;
}

function renderPreviewWidgets() {
  const todoList = tiles.find((tile) => tile.id === "to-do-list") || tiles[0];
  const journaling = tiles.find((tile) => tile.id === "journaling") || tiles[1] || tiles[0];
  const exercising = tiles.find((tile) => tile.id === "exercising") || tiles[2] || tiles[0];
  if (todoList) buildMiniGrid("focus-preview", todoList);
  if (journaling) buildMiniGrid("tidy-preview", journaling);
  if (exercising) buildMiniGrid("winddown-preview", exercising);
}

function updateAuthUi() {
  const signedIn = Boolean(currentUser);

  if (emailInput) emailInput.hidden = signedIn;
  if (magicLinkButton) magicLinkButton.hidden = signedIn;
  if (signOutButton) signOutButton.hidden = !signedIn;
  if (syncNowButton) syncNowButton.hidden = !signedIn;
  if (accountPill) accountPill.textContent = signedIn ? "Synced Account" : "Guest Mode";
  if (overviewBadge) overviewBadge.textContent = signedIn ? "Synced" : "Local";
}

function hasMeaningfulLocalState() {
  return getCompletionCount() > 0 || focusAnchor.trim().length > 0;
}

function queueCloudSync() {
  if (!currentUser || !supabaseClient) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncTilesToCloud({ silent: true });
  }, SYNC_DEBOUNCE_MS);
}

function persistTiles() {
  saveTiles();
  queueCloudSync();
}

function toggleCell(tileId, cellIndex) {
  tiles = tiles.map((tile) => {
    if (tile.id !== tileId) return tile;
    const nextCells = [...tile.cells];
    nextCells[cellIndex] = nextCells[cellIndex] ? 0 : 1;
    return { ...tile, cells: nextCells };
  });
  persistTiles();
  render();
}

function renderTile(tile) {
  const fragment = tileTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".tile-card");
  const icon = fragment.querySelector(".tile-icon");
  const title = fragment.querySelector(".tile-title");
  const count = fragment.querySelector(".tile-count");
  const tileRange = fragment.querySelector(".tile-range");
  const weekdayStrip = fragment.querySelector(".weekday-strip");
  const cellsWrap = fragment.querySelector(".cells");
  const tileStreak = fragment.querySelector(".tile-streak");
  const timelineDays = getTimelineDays();

  card.classList.add(tile.color);
  icon.textContent = tile.icon;
  title.textContent = tile.name;
  count.textContent = `${tile.cells.filter(Boolean).length}/${TOTAL_DAYS}`;
  if (tileRange) tileRange.textContent = getTimelineRangeLabel(timelineDays);
  if (weekdayStrip) {
    weekdayStrip.innerHTML = "";
    timelineDays.slice(0, 7).forEach((day) => {
      const label = document.createElement("span");
      label.className = "weekday-pill";
      label.textContent = day.weekday;
      weekdayStrip.appendChild(label);
    });
  }
  if (tileStreak) {
    let best = 0;
    let current = 0;
    tile.cells.forEach((value) => {
      if (value) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });
    tileStreak.textContent = `${best} ${best === 1 ? "day" : "days"}`;
  }

  tile.cells.forEach((isActive, index) => {
    const dayMeta = timelineDays[index];
    const button = document.createElement("button");
    const dateLabel = document.createElement("span");
    button.type = "button";
    button.className = `cell${isActive ? ` active ${tile.color}` : ""}`;
    button.title = `${dayMeta.fullWeekday}, ${dayMeta.shortDate}`;
    button.setAttribute("aria-label", `${tile.name} ${dayMeta.fullWeekday} ${dayMeta.shortDate}`);
    dateLabel.className = "cell-date";
    dateLabel.textContent = String(dayMeta.dayNumber);
    button.addEventListener("click", () => toggleCell(tile.id, index));
    button.appendChild(dateLabel);
    cellsWrap.appendChild(button);
  });

  return fragment;
}

function render() {
  if (!Array.isArray(tiles) || tiles.length === 0) {
    tiles = getDefaultTiles();
    saveTiles();
  }

  if (tileGrid) {
    tileGrid.innerHTML = "";
    tiles.forEach((tile) => {
      tileGrid.appendChild(renderTile(tile));
    });
  }

  if (emptyBoard) emptyBoard.hidden = tiles.length > 0;
  renderStats();
  renderAnchor();
  renderPreviewWidgets();
  updateAuthUi();
}

function getUniqueTileId(baseSlug) {
  const fallback = `tile-${Date.now()}`;
  const root = baseSlug || fallback;

  if (!tiles.some((tile) => tile.id === root)) return root;

  let attempt = 2;
  let candidate = `${root}-${attempt}`;

  while (tiles.some((tile) => tile.id === candidate)) {
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }

  return candidate;
}

function addTile(name, iconOverride, colorOverride) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const palette = colorOverride || ["green", "blue", "orange"][tiles.length % 3];
  const icons = ["✨", "🧠", "🌙", "💧", "📘", "🎯", "📝", "🏃"];
  const icon = iconOverride || icons[tiles.length % icons.length];

  tiles.push(
    normalizeTile({
      id: getUniqueTileId(slug),
      name,
      icon,
      color: palette,
      cells: new Array(TOTAL_DAYS).fill(0)
    })
  );

  persistTiles();
  render();
}

function handleCreateTile() {
  const name = tileNameInput ? tileNameInput.value.trim() : "";

  if (!name) {
    if (tileNameInput) tileNameInput.focus();
    return;
  }

  addTile(name, tileIconSelect?.value, tileColorSelect?.value);

  if (tileNameInput) tileNameInput.value = "";
  if (tileIconSelect) tileIconSelect.value = "✨";
  if (tileColorSelect) tileColorSelect.value = "green";
}

function getEmailRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

async function ensureProfile(user) {
  if (!supabaseClient || !user) return;
  await supabaseClient.from("profiles").upsert(
    {
      id: user.id
    },
    { onConflict: "id" }
  );
}

function mapCloudTiles(trackers = [], entries = []) {
  const entriesByTracker = new Map();

  entries.forEach((entry) => {
    if (!entriesByTracker.has(entry.tracker_id)) {
      entriesByTracker.set(entry.tracker_id, new Array(TOTAL_DAYS).fill(0));
    }
    entriesByTracker.get(entry.tracker_id)[entry.day_index] = entry.completed ? 1 : 0;
  });

  return trackers.map((tracker) =>
    normalizeTile({
      id: tracker.id,
      name: tracker.title,
      icon: tracker.icon,
      color: tracker.color,
      cells: entriesByTracker.get(tracker.id) || new Array(TOTAL_DAYS).fill(0)
    })
  );
}

async function loadTilesFromCloud(userId) {
  if (!supabaseClient || !userId) return [];

  const { data: trackers, error: trackerError } = await supabaseClient
    .from("trackers")
    .select("id, title, icon, color, position")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("position", { ascending: true });

  if (trackerError) throw trackerError;
  if (!trackers || trackers.length === 0) return [];

  const trackerIds = trackers.map((tracker) => tracker.id);
  const { data: entries, error: entryError } = await supabaseClient
    .from("tracker_entries")
    .select("tracker_id, day_index, completed")
    .in("tracker_id", trackerIds);

  if (entryError) throw entryError;
  return mapCloudTiles(trackers, entries || []);
}

function buildCloudPayload(userId) {
  const trackers = tiles.map((tile, index) => ({
    id: tile.id,
    user_id: userId,
    title: tile.name,
    icon: tile.icon,
    color: tile.color,
    position: index,
    archived: false
  }));

  const entries = [];
  tiles.forEach((tile) => {
    tile.cells.forEach((value, dayIndex) => {
      entries.push({
        tracker_id: tile.id,
        day_index: dayIndex,
        completed: Boolean(value)
      });
    });
  });

  return { trackers, entries };
}

async function syncTilesToCloud(options = {}) {
  if (!supabaseClient || !currentUser) return;

  const { silent = false } = options;

  try {
    if (!silent) setSyncMessage("Syncing your boards to the cloud...");

    const { trackers, entries } = buildCloudPayload(currentUser.id);

    const { error: trackerError } = await supabaseClient
      .from("trackers")
      .upsert(trackers, { onConflict: "id" });

    if (trackerError) throw trackerError;

    const { error: entryError } = await supabaseClient
      .from("tracker_entries")
      .upsert(entries, { onConflict: "tracker_id,day_index" });

    if (entryError) throw entryError;

    setSyncMessage("Your focus tiles are synced. Daily anchor still stays local for now.");
  } catch (error) {
    console.error(error);
    setSyncMessage("We couldn’t sync yet. Your progress is still safe on this device.");
  }
}

async function hydrateSignedInState(user) {
  currentUser = user;
  updateAuthUi();

  if (!supabaseClient || !currentUser) return;

  try {
    setAuthMessage(`Signed in as ${currentUser.email}.`);
    setSyncMessage("Checking your cloud boards...");

    await ensureProfile(currentUser);
    const cloudTiles = await loadTilesFromCloud(currentUser.id);

    if (cloudTiles.length > 0) {
      tiles = cloudTiles;
      saveTiles();
      render();
      setSyncMessage("Cloud boards loaded on this device.");
      return;
    }

    if (hasMeaningfulLocalState()) {
      await syncTilesToCloud();
    } else {
      setSyncMessage("Your account is ready. Start tracking and we’ll sync your boards here.");
    }
  } catch (error) {
    console.error(error);
    setSyncMessage("Signed in, but cloud loading is not ready yet. Guest progress still works.");
  }
}

async function initializeAuth() {
  if (!supabaseClient) {
    setAuthMessage("Guest mode is active. Tracker interactions are live on this device.");
    setSyncMessage("Add working Supabase keys to turn on magic-link sign-in and sync.");
    render();
    return;
  }

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    await hydrateSignedInState(session.user);
  } else {
    currentUser = null;
    updateAuthUi();
    setAuthMessage("Guest mode is active. Your progress is currently saved only on this device.");
    setSyncMessage("Sign in to sync your focus tiles across devices.");
  }

  supabaseClient.auth.onAuthStateChange(async (event, sessionData) => {
    if (event === "SIGNED_OUT") {
      currentUser = null;
      updateAuthUi();
      setAuthMessage("Signed out. Guest mode is active on this device.");
      setSyncMessage("Your local progress is still here. Sign in again any time to sync.");
      render();
      return;
    }

    if (sessionData?.user) {
      await hydrateSignedInState(sessionData.user);
    }
  });

  render();
}

if (addTileButton) {
  addTileButton.addEventListener("click", () => {
    if (tileNameInput) {
      tileNameInput.focus();
      tileNameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

if (createTileButton) {
  createTileButton.addEventListener("click", handleCreateTile);
}

if (tileNameInput) {
  tileNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCreateTile();
    }
  });
}

if (resetWeekButton) {
  resetWeekButton.addEventListener("click", () => {
    tiles = tiles.map((tile) => ({ ...tile, cells: tile.cells.map(() => 0) }));
    persistTiles();
    render();
  });
}

if (saveFocusButton) {
  saveFocusButton.addEventListener("click", () => {
    focusAnchor = focusInput ? focusInput.value.trim() : "";
    saveFocusAnchor();
    renderAnchor();
  });
}

if (clearFocusButton) {
  clearFocusButton.addEventListener("click", () => {
    focusAnchor = "";
    saveFocusAnchor();
    renderAnchor();
  });
}

if (loadSampleButton) {
  loadSampleButton.addEventListener("click", () => {
    focusAnchor = "Clear one task, journal for a few minutes, and move my body a little.";
    saveFocusAnchor();
    renderAnchor();
  });
}

if (restoreDefaultsButton) {
  restoreDefaultsButton.addEventListener("click", () => {
    tiles = getDefaultTiles();
    persistTiles();
    render();
  });
}

if (magicLinkButton) {
  magicLinkButton.addEventListener("click", async () => {
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
      setAuthMessage("Add your email first and we’ll send the magic link there.");
      return;
    }

    if (!supabaseClient) {
      setAuthMessage("Supabase is not ready yet, so guest mode stays active for now.");
      return;
    }

    try {
      setAuthMessage(`Sending a magic link to ${email}...`);
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getEmailRedirectUrl()
        }
      });

      if (error) throw error;
      setAuthMessage(`Magic link sent to ${email}. Open it on this device to finish sign-in.`);
      setSyncMessage("Once you’re in, we’ll load your cloud boards here.");
    } catch (error) {
      console.error(error);
      setAuthMessage("We couldn’t send the magic link yet. Guest mode still works locally.");
    }
  });
}

if (syncNowButton) {
  syncNowButton.addEventListener("click", async () => {
    await syncTilesToCloud();
  });
}

if (signOutButton) {
  signOutButton.addEventListener("click", async () => {
    if (!supabaseClient) return;

    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error(error);
      setAuthMessage("We couldn’t sign you out cleanly, but your local progress is still safe.");
    }
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installAppButton) installAppButton.hidden = false;
});

if (installAppButton) {
  installAppButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installAppButton.hidden = true;
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

if (isIosSafari() && iosInstallNote) {
  iosInstallNote.hidden = false;
}

render();
initializeAuth().catch((error) => {
  console.error(error);
  setAuthMessage("Guest mode is active. Something blocked account setup for now.");
  setSyncMessage("Your focus tiles still work locally while we sort sync out.");
  render();
});
