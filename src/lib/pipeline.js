export const STAGES = ["New", "Ready", "Paid", "Scheduled"];

export function isValidStage(stage) {
  return STAGES.includes(stage);
}

export function stageIndex(stage) {
  const idx = STAGES.indexOf(stage);
  return idx === -1 ? null : idx;
}

export function nextStage(stage) {
  const idx = stageIndex(stage);
  if (idx === null || idx >= STAGES.length - 1) return stage;
  return STAGES[idx + 1];
}

export function canAdvance(current, target) {
  if (!isValidStage(current) || !isValidStage(target)) return false;
  return stageIndex(target) >= stageIndex(current);
}

export function normalizeStage(stage) {
  if (!stage) return STAGES[0];
  const match = STAGES.find((s) => s.toLowerCase() === String(stage).toLowerCase());
  return match || STAGES[0];
}
