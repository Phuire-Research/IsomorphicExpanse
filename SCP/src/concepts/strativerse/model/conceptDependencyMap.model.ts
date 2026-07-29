import fs from 'fs/promises';
import path from 'path';

export type ConceptDependency = {
  conceptName: string;
  importedFrom: string[];
  importedBy: string[];
  sharedTypes: string[];
  stratimuxImports: string[];
};

export type ConceptDependencyMap = {
  projectPath: string;
  dependencies: Record<string, ConceptDependency>;
  generatedAt: number;
};

type ParsedImport = {
  names: string[];
  source: string;
};

async function gatherTsFiles(dirPath: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'test') {
        const nested = await gatherTsFiles(fullPath);
        results.push(...nested);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory not readable
  }
  return results;
}

function parseImports(content: string): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const importRegex = /import\s+(?:type\s+)?(\{[\s\S]*?\}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const [, binding, source] = match;
    const names: string[] = [];
    if (binding.startsWith('{')) {
      const inner = binding.slice(1, -1);
      for (const part of inner.split(',')) {
        const trimmed = part.trim().replace(/^type\s+/, '');
        if (trimmed) {
          names.push(trimmed);
        }
      }
    } else if (binding.startsWith('*')) {
      names.push(binding.replace(/\*\s+as\s+/, ''));
    } else {
      names.push(binding);
    }
    imports.push({ names, source });
  }
  return imports;
}

function resolveConceptReference(
  importSource: string,
  sourceFilePath: string,
  conceptsPath: string,
  conceptNames: string[]
): string | null {
  if (!importSource.startsWith('.')) return null;
  const sourceDir = path.dirname(sourceFilePath);
  const resolvedPath = path.resolve(sourceDir, importSource);
  for (const name of conceptNames) {
    const conceptDir = path.join(conceptsPath, name);
    if (resolvedPath.startsWith(conceptDir + path.sep) || resolvedPath === conceptDir) {
      return name;
    }
  }
  return null;
}

function addUnique(arr: string[], value: string): void {
  if (!arr.includes(value)) {
    arr.push(value);
  }
}

export async function buildConceptDependencyMap(projectPath: string): Promise<ConceptDependencyMap> {
  const conceptsPath = path.join(projectPath, 'src', 'concepts');
  const dependencies: Record<string, ConceptDependency> = {};

  const entries = await fs.readdir(conceptsPath, { withFileTypes: true });
  const conceptNames = entries.filter(e => e.isDirectory()).map(e => e.name);

  for (const name of conceptNames) {
    dependencies[name] = {
      conceptName: name,
      importedFrom: [],
      importedBy: [],
      sharedTypes: [],
      stratimuxImports: [],
    };
  }

  for (const conceptName of conceptNames) {
    const conceptDir = path.join(conceptsPath, conceptName);
    const tsFiles = await gatherTsFiles(conceptDir);

    for (const filePath of tsFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const imports = parseImports(content);

        for (const imp of imports) {
          if (imp.source === 'stratimux') {
            for (const name of imp.names) {
              addUnique(dependencies[conceptName].stratimuxImports, name);
            }
          } else {
            const referencedConcept = resolveConceptReference(imp.source, filePath, conceptsPath, conceptNames);
            if (referencedConcept && referencedConcept !== conceptName) {
              addUnique(dependencies[conceptName].importedFrom, referencedConcept);
              for (const name of imp.names) {
                addUnique(dependencies[conceptName].sharedTypes, name);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[StratiVERSE] Could not read file for dependency analysis: ${filePath}`, err);
      }
    }
  }

  for (const conceptName of conceptNames) {
    for (const dep of dependencies[conceptName].importedFrom) {
      if (dependencies[dep]) {
        addUnique(dependencies[dep].importedBy, conceptName);
      }
    }
  }

  for (const dep of Object.values(dependencies)) {
    dep.importedFrom.sort();
    dep.importedBy.sort();
    dep.sharedTypes.sort();
    dep.stratimuxImports.sort();
  }

  console.log(`[StratiVERSE] Built dependency map for ${conceptNames.length} concepts at ${projectPath}`);

  return {
    projectPath,
    dependencies,
    generatedAt: Date.now(),
  };
}
