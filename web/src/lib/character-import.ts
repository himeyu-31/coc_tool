import { allSkillList } from "@/lib/coc7-data";
import { calculateDerivedStats } from "@/lib/coc7-rules";
import { CHARACTER_TRANSFER_FORMAT, CHARACTER_TRANSFER_ROW_LABEL, decodeCharacterSheetTransferData } from "@/lib/character-transfer";
import { AssignedSkill, CharacterSheet, CharacteristicKey, Characteristics, DerivedStats, Skill, SkillCategory } from "@/types/character";

const characteristicKeys: CharacteristicKey[] = ["str", "con", "pow", "dex", "app", "siz", "int", "edu"];

const characteristicLabelMap: Record<string, CharacteristicKey> = {
  STR: "str",
  CON: "con",
  POW: "pow",
  DEX: "dex",
  APP: "app",
  SIZ: "siz",
  INT: "int",
  EDU: "edu"
};

const skillNameMap = new Map(allSkillList.map((skill) => [skill.name, skill]));
const skillIdMap = new Map(allSkillList.map((skill) => [skill.id, skill]));

export async function importCharacterSheetFromFile(file: File): Promise<CharacterSheet> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const rows = parseCsvRows(await file.text());
    return importCharacterSheetFromRows(rows, file.name);
  }

  if (extension === "xlsx") {
    const rows = await parseXlsxRows(new Uint8Array(await file.arrayBuffer()));
    return importCharacterSheetFromRows(rows, file.name);
  }

  throw new Error("CSV または XLSX ファイルを選択してください。");
}

function importCharacterSheetFromRows(rows: string[][], fileName: string): CharacterSheet {
  const transferRow = rows.find((row) => row[0] === CHARACTER_TRANSFER_ROW_LABEL && row[2] === CHARACTER_TRANSFER_FORMAT && row[1]);

  if (transferRow?.[1]) {
    return normalizeImportedCharacterSheet(decodeCharacterSheetTransferData(transferRow[1]), fileName);
  }

  return importLegacyCharacterSheet(rows, fileName);
}

function normalizeImportedCharacterSheet(rawSheet: CharacterSheet, fileName: string): CharacterSheet {
  const fallbackCharacteristics = createEmptyCharacteristics();
  const characteristics = characteristicKeys.reduce((result, key) => {
    result[key] = toNumber(rawSheet?.characteristics?.[key]);
    return result;
  }, fallbackCharacteristics);
  const calculatedDerivedStats = calculateDerivedStats(characteristics);
  const fallbackDerivedStats = normalizeDerivedStatFallbacks(calculatedDerivedStats);
  const derivedStats: DerivedStats = {
    hp: toDerivedNumber(rawSheet?.derivedStats?.hp, fallbackDerivedStats.hp),
    mp: toDerivedNumber(rawSheet?.derivedStats?.mp, fallbackDerivedStats.mp),
    san: toDerivedNumber(rawSheet?.derivedStats?.san, fallbackDerivedStats.san),
    build: toDerivedNumber(rawSheet?.derivedStats?.build, fallbackDerivedStats.build),
    damageBonus: toDerivedString(rawSheet?.derivedStats?.damageBonus, fallbackDerivedStats.damageBonus),
    moveRate: toDerivedNumber(rawSheet?.derivedStats?.moveRate, fallbackDerivedStats.moveRate)
  };

  return {
    id: typeof rawSheet?.id === "string" && rawSheet.id ? rawSheet.id : buildImportedSheetId(fileName),
    basicInfo: {
      characterName: toStringValue(rawSheet?.basicInfo?.characterName),
      playerName: toStringValue(rawSheet?.basicInfo?.playerName),
      age: toStringValue(rawSheet?.basicInfo?.age),
      gender: toStringValue(rawSheet?.basicInfo?.gender),
      professionId: toStringValue(rawSheet?.basicInfo?.professionId),
      era: toStringValue(rawSheet?.basicInfo?.era)
    },
    characteristics,
    derivedStats,
    occupationSkills: normalizeAssignedSkillList(rawSheet?.occupationSkills),
    optionalSkills: normalizeAssignedSkillList(rawSheet?.optionalSkills),
    weapons: Array.isArray(rawSheet?.weapons) ? rawSheet.weapons : [],
    notes: toStringValue(rawSheet?.notes),
    condition: {
      currentHp: clampConditionValue(rawSheet?.condition?.currentHp, Number(derivedStats.hp)),
      currentMp: clampConditionValue(rawSheet?.condition?.currentMp, Number(derivedStats.mp)),
      currentSan: clampConditionValue(rawSheet?.condition?.currentSan, Number(derivedStats.san)),
      wounds: Array.isArray(rawSheet?.condition?.wounds) ? rawSheet.condition.wounds.filter((item) => typeof item === "string") : [],
      insanityHistory: Array.isArray(rawSheet?.condition?.insanityHistory) ? rawSheet.condition.insanityHistory.filter(isInsanityHistoryEntry) : []
    },
    updatedAt: typeof rawSheet?.updatedAt === "string" && rawSheet.updatedAt ? rawSheet.updatedAt : new Date().toISOString()
  };
}

