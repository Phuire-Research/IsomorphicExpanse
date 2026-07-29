export interface SuiteRole {
  n: number
  colorVar: string
  profession: string
  operation: string
  geometric: string
}

export const suiteRoles: SuiteRole[] = [
  { n: 0, colorVar: 'var(--color-base)',    profession: 'Unification',  operation: 'Summation',          geometric: 'Point' },
  { n: 1, colorVar: 'var(--color-red)',     profession: 'Curation',     operation: 'Demonstration',      geometric: 'Series of Points' },
  { n: 2, colorVar: 'var(--color-orange)',  profession: 'Prospect',     operation: 'Diastration',        geometric: 'Lines Connecting Points' },
  { n: 3, colorVar: 'var(--color-yellow)',  profession: 'Architect',    operation: 'Muxistration',       geometric: 'Faces Formed from Connected Lines' },
  { n: 4, colorVar: 'var(--color-green)',   profession: 'Sculpture',    operation: 'Stratimuxistration', geometric: 'Solids Emerge' },
  { n: 5, colorVar: 'var(--color-blue)',    profession: 'Professional', operation: 'Muxification',       geometric: 'Depth of Solids' },
  { n: 6, colorVar: 'var(--color-purple)',  profession: 'Operator',     operation: 'Stratimuxification', geometric: 'Solids Forming Compositions' },
  { n: 7, colorVar: 'var(--color-fuchsia)', profession: 'Clinician',    operation: 'Anorification',      geometric: 'Depth of Compositions' },
]
