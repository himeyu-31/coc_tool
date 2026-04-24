import { AssignedSkill, Characteristics, DerivedStats, Profession, Skill } from "@/types/character";

export type OccupationPointCalculation = {
  total: number;
  selectedFormula: string;
  evaluatedOptions: Array<{
    formula: string;
    total: number;
  }>;
};

export type AgeAdjustmentGuide = {
  title: string;
  items: string[];
  caution?: string;
};

type BuildRule = {
  max: number;
  build: number;
  damageBonus: string;
};

const buildRules: BuildRule[] = [
  { max: 64, build: -2, damageBonus: "-2" },
  { max: 84, build: -1, damageBonus: "-1" },
  { max: 124, build: 0, damageBonus: "0" },
  { max: 164, build: 1, damageBonus: "+1D4" },
  { max: 204, build: 2, damageBonus: "+1D6" }
];

export function toAssignedSkills(skills: Skill[]): AssignedSkill[] {
  return skills.map((skill) => ({
    ...skill,
    assigned: 0,
    total: skill.base
  }));
}

export function applySkillAssignment(skill: AssignedSkill, assigned: number): AssignedSkill {
  const nextAssigned = Math.max(0, assigned);
  const total = Math.min(skill.base + nextAssigned, skill.max);
  return {
    ...skill,
    assigned: total - skill.base,
    total
  };
}

export function calculateDerivedStats(characteristics: Characteristics): DerivedStats {
  const hp = Math.floor((characteristics.con + characteristics.siz) / 10);
  const mp = Math.floor(characteristics.pow / 5);
  const san = characteristics.pow;
  const moveRate = calculateMoveRate(characteristics);
  const buildInfo = calculateBuildAndDamageBonus(characteristics.str + characteristics.siz);

  return {
    hp,
    mp,
    san,
    moveRate,
    build: buildInfo.build,
    damageBonus: buildInfo.damageBonus
  };
}

export function rollStandardCharacteristics(): Characteristics {
  return {
    str: rollAndMultiply(3, 6, 5),
    con: rollAndMultiply(3, 6, 5),
    pow: rollAndMultiply(3, 6, 5),
    dex: rollAndMultiply(3, 6, 5),
    app: rollAndMultiply(3, 6, 5),
    siz: (rollDice(2, 6) + 6) * 5,
    int: (rollDice(2, 6) + 6) * 5,
    edu: (rollDice(2, 6) + 6) * 5
  };
}

function rollAndMultiply(numberOfDice: number, sides: number, multiplier: number): number {
  return rollDice(numberOfDice, sides) * multiplier;
}

function rollDice(numberOfDice: number, sides: number): number {
  let total = 0;

  for (let index = 0; index < numberOfDice; index += 1) {
    total += Math.floor(Math.random() * sides) + 1;
  }

  return total;
}

function calculateMoveRate(characteristics: Characteristics): number {
  if (characteristics.dex < characteristics.siz && characteristics.str < characteristics.siz) {
    return 7;
  }

  if (characteristics.dex > characteristics.siz && characteristics.str > characteristics.siz) {
    return 9;
  }

  return 8;
}

function calculateBuildAndDamageBonus(strPlusSiz: number): Pick<DerivedStats, "build" | "damageBonus"> {
  const matchedRule = buildRules.find((rule) => strPlusSiz <= rule.max);
  if (matchedRule) {
    return {
      build: matchedRule.build,
      damageBonus: matchedRule.damageBonus
    };
  }

  const overflow = strPlusSiz - 204;
  const extraSteps = Math.ceil(overflow / 80);

  return {
    build: 2 + extraSteps,
    damageBonus: `+${1 + extraSteps}D6`
  };
}

export function getAgeAdjustmentGuide(age: number): AgeAdjustmentGuide | null {
  if (!Number.isFinite(age) || age <= 0) {
    return null;
  }

  if (age <= 19) {
    return {
      title: "若年探索者の補助メモ",
      items: [
        "若年作成では幸運の振り直しや身体能力の調整が入る卓があります。",
        "EDUや体格の補正は卓ルール差が出やすいため、事前確認が安全です。"
      ],
      caution: "若年補正は採用差が大きいため、このツールでは自動適用せず補助表示に留めています。"
    };
  }

  if (age <= 39) {
    return {
      title: "成人探索者の補助メモ",
      items: [
        "EDU成長チェックを1回認める卓があります。",
        "標準ロール後に必要なら振り直しや上達判定を行ってください。"
      ],
      caution: "EDU成長チェックの採用有無は卓ルールを確認してください。"
    };
  }

  if (age <= 49) {
    return {
      title: "40代探索者の補助メモ",
      items: [
        "EDU成長チェックを複数回行う卓があります。",
        "MOV低下や身体能力の一部減少を反映する運用があります。"
      ],
      caution: "年齢補正の詳細値は公式ルールか卓ルールを確認して手動反映してください。"
    };
  }

  if (age <= 59) {
    return {
      title: "50代探索者の補助メモ",
      items: [
        "EDU成長チェック回数が増える一方で、身体能力やMOVに大きめの調整が入る卓があります。",
        "先に標準ロールを行い、その後で卓ルールに沿って調整すると整理しやすいです。"
      ],
      caution: "このツールでは年齢補正を自動確定せず、補助メモとして表示しています。"
    };
  }

  return {
    title: "高年齢探索者の補助メモ",
    items: [
      "高年齢帯は卓ルール差が出やすいため、KPと相談のうえで補正を決めてください。",
      "EDU成長と身体能力低下の両方を確認してから最終値を確定する運用が安全です。"
    ],
    caution: "年齢補正の自動処理は行わず、補助表示のみ行っています。"
  };
}

export function calculateOccupationPointCalculation(profession: Profession, characteristics: Characteristics): OccupationPointCalculation {
  const pointOptions = profession.occupationalPointOptions?.length
    ? profession.occupationalPointOptions
    : [{ formula: profession.occupationalPointsFormula, terms: profession.occupationalPointTerms }];

  const evaluatedOptions = pointOptions.map((option) => ({
    formula: option.formula,
    total: option.terms.reduce(
      (sum, term) => sum + characteristics[term.key] * term.multiplier,
      0
    )
  }));

  const selectedOption = evaluatedOptions.reduce((best, current) => (
    current.total > best.total ? current : best
  ));

  return {
    total: selectedOption.total,
    selectedFormula: selectedOption.formula,
    evaluatedOptions
  };
}

export function calculateOccupationPoints(profession: Profession, characteristics: Characteristics): number {
  return calculateOccupationPointCalculation(profession, characteristics).total;
}

export function calculateHobbyPoints(characteristics: Characteristics): number {
  return characteristics.int * 2;
}