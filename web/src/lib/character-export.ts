import { CharacterSheet } from "@/types/character";
import { CHARACTER_TRANSFER_FORMAT, CHARACTER_TRANSFER_ROW_LABEL, encodeCharacterSheetTransferData } from "@/lib/character-transfer";

export function exportCharacterSheetAsCsv(sheet: CharacterSheet): void {
  const rows = buildExportRows(sheet);
  const csv = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n");

  downloadBlob(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" }), `${buildFileName(sheet)}.csv`);
}

export function exportCharacterSheetAsXlsx(sheet: CharacterSheet): void {
  const rows = buildExportRows(sheet);
  const output = buildXlsxFile(rows);
  downloadBlob(
    new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${buildFileName(sheet)}.xlsx`
  );
}

function buildExportRows(sheet: CharacterSheet): string[][] {
  const characteristicRows = Object.entries(sheet.characteristics).map(([key, value]) => [key.toUpperCase(), `${value}`]);
  const derivedRows = Object.entries(sheet.derivedStats).map(([key, value]) => [key, `${value}`]);
  const aggregatedSkillRows = buildAggregatedSkillRows(sheet);

  return [
    ["項目", "値", "補足"],
    ["キャラクター名", sheet.basicInfo.characterName, ""],
    ["プレイヤー名", sheet.basicInfo.playerName, ""],
    ["年齢", sheet.basicInfo.age, ""],
    ["性別", sheet.basicInfo.gender, ""],
    ["職業ID", sheet.basicInfo.professionId, ""],
    ["時代設定", sheet.basicInfo.era, ""],
    [],
    ["能力値", "", ""],
    ...characteristicRows,
    [],
    ["派生値", "", ""],
    ...derivedRows,
    [],
    ["現在ステータス", "", ""],
    ["現在HP", `${sheet.condition.currentHp}`, ""],
    ["現在MP", `${sheet.condition.currentMp}`, ""],
    ["現在SAN", `${sheet.condition.currentSan}`, ""],
    [],
    ["技能", "値", "種別"],
    ...aggregatedSkillRows,
    [],
    [CHARACTER_TRANSFER_ROW_LABEL, encodeCharacterSheetTransferData(sheet), CHARACTER_TRANSFER_FORMAT]
  ];
}

function buildAggregatedSkillRows(sheet: CharacterSheet): string[][] {
  const aggregated = new Map<string, { name: string; base: number; assigned: number; sources: string[] }>();

  for (const skill of sheet.occupationSkills) {
    const current = aggregated.get(skill.id) ?? { name: skill.name, base: skill.base, assigned: 0, sources: [] };
    current.assigned += skill.assigned;
    current.sources = Array.from(new Set([...current.sources, "職業技能"]));
    aggregated.set(skill.id, current);
  }

  for (const skill of sheet.optionalSkills) {
    const current = aggregated.get(skill.id) ?? { name: skill.name, base: skill.base, assigned: 0, sources: [] };
    current.assigned += skill.assigned;
    current.sources = Array.from(new Set([...current.sources, "趣味技能"]));
    aggregated.set(skill.id, current);
  }

  return Array.from(aggregated.values())
    .sort((left, right) => left.name.localeCompare(right.name, "ja"))
    .map((skill) => [skill.name, `${skill.base + skill.assigned}`, skill.sources.join("+")]);
}

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

function buildFileName(sheet: CharacterSheet): string {
  return (sheet.basicInfo.characterName || "coc7-character").replace(/[\\/:*?"<>|]/g, "_");
}

function buildXlsxFile(rows: string[][]): Uint8Array {
  const worksheetXml = buildWorksheetXml(rows);
  const files = [
    {
      path: "[Content_Types].xml",
      content: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`)
    },
    {
      path: "_rels/.rels",
      content: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`)
    },
    {
      path: "docProps/app.xml",
      content: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>GitHub Copilot</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>CharacterSheet</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
</Properties>`)
    },
    {
      path: "docProps/core.xml",
      content: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>GitHub Copilot</dc:creator>
  <cp:lastModifiedBy>GitHub Copilot</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`)
    },
    {
      path: "xl/workbook.xml",
      content: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="CharacterSheet" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`)
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)
    },
    {
      path: "xl/styles.xml",
      content: xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`)
    },
    {
      path: "xl/worksheets/sheet1.xml",
      content: worksheetXml
    }
  ];

  return createZip(files);
}

function buildWorksheetXml(rows: string[][]): Uint8Array {
  const rowXml = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, cellIndex) => buildCellXml(cell, rowIndex + 1, cellIndex))
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`);
}

function buildCellXml(value: string, rowNumber: number, columnIndex: number): string {
  const cellRef = `${columnName(columnIndex)}${rowNumber}`;
  return `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function columnName(index: number): string {
  let current = index + 1;
  let result = "";

  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }

  return result;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xml(content: string): Uint8Array {
  return new TextEncoder().encode(content);
}

function createZip(files: Array<{ path: string; content: Uint8Array }>): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = new TextEncoder().encode(file.path);
    const crc = crc32(file.content);
    const localHeader = concatArrays([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(file.content.length),
      uint32(file.content.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes,
      file.content
    ]);

    localParts.push(localHeader);

    const centralHeader = concatArrays([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(file.content.length),
      uint32(file.content.length),
      uint16(nameBytes.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBytes
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length;
  });

  const centralDirectory = concatArrays(centralParts);
  const localDirectory = concatArrays(localParts);
  const endRecord = concatArrays([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(localDirectory.length),
    uint16(0)
  ]);

  return concatArrays([localDirectory, centralDirectory, endRecord]);
}

function concatArrays(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });

  return result;
}

function uint16(value: number): Uint8Array {
  const buffer = new Uint8Array(2);
  const view = new DataView(buffer.buffer);
  view.setUint16(0, value, true);
  return buffer;
}

function uint32(value: number): Uint8Array {
  const buffer = new Uint8Array(4);
  const view = new DataView(buffer.buffer);
  view.setUint32(0, value >>> 0, true);
  return buffer;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (let index = 0; index < data.length; index += 1) {
    crc ^= data[index];

    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}