function importLegacyCharacterSheet(rows: string[][], fileName: string): CharacterSheet {
  const valueMap = new Map<string, string>();

  rows.forEach((row) => {
    if (row[0] && row[1]) {
      valueMap.set(row[0], row[1]);
    }
  });

  const characteristics = createEmptyCharacteristics();
  Object.entries(characteristicLabelMap).forEach(([label, key]) => {
    characteristics[key] = toNumber(valueMap.get(label));
  });

  const calculatedDerivedStats = calculateDerivedStats(characteristics);
  const fallbackDerivedStats = normalizeDerivedStatFallbacks(calculatedDerivedStats);
  const derivedStats: DerivedStats = {
    hp: toDerivedNumber(valueMap.get("hp"), fallbackDerivedStats.hp),
    mp: toDerivedNumber(valueMap.get("mp"), fallbackDerivedStats.mp),
    san: toDerivedNumber(valueMap.get("san"), fallbackDerivedStats.san),
    build: toDerivedNumber(valueMap.get("build"), fallbackDerivedStats.build),
    damageBonus: toDerivedString(valueMap.get("damageBonus"), fallbackDerivedStats.damageBonus),
    moveRate: toDerivedNumber(valueMap.get("moveRate"), fallbackDerivedStats.moveRate)
  };

  const importedSkills = importLegacySkillRows(rows);

  return {
    id: buildImportedSheetId(fileName),
    basicInfo: {
      characterName: valueMap.get("キャラクター名") ?? stripExtension(fileName),
      playerName: valueMap.get("プレイヤー名") ?? "",
      age: valueMap.get("年齢") ?? "",
      gender: valueMap.get("性別") ?? "",
      professionId: valueMap.get("職業ID") ?? "",
      era: valueMap.get("時代設定") ?? ""
    },
    characteristics,
    derivedStats,
    occupationSkills: importedSkills.occupationSkills,
    optionalSkills: importedSkills.optionalSkills,
    weapons: [],
    notes: "",
    condition: {
      currentHp: clampConditionValue(valueMap.get("現在HP"), Number(derivedStats.hp)),
      currentMp: clampConditionValue(valueMap.get("現在MP"), Number(derivedStats.mp)),
      currentSan: clampConditionValue(valueMap.get("現在SAN"), Number(derivedStats.san)),
      wounds: [],
      insanityHistory: []
    },
    updatedAt: new Date().toISOString()
  };
}

