import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

export type ProcedureAccess = "public" | "protected" | "admin";
export type ProcedureKind = "query" | "mutation";

export type ProcedureInventoryItem = {
  path: string;
  kind: ProcedureKind;
  access: ProcedureAccess;
  source: string;
  line: number;
};

export const PUBLIC_PROCEDURE_ALLOWLIST = ["auth.getSession"] as const;

export const PROTECTED_PROCEDURE_ALLOWLIST = [
  "auth.getSecretMessage",
  "auth.isAdmin",
  "episode.getAll",
  "episode.getByStatus",
  "episode.getRecordingData",
  "guess.currentSeason",
  "movie.add",
  "movie.find",
  "movie.getTitle",
  "movie.search",
  "rankedList.deleteList",
  "rankedList.getAllTypes",
  "rankedList.getById",
  "rankedList.getLists",
  "rankedList.removeItem",
  "rankedList.reorderItem",
  "rankedList.upsertItem",
  "rankedList.upsertList",
  "show.add",
  "show.find",
  "show.getTitle",
  "show.search",
  "user.getRoles",
] as const;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const adminRoot = path.resolve(scriptDirectory, "..");
const routerDirectory = path.join(adminRoot, "src/server/trpc/router");
const matrixPath = path.join(adminRoot, "docs/AUTHORIZATION_MATRIX.md");
const accessBuilders = new Set([
  "publicProcedure",
  "protectedProcedure",
  "adminProcedure",
]);

function propertyName(
  node: ts.PropertyName,
  sourceFile: ts.SourceFile,
): string {
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node)
  ) {
    return node.text;
  }
  return node.getText(sourceFile);
}

function accessForNode(node: ts.Node): ProcedureAccess | undefined {
  let access: ProcedureAccess | undefined;

  const visit = (child: ts.Node) => {
    if (ts.isIdentifier(child) && accessBuilders.has(child.text)) {
      access = child.text.replace("Procedure", "") as ProcedureAccess;
      return;
    }
    ts.forEachChild(child, visit);
  };

  visit(node);
  return access;
}

function kindForNode(node: ts.Node): ProcedureKind | undefined {
  let kind: ProcedureKind | undefined;

  const visit = (child: ts.Node) => {
    if (
      ts.isCallExpression(child) &&
      ts.isPropertyAccessExpression(child.expression)
    ) {
      const method = child.expression.name.text;
      if (method === "query" || method === "mutation") {
        kind = method;
        return;
      }
    }
    ts.forEachChild(child, visit);
  };

  visit(node);
  return kind;
}

export function collectProcedureInventory(): ProcedureInventoryItem[] {
  const inventory: ProcedureInventoryItem[] = [];
  const routerFiles = fs
    .readdirSync(routerDirectory)
    .filter((file) => file.endsWith("Router.ts") || file === "auth.ts")
    .sort();

  for (const file of routerFiles) {
    const absolutePath = path.join(routerDirectory, file);
    const source = fs.readFileSync(absolutePath, "utf8");
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    const inspect = (node: ts.Node) => {
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isCallExpression(node.initializer) &&
        ts.isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === "router"
      ) {
        const routerObject = node.initializer.arguments[0];
        if (!routerObject || !ts.isObjectLiteralExpression(routerObject)) {
          return;
        }

        const routerName = ts.isIdentifier(node.name)
          ? node.name.text.replace(/Router$/, "")
          : path.basename(file, ".ts").replace(/Router$/, "");

        for (const property of routerObject.properties) {
          if (!ts.isPropertyAssignment(property)) {
            throw new Error(
              `${file}:${sourceFile.getLineAndCharacterOfPosition(property.getStart()).line + 1} uses an unsupported router property`,
            );
          }

          const access = accessForNode(property.initializer);
          const kind = kindForNode(property.initializer);
          const line =
            sourceFile.getLineAndCharacterOfPosition(property.getStart()).line +
            1;

          if (!access || !kind) {
            throw new Error(
              `${file}:${line} must use publicProcedure, protectedProcedure, or adminProcedure and end in query() or mutation()`,
            );
          }

          inventory.push({
            path: `${routerName}.${propertyName(property.name, sourceFile)}`,
            kind,
            access,
            source: `src/server/trpc/router/${file}`,
            line,
          });
        }
      }

      ts.forEachChild(node, inspect);
    };

    inspect(sourceFile);
  }

  return inventory.sort((left, right) => left.path.localeCompare(right.path));
}

