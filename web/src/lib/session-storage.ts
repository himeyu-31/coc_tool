import { SessionRecord } from "@/types/character";

const STORAGE_KEY = "coc7-session-records";

export function saveSessionRecord(session: SessionRecord): void {
  const sessions = getSessionRecords();
  const existingIndex = sessions.findIndex((item) => item.id === session.id);
  const nextSessions = [...sessions];

  if (existingIndex >= 0) {
    nextSessions[existingIndex] = session;
  } else {
    nextSessions.unshift(session);
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
}

export function getSessionRecords(): SessionRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as SessionRecord[];
  } catch {
    return [];
  }
}

export function deleteSessionRecord(sessionId: string): void {
  const sessions = getSessionRecords();
  const nextSessions = sessions.filter((session) => session.id !== sessionId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
}

export function updateSessionRecord(sessionId: string, updater: (session: SessionRecord) => SessionRecord): SessionRecord | null {
  const sessions = getSessionRecords();
  const target = sessions.find((session) => session.id === sessionId);

  if (!target) {
    return null;
  }

  const updated = updater(target);
  saveSessionRecord({
    ...updated,
    updatedAt: new Date().toISOString()
  });

  return updated;
}