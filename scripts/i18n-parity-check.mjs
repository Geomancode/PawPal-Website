import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import ts from "typescript";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");
const messagesDirectory = join(repositoryRoot, "src", "i18n", "messages");
const localeNames = ["de", "fr", "nl", "zh"];

// These values are language-independent names or standardized identifiers. A
// whitelist entry is valid only while the English source has the exact value
// recorded here, so a future copy-paste cannot silently broaden the exception.
const sameAsEnglishWhitelist = new Map([
  [
    "homeReadinessNfcValue",
    {
      value: "NFC",
      locales: ["de", "fr", "nl", "zh"],
      reason: "NFC is the standardized name of the technical protocol.",
    },
  ],
  [
    "homeReadinessH3Value",
    {
      value: "H3",
      locales: ["de", "fr", "nl", "zh"],
      reason: "H3 is the proper name of the geospatial indexing system.",
    },
  ],
  [
    "homeReadinessAiValue",
    {
      value: "AI",
      locales: ["nl", "zh"],
      reason: "AI is the established product acronym in Dutch and Chinese.",
    },
  ],
  [
    "homeReadinessEuValue",
    {
      value: "EU",
      locales: ["de", "nl"],
      reason: "EU is the official regional acronym in German and Dutch.",
    },
  ],
  [
    "homeShowcaseNfcTitle",
    {
      value: "NFC",
      locales: ["de", "fr", "nl", "zh"],
      reason: "NFC is the standardized name of the technical protocol.",
    },
  ],
  [
    "homeShowcaseAiTitle",
    {
      value: "AI",
      locales: ["nl", "zh"],
      reason: "AI is the established product acronym in Dutch and Chinese.",
    },
  ],
]);

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(node, sourceFile) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  throw new Error(
    `${sourceFile.fileName}: unsupported computed catalog key ${node.getText(sourceFile)}`,
  );
}

function loadCatalog(localeName) {
  const filePath = join(messagesDirectory, `${localeName}.ts`);
  const source = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  if (sourceFile.parseDiagnostics.length > 0) {
    const details = sourceFile.parseDiagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("\n");
    throw new Error(`${filePath}: TypeScript parse error\n${details}`);
  }

  const variableName = `${localeName}Messages`;
  let initializer;
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName) {
        initializer = declaration.initializer;
      }
    }
  }

  if (!initializer) {
    throw new Error(`${filePath}: export ${variableName} was not found`);
  }

  const objectLiteral = unwrapExpression(initializer);
  if (!ts.isObjectLiteralExpression(objectLiteral)) {
    throw new Error(`${filePath}: ${variableName} must be an object literal`);
  }

  const catalog = new Map();
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(
        `${filePath}: catalog entries must be explicit key/value properties; found ${property.getText(sourceFile)}`,
      );
    }

    const key = propertyName(property.name, sourceFile);
    const valueNode = unwrapExpression(property.initializer);
    if (!ts.isStringLiteral(valueNode) && !ts.isNoSubstitutionTemplateLiteral(valueNode)) {
      throw new Error(`${filePath}: ${key} must be a static string literal`);
    }
    if (catalog.has(key)) {
      throw new Error(`${filePath}: duplicate catalog key ${key}`);
    }
    catalog.set(key, valueNode.text);
  }

  return catalog;
}

function interpolationVariables(value) {
  const variables = new Set();
  for (const match of value.matchAll(/\{([A-Za-z_][A-Za-z0-9_.-]*)\}/g)) {
    variables.add(match[1]);
  }
  return [...variables].sort();
}

function difference(left, right) {
  return [...left].filter((key) => !right.has(key)).sort();
}

function formatList(items) {
  return items.length > 0 ? items.map((item) => `    - ${item}`).join("\n") : "    (none)";
}

let englishCatalog;
const localeCatalogs = new Map();
try {
  englishCatalog = loadCatalog("en");
  for (const localeName of localeNames) {
    localeCatalogs.set(localeName, loadCatalog(localeName));
  }
} catch (error) {
  console.error(`i18n parity check could not read the catalogs:\n${error.message}`);
  process.exitCode = 1;
}

if (englishCatalog) {
  const failures = [];
  const whitelistUses = [];

  for (const [key, entry] of sameAsEnglishWhitelist) {
    if (englishCatalog.get(key) !== entry.value) {
      failures.push(
        `[config] whitelist entry ${key} expects English value ${JSON.stringify(entry.value)}, ` +
          `found ${JSON.stringify(englishCatalog.get(key))}`,
      );
    }
    for (const localeName of entry.locales) {
      if (!localeNames.includes(localeName)) {
        failures.push(`[config] whitelist entry ${key} has unknown locale ${localeName}`);
      }
    }
  }

  for (const [localeName, catalog] of localeCatalogs) {
    const missingKeys = difference(englishCatalog.keys(), catalog);
    const extraKeys = difference(catalog.keys(), englishCatalog);
    const localeFailures = [];

    if (missingKeys.length > 0) {
      localeFailures.push(`  missing keys:\n${formatList(missingKeys)}`);
    }
    if (extraKeys.length > 0) {
      localeFailures.push(`  extra keys:\n${formatList(extraKeys)}`);
    }

    for (const [key, englishValue] of englishCatalog) {
      if (!catalog.has(key)) continue;
      const localizedValue = catalog.get(key);

      if (localizedValue.trim().length === 0) {
        localeFailures.push(`  ${key}: value is empty`);
      }

      if (localizedValue === englishValue) {
        const exception = sameAsEnglishWhitelist.get(key);
        if (
          exception &&
          exception.value === englishValue &&
          exception.locales.includes(localeName)
        ) {
          whitelistUses.push(`${localeName}.${key}: ${exception.reason}`);
        } else {
          localeFailures.push(
            `  ${key}: value is unchanged from English (${JSON.stringify(englishValue)})`,
          );
        }
      }

      const englishVariables = interpolationVariables(englishValue);
      const localizedVariables = interpolationVariables(localizedValue);
      if (englishVariables.join("\0") !== localizedVariables.join("\0")) {
        localeFailures.push(
          `  ${key}: interpolation variables differ\n` +
            `    en: [${englishVariables.join(", ")}]\n` +
            `    ${localeName}: [${localizedVariables.join(", ")}]`,
        );
      }
    }

    if (localeFailures.length > 0) {
      failures.push(`[${localeName}]\n${localeFailures.join("\n")}`);
    }
  }

  if (failures.length > 0) {
    console.error(`i18n parity check failed:\n\n${failures.join("\n\n")}`);
    process.exitCode = 1;
  } else {
    console.log(`i18n parity check passed: en has ${englishCatalog.size} keys.`);
    for (const [localeName, catalog] of localeCatalogs) {
      console.log(`  ${localeName}: ${catalog.size} keys, complete and structurally valid`);
    }
    console.log(`  approved same-as-English values: ${whitelistUses.length}`);
    for (const use of whitelistUses) console.log(`    - ${use}`);
  }
}
