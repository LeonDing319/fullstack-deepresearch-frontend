// Directory: yt-deepresearch-frontend/app/page.tsx
/**
 * Main page component for Deep Research Agent
 * Features modern Perplexity-style interface with streaming research capabilities
 */

'use client'

import { useEffect, useState } from 'react'
import ResearchInterface from '@/components/ResearchInterface'
import ModelComparison from '@/components/ModelComparison'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, BarChart3, History, ChevronLeft, ChevronRight, Globe, Trash2, Clock, FileText, ExternalLink, Search } from 'lucide-react'
import { ResearchProvider, useResearchState } from '@/contexts/ResearchContext'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { useResearchHistory, useDeleteResearch, getModelDisplayName, formatTimestamp } from '@/lib/useResearchHistory'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

// Sidebar Configuration Component
function SidebarConfig() {
  const {
    selectedModel,
    setSelectedModel,
    apiKey,
    setApiKey,
    isStreaming
  } = useResearchState()
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.aiModel}
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-zinc-800 focus:border-transparent text-sm"
          disabled={isStreaming}
        >
          <option value="zhipu">{t.zhipuName}</option>
          <option value="deepseek">{t.deepseekName}</option>
          <option value="kimi">{t.kimiName}</option>
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.apiKey}
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={t.apiKeyPlaceholder}
          className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-zinc-800 focus:border-transparent text-sm"
          disabled={isStreaming}
        />
      </div>
    </div>
  )
}

// Language Toggle Button
function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
      title={language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <span className="text-xs font-bold">
        {language === 'zh' ? 'EN' : '中'}
      </span>
    </button>
  )
}

// Research History Panel Component
function ResearchHistoryPanel() {
  const { sessions, isLoading, error } = useResearchHistory()
  const { deleteResearch } = useDeleteResearch()
  const { t } = useLanguage()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session =>
    session.query?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.model?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get the selected session details
  const selectedSessionData = sessions.find(s => s.id === selectedSession)

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteResearch(sessionId)
      if (selectedSession === sessionId) {
        setSelectedSession(null)
      }
      setConfirmDelete(null)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.loading}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t.historyConnectionError}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t.historyConnectionErrorDesc}
          </p>
          <code className="text-xs bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded text-red-600 dark:text-red-400">
            {String(error)}
          </code>
        </div>
      </div>
    )
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t.noHistoryYet}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            {t.noHistoryDesc}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left: Session List */}
      <div className={`${selectedSession ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-200 dark:border-neutral-700 flex-shrink-0`}>
        {/* Search & Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.researchHistory}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
              {sessions.length} {t.historyCount}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchHistory}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.map((session) => {
            const sources = session.sources ? JSON.parse(session.sources) : []
            return (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={`p-4 border-b border-gray-100 dark:border-neutral-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${
                  selectedSession === session.id ? 'bg-zinc-50 dark:bg-zinc-900/30 border-l-2 border-l-zinc-800 dark:border-l-zinc-300' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 flex-1 mr-2">
                    {session.query}
                  </h4>
                  {confirmDelete === session.id ? (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(session.id) }}
                        className="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        {t.confirmDeleteBtn}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(null) }}
                        className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                      >
                        {t.cancelBtn}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(session.id) }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      style={{ opacity: selectedSession === session.id ? 1 : undefined }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(session.createdAt)}
                  </span>
                  <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-400">
                    {getModelDisplayName(session.model)}
                  </span>
                  {session.wordCount > 0 && (
                    <span>{session.wordCount} {t.words}</span>
                  )}
                  {sources.length > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <ExternalLink className="w-3 h-3" />
                      {sources.length}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {filteredSessions.length === 0 && searchQuery && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              {t.noSearchResults}
            </div>
          )}
        </div>
      </div>

      {/* Right: Session Detail */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedSessionData ? (
          <>
            {/* Detail Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="md:hidden text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 mb-2 flex items-center gap-1"
                  >
                    ← {t.backToList}
                  </button>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {selectedSessionData.query}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatTimestamp(selectedSessionData.createdAt)}</span>
                    <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-400">
                      {getModelDisplayName(selectedSessionData.model)}
                    </span>
                    {selectedSessionData.duration > 0 && (
                      <span>{Math.round(selectedSessionData.duration / 1000)}s</span>
                    )}
                    {selectedSessionData.wordCount > 0 && (
                      <span>{selectedSessionData.wordCount} {t.words}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setConfirmDelete(selectedSessionData.id)
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title={t.deleteSession}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sources bar */}
              {(() => {
                const sources = selectedSessionData.sources ? JSON.parse(selectedSessionData.sources) : []
                return sources.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {sources.slice(0, 8).map((source: string, index: number) => {
                      const domain = source.replace(/^https?:\/\//, '').split('/')[0]
                      return (
                        <a
                          key={index}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-xs text-gray-600 dark:text-gray-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {domain}
                        </a>
                      )
                    })}
                    {sources.length > 8 && (
                      <span className="text-xs text-gray-400 self-center">+{sources.length - 8}</span>
                    )}
                  </div>
                ) : null
              })()}

              {/* Delete confirmation inline */}
              {confirmDelete === selectedSessionData.id && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-between">
                  <span className="text-sm text-red-700 dark:text-red-300">{t.confirmDeleteMsg}</span>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDelete(selectedSessionData.id)}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      {t.confirmDeleteBtn}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1 text-xs bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                    >
                      {t.cancelBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-8" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-6" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-700 dark:text-gray-300" {...props} />,
                    a: ({node, ...props}) => <a className="text-zinc-900 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-400 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="ml-4 mb-2" {...props} />,
                  }}
                >
                  {selectedSessionData.reportContent}
                </ReactMarkdown>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t.selectSessionToView}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Content Component
