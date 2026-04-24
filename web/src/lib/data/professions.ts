import { Profession, ProfessionPointOption, ProfessionPointTerm, ProfessionSkillChoiceGroup } from "@/types/character";
import { requireSkill } from "@/lib/data/skills";

type ProfessionDefinition = Omit<Profession, "occupationSkills" | "optionalSkills"> & {
  occupationSkillIds: string[];
  optionalSkillIds: string[];
};

const COMMON_ERAS = ["modern", "classic"];
const CLASSIC_ERA = ["classic"];
const MODERN_ERA = ["modern"];
const SOCIAL_SKILL_IDS = ["intimidate", "fast-talk", "persuade", "charm"];

function term(key: ProfessionPointTerm["key"], multiplier: number): ProfessionPointTerm {
  return { key, multiplier };
}

function option(formula: string, terms: ProfessionPointTerm[]): ProfessionPointOption {
  return { formula, terms };
}

function withChoiceFormulas(options: ProfessionPointOption[]) {
  return {
    occupationalPointsFormula: options.map((item) => item.formula).join(" または "),
    occupationalPointTerms: options[0].terms,
    occupationalPointOptions: options
  };
}

function choiceGroup(
  id: string,
  label: string,
  choose: number,
  config: Pick<ProfessionSkillChoiceGroup, "skillIds" | "allowAny" | "suggestedSkillIds"> = {}
): ProfessionSkillChoiceGroup {
  return {
    id,
    label,
    choose,
    ...config
  };
}

