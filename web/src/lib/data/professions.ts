import { Profession } from "@/types/character";
import { requireSkill } from "@/lib/data/skills";

type ProfessionDefinition = Omit<Profession, "occupationSkills" | "optionalSkills"> & {
  occupationSkillIds: string[];
  optionalSkillIds: string[];
};

const professionDefinitions: ProfessionDefinition[] = [
  {
    id: "private-eye",
    name: "私立探偵",
    description: "調査と追跡、対人交渉を軸に事件を追う探索者。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 240,
    occupationalPointsFormula: "EDU × 4",
    hobbyPoints: 120,
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["int", "edu", "dex"],
    recommendedFor: ["調査役を担いたい", "情報収集が好き", "初参加でも役割を持ちたい"],
    beginnerNotes: [
      "目星、聞き耳、図書館が揃うため初心者でも貢献しやすい職業です。",
      "戦闘よりも調査と聞き込みが得意です。"
    ],
    occupationSkillIds: ["fast-talk", "listen", "art-craft-photography", "psychology", "library-use", "spot-hidden"],
    optionalSkillIds: ["firearms-handgun", "track", "law"]
  },
  {
    id: "doctor",
    name: "医師",
    description: "医療知識と支援能力で仲間を助ける専門職。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 260,
    occupationalPointsFormula: "EDU × 4 + APP × 2",
    hobbyPoints: 100,
    creditRating: { min: 30, max: 80 },
    recommendedCharacteristics: ["edu", "int", "pow"],
    recommendedFor: ["回復役を担いたい", "専門知識で貢献したい", "支援寄りの立ち回りが好き"],
    beginnerNotes: [
      "応急手当と医学が明確で、支援役として立ち位置を作りやすいです。",
      "交渉よりも知識と処置の場面で強みがあります。"
    ],
    occupationSkillIds: ["medicine", "first-aid", "psychology", "persuade", "science-pharmacy", "science-biology"],
    optionalSkillIds: ["library-use", "language-other-latin", "psychoanalysis"]
  },
  {
    id: "journalist",
    name: "記者",
    description: "取材、文章、聞き込みで情報を集めて記事にする職業。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 240,
    occupationalPointsFormula: "EDU × 4",
    hobbyPoints: 120,
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["edu", "app", "int"],
    recommendedFor: ["情報収集をしたい", "会話と調査を両立したい", "現代寄りの導入に馴染みたい"],
    beginnerNotes: [
      "図書館と対人技能の両方を使いやすい職業です。",
      "記事を書く都合上、文筆や写真術とも相性がよいです。"
    ],
    occupationSkillIds: ["art-craft-writing", "library-use", "persuade", "psychology", "spot-hidden", "language-own"],
    optionalSkillIds: ["fast-talk", "art-craft-photography", "history"]
  },
  {
    id: "police-officer",
    name: "警察官",
    description: "法執行、追跡、威圧を通じて危険へ対処する職業。",
    eraTags: ["modern"],
    occupationalPoints: 260,
    occupationalPointsFormula: "EDU × 2 + STR × 2 + DEX × 2",
    hobbyPoints: 100,
    creditRating: { min: 9, max: 50 },
    recommendedCharacteristics: ["str", "dex", "edu"],
    recommendedFor: ["前線に立ちたい", "追跡や制圧をしたい", "現代シナリオで扱いやすい職業が欲しい"],
    beginnerNotes: [
      "戦闘と追跡の両方を担当しやすい職業です。",
      "対人では威圧や法律が自然に使えます。"
    ],
    occupationSkillIds: ["law", "listen", "firearms-handgun", "psychology", "spot-hidden", "track"],
    optionalSkillIds: ["drive-auto", "fighting-brawl", "intimidate"]
  },
  {
    id: "professor",
    name: "大学教授",
    description: "高度な学問知識で資料調査や考察を主導する職業。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 270,
    occupationalPointsFormula: "EDU × 4 + APP × 2",
    hobbyPoints: 90,
    creditRating: { min: 20, max: 70 },
    recommendedCharacteristics: ["edu", "int", "pow"],
    recommendedFor: ["知識枠を担当したい", "資料調査が好き", "神話や歴史を追いたい"],
    beginnerNotes: [
      "図書館と専門知識が分かりやすく、謎解きに強い職業です。",
      "前線よりも調査、分析、説明役で活躍します。"
    ],
    occupationSkillIds: ["library-use", "language-own", "psychology", "persuade", "history", "science-any"],
    optionalSkillIds: ["anthropology", "archaeology", "occult"]
  },
  {
    id: "antiquarian",
    name: "古物研究家",
    description: "古書、骨董、遺物の知識をもとに過去を読み解く職業。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 240,
    occupationalPointsFormula: "EDU × 4",
    hobbyPoints: 120,
    creditRating: { min: 30, max: 70 },
    recommendedCharacteristics: ["edu", "int", "app"],
    recommendedFor: ["遺物や古書を扱いたい", "神話寄りの導入に乗りたい", "探索で鑑定役をしたい"],
    beginnerNotes: [
      "鑑定や歴史が活躍しやすく、資料系シナリオに馴染みます。",
      "戦闘よりも知識面と骨董知識で貢献する職業です。"
    ],
    occupationSkillIds: ["appraise", "art-craft-any", "history", "library-use", "language-other-any", "spot-hidden"],
    optionalSkillIds: ["archaeology", "occult", "charm"]
  },
  {
    id: "nurse",
    name: "看護師",
    description: "現場対応と医療補助に優れた支援型の職業。",
    eraTags: ["modern"],
    occupationalPoints: 250,
    occupationalPointsFormula: "EDU × 4 + DEX × 2",
    hobbyPoints: 110,
    creditRating: { min: 9, max: 40 },
    recommendedCharacteristics: ["edu", "dex", "pow"],
    recommendedFor: ["支援役を担いたい", "現代導入で使いやすい職業が欲しい", "医療寄りだが重すぎない役が欲しい"],
    beginnerNotes: [
      "応急手当を軸にすぐ役割が作れます。",
      "医師よりも現場寄りの立ち回りがしやすい職業です。"
    ],
    occupationSkillIds: ["first-aid", "medicine", "psychology", "listen", "persuade", "science-biology"],
    optionalSkillIds: ["charm", "library-use", "science-pharmacy"]
  },
  {
    id: "engineer",
    name: "技師",
    description: "機械と電気に強く、設備や装置の解析に向く職業。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 250,
    occupationalPointsFormula: "EDU × 4 + DEX × 2",
    hobbyPoints: 110,
    creditRating: { min: 10, max: 60 },
    recommendedCharacteristics: ["edu", "dex", "int"],
    recommendedFor: ["機械役を担当したい", "設備トラブルに強くなりたい", "現代探索で専門性を出したい"],
    beginnerNotes: [
      "機械修理と電気修理が明確で、装置系の場面で活躍します。",
      "調査中のギミック解除役に向いています。"
    ],
    occupationSkillIds: ["mechanical-repair", "electrical-repair", "computer-use", "science-chemistry", "operate-heavy-machinery", "library-use"],
    optionalSkillIds: ["drive-auto", "navigate", "science-any"]
  },
  {
    id: "lawyer",
    name: "弁護士",
    description: "法律知識と説得力で社会的な交渉を担う職業。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 260,
    occupationalPointsFormula: "EDU × 4 + APP × 2",
    hobbyPoints: 100,
    creditRating: { min: 30, max: 80 },
    recommendedCharacteristics: ["edu", "app", "pow"],
    recommendedFor: ["対人交渉を担当したい", "都会シナリオで動きたい", "会話中心で活躍したい"],
    beginnerNotes: [
      "説得と法律で役割が明確です。",
      "強引さより理詰めで交渉したい人に向きます。"
    ],
    occupationSkillIds: ["accounting", "law", "library-use", "persuade", "psychology", "credit-rating"],
    optionalSkillIds: ["charm", "fast-talk", "language-other-any"]
  },
  {
    id: "artist",
    name: "芸術家",
    description: "表現力と感性を武器に独自の視点で世界を見る職業。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 230,
    occupationalPointsFormula: "EDU × 2 + DEX × 2 + APP × 2",
    hobbyPoints: 130,
    creditRating: { min: 9, max: 50 },
    recommendedCharacteristics: ["app", "dex", "pow"],
    recommendedFor: ["個性的な探索者を作りたい", "対話と演出を楽しみたい", "文化系の役割が欲しい"],
    beginnerNotes: [
      "表現系技能でキャラ性を出しやすい職業です。",
      "情報収集は補助技能で支える必要があります。"
    ],
    occupationSkillIds: ["art-craft-acting", "art-craft-writing", "charm", "psychology", "history", "spot-hidden"],
    optionalSkillIds: ["disguise", "persuade", "language-other-any"]
  },
  {
    id: "soldier",
    name: "兵士",
    description: "戦闘、行軍、規律を軸に危険へ対応する職業。",
    eraTags: ["modern", "classic"],
    occupationalPoints: 250,
    occupationalPointsFormula: "EDU × 2 + STR × 2 + DEX × 2",
    hobbyPoints: 110,
    creditRating: { min: 9, max: 30 },
    recommendedCharacteristics: ["str", "dex", "con"],
    recommendedFor: ["戦闘担当が欲しい", "サバイバルを使いたい", "危険地帯を進みたい"],
    beginnerNotes: [
      "射撃とサバイバルの両方を扱える前線職です。",
      "調査の主担当にはなりにくいので、他技能で補強すると安定します。"
    ],
    occupationSkillIds: ["firearms-rifle-shotgun", "first-aid", "fighting-brawl", "navigate", "stealth", "survival-any"],
    optionalSkillIds: ["firearms-handgun", "throw", "intimidate"]
  },
  {
    id: "student",
    name: "学生",
    description: "幅広い興味と成長余地を持つ汎用的な立場の探索者。",
    eraTags: ["modern"],
    occupationalPoints: 200,
    occupationalPointsFormula: "EDU × 4 または任意配分",
    hobbyPoints: 140,
    creditRating: { min: 0, max: 20 },
    recommendedCharacteristics: ["int", "edu", "app"],
    recommendedFor: ["自由度高く作りたい", "初心者セッションで無理なく入りたい", "現代導入に自然に参加したい"],
    beginnerNotes: [
      "役割を固定しすぎず、興味ポイントで個性を出しやすい職業です。",
      "調査寄りにも会話寄りにも伸ばせます。"
    ],
    occupationSkillIds: ["library-use", "listen", "spot-hidden", "persuade", "psychology", "language-own"],
    optionalSkillIds: ["computer-use", "history", "science-any"]
  }
];

export const professionList: Profession[] = professionDefinitions.map((definition) => ({
  ...definition,
  occupationSkills: definition.occupationSkillIds.map(requireSkill),
  optionalSkills: definition.optionalSkillIds.map(requireSkill)
}));