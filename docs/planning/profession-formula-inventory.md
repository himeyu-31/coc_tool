# 職業定義一覧とポイント式メモ

更新日: 2026-04-20

目的:
- 現在アプリに入っている職業定義を、追加や修正の前提資料として一覧化する
- 職業技能ポイント式と趣味ポイント式の現在値を確認しやすくする
- ルールブック確認後に、どの項目を直せばよいかを分かりやすくする

前提:
- 現在の職業定義の元データは [web/src/lib/data/professions.ts](web/src/lib/data/professions.ts)
- 職業技能ポイントの実計算は [web/src/lib/coc7-rules.ts](web/src/lib/coc7-rules.ts) の `calculateOccupationPoints()`
- 趣味ポイントの実計算は [web/src/lib/coc7-rules.ts](web/src/lib/coc7-rules.ts) の `calculateHobbyPoints()`
- 現時点の式は仮置きが含まれる前提で扱う

## 修正時に触る場所

式の表示文言を直す:
- `occupationalPointsFormula`
- `hobbyPointsFormula`

実際の職業ポイント計算を直す:
- `occupationalPointTerms`

趣味ポイント計算の全体ルールを直す:
- `calculateHobbyPoints()`

職業の追加を行う:
- `professionDefinitions` に新しいエントリを追加する

## 現在の共通ルール

趣味ポイント式:
- INT × 2

職業ポイント計算形式:
- `occupationalPointTerms` の `key × multiplier` を合算

## 一覧

### 私立探偵
- id: `private-eye`
- 時代: modern / classic
- 職業ポイント式: `EDU × 4`
- 計算項目: `edu × 4`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 9-30
- 職業技能: `fast-talk`, `listen`, `art-craft-photography`, `psychology`, `library-use`, `spot-hidden`
- 任意技能: `firearms-handgun`, `track`, `law`

### 医師
- id: `doctor`
- 時代: modern / classic
- 職業ポイント式: `EDU × 4`
- 計算項目: `edu × 4`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 30-80
- 職業技能: `medicine`, `first-aid`, `psychology`, `persuade`, `science-pharmacy`, `science-biology`
- 任意技能: `library-use`, `language-other-latin`, `psychoanalysis`

### 記者
- id: `journalist`
- 時代: modern / classic
- 職業ポイント式: `EDU × 4`
- 計算項目: `edu × 4`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 9-30
- 職業技能: `art-craft-writing`, `library-use`, `persuade`, `psychology`, `spot-hidden`, `language-own`
- 任意技能: `fast-talk`, `art-craft-photography`, `history`

### 警察官
- id: `police-officer`
- 時代: modern
- 職業ポイント式: `EDU × 2 + STR × 2 + DEX × 2`
- 計算項目: `edu × 2`, `str × 2`, `dex × 2`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 9-50
- 職業技能: `law`, `listen`, `firearms-handgun`, `psychology`, `spot-hidden`, `track`
- 任意技能: `drive-auto`, `fighting-brawl`, `intimidate`

### 大学教授
- id: `professor`
- 時代: modern / classic
- 職業ポイント式: `EDU × 4`
- 計算項目: `edu × 4`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 20-70
- 職業技能: `library-use`, `language-own`, `psychology`, `persuade`, `history`, `science-any`
- 任意技能: `anthropology`, `archaeology`, `occult`

### 古物研究家
- id: `antiquarian`
- 時代: modern / classic
- 職業ポイント式: `EDU × 4`
- 計算項目: `edu × 4`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 30-70
- 職業技能: `appraise`, `art-craft-any`, `history`, `library-use`, `language-other-any`, `spot-hidden`
- 任意技能: `archaeology`, `occult`, `charm`

### 看護師
- id: `nurse`
- 時代: modern
- 職業ポイント式: `EDU × 4 + DEX × 2`
- 計算項目: `edu × 4`, `dex × 2`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 9-40
- 職業技能: `first-aid`, `medicine`, `psychology`, `listen`, `persuade`, `science-biology`
- 任意技能: `charm`, `library-use`, `science-pharmacy`

### 技師
- id: `engineer`
- 時代: modern / classic
- 職業ポイント式: `EDU × 4 + DEX × 2`
- 計算項目: `edu × 4`, `dex × 2`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 10-60
- 職業技能: `mechanical-repair`, `electrical-repair`, `computer-use`, `science-chemistry`, `operate-heavy-machinery`, `library-use`
- 任意技能: `drive-auto`, `navigate`, `science-any`

### 弁護士
- id: `lawyer`
- 時代: modern / classic
- 職業ポイント式: `EDU × 4`
- 計算項目: `edu × 4`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 30-80
- 職業技能: `accounting`, `law`, `library-use`, `persuade`, `psychology`, `credit-rating`
- 任意技能: `charm`, `fast-talk`, `language-other-any`

### 芸術家
- id: `artist`
- 時代: modern / classic
- 職業ポイント式: `EDU × 2 + DEX × 2 + POW × 2`
- 計算項目: `edu × 2`, `dex × 2`, `pow × 2`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 9-50
- 職業技能: `art-craft-acting`, `art-craft-writing`, `charm`, `psychology`, `history`, `spot-hidden`
- 任意技能: `disguise`, `persuade`, `language-other-any`

### 兵士
- id: `soldier`
- 時代: modern / classic
- 職業ポイント式: `EDU × 2 + STR × 2 + DEX × 2`
- 計算項目: `edu × 2`, `str × 2`, `dex × 2`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 9-30
- 職業技能: `firearms-rifle-shotgun`, `first-aid`, `fighting-brawl`, `navigate`, `stealth`, `survival-any`
- 任意技能: `firearms-handgun`, `throw`, `intimidate`

### 学生
- id: `student`
- 時代: modern
- 職業ポイント式: `EDU × 4`
- 計算項目: `edu × 4`
- 趣味ポイント式: `INT × 2`
- 信用範囲: 0-20
- 職業技能: `library-use`, `listen`, `spot-hidden`, `persuade`, `psychology`, `language-own`
- 任意技能: `computer-use`, `history`, `science-any`

## 修正チェック用メモ

ルールブック確認後に見直したい観点:
- 各職業の職業ポイント式が正しいか
- APP を含める職業があるか、または除外すべきか
- 学生のような自由度の高い職業をどう扱うか
- 職業技能セット自体が現行アプリの用途に合っているか
- 信用範囲と向いている能力値の説明を合わせて更新するか

更新手順の目安:
1. `occupationalPointsFormula` をルールブック準拠の文言へ直す
2. 同じ内容になるよう `occupationalPointTerms` を直す
3. 必要なら `recommendedCharacteristics` と `beginnerNotes` も合わせて見直す
4. 職業技能や任意技能の採用方針も合わせて修正する
