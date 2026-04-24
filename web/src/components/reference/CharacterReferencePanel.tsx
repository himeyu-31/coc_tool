"use client";

import { useMemo, useState } from "react";
import { getDisplayedProfessionName, getProfessionById } from "@/lib/professions";
import { backstoryFieldDefinitions, normalizeCharacterBackstory } from "@/lib/character-sheet";
import { CharacterSheet, CharacteristicKey, SkillCategory } from "@/types/character";

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

type CharacterReferencePanelProps = {
  sheets: CharacterSheet[];
};

export function CharacterReferencePanel({ sheets }: CharacterReferencePanelProps) {
  const [selectedSheetId, setSelectedSheetId] = useState("");

  const selectedSheet = sheets.find((sheet) => sheet.id === selectedSheetId) ?? sheets[0] ?? null;

  const aggregatedSkills = useMemo(() => {
    if (!selectedSheet) {
      return [];
    }

    const aggregated = new Map<string, { id: string; name: string; category: SkillCategory; base: number; assigned: number; sources: string[] }>();

    for (const skill of selectedSheet.occupationSkills) {
      const current = aggregated.get(skill.id) ?? { id: skill.id, name: skill.name, category: skill.category, base: skill.base, assigned: 0, sources: [] };
      current.assigned += skill.assigned;
      current.sources = Array.from(new Set([...current.sources, "職業"]));
      aggregated.set(skill.id, current);
    }

    for (const skill of selectedSheet.optionalSkills) {
      const current = aggregated.get(skill.id) ?? { id: skill.id, name: skill.name, category: skill.category, base: skill.base, assigned: 0, sources: [] };
      current.assigned += skill.assigned;
      current.sources = Array.from(new Set([...current.sources, "趣味"]));
      aggregated.set(skill.id, current);
    }

    return Array.from(aggregated.values()).sort((left, right) => left.name.localeCompare(right.name, "ja"));
  }, [selectedSheet]);

  const groupedSkills = useMemo(() => {
    const grouped = new Map<SkillCategory, typeof aggregatedSkills>();

    for (const skill of aggregatedSkills) {
      const current = grouped.get(skill.category) ?? [];
      current.push(skill);
      grouped.set(skill.category, current);
    }

    return (Object.keys(skillCategoryLabels) as SkillCategory[])
      .map((category) => ({
        category,
        label: skillCategoryLabels[category],
        skills: grouped.get(category) ?? []
      }))
      .filter((group) => group.skills.length > 0);
  }, [aggregatedSkills]);

  return (
    <section className="card reference-layout">
      <div>
        <h2 className="title">キャラクター参照</h2>
        <p className="subtitle">保存済みキャラクターの基本情報、能力値、派生値、技能を読み取り専用で確認できます。</p>
      </div>

      {sheets.length === 0 ? (
        <div className="reference-empty-state">
          <p>保存済みキャラクターはまだありません。</p>
          <p className="helper-text">作成ウィザードの最終確認から保存すると、ここで確認できます。</p>
        </div>
      ) : (
        <div className="reference-master-detail">
          <div className="reference-master-pane">
            <div className="reference-summary">{sheets.length}件のキャラクター</div>
            <div className="reference-row-list">
              {sheets.map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  className={selectedSheet?.id === sheet.id ? "reference-row active-row" : "reference-row"}
                  onClick={() => setSelectedSheetId(sheet.id)}
                >
                  <div className="reference-row-main">
                    <strong>{sheet.basicInfo.characterName || "名称未設定"}</strong>
                    <span>{getDisplayedProfessionName(sheet.basicInfo) || "職業未設定"}</span>
                  </div>
                  <div className="reference-row-meta">
                    <span>{sheet.basicInfo.playerName || "プレイヤー名未設定"}</span>
                    <span>{new Date(sheet.updatedAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="reference-detail-pane">
            {selectedSheet ? (
              <article className="reference-detail-card character-reference-card">
                <div className="reference-card-header">
                  <h3>{selectedSheet.basicInfo.characterName || "名称未設定"}</h3>
                  <span className="pill">{getDisplayedProfessionName(selectedSheet.basicInfo) || "職業未設定"}</span>
                </div>

                <div className="reference-two-column character-reference-grid">
                  <div className="reference-section">
                    <strong>基本情報</strong>
                    <div className="derived-list">
                      <div className="skill-row"><span>プレイヤー名</span><strong>{selectedSheet.basicInfo.playerName || "-"}</strong></div>
                      <div className="skill-row"><span>年齢</span><strong>{selectedSheet.basicInfo.age || "-"}</strong></div>
                      <div className="skill-row"><span>性別・性自認</span><strong>{selectedSheet.basicInfo.gender || "-"}</strong></div>
                      {selectedSheet.basicInfo.professionMode === "custom" ? <div className="skill-row"><span>ルール参照元</span><strong>{getProfessionById(selectedSheet.basicInfo.professionId)?.name || "-"}</strong></div> : null}
                      <div className="skill-row"><span>時代設定</span><strong>{selectedSheet.basicInfo.era || "-"}</strong></div>
                    </div>
                  </div>

                  <div className="reference-section">
                    <strong>派生値</strong>
                    <div className="derived-list">
                      <div className="skill-row"><span>HP</span><strong>{formatConditionValue(selectedSheet.condition.currentHp, Number(selectedSheet.derivedStats.hp))}</strong></div>
                      <div className="skill-row"><span>MP</span><strong>{formatConditionValue(selectedSheet.condition.currentMp, Number(selectedSheet.derivedStats.mp))}</strong></div>
                      <div className="skill-row"><span>SAN</span><strong>{formatConditionValue(selectedSheet.condition.currentSan, Number(selectedSheet.derivedStats.san))}</strong></div>
                      <div className="skill-row"><span>MOV</span><strong>{selectedSheet.derivedStats.moveRate}</strong></div>
                      <div className="skill-row"><span>Build / DB</span><strong>{selectedSheet.derivedStats.build} / {selectedSheet.derivedStats.damageBonus}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="reference-section">
                  <strong>能力値</strong>
                  <div className="characteristic-reference-grid">
                    {(Object.entries(selectedSheet.characteristics) as Array<[CharacteristicKey, number]>).map(([key, value]) => (
                      <div key={key} className="characteristic-reference-card">
                        <span>{characteristicLabels[key]}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="reference-section">
                  <strong>バックストーリー</strong>
                  <div className="reference-backstory-grid">
                    {backstoryFieldDefinitions.map((field) => {
                      const value = normalizeCharacterBackstory(selectedSheet.backstory)[field.key];
                      return (
                        <div key={field.key} className="reference-backstory-item">
                          <span>{field.label}</span>
                          <p>{value || "-"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="reference-section">
                  <strong>技能</strong>
                  <div className="character-skill-category-list">
                    {aggregatedSkills.length === 0 ? (
                      <p className="helper-text">配分済み技能はまだありません。</p>
                    ) : (
                      groupedSkills.map((group) => (
                        <section key={group.category} className="character-skill-category-block">
                          <div className="character-skill-category-header">
                            <strong>{group.label}</strong>
                            <span>{group.skills.length}件</span>
                          </div>
                          <div className="character-skill-table-wrap">
                            <table className="character-skill-table">
                              <thead>
                                <tr>
                                  <th>技能</th>
                                  <th>初期値</th>
                                  <th>配分</th>
                                  <th>合計</th>
                                  <th>種別</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.skills.map((skill) => (
                                  <tr key={skill.id}>
                                    <td>{skill.name}</td>
                                    <td><span className="character-skill-base">{skill.base}</span></td>
                                    <td>+{skill.assigned}</td>
                                    <td><strong className="character-skill-total">{skill.base + skill.assigned}</strong></td>
                                    <td>{skill.sources.join("+")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ))
                    )}
                  </div>
                </div>
              </article>
            ) : (
              <div className="reference-empty-state">
                <p>参照するキャラクターを選択してください。</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function formatConditionValue(currentValue: number, maxValue: number): string {
  return `${currentValue}/${maxValue}`;
}