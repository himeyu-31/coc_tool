"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteSessionRecord, getSessionRecords, saveSessionRecord, updateSessionRecord } from "@/lib/session-storage";
import { getProfessionById } from "@/lib/professions";
import { CharacterSheet, SessionRecord, SessionStatus } from "@/types/character";

type SessionManagerProps = {
  availableSheets: CharacterSheet[];
  onOpenManage: () => void;
};

type SessionDraft = {
  name: string;
  scheduledOn: string;
  notes: string;
};

const defaultDraft: SessionDraft = {
  name: "",
  scheduledOn: "",
  notes: ""
};

const statusLabels: Record<SessionStatus, string> = {
  planned: "準備中",
  active: "進行中",
  closed: "終了"
};

export function SessionManager({ availableSheets, onOpenManage }: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [draft, setDraft] = useState<SessionDraft>(defaultDraft);
  const [selectionBySession, setSelectionBySession] = useState<Record<string, string>>( {});

  useEffect(() => {
    setSessions(getSessionRecords());
  }, []);

  const availableSheetMap = useMemo(
    () => new Map(availableSheets.map((sheet) => [sheet.id, sheet])),
    [availableSheets]
  );

  function refreshSessions() {
    setSessions(getSessionRecords());
  }

  function onCreateSession() {
    if (!draft.name.trim()) {
      return;
    }

    const now = new Date().toISOString();
    saveSessionRecord({
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      scheduledOn: draft.scheduledOn,
      participantIds: [],
      notes: draft.notes.trim(),
      status: "planned",
      logs: [],
      updatedAt: now
    });

    setDraft(defaultDraft);
    refreshSessions();
  }

  function onDeleteSession(sessionId: string) {
    deleteSessionRecord(sessionId);
    refreshSessions();
  }

  function onStatusChange(sessionId: string, status: SessionStatus) {
    updateSessionRecord(sessionId, (session) => ({
      ...session,
      status
    }));
    refreshSessions();
  }

  function onNotesChange(sessionId: string, notes: string) {
    updateSessionRecord(sessionId, (session) => ({
      ...session,
      notes
    }));
    refreshSessions();
  }

  function onAddParticipant(sessionId: string) {
    const selectedId = selectionBySession[sessionId];
    if (!selectedId) {
      return;
    }

    updateSessionRecord(sessionId, (session) => ({
      ...session,
      participantIds: session.participantIds.includes(selectedId)
        ? session.participantIds
        : [...session.participantIds, selectedId],
      logs: [
        ...session.logs,
        {
          id: crypto.randomUUID(),
          notedAt: new Date().toISOString(),
          summary: "キャラクターをセッションに追加",
          sheetId: selectedId
        }
      ]
    }));

    setSelectionBySession((current) => ({
      ...current,
      [sessionId]: ""
    }));
    refreshSessions();
  }

  function onRemoveParticipant(sessionId: string, sheetId: string) {
    updateSessionRecord(sessionId, (session) => ({
      ...session,
      participantIds: session.participantIds.filter((id) => id !== sheetId),
      logs: [
        ...session.logs,
        {
          id: crypto.randomUUID(),
          notedAt: new Date().toISOString(),
          summary: "キャラクターをセッションから除外",
          sheetId
        }
      ]
    }));
    refreshSessions();
  }

  return (
    <section className="card session-layout">
      <div>
        <h1 className="title">セッション管理</h1>
        <p className="subtitle">セッションごとに参加キャラクターを束ね、進行メモと更新履歴を保持します。</p>
      </div>

      <section className="session-create-panel">
        <h2>セッションを追加</h2>
        <div className="grid two">
          <label>
            セッション名
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="例: セッション01 奈落の呼び声"
            />
          </label>
          <label>
            開催日
            <input
              type="date"
              value={draft.scheduledOn}
              onChange={(event) => setDraft((current) => ({ ...current, scheduledOn: event.target.value }))}
            />
          </label>
        </div>
        <label>
          セッションメモ
          <textarea
            rows={4}
            value={draft.notes}
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            placeholder="開催場所、シナリオ名、準備メモなど"
          />
        </label>
        <div className="workspace-actions">
          <button className="primary" type="button" onClick={onCreateSession} disabled={!draft.name.trim()}>
            セッションを作成
          </button>
          <button className="secondary" type="button" onClick={onOpenManage}>
            キャラクター管理を開く
          </button>
        </div>
      </section>

      {sessions.length === 0 ? (
        <div className="manager-empty">
          <p>作成済みセッションはまだありません。</p>
          <p className="helper-text">まずはセッション名を登録し、保存済みキャラクターを追加してください。</p>
        </div>
      ) : (
        <div className="session-grid">
          {sessions.map((session) => {
            const candidateSheets = availableSheets.filter((sheet) => !session.participantIds.includes(sheet.id));

            return (
              <article key={session.id} className="session-card">
                <div className="manager-card-header">
                  <div>
                    <h2>{session.name}</h2>
                    <div className="helper-text">
                      {session.scheduledOn || "開催日未設定"} / 最終更新 {new Date(session.updatedAt).toLocaleString("ja-JP")}
                    </div>
                  </div>
                  <div className="session-header-actions">
                    <select value={session.status} onChange={(event) => onStatusChange(session.id, event.target.value as SessionStatus)}>
                      <option value="planned">準備中</option>
                      <option value="active">進行中</option>
                      <option value="closed">終了</option>
                    </select>
                    <span className="pill">{statusLabels[session.status]}</span>
                  </div>
                </div>

                <div className="session-section">
                  <h3>参加キャラクター</h3>
                  {session.participantIds.length === 0 ? (
                    <p className="helper-text">まだ参加キャラクターがいません。</p>
                  ) : (
                    <div className="session-participant-list">
                      {session.participantIds.map((participantId) => {
                        const sheet = availableSheetMap.get(participantId);
                        return (
                          <div key={participantId} className="session-participant-item">
                            <div>
                              <strong>{sheet?.basicInfo.characterName || "削除済みキャラクター"}</strong>
                              <div className="helper-text">{sheet ? getProfessionById(sheet.basicInfo.professionId)?.name || "職業未設定" : "保存済み一覧に存在しません"}</div>
                            </div>
                            <button className="secondary" type="button" onClick={() => onRemoveParticipant(session.id, participantId)}>
                              除外
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="session-add-row">
                    <select
                      value={selectionBySession[session.id] || ""}
                      onChange={(event) => setSelectionBySession((current) => ({ ...current, [session.id]: event.target.value }))}
                    >
                      <option value="">追加するキャラクターを選択</option>
                      {candidateSheets.map((sheet) => (
                        <option key={sheet.id} value={sheet.id}>
                          {sheet.basicInfo.characterName || "名称未設定"} / {sheet.basicInfo.playerName || "プレイヤー名未設定"}
                        </option>
                      ))}
                    </select>
                    <button className="primary" type="button" onClick={() => onAddParticipant(session.id)} disabled={!selectionBySession[session.id]}>
                      追加
                    </button>
                  </div>
                </div>

                <div className="session-section">
                  <h3>セッションメモ</h3>
                  <textarea
                    rows={4}
                    value={session.notes}
                    onChange={(event) => onNotesChange(session.id, event.target.value)}
                    placeholder="進行メモ、注意点、持ち越し事項など"
                  />
                </div>

                <div className="session-section">
                  <h3>更新履歴</h3>
                  {session.logs.length === 0 ? (
                    <p className="helper-text">まだ履歴はありません。</p>
                  ) : (
                    <ul className="recent-list">
                      {session.logs.slice(-5).reverse().map((log) => {
                        const relatedSheet = log.sheetId ? availableSheetMap.get(log.sheetId) : null;
                        return (
                          <li key={log.id}>
                            <strong>{log.summary}</strong>
                            <span>
                              {new Date(log.notedAt).toLocaleString("ja-JP")}
                              {relatedSheet ? ` / ${relatedSheet.basicInfo.characterName || "名称未設定"}` : ""}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="manager-actions">
                  <button className="secondary" type="button" onClick={() => onDeleteSession(session.id)}>
                    セッションを削除
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}