const STORAGE_KEY = "neuroflow_tiles_v5";
const FOCUS_KEY = "neuroflow_daily_anchor_v4";
const TOTAL_DAYS = 31;
const SYNC_DEBOUNCE_MS = 900;
const TRACKER_ID_PREFIX = "tracker";
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
const anchorNote = document.getElementById("anchor-note");
const emailInput = document.getElementById("email-input");
const magicLinkButton = document.getElementById("magic-link-button");
const syncNowButton = document.getElementById("sync-now-button");
const signOutButton = document.getElementById("sign-out-button");
const authStatus = document.getElementById("auth-status");
const syncStatus = document.getElementById("sync-status");
const authProgress = document.getElementById("auth-progress");
const authProgressFill = document.getElementById("auth-progress-fill");
const authProgressText = document.getElementById("auth-progress-text");
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
const yearPreviewGrid = document.getElementById("year-preview-grid");

let deferredPrompt = null;
let syncTimer = null;
let currentUser = null;
let magicLinkProgressTimer = null;

const yearPreviewMonths = [
  { label: "Jan", days: 31, tone: "neon", activeDays: [0, 2, 3, 6, 8, 13, 14, 18, 22, 25, 27, 30] },
  { label: "Feb", days: 28, tone: "orange", activeDays: [1, 4, 5, 6, 10, 14, 17, 18, 21, 25] },
  { label: "Mar", days: 31, tone: "white", activeDays: [0, 1, 5, 9, 10, 13, 14, 19, 21, 24, 28] },
  { label: "Apr", days: 30, tone: "blue", activeDays: [2, 3, 7, 8, 12, 16, 18, 22, 23, 26] },
  { label: "May", days: 31, tone: "neon", activeDays: [0, 4, 5, 6, 10, 11, 15, 19, 20, 24, 27, 30] },
  { label: "Jun", days: 30, tone: "orange", activeDays: [1, 2, 6, 9, 13, 14, 18, 21, 22, 27] },
  { label: "Jul", days: 31, tone: "white", activeDays: [0, 1, 2, 7, 8, 12, 16, 17, 20, 24, 28, 29] },
  { label: "Aug", days: 31, tone: "blue", activeDays: [3, 4, 5, 9, 13, 14, 18, 19, 22, 26, 27, 30] },
  { label: "Sep", days: 30, tone: "orange", activeDays: [0, 1, 5, 8, 9, 13, 17, 18, 21, 24, 28] },
  { label: "Oct", days: 31, tone: "neon", activeDays: [2, 3, 4, 8, 11, 12, 16, 20, 21, 25, 29, 30] },
  { label: "Nov", days: 30, tone: "white", activeDays: [1, 5, 6, 10, 14, 15, 18, 22, 23, 27] },
  { label: "Dec", days: 31, tone: "blue", activeDays: [0, 4, 5, 9, 12, 13, 17, 18, 22, 26, 27, 30] }
];

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