function importLegacySkillRows(rows: string[][]): Pick<CharacterSheet, "occupationSkills" | "optionalSkills"> {
  const headerIndex = rows.findIndex((row) => row[0] === "技能" && row[1] === "値");
  if (headerIndex < 0) {
    return { occupationSkills: [], optionalSkills: [] };
  }

  const occupationSkills: AssignedSkill[] = [];
  const optionalSkills: AssignedSkill[] = [];

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row[0]) {
      continue;
    }
    if (row[0] === CHARACTER_TRANSFER_ROW_LABEL) {
      break;
    }

    const skillTemplate = skillNameMap.get(row[0]);
    if (!skillTemplate) {
      continue;
    }

    const total = toNumber(row[1]);
    const assigned = Math.max(0, Math.min(skillTemplate.max - skillTemplate.base, total - skillTemplate.base));
    const importedSkill = buildAssignedSkill(skillTemplate, assigned);
    const source = row[2] ?? "";

    if (source.includes("趣味")) {
      optionalSkills.push(importedSkill);
    } else {
      occupationSkills.push(importedSkill);
    }
  }

  return { occupationSkills, optionalSkills };
}

function normalizeAssignedSkillList(skills: CharacterSheet["occupationSkills"] | CharacterSheet["optionalSkills"] | undefined): AssignedSkill[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills.map((skill) => {
    const template = resolveSkillTemplate(skill);
    const assignedValue = Math.max(0, toNumber(skill.assigned));
    return buildAssignedSkill(template, assignedValue);
  });
}

function resolveSkillTemplate(skill: Partial<Skill> & { base?: number; max?: number; name?: string; id?: string }): Skill {
  const masterSkill = (typeof skill.id === "string" && skill.id ? skillIdMap.get(skill.id) : undefined)
    ?? (typeof skill.name === "string" && skill.name ? skillNameMap.get(skill.name) : undefined);

  if (masterSkill) {
    return masterSkill;
  }

  return {
    id: typeof skill.id === "string" && skill.id ? skill.id : `imported-${crypto.randomUUID()}`,
    name: typeof skill.name === "string" && skill.name ? skill.name : "名称未設定技能",
    base: toNumber(skill.base),
    max: Math.max(toNumber(skill.max) || 99, toNumber(skill.base)),
    category: isSkillCategory(skill.category) ? skill.category : "other",
    description: typeof skill.description === "string" ? skill.description : "インポートされた技能です。"
  };
}

function buildAssignedSkill(skill: Skill, assigned: number): AssignedSkill {
  const nextAssigned = Math.max(0, Math.min(skill.max - skill.base, assigned));
  return {
    ...skill,
    assigned: nextAssigned,
    total: skill.base + nextAssigned
  };
}

function parseCsvRows(rawCsv: string): string[][] {
  const normalized = rawCsv.replace(/^\ufeff/, "");
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const nextCharacter = normalized[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && character === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentCell = "";
      currentRow = [];
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

async function parseXlsxRows(data: Uint8Array): Promise<string[][]> {
  const files = await unzipEntries(data);
  const worksheet = files.get("xl/worksheets/sheet1.xml");

  if (!worksheet) {
    throw new Error("XLSX 内のシートを読み取れませんでした。");
  }

  const sharedStrings = files.get("xl/sharedStrings.xml") ? parseSharedStrings(new TextDecoder().decode(files.get("xl/sharedStrings.xml"))) : [];
  return parseWorksheetRows(new TextDecoder().decode(worksheet), sharedStrings);
}

async function unzipEntries(data: Uint8Array): Promise<Map<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  while (offset + 4 <= data.length) {
    const signature = view.getUint32(offset, true);
    if (signature === 0x02014b50 || signature === 0x06054b50) {
      break;
    }
    if (signature !== 0x04034b50) {
      throw new Error("XLSX の ZIP 構造を読み取れませんでした。");
    }

    const flags = view.getUint16(offset + 6, true);
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);

    if ((flags & 0x08) !== 0) {
      throw new Error("この XLSX は未対応の圧縮形式です。");
    }

    const nameOffset = offset + 30;
    const dataOffset = nameOffset + fileNameLength + extraFieldLength;
    const fileName = new TextDecoder().decode(data.slice(nameOffset, nameOffset + fileNameLength));
    const compressedData = data.slice(dataOffset, dataOffset + compressedSize);

    files.set(fileName, await inflateZipEntry(compressedData, compressionMethod));
    offset = dataOffset + compressedSize;
  }

  return files;
}

