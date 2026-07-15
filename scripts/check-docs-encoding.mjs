import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const DOC_ROOT = "documentation";
const RAW_MARKERS = [
  { label: "replacement character", pattern: /\uFFFD/ },
  { label: "literal PowerShell CRLF marker", pattern: /`r`n/ },
  {
    label: "UTF-8 mojibake pair",
    pattern: /[\u00C2-\u00C6\u00E1\u00EF][\u0080-\u00BF]/,
  },
  {
    label: "common Vietnamese mojibake fragment",
    pattern: new RegExp(
      [
        "c\u00e1\u00ba",
        "\u00e1\u00ba",
        "\u00e1\u00bb",
        "\u00c4\u0091",
        "\u00c6\u00b0",
        "\u00c3[^\\s]?",
      ].join("|"),
    ),
  },
];
const TEXT_MARKERS = [
  {
    label: "suspicious question mark sequence",
    pattern: /[?]{2,}|[A-Za-z?-?]\?[A-Za-z?-?]/,
  },
];

const markdownFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      markdownFiles.push(filePath);
    }
  }
}

function stripInlineCode(content) {
  return content.replace(/`[^`]*`/g, "");
}

walk(DOC_ROOT);

const failures = [];

for (const filePath of markdownFiles) {
  const content = readFileSync(filePath, "utf8");
  const textContent = stripInlineCode(content);
  for (const marker of RAW_MARKERS) {
    if (marker.pattern.test(content)) {
      failures.push(filePath + " (" + marker.label + ")");
      break;
    }
  }
  if (failures[failures.length - 1]?.startsWith(filePath + " ")) continue;
  for (const marker of TEXT_MARKERS) {
    if (marker.pattern.test(textContent)) {
      failures.push(filePath + " (" + marker.label + ")");
      break;
    }
  }
}

if (failures.length > 0) {
  console.error("Documentation encoding check failed:");
  for (const failure of failures) {
    console.error("- " + failure);
  }
  process.exit(1);
}

console.log(
  "Documentation encoding check passed (" +
    markdownFiles.length +
    " markdown files).",
);