const professionSkillRules: Record<string, { fixedOccupationSkillIds: string[]; occupationSkillChoiceGroups?: ProfessionSkillChoiceGroup[] }> = {
  athlete: {
    fixedOccupationSkillIds: ["fighting-brawl", "ride", "swim", "jump", "throw", "climb"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["listen", "spot-hidden", "track"] })
    ]
  },
  doctor: {
    fixedOccupationSkillIds: ["medicine", "first-aid", "science-biology", "science-pharmacy", "psychology", "language-other-latin"],
    occupationSkillChoiceGroups: [choiceGroup("any", "研究もしくは個人的な専門として任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["psychoanalysis", "science-any"] })]
  },
  engineer: {
    fixedOccupationSkillIds: ["science-engineering", "science-physics", "mechanical-repair", "art-craft-drafting", "operate-heavy-machinery", "electrical-repair", "library-use"],
    occupationSkillChoiceGroups: [choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["computer-use", "science-any"] })]
  },
  entertainer: {
    fixedOccupationSkillIds: ["listen", "art-craft-acting", "psychology", "disguise"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から2つ", 2, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["spot-hidden", "history"] })
    ]
  },
  activist: {
    fixedOccupationSkillIds: ["charm", "psychology", "history"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から2つ", 2, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか3技能", 3, { allowAny: true, suggestedSkillIds: ["library-use", "law", "occult"] })
    ]
  },
  professor: {
    fixedOccupationSkillIds: ["psychology", "library-use", "language-other-any", "language-own"],
    occupationSkillChoiceGroups: [choiceGroup("any", "研究もしくは個人的な専門として任意のほか4技能", 4, { allowAny: true, suggestedSkillIds: ["history", "science-any", "occult"] })]
  },
  "police-officer": {
    fixedOccupationSkillIds: ["first-aid", "fighting-brawl", "firearms-any", "psychology", "law", "spot-hidden"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("vehicle", "運転（自動車）または乗馬から1つ", 1, { skillIds: ["drive-auto", "ride"] })
    ]
  },
  detective: {
    fixedOccupationSkillIds: ["listen", "firearms-any", "psychology", "law", "spot-hidden"],
    occupationSkillChoiceGroups: [
      choiceGroup("performance", "芸術/製作（演技）または変装から1つ", 1, { skillIds: ["art-craft-acting", "disguise"] }),
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["track", "locksmith"] })
    ]
  },
  artist: {
    fixedOccupationSkillIds: ["art-craft-any", "psychology", "spot-hidden", "language-other-any"],
    occupationSkillChoiceGroups: [
      choiceGroup("knowledge", "博物学または歴史から1つ", 1, { skillIds: ["natural-world", "history"] }),
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["occult", "library-use"] })
    ]
  },
  antiquarian: {
    fixedOccupationSkillIds: ["appraise", "art-craft-any", "library-use", "spot-hidden", "history", "language-other-any"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["archaeology", "occult"] })
    ]
  },
  writer: {
    fixedOccupationSkillIds: ["art-craft-writing", "psychology", "library-use", "history", "language-own", "language-other-any"],
    occupationSkillChoiceGroups: [
      choiceGroup("field", "オカルトまたは博物学から1つ", 1, { skillIds: ["occult", "natural-world"] }),
      choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["anthropology", "spot-hidden"] })
    ]
  },
  officer: {
    fixedOccupationSkillIds: ["accounting", "survival-any", "firearms-any", "psychology", "navigate"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から2つ", 2, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["first-aid", "language-other-any"] })
    ]
  },
  librarian: {
    fixedOccupationSkillIds: ["accounting", "library-use", "language-other-any", "language-own"],
    occupationSkillChoiceGroups: [choiceGroup("any", "個人的な専門、あるいはその時代を表す技能として任意のほか4技能", 4, { allowAny: true, suggestedSkillIds: ["history", "science-any", "occult"] })]
  },
  journalist: {
    fixedOccupationSkillIds: ["art-craft-photography", "psychology", "library-use", "history", "language-own"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["spot-hidden", "computer-use"] })
    ]
  },
  "private-eye": {
    fixedOccupationSkillIds: ["art-craft-photography", "psychology", "library-use", "disguise", "law", "spot-hidden"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["computer-use", "locksmith", "firearms-handgun"] })
    ]
  },
  priest: {
    fixedOccupationSkillIds: ["listen", "accounting", "psychology", "library-use", "history", "language-other-any"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["occult", "persuade"] })
    ]
  },
  parapsychologist: {
    fixedOccupationSkillIds: ["occult", "art-craft-photography", "psychology", "anthropology", "library-use", "history", "language-other-any"],
    occupationSkillChoiceGroups: [choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["science-any", "spot-hidden"] })]
  },
  dilettante: {
    fixedOccupationSkillIds: ["art-craft-any", "firearms-any", "ride", "language-other-any"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか3技能", 3, { allowAny: true, suggestedSkillIds: ["history", "library-use", "spot-hidden"] })
    ]
  },
  missionary: {
    fixedOccupationSkillIds: ["medicine", "first-aid", "mechanical-repair", "art-craft-any", "natural-world"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["language-other-any", "survival-any"] })
    ]
  },
  "tribe-member": {
    fixedOccupationSkillIds: ["occult", "listen", "survival-any", "natural-world", "swim", "climb", "spot-hidden"],
    occupationSkillChoiceGroups: [choiceGroup("combat", "近接戦闘（格闘）または投擲から1つ", 1, { skillIds: ["fighting-brawl", "throw"] })]
  },
  farmer: {
    fixedOccupationSkillIds: ["mechanical-repair", "art-craft-farming", "natural-world", "operate-heavy-machinery", "track"],
    occupationSkillChoiceGroups: [
      choiceGroup("vehicle", "運転（自動車）または乗馬から1つ", 1, { skillIds: ["drive-auto", "ride"] }),
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか1技能", 1, { allowAny: true, suggestedSkillIds: ["listen", "spot-hidden"] })
    ]
  },
  pilot: {
    fixedOccupationSkillIds: ["science-astronomy", "mechanical-repair", "operate-heavy-machinery", "pilot-aircraft", "electrical-repair", "navigate"],
    occupationSkillChoiceGroups: [choiceGroup("any", "任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["computer-use", "science-physics"] })]
  },
  hacker: {
    fixedOccupationSkillIds: ["computer-use", "electrical-repair", "electronics", "library-use", "spot-hidden"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["locksmith", "science-engineering"] })
    ]
  },
  criminal: {
    fixedOccupationSkillIds: ["stealth", "psychology", "spot-hidden"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("criminal-pool", "以下から4技能", 4, { skillIds: ["locksmith", "appraise", "mechanical-repair", "fighting-any", "firearms-any", "sleight-of-hand", "disguise"] })
    ]
  },
  soldier: {
    fixedOccupationSkillIds: ["stealth", "dodge", "fighting-any", "survival-any", "firearms-any"],
    occupationSkillChoiceGroups: [
      choiceGroup("mobility", "水泳または登攀から1つ", 1, { skillIds: ["swim", "climb"] }),
      choiceGroup("support", "次のうち2技能", 2, { skillIds: ["first-aid", "mechanical-repair", "language-other-any"] })
    ]
  },
  lawyer: {
    fixedOccupationSkillIds: ["accounting", "psychology", "library-use", "law"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から2つ", 2, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["language-other-any", "history"] })
    ]
  },
  drifter: {
    fixedOccupationSkillIds: ["stealth", "listen", "jump", "climb", "navigate"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか2技能", 2, { allowAny: true, suggestedSkillIds: ["survival-any", "spot-hidden"] })
    ]
  },
  musician: {
    fixedOccupationSkillIds: ["listen", "art-craft-music", "psychology"],
    occupationSkillChoiceGroups: [
      choiceGroup("social", "対人関係技能から1つ", 1, { skillIds: SOCIAL_SKILL_IDS }),
      choiceGroup("any", "任意のほか4技能", 4, { allowAny: true, suggestedSkillIds: ["history", "language-other-any", "spot-hidden"] })
    ]
  }
};

