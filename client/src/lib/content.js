// Content registry. Files are discovered by folder, so adding content never means editing code:
//   src/content/collections/<collectionId>.json   → Prep Hub sections and sheet cards
//   src/content/companies.json                    → company cards and their time-window lists
//   src/content/sheets/<sheetId>.json             → generated sheet content
//   src/content/solutions/<problemId>.json        → optional per-problem write-ups
// Each file becomes its own lazy chunk and is fetched at most once per session.

import { prepareSheet } from './sheetTree.js';

import companyData from '../content/companies.json';

export { default as collections } from '../content/collections.json';
export const { companies, categories: companyCategories } = companyData;
export const companySheetId = (companyId, categoryId) => `${companyId}-${categoryId}`;

/** Breadcrumb trail down to a sheet: Prep Hub / Sheet, or Prep Hub / Company / Window. */
export function sheetCrumbs(sheet) {
  const company = companies.find((c) => c.id === sheet.company);
  if (!company) return [{ label: 'Prep Hub', to: '/prep' }, { label: sheet.title, to: `/prep/${sheet.id}` }];
  const category = companyCategories.find((c) => c.id === sheet.category);
  return [
    { label: 'Prep Hub', to: '/prep' },
    { label: company.title, to: `/prep/company/${company.id}` },
    { label: category?.title ?? sheet.title, to: `/prep/${sheet.id}` },
  ];
}

const byId = (modules) =>
  Object.fromEntries(Object.entries(modules).map(([file, load]) => [file.split('/').pop().replace(/\.json$/, ''), load]));

const hubFiles = byId(import.meta.glob('../content/collections/*.json'));
const sheetFiles = byId(import.meta.glob('../content/sheets/*.json'));
const solutionFiles = byId(import.meta.glob('../content/solutions/*.json'));

export const sheetIds = Object.keys(sheetFiles);

const cache = new Map();

function load(kind, files, id, transform = (x) => x) {
  const key = `${kind}:${id}`;
  if (!cache.has(key)) {
    const file = files[id];
    const promise = file
      ? file()
          .then((m) => transform(m.default))
          .catch((err) => {
            cache.delete(key); // allow a retry after a failed chunk load
            throw err;
          })
      : Promise.resolve(null);
    cache.set(key, promise);
  }
  return cache.get(key);
}

export const loadHub = (id) => load('hub', hubFiles, id);
export const loadSheet = (id) => load('sheet', sheetFiles, id, prepareSheet);
export const loadSolution = (id) => load('solution', solutionFiles, id);
