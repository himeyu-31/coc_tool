# CoC7データモデル設計

## 目的
- UI実装より先に、参照データと保存データの構造を固定する
- 作成、早引き、管理の各画面が同じデータを再利用できるようにする
- 将来のJSON更新やクラウド保存に備えて責務を分ける

## モデル分類

### 1. 参照データ
アプリ全体で共有し、ユーザー操作では基本的に変化しない。

- 職業データ
- 武器データ
- 狂気表データ
- 用語解説データ

保存場所:
- web/src/lib/data/professions.json
- web/src/lib/data/weapons.json
- web/src/lib/data/insanity-tables.json
- web/src/lib/data/glossary.json

### 2. 作成中データ
ウィザード中だけ保持し、保存前に編集される。

- 基本情報
- 能力値
- 派生値
- 配分済み技能
- 装備候補

### 3. 保存データ
作成後のキャラクター管理に使う。

- キャラシ本体
- 現在HP、MP、SAN
- 傷病状態
- 発狂履歴
- セッションメモ
- 所持武器

## TypeScript型
型定義は [web/src/types/character.ts](web/src/types/character.ts) に集約する。

主要型:
- CharacteristicKey
- DerivedStatKey
- Skill
- Profession
- Weapon
- InsanityTable
- GlossaryEntry
- CharacterSheet

## 職業データ構造

```ts
type Profession = {
  id: string;
  name: string;
  description: string;
  eraTags: string[];
  occupationalPoints: number;
  occupationalPointsFormula: string;
  hobbyPoints: number;
  creditRating: { min: number; max: number };
  recommendedCharacteristics: CharacteristicKey[];
  recommendedFor: string[];
  beginnerNotes: string[];
  occupationSkills: Skill[];
  optionalSkills: Skill[];
};
```

意図:
- 作成画面では技能一覧とポイント式を使う
- 職業詳細早引きでは信用範囲、初心者向け補足、向いている探索者像を使う

## 武器データ構造

```ts
type Weapon = {
  id: string;
  name: string;
  category: "handgun" | "rifle" | "shotgun" | "melee" | "thrown" | "other";
  skillId: string;
  damage: string;
  range: string;
  attacks: string;
  ammo: string;
  malfunction: string;
  notes: string[];
};
```

意図:
- 武器早引きと所持武器表示の両方で使う
- スキルIDで技能と接続する

## 狂気表データ構造

```ts
type InsanityTable = {
  id: "temporary" | "indefinite";
  name: string;
  usage: string;
  entries: Array<{
    id: string;
    roll: string;
    title: string;
    summary: string;
    effect: string;
    keeperHint: string;
  }>;
};
```

意図:
- リアルタイム表示では roll と title を優先表示
- サマリー表示では summary と keeperHint を使う
- 保存時は tableId と entryId を履歴へ残す

## 用語解説データ構造

```ts
type GlossaryEntry = {
  id: string;
  term: string;
  shortDescription: string;
  detail: string;
  relatedTerms: string[];
};
```

意図:
- 初心者ガイドと画面内ツールチップで使い回す
- relatedTerms で関連記事へ遷移できるようにする

## 保存用キャラクターデータ構造

```ts
type CharacterSheet = {
  id: string;
  basicInfo: BasicInfo;
  characteristics: Characteristics;
  derivedStats: DerivedStats;
  occupationSkills: AssignedSkill[];
  optionalSkills: AssignedSkill[];
  weapons: Weapon[];
  notes: string;
  condition: {
    currentHp: number;
    currentMp: number;
    currentSan: number;
    wounds: string[];
    insanityHistory: Array<{
      tableId: "temporary" | "indefinite";
      entryId: string;
      notedAt: string;
    }>;
  };
  updatedAt: string;
};
```

意図:
- 作成直後の静的なキャラシと、セッション中に変化する値を分離する
- condition に現在値を寄せることで、履歴管理と表示更新がしやすい

## ルール計算
計算ロジックは [web/src/lib/coc7-rules.ts](web/src/lib/coc7-rules.ts) に置く。

初期対応:
- HP
- MP
- SAN
- MOV
- Build
- Damage Bonus

方針:
- JSONに計算式を持たせすぎない
- 実計算は TypeScript 側で持つ
- 表示用に計算根拠文字列を別途返せるよう将来拡張する

## データアクセス
参照データの取得は [web/src/lib/coc7-data.ts](web/src/lib/coc7-data.ts) に集約する。

利点:
- UIが JSON ファイルの位置を直接知らなくてよい
- 将来、APIやDBに切り替えても呼び出し元を保ちやすい

## 今後の拡張
- 技能マスタの独立ファイル化
- 職業データからスキル重複を排除し、skillId参照へ寄せる
- 呪文、アーティファクト、所持品テンプレートの追加
- ローカル保存からクラウド保存への切り替え

## 結論
- CoC7の参照データは JSON 駆動で十分運用できる
- 計算ロジックは TypeScript に集約した方が保守しやすい
- 作成、早引き、管理を同じモデルでつなぐことで、このアプリの差別化要件を実装しやすくなる