async function inflateZipEntry(data: Uint8Array, compressionMethod: number): Promise<Uint8Array> {
  if (compressionMethod === 0) {
    return data;
  }

  if (compressionMethod === 8) {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  throw new Error("未対応の XLSX 圧縮形式です。");
}

function parseSharedStrings(xmlText: string): string[] {
  const documentNode = new DOMParser().parseFromString(xmlText, "application/xml");
  return Array.from(documentNode.getElementsByTagName("si")).map((item) => readRichText(item));
}

function parseWorksheetRows(xmlText: string, sharedStrings: string[]): string[][] {
  const documentNode = new DOMParser().parseFromString(xmlText, "application/xml");

  return Array.from(documentNode.getElementsByTagName("row")).map((rowNode) => {
    const row: string[] = [];

    Array.from(rowNode.getElementsByTagName("c")).forEach((cellNode) => {
      const cellRef = cellNode.getAttribute("r") ?? "A1";
      const columnIndex = cellReferenceToIndex(cellRef);

      while (row.length <= columnIndex) {
        row.push("");
      }

      row[columnIndex] = readCellValue(cellNode, sharedStrings);
    });

    return row;
  });
}

function readCellValue(cellNode: Element, sharedStrings: string[]): string {
  const type = cellNode.getAttribute("t");

  if (type === "inlineStr") {
    return readRichText(cellNode);
  }

  const valueNode = cellNode.getElementsByTagName("v")[0];
  const rawValue = valueNode?.textContent ?? "";

  if (type === "s") {
    return sharedStrings[toNumber(rawValue)] ?? "";
  }

  return rawValue;
}

function readRichText(node: Element): string {
  return Array.from(node.getElementsByTagName("t"))
    .map((textNode) => textNode.textContent ?? "")
    .join("");
}

function cellReferenceToIndex(reference: string): number {
  const columnReference = reference.replace(/[0-9]/g, "").toUpperCase();
  let index = 0;

  for (let current = 0; current < columnReference.length; current += 1) {
    index = index * 26 + (columnReference.charCodeAt(current) - 64);
  }

  return Math.max(0, index - 1);
}

function createEmptyCharacteristics(): Characteristics {
  return {
    str: 0,
    con: 0,
    pow: 0,
    dex: 0,
    app: 0,
    siz: 0,
    int: 0,
    edu: 0
  };
}

function normalizeDerivedStatFallbacks(derivedStats: DerivedStats): {
  hp: number;
  mp: number;
  san: number;
  build: number;
  damageBonus: string;
  moveRate: number;
} {
  return {
    hp: Number(derivedStats.hp),
    mp: Number(derivedStats.mp),
    san: Number(derivedStats.san),
    build: Number(derivedStats.build),
    damageBonus: String(derivedStats.damageBonus),
    moveRate: Number(derivedStats.moveRate)
  };
}

function buildImportedSheetId(fileName: string): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `imported-${stripExtension(fileName)}-${Date.now()}`;
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function clampConditionValue(value: unknown, maxValue: number): number {
  return Math.max(0, Math.min(maxValue, toNumber(value)));
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toDerivedNumber(value: unknown, fallbackValue: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function toDerivedString(value: unknown, fallbackValue: string): string {
  return typeof value === "string" && value ? value : fallbackValue;
}

function isSkillCategory(value: unknown): value is SkillCategory {
  return typeof value === "string" && ["combat", "knowledge", "medical", "perception", "stealth", "technical", "social", "survival", "other"].includes(value);
}

function isInsanityHistoryEntry(value: unknown): value is CharacterSheet["condition"]["insanityHistory"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as CharacterSheet["condition"]["insanityHistory"][number];
  return (candidate.tableId === "temporary" || candidate.tableId === "indefinite")
    && typeof candidate.entryId === "string"
    && typeof candidate.notedAt === "string";
}