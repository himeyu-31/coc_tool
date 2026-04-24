"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { backstoryFieldDefinitions, normalizeCharacterBackstory } from "@/lib/character-sheet";
import { exportCharacterSheetAsCsv, exportCharacterSheetAsXlsx } from "@/lib/character-export";
import { importCharacterSheetFromFile } from "@/lib/character-import";
import { deleteCharacterSheet, saveCharacterSheet, updateCharacterSheet } from "@/lib/character-storage";
import { getDisplayedProfessionName, getProfessionById } from "@/lib/professions";
import { CharacterBackstory, CharacterSheet, CharacteristicKey, SkillCategory } from "@/types/character";

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

type CharacterArchivePanelProps = {
  sheets: CharacterSheet[];
  refreshToken: number;
  onEdit: (sheet: CharacterSheet) => void;
  onSheetsChanged?: () => void;
};

export function CharacterArchivePanel({ sheets, refreshToken, onEdit, onSheetsChanged }: CharacterArchivePanelProps) {
  const [selectedSheetId, setSelectedSheetId] = useState("");
  const [importFeedback, setImportFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [archiveFeedback, setArchiveFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [backstoryDraft, setBackstoryDraft] = useState<CharacterBackstory>(normalizeCharacterBackstory(undefined));
  const [pendingDeleteSheetId, setPendingDeleteSheetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSheet = sheets.find((sheet) => sheet.id === selectedSheetId) ?? sheets[0] ?? null;
  const pendingDeleteSheet = sheets.find((sheet) => sheet.id === pendingDeleteSheetId) ?? null;

  useEffect(() => {
    if (!selectedSheet) {
      setSelectedSheetId("");
      setBackstoryDraft(normalizeCharacterBackstory(undefined));
      return;
    }

    setSelectedSheetId(selectedSheet.id);
    setBackstoryDraft(normalizeCharacterBackstory(selectedSheet.backstory));
  }, [selectedSheetId, selectedSheet, refreshToken]);

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

  const isBackstoryDirty = useMemo(() => {
    if (!selectedSheet) {
      return false;
    }

    const currentBackstory = normalizeCharacterBackstory(selectedSheet.backstory);
    return backstoryFieldDefinitions.some((field) => currentBackstory[field.key] !== backstoryDraft[field.key]);
  }, [backstoryDraft, selectedSheet]);

  async function onImportFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    let importedCount = 0;
    const failedFiles: string[] = [];

    for (const file of files) {
      try {
        const sheet = await importCharacterSheetFromFile(file);
        saveCharacterSheet(sheet);
        importedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "取込に失敗しました。";
        failedFiles.push(`${file.name}: ${message}`);
      }
    }

    event.target.value = "";
    onSheetsChanged?.();

    if (failedFiles.length === 0) {
      setImportFeedback({ kind: "success", text: `${importedCount}件のキャラクターを取り込みました。` });
      return;
    }

    if (importedCount > 0) {
      setImportFeedback({ kind: "success", text: `${importedCount}件を取り込み、${failedFiles.length}件は失敗しました。 ${failedFiles.join(" / ")}` });
      return;
    }

    setImportFeedback({ kind: "error", text: failedFiles.join(" / ") });
  }

  function onDelete(sheetId: string) {
    deleteCharacterSheet(sheetId);
    setArchiveFeedback({ kind: "success", text: "キャラクターを保管庫から削除しました。" });
    onSheetsChanged?.();
  }

  function onRequestDelete(sheetId: string) {
    setPendingDeleteSheetId(sheetId);
  }

  function onCancelDelete() {
    setPendingDeleteSheetId(null);
  }

  function onConfirmDelete() {
    if (!pendingDeleteSheetId) {
      return;
    }

    onDelete(pendingDeleteSheetId);
    setPendingDeleteSheetId(null);
  }

  function onAdjustCondition(sheetId: string, key: "currentHp" | "currentMp" | "currentSan", delta: number) {
    updateCharacterSheet(sheetId, (sheet) => {
      const nextValue = Math.max(0, Math.min(getMaxConditionValue(sheet, key), sheet.condition[key] + delta));
      return {
        ...sheet,
        condition: {
          ...sheet.condition,
          [key]: nextValue
        }
      };
    });
    onSheetsChanged?.();
  }

  function onSetCondition(sheetId: string, key: "currentHp" | "currentMp" | "currentSan", value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    updateCharacterSheet(sheetId, (sheet) => ({
      ...sheet,
      condition: {
        ...sheet.condition,
        [key]: Math.max(0, Math.min(getMaxConditionValue(sheet, key), parsed))
      }
    }));
    onSheetsChanged?.();
  }

  function onSaveBackstory() {
    if (!selectedSheet) {
      return;
    }

    updateCharacterSheet(selectedSheet.id, (sheet) => ({
      ...sheet,
      backstory: normalizeCharacterBackstory(backstoryDraft)
    }));

    setArchiveFeedback({ kind: "success", text: "バックストーリーを保存しました。" });
    onSheetsChanged?.();
  }

  return (
    <section className="card reference-layout archive-layout">
      <div>
        <h2 className="title">キャラクター保管庫</h2>
        <p className="subtitle">保存済みキャラクターを一覧し、詳細確認、状態更新、バックストーリー更新、CSV/XLSX 入出力、作成ウィザードでの再編集を行います。</p>
      </div>

      <div className="manager-toolbar archive-toolbar">
        <div className="manager-actions">
          <button className="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
            CSV/XLSXを取り込む
          </button>
        </div>
        <input
          ref={fileInputRef}
          className="manager-import-input"
          type="file"
          accept=".csv,.xlsx"
          multiple
          onChange={(event) => void onImportFiles(event)}
        />
        <p className="helper-text">この保管庫では、保存済みキャラクターの閲覧だけでなく、出力、状態更新、バックストーリーの追記も行えます。</p>
        {importFeedback ? (
          <div className={importFeedback.kind === "error" ? "manager-feedback is-error" : "manager-feedback is-success"}>
            {importFeedback.text}
          </div>
        ) : null}
        {archiveFeedback ? (
          <div className={archiveFeedback.kind === "error" ? "manager-feedback is-error" : "manager-feedback is-success"}>
            {archiveFeedback.text}
          </div>
        ) : null}
      </div>

      {sheets.length === 0 ? (
        <div className="reference-empty-state">
          <p>保存済みキャラクターはまだありません。</p>
          <p className="helper-text">作成ウィザードの最終確認から保存するか、CSV/XLSX を取り込むと、ここに追加されます。</p>
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
                  onClick={() => {
                    setSelectedSheetId(sheet.id);
                    setArchiveFeedback(null);
                  }}
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
              <article className="reference-detail-card character-reference-card archive-detail-card">
                <div className="reference-card-header archive-card-header">
                  <div>
                    <h3>{selectedSheet.basicInfo.characterName || "名称未設定"}</h3>
                    <div className="helper-text">{selectedSheet.basicInfo.playerName || "プレイヤー名未設定"} / 最終更新 {new Date(selectedSheet.updatedAt).toLocaleString("ja-JP")}</div>
                  </div>
                  <span className="pill">{getDisplayedProfessionName(selectedSheet.basicInfo) || "職業未設定"}</span>
                </div>

                <div className="manager-actions archive-detail-actions">
                  <button className="primary" type="button" onClick={() => onEdit(selectedSheet)}>
                    作成ウィザードで再編集
                  </button>
                  <button className="secondary" type="button" onClick={() => exportCharacterSheetAsCsv(selectedSheet)}>
                    CSV出力
                  </button>
                  <button className="secondary" type="button" onClick={() => void exportCharacterSheetAsXlsx(selectedSheet)}>
                    XLSX出力
                  </button>
                  <button className="wizard-danger-button" type="button" onClick={() => onRequestDelete(selectedSheet.id)}>
                    削除
                  </button>
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
                    <strong>現在値の管理</strong>
                    <div className="derived-list">
                      <div className="skill-row"><span>HP</span><strong>{formatConditionValue(selectedSheet.condition.currentHp, Number(selectedSheet.derivedStats.hp))}</strong></div>
                      <div className="skill-row"><span>MP</span><strong>{formatConditionValue(selectedSheet.condition.currentMp, Number(selectedSheet.derivedStats.mp))}</strong></div>
                      <div className="skill-row"><span>SAN</span><strong>{formatConditionValue(selectedSheet.condition.currentSan, Number(selectedSheet.derivedStats.san))}</strong></div>
                      <div className="skill-row"><span>MOV</span><strong>{selectedSheet.derivedStats.moveRate}</strong></div>
                      <div className="skill-row"><span>Build / DB</span><strong>{selectedSheet.derivedStats.build} / {selectedSheet.derivedStats.damageBonus}</strong></div>
                    </div>
                    <div className="status-grid archive-status-grid">
                      <StatusEditor
                        label="HP"
                        value={selectedSheet.condition.currentHp}
                        maxValue={Number(selectedSheet.derivedStats.hp)}
                        onDecrease={() => onAdjustCondition(selectedSheet.id, "currentHp", -1)}
                        onIncrease={() => onAdjustCondition(selectedSheet.id, "currentHp", 1)}
                        onCommit={(value) => onSetCondition(selectedSheet.id, "currentHp", value)}
                      />
                      <StatusEditor
                        label="MP"
                        value={selectedSheet.condition.currentMp}
                        maxValue={Number(selectedSheet.derivedStats.mp)}
                        onDecrease={() => onAdjustCondition(selectedSheet.id, "currentMp", -1)}
                        onIncrease={() => onAdjustCondition(selectedSheet.id, "currentMp", 1)}
                        onCommit={(value) => onSetCondition(selectedSheet.id, "currentMp", value)}
                      />
                      <StatusEditor
                        label="SAN"
                        value={selectedSheet.condition.currentSan}
                        maxValue={Number(selectedSheet.derivedStats.san)}
                        onDecrease={() => onAdjustCondition(selectedSheet.id, "currentSan", -1)}
                        onIncrease={() => onAdjustCondition(selectedSheet.id, "currentSan", 1)}
                        onCommit={(value) => onSetCondition(selectedSheet.id, "currentSan", value)}
                      />
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

                <div className="reference-section archive-backstory-section">
                  <details className="accordion-item" open={false}>
                    <summary>
                      <span className="accordion-summary-main">
                        <strong>バックストーリー</strong>
                        <span className="helper-text">必要なときだけ開いて編集</span>
                      </span>
                      <span className="accordion-summary-icon" aria-hidden="true">▾</span>
                    </summary>
                    <div className="accordion-content">
                      <div className="reference-backstory-grid archive-backstory-grid">
                        {backstoryFieldDefinitions.map((field) => (
                          <label key={field.key} className="reference-backstory-item archive-backstory-item">
                            <span>{field.label}</span>
                            <textarea
                              rows={field.rows ?? 4}
                              value={backstoryDraft[field.key]}
                              placeholder="自由に記入"
                              onChange={(event) => {
                                const value = event.target.value;
                                setBackstoryDraft((current) => ({ ...current, [field.key]: value }));
                              }}
                            />
                          </label>
                        ))}
                      </div>
                      <div className="accordion-actions">
                        <button className="primary" type="button" onClick={onSaveBackstory} disabled={!isBackstoryDirty}>
                          バックストーリーを保存
                        </button>
                      </div>
                    </div>
                  </details>
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
                <p>表示するキャラクターを選択してください。</p>
              </div>
            )}
          </div>
        </div>
      )}

      {pendingDeleteSheet ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="キャラクター削除の確認" onClick={onCancelDelete}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>キャラクターを削除しますか？</h3>
                <p className="helper-text">削除後は保管庫から元に戻せません。必要なら先に CSV または XLSX で出力してください。</p>
              </div>
            </div>
            <div className="derived-list">
              <div className="skill-row"><span>対象</span><strong>{pendingDeleteSheet.basicInfo.characterName || "名称未設定"}</strong></div>
              <div className="skill-row"><span>プレイヤー</span><strong>{pendingDeleteSheet.basicInfo.playerName || "プレイヤー名未設定"}</strong></div>
              <div className="skill-row"><span>職業</span><strong>{getDisplayedProfessionName(pendingDeleteSheet.basicInfo) || "職業未設定"}</strong></div>
            </div>
            <div className="actions">
              <button className="secondary" type="button" onClick={onCancelDelete}>
                キャンセル
              </button>
              <button className="wizard-danger-button" type="button" onClick={onConfirmDelete}>
                削除する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type StatusEditorProps = {
  label: string;
  value: number;
  maxValue: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onCommit: (value: string) => void;
};

function StatusEditor({ label, value, maxValue, onDecrease, onIncrease, onCommit }: StatusEditorProps) {
  return (
    <div className="status-editor">
      <div className="status-header">
        <strong>{label}</strong>
        <span className="helper-text">{value}/{maxValue}</span>
      </div>
      <div className="status-controls">
        <button className="secondary status-button" type="button" onClick={onDecrease}>
          -1
        </button>
        <input
          className="status-input"
          type="number"
          min={0}
          max={maxValue}
          value={value}
          onChange={(event) => onCommit(event.target.value)}
        />
        <button className="secondary status-button" type="button" onClick={onIncrease}>
          +1
        </button>
      </div>
    </div>
  );
}

function getMaxConditionValue(sheet: CharacterSheet, key: "currentHp" | "currentMp" | "currentSan"): number {
  if (key === "currentHp") {
    return Number(sheet.derivedStats.hp);
  }
  if (key === "currentMp") {
    return Number(sheet.derivedStats.mp);
  }

  return Number(sheet.derivedStats.san);
}

function formatConditionValue(currentValue: number, maxValue: number): string {
  return `${currentValue}/${maxValue}`;
}