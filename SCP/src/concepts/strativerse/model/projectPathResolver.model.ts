import path from 'path';
import type { ProjectEntry } from '../strativerse.type';

export type ResolvedProjectPath = {
  projectRoot: string;
  isAdminSCP: boolean;
};

export function resolveProjectRoot(
  projectName?: string,
  projectPath?: string,
  managedProjects?: ProjectEntry[]
): ResolvedProjectPath | undefined {
  if (!projectName && !projectPath) {
    return { projectRoot: process.cwd(), isAdminSCP: true };
  }

  if (projectPath) {
    return { projectRoot: projectPath, isAdminSCP: false };
  }

  if (projectName && managedProjects) {
    const project = managedProjects.find(p => p.name === projectName);
    if (project) {
      return { projectRoot: project.path, isAdminSCP: false };
    }
  }

  return undefined;
}

export function getConceptPath(projectRoot: string, conceptName: string): string {
  return path.join(projectRoot, 'src', 'concepts', conceptName);
}
