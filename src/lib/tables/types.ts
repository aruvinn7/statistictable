export interface LookupField {
  key: string; label: string; kind: 'number' | 'select'; default: string
  min?: number; max?: number; step?: number
  options?: { value: string; label: string }[]
}
export interface LookupResult {
  kind: 'scalar' | 'pair' | 'probability'
  primary: { value: number; label: string }
  secondary?: { value: number; label: string }
  interpolated?: boolean; note?: string
}
export interface LookupSuggestion { field: string; value: number; label: string }
export type LookupOutcome =
  | LookupResult
  | { error: string; suggestion?: LookupSuggestion }

export interface GridModel {
  rowHeader: string
  columns: { key: string; label: string }[]
  rows: { key: string; label: string; cells: (number | null)[] }[]
  caption?: string
}
export interface GridSelector {
  key: string; label: string; default: string; options: { value: string; label: string }[]
}
export interface TableDef {
  id: string; symbol: string; name: string; subtitle: string
  group: 'parametrik' | 'nonparametrik'; aliases: string[]
  status: 'tersedia' | 'menunggu-sumber'
  fields: LookupField[]; gridSelectors: GridSelector[]
  lookup: (input: Record<string, string>) => LookupOutcome
  pvalue?: { fields: LookupField[]; lookup: (input: Record<string, string>) => LookupOutcome }
  buildGrid: (controls: Record<string, string>) => GridModel
  guide: string[]; method: string
}
