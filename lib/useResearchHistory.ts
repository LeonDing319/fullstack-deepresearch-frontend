// Custom hook for research history operations with InstantDB
import { db, id } from './instantdb'

// Save a completed research session to InstantDB
export function useSaveResearch() {
  const saveResearch = async (data: {
    query: string
    model: string
    reportContent: string
    sources: string[]
    duration?: number
  }) => {
    if (!db) {
      console.warn('InstantDB not configured, skipping save')
      return null
    }

    const now = Date.now()
    const wordCount = data.reportContent.split(/\s+/).filter(Boolean).length

    try {
      const sessionId = id()
      await db.transact(
        db.tx.researchSessions[sessionId].update({
          query: data.query,
          model: data.model,
          reportContent: data.reportContent,
          sources: JSON.stringify(data.sources),
          duration: data.duration || 0,
          wordCount,
          createdAt: now,
          updatedAt: now,
        })
      )
      console.log('Research saved to InstantDB:', sessionId)
      return sessionId
    } catch (error) {
      console.error('Failed to save research to InstantDB:', error)
      throw error
    }
  }

  return { saveResearch }
}

// Query all research sessions (real-time subscription)
export function useResearchHistory() {
  if (!db) {
    return {
      sessions: [],
      isLoading: false,
      error: null as unknown,
    }
  }

  const query = db.useQuery({
    researchSessions: {},
  })

  const sessions = query.data?.researchSessions || []

  // Sort by createdAt descending (newest first)
  const sortedSessions = [...sessions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  return {
    sessions: sortedSessions,
    isLoading: query.isLoading,
    error: query.error,
  }
}

// Delete a research session
export function useDeleteResearch() {
  const deleteResearch = async (sessionId: string) => {
    if (!db) {
      console.warn('InstantDB not configured, skipping delete')
      return
    }

    try {
      await db.transact(
        db.tx.researchSessions[sessionId].delete()
      )
      console.log('Research deleted from InstantDB:', sessionId)
    } catch (error) {
      console.error('Failed to delete research from InstantDB:', error)
      throw error
    }
  }

  return { deleteResearch }
}

// Helper: Get model display name
export function getModelDisplayName(model: string): string {
  switch (model) {
    case 'zhipu': return '智谱 GLM-4.7'
    case 'deepseek': return 'DeepSeek V3.2'
    case 'kimi': return 'Kimi K2 Thinking'
    default: return model
  }
}

// Helper: Format timestamp to readable date
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