function slugifyTileName(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createTileId(baseSlug = "tile") {
  return `tile-${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTile(tile) {
  const legacy = legacyTileMigrations[tile.id];
  const cells = Array.isArray(tile.cells) ? [...tile.cells] : [];
  while (cells.length < TOTAL_DAYS) cells.push(0);
  const resolvedTile = {
    ...tile,
    ...(legacy || {})
  };
  const resolvedName = typeof resolvedTile.name === "string" && resolvedTile.name.trim()
    ? resolvedTile.name.trim()
    : "Untitled Tile";
  const resolvedSlug = slugifyTileName(resolvedName) || "tile";
  const resolvedId =
    typeof resolvedTile.id === "string" && resolvedTile.id.trim()
      ? resolvedTile.id
      : createTileId(resolvedSlug);

  return {
    ...resolvedTile,
    id: resolvedId,
    name: resolvedName,
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

function setMagicLinkLoadingState(isLoading, options = {}) {
  const { percent = 0, label = "Preparing your sign-in link..." } = options;

  if (magicLinkButton) {
    magicLinkButton.disabled = isLoading;
    magicLinkButton.classList.toggle("loading", isLoading);
    magicLinkButton.textContent = isLoading ? `Sending... ${percent}%` : "Send Magic Link";
  }

  if (authProgress) authProgress.hidden = !isLoading;
  if (authProgressFill) authProgressFill.style.width = `${percent}%`;
  if (authProgressText) authProgressText.textContent = label;
}

function startMagicLinkProgress() {
  window.clearInterval(magicLinkProgressTimer);
  const steps = [
    { percent: 18, label: "Checking your email address..." },
    { percent: 42, label: "Talking to secure sign-in..." },
    { percent: 74, label: "Preparing your magic link..." },
    { percent: 92, label: "Almost done..." }
  ];

  let index = 0;
  setMagicLinkLoadingState(true, steps[index]);

  magicLinkProgressTimer = window.setInterval(() => {
    index += 1;
    if (index >= steps.length) {
      window.clearInterval(magicLinkProgressTimer);
      return;
    }
    setMagicLinkLoadingState(true, steps[index]);
  }, 450);
}

function stopMagicLinkProgress() {
  window.clearInterval(magicLinkProgressTimer);
  magicLinkProgressTimer = null;
  setMagicLinkLoadingState(false);
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
  if (anchorNote) {
    anchorNote.textContent = currentUser
      ? "Your daily anchor now syncs with your account, so it follows you across devices."
      : "In guest mode, your daily anchor stays on this device until you sign in.";
  }
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

function renderYearPreview() {
  if (!yearPreviewGrid) return;

  yearPreviewGrid.innerHTML = "";

  yearPreviewMonths.forEach((month) => {
    const monthCard = document.createElement("section");
    const title = document.createElement("p");
    const cellsWrap = document.createElement("div");

    monthCard.className = `month-preview ${month.tone}`;
    title.className = "month-preview-title";
    title.textContent = month.label;
    cellsWrap.className = "month-preview-cells";

    for (let dayIndex = 0; dayIndex < month.days; dayIndex += 1) {
      const cell = document.createElement("span");
      const isActive = month.activeDays.includes(dayIndex);
      cell.className = `month-cell${isActive ? " active" : ""}`;
      cell.setAttribute("aria-hidden", "true");
      cellsWrap.appendChild(cell);
    }

    monthCard.appendChild(title);
    monthCard.appendChild(cellsWrap);
    yearPreviewGrid.appendChild(monthCard);
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
  renderYearPreview();
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

function hasMeaningfulLocalTiles() {
  return getCompletionCount() > 0;
}

function hasMeaningfulLocalAnchor() {
  return focusAnchor.trim().length > 0;
}

function hasMeaningfulLocalState() {
  return hasMeaningfulLocalTiles() || hasMeaningfulLocalAnchor();
}

function getCloudSafeTileId(userId, baseSlug, index = 0) {
  const cleanSlug = slugifyTileName(baseSlug) || `tile-${index + 1}`;
  return `${TRACKER_ID_PREFIX}-${userId}-${cleanSlug}`;
}

function isCloudSafeTileId(tileId, userId) {
  return Boolean(tileId && userId && tileId.startsWith(`${TRACKER_ID_PREFIX}-${userId}-`));
}

function ensureCloudSafeTileIds(userId) {
  if (!userId) return { didChange: false, legacyIds: [] };

  const seenIds = new Set();
  const legacyIds = [];
  let didChange = false;

  tiles = tiles.map((tile, index) => {
    const currentId = tile.id;
    let nextId = currentId;

    if (!isCloudSafeTileId(currentId, userId) || seenIds.has(currentId)) {
      nextId = getCloudSafeTileId(userId, tile.name || currentId, index);
      let suffix = 2;

      while (seenIds.has(nextId)) {
        nextId = `${getCloudSafeTileId(userId, tile.name || currentId, index)}-${suffix}`;
        suffix += 1;
      }

      if (currentId && currentId !== nextId) {
        legacyIds.push(currentId);
      }

      didChange = true;
    }

    seenIds.add(nextId);
    return nextId === currentId ? tile : { ...tile, id: nextId };
  });

  if (didChange) saveTiles();
  return { didChange, legacyIds };
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
  const slug = slugifyTileName(name) || "tile";
  const palette = colorOverride || ["green", "blue", "orange"][tiles.length % 3];
  const icons = ["✨", "🧠", "🌙", "💧", "📘", "🎯", "📝", "🏃"];
  const icon = iconOverride || icons[tiles.length % icons.length];

  tiles.push(
    normalizeTile({
      id: createTileId(getUniqueTileId(slug)),
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

async function loadAnchorFromCloud(userId) {
  if (!supabaseClient || !userId) return null;

  const { data, error } = await supabaseClient
    .from("daily_anchors")
    .select("content")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data.content || "";
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

  const { silent = false, legacyTrackerIds = [] } = options;

  try {
    if (!silent) setSyncMessage("Syncing your boards to the cloud...");

    const { trackers, entries } = buildCloudPayload(currentUser.id);

    const { error: trackerError } = await supabaseClient
      .from("trackers")
      .upsert(trackers, { onConflict: "id" });

    if (trackerError) throw trackerError;

    if (legacyTrackerIds.length > 0) {
      const { error: deleteLegacyError } = await supabaseClient
        .from("trackers")
        .delete()
        .eq("user_id", currentUser.id)
        .in("id", legacyTrackerIds);

      if (deleteLegacyError) throw deleteLegacyError;
    }

    const { error: entryError } = await supabaseClient
      .from("tracker_entries")
      .upsert(entries, { onConflict: "tracker_id,day_index" });

    if (entryError) throw entryError;

    if (focusAnchor.trim()) {
      const { error: anchorError } = await supabaseClient.from("daily_anchors").upsert(
        {
          user_id: currentUser.id,
          content: focusAnchor.trim(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

      if (anchorError) throw anchorError;
    } else {
      const { error: deleteAnchorError } = await supabaseClient
        .from("daily_anchors")
        .delete()
        .eq("user_id", currentUser.id);

      if (deleteAnchorError) throw deleteAnchorError;
    }

    setSyncMessage("Your boards and daily anchor are synced to your account.");
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
    setSyncMessage("Checking your cloud data...");

    await ensureProfile(currentUser);
    const [cloudTiles, cloudAnchor] = await Promise.all([
      loadTilesFromCloud(currentUser.id),
      loadAnchorFromCloud(currentUser.id)
    ]);

    if (cloudTiles.length > 0) {
      tiles = cloudTiles;
      saveTiles();
    }

    if (cloudAnchor !== null) {
      focusAnchor = cloudAnchor;
      saveFocusAnchor();
    }

    const { legacyIds } = ensureCloudSafeTileIds(currentUser.id);
    render();

    if (cloudTiles.length > 0 || cloudAnchor !== null) {
      setSyncMessage("Your synced boards and daily anchor are ready on this device.");
      if (legacyIds.length > 0) {
        await syncTilesToCloud({ silent: true, legacyTrackerIds: legacyIds });
      }
      return;
    }

    if (hasMeaningfulLocalState()) {
      await syncTilesToCloud({ legacyTrackerIds: legacyIds });
    } else {
      setSyncMessage("Your account is ready. Start tracking and we’ll keep your boards and anchor in sync.");
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
    setSyncMessage("Sign in to sync your focus tiles and daily anchor across devices.");
  }

  supabaseClient.auth.onAuthStateChange(async (event, sessionData) => {
    if (event === "SIGNED_OUT") {
      currentUser = null;
      updateAuthUi();
      setAuthMessage("Signed out. Guest mode is active on this device.");
      setSyncMessage("Your local progress is still here. Sign in again any time to sync your boards and anchor.");
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
    if (currentUser) setSyncMessage("Saving your daily anchor to the cloud...");
    queueCloudSync();
    renderAnchor();
  });
}

if (clearFocusButton) {
  clearFocusButton.addEventListener("click", () => {
    focusAnchor = "";
    saveFocusAnchor();
    if (currentUser) setSyncMessage("Removing your daily anchor from the cloud...");
    queueCloudSync();
    renderAnchor();
  });
}

if (loadSampleButton) {
  loadSampleButton.addEventListener("click", () => {
    focusAnchor = "Clear one task, journal for a few minutes, and move my body a little.";
    saveFocusAnchor();
    if (currentUser) setSyncMessage("Saving your daily anchor to the cloud...");
    queueCloudSync();
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
      startMagicLinkProgress();
      setAuthMessage(`Sending a magic link to ${email}...`);
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getEmailRedirectUrl()
        }
      });

      if (error) throw error;
      setMagicLinkLoadingState(true, {
        percent: 100,
        label: `Magic link sent to ${email}. Check your inbox now.`
      });
      setAuthMessage(`Magic link sent to ${email}. Open it on this device to finish sign-in.`);
      setSyncMessage("Once you’re in, we’ll load your cloud boards and daily anchor here.");
      window.setTimeout(() => {
        stopMagicLinkProgress();
      }, 1200);
    } catch (error) {
      console.error(error);
      stopMagicLinkProgress();
      const reason = error?.message ? `Reason: ${error.message}` : "Please try again in a moment.";
      setAuthMessage(`We couldn’t send the magic link yet. ${reason}`);
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
