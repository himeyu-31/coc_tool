export type CharacteristicKey =
  | "str"
  | "con"
  | "pow"
  | "dex"
  | "app"
  | "siz"
  | "int"
  | "edu";

export type DerivedStatKey = "hp" | "mp" | "san" | "build" | "damageBonus" | "moveRate";

export type SkillCategory =
  | "combat"
  | "knowledge"
  | "medical"
  | "perception"
  | "stealth"
  | "technical"
  | "social"
  | "survival"
  | "other";

export type Skill = {
  id: string;
  name: string;
  base: number;
  max: number;
  category: SkillCategory;
  description: string;
};

export type ProfessionCreditRating = {
  min: number;
  max: number;
};

export type Profession = {
  id: string;
  name: string;
  description: string;
  eraTags: string[];
  occupationalPoints: number;
  occupationalPointsFormula: string;
  hobbyPoints: number;
  creditRating: ProfessionCreditRating;
  recommendedCharacteristics: CharacteristicKey[];
  recommendedFor: string[];
  beginnerNotes: string[];
  occupationSkills: Skill[];
  optionalSkills: Skill[];
};

export type BasicInfo = {
  characterName: string;
  playerName: string;
  age: string;
  gender: string;
  professionId: string;
  era: string;
};

export type Characteristics = Record<CharacteristicKey, number>;

export type DerivedStats = Record<DerivedStatKey, number | string>;

export type AssignedSkill = Skill & {
  assigned: number;
  total: number;
};

export type Weapon = {
  id: string;
  name: string;
  category: "handgun" | "rifle" | "shotgun" | "melee" | "thrown" | "other";
  skillId: string;
  damage: string;
  range: string;
  attacks: string;
  ammo: string;
  malfunction: string;
  notes: string[];
};

export type InsanityEntry = {
  id: string;
  roll: string;
  category: string;
  title: string;
  summary: string;
  effect: string;
  keeperHint: string;
};

export type InsanityTable = {
  id: "temporary" | "indefinite";
  name: string;
  usage: string;
  entries: InsanityEntry[];
};

export type GlossaryEntry = {
  id: string;
  term: string;
  shortDescription: string;
  detail: string;
  relatedTerms: string[];
};

export type CharacterCondition = {
  currentHp: number;
  currentMp: number;
  currentSan: number;
  wounds: string[];
  insanityHistory: Array<{
    tableId: InsanityTable["id"];
    entryId: string;
    notedAt: string;
  }>;
};

export type CharacterSheet = {
  id: string;
  basicInfo: BasicInfo;
  characteristics: Characteristics;
  derivedStats: DerivedStats;
  occupationSkills: AssignedSkill[];
  optionalSkills: AssignedSkill[];
  weapons: Weapon[];
  notes: string;
  condition: CharacterCondition;
  updatedAt: string;
};

export type SessionStatus = "planned" | "active" | "closed";

export type SessionLogEntry = {
  id: string;
  notedAt: string;
  summary: string;
  sheetId?: string;
};

export type SessionRecord = {
  id: string;
  name: string;
  scheduledOn: string;
  participantIds: string[];
  notes: string;
  status: SessionStatus;
  logs: SessionLogEntry[];
  updatedAt: string;
};