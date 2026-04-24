"use client";

import { useEffect, useMemo, useState } from "react";
import { CharacterArchivePanel } from "@/components/archive/CharacterArchivePanel";
import { QuickReferencePanel } from "@/components/reference/QuickReferencePanel";
import { SessionManager } from "@/components/session/SessionManager";
import { CharacterWizard } from "@/components/wizard/CharacterWizard";
import { getCharacterSheets } from "@/lib/character-storage";
import { getDisplayedProfessionName } from "@/lib/professions";
import { CharacterSheet } from "@/types/character";

type ViewMode = "top" | "create" | "character-archive" | "quick-reference" | "guide" | "session" | "table-adjustment";
type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "coc7-theme";

export function CharacterWorkspace() {
  const [viewMode, setViewMode] = useState<ViewMode>("top");
  const [viewHistory, setViewHistory] = useState<ViewMode[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [editingSheet, setEditingSheet] = useState<CharacterSheet | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [savedSheets, setSavedSheets] = useState<CharacterSheet[]>([]);
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }

    const prefersDark = globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setSavedSheets(getCharacterSheets());
  }, [refreshToken]);

  const recentSheets = useMemo(() => savedSheets.slice(0, 3), [savedSheets]);
  const previousView = viewHistory[viewHistory.length - 1] ?? null;

  function navigateTo(nextView: ViewMode) {
    if (nextView === viewMode) {
      return;
    }

    setViewHistory((current) => [...current, viewMode]);
    setViewMode(nextView);
  }

  function navigateTop() {
    setViewMode("top");
    setViewHistory([]);
  }

  function refreshSheets() {
    setRefreshToken((current) => current + 1);
  }

  function onSaved(sheet: CharacterSheet) {
    setEditingSheet(sheet);
    refreshSheets();
  }

  function onEdit(sheet: CharacterSheet) {
    setEditingSheet(sheet);
    navigateTo("create");
  }

  function onCreateNew() {
    setEditingSheet(null);
    setResetToken((current) => current + 1);
    navigateTo("create");
  }

  function openCharacterArchive() {
    refreshSheets();
    navigateTo("character-archive");
  }

  function onBack() {
    if (!previousView) {
      return;
    }

    setViewHistory((current) => current.slice(0, -1));
    setViewMode(previousView);
  }

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return (
    <main>
      <section className="workspace-shell card">
        <div className="workspace-topline">CoC7 Character Support</div>
        <div className="workspace-nav">
          <div>
            <h1 className="title">CoC7 キャラクターシートツール</h1>
          </div>
          <div className="workspace-actions">
            <button className="secondary theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"}>
              {theme === "dark" ? "ライトモード" : "ダークモード"}
            </button>
            {previousView && previousView !== "top" ? (
              <button className="secondary" type="button" onClick={onBack}>
                前の画面に戻る
              </button>
            ) : null}
            <button className="secondary" type="button" onClick={navigateTop}>
              トップページ
            </button>
          </div>
        </div>

        <div className="workspace-breadcrumbs">
          <span className="pill">保存済み {savedSheets.length}件</span>
          {recentSheets[0] ? <span className="pill">直近: {recentSheets[0].basicInfo.characterName || "名称未設定"}</span> : null}
        </div>
      </section>

      {viewMode === "top" ? (
        <TopPage
          recentSheets={recentSheets}
          onStartCreate={onCreateNew}
          onOpenGuide={() => navigateTo("guide")}
          onOpenCharacterArchive={openCharacterArchive}
          onOpenSession={() => navigateTo("session")}
          onOpenTableAdjustment={() => navigateTo("table-adjustment")}
          onOpenQuickReference={() => navigateTo("quick-reference")}
        />
      ) : null}

      {viewMode === "create" ? (
        <CharacterWizard
          draftSheet={editingSheet}
          onSaved={onSaved}
          onOpenCharacterArchive={openCharacterArchive}
          resetToken={resetToken}
        />
      ) : null}

      {viewMode === "character-archive" ? (
        <CharacterArchivePanel sheets={savedSheets} refreshToken={refreshToken} onEdit={onEdit} onSheetsChanged={refreshSheets} />
      ) : null}

      {viewMode === "quick-reference" ? <QuickReferencePanel /> : null}
      {viewMode === "guide" ? <GuidePanel onStartCreate={onCreateNew} /> : null}
      {viewMode === "session" ? <SessionManager availableSheets={savedSheets} onOpenArchive={openCharacterArchive} /> : null}
      {viewMode === "table-adjustment" ? <TableAdjustmentPanel /> : null}
    </main>
  );
}

type TopPageProps = {
  recentSheets: CharacterSheet[];
  onStartCreate: () => void;
  onOpenGuide: () => void;
  onOpenCharacterArchive: () => void;
  onOpenSession: () => void;
  onOpenTableAdjustment: () => void;
  onOpenQuickReference: () => void;
};

