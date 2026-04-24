import { BasicInfo, CharacterBackstory, CharacterSheet } from "@/types/character";

export const CUSTOM_PROFESSION_OPTION_ID = "__custom__";

export const defaultBasicInfo: BasicInfo = {
  characterName: "",
  playerName: "",
  age: "",
  gender: "",
  professionId: "",
  professionMode: "preset",
  professionName: "",
  era: ""
};

export const defaultCharacterBackstory: CharacterBackstory = {
  appearance: "",
  traits: "",
  ideology: "",
  injuries: "",
  significantPeople: "",
  phobiasAndManias: "",
  meaningfulLocations: "",
  tomesAndArtifacts: "",
  treasuredPossessions: "",
  strangeEncounters: "",
  equipmentAndItems: "",
  incomeAndAssets: ""
};

export const backstoryFieldDefinitions: Array<{ key: keyof CharacterBackstory; label: string; rows?: number }> = [
  { key: "appearance", label: "容姿の描写", rows: 3 },
  { key: "traits", label: "特徴", rows: 3 },
  { key: "ideology", label: "イデオロギー / 信念", rows: 3 },
  { key: "injuries", label: "負傷、傷跡", rows: 3 },
  { key: "significantPeople", label: "重要な人々", rows: 4 },
  { key: "phobiasAndManias", label: "恐怖症、マニア", rows: 4 },
  { key: "meaningfulLocations", label: "意味のある場所", rows: 3 },
  { key: "tomesAndArtifacts", label: "魔道書、呪文、アーティファクト", rows: 3 },
  { key: "treasuredPossessions", label: "秘蔵の品", rows: 4 },
  { key: "strangeEncounters", label: "遭遇した超自然の存在", rows: 4 },
  { key: "equipmentAndItems", label: "装備と所持品", rows: 6 },
  { key: "incomeAndAssets", label: "収入と財産", rows: 6 }
];

export function normalizeBasicInfo(basicInfo?: Partial<BasicInfo> | null): BasicInfo {
  return {
    ...defaultBasicInfo,
    ...basicInfo,
    professionMode: basicInfo?.professionMode === "custom" ? "custom" : "preset",
    professionName: typeof basicInfo?.professionName === "string" ? basicInfo.professionName : ""
  };
}

export function normalizeCharacterBackstory(backstory?: Partial<CharacterBackstory> | null): CharacterBackstory {
  return {
    ...defaultCharacterBackstory,
    ...backstory
  };
}

export function normalizeCharacterSheet(sheet: CharacterSheet): CharacterSheet {
  return {
    ...sheet,
    basicInfo: normalizeBasicInfo(sheet.basicInfo),
    backstory: normalizeCharacterBackstory(sheet.backstory)
  };
}