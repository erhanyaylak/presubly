export interface ReviewResult {
  totalScore: number
  decision: string
  criteria: { name: string; score: number; maxScore: number; comments?: string[] }[]
  majorIssues?: string[]
  minorIssues?: string[]
  suggestions?: string[]
  summary?: string
}

export interface EditorialResultData {
  scopeFit: string
  scopeNotes?: string
  decision: string
  decisionRationale?: string
  ethicsCheck?: string[]
  letter?: string
  summary?: string
}

export interface ResponseEntry {
  comment: string
  strategy: string
  response: string
  revision: string
}
export interface ResponseResultData {
  responses: ResponseEntry[]
  summary?: string
}

export interface ChecklistItem {
  id: string
  description: string
  status: string
  note?: string
}
export interface ChecklistResultData {
  standard: string
  studyType: string
  passed: number
  warnings: number
  failed: number
  items?: ChecklistItem[]
  verdict?: string
  summary?: string
}

export type ToolView = 'home' | 'review' | 'editorial' | 'response' | 'checklist' | 'profile' | 'admin'
