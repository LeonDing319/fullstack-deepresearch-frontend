// Directory: yt-DeepResearch-Frontend/components/ModelComparison.tsx
/**
 * Model comparison dashboard component
 * Clean, minimal design for comparing AI model performance
 * Features comprehensive metrics tracking and Supabase integration
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Database,
  Loader2,
  Users,
  FileText,
  Key,
  Upload,
  Download,
  Settings,
  Timer,
  Activity
} from 'lucide-react'
import { useResearchState } from '@/contexts/ResearchContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, formatDuration } from '@/lib/utils'

interface StageTimings {
  clarification: number
  research_brief: number
  research_execution: number
  final_report: number
}

interface ModelMetrics {
  model: string
  total_requests: number
  average_duration: number
  success_rate: number
  last_used: string | null
  average_stage_timings?: StageTimings
  average_sources_found: number
  average_word_count: number
}

interface ComparisonData {
  models: ModelMetrics[]
  total_requests: number
  generated_at: string
}

interface ComparisonResult {
  model: string
  duration: number
  stage_timings: StageTimings
  sources_found: number
  word_count: number
  success: boolean
  error?: string
  report_content: string
  supervisor_tools_used: string[]
}

interface ComparisonSession {
  session_id: string
  query: string
  timestamp: string
  results: ComparisonResult[]
  user_feedback?: Record<string, unknown>
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

const ModelComparison = () => {
  const { t } = useLanguage()
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Multi-model comparison state
  const [query, setQuery] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(['zhipu', 'deepseek', 'kimi'])
  const [isRunning, setIsRunning] = useState(false)
  const [latestSession, setLatestSession] = useState<ComparisonSession | null>(null)
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null)
  const [showKeyManager, setShowKeyManager] = useState(false)
  const [modelProgress, setModelProgress] = useState<Record<string, {
    stage: string
    startTime: number
    currentDuration: number
    status: 'pending' | 'running' | 'completed' | 'failed'
  }>>({})
  const { apiKeys, setApiKeys, clearApiKeys } = useResearchState()

  const availableModels = [
    { id: 'zhipu', name: t.zhipuName, description: t.zhipuDesc },
    { id: 'deepseek', name: t.deepseekName, description: t.deepseekDesc },
    { id: 'kimi', name: t.kimiName, description: t.kimiDesc }
  ]

  useEffect(() => {
    fetchComparisonData()
  }, [])

  const fetchComparisonData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${BACKEND_URL}/research/comparison`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setComparisonData(data)
    } catch (err: unknown) {
      console.error('Error fetching comparison data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const runComparison = async () => {
    if (!query.trim() || selectedModels.length === 0) return

    // Check if all selected models have API keys
    const missingKeys = selectedModels.filter(model => !apiKeys[model as keyof typeof apiKeys]?.trim())
    if (missingKeys.length > 0) {
      setError(`Missing API keys for: ${missingKeys.map(getModelName).join(', ')}. Please configure all keys first.`)
      return
    }

    setIsRunning(true)
    setError(null)

    // Initialize progress for each model
    const initialProgress: typeof modelProgress = {}
    selectedModels.forEach(model => {
      initialProgress[model] = {
        stage: 'Initializing...',
        startTime: Date.now(),
        currentDuration: 0,
        status: 'pending'
      }
    })
    setModelProgress(initialProgress)

    try {
      // Create API keys object for selected models only
      const modelApiKeys: Record<string, string> = {}
      selectedModels.forEach(model => {
        modelApiKeys[model] = apiKeys[model as keyof typeof apiKeys] || ''
      })

      // Start progress tracking
      selectedModels.forEach(model => {
        setModelProgress(prev => ({
          ...prev,
          [model]: { ...prev[model], status: 'running', stage: 'Running research...' }
        }))
      })

      const response = await fetch(`${BACKEND_URL}/research/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          models: selectedModels,
          api_keys: modelApiKeys
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const session: ComparisonSession = await response.json()
      setLatestSession(session)

      // Update final progress
      selectedModels.forEach(model => {
        const result = session.results.find(r => r.model === model)
        setModelProgress(prev => ({
          ...prev,
          [model]: {
            ...prev[model],
            status: result?.success ? 'completed' : 'failed',
            stage: result?.success ? 'Completed' : result?.error || 'Failed',
            currentDuration: result?.duration || 0
          }
        }))
      })

      // Refresh comparison data
      await fetchComparisonData()

    } catch (error: unknown) {
      console.error('Error running comparison:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')

      // Mark all models as failed
      selectedModels.forEach(model => {
        setModelProgress(prev => ({
          ...prev,
          [model]: { ...prev[model], status: 'failed', stage: 'Failed' }
        }))
      })
    } finally {
      setIsRunning(false)
    }
  }

  // Update duration during comparison
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setModelProgress(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(model => {
          if (updated[model].status === 'running') {
            updated[model].currentDuration = (Date.now() - updated[model].startTime) / 1000
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const getKeysConfigured = () => {
    return Object.entries(apiKeys).filter(([, key]) => key.trim()).length
  }

  const exportKeys = () => {
    const keysToExport = { ...apiKeys }
    const blob = new Blob([JSON.stringify(keysToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'api-keys.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importKeys = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const keys = JSON.parse(e.target?.result as string)
        if (keys.zhipu !== undefined || keys.deepseek !== undefined || keys.kimi !== undefined) {
          setApiKeys(keys)
          setError(null)
        } else {
          setError('Invalid key file format')
        }
      } catch {
        setError('Failed to parse key file')
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset file input
  }

  const getModelName = (id: string) => availableModels.find(m => m.id === id)?.name || id

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-900 dark:text-zinc-300" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">{t.loading}</span>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8 p-8 min-h-full">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-zinc-900 dark:text-zinc-300" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t.modelComparison}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t.compareDescription}
        </p>
      </div>

      {/* API Key Management */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-zinc-900 dark:text-zinc-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.apiKeyConfig}</h3>
            <span className="text-sm text-zinc-700 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/20 px-2 py-1 rounded-md">
              {getKeysConfigured()}/3 {t.configured}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={importKeys}
              className="hidden"
              id="import-keys"
            />
            <label
              htmlFor="import-keys"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 cursor-pointer flex items-center gap-1"
            >
              <Upload className="w-4 h-4" />
              {t.import_}
            </label>
            <button
              onClick={exportKeys}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              {t.export_}
            </button>
            <button
              onClick={() => setShowKeyManager(!showKeyManager)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              {showKeyManager ? t.hide : t.configure}
            </button>
          </div>
        </div>

        {showKeyManager && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
            {availableModels.map(model => (
              <div key={model.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {model.name} {t.apiKey}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeys[model.id as keyof typeof apiKeys] || ''}
                    onChange={(e) => setApiKeys({ [model.id]: e.target.value })}
                    placeholder={t.apiKeyPlaceholder}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-zinc-800 focus:border-transparent text-sm"
                  />
                  {apiKeys[model.id as keyof typeof apiKeys]?.trim() && (
                    <CheckCircle2 className="w-8 h-8 p-2 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{model.description}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={clearApiKeys}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {t.clearAllKeys}
              </button>
              <span className="text-xs text-gray-500">
                {t.keysStoredLocally}
              </span>
            </div>
          </div>
        )}

        {!showKeyManager && getKeysConfigured() === 0 && (
          <div className="text-sm text-zinc-900 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/20 p-3 rounded-md">
            {t.noKeysConfigured}
          </div>
        )}
      </div>

      {/* Quick Compare Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Play className="w-5 h-5 text-zinc-900 dark:text-zinc-300" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.runComparison}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.researchQuery}
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.queryPlaceholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white resize-none h-20 focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.modelsToCompare}
            </label>
            <div className="flex flex-wrap gap-2">
              {availableModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModels(prev =>
                    prev.includes(model.id)
                      ? prev.filter(id => id !== model.id)
                      : [...prev, model.id]
                  )}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    selectedModels.includes(model.id)
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-800 dark:border-zinc-800'
                      : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700'
                  )}
                  disabled={isRunning}
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runComparison}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-900 text-white dark:text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              disabled={isRunning || !query.trim() || selectedModels.length === 0 || selectedModels.some(model => !apiKeys[model as keyof typeof apiKeys]?.trim())}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.runningComparison}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t.runComparisonBtn}
                </>
              )}
            </button>

            {selectedModels.some(model => !apiKeys[model as keyof typeof apiKeys]?.trim()) && (
              <p className="text-sm text-zinc-900 dark:text-zinc-300">
                {t.missingApiKeys}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Progress Tracking */}
      {isRunning && Object.keys(modelProgress).length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700 bg-zinc-50 dark:bg-zinc-900/10">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-zinc-900 dark:text-zinc-300 animate-pulse" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.runningParallel}</h3>
              <span className="text-sm text-zinc-700 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/30 px-2 py-0.5 rounded-md">
                {Object.values(modelProgress).filter(p => p.status === 'completed').length}/{selectedModels.length} {t.completed}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedModels.map((model) => {
                const progress = modelProgress[model]
                if (!progress) return null

                return (
                  <div key={model} className="border border-gray-200 dark:border-neutral-700 rounded-xl p-4 bg-white dark:bg-neutral-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {getModelName(model)}
                      </h4>
                      <div className="flex items-center gap-2">
                        {progress.status === 'running' && (
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-900 dark:text-zinc-300" />
                        )}
                        {progress.status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {progress.status === 'failed' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDuration(progress.currentDuration)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2 mb-3 overflow-hidden">
                      {progress.status === 'running' ? (
                        <div className="h-2 bg-gradient-to-r from-zinc-800 to-zinc-300 rounded-full animate-pulse w-full" />
                      ) : (
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            progress.status === 'completed' ? "bg-green-500" :
                            progress.status === 'failed' ? "bg-red-500" :
                            "bg-gray-300 dark:bg-neutral-600"
                          )}
                          style={{ width: progress.status === 'completed' ? '100%' : progress.status === 'failed' ? '100%' : '0%' }}
                        />
                      )}
                    </div>

                    {/* Current Stage */}
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3 h-3" />
                        <span>{progress.stage}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Latest Comparison Results */}
      {latestSession && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.latestResults}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Query: &quot;{latestSession.query}&quot;</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestSession.results.map((result) => (
                <div
                  key={result.model}
                  className={cn(
                    "border rounded-xl p-4 cursor-pointer transition-all",
                    result.success
                      ? "border-gray-200 dark:border-neutral-700 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-md bg-white dark:bg-neutral-800"
                      : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                  )}
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {getModelName(result.model)}
                    </h4>
                    <div className="flex items-center gap-1">
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(result.duration)}
                      </span>
                    </div>
                  </div>

                  {/* Stage timing visualization */}
                  <div className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-3">
                    {result.success && (
                      <>
                        <div
                          className="h-full bg-zinc-400 float-left"
                          style={{ width: `${(result.stage_timings.clarification / result.duration) * 100}%` }}
                        />
                        <div
                          className="h-full bg-zinc-300 float-left"
                          style={{ width: `${(result.stage_timings.research_brief / result.duration) * 100}%` }}
                        />
                        <div
                          className="h-full bg-zinc-800 float-left"
                          style={{ width: `${(result.stage_timings.research_execution / result.duration) * 100}%` }}
                        />
                        <div
                          className="h-full bg-zinc-900 float-left"
                          style={{ width: `${(result.stage_timings.final_report / result.duration) * 100}%` }}
                        />
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-zinc-800" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {result.sources_found} {t.sources}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-zinc-800" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {result.word_count} {t.words}
                      </span>
                    </div>
                  </div>

                  {result.error && (
                    <p className="text-xs text-red-500 mt-2">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Historical Performance Metrics */}
      {comparisonData && comparisonData.models.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.performanceOverview}</h3>
              <button
                onClick={fetchComparisonData}
                className="text-sm text-zinc-900 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors"
                disabled={loading}
              >
                {t.refreshData}
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900/10 rounded-xl">
                <div className="flex items-center justify-center w-12 h-12 bg-zinc-100 dark:bg-zinc-900/30 rounded-xl mx-auto mb-2">
                  <BarChart3 className="w-6 h-6 text-zinc-900 dark:text-zinc-300" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {comparisonData.total_requests}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t.totalComparisons}</div>
              </div>

              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900/10 rounded-xl">
                <div className="flex items-center justify-center w-12 h-12 bg-zinc-100 dark:bg-zinc-900/30 rounded-xl mx-auto mb-2">
                  <Clock className="w-6 h-6 text-zinc-900 dark:text-zinc-300" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {(() => {
                    const modelsWithData = comparisonData.models.filter(m => m.average_duration > 0);
                    return modelsWithData.length > 0 ?
                      formatDuration(modelsWithData.reduce((acc, m) => acc + m.average_duration, 0) / modelsWithData.length) :
                      '0s';
                  })()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t.avgResponseTime}</div>
              </div>

              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900/10 rounded-xl">
                <div className="flex items-center justify-center w-12 h-12 bg-zinc-100 dark:bg-zinc-900/30 rounded-xl mx-auto mb-2">
                  <Users className="w-6 h-6 text-zinc-900 dark:text-zinc-300" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {comparisonData.models.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t.activeModels}</div>
              </div>
            </div>

            <div className="space-y-4">
              {comparisonData.models.map((model) => (
                <div key={model.model} className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {getModelName(model.model)}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {model.total_requests} {t.runs} • <span className="text-green-600 dark:text-green-400">{(model.success_rate || 0).toFixed(1)}%</span> {t.successRate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {formatDuration(model.average_duration)}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">{t.avgTime}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {(model.average_sources_found || 0).toFixed(1)}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">{t.avgSources}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {(model.average_word_count || 0).toFixed(0)}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">{t.avgWords}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Viewer Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700 bg-zinc-50 dark:bg-zinc-900/10">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {getModelName(selectedResult.model)} Report
              </h3>
              <button
                onClick={() => setSelectedResult(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl">{selectedResult.report_content}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default ModelComparison
