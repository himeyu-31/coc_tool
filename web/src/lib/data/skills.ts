import { Skill } from "@/types/character";

export const skillList: Skill[] = [
  { id: "accounting", name: "経理", base: 5, max: 85, category: "knowledge", description: "帳簿、収支、会計処理を読み解く技能。", usageSummary: "帳簿や取引記録を読み、資金の流れや不自然な数字を見つける技能です。", usageExamples: ["帳簿から裏金の動きを見つける。", "怪しい請求書の矛盾を確認する。"], beginnerHint: "事件の裏側を数字から追う場面で使います。文書調査が多い卓なら候補になります。" },
  { id: "anthropology", name: "人類学", base: 1, max: 75, category: "knowledge", description: "文化、風習、民族差を理解する技能。" },
  { id: "appraise", name: "鑑定", base: 5, max: 80, category: "knowledge", description: "物品の価値や真贋を見抜く技能。" },
  { id: "archaeology", name: "考古学", base: 1, max: 75, category: "knowledge", description: "遺跡や遺物から歴史的背景を読み取る技能。" },
  { id: "art-craft-acting", name: "芸術/製作（演技）", base: 5, max: 80, category: "other", description: "演技や見せ方で他者へ印象を与える技能。" },
  { id: "art-craft-drafting", name: "芸術/製作（製図）", base: 5, max: 80, category: "technical", description: "設計図や見取り図を描き、読み解く技能。" },
  { id: "art-craft-farming", name: "芸術/製作（農業）", base: 5, max: 80, category: "survival", description: "耕作や農作業の実務を扱う技能。" },
  { id: "art-craft-music", name: "芸術/製作（楽器演奏）", base: 5, max: 80, category: "other", description: "楽器演奏や音楽表現を行う技能。" },
  { id: "art-craft-photography", name: "芸術/製作（写真術）", base: 5, max: 80, category: "technical", description: "写真撮影や記録のための技能。" },
  { id: "art-craft-writing", name: "芸術/製作（文筆）", base: 5, max: 80, category: "other", description: "文章、原稿、創作物を書き上げる技能。" },
  { id: "art-craft-any", name: "芸術/製作（任意）", base: 5, max: 80, category: "other", description: "卓ごとに内容を定義して使う芸術または製作技能。" },
  { id: "charm", name: "魅惑", base: 15, max: 85, category: "social", description: "自然な愛想や魅力で好印象を得る技能。" },
  { id: "climb", name: "登攀", base: 20, max: 80, category: "survival", description: "壁、崖、足場の悪い場所をよじ登る技能。" },
  { id: "computer-use", name: "コンピューター", base: 5, max: 85, category: "technical", description: "端末操作や検索、一般的な電子機器の活用技能。", usageSummary: "PC やネットワーク端末を扱い、検索やデータの確認を進める技能です。", usageExamples: ["防犯カメラの記録を確認する。", "オンライン上の公開情報を調べる。"], beginnerHint: "現代日本シナリオなら出番を作りやすい技能です。" },
  { id: "credit-rating", name: "信用", base: 0, max: 99, category: "social", description: "社会的地位、資産、信頼度を表す技能。" },
  { id: "cthulhu-mythos", name: "クトゥルフ神話", base: 0, max: 99, category: "knowledge", description: "神話存在や宇宙的恐怖に関する禁忌知識。" },
  { id: "disguise", name: "変装", base: 5, max: 80, category: "stealth", description: "外見や雰囲気を変えて別人に見せかける技能。" },
  { id: "dodge", name: "回避", base: 20, max: 80, category: "combat", description: "攻撃や危険を避けるための身のこなし。", usageSummary: "攻撃や罠、突然の危険に対して身をかわすための技能です。", usageExamples: ["戦闘で攻撃を避ける。", "崩れてくる障害物から身を守る。"], beginnerHint: "前に出る探索者なら安定感がかなり変わります。" },
  { id: "drive-auto", name: "運転（自動車）", base: 20, max: 85, category: "technical", description: "一般的な自動車を扱う技能。" },
  { id: "electrical-repair", name: "電気修理", base: 10, max: 80, category: "technical", description: "配線、電源、電装機器を修理する技能。" },
  { id: "electronics", name: "電子工学", base: 1, max: 80, category: "technical", description: "電子回路や電子機器を扱う技能。" },
  { id: "fast-talk", name: "言いくるめ", base: 5, max: 85, category: "social", description: "勢いや口先で相手を丸め込む技能。" },
  { id: "fighting-brawl", name: "近接戦闘（格闘）", base: 25, max: 90, category: "combat", description: "殴る、組み付くなどの基本的な近接戦闘技能。" },
  { id: "fighting-any", name: "近接戦闘（任意）", base: 20, max: 90, category: "combat", description: "武器種を限定しない近接戦闘技能。" },
  { id: "fighting-sword", name: "近接戦闘（刀剣）", base: 20, max: 85, category: "combat", description: "剣や大型刃物を扱う近接戦闘技能。" },
  { id: "fighting-chain", name: "近接戦闘（鎖・鞭）", base: 10, max: 80, category: "combat", description: "鞭や鎖状武器を扱う特殊な近接戦闘技能。" },
  { id: "firearms-any", name: "射撃（任意）", base: 20, max: 90, category: "combat", description: "銃種を限定しない射撃技能。" },
  { id: "firearms-handgun", name: "射撃（拳銃）", base: 20, max: 90, category: "combat", description: "拳銃を用いた射撃技能。" },
  { id: "firearms-rifle-shotgun", name: "射撃（ライフル/ショットガン）", base: 25, max: 90, category: "combat", description: "長物火器を用いた射撃技能。" },
  { id: "firearms-smg", name: "射撃（サブマシンガン）", base: 15, max: 85, category: "combat", description: "連射火器を扱う射撃技能。" },
  { id: "first-aid", name: "応急手当", base: 30, max: 90, category: "medical", description: "その場で怪我の手当てや止血を行う技能。", usageSummary: "その場での止血や応急処置を行い、倒れた仲間を支える技能です。", usageExamples: ["負傷した仲間の傷を手当てする。", "現場で出血を止める。"], beginnerHint: "サポート役だけでなく、全員が少し持っていても腐りにくい技能です。" },
  { id: "history", name: "歴史", base: 5, max: 85, category: "knowledge", description: "過去の出来事や時代背景に関する知識。" },
  { id: "intimidate", name: "威圧", base: 15, max: 85, category: "social", description: "相手を怖がらせ、圧力をかける技能。" },
  { id: "jump", name: "跳躍", base: 20, max: 80, category: "survival", description: "障害物や隙間を跳び越える身体技能。" },
  { id: "language-own", name: "母国語", base: 60, max: 99, category: "knowledge", description: "日常的に使う言語の読解、筆記、会話能力。" },
  { id: "language-other-english", name: "ほかの言語（英語）", base: 1, max: 85, category: "knowledge", description: "外国語としての英語運用技能。" },
  { id: "language-other-latin", name: "ほかの言語（ラテン語）", base: 1, max: 75, category: "knowledge", description: "古典文献や医学用語にも現れる古典言語。" },
  { id: "language-other-any", name: "ほかの言語（任意）", base: 1, max: 85, category: "knowledge", description: "卓や時代設定に応じて定義する外国語技能。" },
  { id: "law", name: "法律", base: 5, max: 80, category: "knowledge", description: "法律、規則、権利関係に関する知識。" },
  { id: "library-use", name: "図書館", base: 25, max: 90, category: "knowledge", description: "文献や資料から必要情報を探し出す技能。", usageSummary: "大量の資料の中から必要な文献や記録を探し出す、調査の基本技能です。", usageExamples: ["古い新聞記事を探す。", "研究資料や報告書から手掛かりを拾う。"], beginnerHint: "調査卓ではかなり出番を作りやすく、初心者が持っていて困りにくい技能です。" },
  { id: "listen", name: "聞き耳", base: 25, max: 90, category: "perception", description: "小さな物音や気配を察知する技能。", usageSummary: "物音や息遣い、離れた場所の会話などを聞き取る技能です。", usageExamples: ["物陰の気配に気づく。", "扉越しの会話を拾う。"], beginnerHint: "目星と並ぶ基本技能のひとつで、迷ったら候補に入れやすいです。" },
  { id: "locksmith", name: "鍵開け", base: 1, max: 80, category: "technical", description: "鍵や簡易な閉鎖機構を解除する技能。" },
  { id: "mechanical-repair", name: "機械修理", base: 10, max: 85, category: "technical", description: "機械装置の故障箇所を見つけ、修理する技能。" },
  { id: "medicine", name: "医学", base: 5, max: 90, category: "medical", description: "疾病や負傷の診断、医療知識に関する技能。", usageSummary: "傷病の原因や症状を読み取り、専門的な医療知識で判断する技能です。", usageExamples: ["死体や負傷の状態を診る。", "薬品や症状の意味を判断する。"], beginnerHint: "医療職だけでなく、法医学や診断寄りの調査をしたい探索者にも向きます。" },
  { id: "natural-world", name: "博物学", base: 10, max: 80, category: "knowledge", description: "自然環境、動植物、地形への総合的な知識。" },
  { id: "navigate", name: "ナビゲート", base: 10, max: 80, category: "survival", description: "地図や地形を頼りに目的地へ到達する技能。" },
  { id: "occult", name: "オカルト", base: 5, max: 80, category: "knowledge", description: "神秘、迷信、宗教儀式、怪異に関する一般知識。", usageSummary: "怪談、宗教儀式、民間伝承などの怪異知識から意味を読み取る技能です。", usageExamples: ["儀式めいた痕跡の意味を考える。", "怪談や伝承との共通点を探す。"], beginnerHint: "CoC らしい雰囲気に触れやすい技能ですが、万能ではないので他の調査技能と併せると使いやすいです。" },
  { id: "operate-heavy-machinery", name: "重機械操作", base: 1, max: 75, category: "technical", description: "大型車両や建機などの重機械を扱う技能。" },
  { id: "persuade", name: "説得", base: 15, max: 85, category: "social", description: "筋道立てた説明で相手を納得させる技能。", usageSummary: "筋の通った説明や交渉で相手に協力してもらう技能です。", usageExamples: ["警察や関係者に話を通す。", "相手を落ち着かせて協力を得る。"], beginnerHint: "対人技能の中では扱いが素直で、会話中心の探索者に向いています。" },
  { id: "pilot-any", name: "操縦（任意）", base: 1, max: 75, category: "technical", description: "航空機や船舶など特定乗り物を操縦する技能。" },
  { id: "pilot-aircraft", name: "操縦（航空機）", base: 1, max: 75, category: "technical", description: "飛行機やヘリコプターなどの航空機を操縦する技能。" },
  { id: "psychoanalysis", name: "精神分析", base: 1, max: 70, category: "medical", description: "精神状態の安定や治療に関わる専門技能。" },
  { id: "psychology", name: "心理学", base: 5, max: 85, category: "social", description: "相手の感情、意図、嘘を読み取る技能。", usageSummary: "相手の態度や反応から、感情や本音を読み取る技能です。", usageExamples: ["証言の不自然さに気づく。", "相手が隠し事をしていそうか探る。"], beginnerHint: "対人場面の補助技能として便利で、説得や言いくるめと相性が良いです。" },
  { id: "ride", name: "乗馬", base: 5, max: 75, category: "survival", description: "馬などの騎乗動物を扱う技能。" },
  { id: "science-astronomy", name: "科学（天文学）", base: 1, max: 80, category: "knowledge", description: "星図や天体観測を扱う科学技能。" },
  { id: "science-biology", name: "科学（生物学）", base: 1, max: 80, category: "knowledge", description: "生物、細胞、身体組織などを扱う科学技能。" },
  { id: "science-chemistry", name: "科学（化学）", base: 1, max: 80, category: "knowledge", description: "化学反応、薬品、分析を扱う科学技能。" },
  { id: "science-engineering", name: "科学（工学）", base: 1, max: 80, category: "knowledge", description: "工学的な構造や設計を扱う科学技能。" },
  { id: "science-forensics", name: "科学（法医学）", base: 1, max: 80, category: "knowledge", description: "証拠分析や死因推定などの科学技能。" },
  { id: "science-pharmacy", name: "科学（薬学）", base: 1, max: 80, category: "medical", description: "薬効、薬品、処方に関する科学技能。" },
  { id: "science-physics", name: "科学（物理）", base: 1, max: 80, category: "knowledge", description: "物理法則や現象を扱う科学技能。" },
  { id: "science-any", name: "科学（任意）", base: 1, max: 80, category: "knowledge", description: "卓や専門分野に応じて定義する科学技能。" },
  { id: "sleight-of-hand", name: "手さばき", base: 10, max: 80, category: "stealth", description: "小物を隠す、すり替えるなどの器用さを使う技能。" },
  { id: "spot-hidden", name: "目星", base: 25, max: 90, category: "perception", description: "違和感、痕跡、隠された物を見つける技能。", usageSummary: "現場の違和感や手掛かり、隠された物を見つける技能です。", usageExamples: ["部屋の中の不自然な痕跡を探す。", "小さな証拠品や隠し扉に気づく。"], beginnerHint: "聞き耳や図書館と並ぶ基本技能で、初心者ならかなり優先度が高いです。" },
  { id: "stealth", name: "隠密", base: 20, max: 85, category: "stealth", description: "気配を消し、見つからずに行動する技能。", usageSummary: "相手に見つからないように移動したり、物陰に身を潜めたりする技能です。", usageExamples: ["見張りの視線を避けて移動する。", "怪物や敵から身を隠す。"], beginnerHint: "危険を避けたい探索者には有効ですが、調査の基本技能とは役割が少し違います。" },
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