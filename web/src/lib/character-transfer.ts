import { CharacterSheet } from "@/types/character";

export const CHARACTER_TRANSFER_ROW_LABEL = "内部データ";
export const CHARACTER_TRANSFER_FORMAT = "CoC7 Character Support Import v1";

export function encodeCharacterSheetTransferData(sheet: CharacterSheet): string {
  const json = JSON.stringify(sheet);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function decodeCharacterSheetTransferData(payload: string): CharacterSheet {
  const binary = atob(payload);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const decoded = new TextDecoder().decode(bytes);
  return JSON.parse(decoded) as CharacterSheet;
}