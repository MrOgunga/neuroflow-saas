const STORAGE_KEY = "neuroflow_tiles_v1";

const defaultTiles = [
  { id: "reading", name: "Reading", icon: "📚", color: "green", cells: [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1] },
  { id: "no-junk-food", name: "No Junk Food", icon: "🥗", color: "blue", cells: [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "running", name: "Running", icon: "🏃", color: "orange", cells: [1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0] }
];

const tileGrid = document.getElementById("tile-grid");
const tileTemplate = document.getElementById("tile-template");
const tilesActive = document.getElementById("tiles-active");
const totalCompletions = document.getElementById("total-completions");
const supportMessage = document.getElementById("support-message");
const addTileButton = document.getElementById("add-tile-button");
const resetWeekButton = document.getElementById("reset-week-button");

function loadTiles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultTiles;
  } catch {
    return defaultTiles;
  }
}

let tiles = loadTiles();

function saveTiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
}

function getCompletionCount() {
  return tiles.reduce((sum, tile) => sum + tile.cells.filter(Boolean).length, 0);
}

function getSupportCopy(count) {
  if (count === 0) return "You only need one next step.";
  if (count < 8) return "Momentum is still momentum, even when it is small.";
  if (count < 18) return "You are building proof, not perfection.";
  return "This is what steady effort can look like.";
}

function renderStats() {
  const total = getCompletionCount();
  tilesActive.textContent = String(tiles.length);
  totalCompletions.textContent = String(total);
  supportMessage.textContent = getSupportCopy(total);
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

function render() {
  tileGrid.innerHTML = "";
  tiles.forEach((tile) => {
    tileGrid.appendChild(renderTile(tile));
  });
  renderStats();
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

render();