function TopPage({
  recentSheets,
  onStartCreate,
  onOpenGuide,
  onOpenCharacterArchive,
  onOpenSession,
  onOpenTableAdjustment,
  onOpenQuickReference
}: TopPageProps) {
  return (
    <section className="top-hero card">
      <div className="hero-copy">
        <div className="hero-badge">Call of Cthulhu 7th Edition</div>
        <h2 className="hero-title">CoC7 支援ツール</h2>
        <p className="subtitle">トップで用途を見比べながら、そのまま目的の機能へ進めます。GM / PL 共通で使う保管庫や早引き画面もここから開けます。</p>
      </div>

      <div className="role-grid">
        <article className="role-card gm-accent">
          <p className="role-tag">GM向け</p>
          <h3>保管と進行をすぐ始める</h3>
          <p>セッション単位の参加管理に加えて、今後まとめる卓の調整機能へ進めます。</p>
          <div className="role-card-actions">
            <button className="primary" type="button" onClick={onOpenSession}>
              セッション管理
            </button>
            <button className="secondary" type="button" onClick={onOpenTableAdjustment}>
              卓の調整
            </button>
          </div>
        </article>

        <article className="role-card pl-accent">
          <p className="role-tag">PL向け</p>
          <h3>作成と学習をそのまま始める</h3>
          <p>キャラクター作成ウィザードと初心者向けガイドを並べて使える導線にしています。</p>
          <div className="role-card-actions">
            <button className="primary" type="button" onClick={onStartCreate}>
              キャラクター作成
            </button>
            <button className="secondary" type="button" onClick={onOpenGuide}>
              初心者ガイド
            </button>
          </div>
        </article>
      </div>

      <div className="menu-grid">
        <article className="menu-card">
          <h3>キャラクター保管庫</h3>
          <p>保存済みキャラクターの詳細確認、CSV/XLSX 出力、状態管理、バックストーリー更新をまとめて行えます。</p>
          <button className="primary" type="button" onClick={onOpenCharacterArchive}>
            保管庫を開く
          </button>
        </article>

        <article className="menu-card">
          <h3>各種データ早引き表</h3>
          <p>職業、狂気表、武器、用語集を横断して確認する GM / PL 共通の早引き入口です。</p>
          <button className="primary" type="button" onClick={onOpenQuickReference}>
            早引き一覧を見る
          </button>
        </article>
      </div>

      <div className="info-grid">
        <div className="info-panel">
          <h3>このアプリでできること</h3>
          <ul className="feature-list">
            <li>CoC7 キャラクターの作成と再編集</li>
            <li>キャラクター保管庫での閲覧、出力、追記</li>
            <li>保存済みキャラクターの HP / MP / SAN 管理</li>
            <li>今後の早引き表、セッション管理への拡張</li>
          </ul>
        </div>

        <div className="info-panel">
          <h3>キャラクターシートの扱い</h3>
          <ul className="feature-list">
            <li>データ保存は各自のブラウザのセッションです</li>
            <li>アップデート前や端末変更前は CSV/XLSX エクスポートでバックアップしておくのが安全です</li>
          </ul>
        </div>

        <div className="info-panel">
          <h3>最近保存したキャラクター</h3>
          {recentSheets.length === 0 ? (
            <p className="helper-text">まだ保存済みキャラクターはありません。</p>
          ) : (
            <ul className="recent-list">
              {recentSheets.map((sheet) => (
                <li key={sheet.id}>
                  <strong>{sheet.basicInfo.characterName || "名称未設定"}</strong>
                  <span>{getDisplayedProfessionName(sheet.basicInfo) || "職業未設定"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function GuidePanel({ onStartCreate }: { onStartCreate: () => void }) {
  const guideSections = [
    {
      title: "CoC では何をするのか",
      accent: "最初に読む",
      body: (
        <>
          <span className="guide-emphasis">怪しいことを調べて、手がかりをつないで、生きて帰る。</span>
          <span> CoC はだいたいそんなゲーム。</span>
        </>
      ),
      points: [
        <><span className="guide-term">探索者</span>は、最初から強い戦士ってわけじゃない。記者、医師、学生、技師みたいな<span className="guide-emphasis-soft">普通の人</span>から始まることが多い。</>,
        <><span className="guide-term">判定</span>は百分率。1D100 を振って、技能値や能力値以下なら成功。</>,
        <><span className="guide-emphasis-soft">正面から殴り合う</span>より、逃げる、隠れる、準備する方がうまくいく場面が多い。</>
      ]
    },
    {
      title: "キャラクター作成の順番",
      accent: "作成の流れ",
      body: (
        <>
          <span className="guide-emphasis">全部わかってから始めなくて大丈夫！</span>
          <span> 画面の順番どおりに埋めれば、そのまま形になる。</span>
        </>
      ),
      points: [
        <><span className="guide-term">1.</span> 名前、プレイヤー名、職業を決める。</>,
        <><span className="guide-term">2.</span> STR など 8 つの能力値をロールするか入力する。</>,
        <><span className="guide-term">3.</span> HP や SAN などの<span className="guide-emphasis-soft">派生値</span>を確認する。</>,
        <><span className="guide-term">4.</span> 技能へポイントを振って、役割と個性を作る。</>
      ]
    },
    {
      title: "職業ポイントと興味ポイントの違い",
      accent: "配分の考え方",
      body: (
        <>
          <span className="guide-emphasis">先に職業らしさ、あとでその人らしさ。</span>
          <span> この順で考えるとかなり楽。</span>
        </>
      ),
      points: [
        <><span className="guide-term">職業ポイント</span>は仕事の強み。医師なら医学、記者なら聞き込みや調査、みたいな感じで振る。</>,
        <><span className="guide-term">興味ポイント</span>は趣味や経験。職業にない技能を足して、個性を出すのに向いてる。</>,
        <><span className="guide-emphasis-soft">広く薄く</span>より、まず 2 から 4 個くらいの得意技能を作る方が動きやすい。</>
      ]
    },
    {
      title: "SAN と狂気の基本",
      accent: "CoCらしさ",
      body: (
        <>
          <span className="guide-emphasis">SAN は、どれだけ心がもつかの目安。</span>
          <span> 怖いものやおぞましいものに触れると減っていくし、CoC らしさはその先の</span>
          <span className="guide-emphasis-soft">狂気</span>
          <span>にもつながっていく。</span>
        </>
      ),
      points: [
        <><span className="guide-term">SAN 減少</span>はこのゲームではよく起こる。減ること自体が失敗ってわけじゃない。</>,
        <><span className="guide-term">狂気</span>は、強い恐怖や大きな SAN 減少を受けたときに起こる精神的な反応。短く乱れる<span className="guide-emphasis-soft">一時的狂気</span>と、長めに影響する<span className="guide-emphasis-soft">不定の狂気</span>がある。</>,
        <><span className="guide-term">何が起こる？</span>その場で逃げ出す、急に感情が爆発する、記憶が飛ぶみたいに<span className="guide-emphasis-soft">行動が制限されたり、意図しない行動</span>を取ったりすることがある。</>,
        <><span className="guide-emphasis-soft">減らさないこと</span>だけじゃなく、減ったあとにどう動くかまで考えると遊びやすい。</>
      ]
    }
  ];

  return (
    <section className="card placeholder-card guide-panel-shell">
      <h2 className="title">初心者向けガイド</h2>
      <p className="subtitle">最初に迷いやすいところだけ、さっと読める形でまとめたよ。全部読まなくても、必要なところだけ拾えば十分。</p>

      <div className="guide-hero">
        <div className="guide-hero-copy">
          <p className="guide-kicker">Quick Start</p>
          <h3>まずはこの 4 つだけ見れば大丈夫！</h3>
          <p>何をするゲームか、どう作るか、ポイントをどう振るか、SAN をどう見るか。とりあえずこの順で見れば入りやすい。</p>
          <p className="guide-hero-note">下の 4 つは、それぞれ 1 テーマずつに絞ってある。気になるところから読んで大丈夫。</p>
        </div>
      </div>

      <div className="guide-sections">
        {guideSections.map((section) => (
          <article key={section.title} className="info-panel guide-info-panel">
            <div className="guide-section-head">
              <span className="guide-chip">{section.accent}</span>
              <h3>{section.title}</h3>
            </div>
            <p className="guide-body-copy">{section.body}</p>
            <ul className="feature-list guide-feature-list">
              {section.points.map((point, index) => (
                <li key={`${section.title}-${index}`}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="guide-action-panel">
        <div>
          <p className="guide-kicker">Next Action</p>
          <h3>読めたら、そのまま作成へ進もう</h3>
          <p>あとで見返せるから、いま全部覚えなくて大丈夫。まず 1 人作ってみるのがいちばん早い。</p>
        </div>
        <button className="primary" type="button" onClick={onStartCreate}>
          キャラクター作成へ進む
        </button>
      </div>
    </section>
  );
}

function TableAdjustmentPanel() {
  return (
    <section className="card placeholder-card guide-panel-shell">
      <div className="guide-hero">
        <div className="guide-hero-copy">
          <p className="guide-kicker">Coming Soon</p>
          <h2 className="title">卓の調整</h2>
          <p className="subtitle">この画面は仮配置です。要件整理後に、卓運用で使う調整機能をここへまとめます。</p>
        </div>
      </div>

      <div className="info-panel guide-info-panel">
        <div className="guide-section-head">
          <span className="guide-chip">仮画面</span>
          <h3>これから整理する内容</h3>
        </div>
        <ul className="feature-list guide-feature-list">
          <li>卓運用で必要な調整項目の洗い出し</li>
          <li>GM 向け導線としての配置検討</li>
          <li>セッション管理や保管庫との役割分担</li>
        </ul>
      </div>
    </section>
  );
}