"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { allSkillList } from "@/lib/coc7-data";
import { backstoryFieldDefinitions, CUSTOM_PROFESSION_OPTION_ID, defaultBasicInfo, defaultCharacterBackstory, normalizeBasicInfo, normalizeCharacterBackstory } from "@/lib/character-sheet";
import { saveCharacterSheet } from "@/lib/character-storage";
import { calculateDerivedStats, calculateHobbyPoints, calculateOccupationPointCalculation, calculateOccupationPoints, getAgeAdjustmentGuide, rollStandardCharacteristics } from "@/lib/coc7-rules";
import { getDisplayedProfessionName, getProfessionById, professionList, toAssignedSkills } from "@/lib/professions";
import { AssignedSkill, BasicInfo, CharacterBackstory, CharacterSheet, Characteristics, CharacteristicKey, DerivedStatKey, Profession, ProfessionSkillChoiceGroup, Skill, SkillCategory } from "@/types/character";

const stepLabels = ["基本情報と能力値", "技能配分", "確認と保存"];

const stepDescriptions = [
  "探索者の基本情報を決め、そのまま能力値と派生値まで確定します。",
  "職業ポイントと趣味ポイントを使い切るまで技能を調整します。",
  "不足がないか確認し、そのまま保存します。"
];

const eraSuggestions = ["1920s", "modern", "classic", "現代日本", "大正", "昭和初期"];

const characteristicKeys: CharacteristicKey[] = ["str", "con", "pow", "dex", "app", "siz", "int", "edu"];

const characteristicLabels: Record<CharacteristicKey, string> = {
  str: "STR",
  con: "CON",
  pow: "POW",
  dex: "DEX",
  app: "APP",
  siz: "SIZ",
  int: "INT",
  edu: "EDU"
};

const characteristicVisualGroups: Record<CharacteristicKey, { label: string; toneClassName: string }> = {
  str: { label: "身体", toneClassName: "is-physical" },
  con: { label: "身体", toneClassName: "is-physical" },
  pow: { label: "精神", toneClassName: "is-will" },
  dex: { label: "身体", toneClassName: "is-physical" },
  app: { label: "印象", toneClassName: "is-social" },
  siz: { label: "身体", toneClassName: "is-physical" },
  int: { label: "知性", toneClassName: "is-knowledge" },
  edu: { label: "知性", toneClassName: "is-knowledge" }
};

type CharacteristicValueMeaning = {
  value: number;
  meaning: string;
};

type CharacteristicHelpItem = {
  title: string;
  summary: string;
  beginnerTip: string;
  valueMeanings: CharacteristicValueMeaning[];
};

const characteristicHelp: Record<CharacteristicKey, CharacteristicHelpItem> = {
  str: {
    title: "筋力",
    summary: "持ち上げる、押さえ込む、殴るなどの純粋な身体の強さです。",
    beginnerTip: "前に出て扉をこじ開けたり、近接で動きたい探索者は高めだと扱いやすいです。",
    valueMeanings: [
      { value: 0, meaning: "衰弱。立ち上がったり、コップを持つことすらできない。" },
      { value: 15, meaning: "貧弱である。" },
      { value: 50, meaning: "平均的な人間の筋力。" },
      { value: 90, meaning: "あなたが今までに会った中で最も強い人々の一人。" },
      { value: 99, meaning: "国際的（オリンピックの重量挙げ選手）。人間の最大値。" },
      { value: 140, meaning: "人間の筋力を超えている（ゴリラや馬）。" },
      { value: 200, meaning: "怪物的な筋力（例えばグラーキといった神話生物など。）" }
    ]
  },
  con: {
    title: "体力",
    summary: "疲れにくさ、病気や苦痛への強さなど、体の丈夫さです。",
    beginnerTip: "HP の計算に関わるので、倒れにくさを重視するなら気にすると分かりやすい能力値です。",
    valueMeanings: [
      { value: 0, meaning: "死んでいる。" },
      { value: 1, meaning: "病弱、病気は長引きがちで、おそらく助けなしでは行動できない。" },
      { value: 15, meaning: "不健康、病気の発作を持つ、しょっちゅう痛みを感じるなど。" },
      { value: 50, meaning: "一般の健康人。" },
      { value: 90, meaning: "寒さに強く、頑丈で強壮。" },
      { value: 99, meaning: "頑丈な体力で強い痛みに耐えることができる。人間の最大値。" },
      { value: 140, meaning: "人間の体力を超えている（象など）。" },
      { value: 200, meaning: "怪物的な体力で、ほとんどの地球の病気を無視できる（例えばニョグダといった神話生物など）。" },
    ]
  },
  pow: {
    title: "精神力",
    summary: "意志の強さ、心の踏ん張り、超常に対する抵抗力を表します。",
    beginnerTip: "初期 SAN と MP に直結するので、CoC らしい場面では特に重要です。",
    valueMeanings: [
      { value: 0, meaning: "精神が衰弱し、意志力がなく、魔術的な能力が一切ない。" },
      { value: 15, meaning: "意志薄弱で、より高い知性か精神力を持つものに容易に支配される。" },
      { value: 50, meaning: "普通の人間。" },
      { value: 90, meaning: "強固な意志を持ち、やる気に満ち、見えないものや魔術的なものとつながりを持つ可能性が高い。" },
      { value: 100, meaning: "鉄の意志、霊的な「領域」や見えない世界と強いつながりを持つ。" },
      { value: 140, meaning: "人間を超えた、おそらく異界の存在（例えばイグといった神話生物など）。" },
      { value: 210, meaning: "怪物的な魔術の力と人間の理解を超えた精神力を持つ（例えばクトゥルフといった神話生物など）。" }
    ]
  },
  dex: {
    title: "敏捷性",
    summary: "身のこなし、反応速度、手先の素早さを表します。",
    beginnerTip: "回避や素早い行動をイメージするなら高めだと扱いやすいです。",
    valueMeanings: [
      { value: 0, meaning: "助けなしでは動くことができない。" },
      { value: 15, meaning: "遅くて不器用で、運動神経が細かい作業には不向きである。" },
      { value: 50, meaning: "平均的な人間の敏捷性。" },
      { value: 90, meaning: "速く、すばしっこく、細かい作業が必要な芸当を行える（例えばアクロバット、優れたダンサーなど）。" },
      { value: 99, meaning: "国際的な運動選手。人間の最大値。" },
      { value: 120, meaning: "人間を超えた敏捷性（例えばチーターなど）。" },
      { value: 200, meaning: "稲妻のような敏捷性。人間が理解不可能なほど素早く移動したり、芸当を行える可能性がある。" }
    ]
  },
  app: {
    title: "外観",
    summary: "見た目の印象や、人に与える魅力の強さです。",
    beginnerTip: "会話中心の探索者や、第一印象を活かす役なら意識しやすい能力値です。",
    valueMeanings: [
      { value: 0, meaning: "とても見苦しく、他の者に恐怖、嫌悪、また哀れみの感情を与える。" },
      { value: 15, meaning: "醜い。負傷のせい、あるいは出生時からのものかもしれない。" },
      { value: 50, meaning: "平均的な人間の外観。" },
      { value: 90, meaning: "今まであなたが会った中で最も美しい人々の一人、生来の魅力。" },
      { value: 99, meaning: "魅惑とクールさの頂点（スーパーモデルあるは世界的に有名な映画スター）。人間の最大値。" }
    ]
  },
  siz: {
    title: "体格",
    summary: "身長や体重を含む体の大きさです。",
    beginnerTip: "CON と合わせて HP に、STR と合わせて Build に関わるので、見た目以上に重要です。",
    valueMeanings: [
      { value: 1, meaning: "赤ん坊（0.5kg～6kg）。" },
      { value: 15, meaning: "子供、非常に身長が低い人（15kg）。" },
      { value: 65, meaning: "平均の人間の体格（中肉中背）（75kg）。" },
      { value: 80, meaning: "非常に背が高い、体が強健、あるいは肥満体（110kg）。" },
      { value: 99, meaning: "身長か体重が特大（150kg）。" },
      { value: 150, meaning: "馬や牛（436kg）。" },
      { value: 180, meaning: "記録がある中で最も重い人間（634kg）。" },
      { value: 200, meaning: "872kg（例えばチャウグナー・フォーンといった神話生物）。" }
    ]
  },
  int: {
    title: "知性",
    summary: "ひらめき、理解力、状況を読み取る頭の回転を表します。",
    beginnerTip: "情報をつなげて考える場面が多い探索者なら、迷った時に意識しやすい値です。",
    valueMeanings: [
      { value: 0, meaning: "知性がなく、周りの世界を理解することができない。" },
      { value: 15, meaning: "物覚えが悪い。最も初歩的な計算や、初心者向けの本を読むことしかできない。" },
      { value: 65, meaning: "平均的な人間の知性。" },
      { value: 90, meaning: "頭の回転が速く、おそらく複数の言語を理解したり定理が理解できたりする。" },
      { value: 99, meaning: "天才（アインシュタイン、ダ・ヴィンチ、テスラなど）。人間の最大値。" },
      { value: 140, meaning: "人間の知性を超えている（例えば古のものといった神話生物）。" },
      { value: 210, meaning: "怪物的な知性で多次元を理解しそこで活動できる（例えば大いなるクトゥルフといった神話生物）。" }
    ]
  },
  edu: {
    title: "教育",
    summary: "学習経験や専門知識の蓄積、教養の深さです。",
    beginnerTip: "多くの職業ポイント式に関わるので、職業選びとセットで見ると分かりやすいです。",
    valueMeanings: [
      { value: 0, meaning: "新生児。" },
      { value: 15, meaning: "あらゆる点で完全に無教育である。" },
      { value: 60, meaning: "高校卒業者。" },
      { value: 70, meaning: "大卒（学士）。" },
      { value: 80, meaning: "大学院卒（修士）。" },
      { value: 90, meaning: "博士号、教授。" },
      { value: 96, meaning: "自分の研究分野での世界クラスの権威。" },
      { value: 99, meaning: "人間の最大値。" },
    ]
  }
};

const derivedStatKeys: DerivedStatKey[] = ["hp", "mp", "san", "moveRate", "build", "damageBonus"];

const derivedStatLabels: Record<DerivedStatKey, string> = {
  hp: "HP",
  mp: "MP",
  san: "SAN",
  moveRate: "MOV",
  build: "ビルド",
  damageBonus: "ダメージボーナス"
};

const skillCategoryLabels: Record<SkillCategory, string> = {
  combat: "戦闘",
  knowledge: "知識",
  medical: "医療",
  perception: "知覚",
  stealth: "隠密",
  technical: "技術",
  social: "対人",
  survival: "生存",
  other: "その他"
};

const derivedStatHelp: Record<DerivedStatKey, { title: string; summary: string; beginnerTip: string }> = {
  hp: {
    title: "耐久力",
    summary: "どれだけダメージに耐えられるかを表す値です。戦闘や事故で減っていきます。",
    beginnerTip: "倒れにくさを見たいときはまず HP を見れば十分です。CON と SIZ が高いほど上がります。"
  },
  mp: {
    title: "マジック・ポイント",
    summary: "呪文や特殊な処理で使う精神的なリソースです。POW から決まります。",
    beginnerTip: "普段は使わない探索者もいますが、超常に関わる場面では確認する値です。"
  },
  san: {
    title: "正気度",
    summary: "恐怖や怪異にどこまで耐えられるかを表す、CoC で特に重要な値です。",
    beginnerTip: "初期 SAN は POW 由来です。CoC らしい遊び心地に直結するので、初心者でも見ておくと分かりやすいです。"
  },
  moveRate: {
    title: "移動率",
    summary: "追跡や逃走でどれだけ素早く移動できるかの目安です。",
    beginnerTip: "STR（筋力）・DEX（敏捷）・SIZ（体格）の組み合わせで決まります。 追跡が重要な場面では重要度が上がります。"
  },
  build: {
    title: "体格差の指標",
    summary: "体の大きさと力強さをまとめた区分で、組み付きやダメージボーナスの判定に使います。",
    beginnerTip: "値そのものより、ダメージボーナスとセットで見ると意味がつかみやすいです。"
  },
  damageBonus: {
    title: "近接攻撃の補正",
    summary: "素手や近接武器のダメージに加わる補正です。STR（筋力）と SIZ（体格）から決まります。",
    beginnerTip: "殴る、蹴る、近接武器を使う予定がある探索者なら確認しておくと役立ちます。"
  }
};

