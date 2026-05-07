const STORAGE_KEY = "neuroflow_tiles_v2";
const FOCUS_KEY = "neuroflow_daily_anchor_v1";

const defaultTiles = [
  {
    id: "morning-meds",
    name: "Morning Meds",
    icon: "💊",
    color: "green",
    cells: [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1]
  },
  {
    id: "hydration",
    name: "Hydration",
    icon: "💧",
    color: "blue",
    cells: [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "reset-task",
    name: "One Reset Task",
    icon: "🧹",
    color: "orange",
    cells: [1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0]
  }
];

const tileGrid = document.getElementById("tile-grid");
const tileTemplate = document.getElementById("tile-template");
const tilesActive = document.getElementById("tiles-active");
const totalCompletions = document.getElementById("total-completions");
const supportMessage = document.getElementById("support-message");
const addTileButton = document.getElementById("add-tile-button");
const resetWeekButton = document.getElementById("reset-week-button");
const installAppButton = document.getElementById("install-app-button");
const saveFocusButton = document.getElementById("save-focus-button");
const clearFocusButton = document.getElementById("clear-focus-button");
const loadSampleButton = document.getElementById("load-sample-button");
const focusInput = document.getElementById("focus-input");
const anchorText = document.getElementById("anchor-text");

let deferredPrompt = null;

function loadTiles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultTiles;
  } catch {
    return defaultTiles;
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

function toggleCell(tileId, cellIndex) {
  tiles = tiles.map((tile) => {
    if (tile.id !== tileId) return tile;
    const nextCells = [...tile.cells];
    nextCells[cellIndex] = nextCells[cellIndex] ? 0 : 1;
    return { ...tile, cells: nextCells };
  });

  saveTiles();
  render();
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
  count.textContent = tile.cells.filter(Boolean).length;

  tile.cells.forEach((isActive, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `cell${isActive ? ` active ${tile.color}` : ""}`;
    button.setAttribute("aria-label", `${tile.name} cell ${index + 1}`);
    button.addEventListener("click", () => toggleCell(tile.id, index));
    cellsWrap.appendChild(button);
  });

  return fragment;
}

function renderPreviewWidgets() {
  const meds = tiles.find((tile) => tile.id === "morning-meds") || tiles[0];
  const hydration = tiles.find((tile) => tile.id === "hydration") || tiles[1] || tiles[0];
  const resetTask = tiles.find((tile) => tile.id === "reset-task") || tiles[2] || tiles[0];

  if (meds) buildMiniGrid("meds-preview", meds);
  if (hydration) buildMiniGrid("hydration-preview", hydration);
  if (resetTask) buildMiniGrid("reset-preview", resetTask);
}

function render() {
  tileGrid.innerHTML = "";
  tiles.forEach((tile) => {
    tileGrid.appendChild(renderTile(tile));
  });
  renderStats();
  renderAnchor();
  renderPreviewWidgets();
}

addTileButton.addEventListener("click", () => {
  const name = prompt("Name your next focus tile");
  if (!name) return;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const palette = ["green", "blue", "orange"][tiles.length % 3];
  const icons = ["✨", "🧠", "🌙", "💧", "📘", "🎯"];
  const icon = icons[tiles.length % icons.length];

  tiles.push({
    id: slug || `tile-${Date.now()}`,
    name,
    icon,
    color: palette,
    cells: new Array(28).fill(0)
  });

  saveTiles();
  render();
});

resetWeekButton.addEventListener("click", () => {
  tiles = tiles.map((tile) => ({ ...tile, cells: tile.cells.map(() => 0) }));
  saveTiles();
  render();
});

saveFocusButton.addEventListener("click", () => {
  focusAnchor = focusInput.value.trim();
  saveFocusAnchor();
  renderAnchor();
});

clearFocusButton.addEventListener("click", () => {
  focusAnchor = "";
  saveFocusAnchor();
  renderAnchor();
});

loadSampleButton.addEventListener("click", () => {
  focusAnchor = "Take meds, drink water, and finish one small task before switching contexts.";
  saveFocusAnchor();
  renderAnchor();
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

render();
