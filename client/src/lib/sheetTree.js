// Pure functions over a sheet: module → group → problem.
// Everything derived (counts, percentages, "up next") is computed here on the client,
// which is why the backend only has to store flags per problem id.

export const SHEET_KEY = '__sheet';
export const groupKey = (moduleId, groupId) => `${moduleId}/${groupId}`;

/** Adds an id → location index and a depth-first order. O(N), run once per sheet load. */
export function prepareSheet(raw) {
  const index = new Map();
  const order = [];
  for (const m of raw.modules) {
    for (const g of m.groups) {
      for (const p of g.problems) {
        index.set(p.id, { problem: p, moduleId: m.id, groupId: g.id });
        order.push(p.id);
      }
    }
  }
  return { ...raw, index, order, moduleCount: raw.modules.length, problemCount: order.length };
}

/** One pass → { done, total } for every group, module and the sheet itself. */
export function computeStats(sheet, isDone) {
  const stats = new Map();
  let sheetDone = 0;

  for (const m of sheet.modules) {
    let moduleDone = 0;
    let moduleTotal = 0;
    for (const g of m.groups) {
      let groupDone = 0;
      for (const p of g.problems) if (isDone(p.id)) groupDone++;
      stats.set(groupKey(m.id, g.id), { done: groupDone, total: g.problems.length });
      moduleDone += groupDone;
      moduleTotal += g.problems.length;
    }
    stats.set(m.id, { done: moduleDone, total: moduleTotal });
    sheetDone += moduleDone;
  }

  stats.set(SHEET_KEY, { done: sheetDone, total: sheet.problemCount });
  return stats;
}

/** First unsolved problem in sheet order, with its location; null when everything is done. */
export function findUpNext(sheet, isDone) {
  for (const id of sheet.order) if (!isDone(id)) return sheet.index.get(id);
  return null;
}

/** Same tree with only problems where keep(id) is true; empty groups and modules are dropped. */
export function filterSheet(sheet, keep) {
  const modules = sheet.modules
    .map((m) => ({
      ...m,
      groups: m.groups
        .map((g) => ({ ...g, problems: g.problems.filter((p) => keep(p.id)) }))
        .filter((g) => g.problems.length),
    }))
    .filter((m) => m.groups.length);
  return prepareSheet({ ...sheet, modules });
}

export const percent = ({ done, total }) => (total ? Math.round((done * 100) / total) : 0);

export const isFlatModule = (module) => module.groups.length === 1 && module.groups[0].implicit;
