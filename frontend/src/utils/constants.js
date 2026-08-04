// ---------------------------------------------------------------------------
// Card status classification colors
// ---------------------------------------------------------------------------
export const STATUS_COLORS = {
  Underrated: {
    bg: 'bg-green-900/30',
    text: 'text-green-400',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
  },
  'Strong/Meta': {
    bg: 'bg-blue-900/30',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  'Weak/Niche': {
    bg: 'bg-gray-700/30',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    dot: 'bg-gray-400',
  },
  Overrated: {
    bg: 'bg-red-900/30',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
}

// ---------------------------------------------------------------------------
// Default card elixir costs (fallback)
// ---------------------------------------------------------------------------
export const DEFAULT_ELIXIR_COST = 3.5

// ---------------------------------------------------------------------------
// Elixir penalty thresholds
// ---------------------------------------------------------------------------
export const ELIXIR_THRESHOLDS = {
  low: 2.8,
  high: 4.2,
  penaltyFactor: 0.15,
}

// ---------------------------------------------------------------------------
// Prediction thresholds
// ---------------------------------------------------------------------------
export const PREDICTION_THRESHOLDS = {
  favorable: 0.55,
  unfavorable: 0.45,
}

// ---------------------------------------------------------------------------
// Default card level for prediction
// ---------------------------------------------------------------------------
export const DEFAULT_CARD_LEVEL = 11

// ---------------------------------------------------------------------------
// Min / Max card levels
// ---------------------------------------------------------------------------
export const CARD_LEVEL_RANGE = {
  min: 1,
  max: 16,
}

// ---------------------------------------------------------------------------
// Min / Max trophies
// ---------------------------------------------------------------------------
export const TROPHY_RANGE = {
  min: 1000,
  max: 15000,
  default: 11500,
}

// ---------------------------------------------------------------------------
// Required deck size
// ---------------------------------------------------------------------------
export const DECK_SIZE = 8

// ---------------------------------------------------------------------------
// Helper to get card rarity by name
// ---------------------------------------------------------------------------
export function getCardRarity(cardName) {
  const champions = ["Archer Queen", "Golden Knight", "Mighty Miner", "Monk", "Little Prince", "Berserker", "Goblinstein"]
  const legendaries = ["Bandit", "Electro Wizard", "Fisherman", "Ice Wizard", "Inferno Dragon", "Lumberjack", "Magic Archer", "Mega Knight", "Miner", "Mother Witch", "Night Witch", "Phoenix", "Princess", "Ram Rider", "Royal Ghost", "Sparky", "The Log", "Lava Hound", "Graveyard"]
  const epics = ["Baby Dragon", "Balloon", "Bowler", "Clone", "Dark Prince", "Executioner", "Freeze", "Giant Skeleton", "Goblin Barrel", "Goblin Drill", "Guards", "Hunter", "Mirror", "P.E.K.K.A", "Poison", "Prince", "Rage", "Tornado", "Witch", "X-Bow", "Skeleton Army", "Electro Dragon"]
  const rares = ["Battle Healer", "Bomb Tower", "Dart Goblin", "Elixir Collector", "Elixir Golem", "Flying Machine", "Furnace", "Giant", "Goblin Cage", "Goblin Hut", "Hog Rider", "Ice Golem", "Inferno Tower", "Mini P.E.K.K.A", "Musketeer", "Royal Hogs", "Three Musketeers", "Tombstone", "Valkyrie", "Wizard", "Heal Spirit", "Battle Ram", "Earthquake"]
  
  if (champions.includes(cardName)) return 'champion'
  if (legendaries.includes(cardName)) return 'legendary'
  if (epics.includes(cardName)) return 'epic'
  if (rares.includes(cardName)) return 'rare'
  return 'common'
}
