import glossary from "@/lib/data/glossary.json";
import insanityTables from "@/lib/data/insanity-tables.json";
import { professionList } from "@/lib/data/professions";
import { getSkillById, skillList } from "@/lib/data/skills";
import weapons from "@/lib/data/weapons.json";
import { GlossaryEntry, InsanityTable, Profession, Skill, Weapon } from "@/types/character";

export const allProfessionList = professionList as Profession[];
export const weaponList = weapons as Weapon[];
export const insanityTableList = insanityTables as InsanityTable[];
export const glossaryList = glossary as GlossaryEntry[];
export const allSkillList = skillList as Skill[];

export function getProfessionById(professionId: string): Profession | undefined {
  return allProfessionList.find((profession) => profession.id === professionId);
}

export function getSkill(skillId: string): Skill | undefined {
  return getSkillById(skillId);
}

export function getWeaponById(weaponId: string): Weapon | undefined {
  return weaponList.find((weapon) => weapon.id === weaponId);
}

export function getWeaponsBySkillId(skillId: string): Weapon[] {
  return weaponList.filter((weapon) => weapon.skillId === skillId);
}

export function getInsanityTable(tableId: InsanityTable["id"]): InsanityTable | undefined {
  return insanityTableList.find((table) => table.id === tableId);
}

export function getGlossaryEntry(termId: string): GlossaryEntry | undefined {
  return glossaryList.find((entry) => entry.id === termId);
}