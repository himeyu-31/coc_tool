import { CharacterSheet } from "@/types/character";

const STORAGE_KEY = "coc7-character-sheets";

export function saveCharacterSheet(sheet: CharacterSheet): void {
  const sheets = getCharacterSheets();
  const existingIndex = sheets.findIndex((item) => item.id === sheet.id);
  const nextSheets = [...sheets];

  if (existingIndex >= 0) {
    nextSheets[existingIndex] = sheet;
  } else {
    nextSheets.unshift(sheet);
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSheets));
}

export function getCharacterSheets(): CharacterSheet[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as CharacterSheet[];
  } catch {
    return [];
  }
}

export function deleteCharacterSheet(sheetId: string): void {
  const sheets = getCharacterSheets();
  const nextSheets = sheets.filter((sheet) => sheet.id !== sheetId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSheets));
}

export function updateCharacterSheet(sheetId: string, updater: (sheet: CharacterSheet) => CharacterSheet): CharacterSheet | null {
  const sheets = getCharacterSheets();
  const target = sheets.find((sheet) => sheet.id === sheetId);

  if (!target) {
    return null;
  }

  const updated = updater(target);
  saveCharacterSheet({
    ...updated,
    updatedAt: new Date().toISOString()
  });

  return updated;
}