const skillCategoryHelp: Record<SkillCategory, { usageExamples: string[]; beginnerHint: string }> = {
  combat: {
    usageExamples: ["戦闘中に攻撃や防御の判定をする。", "危険な場面を力押しで切り抜ける。"],
    beginnerHint: "戦闘の出番がある卓で強い技能群です。調査中心なら優先度は少し下がります。"
  },
  knowledge: {
    usageExamples: ["資料や専門知識から手掛かりを読む。", "世界観や情報の意味を整理する。"],
    beginnerHint: "調査で情報をつなぐ役に向いています。図書館や目星などの基本技能と組み合わせると安定します。"
  },
  medical: {
    usageExamples: ["傷病の対応や診断をする。", "死体や薬品から状況を推測する。"],
    beginnerHint: "仲間の支援や現場検証に関わることが多いカテゴリです。"
  },
  perception: {
    usageExamples: ["現場の違和感や痕跡を見つける。", "小さな物音や気配に気づく。"],
    beginnerHint: "初心者でも出番をイメージしやすい基本カテゴリです。"
  },
  stealth: {
    usageExamples: ["見つからないように動く。", "物を隠したり近づいたりする。"],
    beginnerHint: "危険回避や潜入で役立ちますが、調査の基本技能とは別軸です。"
  },
  technical: {
    usageExamples: ["機械や端末を操作する。", "装置や乗り物を扱う。"],
    beginnerHint: "現代寄りの卓や専門職で出番を作りやすいカテゴリです。"
  },
  social: {
    usageExamples: ["会話で協力や情報を引き出す。", "相手の本音や態度を読む。"],
    beginnerHint: "戦わずに進めたい探索者なら候補に入りやすいカテゴリです。"
  },
  survival: {
    usageExamples: ["野外や移動中の危険へ対応する。", "地形や足跡から進路を読む。"],
    beginnerHint: "追跡や探索行動が多いシナリオで光りやすいカテゴリです。"
  },
  other: {
    usageExamples: ["キャラクター固有の個性や表現に使う。", "場面に応じて卓独自の運用をする。"],
    beginnerHint: "役割を明確にすると活きやすいカテゴリです。シナリオやキャラクター像に寄せて選ぶと扱いやすいです。"
  }
};

const skillNameHighlightList = [...new Set(allSkillList.map((skill) => skill.name))]
  .sort((left, right) => right.length - left.length);

type SkillSidebarTab = "assignment" | "summary";
type OccupationSkillSelectionMap = Record<string, string[]>;

type CharacteristicInputState = Record<CharacteristicKey, string>;

const defaultCharacteristics: CharacteristicInputState = {
  str: "",
  con: "",
  pow: "",
  dex: "",
  app: "",
  siz: "",
  int: "",
  edu: ""
};

type CharacterWizardProps = {
  draftSheet?: CharacterSheet | null;
  onSaved?: (sheet: CharacterSheet) => void;
  onOpenCharacterArchive?: () => void;
  resetToken?: number;
};