function MainContent() {
  const [activeTab, setActiveTab] = useState('research')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { t } = useLanguage()

  // Sync URL hash (#research, #comparison, #history) with tabs
  useEffect(() => {
    const syncFromHash = () => {
      const hash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '')
      if (hash === 'comparison' || hash === 'research' || hash === 'history') {
        setActiveTab(hash)
      }
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  useEffect(() => {
    // Sync hash when tab changes (no-op side effect for external listeners)
  }, [activeTab])

  return (
    <div className="h-screen w-full bg-white dark:from-neutral-900 dark:to-neutral-800 flex overflow-hidden relative">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-700 flex flex-col flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-2">
              <div className="overflow-hidden relative">
                <div className="inline-flex animate-scroll-text hover:animation-paused">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    {t.appTitle}
                  </h1>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap pl-8" aria-hidden="true">
                    {t.appTitle}
                  </h1>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation Tabs */}
        {!sidebarCollapsed && (
          <div className="px-4 pt-0 pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-1 gap-1 bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg my-[15px]">
                <TabsTrigger
                  value="research"
                  className="flex items-center justify-start space-x-2 w-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:shadow-sm rounded-md py-2.5 px-3 text-sm font-medium transition-all"
                >
                  <Brain className="w-4 h-4" />
                  <span>{t.research}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="comparison"
                  className="flex items-center justify-start space-x-2 w-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:shadow-sm rounded-md py-2.5 px-3 text-sm font-medium transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{t.compare}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center justify-start space-x-2 w-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:shadow-sm rounded-md py-2.5 px-3 text-sm font-medium transition-all"
                >
                  <History className="w-4 h-4" />
                  <span>{t.history}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Configuration Inputs */}
        {!sidebarCollapsed && activeTab === 'research' && (
          <div className="flex-1 px-4 pt-0 pb-4">
            <SidebarConfig />
          </div>
        )}

        {/* Connection Status & Language Toggle */}
        {!sidebarCollapsed && (
          <div className="mt-auto px-4 py-[21px] border-t border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>{t.backendConnected}</span>
                </span>
              </div>
              <LanguageToggle />
            </div>
          </div>
        )}

        {/* Language Toggle when sidebar collapsed */}
        {sidebarCollapsed && (
          <div className="mt-auto p-3 border-t border-gray-200 dark:border-neutral-700 flex justify-center">
            <LanguageToggle />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsContent value="research" className="flex-1 m-0 overflow-hidden">
            <ResearchInterface />
          </TabsContent>

          <TabsContent value="comparison" className="flex-1 m-0 overflow-y-auto min-h-0 bg-gray-50 dark:bg-neutral-900">
            <ModelComparison />
          </TabsContent>

          <TabsContent value="history" className="flex-1 m-0 overflow-hidden bg-white dark:bg-neutral-900">
            <ResearchHistoryPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <ResearchProvider>
        <MainContent />
      </ResearchProvider>
    </LanguageProvider>
  )
}
