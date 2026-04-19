"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { allSkillList } from "@/lib/coc7-data";
import { saveCharacterSheet } from "@/lib/character-storage";
import { calculateDerivedStats, getAgeAdjustmentGuide, rollStandardCharacteristics } from "@/lib/coc7-rules";
import { getProfessionById, professionList, toAssignedSkills } from "@/lib/professions";
import { AssignedSkill, BasicInfo, CharacterSheet, Characteristics, CharacteristicKey, DerivedStatKey, Skill, SkillCategory } from "@/types/character";

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

const characteristicHelp: Record<CharacteristicKey, { title: string; summary: string; beginnerTip: string }> = {
  str: {
    title: "筋力",
    summary: "持ち上げる、押さえ込む、殴るなどの純粋な身体の強さです。",
    beginnerTip: "前に出て扉をこじ開けたり、近接で動きたい探索者は高めだと扱いやすいです。"
  },
  con: {
    title: "体力",
    summary: "疲れにくさ、病気や苦痛への強さなど、体の丈夫さです。",
    beginnerTip: "HP の計算に関わるので、倒れにくさを重視するなら気にすると分かりやすい能力値です。"
  },
  pow: {
    title: "精神力",
    summary: "意志の強さ、心の踏ん張り、超常に対する抵抗力を表します。",
    beginnerTip: "初期 SAN と MP に直結するので、CoC らしい場面では特に重要です。"
  },
  dex: {
    title: "敏捷性",
    summary: "身のこなし、反応速度、手先の素早さを表します。",
    beginnerTip: "回避や素早い行動をイメージするなら高めだと扱いやすいです。"
  },
  app: {
    title: "外見",
    summary: "見た目の印象や、人に与える魅力の強さです。",
    beginnerTip: "会話中心の探索者や、第一印象を活かす役なら意識しやすい能力値です。"
  },
  siz: {
    title: "体格",
    summary: "身長や体重を含む体の大きさです。",
    beginnerTip: "CON と合わせて HP に、STR と合わせて Build に関わるので、見た目以上に重要です。"
  },
  int: {
    title: "知性",
    summary: "ひらめき、理解力、状況を読み取る頭の回転を表します。",
    beginnerTip: "情報をつなげて考える場面が多い探索者なら、迷った時に意識しやすい値です。"
  },
  edu: {
    title: "教育",
    summary: "学習経験や専門知識の蓄積、教養の深さです。",
    beginnerTip: "多くの職業ポイント式に関わるので、職業選びとセットで見ると分かりやすいです。"
  }
};

const derivedStatKeys: DerivedStatKey[] = ["hp", "mp", "san", "moveRate", "build", "damageBonus"];

const derivedStatLabels: Record<DerivedStatKey, string> = {
  hp: "HP",
  mp: "MP",
  san: "SAN",
  moveRate: "MOV",
  build: "Build",
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
    beginnerTip: "STR・DEX・SIZ の組み合わせで決まります。 chase を使う卓では重要度が上がります。"
  },
  build: {
    title: "体格差の指標",
    summary: "体の大きさと力強さをまとめた区分で、組み付きやダメージボーナスの判定に使います。",
    beginnerTip: "値そのものより、ダメージボーナスとセットで見ると意味がつかみやすいです。"
  },
  damageBonus: {
    title: "近接攻撃の補正",
    summary: "素手や近接武器のダメージに加わる補正です。STR と SIZ から決まります。",
    beginnerTip: "殴る、蹴る、近接武器を使う予定がある探索者なら確認しておくと役立ちます。"
  }
};

const defaultBasicInfo: BasicInfo = {
  characterName: "",
  playerName: "",
  age: "",
  gender: "",
  professionId: "",
  era: ""
};

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
  resetToken?: number;
};