export function assertAuthorizationPolicy(
  inventory: ProcedureInventoryItem[],
): void {
  const publicPaths = inventory
    .filter((procedure) => procedure.access === "public")
    .map((procedure) => procedure.path);
  const protectedPaths = inventory
    .filter((procedure) => procedure.access === "protected")
    .map((procedure) => procedure.path);
  const publicMutations = inventory.filter(
    (procedure) =>
      procedure.kind === "mutation" && procedure.access === "public",
  );

  const expectedPublic = [...PUBLIC_PROCEDURE_ALLOWLIST].sort();
  const expectedProtected = [...PROTECTED_PROCEDURE_ALLOWLIST].sort();

  if (JSON.stringify(publicPaths) !== JSON.stringify(expectedPublic)) {
    throw new Error(
      `Public procedure allowlist mismatch.\nExpected: ${expectedPublic.join(", ")}\nActual: ${publicPaths.join(", ")}`,
    );
  }

  if (JSON.stringify(protectedPaths) !== JSON.stringify(expectedProtected)) {
    throw new Error(
      `Protected procedure allowlist mismatch.\nExpected: ${expectedProtected.join(", ")}\nActual: ${protectedPaths.join(", ")}`,
    );
  }

  if (publicMutations.length > 0) {
    throw new Error(
      `Public mutations are forbidden: ${publicMutations.map((procedure) => procedure.path).join(", ")}`,
    );
  }
}

export function renderAuthorizationMatrix(
  inventory: ProcedureInventoryItem[],
): string {
  const counts = inventory.reduce(
    (result, procedure) => {
      result[procedure.access] += 1;
      return result;
    },
    { public: 0, protected: 0, admin: 0 },
  );

  const rows = inventory.map(
    (procedure) =>
      `| \`${procedure.path}\` | ${procedure.kind} | ${procedure.access} | [source](../${procedure.source}#L${procedure.line}) |`,
  );

  return `# BBPC Admin tRPC Authorization Matrix

Generated by \`npm run auth:matrix\`. Do not edit this file by hand.

Policy:

- \`public\` is limited to session discovery.
- \`protected\` is limited to authenticated self-service ranked lists, catalog lookup
  needed by that workflow, and the existing authenticated recording-guest reads.
- All other reads and writes require an administrator session.
- No mutation may be public.

Totals: ${inventory.length} procedures — ${counts.admin} admin, ${counts.protected} protected,
${counts.public} public.

| Procedure | Type | Access | Definition |
| --- | --- | --- | --- |
${rows.join("\n")}
`;
}

function runCli(): void {
  const inventory = collectProcedureInventory();
  assertAuthorizationPolicy(inventory);
  const rendered = renderAuthorizationMatrix(inventory);

  if (process.argv.includes("--check")) {
    const existing = fs.existsSync(matrixPath)
      ? fs.readFileSync(matrixPath, "utf8")
      : "";
    if (existing !== rendered) {
      throw new Error(
        "docs/AUTHORIZATION_MATRIX.md is stale; run npm run auth:matrix",
      );
    }
    process.stdout.write(
      `Authorization matrix is current (${inventory.length} procedures).\n`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(matrixPath), { recursive: true });
  fs.writeFileSync(matrixPath, rendered);
  process.stdout.write(
    `Wrote docs/AUTHORIZATION_MATRIX.md (${inventory.length} procedures).\n`,
  );
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) {
  runCli();
}
