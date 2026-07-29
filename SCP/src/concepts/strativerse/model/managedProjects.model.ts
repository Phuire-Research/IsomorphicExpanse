import * as fs from 'fs/promises';
import * as path from 'path';
import type { ProjectEntry } from '../strativerse.type';

export type ManagedProjectsFileEntry = {
  name: string;
  path: string;
  port: number;
  status: string;
  createdAt: number;
  templateVersion: string;
};

export type ManagedProjectsFileData = {
  version: number;
  lastUpdated: number;
  projects: ManagedProjectsFileEntry[];
};

const MANAGED_PROJECTS_FILENAME = '.managed-projects.json';

const DEFAULT_FILE_DATA: ManagedProjectsFileData = {
  version: 1,
  lastUpdated: 0,
  projects: [],
};

function getManagedProjectsFilePath(): string {
  return path.join(process.cwd(), MANAGED_PROJECTS_FILENAME);
}

export async function readManagedProjectsFile(): Promise<ManagedProjectsFileData> {
  const filePath = getManagedProjectsFilePath();
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as ManagedProjectsFileData;
    return data;
  } catch (error) {
    console.log('[ManagedProjects] File not found or invalid, creating default:', filePath);
    await writeManagedProjectsFile(DEFAULT_FILE_DATA);
    return { ...DEFAULT_FILE_DATA };
  }
}

export async function writeManagedProjectsFile(data: ManagedProjectsFileData): Promise<void> {
  const filePath = getManagedProjectsFilePath();
  const updated: ManagedProjectsFileData = {
    ...data,
    lastUpdated: Date.now(),
  };
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  console.log('[ManagedProjects] Written to disk:', filePath, '— projects:', updated.projects.length);
}

export function projectEntryFromFileEntry(entry: ManagedProjectsFileEntry): ProjectEntry {
  return {
    name: entry.name,
    path: entry.path,
    templateVersion: entry.templateVersion,
    exists: true,
    port: entry.port,
    concepts: [],
    conceptEntries: [],
    hasMuxonomy: false,
    registeredTools: [],
    registeredNavigation: [],
    createdAt: entry.createdAt,
    lastScanned: 0,
    lastModified: 0,
    status: entry.status as ProjectEntry['status'],
    conceptSyncMetadata: {},
  };
}

export function fileEntryFromProjectEntry(entry: ProjectEntry): ManagedProjectsFileEntry {
  return {
    name: entry.name,
    path: entry.path,
    port: entry.port,
    status: entry.status,
    createdAt: entry.createdAt,
    templateVersion: entry.templateVersion,
  };
}