export function CharacterWizard({ draftSheet, onSaved, onOpenCharacterArchive, resetToken = 0 }: CharacterWizardProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const lastResetTokenRef = useRef(resetToken);
  const [step, setStep] = useState(0);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(defaultBasicInfo);
  const [backstory, setBackstory] = useState<CharacterBackstory>(defaultCharacterBackstory);
  const [characteristics, setCharacteristics] = useState<CharacteristicInputState>(defaultCharacteristics);
  const [occupationAssigned, setOccupationAssigned] = useState<AssignedSkill[]>([]);
  const [optionalAssigned, setOptionalAssigned] = useState<AssignedSkill[]>([]);
  const [occupationSkillSelections, setOccupationSkillSelections] = useState<OccupationSkillSelectionMap>({});
  const [occupationChoiceDrafts, setOccupationChoiceDrafts] = useState<Record<string, string>>({});
  const [isProfessionModalOpen, setIsProfessionModalOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [rerollCount, setRerollCount] = useState(0);
  const [activeCharacteristicTip, setActiveCharacteristicTip] = useState<CharacteristicKey | null>(null);
  const [activeDerivedTip, setActiveDerivedTip] = useState<DerivedStatKey | null>(null);
  const [activeSkillHelpId, setActiveSkillHelpId] = useState<string | null>(null);
  const [activeProfessionPreviewSkillId, setActiveProfessionPreviewSkillId] = useState<string | null>(null);
  const [hobbySkillQuery, setHobbySkillQuery] = useState("");
  const [hobbySkillCategory, setHobbySkillCategory] = useState<"all" | SkillCategory>("perception");
  const [activeSkillSidebarTab, setActiveSkillSidebarTab] = useState<SkillSidebarTab>("assignment");
  const skillAllocationTopRef = useRef<HTMLDivElement | null>(null);

  const selectedProfession = useMemo(
    () => getProfessionById(basicInfo.professionId),
    [basicInfo.professionId]
  );
  const displayedProfessionName = useMemo(() => getDisplayedProfessionName(basicInfo), [basicInfo]);
  const professionSelectionValue = basicInfo.professionMode === "custom" ? CUSTOM_PROFESSION_OPTION_ID : basicInfo.professionId;

  const parsedCharacteristics = useMemo(() => {
    const next = {} as Characteristics;

    for (const key of characteristicKeys) {
      const rawValue = characteristics[key].trim();
      if (!rawValue) {
        return null;
      }
      const value = Number(rawValue);
      if (!Number.isInteger(value) || value < 1 || value > 99) {
        return null;
      }
      next[key] = value;
    }

    return next;
  }, [characteristics]);

  const derivedStats = useMemo(
    () => (parsedCharacteristics ? calculateDerivedStats(parsedCharacteristics) : null),
    [parsedCharacteristics]
  );

  const currentOccupationPoints = useMemo(() => {
    if (!selectedProfession || !parsedCharacteristics) {
      return null;
    }

    return calculateOccupationPoints(selectedProfession, parsedCharacteristics);
  }, [parsedCharacteristics, selectedProfession]);

  const currentOccupationPointCalculation = useMemo(() => {
    if (!selectedProfession || !parsedCharacteristics) {
      return null;
    }

    return calculateOccupationPointCalculation(selectedProfession, parsedCharacteristics);
  }, [parsedCharacteristics, selectedProfession]);

  const currentHobbyPoints = useMemo(() => {
    if (!parsedCharacteristics) {
      return null;
    }

    return calculateHobbyPoints(parsedCharacteristics);
  }, [parsedCharacteristics]);

  const ageGuide = useMemo(() => getAgeAdjustmentGuide(Number(basicInfo.age)), [basicInfo.age]);
  const occupationChoiceGroups = useMemo(
    () => getProfessionChoiceGroups(selectedProfession),
    [selectedProfession]
  );
  const normalizedOccupationSkillSelections = useMemo(
    () => normalizeOccupationSkillSelections(selectedProfession, occupationSkillSelections),
    [occupationSkillSelections, selectedProfession]
  );
  const resolvedOccupationSkills = useMemo(
    () => buildProfessionOccupationSkillPool(selectedProfession, normalizedOccupationSkillSelections),
    [normalizedOccupationSkillSelections, selectedProfession]
  );
  const occupationChoiceStatuses = useMemo(
    () => occupationChoiceGroups.map((group) => ({
      group,
      selectedSkillIds: normalizedOccupationSkillSelections[group.id] ?? [],
      remaining: Math.max(0, group.choose - (normalizedOccupationSkillSelections[group.id]?.length ?? 0)),
      isComplete: (normalizedOccupationSkillSelections[group.id]?.length ?? 0) === group.choose
    })),
    [normalizedOccupationSkillSelections, occupationChoiceGroups]
  );
  const activeProfessionPreviewSkill = useMemo(() => {
    if (!selectedProfession || !activeProfessionPreviewSkillId) {
      return null;
    }

    return [...selectedProfession.occupationSkills, ...selectedProfession.optionalSkills].find(
      (skill) => skill.id === activeProfessionPreviewSkillId
    ) ?? null;
  }, [activeProfessionPreviewSkillId, selectedProfession]);

  const occupationRemain = useMemo(() => {
    if (!selectedProfession || currentOccupationPoints === null) {
      return 0;
    }
    const used = occupationAssigned.reduce((total, skill) => total + skill.assigned, 0);
    return currentOccupationPoints - used;
  }, [currentOccupationPoints, occupationAssigned, selectedProfession]);

  const hobbyRemain = useMemo(() => {
    if (!selectedProfession || currentHobbyPoints === null) {
      return 0;
    }
    const used = optionalAssigned.reduce((total, skill) => total + skill.assigned, 0);
    return currentHobbyPoints - used;
  }, [currentHobbyPoints, optionalAssigned, selectedProfession]);

  const occupationAssignedById = useMemo(
    () => new Map(occupationAssigned.map((skill) => [skill.id, skill.assigned])),
    [occupationAssigned]
  );

  const optionalAssignedById = useMemo(
    () => new Map(optionalAssigned.map((skill) => [skill.id, skill.assigned])),
    [optionalAssigned]
  );

  const combinedSkillTotals = useMemo(
    () => buildCombinedSkillTotalMap(occupationAssigned, optionalAssigned),
    [occupationAssigned, optionalAssigned]
  );

  const normalizedHobbySkillQuery = hobbySkillQuery.trim().toLowerCase();

  const assignedOccupationSkills = useMemo(
    () => occupationAssigned.filter((skill) => skill.assigned > 0),
    [occupationAssigned]
  );

  const assignedOptionalSkills = useMemo(
    () => optionalAssigned.filter((skill) => skill.assigned > 0),
    [optionalAssigned]
  );

  const filteredHobbySkills = useMemo(() => {
    return optionalAssigned
      .filter((skill) => {
        if (hobbySkillCategory !== "all" && skill.category !== hobbySkillCategory) {
          return false;
        }

        if (!normalizedHobbySkillQuery) {
          return true;
        }

        return `${skill.name} ${skill.description} ${skillCategoryLabels[skill.category]}`.toLowerCase().includes(normalizedHobbySkillQuery);
      });
  }, [hobbySkillCategory, normalizedHobbySkillQuery, optionalAssigned]);

  const profileIssues = useMemo(() => {
    const issues: string[] = [];

    if (!basicInfo.characterName.trim()) {
      issues.push("キャラクター名を入力してください。");
    }
    if (!basicInfo.playerName.trim()) {
      issues.push("プレイヤー名を入力してください。");
    }
    if (!basicInfo.professionId) {
      issues.push("職業を選択してください。");
    }
    if (basicInfo.professionMode === "custom" && !basicInfo.professionName.trim()) {
      issues.push("自由入力の職業名を入力してください。");
    }
    if (basicInfo.age.trim()) {
      const ageValue = Number(basicInfo.age);
      if (!Number.isInteger(ageValue) || ageValue < 15 || ageValue > 99) {
        issues.push("年齢は 15 から 99 の整数で入力してください。空欄のままでも進めます。");
      }
    }

    const missingCharacteristics = characteristicKeys.filter((key) => !characteristics[key].trim());
    if (missingCharacteristics.length > 0) {
      issues.push(`能力値を入力してください: ${missingCharacteristics.map((key) => characteristicLabels[key]).join("、")}`);
    }

    const invalidCharacteristics = characteristicKeys.filter((key) => {
      const rawValue = characteristics[key].trim();
      if (!rawValue) {
        return false;
      }
      const value = Number(rawValue);
      return !Number.isInteger(value) || value < 1 || value > 99;
    });
    if (invalidCharacteristics.length > 0) {
      issues.push(`${invalidCharacteristics.map((key) => characteristicLabels[key]).join("、")} は 1 から 99 の整数で入力してください。`);
    }

    return issues;
  }, [basicInfo, characteristics]);

  const skillIssues = useMemo(() => {
    const issues: string[] = [];

    if (!selectedProfession) {
      issues.push("先に職業を選ぶと、配分できる技能が表示されます。");
      return issues;
    }
    if (!parsedCharacteristics) {
      issues.push("先に能力値を確定してください。");
      return issues;
    }
    if (occupationRemain !== 0) {
      issues.push(`職業ポイントを使い切ってください。残り ${occupationRemain} 点です。`);
    }
    if (hobbyRemain !== 0) {
      issues.push(`趣味ポイントを使い切ってください。残り ${hobbyRemain} 点です。`);
    }
    for (const status of occupationChoiceStatuses) {
      if (!status.isComplete) {
        issues.push(`職業技能の選択を完了してください: ${status.group.label}（あと ${status.remaining} 件）`);
      }
    }

    return issues;
  }, [selectedProfession, parsedCharacteristics, occupationRemain, hobbyRemain, occupationChoiceStatuses]);

  const reviewIssues = useMemo(
    () => [...profileIssues, ...skillIssues],
    [profileIssues, skillIssues]
  );

  const stepIssues = [profileIssues, skillIssues, reviewIssues];
  const showDerivedSummary = parsedCharacteristics !== null;
  const isEditingMode = Boolean(draftSheet);
  const showProfileStep = isEditingMode || step === 0;
  const showSkillStep = isEditingMode || step === 1;
  const showReviewStep = isEditingMode || step === 2;
  const canGoNext = useMemo(() => {
    if (step === 0) {
      return profileIssues.length === 0;
    }
    if (step === 1) {
      return skillIssues.length === 0;
    }

    return false;
  }, [profileIssues, skillIssues, step]);

  function goNext() {
    setStep((prev) => Math.min(prev + 1, stepLabels.length - 1));
  }

  function goBack() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  useEffect(() => {
    if (!draftSheet) {
      return;
    }

    const profession = getProfessionById(draftSheet.basicInfo.professionId);
    const inferredSelections = inferOccupationSkillSelections(profession, draftSheet.occupationSkillSelections, draftSheet.occupationSkills);
    const professionSkillState = buildProfessionSkillState(
      profession,
      inferredSelections,
      profession ? draftSheet.occupationSkills : [],
      draftSheet.optionalSkills
    );

    setEditingSheetId(draftSheet.id);
    setBasicInfo(normalizeBasicInfo(draftSheet.basicInfo));
    setBackstory(normalizeCharacterBackstory(draftSheet.backstory));
    setCharacteristics(toCharacteristicInputState(draftSheet.characteristics));
    setOccupationSkillSelections(professionSkillState.selections);
    setOccupationChoiceDrafts({});
    setOccupationAssigned(professionSkillState.assignments.occupationSkills);
    setOptionalAssigned(professionSkillState.assignments.optionalSkills);
    setStep(0);
    setSaveMessage("保存済みキャラクターを読み込みました。一画面ですべての項目を再編集できます。");
  }, [draftSheet]);

  useEffect(() => {
    if (lastResetTokenRef.current === resetToken) {
      return;
    }

    lastResetTokenRef.current = resetToken;
    setEditingSheetId(null);
    setStep(0);
    setBasicInfo(defaultBasicInfo);
    setBackstory(defaultCharacterBackstory);
    setCharacteristics(defaultCharacteristics);
    setOccupationAssigned([]);
    setOptionalAssigned([]);
    setOccupationSkillSelections({});
    setOccupationChoiceDrafts({});
    setIsProfessionModalOpen(false);
    setSaveMessage("");
    setRerollCount(0);
    setActiveSkillHelpId(null);
    setActiveProfessionPreviewSkillId(null);
    setHobbySkillQuery("");
    setHobbySkillCategory("perception");
    setActiveSkillSidebarTab("assignment");
  }, [resetToken]);

  useEffect(() => {
    setActiveProfessionPreviewSkillId(null);
  }, [basicInfo.professionId]);

  useEffect(() => {
    if (isEditingMode || step !== 1) {
      return;
    }

    requestAnimationFrame(() => {
      skillAllocationTopRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [isEditingMode, step]);

  function onChangeBasicInfo(field: keyof BasicInfo, value: string) {
    setSaveMessage("");
    setBasicInfo((prev) => ({ ...prev, [field]: value }));

    if (field === "professionId") {
      const profession = getProfessionById(value);
      if (!profession) {
        setOccupationAssigned([]);
        setOccupationSkillSelections({});
        setOccupationChoiceDrafts({});
        setOptionalAssigned(sanitizeAssignedSkillBuckets([], mergeAssignedSkills(allSkillList, optionalAssigned)).optionalSkills);
        return;
      }
      const nextSelections = createEmptyOccupationSkillSelections(profession);
      const professionSkillState = buildProfessionSkillState(
        profession,
        nextSelections,
        occupationAssigned,
        optionalAssigned
      );
      setOccupationSkillSelections(professionSkillState.selections);
      setOccupationChoiceDrafts({});
      setOccupationAssigned(professionSkillState.assignments.occupationSkills);
      setOptionalAssigned(professionSkillState.assignments.optionalSkills);
    }
  }

  function onChangeBackstory(field: keyof CharacterBackstory, value: string) {
    setSaveMessage("");
    setBackstory((current) => ({ ...current, [field]: value }));
  }

  function onSelectProfession(value: string) {
    if (value === CUSTOM_PROFESSION_OPTION_ID) {
      setSaveMessage("");
      setBasicInfo((prev) => ({ ...prev, professionMode: "custom" }));
      return;
    }

    setBasicInfo((prev) => ({ ...prev, professionMode: "preset", professionName: "" }));
    onChangeBasicInfo("professionId", value);
  }

  function onChangeCharacteristic(key: CharacteristicKey, value: string) {
    setSaveMessage("");
    setCharacteristics((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function rollCharacteristics() {
    const rolled = rollStandardCharacteristics();
    setCharacteristics(toCharacteristicInputState(rolled));
    setRerollCount((count) => count + 1);
    setSaveMessage("");
  }

  function adjustSkill(type: "occupation" | "optional", index: number, delta: number) {
    const current = type === "occupation" ? occupationAssigned[index] : optionalAssigned[index];
    if (!current) {
      return;
    }

    setSkillAssigned(type, index, current.assigned + delta);
  }

  function setSkillAssigned(type: "occupation" | "optional", index: number, nextAssigned: number) {
    const isOccupation = type === "occupation";
    const setter = isOccupation ? setOccupationAssigned : setOptionalAssigned;
    const otherAssignedById = isOccupation ? optionalAssignedById : occupationAssignedById;
    const budget = isOccupation
      ? currentOccupationPoints ?? 0
      : currentHobbyPoints ?? 0;

    setter((current) => {
      const target = current[index];
      if (!target) {
        return current;
      }

      const usedWithoutTarget = current.reduce(
        (total, skill, skillIndex) => total + (skillIndex === index ? 0 : skill.assigned),
        0
      );
      const maxFromBudget = Math.max(0, budget - usedWithoutTarget);
      const otherAssigned = otherAssignedById.get(target.id) ?? 0;
      const maxFromSkill = Math.max(0, target.max - target.base - otherAssigned);
      const safeAssigned = Number.isFinite(nextAssigned) ? nextAssigned : 0;
      const clampedAssigned = Math.max(0, Math.min(safeAssigned, maxFromBudget, maxFromSkill));

      return current.map((skill, skillIndex) => {
        if (skillIndex !== index) {
          return skill;
        }

        return {
          ...skill,
          assigned: clampedAssigned,
          total: Math.min(skill.max, skill.base + clampedAssigned + otherAssigned)
        };
      });
    });
  }

  function applyOccupationSkillSelections(nextSelections: OccupationSkillSelectionMap) {
    if (!selectedProfession) {
      setOccupationSkillSelections({});
      setOccupationAssigned([]);
      return;
    }

    const professionSkillState = buildProfessionSkillState(
      selectedProfession,
      nextSelections,
      occupationAssigned,
      optionalAssigned
    );

    setOccupationSkillSelections(professionSkillState.selections);
    setOccupationAssigned(professionSkillState.assignments.occupationSkills);
    setOptionalAssigned(professionSkillState.assignments.optionalSkills);
  }

  function toggleOccupationChoice(groupId: string, skillId: string) {
    const group = occupationChoiceGroups.find((item) => item.id === groupId);
    if (!selectedProfession || !group) {
      return;
    }

    const nextSelections = Object.fromEntries(
      occupationChoiceGroups.map((item) => [item.id, [...(normalizedOccupationSkillSelections[item.id] ?? [])]])
    ) as OccupationSkillSelectionMap;
    const currentGroupSelections = nextSelections[groupId] ?? [];

    if (currentGroupSelections.includes(skillId)) {
      nextSelections[groupId] = currentGroupSelections.filter((item) => item !== skillId);
      applyOccupationSkillSelections(nextSelections);
      return;
    }

    const isUsedInAnotherGroup = occupationChoiceGroups.some((item) => item.id !== groupId && (nextSelections[item.id] ?? []).includes(skillId));
    if (isUsedInAnotherGroup || currentGroupSelections.length >= group.choose || !isSkillAllowedInChoiceGroup(group, skillId)) {
      return;
    }

    nextSelections[groupId] = [...currentGroupSelections, skillId];
    applyOccupationSkillSelections(nextSelections);
  }

  function addAnyOccupationChoice(groupId: string) {
    const skillId = occupationChoiceDrafts[groupId]?.trim();
    if (!skillId) {
      return;
    }

    toggleOccupationChoice(groupId, skillId);
    setOccupationChoiceDrafts((current) => ({
      ...current,
      [groupId]: ""
    }));
  }

  function clearOccupationSkillAssignments() {
    setOccupationAssigned((current) => current.map((skill) => ({
      ...skill,
      assigned: 0,
      total: skill.base
    })));
    setSaveMessage("");
  }

  function clearHobbySkillAssignments() {
    setOptionalAssigned((current) => current.map((skill) => ({
      ...skill,
      assigned: 0,
      total: skill.base
    })));
    setSaveMessage("");
  }

  function buildCharacterSheet(): CharacterSheet {
    if (!parsedCharacteristics || !derivedStats) {
      throw new Error("キャラクター保存前に能力値を確定してください。");
    }

    const timestamp = new Date().toISOString();
    const sanitizedAssignments = sanitizeAssignedSkillBuckets(occupationAssigned, optionalAssigned);

    return {
      id: editingSheetId ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      basicInfo,
      backstory,
      characteristics: parsedCharacteristics,
      derivedStats,
      occupationSkillSelections: normalizedOccupationSkillSelections,
      occupationSkills: sanitizedAssignments.occupationSkills.filter((skill) => skill.assigned > 0),
      optionalSkills: sanitizedAssignments.optionalSkills.filter((skill) => skill.assigned > 0),
      weapons: [],
      notes: "",
      condition: {
        currentHp: Number(derivedStats.hp),
        currentMp: Number(derivedStats.mp),
        currentSan: Number(derivedStats.san),
        wounds: [],
        insanityHistory: []
      },
      updatedAt: timestamp
    };
  }

  function onSaveCharacterSheet() {
    const sheet = buildCharacterSheet();
    saveCharacterSheet(sheet);
    setEditingSheetId(sheet.id);
    onSaved?.(sheet);
    setSaveMessage("キャラクターをブラウザに保存しました。後で管理画面から再利用できます。");
  }

  function handleSkillHelpToggle(skillId: string) {
    setActiveSkillHelpId((current) => current === skillId ? null : skillId);
  }

  function renderIssues(issues: string[], variant?: "skill") {
    if (issues.length === 0) {
      return null;
    }

    return (
      <div className={`form-note error-note wizard-floating-error ${variant === "skill" ? "wizard-floating-error-skill" : ""}`.trim()} role="alert">
        <strong>この画面で確認すること</strong>
        <ul>
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </div>
    );
  }

  useEffect(() => {
    if (step !== 2) {
      return;
    }

    titleRef.current?.focus();
  }, [step]);

  return (
    <section className="card">
      <h1 ref={titleRef} className="title" tabIndex={-1}>クトゥルフ神話TRPG キャラ作成</h1>
      <p className="subtitle">基本情報と能力値を同じ画面で決め、次に技能配分へ進む 3 ステップ構成です。</p>

      {!isEditingMode ? (
        <div className="wizard-intro wizard-intro-single">
          <div className="wizard-intro-copy wizard-intro-priority">
            <p className="wizard-section-eyebrow">この画面でやること</p>
            <strong>必須の基本情報を入れて、能力値を確定する</strong>
            <ul className="wizard-intro-list">
              <li>必須入力は キャラクター名 / プレイヤー名 / 職業 です。</li>
              <li>能力値は空欄から始まります。ロールするか、卓ルールに合わせて入力します。</li>
              <li>職業は能力値を見ながら途中で変更できます。</li>
            </ul>
          </div>
        </div>
      ) : null}

      {!isEditingMode ? (
        <div className="steps wizard-steps">
          {stepLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`step wizard-step ${index === step ? "active" : ""} ${index < step && stepIssues[index].length === 0 ? "step-complete" : ""}`}
              onClick={() => {
                if (index <= step) {
                  setStep(index);
                }
              }}
            >
              <span className="wizard-step-index">{index + 1}</span>
              <span className="wizard-step-copy">
                <strong>{label}</strong>
                <span>{stepDescriptions[index]}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className={`wizard-layout ${step === 0 && !isEditingMode ? "wizard-layout-focus" : ""}`}>
        <div className="wizard-main">
          <section className="wizard-section">
            <div className="wizard-section-header">
              <div>
                <h2>{isEditingMode ? "保存済みキャラクターの再編集" : stepLabels[step]}</h2>
                <p className="helper-text">{isEditingMode ? "基本情報、能力値、技能配分、バックストーリーをこの画面でまとめて修正できます。" : stepDescriptions[step]}</p>
              </div>
            </div>

            {showProfileStep ? (
              <div className="grid">
                {renderIssues(profileIssues)}

                <div className="wizard-flow-stack">
                  <section className="stat-panel wizard-section-card">
                    <div className="wizard-section-intro">
                      <div>
                        <p className="wizard-section-eyebrow">Step 1</p>
                        <h3>探索者の基本情報を決める</h3>
                      </div>
                      <p className="wizard-section-summary">まずは記録に必要な情報だけを確定します。補足は後から見返せる形にしています。</p>
                    </div>

                    <div className="wizard-form">
                    <label>
                      <span className="wizard-field-heading">
                        <span>キャラクター名</span>
                        <span className="wizard-field-meta wizard-field-meta-required">必須</span>
                      </span>
                      <input
                        value={basicInfo.characterName}
                        placeholder="例: 緋村 律"
                        onChange={(event) => onChangeBasicInfo("characterName", event.target.value)}
                        aria-invalid={!basicInfo.characterName.trim()}
                      />
                    </label>

                    <label>
                      <span className="wizard-field-heading">
                        <span>プレイヤー名</span>
                        <span className="wizard-field-meta wizard-field-meta-required">必須</span>
                      </span>
                      <input
                        value={basicInfo.playerName}
                        placeholder="例: 山田"
                        onChange={(event) => onChangeBasicInfo("playerName", event.target.value)}
                        aria-invalid={!basicInfo.playerName.trim()}
                      />
                    </label>

                    <div className="grid two wizard-inline-fields">
                      <label>
                        <span className="wizard-field-heading">
                          <span>年齢</span>
                          <span className="wizard-field-meta">任意</span>
                        </span>
                        <input
                          type="number"
                          min={15}
                          max={99}
                          inputMode="numeric"
                          placeholder="24"
                          value={basicInfo.age}
                          onChange={(event) => onChangeBasicInfo("age", event.target.value)}
                          aria-invalid={Boolean(basicInfo.age.trim() && profileIssues.some((issue) => issue.includes("年齢")))}
                        />
                        <span className="helper-text">例: 24</span>
                      </label>

                      <label>
                        <span className="wizard-field-heading">
                          <span>性別・性自認</span>
                          <span className="wizard-field-meta">任意</span>
                        </span>
                        <input
                          placeholder="必要なら記入"
                          value={basicInfo.gender}
                          onChange={(event) => onChangeBasicInfo("gender", event.target.value)}
                        />
                        <span className="helper-text">必要なければ空欄で構いません。</span>
                      </label>
                    </div>

                    <label>
                      <span className="wizard-field-heading">
                        <span>職業</span>
                        <span className="wizard-field-meta wizard-field-meta-required">必須</span>
                      </span>
                      <select
                        value={professionSelectionValue}
                        onChange={(event) => onSelectProfession(event.target.value)}
                        aria-invalid={!basicInfo.professionId}
                      >
                        <option value="">選択してください</option>
                        <option value={CUSTOM_PROFESSION_OPTION_ID}>自由入力</option>
                        {professionList.map((profession) => (
                          <option key={profession.id} value={profession.id}>
                            {profession.name}
                          </option>
                        ))}
                      </select>
                      <span className="helper-text">技能候補と配分ポイントは選択後に自動で準備されます。</span>
                    </label>

                    {basicInfo.professionMode === "custom" ? (
                      <div className="grid two wizard-inline-fields">
                        <label>
                          <span className="wizard-field-heading">
                            <span>自由入力の職業名</span>
                            <span className="wizard-field-meta wizard-field-meta-required">必須</span>
                          </span>
                          <input
                            value={basicInfo.professionName}
                            placeholder="例: 古物研究家"
                            onChange={(event) => onChangeBasicInfo("professionName", event.target.value)}
                            aria-invalid={!basicInfo.professionName.trim()}
                          />
                        </label>

                        <label>
                          <span className="wizard-field-heading">
                            <span>ルール参照元の職業</span>
                            <span className="wizard-field-meta wizard-field-meta-required">必須</span>
                          </span>
                          <select
                            value={basicInfo.professionId}
                            onChange={(event) => onChangeBasicInfo("professionId", event.target.value)}
                            aria-invalid={!basicInfo.professionId}
                          >
                            <option value="">ベースにする職業を選択</option>
                            {professionList.map((profession) => (
                              <option key={`${profession.id}-base`} value={profession.id}>
                                {profession.name}
                              </option>
                            ))}
                          </select>
                          <span className="helper-text">職業ポイントと技能候補はこの職業を基準に計算します。</span>
                        </label>
                      </div>
                    ) : null}

                    <label>
                      <span className="wizard-field-heading">
                        <span>時代設定</span>
                        <span className="wizard-field-meta">任意</span>
                      </span>
                      <input
                        list="era-suggestions"
                        value={basicInfo.era}
                        placeholder="例: modern / classic / 1920s"
                        onChange={(event) => onChangeBasicInfo("era", event.target.value)}
                      />
                      <datalist id="era-suggestions">
                        {eraSuggestions.map((era) => (
                          <option key={era} value={era} />
                        ))}
                      </datalist>
                      <span className="helper-text">迷う場合は modern か classic を入力してください。</span>
                    </label>

                    <div className="profession-actions">
                      <button className="secondary" type="button" onClick={() => setIsProfessionModalOpen(true)}>
                        職業一覧から比較する
                      </button>
                      <span className="helper-text">候補を比較したいときだけ開いてください。</span>
                    </div>

                    {selectedProfession ? (
                      <div className="stat-panel wizard-preview-panel">
                        <div className="wizard-preview-header">
                          <div className="wizard-preview-title-block">
                            <span className="wizard-field-meta wizard-field-meta-accent">選択中の職業</span>
                            <h3>{displayedProfessionName || selectedProfession.name}</h3>
                          </div>
                        </div>
                        {basicInfo.professionMode === "custom" && basicInfo.professionName.trim() ? <p className="helper-text">ルール参照元: {selectedProfession.name}</p> : null}
                        <p className="wizard-preview-description">{selectedProfession.description}</p>
                        <div className="detail-list wizard-preview-detail-list">
                          <div className="wizard-preview-detail-row">
                            <strong>信用範囲</strong>
                            <span>{selectedProfession.creditRating.min} - {selectedProfession.creditRating.max}</span>
                          </div>
                          <div className="wizard-preview-detail-row">
                            <strong>職業ポイント式</strong>
                            <span>{currentOccupationPointCalculation?.selectedFormula ?? selectedProfession.occupationalPointsFormula}</span>
                          </div>
                          <div className="wizard-preview-detail-row">
                            <strong>趣味ポイント式</strong>
                            <span>{selectedProfession.hobbyPointsFormula}</span>
                          </div>
                          <div className="wizard-preview-detail-row">
                            <strong>おすすめ能力値</strong>
                            <span>{selectedProfession.recommendedCharacteristics.map((item) => characteristicLabels[item]).join(" / ")}</span>
                          </div>
                        </div>
                        <ul className="feature-list wizard-preview-notes">
                          {selectedProfession.beginnerNotes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                        <details className="stat-panel wizard-inline-details wizard-profession-skills-panel">
                          <summary>この職業で選択できる技能は？</summary>
                          <div className="wizard-profession-skills-sections">
                            <div>
                              <strong>候補技能</strong>
                              <div className="reference-tag-list wizard-profession-skill-tags">
                                {selectedProfession.occupationSkills.map((skill) => (
                                  <button
                                    key={`${selectedProfession.id}-occupation-${skill.id}`}
                                    type="button"
                                    className={`reference-tag wizard-profession-skill-button ${activeProfessionPreviewSkillId === skill.id ? "is-active" : ""}`}
                                    onClick={() => setActiveProfessionPreviewSkillId((current) => current === skill.id ? null : skill.id)}
                                  >
                                    {skill.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {selectedProfession.skillChoiceNotes?.length ? (
                              <div>
                                <strong>選択ルール</strong>
                                <ul className="feature-list wizard-preview-notes">
                                  {selectedProfession.skillChoiceNotes.map((note) => (
                                    <li key={`${selectedProfession.id}-choice-${note}`}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {selectedProfession.optionalSkills.length ? (
                              <div>
                                <strong>補足候補</strong>
                                <div className="reference-tag-list wizard-profession-skill-tags">
                                  {selectedProfession.optionalSkills.map((skill) => (
                                    <button
                                      key={`${selectedProfession.id}-optional-${skill.id}`}
                                      type="button"
                                      className={`reference-tag wizard-profession-skill-button ${activeProfessionPreviewSkillId === skill.id ? "is-active" : ""}`}
                                      onClick={() => setActiveProfessionPreviewSkillId((current) => current === skill.id ? null : skill.id)}
                                    >
                                      {skill.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {activeProfessionPreviewSkill ? (
                              <div className="wizard-profession-skill-preview" role="status" aria-live="polite">
                                <div className="wizard-profession-skill-preview-header">
                                  <strong>{activeProfessionPreviewSkill.name}</strong>
                                  <span className="wizard-skill-chip">{skillCategoryLabels[activeProfessionPreviewSkill.category]}</span>
                                </div>
                                <p>{activeProfessionPreviewSkill.usageSummary ?? activeProfessionPreviewSkill.description}</p>
                                <div className="wizard-profession-skill-preview-stats">
                                  <span>初期値 {activeProfessionPreviewSkill.base}</span>
                                  <span>上限 {activeProfessionPreviewSkill.max}</span>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      </div>
                    ) : null}
                    </div>
                  </section>

                  <section className="stat-panel wizard-section-card">
                    <div className="wizard-section-intro">
                      <div>
                        <p className="wizard-section-eyebrow">Step 2</p>
                        <h3>能力値を決める</h3>
                      </div>
                      <p className="wizard-section-summary">ロールか手入力で 8 つの能力値を確定します。揃うと下に派生値が出ます。ロールのみでの最大値は <span className="wizard-skill-total-value">90</span> です。</p>
                      <p className="wizard-section-summary">？ アイコンを押下することで、能力値ガイドを確認することができます。</p>
                    </div>

                    <div className="wizard-form">
                    <div className="roll-actions wizard-toolbar wizard-compact-toolbar">
                      <button className="secondary" type="button" onClick={rollCharacteristics}>
                        {rerollCount === 0 ? "能力値を決める" : "もう一度ロールする"}
                      </button>
                      <span className="wizard-inline-rule">STR/CON/POW/DEX/APP は 3D6×5、SIZ/INT/EDU は (2D6+6)×5</span>
                    </div>

                    {rerollCount > 0 ? (
                      <div className="helper-text wizard-status-text">現在のロール回数: <span className="wizard-skill-total-value">{rerollCount}</span> 回</div>
                    ) : null}

                    {ageGuide ? (
                      <details className="stat-panel wizard-inline-details">
                        <summary>{ageGuide.title}</summary>
                        <ul>
                          {ageGuide.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        {ageGuide.caution ? <p className="helper-text">{ageGuide.caution}</p> : null}
                      </details>
                    ) : null}

                    <div className="wizard-characteristic-grid">
                      {characteristicKeys.map((key) => (
                        <div key={key} className={`wizard-characteristic-card ${characteristicVisualGroups[key].toneClassName}`}>
                          <div className="wizard-characteristic-header">
                            <label htmlFor={`characteristic-${key}`}>
                              <span className="wizard-characteristic-group-label">{characteristicVisualGroups[key].label}</span>
                              <span>{characteristicLabels[key]}</span>
                            </label>
                            <button
                              type="button"
                              className="wizard-tooltip-trigger"
                              aria-expanded={activeCharacteristicTip === key}
                              aria-label={`${characteristicLabels[key]} の説明を表示`}
                              onClick={() => setActiveCharacteristicTip((current) => (current === key ? null : key))}
                            >
                              ?
                            </button>
                          </div>
                          <div className="wizard-characteristic-input-row">
                            <input
                              id={`characteristic-${key}`}
                              type="number"
                              min={1}
                              max={99}
                              value={characteristics[key]}
                              onChange={(event) => onChangeCharacteristic(key, event.target.value)}
                            />
                            <span className="wizard-characteristic-max">/99</span>
                          </div>
                          <span className="wizard-characteristic-caption">{characteristicHelp[key].title}</span>
                        </div>
                      ))}
                    </div>

                    <div className="wizard-characteristic-help-panel" role="note" aria-live="polite">
                      {activeCharacteristicTip ? (
                        <>
                          <div className="wizard-characteristic-help-header">
                            <strong>{characteristicLabels[activeCharacteristicTip]}: {characteristicHelp[activeCharacteristicTip].title}</strong>
                            <button
                              type="button"
                              className="wizard-help-close"
                              aria-label="能力値の説明を閉じる"
                              onClick={() => setActiveCharacteristicTip(null)}
                            >
                              閉じる
                            </button>
                          </div>
                          <p>{characteristicHelp[activeCharacteristicTip].summary}</p>
                          <p>{characteristicHelp[activeCharacteristicTip].beginnerTip}</p>
                          <div className="wizard-characteristic-value-guide">
                            <strong>値の目安</strong>
                            <div className="wizard-characteristic-value-list">
                              {characteristicHelp[activeCharacteristicTip].valueMeanings.map((entry) => (
                                <div key={`${activeCharacteristicTip}-${entry.value}`} className="wizard-characteristic-value-item">
                                  <span>{entry.value}</span>
                                  <p>{entry.meaning}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <strong>能力値ガイド</strong>
                          <p>各能力値の ? を押すと、その能力値が何を表すかに加えて、値ごとの目安もここで確認できます。</p>
                        </>
                      )}
                    </div>

                    <div className="wizard-inline-summary-grid">
                      <div className="stat-panel">
                        <h3>派生値</h3>
                        <div className="derived-list">
                          {derivedStatKeys.map((key) => (
                            <div key={key} className="skill-row wizard-derived-row">
                              <div className="wizard-derived-label-wrap">
                                <span>{derivedStatLabels[key]}</span>
                                <button
                                  type="button"
                                  className="wizard-tooltip-trigger"
                                  aria-expanded={activeDerivedTip === key}
                                  aria-label={`${derivedStatLabels[key]} の説明を表示`}
                                  onClick={() => setActiveDerivedTip((current) => (current === key ? null : key))}
                                >
                                  ?
                                </button>
                              </div>
                              <strong>{derivedStats ? String(derivedStats[key]) : ""}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="wizard-characteristic-help-panel wizard-derived-help-panel" role="note" aria-live="polite">
                          {activeDerivedTip ? (
                            <>
                              <div className="wizard-characteristic-help-header">
                                <strong>{derivedStatLabels[activeDerivedTip]}: {derivedStatHelp[activeDerivedTip].title}</strong>
                                <button
                                  type="button"
                                  className="wizard-help-close"
                                  aria-label="派生値の説明を閉じる"
                                  onClick={() => setActiveDerivedTip(null)}
                                >
                                  閉じる
                                </button>
                              </div>
                              <p>{derivedStatHelp[activeDerivedTip].summary}</p>
                              <p>{derivedStatHelp[activeDerivedTip].beginnerTip}</p>
                            </>
                          ) : (
                            <>
                              <strong>派生値ガイド</strong>
                              <p>各派生値の ? を押すと、その値の意味や見どころをここで確認できます。</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="wizard-inline-panel">
                        <details className="stat-panel wizard-inline-details">
                          <summary>計算の見方</summary>
                          <ul>
                            <li>HP = (CON + SIZ) / 10 の切り捨て</li>
                            <li>MP = POW / 5 の切り捨て</li>
                            <li>初期SAN = POW</li>
                            <li>MOV は STR、DEX と SIZ の比較で決まる</li>
                            <li>ビルド とダメージボーナスは STR + SIZ から決まる</li>
                            <li>職業ポイントは職業ごとの能力値式から計算</li>
                            <li>趣味ポイントは INT × 2</li>
                          </ul>
                        </details>

                        <div className="stat-panel wizard-points-panel">
                          <h3>技能ポイント計算</h3>
                          {selectedProfession ? (
                            parsedCharacteristics ? (
                              <div className="derived-list">
                                <div className="skill-row"><span>職業ポイント式</span><strong>{currentOccupationPointCalculation?.selectedFormula ?? selectedProfession.occupationalPointsFormula}</strong></div>
                                <div className="skill-row"><span>計算結果</span><strong className="wizard-skill-total-value">{currentOccupationPoints ?? "-"}</strong></div>
                                <div className="skill-row"><span>趣味ポイント式</span><strong>{selectedProfession.hobbyPointsFormula}</strong></div>
                                <div className="skill-row"><span>計算結果</span><strong className="wizard-skill-total-value">{currentHobbyPoints ?? "-"}</strong></div>
                              </div>
                            ) : (
                              <p className="helper-text">能力値が揃うと、ここに職業ポイントと趣味ポイントの計算結果が表示されます。</p>
                            )
                          ) : (
                            <p className="helper-text">先に職業を選ぶと、対応する職業ポイント式をここで確認できます。</p>
                          )}
                        </div>
                      </div>
                    </div>
                    </div>
                  </section>
                </div>

                {isProfessionModalOpen ? (
                  <ProfessionModal
                    selectedProfessionId={basicInfo.professionId}
                    onClose={() => setIsProfessionModalOpen(false)}
                    onSelect={(professionId) => {
                      if (basicInfo.professionMode === "custom") {
                        onChangeBasicInfo("professionId", professionId);
                      } else {
                        onSelectProfession(professionId);
                      }
                      setIsProfessionModalOpen(false);
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            {showSkillStep ? (
              <div className="grid" ref={skillAllocationTopRef}>
                {renderIssues(skillIssues, "skill")}

                <div className="form-note">
                  <strong>ポイント調整のしかた</strong>
                  <ul>
                    <li>1 点刻みと 5 点刻みの両方を使えます。</li>
                    <li>スライダーを左右に動かして、配分量をまとめて調整できます。</li>
                    <li>数値欄に直接入力すると、その技能に配分するポイントをまとめて変更できます。</li>
                    <li>上限値を超える入力や、残ポイントを超える入力は自動で止まります。</li>
                  </ul>
                </div>

                <div className="wizard-skill-actions">
                  <button type="button" className="wizard-danger-button" onClick={clearOccupationSkillAssignments}>
                    職業をクリア
                  </button>
                  <button type="button" className="wizard-danger-button" onClick={clearHobbySkillAssignments}>
                    趣味をクリア
                  </button>
                  <span className="helper-text">配分だけを 0 に戻します。選んだ職業技能の候補は残します。</span>
                </div>

                <div className="wizard-skill-layout">
                  <div className="wizard-skill-main">
                    <div className="wizard-skill-columns">
                      <div className="wizard-skill-column wizard-skill-column-occupation">
                        <div className="wizard-skill-column-header">
                          <div>
                            <h3>職業技能に配分</h3>
                            <p className="helper-text">まず職業ごとの選択ルールに沿って技能を選び、そのあと表示された技能へポイントを配分します。</p>
                          </div>
                        </div>
                        {occupationChoiceStatuses.length > 0 ? (
                          <div className="wizard-occupation-choice-panel">
                            {occupationChoiceStatuses.map((status) => {
                              const selectedSkillIds = status.selectedSkillIds;
                              const selectedSkills = selectedSkillIds
                                .map((skillId) => allSkillList.find((skill) => skill.id === skillId))
                                .filter((skill): skill is Skill => Boolean(skill));
                              const suggestedSkills = (status.group.suggestedSkillIds ?? [])
                                .map((skillId) => allSkillList.find((skill) => skill.id === skillId))
                                .filter((skill): skill is Skill => Boolean(skill));
                              const optionSkills = (status.group.skillIds ?? [])
                                .map((skillId) => allSkillList.find((skill) => skill.id === skillId))
                                .filter((skill): skill is Skill => Boolean(skill));

                              return (
                                <section key={status.group.id} className={`wizard-occupation-choice-group ${status.isComplete ? "is-complete" : ""}`}>
                                  <div className="wizard-occupation-choice-header">
                                    <div>
                                      <strong>{status.group.label}</strong>
                                      <span>{selectedSkillIds.length} / {status.group.choose} 件選択</span>
                                    </div>
                                    <span className={`wizard-skill-chip ${status.isComplete ? "wizard-skill-chip-accent" : ""}`}>
                                      {status.isComplete ? "選択済み" : `あと ${status.remaining}`}
                                    </span>
                                  </div>

                                  {optionSkills.length > 0 ? (
                                    <div className="reference-tag-list wizard-occupation-choice-options">
                                      {optionSkills.map((skill) => {
                                        const isSelected = selectedSkillIds.includes(skill.id);
                                        const isLocked = !isSelected && selectedSkillIds.length >= status.group.choose;
                                        return (
                                          <button
                                            key={`${status.group.id}-${skill.id}`}
                                            type="button"
                                            className={`reference-tag wizard-choice-chip ${isSelected ? "is-selected" : ""}`}
                                            onClick={() => toggleOccupationChoice(status.group.id, skill.id)}
                                            disabled={isLocked}
                                          >
                                            {skill.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : null}

                                  {status.group.allowAny ? (
                                    <div className="wizard-occupation-choice-any-picker">
                                      <label>
                                        技能を選択
                                        <select
                                          value={occupationChoiceDrafts[status.group.id] ?? ""}
                                          onChange={(event) => setOccupationChoiceDrafts((current) => ({
                                            ...current,
                                            [status.group.id]: event.target.value
                                          }))}
                                        >
                                          <option value="">技能を選んでください</option>
                                          {allSkillList.map((skill) => {
                                            const isSelectedInAnotherGroup = occupationChoiceStatuses.some((otherStatus) => (
                                              otherStatus.group.id !== status.group.id && otherStatus.selectedSkillIds.includes(skill.id)
                                            ));
                                            const isFixedSkill = resolvedOccupationSkills.some((occupationSkill) => occupationSkill.id === skill.id)
                                              && !selectedSkillIds.includes(skill.id);
                                            return (
                                              <option key={`${status.group.id}-${skill.id}`} value={skill.id} disabled={isSelectedInAnotherGroup || isFixedSkill}>
                                                {skill.name}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </label>
                                      <button
                                        type="button"
                                        className="secondary"
                                        onClick={() => addAnyOccupationChoice(status.group.id)}
                                        disabled={selectedSkillIds.length >= status.group.choose || !(occupationChoiceDrafts[status.group.id] ?? "")}
                                      >
                                        追加
                                      </button>
                                    </div>
                                  ) : null}

                                  {suggestedSkills.length > 0 ? (
                                    <div className="reference-tag-list wizard-occupation-choice-suggestions">
                                      {suggestedSkills.map((skill) => {
                                        const isSelected = selectedSkillIds.includes(skill.id);
                                        const isLocked = !isSelected && selectedSkillIds.length >= status.group.choose;
                                        return (
                                          <button
                                            key={`${status.group.id}-suggested-${skill.id}`}
                                            type="button"
                                            className={`reference-tag wizard-choice-chip wizard-choice-chip-suggested ${isSelected ? "is-selected" : ""}`}
                                            onClick={() => toggleOccupationChoice(status.group.id, skill.id)}
                                            disabled={isLocked}
                                          >
                                            {skill.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : null}

                                  {selectedSkills.length > 0 ? (
                                    <div className="reference-tag-list wizard-occupation-choice-selected">
                                      {selectedSkills.map((skill) => (
                                        <button
                                          key={`${status.group.id}-selected-${skill.id}`}
                                          type="button"
                                          className="reference-tag wizard-choice-chip is-selected"
                                          onClick={() => toggleOccupationChoice(status.group.id, skill.id)}
                                        >
                                          {skill.name} ×
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </section>
                              );
                            })}
                          </div>
                        ) : null}
                        <div className="skills wizard-skill-list">
                          {occupationAssigned.map((skill, index) => (
                            <SkillAssignmentCard
                              key={skill.name}
                              skill={skill}
                              isHelpActive={activeSkillHelpId === skill.id}
                              isOccupationCandidate={false}
                              occupationAssignedValue={skill.assigned}
                              optionalAssignedValue={optionalAssignedById.get(skill.id) ?? 0}
                              totalValue={combinedSkillTotals.get(skill.id) ?? skill.base + skill.assigned}
                              remainingBudget={occupationRemain}
                              maxAssignable={Math.max(0, Math.min(skill.max - skill.base - (optionalAssignedById.get(skill.id) ?? 0), skill.assigned + occupationRemain))}
                              quickLabel={skillCategoryLabels[skill.category]}
                              onOpenHelp={() => handleSkillHelpToggle(skill.id)}
                              onDecreaseFive={() => adjustSkill("occupation", index, -5)}
                              onDecreaseOne={() => adjustSkill("occupation", index, -1)}
                              onIncreaseOne={() => adjustSkill("occupation", index, 1)}
                              onIncreaseFive={() => adjustSkill("occupation", index, 5)}
                              onDirectChange={(value) => setSkillAssigned("occupation", index, value)}
                            />
                          ))}
                          {occupationAssigned.length === 0 ? (
                            <div className="wizard-empty-selection-note">
                              <strong>まだ職業技能が選ばれていません。</strong>
                              <span>上の選択ルールから必要数を選ぶと、ここに配分対象の技能が表示されます。</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="wizard-skill-column wizard-skill-column-hobby">
                        <div className="wizard-skill-column-header">
                          <div>
                            <h3>趣味技能に配分</h3>
                            <p className="helper-text">全技能から選べます。検索やカテゴリで絞って、軽い説明を見ながら振り分けてください。</p>
                          </div>
                        </div>
                        <div className="wizard-skill-filter-bar">
                          <label>
                            技能を検索
                            <input
                              type="search"
                              placeholder="名称や説明で検索"
                              value={hobbySkillQuery}
                              onChange={(event) => setHobbySkillQuery(event.target.value)}
                            />
                          </label>
                          <label>
                            カテゴリ
                            <select value={hobbySkillCategory} onChange={(event) => setHobbySkillCategory(event.target.value as "all" | SkillCategory)}>
                              <option value="all">すべて</option>
                              {(Object.entries(skillCategoryLabels) as Array<[SkillCategory, string]>).map(([category, label]) => (
                                <option key={category} value={category}>{label}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="skills wizard-skill-list">
                          {filteredHobbySkills.map((skill) => {
                            const index = optionalAssigned.findIndex((item) => item.id === skill.id);
                            const isOccupationCandidate = occupationAssigned.some((occupationSkill) => occupationSkill.id === skill.id);
                            return (
                            <SkillAssignmentCard
                              key={skill.id}
                              skill={skill}
                              isHelpActive={activeSkillHelpId === skill.id}
                              isOccupationCandidate={isOccupationCandidate}
                              occupationAssignedValue={occupationAssignedById.get(skill.id) ?? 0}
                              optionalAssignedValue={skill.assigned}
                              totalValue={combinedSkillTotals.get(skill.id) ?? skill.base + skill.assigned}
                              remainingBudget={hobbyRemain}
                              maxAssignable={Math.max(0, Math.min(skill.max - skill.base - (occupationAssignedById.get(skill.id) ?? 0), skill.assigned + hobbyRemain))}
                              quickLabel={skillCategoryLabels[skill.category]}
                              onOpenHelp={() => handleSkillHelpToggle(skill.id)}
                              onDecreaseFive={() => adjustSkill("optional", index, -5)}
                              onDecreaseOne={() => adjustSkill("optional", index, -1)}
                              onIncreaseOne={() => adjustSkill("optional", index, 1)}
                              onIncreaseFive={() => adjustSkill("optional", index, 5)}
                              onDirectChange={(value) => setSkillAssigned("optional", index, value)}
                            />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className="wizard-skill-sidebar">
                    <div className="wizard-skill-sidebar-tabs" role="tablist" aria-label="技能配分サイドパネル">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeSkillSidebarTab === "assignment"}
                        className={`wizard-skill-sidebar-tab ${activeSkillSidebarTab === "assignment" ? "is-active" : ""}`}
                        onClick={() => setActiveSkillSidebarTab("assignment")}
                      >
                        配分状況
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeSkillSidebarTab === "summary"}
                        className={`wizard-skill-sidebar-tab ${activeSkillSidebarTab === "summary" ? "is-active" : ""}`}
                        onClick={() => setActiveSkillSidebarTab("summary")}
                      >
                        サマリー
                      </button>
                    </div>

                    <div className="wizard-skill-sidebar-panel">
                      {activeSkillSidebarTab === "assignment" ? (
                        <div className="wizard-sidebar-stack">
                          <div className="wizard-sidebar-summary-cards">
                            <div className="wizard-sidebar-summary-card">
                              <span>職業ポイント残</span>
                              <strong>{occupationRemain}</strong>
                              <small>{assignedOccupationSkills.length} 件配分済み / 使用 {(currentOccupationPoints ?? 0) - occupationRemain}</small>
                              <div className="wizard-sidebar-point-meter" aria-hidden="true">
                                <div className="wizard-sidebar-point-meter-track">
                                  <div
                                    className={`wizard-sidebar-point-meter-fill ${occupationRemain === 0 ? "is-empty" : occupationRemain <= Math.max(10, Math.floor((currentOccupationPoints ?? 0) * 0.2)) ? "is-low" : ""}`}
                                    style={{ width: `${currentOccupationPoints ? (occupationRemain / currentOccupationPoints) * 100 : 0}%` }}
                                  />
                                </div>
                                <span>{occupationRemain} / {currentOccupationPoints ?? 0}</span>
                              </div>
                            </div>
                            <div className="wizard-sidebar-summary-card">
                              <span>趣味ポイント残</span>
                              <strong>{hobbyRemain}</strong>
                              <small>{assignedOptionalSkills.length} 件配分済み / 使用 {(currentHobbyPoints ?? 0) - hobbyRemain}</small>
                              <div className="wizard-sidebar-point-meter" aria-hidden="true">
                                <div className="wizard-sidebar-point-meter-track">
                                  <div
                                    className={`wizard-sidebar-point-meter-fill ${hobbyRemain === 0 ? "is-empty" : hobbyRemain <= Math.max(10, Math.floor((currentHobbyPoints ?? 0) * 0.2)) ? "is-low" : ""}`}
                                    style={{ width: `${currentHobbyPoints ? (hobbyRemain / currentHobbyPoints) * 100 : 0}%` }}
                                  />
                                </div>
                                <span>{hobbyRemain} / {currentHobbyPoints ?? 0}</span>
                              </div>
                            </div>
                          </div>

                          <section className="utility-tray-section is-open">
                            <div className="utility-tray-section-body wizard-assignment-section-body">
                              <div className="utility-tray-section-copy">
                                <strong>職業技能</strong>
                                <span>{assignedOccupationSkills.length === 0 ? "まだ配分がありません" : `${assignedOccupationSkills.length} 件配分済み`}</span>
                              </div>
                              {assignedOccupationSkills.length > 0 ? (
                                <div className="derived-list">
                                  {assignedOccupationSkills.map((skill) => (
                                    <div key={skill.id} className="skill-row">
                                      <span>{skill.name}</span>
                                      <strong>+{skill.assigned} / 現在 <span className="wizard-skill-total-value">{combinedSkillTotals.get(skill.id) ?? skill.base + skill.assigned}</span></strong>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </section>

                          <section className="utility-tray-section is-open">
                            <div className="utility-tray-section-body wizard-assignment-section-body">
                              <div className="utility-tray-section-copy">
                                <strong>趣味技能</strong>
                                <span>{assignedOptionalSkills.length === 0 ? "まだ配分がありません" : `${assignedOptionalSkills.length} 件配分済み`}</span>
                              </div>
                              {assignedOptionalSkills.length > 0 ? (
                                <div className="derived-list">
                                  {assignedOptionalSkills.map((skill) => (
                                    <div key={skill.id} className="skill-row">
                                      <span>{skill.name}</span>
                                      <strong>+{skill.assigned} / 現在 <span className="wizard-skill-total-value">{combinedSkillTotals.get(skill.id) ?? skill.base + skill.assigned}</span></strong>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </section>
                        </div>
                      ) : (
                        <div className="wizard-sidebar-stack">
                          <section className="utility-tray-section is-open">
                            <div className="utility-tray-section-body">
                              <div className="wizard-checklist">
                                {stepLabels.map((label, index) => (
                                  <div key={label} className={`wizard-check-item ${stepIssues[index].length === 0 ? "is-ready" : ""}`}>
                                    <strong>{label}</strong>
                                    <span>{stepIssues[index].length === 0 ? "入力済み" : `${stepIssues[index].length} 件の確認あり`}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>

                          <section className="utility-tray-section is-open">
                            <div className="utility-tray-section-body">
                              <div className="derived-list">
                                <div className="skill-row"><span>名前</span><strong>{basicInfo.characterName || "未入力"}</strong></div>
                                <div className="skill-row"><span>職業</span><strong>{selectedProfession?.name ?? "未選択"}</strong></div>
                                <div className="skill-row"><span>時代</span><strong>{basicInfo.era || "未設定"}</strong></div>
                                {showDerivedSummary ? <div className="skill-row"><span>HP / SAN</span><strong>{derivedStats?.hp} / {derivedStats?.san}</strong></div> : null}
                              </div>
                            </div>
                          </section>
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
              </div>
            ) : null}

            {showReviewStep ? (
              <div className="grid">
                {renderIssues(reviewIssues)}

                <div className="grid two">
                  <div className="stat-panel">
                    <h3>基本情報</h3>
                    <div className="derived-list">
                      <div className="skill-row"><span>キャラクター名</span><strong>{basicInfo.characterName || "-"}</strong></div>
                      <div className="skill-row"><span>プレイヤー名</span><strong>{basicInfo.playerName || "-"}</strong></div>
                      <div className="skill-row"><span>年齢</span><strong>{basicInfo.age || "-"}</strong></div>
                      <div className="skill-row"><span>性別・性自認</span><strong>{basicInfo.gender || "-"}</strong></div>
                      <div className="skill-row"><span>職業</span><strong>{displayedProfessionName || "-"}</strong></div>
                      {basicInfo.professionMode === "custom" && selectedProfession ? <div className="skill-row"><span>ルール参照元</span><strong>{selectedProfession.name}</strong></div> : null}
                      <div className="skill-row"><span>時代設定</span><strong>{basicInfo.era || "-"}</strong></div>
                    </div>
                  </div>

                  <div className="stat-panel">
                    <h3>保存前チェック</h3>
                    <ul className="feature-list">
                      <li>基本情報、能力値、派生値、配分済み技能が保存されます。</li>
                      <li>初期 HP / MP / SAN は現在値として保存されます。</li>
                      <li>後から管理画面で再読込し、再編集できます。</li>
                    </ul>
                  </div>
                </div>

                <div className="grid two">
                  <div className="stat-panel">
                    <h3>能力値</h3>
                    <div className="derived-list wizard-review-metric-list">
                      {characteristicKeys.map((key) => (
                        <div key={key} className="skill-row wizard-review-metric-row">
                          <span>{characteristicLabels[key]}</span>
                          <strong className="wizard-review-metric-value">{parsedCharacteristics?.[key] ?? "-"}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stat-panel">
                    <h3>派生値と残ポイント</h3>
                    {derivedStats ? (
                      <div className="derived-list wizard-review-metric-list">
                        <div className="skill-row wizard-review-metric-row"><span>HP / MP / SAN</span><strong className="wizard-review-metric-value">{derivedStats.hp} / {derivedStats.mp} / {derivedStats.san}</strong></div>
                        <div className="skill-row wizard-review-metric-row"><span>Build / DB</span><strong className="wizard-review-metric-value">{derivedStats.build} / {derivedStats.damageBonus}</strong></div>
                        <div className="skill-row wizard-review-metric-row"><span>MOV</span><strong className="wizard-review-metric-value">{derivedStats.moveRate}</strong></div>
                        <div className="skill-row wizard-review-metric-row"><span>職業ポイント残</span><strong className="wizard-review-metric-value">{occupationRemain}</strong></div>
                        <div className="skill-row wizard-review-metric-row"><span>趣味ポイント残</span><strong className="wizard-review-metric-value">{hobbyRemain}</strong></div>
                      </div>
                    ) : (
                      <p className="helper-text">能力値が未確定のため、派生値はまだ計算されていません。</p>
                    )}
                  </div>
                </div>

                <div className="save-actions">
                  <button className="primary" type="button" onClick={onSaveCharacterSheet} disabled={reviewIssues.length > 0}>
                    {editingSheetId ? "上書き保存する" : "ブラウザに保存する"}
                  </button>
                  <button className="secondary" type="button" onClick={onOpenCharacterArchive}>
                    キャラクター保管庫へ
                  </button>
                  {saveMessage ? <span className="helper-text">{saveMessage}</span> : null}
                </div>

                <div className="stat-panel wizard-backstory-panel">
                  <div className="wizard-section-intro">
                    <div>
                      <p className="wizard-section-eyebrow">Step 3</p>
                      <h3>バックストーリー</h3>
                    </div>
                    <p className="wizard-section-summary">添付のシートのように探索者の背景を記録できます。空欄でも保存可能で、後から再編集できます。</p>
                  </div>
                  <div className="wizard-backstory-grid">
                    {backstoryFieldDefinitions.map((field) => (
                      <label key={field.key} className="wizard-backstory-field">
                        <span>{field.label}</span>
                        <textarea
                          rows={field.rows ?? 4}
                          value={backstory[field.key]}
                          placeholder="自由に記入"
                          onChange={(event) => onChangeBackstory(field.key, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid two">
                  <div className="stat-panel">
                    <h3>配分済みの職業技能</h3>
                    {occupationAssigned.some((skill) => skill.assigned > 0) ? (
                      <div className="derived-list wizard-review-skill-list">
                        {occupationAssigned.filter((skill) => skill.assigned > 0).map((skill) => (
                          <div key={skill.id} className="skill-row wizard-review-skill-row">
                            <span>{skill.name}</span>
                            <strong className="wizard-review-skill-breakdown">
                              初期 {skill.base} / 職業 +{skill.assigned} / 趣味 +{optionalAssignedById.get(skill.id) ?? 0}
                            </strong>
                            <strong className="wizard-review-skill-total">
                              <span className="wizard-skill-total-value">{combinedSkillTotals.get(skill.id) ?? skill.base + skill.assigned}</span>
                            </strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="helper-text">職業技能への配分はまだありません。</p>
                    )}
                  </div>

                  <div className="stat-panel">
                    <h3>配分済みの趣味技能</h3>
                    {optionalAssigned.some((skill) => skill.assigned > 0) ? (
                      <div className="derived-list wizard-review-skill-list">
                        {optionalAssigned.filter((skill) => skill.assigned > 0).map((skill) => (
                          <div key={skill.id} className="skill-row wizard-review-skill-row">
                            <span>{skill.name}</span>
                            <strong className="wizard-review-skill-breakdown">
                              初期 {skill.base} / 職業 +{occupationAssignedById.get(skill.id) ?? 0} / 趣味 +{skill.assigned}
                            </strong>
                            <strong className="wizard-review-skill-total">
                              <span className="wizard-skill-total-value">{combinedSkillTotals.get(skill.id) ?? skill.base + skill.assigned}</span>
                            </strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="helper-text">趣味技能への配分はまだありません。</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {isEditingMode ? (
            <div className="actions wizard-actions wizard-actions-sticky">
              <button className="secondary" type="button" onClick={onOpenCharacterArchive}>
                戻る
              </button>
              <button className="primary" type="button" onClick={onSaveCharacterSheet} disabled={reviewIssues.length > 0}>
                上書き保存する
              </button>
            </div>
          ) : (
            <div className={`actions wizard-actions ${step === 1 ? "wizard-actions-sticky" : ""}`}>
              {step === 2 ? (
                <>
                  <button className="secondary" type="button" onClick={() => setStep(0)}>
                    基本情報と能力値へ戻る
                  </button>
                  <button className="secondary" type="button" onClick={() => setStep(1)}>
                    技能配分へ戻る
                  </button>
                </>
              ) : (
                <>
                  <button className="secondary" type="button" onClick={goBack} disabled={step === 0}>
                    戻る
                  </button>
                  <button className="primary" type="button" onClick={goNext} disabled={step === stepLabels.length - 1 || !canGoNext}>
                    次へ
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

type ProfessionModalProps = {
  selectedProfessionId: string;
  onClose: () => void;
  onSelect: (professionId: string) => void;
};

function ProfessionModal({ selectedProfessionId, onClose, onSelect }: ProfessionModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="職業詳細モーダル" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>職業一覧</h2>
            <p className="subtitle">説明、技能、初心者向けメモを見比べて選択できます。</p>
          </div>
          <button className="secondary" type="button" onClick={onClose}>
            閉じる
          </button>
        </div>

        <div className="accordion-list">
          {professionList.map((profession) => (
            <details
              key={profession.id}
              className={`accordion-item ${selectedProfessionId === profession.id ? "selected-accordion" : ""}`}
            >
              <summary>
                <span className="accordion-summary-main">
                  <span className="accordion-summary-icon" aria-hidden="true">▽</span>
                  <span>{profession.name}</span>
                </span>
                <span>{profession.occupationalPointsFormula}</span>
              </summary>
              <div className="accordion-content">
                <p>{profession.description}</p>
                <div className="detail-list">
                  <div>信用範囲: {profession.creditRating.min} - {profession.creditRating.max}</div>
                  <div>おすすめ能力値: {profession.recommendedCharacteristics.map((item) => characteristicLabels[item]).join(" / ")}</div>
                </div>
                <h3>向いている探索者像</h3>
                <ul>
                  {profession.recommendedFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <h3>候補技能</h3>
                <div className="skills">
                  {profession.occupationSkills.map((skill) => (
                    <div key={skill.id} className="skill-row">
                      <div>
                        <strong>{skill.name}</strong>
                        <div>{skill.description}</div>
                      </div>
                      <span>初期: {skill.base} / 上限: {skill.max}</span>
                    </div>
                  ))}
                </div>
                {profession.skillChoiceNotes?.length ? (
                  <>
                    <h3>選択ルール</h3>
                    <ul>
                      {profession.skillChoiceNotes.map((item) => (
                        <li key={`${profession.id}-note-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {profession.optionalSkills.length ? (
                  <>
                    <h3>補足候補</h3>
                    <div className="skills">
                      {profession.optionalSkills.map((skill) => (
                        <div key={skill.id} className="skill-row">
                          <div>
                            <strong>{skill.name}</strong>
                            <div>{skill.description}</div>
                          </div>
                          <span>初期: {skill.base} / 上限: {skill.max}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                <div className="accordion-actions">
                  <button className="primary" type="button" onClick={() => onSelect(profession.id)}>
                    この職業を選ぶ
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

type SkillAssignmentCardProps = {
  skill: AssignedSkill;
  isHelpActive: boolean;
  isOccupationCandidate: boolean;
  occupationAssignedValue: number;
  optionalAssignedValue: number;
  totalValue: number;
  remainingBudget: number;
  maxAssignable: number;
  quickLabel: string;
  onOpenHelp: () => void;
  onDecreaseFive: () => void;
  onDecreaseOne: () => void;
  onIncreaseOne: () => void;
  onIncreaseFive: () => void;
  onDirectChange: (value: number) => void;
};

function SkillAssignmentCard({
  skill,
  isHelpActive,
  isOccupationCandidate,
  occupationAssignedValue,
  optionalAssignedValue,
  totalValue,
  remainingBudget,
  maxAssignable,
  quickLabel,
  onOpenHelp,
  onDecreaseFive,
  onDecreaseOne,
  onIncreaseOne,
  onIncreaseFive,
  onDirectChange
}: SkillAssignmentCardProps) {
  const helpContent = buildSkillHelpContent(skill);
  const limitMessage = totalValue >= skill.max
    ? "上限に達しています。"
    : remainingBudget <= 0
      ? "残ポイントがありません。"
      : null;
  const progressPercent = Math.max(0, Math.min((totalValue / skill.max) * 100, 100));
  const progressTone = totalValue >= skill.max ? "is-max" : progressPercent >= 80 ? "is-near" : "";

  return (
    <div className="wizard-skill-card">
      <div className="wizard-skill-copy">
        <div className="wizard-skill-copy-header">
          <div className="wizard-skill-title-row">
            <strong>{skill.name}</strong>
            <button
              type="button"
              className={`wizard-tooltip-trigger ${isHelpActive ? "is-active" : ""}`}
              aria-expanded={isHelpActive}
              aria-label={`${skill.name} の説明を表示`}
              onClick={onOpenHelp}
            >
              ?
            </button>
          </div>
          <div className="wizard-skill-badges">
            <span className="wizard-skill-chip">{quickLabel}</span>
            {isOccupationCandidate ? <span className="wizard-skill-chip wizard-skill-chip-accent">職業候補</span> : null}
            {totalValue >= skill.max ? <span className="wizard-skill-chip wizard-skill-chip-alert">上限</span> : null}
          </div>
        </div>
        <span>初期 {skill.base} / 職業 +{occupationAssignedValue} / 趣味 +{optionalAssignedValue} / 現在 <span className="wizard-skill-total-value">{totalValue}</span> / 上限 {skill.max}</span>
        <p>{skill.description}</p>
        <div className="wizard-skill-progress-block">
          <div className="wizard-skill-progress-meta">
            <span>現在値の到達率</span>
            <strong>{totalValue} / {skill.max}</strong>
          </div>
          <div className="wizard-skill-progress-track" aria-hidden="true">
            <div className={`wizard-skill-progress-fill ${progressTone}`} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <label className="wizard-skill-slider-block">
          <div className="wizard-skill-slider-header">
            <strong>スライダーで配分</strong>
            <span>ドラッグして 0 から {maxAssignable} まで調整</span>
          </div>
          <input
            className="wizard-skill-slider"
            type="range"
            min={0}
            max={maxAssignable}
            step={1}
            value={Math.min(skill.assigned, maxAssignable)}
            aria-label={`${skill.name} に配分するポイント`}
            onChange={(event) => onDirectChange(Number(event.target.value))}
          />
          <div className="wizard-skill-slider-scale" aria-hidden="true">
            <span>0</span>
            <strong>{skill.assigned}</strong>
            <span>{maxAssignable}</span>
          </div>
        </label>
        {limitMessage ? <span className="helper-text wizard-skill-limit-message">{limitMessage}</span> : null}
        {isHelpActive ? (
          <div className="wizard-skill-inline-help">
            <div className="wizard-skill-help-header">
              <strong>{helpContent.title}</strong>
              <span className="wizard-skill-chip">{skillCategoryLabels[helpContent.category]}</span>
            </div>
            <p>{helpContent.usageSummary}</p>
            <div className="wizard-skill-help-block">
              <strong>よく使う場面</strong>
              <ul>
                {helpContent.usageExamples.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="wizard-skill-help-block wizard-skill-help-block-emphasis">
              <strong>初心者向けの見方</strong>
              <p>{renderHighlightedSkillNames(helpContent.beginnerHint)}</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="wizard-stepper">
        <button className="secondary" type="button" onClick={onDecreaseFive}>
          -5
        </button>
        <button className="secondary" type="button" onClick={onDecreaseOne}>
          -1
        </button>
        <label className="wizard-stepper-input">
          配分
          <input
            type="number"
            min={0}
            max={maxAssignable}
            value={skill.assigned}
            onChange={(event) => onDirectChange(Number(event.target.value))}
          />
        </label>
        <button className="primary" type="button" onClick={onIncreaseOne}>
          +1
        </button>
        <button className="primary" type="button" onClick={onIncreaseFive}>
          +5
        </button>
      </div>
    </div>
  );
}

function mergeAssignedSkills(sourceSkills: Skill[], assignedSkills: AssignedSkill[]): AssignedSkill[] {
  const assignedById = new Map(assignedSkills.map((skill) => [skill.id, skill]));

  return sourceSkills.map((skill) => {
    const assigned = assignedById.get(skill.id);
    if (!assigned) {
      return {
        ...skill,
        assigned: 0,
        total: skill.base
      };
    }

    const nextAssigned = Math.max(0, assigned.assigned);
    return {
      ...skill,
      assigned: nextAssigned,
      total: Math.min(skill.base + nextAssigned, skill.max)
    };
  });
}

function buildCombinedSkillTotalMap(occupationSkills: AssignedSkill[], optionalSkills: AssignedSkill[]): Map<string, number> {
  const occupationAssignedById = new Map(occupationSkills.map((skill) => [skill.id, skill.assigned]));
  const optionalAssignedById = new Map(optionalSkills.map((skill) => [skill.id, skill.assigned]));
  const totalBySkillId = new Map<string, number>();

  for (const skill of [...occupationSkills, ...optionalSkills]) {
    totalBySkillId.set(
      skill.id,
      Math.min(skill.max, skill.base + (occupationAssignedById.get(skill.id) ?? 0) + (optionalAssignedById.get(skill.id) ?? 0))
    );
  }

  return totalBySkillId;
}

function sanitizeAssignedSkillBuckets(occupationSkills: AssignedSkill[], optionalSkills: AssignedSkill[]) {
  const normalizedOccupation = occupationSkills.map((skill) => {
    const nextAssigned = Math.max(0, Math.min(skill.assigned, skill.max - skill.base));
    return {
      ...skill,
      assigned: nextAssigned,
      total: skill.base + nextAssigned
    };
  });

  const occupationAssignedById = new Map(normalizedOccupation.map((skill) => [skill.id, skill.assigned]));

  const normalizedOptional = optionalSkills.map((skill) => {
    const occupationAssigned = occupationAssignedById.get(skill.id) ?? 0;
    const maxOptionalAssigned = Math.max(0, skill.max - skill.base - occupationAssigned);
    const nextAssigned = Math.max(0, Math.min(skill.assigned, maxOptionalAssigned));

    return {
      ...skill,
      assigned: nextAssigned,
      total: skill.base + occupationAssigned + nextAssigned
    };
  });

  const totalBySkillId = buildCombinedSkillTotalMap(normalizedOccupation, normalizedOptional);

  return {
    occupationSkills: normalizedOccupation.map((skill) => ({
      ...skill,
      total: totalBySkillId.get(skill.id) ?? skill.base + skill.assigned
    })),
    optionalSkills: normalizedOptional.map((skill) => ({
      ...skill,
      total: totalBySkillId.get(skill.id) ?? skill.base + skill.assigned
    }))
  };
}

function getProfessionFixedOccupationSkillIds(profession?: Profession) {
  if (!profession) {
    return [];
  }

  if (profession.fixedOccupationSkillIds?.length) {
    return profession.fixedOccupationSkillIds;
  }

  return profession.occupationSkills.map((skill) => skill.id);
}

function getProfessionChoiceGroups(profession?: Profession): ProfessionSkillChoiceGroup[] {
  return profession?.occupationSkillChoiceGroups ?? [];
}

function createEmptyOccupationSkillSelections(profession?: Profession): OccupationSkillSelectionMap {
  return getProfessionChoiceGroups(profession).reduce<OccupationSkillSelectionMap>((result, group) => {
    result[group.id] = [];
    return result;
  }, {});
}

function isSkillAllowedInChoiceGroup(group: ProfessionSkillChoiceGroup, skillId: string) {
  if (group.allowAny) {
    return allSkillList.some((skill) => skill.id === skillId);
  }

  return group.skillIds?.includes(skillId) ?? false;
}

function normalizeOccupationSkillSelections(
  profession: Profession | undefined,
  rawSelections: OccupationSkillSelectionMap | undefined
): OccupationSkillSelectionMap {
  const normalized = createEmptyOccupationSkillSelections(profession);
  const fixedSkillIds = new Set(getProfessionFixedOccupationSkillIds(profession));
  const usedSkillIds = new Set<string>();

  for (const group of getProfessionChoiceGroups(profession)) {
    const rawGroupSelections = rawSelections?.[group.id] ?? [];
    const nextSelections: string[] = [];

    for (const skillId of rawGroupSelections) {
      if (nextSelections.length >= group.choose) {
        break;
      }
      if (fixedSkillIds.has(skillId) || usedSkillIds.has(skillId) || !isSkillAllowedInChoiceGroup(group, skillId)) {
        continue;
      }

      nextSelections.push(skillId);
      usedSkillIds.add(skillId);
    }

    normalized[group.id] = nextSelections;
  }

  return normalized;
}

function inferOccupationSkillSelections(
  profession: Profession | undefined,
  rawSelections: OccupationSkillSelectionMap | undefined,
  assignedSkills: AssignedSkill[]
): OccupationSkillSelectionMap {
  const normalized = normalizeOccupationSkillSelections(profession, rawSelections);
  if (!profession) {
    return normalized;
  }

  const hasSavedSelections = Object.values(rawSelections ?? {}).some((skillIds) => Array.isArray(skillIds) && skillIds.length > 0);
  if (hasSavedSelections) {
    return normalized;
  }

  const fixedSkillIds = new Set(getProfessionFixedOccupationSkillIds(profession));
  const usedSkillIds = new Set(Object.values(normalized).flat());
  const assignedSkillIds = assignedSkills
    .filter((skill) => skill.assigned > 0)
    .map((skill) => skill.id)
    .filter((skillId) => !fixedSkillIds.has(skillId));

  for (const group of getProfessionChoiceGroups(profession)) {
    const selectedIds = [...(normalized[group.id] ?? [])];
    if (selectedIds.length >= group.choose) {
      continue;
    }

    for (const skillId of assignedSkillIds) {
      if (selectedIds.length >= group.choose) {
        break;
      }
      if (usedSkillIds.has(skillId) || !isSkillAllowedInChoiceGroup(group, skillId)) {
        continue;
      }

      selectedIds.push(skillId);
      usedSkillIds.add(skillId);
    }

    normalized[group.id] = selectedIds;
  }

  return normalized;
}

function buildProfessionOccupationSkillPool(
  profession: Profession | undefined,
  rawSelections: OccupationSkillSelectionMap | undefined
): Skill[] {
  if (!profession) {
    return [];
  }

  const normalizedSelections = normalizeOccupationSkillSelections(profession, rawSelections);
  const skillOrder = profession.occupationSkills.map((skill) => skill.id);
  const selectedIds = new Set([
    ...getProfessionFixedOccupationSkillIds(profession),
    ...Object.values(normalizedSelections).flat()
  ]);
  const selectedSkillsFromProfession = profession.occupationSkills.filter((skill) => selectedIds.has(skill.id));
  const extraSelectedSkills = Array.from(selectedIds)
    .filter((skillId) => !skillOrder.includes(skillId))
    .map((skillId) => allSkillList.find((skill) => skill.id === skillId))
    .filter((skill): skill is Skill => Boolean(skill));

  return [...selectedSkillsFromProfession, ...extraSelectedSkills];
}

function buildProfessionSkillState(
  profession: Profession | undefined,
  rawSelections: OccupationSkillSelectionMap | undefined,
  occupationSource: AssignedSkill[],
  optionalSource: AssignedSkill[]
) {
  const normalizedSelections = normalizeOccupationSkillSelections(profession, rawSelections);
  const occupationPool = buildProfessionOccupationSkillPool(profession, normalizedSelections);

  return {
    selections: normalizedSelections,
    assignments: sanitizeAssignedSkillBuckets(
      mergeAssignedSkills(occupationPool, occupationSource),
      mergeAssignedSkills(allSkillList, optionalSource)
    )
  };
}

function buildSkillHelpContent(skill: Skill) {
  const categoryHelp = skillCategoryHelp[skill.category];

  return {
    title: skill.name,
    category: skill.category,
    usageSummary: skill.usageSummary ?? skill.description,
    usageExamples: skill.usageExamples?.length ? skill.usageExamples : categoryHelp.usageExamples,
    beginnerHint: skill.beginnerHint ?? categoryHelp.beginnerHint
  };
}

function renderHighlightedSkillNames(text: string) {
  if (!text.trim()) {
    return text;
  }

  const matchedNames = skillNameHighlightList.filter((name) => text.includes(name));

  if (matchedNames.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${matchedNames.map(escapeRegExp).join("|")})`, "g");
  const segments = text.split(pattern);

  return segments.map((segment, index) => {
    if (!segment) {
      return null;
    }

    const isSkillName = matchedNames.includes(segment);
    return isSkillName
      ? <span key={`${segment}-${index}`} className="wizard-inline-skill-highlight">{segment}</span>
      : <span key={`text-${index}`}>{segment}</span>;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toCharacteristicInputState(values: Characteristics): CharacteristicInputState {
  return {
    str: String(values.str),
    con: String(values.con),
    pow: String(values.pow),
    dex: String(values.dex),
    app: String(values.app),
    siz: String(values.siz),
    int: String(values.int),
    edu: String(values.edu)
  };
}