const professionDefinitions: ProfessionDefinition[] = [
  {
    id: "athlete",
    name: "アスリート",
    description: "身体能力を職能として磨き、競技や危険地帯での突破力を発揮する職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 70 },
    recommendedCharacteristics: ["dex", "str", "con"],
    recommendedFor: ["身体技能を主役にしたい", "危険地帯の突破役をやりたい"],
    beginnerNotes: ["跳躍、水泳、登攀など移動系技能をまとめて持てます。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか1技能"],
    occupationSkillIds: ["fighting-brawl", "ride", "swim", "jump", "throw", "climb", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["listen", "spot-hidden", "track"]
  },
  {
    id: "doctor",
    name: "医師",
    description: "医学知識と処置能力で負傷や病気に対処する専門職。",
    eraTags: CLASSIC_ERA,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 30, max: 80 },
    recommendedCharacteristics: ["edu", "int", "pow"],
    recommendedFor: ["医療支援を担いたい", "学術職で遊びたい"],
    beginnerNotes: ["応急手当と医学が揃い、仲間の支援役になりやすい職業です。"],
    skillChoiceNotes: ["研究もしくは個人的な専門として任意のほか2技能"],
    occupationSkillIds: ["medicine", "first-aid", "science-biology", "science-pharmacy", "psychology", "language-other-latin"],
    optionalSkillIds: ["psychoanalysis", "science-any"]
  },
  {
    id: "engineer",
    name: "技師",
    description: "装置や構造の理解に長け、機械や設備に強い技術職。",
    eraTags: COMMON_ERAS,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 30, max: 60 },
    recommendedCharacteristics: ["edu", "int", "dex"],
    recommendedFor: ["設備や機械を扱いたい", "理系の専門職で遊びたい"],
    beginnerNotes: ["機械修理と電気修理を軸に、装置トラブルへ強く出られます。"],
    skillChoiceNotes: ["任意のほか1技能"],
    occupationSkillIds: ["science-engineering", "science-physics", "mechanical-repair", "art-craft-drafting", "operate-heavy-machinery", "electrical-repair", "library-use"],
    optionalSkillIds: ["computer-use", "science-any"]
  },
  {
    id: "entertainer",
    name: "エンターテイナー",
    description: "舞台や人前に立つ場に慣れ、演技と対人対応で場を動かす職業。",
    eraTags: COMMON_ERAS,
    occupationalPointsFormula: "EDU × 2 + APP × 2",
    occupationalPointTerms: [term("edu", 2), term("app", 2)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 70 },
    recommendedCharacteristics: ["app", "pow", "dex"],
    recommendedFor: ["会話や演出を楽しみたい", "目立つキャラクターを作りたい"],
    beginnerNotes: ["演技と変装を軸に、対人場面で存在感を出しやすい職業です。"],
    skillChoiceNotes: ["対人関係技能から2つ", "任意のほか2技能"],
    occupationSkillIds: ["listen", "art-craft-acting", "psychology", "disguise", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["spot-hidden", "history"]
  },
  {
    id: "activist",
    name: "活動家",
    description: "運動や思想の現場で人を動かし、社会へ働きかける職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + APP × 2", [term("edu", 2), term("app", 2)]),
      option("EDU × 2 + POW × 2", [term("edu", 2), term("pow", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 0, max: 30 },
    recommendedCharacteristics: ["pow", "app", "edu"],
    recommendedFor: ["交渉と信念を前面に出したい", "社会派の探索者を作りたい"],
    beginnerNotes: ["対人関係技能が厚く、聞き込みや説得の役割を持ちやすいです。"],
    skillChoiceNotes: ["対人関係技能から2つ", "任意のほか3技能"],
    occupationSkillIds: ["charm", "psychology", "history", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["library-use", "law", "occult"]
  },
  {
    id: "professor",
    name: "教授",
    description: "研究と教育を通じて専門知識を積み上げてきた学術職。",
    eraTags: CLASSIC_ERA,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 20, max: 70 },
    recommendedCharacteristics: ["edu", "int", "pow"],
    recommendedFor: ["知識調査の主担当をやりたい", "学者らしい探索者を作りたい"],
    beginnerNotes: ["図書館と語学を軸に、資料調査で安定して貢献できます。"],
    skillChoiceNotes: ["研究もしくは個人的な専門として任意のほか4技能"],
    occupationSkillIds: ["psychology", "library-use", "language-other-any", "language-own"],
    optionalSkillIds: ["history", "science-any", "occult"]
  },
  {
    id: "police-officer",
    name: "警官",
    description: "治安維持や現場対応に従事し、法と力の両面で動く職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["str", "dex", "edu"],
    recommendedFor: ["現場対応役を担いたい", "法執行寄りで遊びたい"],
    beginnerNotes: ["法律、心理学、目星が揃い、戦闘と調査の両方へ触れられます。"],
    skillChoiceNotes: ["対人関係技能から1つ", "運転（自動車）または乗馬から1つ"],
    occupationSkillIds: ["first-aid", "fighting-brawl", "firearms-any", "psychology", "law", "spot-hidden", ...SOCIAL_SKILL_IDS, "drive-auto", "ride"],
    optionalSkillIds: []
  },
  {
    id: "detective",
    name: "刑事",
    description: "捜査経験を活かし、証拠集めや取り調べに長けた職業。",
    eraTags: CLASSIC_ERA,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 20, max: 50 },
    recommendedCharacteristics: ["edu", "dex", "pow"],
    recommendedFor: ["捜査官らしい探索者を作りたい", "調査と対人を両立したい"],
    beginnerNotes: ["聞き耳、法律、目星が揃い、手掛かり集めがしやすい職業です。"],
    skillChoiceNotes: ["芸術/製作（演技）または変装から1つ", "対人関係技能から1つ", "任意のほか1技能"],
    occupationSkillIds: ["listen", "art-craft-acting", "disguise", "firearms-any", "psychology", "law", "spot-hidden", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["track", "locksmith"]
  },
  {
    id: "artist",
    name: "芸術家",
    description: "感性と表現を武器に、独自の視点で世界へ向き合う職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + POW × 2", [term("edu", 2), term("pow", 2)]),
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 50 },
    recommendedCharacteristics: ["pow", "dex", "app"],
    recommendedFor: ["表現者として遊びたい", "個性的な探索者を作りたい"],
    beginnerNotes: ["芸術技能を軸に、歴史や心理学で調査にも絡めます。"],
    skillChoiceNotes: ["博物学または歴史から1つ", "対人関係技能から1つ", "任意のほか2技能"],
    occupationSkillIds: ["art-craft-any", "natural-world", "history", "psychology", "spot-hidden", ...SOCIAL_SKILL_IDS, "language-other-any"],
    optionalSkillIds: ["occult", "library-use"]
  },
  {
    id: "antiquarian",
    name: "古物研究家",
    description: "古物や古書に精通し、遺物の価値と背景を読み解く職業。",
    eraTags: CLASSIC_ERA,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 30, max: 70 },
    recommendedCharacteristics: ["edu", "int", "app"],
    recommendedFor: ["骨董や遺物を扱いたい", "資料調査が好き"],
    beginnerNotes: ["鑑定と歴史を軸に、遺物が出るシナリオで存在感を出せます。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか1技能"],
    occupationSkillIds: ["appraise", "art-craft-any", "library-use", "spot-hidden", "history", ...SOCIAL_SKILL_IDS, "language-other-any"],
    optionalSkillIds: ["archaeology", "occult"]
  },
  {
    id: "writer",
    name: "作家",
    description: "文章と取材を通じて知識や物語を形にする職業。",
    eraTags: CLASSIC_ERA,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["edu", "int", "pow"],
    recommendedFor: ["文筆系で遊びたい", "資料調査と語学を使いたい"],
    beginnerNotes: ["図書館と文筆で、記録や調査整理の役を担えます。"],
    skillChoiceNotes: ["オカルトまたは博物学から1つ", "任意のほか1技能"],
    occupationSkillIds: ["occult", "natural-world", "art-craft-writing", "psychology", "library-use", "history", "language-own", "language-other-any"],
    optionalSkillIds: ["anthropology", "spot-hidden"]
  },
  {
    id: "officer",
    name: "将校",
    description: "部隊運用や実地指揮を担い、戦場で判断を下す職業。",
    eraTags: CLASSIC_ERA,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 20, max: 70 },
    recommendedCharacteristics: ["edu", "str", "pow"],
    recommendedFor: ["軍人の指揮官役をやりたい", "戦場知識と交渉を両立したい"],
    beginnerNotes: ["サバイバルとナビゲートを持ち、野外行動に強い職業です。"],
    skillChoiceNotes: ["対人関係技能から2つ", "任意のほか1技能"],
    occupationSkillIds: ["accounting", "survival-any", "firearms-any", "psychology", "navigate", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["first-aid", "language-other-any"]
  },
  {
    id: "librarian",
    name: "司書",
    description: "蔵書管理や文献探索に長け、資料調査で力を発揮する職業。",
    eraTags: CLASSIC_ERA,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 35 },
    recommendedCharacteristics: ["edu", "int", "pow"],
    recommendedFor: ["資料調査の主役をやりたい", "穏当な専門職で始めたい"],
    beginnerNotes: ["図書館と語学が揃い、調査卓で役割を持ちやすい職業です。"],
    skillChoiceNotes: ["個人的な専門、あるいはその時代を表す技能として任意のほか4技能"],
    occupationSkillIds: ["accounting", "library-use", "language-other-any", "language-own"],
    optionalSkillIds: ["history", "science-any", "occult"]
  },
  {
    id: "journalist",
    name: "ジャーナリスト",
    description: "取材と記録を仕事にし、証言や資料から真相へ迫る職業。",
    eraTags: CLASSIC_ERA,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["edu", "app", "int"],
    recommendedFor: ["情報収集役をやりたい", "対人と調査を両立したい"],
    beginnerNotes: ["写真術と図書館を持ち、証拠集めの導線を作りやすいです。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか2技能"],
    occupationSkillIds: ["art-craft-photography", "psychology", "library-use", "history", ...SOCIAL_SKILL_IDS, "language-own"],
    optionalSkillIds: ["spot-hidden", "computer-use"]
  },
  {
    id: "private-eye",
    name: "私立探偵",
    description: "尾行や聞き込み、写真記録を得意とする民間の調査職。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["int", "edu", "dex"],
    recommendedFor: ["調査役を担いたい", "現場での聞き込みや尾行が好き"],
    beginnerNotes: ["写真術、図書館、法律、目星が揃い、探索の導線を作りやすい職業です。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか1技能"],
    occupationSkillIds: ["art-craft-photography", "psychology", "library-use", "disguise", "law", "spot-hidden", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["computer-use", "locksmith", "firearms-handgun"]
  },
  {
    id: "priest",
    name: "聖職者",
    description: "宗教知識と対人支援を持ち、共同体の相談役になりやすい職業。",
    eraTags: COMMON_ERAS,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 60 },
    recommendedCharacteristics: ["pow", "edu", "app"],
    recommendedFor: ["相談役や支援役をやりたい", "宗教や歴史に関わりたい"],
    beginnerNotes: ["聞き耳、心理学、図書館を持ち、対人支援と調査の両面へ参加できます。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか1技能"],
    occupationSkillIds: ["listen", "accounting", "psychology", "library-use", "history", ...SOCIAL_SKILL_IDS, "language-other-any"],
    optionalSkillIds: ["occult", "persuade"]
  },
  {
    id: "parapsychologist",
    name: "超心理学者",
    description: "怪異や超常現象を研究対象として扱う学究職。",
    eraTags: COMMON_ERAS,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["edu", "int", "pow"],
    recommendedFor: ["オカルト寄りで遊びたい", "神話の入口に立ちたい"],
    beginnerNotes: ["オカルトと人類学を持ち、怪異調査に自然に関われます。"],
    skillChoiceNotes: ["任意のほか1技能"],
    occupationSkillIds: ["occult", "art-craft-photography", "psychology", "anthropology", "library-use", "history", "language-other-any"],
    optionalSkillIds: ["science-any", "spot-hidden"]
  },
  {
    id: "dilettante",
    name: "ディレッタント",
    description: "資産や趣味の幅を背景に、自由な分野へ手を伸ばしてきた人物。",
    eraTags: CLASSIC_ERA,
    occupationalPointsFormula: "EDU × 2 + APP × 2",
    occupationalPointTerms: [term("edu", 2), term("app", 2)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 50, max: 99 },
    recommendedCharacteristics: ["app", "edu", "pow"],
    recommendedFor: ["上流階級の探索者を作りたい", "幅広い趣味人で遊びたい"],
    beginnerNotes: ["信用が高く、乗馬や語学で特色を出しやすい職業です。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか3技能"],
    occupationSkillIds: ["art-craft-any", "firearms-any", "ride", ...SOCIAL_SKILL_IDS, "language-other-any"],
    optionalSkillIds: ["history", "library-use", "spot-hidden"]
  },
  {
    id: "missionary",
    name: "伝道者",
    description: "支援と説法を携え、各地で人々と接してきた職業。",
    eraTags: COMMON_ERAS,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 0, max: 30 },
    recommendedCharacteristics: ["pow", "edu", "app"],
    recommendedFor: ["現地支援や布教の立場で遊びたい", "僻地シナリオへ馴染みたい"],
    beginnerNotes: ["医学や機械修理まで含み、支援役として意外に守備範囲が広い職業です。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか2技能"],
    occupationSkillIds: ["medicine", "first-aid", "mechanical-repair", "art-craft-any", "natural-world", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["language-other-any", "survival-any"]
  },
  {
    id: "tribe-member",
    name: "放浪者/部族民",
    description: "自然環境での生活に慣れ、土地勘と身体能力で生き抜く職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 0, max: 15 },
    recommendedCharacteristics: ["str", "dex", "con"],
    recommendedFor: ["自然環境の生存役をやりたい", "土着の立場で遊びたい"],
    beginnerNotes: ["サバイバル、博物学、目星が揃い、野外探索で強みを出せます。"],
    skillChoiceNotes: ["近接戦闘（格闘）または投擲から1つ"],
    occupationSkillIds: ["occult", "listen", "fighting-brawl", "throw", "survival-any", "natural-world", "swim", "climb", "spot-hidden"],
    optionalSkillIds: []
  },
  {
    id: "farmer",
    name: "農夫",
    description: "農作業と土地勘を仕事にし、農村生活の実務を担う職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["str", "dex", "con"],
    recommendedFor: ["農村の生活者として遊びたい", "土地勘と作業力を持たせたい"],
    beginnerNotes: ["機械修理や博物学まで含み、田舎シナリオで意外に強い職業です。"],
    skillChoiceNotes: ["運転（自動車）または乗馬から1つ", "対人関係技能から1つ", "任意のほか1技能"],
    occupationSkillIds: ["drive-auto", "ride", "mechanical-repair", "art-craft-farming", "natural-world", "operate-heavy-machinery", "track", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["listen", "spot-hidden"]
  },
  {
    id: "pilot",
    name: "パイロット",
    description: "航空機運用の技能を持ち、航法と整備知識も備えた職業。",
    eraTags: COMMON_ERAS,
    occupationalPointsFormula: "EDU × 2 + DEX × 2",
    occupationalPointTerms: [term("edu", 2), term("dex", 2)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 20, max: 70 },
    recommendedCharacteristics: ["dex", "edu", "int"],
    recommendedFor: ["乗り物の専門職で遊びたい", "移動役や操縦役を担いたい"],
    beginnerNotes: ["操縦、ナビゲート、機械系技能がまとまっており乗り物関連に強いです。"],
    skillChoiceNotes: ["任意のほか2技能"],
    occupationSkillIds: ["science-astronomy", "mechanical-repair", "operate-heavy-machinery", "pilot-aircraft", "electrical-repair", "navigate"],
    optionalSkillIds: ["computer-use", "science-physics"]
  },
  {
    id: "hacker",
    name: "ハッカー",
    description: "電子機器と情報網に強く、現代的な情報収集へ特化した職業。",
    eraTags: MODERN_ERA,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 10, max: 70 },
    recommendedCharacteristics: ["edu", "int", "dex"],
    recommendedFor: ["現代シナリオで情報収集役をやりたい", "端末や回路を触りたい"],
    beginnerNotes: ["コンピューターと電子工学が揃い、現代環境で役割を作りやすいです。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか2技能"],
    occupationSkillIds: ["computer-use", "electrical-repair", "electronics", "library-use", "spot-hidden", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["locksmith", "science-engineering"]
  },
  {
    id: "criminal",
    name: "犯罪者",
    description: "違法行為の現場経験を持ち、隠密や手口に長けた職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 5, max: 65 },
    recommendedCharacteristics: ["dex", "pow", "int"],
    recommendedFor: ["裏社会寄りの探索者を作りたい", "隠密や侵入が得意な役をやりたい"],
    beginnerNotes: ["隠密、目星、心理学が揃い、潜入や裏工作で強みを出せます。"],
    skillChoiceNotes: ["対人関係技能から1つ", "以下から4技能: 鍵開け、鑑定、機械修理、近接戦闘（任意）、射撃（任意）、手さばき、変装"],
    occupationSkillIds: ["stealth", "psychology", "spot-hidden", ...SOCIAL_SKILL_IDS, "locksmith", "appraise", "mechanical-repair", "fighting-any", "firearms-any", "sleight-of-hand", "disguise"],
    optionalSkillIds: []
  },
  {
    id: "soldier",
    name: "兵士",
    description: "訓練された戦闘員として前線行動や野外行軍を担う職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["str", "dex", "con"],
    recommendedFor: ["前線戦闘役をやりたい", "野外行動に強くしたい"],
    beginnerNotes: ["射撃とサバイバルを軸に、危険地帯で安定して動けます。"],
    skillChoiceNotes: ["水泳または登攀から1つ", "次のうち2技能: 応急手当、機械修理、ほかの言語"],
    occupationSkillIds: ["stealth", "dodge", "fighting-any", "survival-any", "firearms-any", "swim", "climb", "first-aid", "mechanical-repair", "language-other-any"],
    optionalSkillIds: []
  },
  {
    id: "lawyer",
    name: "弁護士",
    description: "法知識と交渉力を武器に、社会的な問題へ切り込む職業。",
    eraTags: COMMON_ERAS,
    occupationalPointsFormula: "EDU × 4",
    occupationalPointTerms: [term("edu", 4)],
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 30, max: 80 },
    recommendedCharacteristics: ["edu", "app", "pow"],
    recommendedFor: ["会話中心で活躍したい", "法律や交渉を使いたい"],
    beginnerNotes: ["法律、心理学、図書館が揃い、都会シナリオで役割を持ちやすいです。"],
    skillChoiceNotes: ["対人関係技能から2つ", "任意のほか2技能"],
    occupationSkillIds: ["accounting", "psychology", "library-use", "law", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["language-other-any", "history"]
  },
  {
    id: "drifter",
    name: "放浪者",
    description: "定住せず各地を渡り歩き、身体技能と現場勘で生きる職業。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + APP × 2", [term("edu", 2), term("app", 2)]),
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + STR × 2", [term("edu", 2), term("str", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 0, max: 5 },
    recommendedCharacteristics: ["dex", "str", "app"],
    recommendedFor: ["身軽な流れ者で遊びたい", "街でも野外でも動きたい"],
    beginnerNotes: ["聞き耳、ナビゲート、登攀が揃い、逃走や移動に強い職業です。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか2技能"],
    occupationSkillIds: ["stealth", "listen", "jump", "climb", "navigate", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["survival-any", "spot-hidden"]
  },
  {
    id: "musician",
    name: "ミュージシャン",
    description: "演奏技能と人前での立ち回りを磨いた表現者。",
    eraTags: COMMON_ERAS,
    ...withChoiceFormulas([
      option("EDU × 2 + DEX × 2", [term("edu", 2), term("dex", 2)]),
      option("EDU × 2 + POW × 2", [term("edu", 2), term("pow", 2)])
    ]),
    hobbyPointsFormula: "INT × 2",
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["pow", "dex", "app"],
    recommendedFor: ["演奏家として遊びたい", "芸能寄りの探索者を作りたい"],
    beginnerNotes: ["聞き耳と演奏技能を軸に、表現職として分かりやすい特色が出ます。"],
    skillChoiceNotes: ["対人関係技能から1つ", "任意のほか4技能"],
    occupationSkillIds: ["listen", "art-craft-music", "psychology", ...SOCIAL_SKILL_IDS],
    optionalSkillIds: ["history", "language-other-any", "spot-hidden"]
  }
];

export const professionList: Profession[] = professionDefinitions.map((definition) => ({
  ...definition,
  ...professionSkillRules[definition.id],
  occupationSkills: definition.occupationSkillIds.map(requireSkill),
  optionalSkills: definition.optionalSkillIds.map(requireSkill)
}));