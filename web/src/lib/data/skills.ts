import { Skill } from "@/types/character";

export const skillList: Skill[] = [
  { id: "accounting", name: "経理", base: 5, max: 85, category: "knowledge", description: "帳簿、収支、会計処理を読み解く技能。" },
  { id: "anthropology", name: "人類学", base: 1, max: 75, category: "knowledge", description: "文化、風習、民族差を理解する技能。" },
  { id: "appraise", name: "鑑定", base: 5, max: 80, category: "knowledge", description: "物品の価値や真贋を見抜く技能。" },
  { id: "archaeology", name: "考古学", base: 1, max: 75, category: "knowledge", description: "遺跡や遺物から歴史的背景を読み取る技能。" },
  { id: "art-craft-acting", name: "芸術/製作（演技）", base: 5, max: 80, category: "other", description: "演技や見せ方で他者へ印象を与える技能。" },
  { id: "art-craft-photography", name: "芸術/製作（写真術）", base: 5, max: 80, category: "technical", description: "写真撮影や記録のための技能。" },
  { id: "art-craft-writing", name: "芸術/製作（文筆）", base: 5, max: 80, category: "other", description: "文章、原稿、創作物を書き上げる技能。" },
  { id: "art-craft-any", name: "芸術/製作（任意）", base: 5, max: 80, category: "other", description: "卓ごとに内容を定義して使う芸術または製作技能。" },
  { id: "charm", name: "魅惑", base: 15, max: 85, category: "social", description: "自然な愛想や魅力で好印象を得る技能。" },
  { id: "climb", name: "登攀", base: 20, max: 80, category: "survival", description: "壁、崖、足場の悪い場所をよじ登る技能。" },
  { id: "computer-use", name: "コンピューター", base: 5, max: 85, category: "technical", description: "端末操作や検索、一般的な電子機器の活用技能。" },
  { id: "credit-rating", name: "信用", base: 0, max: 99, category: "social", description: "社会的地位、資産、信頼度を表す技能。" },
  { id: "cthulhu-mythos", name: "クトゥルフ神話", base: 0, max: 99, category: "knowledge", description: "神話存在や宇宙的恐怖に関する禁忌知識。" },
  { id: "disguise", name: "変装", base: 5, max: 80, category: "stealth", description: "外見や雰囲気を変えて別人に見せかける技能。" },
  { id: "dodge", name: "回避", base: 20, max: 80, category: "combat", description: "攻撃や危険を避けるための身のこなし。" },
  { id: "drive-auto", name: "運転（自動車）", base: 20, max: 85, category: "technical", description: "一般的な自動車を扱う技能。" },
  { id: "electrical-repair", name: "電気修理", base: 10, max: 80, category: "technical", description: "配線、電源、電装機器を修理する技能。" },
  { id: "fast-talk", name: "言いくるめ", base: 5, max: 85, category: "social", description: "勢いや口先で相手を丸め込む技能。" },
  { id: "fighting-brawl", name: "近接戦闘（格闘）", base: 25, max: 90, category: "combat", description: "殴る、組み付くなどの基本的な近接戦闘技能。" },
  { id: "fighting-sword", name: "近接戦闘（刀剣）", base: 20, max: 85, category: "combat", description: "剣や大型刃物を扱う近接戦闘技能。" },
  { id: "fighting-chain", name: "近接戦闘（鎖・鞭）", base: 10, max: 80, category: "combat", description: "鞭や鎖状武器を扱う特殊な近接戦闘技能。" },
  { id: "firearms-handgun", name: "射撃（拳銃）", base: 20, max: 90, category: "combat", description: "拳銃を用いた射撃技能。" },
  { id: "firearms-rifle-shotgun", name: "射撃（ライフル/ショットガン）", base: 25, max: 90, category: "combat", description: "長物火器を用いた射撃技能。" },
  { id: "firearms-smg", name: "射撃（サブマシンガン）", base: 15, max: 85, category: "combat", description: "連射火器を扱う射撃技能。" },
  { id: "first-aid", name: "応急手当", base: 30, max: 90, category: "medical", description: "その場で怪我の手当てや止血を行う技能。" },
  { id: "history", name: "歴史", base: 5, max: 85, category: "knowledge", description: "過去の出来事や時代背景に関する知識。" },
  { id: "intimidate", name: "威圧", base: 15, max: 85, category: "social", description: "相手を怖がらせ、圧力をかける技能。" },
  { id: "jump", name: "跳躍", base: 20, max: 80, category: "survival", description: "障害物や隙間を跳び越える身体技能。" },
  { id: "language-own", name: "母国語", base: 60, max: 99, category: "knowledge", description: "日常的に使う言語の読解、筆記、会話能力。" },
  { id: "language-other-english", name: "ほかの言語（英語）", base: 1, max: 85, category: "knowledge", description: "外国語としての英語運用技能。" },
  { id: "language-other-latin", name: "ほかの言語（ラテン語）", base: 1, max: 75, category: "knowledge", description: "古典文献や医学用語にも現れる古典言語。" },
  { id: "language-other-any", name: "ほかの言語（任意）", base: 1, max: 85, category: "knowledge", description: "卓や時代設定に応じて定義する外国語技能。" },
  { id: "law", name: "法律", base: 5, max: 80, category: "knowledge", description: "法律、規則、権利関係に関する知識。" },
  { id: "library-use", name: "図書館", base: 25, max: 90, category: "knowledge", description: "文献や資料から必要情報を探し出す技能。" },
  { id: "listen", name: "聞き耳", base: 25, max: 90, category: "perception", description: "小さな物音や気配を察知する技能。" },
  { id: "locksmith", name: "鍵開け", base: 1, max: 80, category: "technical", description: "鍵や簡易な閉鎖機構を解除する技能。" },
  { id: "mechanical-repair", name: "機械修理", base: 10, max: 85, category: "technical", description: "機械装置の故障箇所を見つけ、修理する技能。" },
  { id: "medicine", name: "医学", base: 5, max: 90, category: "medical", description: "疾病や負傷の診断、医療知識に関する技能。" },
  { id: "natural-world", name: "博物学", base: 10, max: 80, category: "knowledge", description: "自然環境、動植物、地形への総合的な知識。" },
  { id: "navigate", name: "ナビゲート", base: 10, max: 80, category: "survival", description: "地図や地形を頼りに目的地へ到達する技能。" },
  { id: "occult", name: "オカルト", base: 5, max: 80, category: "knowledge", description: "神秘、迷信、宗教儀式、怪異に関する一般知識。" },
  { id: "operate-heavy-machinery", name: "重機械操作", base: 1, max: 75, category: "technical", description: "大型車両や建機などの重機械を扱う技能。" },
  { id: "persuade", name: "説得", base: 15, max: 85, category: "social", description: "筋道立てた説明で相手を納得させる技能。" },
  { id: "pilot-any", name: "操縦（任意）", base: 1, max: 75, category: "technical", description: "航空機や船舶など特定乗り物を操縦する技能。" },
  { id: "psychoanalysis", name: "精神分析", base: 1, max: 70, category: "medical", description: "精神状態の安定や治療に関わる専門技能。" },
  { id: "psychology", name: "心理学", base: 5, max: 85, category: "social", description: "相手の感情、意図、嘘を読み取る技能。" },
  { id: "ride", name: "乗馬", base: 5, max: 75, category: "survival", description: "馬などの騎乗動物を扱う技能。" },
  { id: "science-biology", name: "科学（生物学）", base: 1, max: 80, category: "knowledge", description: "生物、細胞、身体組織などを扱う科学技能。" },
  { id: "science-chemistry", name: "科学（化学）", base: 1, max: 80, category: "knowledge", description: "化学反応、薬品、分析を扱う科学技能。" },
  { id: "science-forensics", name: "科学（法医学）", base: 1, max: 80, category: "knowledge", description: "証拠分析や死因推定などの科学技能。" },
  { id: "science-pharmacy", name: "科学（薬学）", base: 1, max: 80, category: "medical", description: "薬効、薬品、処方に関する科学技能。" },
  { id: "science-any", name: "科学（任意）", base: 1, max: 80, category: "knowledge", description: "卓や専門分野に応じて定義する科学技能。" },
  { id: "sleight-of-hand", name: "手さばき", base: 10, max: 80, category: "stealth", description: "小物を隠す、すり替えるなどの器用さを使う技能。" },
  { id: "spot-hidden", name: "目星", base: 25, max: 90, category: "perception", description: "違和感、痕跡、隠された物を見つける技能。" },
  { id: "stealth", name: "隠密", base: 20, max: 85, category: "stealth", description: "気配を消し、見つからずに行動する技能。" },
  { id: "survival-any", name: "サバイバル（任意）", base: 10, max: 80, category: "survival", description: "環境に応じた野外生存技能。" },
  { id: "swim", name: "水泳", base: 20, max: 80, category: "survival", description: "水中を移動し、溺れずに行動する技能。" },
  { id: "throw", name: "投擲", base: 20, max: 80, category: "combat", description: "物体を狙って投げる技能。" },
  { id: "track", name: "追跡", base: 10, max: 80, category: "survival", description: "痕跡や足跡をたどって対象を追う技能。" }
];

export function getSkillById(skillId: string): Skill | undefined {
  return skillList.find((skill) => skill.id === skillId);
}

export function requireSkill(skillId: string): Skill {
  const skill = getSkillById(skillId);
  if (!skill) {
    throw new Error(`Unknown skill id: ${skillId}`);
  }

  return skill;
}