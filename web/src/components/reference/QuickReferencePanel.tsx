"use client";

import { useMemo, useState } from "react";
import { allProfessionList, allSkillList, glossaryList, insanityTableList, weaponList } from "@/lib/coc7-data";

type ReferenceTab = "profession" | "skill" | "weapon" | "insanity" | "glossary";

const tabLabels: Record<ReferenceTab, string> = {
  profession: "職業",
  skill: "技能",
  weapon: "武器",
  insanity: "狂気表",
  glossary: "用語集"
};

const skillCategoryLabels: Record<string, string> = {
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

const weaponCategoryLabels: Record<string, string> = {
  handgun: "拳銃",
  rifle: "ライフル",
  shotgun: "ショットガン",
  melee: "近接",
  thrown: "投擲",
  other: "その他"
};

const skillNameById = new Map(allSkillList.map((skill) => [skill.id, skill.name]));
const insanityCategoryLabels: Record<string, string> = {
  fear: "恐怖系",
  obsession: "執着系",
  social: "対人系",
  memory: "記憶系",
  compulsion: "強迫系",
  delusion: "妄想・幻覚系",
  aggression: "攻撃・防衛系",
  collapse: "虚脱・硬直系",
  escape: "逃走系",
  emotion: "感情暴走系"
};
const glossaryTermById = new Map(glossaryList.map((entry) => [entry.id, entry.term]));
const glossaryEntryIdSet = new Set(glossaryList.map((entry) => entry.id));

export function QuickReferencePanel() {
  const [activeTab, setActiveTab] = useState<ReferenceTab>("profession");
  const [query, setQuery] = useState("");
  const [skillCategory, setSkillCategory] = useState("all");
  const [weaponCategory, setWeaponCategory] = useState("all");
  const [insanityTableId, setInsanityTableId] = useState<"all" | "temporary" | "indefinite">("all");
  const [insanityCategory, setInsanityCategory] = useState("all");
  const [selectedProfessionId, setSelectedProfessionId] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedWeaponId, setSelectedWeaponId] = useState("");
  const [selectedGlossaryId, setSelectedGlossaryId] = useState("");
  const [selectedInsanityKey, setSelectedInsanityKey] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProfessions = useMemo(
    () =>
      allProfessionList.filter((profession) => {
        if (!normalizedQuery) {
          return true;
        }

        const haystack = [
          profession.name,
          profession.description,
          ...profession.recommendedFor,
          ...profession.beginnerNotes,
          ...profession.occupationSkills.map((skill) => skill.name),
          ...profession.optionalSkills.map((skill) => skill.name)
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      }),
    [normalizedQuery]
  );

  const filteredSkills = useMemo(
    () =>
      allSkillList.filter((skill) => {
        if (skillCategory !== "all" && skill.category !== skillCategory) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return `${skill.name} ${skill.description}`.toLowerCase().includes(normalizedQuery);
      }),
    [normalizedQuery, skillCategory]
  );

  const filteredWeapons = useMemo(
    () =>
      weaponList.filter((weapon) => {
        if (weaponCategory !== "all" && weapon.category !== weaponCategory) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return `${weapon.name} ${weapon.damage} ${weapon.range} ${weapon.notes.join(" ")}`.toLowerCase().includes(normalizedQuery);
      }),
    [normalizedQuery, weaponCategory]
  );

  const filteredInsanityTables = useMemo(
    () =>
      insanityTableList.filter((table) => (insanityTableId === "all" ? true : table.id === insanityTableId)).map((table) => ({
        ...table,
        entries: table.entries.filter((entry) => {
          if (insanityCategory !== "all" && entry.category !== insanityCategory) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return `${entry.title} ${entry.summary} ${entry.effect} ${entry.keeperHint} ${insanityCategoryLabels[entry.category] ?? entry.category}`
            .toLowerCase()
            .includes(normalizedQuery);
        })
      })),
    [insanityCategory, insanityTableId, normalizedQuery]
  );

  const filteredGlossary = useMemo(
    () =>
      glossaryList.filter((entry) => {
        const relatedTerms = entry.relatedTerms.map((termId) => glossaryTermById.get(termId) ?? termId).join(" ");

        if (!normalizedQuery) {
          return true;
        }

        return `${entry.term} ${entry.shortDescription} ${entry.detail} ${relatedTerms}`.toLowerCase().includes(normalizedQuery);
      }),
    [normalizedQuery]
  );

  const flattenedInsanityEntries = useMemo(
    () =>
      filteredInsanityTables.flatMap((table) =>
        table.entries.map((entry) => ({
          key: `${table.id}:${entry.id}`,
          tableName: table.name,
          usage: table.usage,
          entry
        }))
      ),
    [filteredInsanityTables]
  );

  const selectedProfession = filteredProfessions.find((item) => item.id === selectedProfessionId) ?? filteredProfessions[0] ?? null;
  const selectedSkill = filteredSkills.find((item) => item.id === selectedSkillId) ?? filteredSkills[0] ?? null;
  const selectedWeapon = filteredWeapons.find((item) => item.id === selectedWeaponId) ?? filteredWeapons[0] ?? null;
  const selectedGlossary = filteredGlossary.find((item) => item.id === selectedGlossaryId) ?? filteredGlossary[0] ?? null;
  const selectedInsanity = flattenedInsanityEntries.find((item) => item.key === selectedInsanityKey) ?? flattenedInsanityEntries[0] ?? null;

  return (
    <section className="card reference-layout">
      <div>
        <h2 className="title">各種データ早引き表</h2>
        <p className="subtitle">検索や比較がしやすいよう、一覧は密度高め、詳細は右側へ固定して確認する構成にしています。</p>
      </div>

      <div className="reference-tabs" role="tablist" aria-label="早引きカテゴリ">
        {(Object.keys(tabLabels) as ReferenceTab[]).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "primary reference-tab active-reference-tab" : "secondary reference-tab"}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="reference-filters">
        <label>
          キーワード検索
          <input
            type="search"
            placeholder="名称、説明、関連語で検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {activeTab === "skill" ? (
          <label>
            技能カテゴリ
            <select value={skillCategory} onChange={(event) => setSkillCategory(event.target.value)}>
              <option value="all">すべて</option>
              <option value="combat">戦闘</option>
              <option value="knowledge">知識</option>
              <option value="medical">医療</option>
              <option value="perception">知覚</option>
              <option value="stealth">隠密</option>
              <option value="technical">技術</option>
              <option value="social">対人</option>
              <option value="survival">生存</option>
              <option value="other">その他</option>
            </select>
          </label>
        ) : null}

        {activeTab === "weapon" ? (
          <label>
            武器カテゴリ
            <select value={weaponCategory} onChange={(event) => setWeaponCategory(event.target.value)}>
              <option value="all">すべて</option>
              <option value="handgun">拳銃</option>
              <option value="rifle">ライフル</option>
              <option value="shotgun">ショットガン</option>
              <option value="melee">近接</option>
              <option value="thrown">投擲</option>
              <option value="other">その他</option>
            </select>
          </label>
        ) : null}

        {activeTab === "insanity" ? (
          <label>
            狂気表
            <select value={insanityTableId} onChange={(event) => setInsanityTableId(event.target.value as "all" | "temporary" | "indefinite")}>
              <option value="all">すべて</option>
              <option value="temporary">一時的狂気</option>
              <option value="indefinite">不定の狂気</option>
            </select>
          </label>
        ) : null}

        {activeTab === "insanity" ? (
          <label>
            狂気の分類
            <select value={insanityCategory} onChange={(event) => setInsanityCategory(event.target.value)}>
              <option value="all">すべて</option>
              <option value="fear">恐怖系</option>
              <option value="obsession">執着系</option>
              <option value="social">対人系</option>
              <option value="memory">記憶系</option>
              <option value="compulsion">強迫系</option>
              <option value="delusion">妄想・幻覚系</option>
              <option value="aggression">攻撃・防衛系</option>
              <option value="collapse">虚脱・硬直系</option>
              <option value="escape">逃走系</option>
              <option value="emotion">感情暴走系</option>
            </select>
          </label>
        ) : null}
      </div>

      {activeTab === "profession" ? (
        <div className="reference-master-detail">
          <div className="reference-master-pane">
            <div className="reference-summary">{filteredProfessions.length}件の職業</div>
            <div className="reference-row-list">
              {filteredProfessions.map((profession) => (
                <button
                  key={profession.id}
                  type="button"
                  className={selectedProfession?.id === profession.id ? "reference-row active-row" : "reference-row"}
                  onClick={() => setSelectedProfessionId(profession.id)}
                >
                  <div className="reference-row-main">
                    <strong>{profession.name}</strong>
                    <span>{profession.description}</span>
                  </div>
                  <div className="reference-row-meta">
                    <span>信用 {profession.creditRating.min}-{profession.creditRating.max}</span>
                    <span>{profession.eraTags.join(" / ")}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="reference-detail-pane">
            {selectedProfession ? (
              <article className="reference-detail-card">
                <div className="reference-card-header">
                  <h3>{selectedProfession.name}</h3>
                  <span className="pill">信用 {selectedProfession.creditRating.min}-{selectedProfession.creditRating.max}</span>
                </div>
                <p>{selectedProfession.description}</p>
                <div className="reference-pill-row">
                  <span className="pill">職業Pt {selectedProfession.occupationalPointsFormula}</span>
                  <span className="pill">時代 {selectedProfession.eraTags.join(" / ")}</span>
                </div>
                <div className="reference-section">
                  <strong>向いている用途</strong>
                  <div className="reference-tag-list">
                    {selectedProfession.recommendedFor.map((item) => (
                      <span key={item} className="reference-tag">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="reference-two-column">
                  <div className="reference-section">
                    <strong>職業技能</strong>
                    <div className="reference-tag-list">
                      {selectedProfession.occupationSkills.map((skill) => (
                        <span key={`${selectedProfession.id}-${skill.id}`} className="reference-tag">{skill.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="reference-section">
                    <strong>任意技能</strong>
                    <div className="reference-tag-list">
                      {selectedProfession.optionalSkills.map((skill) => (
                        <span key={`${selectedProfession.id}-optional-${skill.id}`} className="reference-tag muted-tag">{skill.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="reference-section">
                  <strong>初心者向けメモ</strong>
                  <ul className="reference-list">
                    {selectedProfession.beginnerNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ) : (
              <EmptyReferenceState />
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "skill" ? (
        <div className="reference-master-detail">
          <div className="reference-master-pane">
            <div className="reference-summary">{filteredSkills.length}件の技能</div>
            <div className="reference-row-list">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  className={selectedSkill?.id === skill.id ? "reference-row active-row" : "reference-row"}
                  onClick={() => setSelectedSkillId(skill.id)}
                >
                  <div className="reference-row-main">
                    <strong>{skill.name}</strong>
                    <span>{skill.description}</span>
                  </div>
                  <div className="reference-row-meta">
                    <span>{skillCategoryLabels[skill.category] ?? skill.category}</span>
                    <span>初期 {skill.base}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="reference-detail-pane">
            {selectedSkill ? (
              <article className="reference-detail-card">
                <div className="reference-card-header">
                  <h3>{selectedSkill.name}</h3>
                  <span className="pill">カテゴリ {skillCategoryLabels[selectedSkill.category] ?? selectedSkill.category}</span>
                </div>
                <p>{selectedSkill.description}</p>
                <div className="detail-list">
                  <div className="skill-row"><span>初期値</span><strong>{selectedSkill.base}</strong></div>
                  <div className="skill-row"><span>最大値</span><strong>{selectedSkill.max}</strong></div>
                </div>
              </article>
            ) : (
              <EmptyReferenceState />
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "weapon" ? (
        <div className="reference-master-detail">
          <div className="reference-master-pane">
            <div className="reference-summary">{filteredWeapons.length}件の武器</div>
            <div className="reference-row-list">
              {filteredWeapons.map((weapon) => (
                <button
                  key={weapon.id}
                  type="button"
                  className={selectedWeapon?.id === weapon.id ? "reference-row active-row" : "reference-row"}
                  onClick={() => setSelectedWeaponId(weapon.id)}
                >
                  <div className="reference-row-main">
                    <strong>{weapon.name}</strong>
                    <span>{weapon.damage} / {weapon.range}</span>
                  </div>
                  <div className="reference-row-meta">
                    <span>{weaponCategoryLabels[weapon.category] ?? weapon.category}</span>
                    <span>{skillNameById.get(weapon.skillId) ?? weapon.skillId}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="reference-detail-pane">
            {selectedWeapon ? (
              <article className="reference-detail-card">
                <div className="reference-card-header">
                  <h3>{selectedWeapon.name}</h3>
                  <span className="pill">{weaponCategoryLabels[selectedWeapon.category] ?? selectedWeapon.category}</span>
                </div>
                <div className="detail-list">
                  <div className="skill-row"><span>参照技能</span><strong>{skillNameById.get(selectedWeapon.skillId) ?? selectedWeapon.skillId}</strong></div>
                  <div className="skill-row"><span>ダメージ</span><strong>{selectedWeapon.damage}</strong></div>
                  <div className="skill-row"><span>射程</span><strong>{selectedWeapon.range}</strong></div>
                  <div className="skill-row"><span>攻撃回数</span><strong>{selectedWeapon.attacks}</strong></div>
                  <div className="skill-row"><span>装弾数</span><strong>{selectedWeapon.ammo}</strong></div>
                  <div className="skill-row"><span>故障</span><strong>{selectedWeapon.malfunction}</strong></div>
                </div>
                <div className="reference-section">
                  <strong>メモ</strong>
                  <ul className="reference-list">
                    {selectedWeapon.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ) : (
              <EmptyReferenceState />
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "insanity" ? (
        <div className="reference-master-detail">
          <div className="reference-master-pane">
            <div className="reference-summary">{flattenedInsanityEntries.length}件の狂気結果</div>
            <div className="reference-row-list">
              {flattenedInsanityEntries.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={selectedInsanity?.key === item.key ? "reference-row active-row" : "reference-row"}
                  onClick={() => setSelectedInsanityKey(item.key)}
                >
                  <div className="reference-row-main">
                    <strong>{item.entry.roll}. {item.entry.title}</strong>
                    <span>{item.entry.summary}</span>
                  </div>
                  <div className="reference-row-meta">
                    <span>{item.tableName}</span>
                    <span>{insanityCategoryLabels[item.entry.category] ?? item.entry.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="reference-detail-pane">
            {selectedInsanity ? (
              <article className="reference-detail-card">
                <div className="reference-card-header">
                  <h3>{selectedInsanity.entry.roll}. {selectedInsanity.entry.title}</h3>
                  <span className="pill">{selectedInsanity.tableName}</span>
                </div>
                <div className="reference-pill-row">
                  <span className="pill">分類 {insanityCategoryLabels[selectedInsanity.entry.category] ?? selectedInsanity.entry.category}</span>
                </div>
                <p>{selectedInsanity.entry.summary}</p>
                <div className="reference-section">
                  <strong>効果</strong>
                  <p>{selectedInsanity.entry.effect}</p>
                </div>
                <div className="reference-section">
                  <strong>KPメモ</strong>
                  <p>{selectedInsanity.entry.keeperHint}</p>
                </div>
                <div className="reference-section">
                  <strong>用途</strong>
                  <p>{selectedInsanity.usage}</p>
                </div>
              </article>
            ) : (
              <EmptyReferenceState />
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "glossary" ? (
        <div className="reference-master-detail">
          <div className="reference-master-pane">
            <div className="reference-summary">{filteredGlossary.length}件の用語</div>
            <div className="reference-row-list">
              {filteredGlossary.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={selectedGlossary?.id === entry.id ? "reference-row active-row" : "reference-row"}
                  onClick={() => setSelectedGlossaryId(entry.id)}
                >
                  <div className="reference-row-main">
                    <strong>{entry.term}</strong>
                    <span>{entry.shortDescription}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="reference-detail-pane">
            {selectedGlossary ? (
              <article className="reference-detail-card">
                <div className="reference-card-header">
                  <h3>{selectedGlossary.term}</h3>
                </div>
                <p>{selectedGlossary.shortDescription}</p>
                <div className="reference-section">
                  <strong>詳細</strong>
                  <p>{selectedGlossary.detail}</p>
                </div>
                <div className="reference-section">
                  <strong>関連用語</strong>
                  <div className="reference-tag-list">
                    {selectedGlossary.relatedTerms.map((termId) => {
                      const relatedTerm = glossaryTermById.get(termId) ?? termId;
                      const canJump = glossaryEntryIdSet.has(termId);

                      return canJump ? (
                        <button
                          key={`${selectedGlossary.id}-${termId}`}
                          type="button"
                          className="reference-tag-button reference-tag muted-tag"
                          onClick={() => setSelectedGlossaryId(termId)}
                        >
                          {relatedTerm}
                        </button>
                      ) : (
                        <span key={`${selectedGlossary.id}-${termId}`} className="reference-tag muted-tag">{relatedTerm}</span>
                      );
                    })}
                  </div>
                </div>
              </article>
            ) : (
              <EmptyReferenceState />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function EmptyReferenceState() {
  return (
    <div className="reference-empty-state">
      <p>該当データがありません。</p>
      <p className="helper-text">キーワードや絞り込み条件を変更してください。</p>
    </div>
  );
}