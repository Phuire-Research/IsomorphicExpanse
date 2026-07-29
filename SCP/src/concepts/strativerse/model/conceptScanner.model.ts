import fs from 'fs/promises';
import path from 'path';
import {
  type ConceptEntry,
  type QualityEntry,
  type PrincipleEntry,
  type StrategyEntry,
  type StateFieldEntry,
  type MuxonomyConfigSummary,
  type SCPQualityMetadata,
} from '../strativerse.type';
import {
  isQualityFile,
  isPrincipleFile,
  isStrategyFile,
} from './fileNaming.model';
import {
  parseStateType,
  parseQualityContent,
  parsePrincipleContent,
  parseStrategyContent,
  parseMuxonomyConfig,
  parseScpToolMetadata,
} from './conceptParser.model';

type MuxonomyExtractionResult = {
  muxonomyConfig: MuxonomyConfigSummary | undefined;
  scpToolMetadata: SCPQualityMetadata[];
};

async function scanQualitiesDirectory(conceptPath: string): Promise<QualityEntry[]> {
  const qualitiesPath = path.join(conceptPath, 'qualities');
  const qualities: QualityEntry[] = [];

  try {
    const files = await fs.readdir(qualitiesPath);

    for (const fileName of files) {
      if (isQualityFile(fileName)) {
        const filePath = path.join(qualitiesPath, fileName);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const entry = parseQualityContent(content, fileName, filePath);
          if (entry) {
            qualities.push(entry);
          }
        } catch (err) {
          console.warn(`[StratiVERSE] Could not parse quality file: ${fileName}`, err);
        }
      }
    }
  } catch {
    // qualities/ directory doesn't exist - that's OK
  }

  return qualities;
}

async function scanPrinciplesDirectory(conceptPath: string): Promise<PrincipleEntry[]> {
  const principlesPath = path.join(conceptPath, 'principles');
  const principles: PrincipleEntry[] = [];

  try {
    const files = await fs.readdir(principlesPath);

    for (const fileName of files) {
      if (isPrincipleFile(fileName)) {
        const filePath = path.join(principlesPath, fileName);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const entry = parsePrincipleContent(content, fileName, filePath);
          if (entry) {
            principles.push(entry);
          }
        } catch (err) {
          console.warn(`[StratiVERSE] Could not parse principle file: ${fileName}`, err);
        }
      }
    }
  } catch {
    // principles/ directory doesn't exist - that's OK
  }

  return principles;
}

async function scanStrategiesDirectory(conceptPath: string): Promise<StrategyEntry[]> {
  const strategiesPath = path.join(conceptPath, 'strategies');
  const strategies: StrategyEntry[] = [];

  try {
    const files = await fs.readdir(strategiesPath);

    for (const fileName of files) {
      if (isStrategyFile(fileName)) {
        const filePath = path.join(strategiesPath, fileName);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const entry = parseStrategyContent(content, fileName, filePath);
          if (entry) {
            strategies.push(entry);
          }
        } catch (err) {
          console.warn(`[StratiVERSE] Could not parse strategy file: ${fileName}`, err);
        }
      }
    }
  } catch {
    // strategies/ directory doesn't exist - that's OK
  }

  return strategies;
}

async function extractStateType(
  conceptPath: string,
  conceptName: string
): Promise<{ stateTypeName: string; stateFields: StateFieldEntry[] }> {
  const typeFilePath = path.join(conceptPath, `${conceptName}.type.ts`);
  const modelFilePath = path.join(conceptPath, `${conceptName}.model.ts`);

  for (const filePath of [typeFilePath, modelFilePath]) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const result = parseStateType(content, conceptName);
      if (result) {
        return result;
      }
    } catch {
      // File doesn't exist, try next
    }
  }

  return { stateTypeName: '', stateFields: [] };
}

async function extractMuxonomyData(
  conceptPath: string,
  conceptName: string
): Promise<MuxonomyExtractionResult> {
  const muxonomyFilePath = path.join(conceptPath, `${conceptName}.muxonomy.ts`);

  try {
    const content = await fs.readFile(muxonomyFilePath, 'utf-8');
    const muxonomyConfig = parseMuxonomyConfig(content) ?? undefined;
    const scpToolMetadata = parseScpToolMetadata(content);
    return { muxonomyConfig, scpToolMetadata };
  } catch {
    return { muxonomyConfig: undefined, scpToolMetadata: [] };
  }
}

export async function scanConceptsDirectory(scanPath: string): Promise<ConceptEntry[]> {
  const concepts: ConceptEntry[] = [];
  const scanTimestamp = Date.now();

  try {
    const entries = await fs.readdir(scanPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const conceptName = entry.name;
        const conceptDirPath = path.join(scanPath, conceptName);
        const conceptFilePath = path.join(conceptDirPath, `${conceptName}.concept.ts`);
        const muxonomyFilePath = path.join(conceptDirPath, `${conceptName}.muxonomy.ts`);

        let exists = false;
        try {
          await fs.access(conceptFilePath);
          exists = true;
        } catch {
          exists = false;
        }

        let hasMuxonomy = false;
        try {
          await fs.access(muxonomyFilePath);
          hasMuxonomy = true;
        } catch {
          hasMuxonomy = false;
        }

        if (exists) {
          const [qualities, principles, strategies, stateInfo, muxonomyData] = await Promise.all([
            scanQualitiesDirectory(conceptDirPath),
            scanPrinciplesDirectory(conceptDirPath),
            scanStrategiesDirectory(conceptDirPath),
            extractStateType(conceptDirPath, conceptName),
            hasMuxonomy ? extractMuxonomyData(conceptDirPath, conceptName) : Promise.resolve({ muxonomyConfig: undefined, scpToolMetadata: [] }),
          ]);

          const { muxonomyConfig, scpToolMetadata } = muxonomyData;

          console.log(`[StratiVERSE] Scanned ${conceptName}:`, {
            qualities: qualities.length,
            principles: principles.length,
            strategies: strategies.length,
            stateFields: stateInfo.stateFields.length,
            stateTypeName: stateInfo.stateTypeName || '(none)',
            hasMuxonomy,
            scpTools: scpToolMetadata.length,
          });

          concepts.push({
            name: conceptName,
            path: conceptDirPath,
            exists: true,
            stateFields: stateInfo.stateFields,
            stateTypeName: stateInfo.stateTypeName,
            qualities,
            principles,
            strategies,
            hasMuxonomy,
            muxonomyConfig,
            scpToolMetadata,
            scanTimestamp
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning concepts directory:', error);
    throw error;
  }

  return concepts.sort((a, b) => a.name.localeCompare(b.name));
}
