"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { importCharacterSheetFromFile } from "@/lib/character-import";
import { exportCharacterSheetAsCsv, exportCharacterSheetAsXlsx } from "@/lib/character-export";
import { getDisplayedProfessionName } from "@/lib/professions";
import { deleteCharacterSheet, getCharacterSheets, saveCharacterSheet, updateCharacterSheet } from "@/lib/character-storage";
import { CharacterSheet } from "@/types/character";

type CharacterManagerProps = {
  refreshToken: number;
  onEdit: (sheet: CharacterSheet) => void;
  onSheetsChanged?: () => void;
};

export function CharacterManager({ refreshToken, onEdit, onSheetsChanged }: CharacterManagerProps) {
  const [sheets, setSheets] = useState<CharacterSheet[]>([]);
  const [importFeedback, setImportFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSheets(getCharacterSheets());
  }, [refreshToken]);

  function onDelete(sheetId: string) {
    deleteCharacterSheet(sheetId);
    setSheets(getCharacterSheets());
    onSheetsChanged?.();
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

    setSheets(getCharacterSheets());
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

    setSheets(getCharacterSheets());
    onSheetsChanged?.();
  }

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

    if (importedCount > 0) {
      setSheets(getCharacterSheets());
      onSheetsChanged?.();
    }

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

  return (
    <section className="card">
      <h1 className="title">キャラクター管理</h1>
      <p className="subtitle">保存済みキャラクターを一覧し、再編集や状態確認、CSV/XLSX の入出力を行います。</p>

      <div className="manager-toolbar">
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
        <p className="helper-text">このツールで出力した CSV/XLSX を取り込めます。古い出力は一部の補助情報を初期化して復元します。</p>
        {importFeedback ? (
          <div className={importFeedback.kind === "error" ? "manager-feedback is-error" : "manager-feedback is-success"}>
            {importFeedback.text}
          </div>
        ) : null}
      </div>

      {sheets.length === 0 ? (
        <div className="manager-empty">
          <p>保存済みのキャラクターはまだありません。</p>
          <p className="helper-text">作成ウィザードの最終確認から保存するか、CSV/XLSX を取り込むと、ここに追加されます。</p>
        </div>
      ) : (
        <div className="manager-grid">
          {sheets.map((sheet) => (
            <article key={sheet.id} className="manager-card">
              <div className="manager-card-header">
                <div>
                  <h2>{sheet.basicInfo.characterName || "名称未設定"}</h2>
                  <div className="helper-text">
                    {sheet.basicInfo.playerName || "プレイヤー名未設定"} / {sheet.basicInfo.age || "年齢未設定"}
                  </div>
                </div>
                <div className="pill">{getDisplayedProfessionName(sheet.basicInfo) || "職業未設定"}</div>
              </div>

              <div className="derived-list">
                <div className="skill-row"><span>HP</span><strong>{formatConditionValue(sheet.condition.currentHp, Number(sheet.derivedStats.hp))}</strong></div>
                <div className="skill-row"><span>MP</span><strong>{formatConditionValue(sheet.condition.currentMp, Number(sheet.derivedStats.mp))}</strong></div>
                <div className="skill-row"><span>SAN</span><strong>{formatConditionValue(sheet.condition.currentSan, Number(sheet.derivedStats.san))}</strong></div>
                <div className="skill-row"><span>Build / DB</span><strong>{sheet.derivedStats.build} / {sheet.derivedStats.damageBonus}</strong></div>
              </div>

              <div className="status-grid">
                <StatusEditor
                  label="HP"
                  value={sheet.condition.currentHp}
                  maxValue={Number(sheet.derivedStats.hp)}
                  onDecrease={() => onAdjustCondition(sheet.id, "currentHp", -1)}
                  onIncrease={() => onAdjustCondition(sheet.id, "currentHp", 1)}
                  onCommit={(value) => onSetCondition(sheet.id, "currentHp", value)}
                />
                <StatusEditor
                  label="MP"
                  value={sheet.condition.currentMp}
                  maxValue={Number(sheet.derivedStats.mp)}
                  onDecrease={() => onAdjustCondition(sheet.id, "currentMp", -1)}
                  onIncrease={() => onAdjustCondition(sheet.id, "currentMp", 1)}
                  onCommit={(value) => onSetCondition(sheet.id, "currentMp", value)}
                />
                <StatusEditor
                  label="SAN"
                  value={sheet.condition.currentSan}
                  maxValue={Number(sheet.derivedStats.san)}
                  onDecrease={() => onAdjustCondition(sheet.id, "currentSan", -1)}
                  onIncrease={() => onAdjustCondition(sheet.id, "currentSan", 1)}
                  onCommit={(value) => onSetCondition(sheet.id, "currentSan", value)}
                />
              </div>

              <div className="helper-text">最終更新: {new Date(sheet.updatedAt).toLocaleString("ja-JP")}</div>

              <div className="manager-actions">
                <button className="primary" type="button" onClick={() => onEdit(sheet)}>
                  再編集する
                </button>
                <button className="secondary" type="button" onClick={() => exportCharacterSheetAsCsv(sheet)}>
                  CSV出力
                </button>
                <button className="secondary" type="button" onClick={() => void exportCharacterSheetAsXlsx(sheet)}>
                  XLSX出力
                </button>
                <button className="secondary" type="button" onClick={() => onDelete(sheet.id)}>
                  削除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
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