export function CharacterWizard({ draftSheet, onSaved, resetToken = 0 }: CharacterWizardProps) {
  const [step, setStep] = useState(0);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(defaultBasicInfo);
  const [characteristics, setCharacteristics] = useState<CharacteristicInputState>(defaultCharacteristics);
  const [occupationAssigned, setOccupationAssigned] = useState<AssignedSkill[]>([]);
  const [optionalAssigned, setOptionalAssigned] = useState<AssignedSkill[]>([]);
  const [isProfessionModalOpen, setIsProfessionModalOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [rerollCount, setRerollCount] = useState(0);
  const [activeCharacteristicTip, setActiveCharacteristicTip] = useState<CharacteristicKey | null>(null);
  const [activeDerivedTip, setActiveDerivedTip] = useState<DerivedStatKey | null>(null);
  const [hobbySkillQuery, setHobbySkillQuery] = useState("");
  const [hobbySkillCategory, setHobbySkillCategory] = useState<"all" | SkillCategory>("social");
  const skillAllocationTopRef = useRef<HTMLDivElement | null>(null);

  const selectedProfession = useMemo(
    () => getProfessionById(basicInfo.professionId),
    [basicInfo.professionId]
  );

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

  const ageGuide = useMemo(() => getAgeAdjustmentGuide(Number(basicInfo.age)), [basicInfo.age]);

  const occupationRemain = useMemo(() => {
    if (!selectedProfession) {
      return 0;
    }
    const used = occupationAssigned.reduce((total, skill) => total + skill.assigned, 0);
    return selectedProfession.occupationalPoints - used;
  }, [occupationAssigned, selectedProfession]);

  const hobbyRemain = useMemo(() => {
    if (!selectedProfession) {
      return 0;
    }
    const used = optionalAssigned.reduce((total, skill) => total + skill.assigned, 0);
    return selectedProfession.hobbyPoints - used;
  }, [optionalAssigned, selectedProfession]);

  const normalizedHobbySkillQuery = hobbySkillQuery.trim().toLowerCase();

  const filteredHobbySkills = useMemo(() => {
    const professionSkillIds = new Set(occupationAssigned.map((skill) => skill.id));

    return optionalAssigned
      .filter((skill) => {
        if (hobbySkillCategory !== "all" && skill.category !== hobbySkillCategory) {
          return false;
        }

        if (!normalizedHobbySkillQuery) {
          return true;
        }

        return `${skill.name} ${skill.description} ${skillCategoryLabels[skill.category]}`.toLowerCase().includes(normalizedHobbySkillQuery);
      })
      .sort((left, right) => {
        const leftAssigned = left.assigned > 0 ? 1 : 0;
        const rightAssigned = right.assigned > 0 ? 1 : 0;
        if (leftAssigned !== rightAssigned) {
          return rightAssigned - leftAssigned;
        }

        const leftProfessionOverlap = professionSkillIds.has(left.id) ? 1 : 0;
        const rightProfessionOverlap = professionSkillIds.has(right.id) ? 1 : 0;
        if (leftProfessionOverlap !== rightProfessionOverlap) {
          return rightProfessionOverlap - leftProfessionOverlap;
        }

        return left.name.localeCompare(right.name, "ja");
      });
  }, [hobbySkillCategory, normalizedHobbySkillQuery, occupationAssigned, optionalAssigned]);

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

    return issues;
  }, [selectedProfession, parsedCharacteristics, occupationRemain, hobbyRemain]);

  const reviewIssues = useMemo(
    () => [...profileIssues, ...skillIssues],
    [profileIssues, skillIssues]
  );

  const stepIssues = [profileIssues, skillIssues, reviewIssues];
  const showDerivedSummary = parsedCharacteristics !== null;
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
    setEditingSheetId(draftSheet.id);
    setBasicInfo(draftSheet.basicInfo);
    setCharacteristics(toCharacteristicInputState(draftSheet.characteristics));
    setOccupationAssigned(mergeAssignedSkills(profession?.occupationSkills ?? draftSheet.occupationSkills, draftSheet.occupationSkills));
    setOptionalAssigned(mergeAssignedSkills(allSkillList, draftSheet.optionalSkills));
    setStep(2);
    setSaveMessage("保存済みキャラクターを読み込みました。必要な箇所だけ戻って再編集できます。");
  }, [draftSheet]);

  useEffect(() => {
    setEditingSheetId(null);
    setStep(0);
    setBasicInfo(defaultBasicInfo);
    setCharacteristics(defaultCharacteristics);
    setOccupationAssigned([]);
    setOptionalAssigned([]);
    setIsProfessionModalOpen(false);
    setSaveMessage("");
    setRerollCount(0);
    setHobbySkillQuery("");
    setHobbySkillCategory("social");
  }, [resetToken]);

  useEffect(() => {
    if (step !== 1) {
      return;
    }

    requestAnimationFrame(() => {
      skillAllocationTopRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [step]);

  function onChangeBasicInfo(field: keyof BasicInfo, value: string) {
    setSaveMessage("");
    setBasicInfo((prev) => ({ ...prev, [field]: value }));

    if (field === "professionId") {
      const profession = getProfessionById(value);
      if (!profession) {
        setOccupationAssigned([]);
        setOptionalAssigned(mergeAssignedSkills(allSkillList, optionalAssigned));
        return;
      }
      setOccupationAssigned(mergeAssignedSkills(profession.occupationSkills, occupationAssigned));
      setOptionalAssigned(mergeAssignedSkills(allSkillList, optionalAssigned));
    }
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
    const budget = isOccupation
      ? selectedProfession?.occupationalPoints ?? 0
      : selectedProfession?.hobbyPoints ?? 0;

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
      const maxFromSkill = Math.max(0, target.max - target.base);
      const safeAssigned = Number.isFinite(nextAssigned) ? nextAssigned : 0;
      const clampedAssigned = Math.max(0, Math.min(safeAssigned, maxFromBudget, maxFromSkill));

      return current.map((skill, skillIndex) => {
        if (skillIndex !== index) {
          return skill;
        }

        return {
          ...skill,
          assigned: clampedAssigned,
          total: skill.base + clampedAssigned
        };
      });
    });
  }

  function buildCharacterSheet(): CharacterSheet {
    if (!parsedCharacteristics || !derivedStats) {
      throw new Error("キャラクター保存前に能力値を確定してください。");
    }

    const timestamp = new Date().toISOString();

    return {
      id: editingSheetId ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      basicInfo,
      characteristics: parsedCharacteristics,
      derivedStats,
      occupationSkills: occupationAssigned.filter((skill) => skill.assigned > 0),
      optionalSkills: optionalAssigned.filter((skill) => skill.assigned > 0),
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

  function renderIssues(issues: string[]) {
    if (issues.length === 0) {
      return null;
    }

    return (
      <div className="form-note error-note" role="alert">
        <strong>この画面で確認すること</strong>
        <ul>
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="card">
      <h1 className="title">クトゥルフ神話TRPG キャラ作成</h1>
      <p className="subtitle">基本情報と能力値を同じ画面で決め、次に技能配分へ進む 3 ステップ構成です。</p>

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

      <div className={`wizard-layout ${step === 0 ? "wizard-layout-focus" : ""}`}>
        <div className="wizard-main">
          <section className="wizard-section">
            <div className="wizard-section-header">
              <div>
                <h2>{stepLabels[step]}</h2>
                <p className="helper-text">{stepDescriptions[step]}</p>
              </div>
            </div>

            {step === 0 ? (
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
                        value={basicInfo.professionId}
                        onChange={(event) => onChangeBasicInfo("professionId", event.target.value)}
                        aria-invalid={!basicInfo.professionId}
                      >
                        <option value="">選択してください</option>
                        {professionList.map((profession) => (
                          <option key={profession.id} value={profession.id}>
                            {profession.name}
                          </option>
                        ))}
                      </select>
                      <span className="helper-text">技能候補と配分ポイントは選択後に自動で準備されます。</span>
                    </label>

                    <label>
                      <span className="wizard-field-heading">
                        <span>時代設定</span>
                        <span className="wizard-field-meta">任意</span>
                      </span>
                      <input
                        list="era-suggestions"
                        value={basicInfo.era}
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
                            <h3>{selectedProfession.name}</h3>
                          </div>
                          <div className="points">
                            <span className="pill">職業Pt {selectedProfession.occupationalPoints}</span>
                            <span className="pill">趣味Pt {selectedProfession.hobbyPoints}</span>
                          </div>
                        </div>
                        <p>{selectedProfession.description}</p>
                        <div className="detail-list">
                          <div>信用範囲: {selectedProfession.creditRating.min} - {selectedProfession.creditRating.max}</div>
                          <div>職業ポイント式: {selectedProfession.occupationalPointsFormula}</div>
                          <div>おすすめ能力値: {selectedProfession.recommendedCharacteristics.map((item) => characteristicLabels[item]).join(" / ")}</div>
                        </div>
                        <ul className="feature-list">
                          {selectedProfession.beginnerNotes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
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
                      <p className="wizard-section-summary">ロールか手入力で 8 つの能力値を確定します。揃うと下に派生値が出ます。</p>
                    </div>

                    <div className="wizard-form">
                    <div className="roll-actions wizard-toolbar wizard-compact-toolbar">
                      <button className="secondary" type="button" onClick={rollCharacteristics}>
                        {rerollCount === 0 ? "CoC7標準ロールを適用" : "もう一度ロールする"}
                      </button>
                      <span className="wizard-inline-rule">STR/CON/POW/DEX/APP は 3D6×5、SIZ/INT/EDU は (2D6+6)×5</span>
                    </div>

                    <div className="form-note wizard-compact-note">
                      <strong>入力のコツ</strong>
                      <ul>
                        <li>能力値は空欄から始まります。ロールするか、卓ルールに合わせて直接入力してください。</li>
                        <li>職業を変えたくなった場合は左側の職業欄をそのまま変更できます。</li>
                      </ul>
                    </div>

                    {rerollCount > 0 ? (
                      <div className="helper-text wizard-status-text">現在のロール回数: {rerollCount} 回</div>
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
                        <div key={key} className="wizard-characteristic-card">
                          <div className="wizard-characteristic-header">
                            <label htmlFor={`characteristic-${key}`}>{characteristicLabels[key]}</label>
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
                          <input
                            id={`characteristic-${key}`}
                            type="number"
                            min={1}
                            max={99}
                            value={characteristics[key]}
                            onChange={(event) => onChangeCharacteristic(key, event.target.value)}
                          />
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
                        </>
                      ) : (
                        <>
                          <strong>能力値ガイド</strong>
                          <p>各能力値の ? を押すと、その能力値が何を表し、初心者ならどう見るとよいかをここで確認できます。</p>
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

                      <details className="stat-panel wizard-inline-details">
                        <summary>計算の見方</summary>
                        <ul>
                          <li>HP = (CON + SIZ) / 10 の切り捨て</li>
                          <li>MP = POW / 5 の切り捨て</li>
                          <li>初期SAN = POW</li>
                          <li>MOV は STR、DEX と SIZ の比較で決まる</li>
                          <li>Build とダメージボーナスは STR + SIZ から決まる</li>
                        </ul>
                      </details>
                    </div>
                    </div>
                  </section>
                </div>

                {isProfessionModalOpen ? (
                  <ProfessionModal
                    selectedProfessionId={basicInfo.professionId}
                    onClose={() => setIsProfessionModalOpen(false)}
                    onSelect={(professionId) => {
                      onChangeBasicInfo("professionId", professionId);
                      setIsProfessionModalOpen(false);
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid" ref={skillAllocationTopRef}>
                {renderIssues(skillIssues)}

                <div className="wizard-floating-points" aria-label="技能配分の残ポイント">
                  <div className="wizard-floating-point-card">
                    <span>職業ポイント残</span>
                    <strong>{occupationRemain}</strong>
                  </div>
                  <div className="wizard-floating-point-card">
                    <span>趣味ポイント残</span>
                    <strong>{hobbyRemain}</strong>
                  </div>
                </div>

                <div className="form-note">
                  <strong>ポイント調整のしかた</strong>
                  <ul>
                    <li>1 点刻みと 5 点刻みの両方を使えます。</li>
                    <li>数値欄に直接入力すると、その技能に配分するポイントをまとめて変更できます。</li>
                    <li>上限値を超える入力や、残ポイントを超える入力は自動で止まります。</li>
                  </ul>
                </div>

                <div className="wizard-skill-columns">
                  <div className="wizard-skill-column">
                    <div className="wizard-skill-column-header">
                      <div>
                        <h3>職業技能に配分</h3>
                        <p className="helper-text">職業で扱いやすい技能だけを表示しています。カード内の 1 行説明を見ながらそのまま調整できます。</p>
                      </div>
                    </div>
                    <div className="skills wizard-skill-list">
                      {occupationAssigned.map((skill, index) => (
                        <SkillAssignmentCard
                          key={skill.name}
                          skill={skill}
                          quickLabel={skillCategoryLabels[skill.category]}
                          onDecreaseFive={() => adjustSkill("occupation", index, -5)}
                          onDecreaseOne={() => adjustSkill("occupation", index, -1)}
                          onIncreaseOne={() => adjustSkill("occupation", index, 1)}
                          onIncreaseFive={() => adjustSkill("occupation", index, 5)}
                          onDirectChange={(value) => setSkillAssigned("occupation", index, value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="wizard-skill-column">
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
                        return (
                        <SkillAssignmentCard
                          key={skill.id}
                          skill={skill}
                          quickLabel={occupationAssigned.some((occupationSkill) => occupationSkill.id === skill.id) ? "職業候補にも含む" : skillCategoryLabels[skill.category]}
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
            ) : null}

            {step === 2 ? (
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
                      <div className="skill-row"><span>職業</span><strong>{selectedProfession?.name ?? "-"}</strong></div>
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
                    <div className="derived-list">
                      {characteristicKeys.map((key) => (
                        <div key={key} className="skill-row">
                          <span>{characteristicLabels[key]}</span>
                          <strong>{parsedCharacteristics?.[key] ?? "-"}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stat-panel">
                    <h3>派生値と残ポイント</h3>
                    {derivedStats ? (
                      <div className="derived-list">
                        <div className="skill-row"><span>HP / MP / SAN</span><strong>{derivedStats.hp} / {derivedStats.mp} / {derivedStats.san}</strong></div>
                        <div className="skill-row"><span>Build / DB</span><strong>{derivedStats.build} / {derivedStats.damageBonus}</strong></div>
                        <div className="skill-row"><span>MOV</span><strong>{derivedStats.moveRate}</strong></div>
                        <div className="skill-row"><span>職業ポイント残</span><strong>{occupationRemain}</strong></div>
                        <div className="skill-row"><span>趣味ポイント残</span><strong>{hobbyRemain}</strong></div>
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
                  {saveMessage ? <span className="helper-text">{saveMessage}</span> : null}
                </div>
              </div>
            ) : null}
          </section>

          <div className="actions wizard-actions">
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
        </div>

        {step === 0 ? null : <aside className="wizard-sidebar">
          <div className="stat-panel wizard-summary-panel">
            <h3>進行サマリー</h3>
            <div className="wizard-checklist">
              {stepLabels.map((label, index) => (
                <div key={label} className={`wizard-check-item ${stepIssues[index].length === 0 ? "is-ready" : ""}`}>
                  <strong>{label}</strong>
                  <span>{stepIssues[index].length === 0 ? "入力済み" : `${stepIssues[index].length} 件の確認あり`}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-panel wizard-summary-panel">
            <h3>現在の探索者</h3>
            <div className="derived-list">
              <div className="skill-row"><span>名前</span><strong>{basicInfo.characterName || "未入力"}</strong></div>
              <div className="skill-row"><span>職業</span><strong>{selectedProfession?.name ?? "未選択"}</strong></div>
              <div className="skill-row"><span>時代</span><strong>{basicInfo.era || "未設定"}</strong></div>
            </div>
          </div>

          {showDerivedSummary ? (
            <div className="stat-panel wizard-summary-panel">
              <h3>派生値</h3>
              <div className="derived-list">
                <div className="skill-row"><span>HP</span><strong>{derivedStats?.hp}</strong></div>
                <div className="skill-row"><span>MP</span><strong>{derivedStats?.mp}</strong></div>
                <div className="skill-row"><span>SAN</span><strong>{derivedStats?.san}</strong></div>
                <div className="skill-row"><span>MOV</span><strong>{derivedStats?.moveRate}</strong></div>
              </div>
            </div>
          ) : null}

        </aside>}
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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="職業詳細モーダル">
      <div className="modal-card">
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
                <span>{profession.name}</span>
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
                <h3>職業技能</h3>
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
                <h3>任意技能</h3>
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
  quickLabel: string;
  onDecreaseFive: () => void;
  onDecreaseOne: () => void;
  onIncreaseOne: () => void;
  onIncreaseFive: () => void;
  onDirectChange: (value: number) => void;
};

function SkillAssignmentCard({
  skill,
  quickLabel,
  onDecreaseFive,
  onDecreaseOne,
  onIncreaseOne,
  onIncreaseFive,
  onDirectChange
}: SkillAssignmentCardProps) {
  return (
    <div className="wizard-skill-card">
      <div className="wizard-skill-copy">
        <div className="wizard-skill-copy-header">
          <strong>{skill.name}</strong>
          <span className="wizard-skill-chip">{quickLabel}</span>
        </div>
        <span>初期 {skill.base} / 現在 {skill.total} / 上限 {skill.max}</span>
        <p>{skill.description}</p>
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
            max={Math.max(0, skill.max - skill.base)}
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
