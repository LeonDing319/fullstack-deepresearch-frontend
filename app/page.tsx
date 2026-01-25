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
import { Brain, BarChart3, History, ChevronLeft, ChevronRight, Globe } from 'lucide-react'
import { ResearchProvider, useResearchState } from '@/contexts/ResearchContext'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'

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

  return (
    <div className="h-screen w-full bg-white dark:from-neutral-900 dark:to-neutral-800 flex overflow-hidden relative">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-700 flex flex-col flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t.appTitle}
                </h1>
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
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-1 gap-1 bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
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
          <div className="flex-1 p-4">
            <SidebarConfig />
          </div>
        )}

        {/* Connection Status & Language Toggle */}
        {!sidebarCollapsed && (
          <div className="mt-auto px-4 py-4 border-t border-gray-200 dark:border-neutral-700">
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

          <TabsContent value="history" className="flex-1 m-0 p-8 overflow-y-auto bg-white dark:bg-neutral-900">
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-zinc-900 dark:text-zinc-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t.researchHistory}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
                  {t.historyDescription}
                </p>

                <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl p-6 text-left shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900/30 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-zinc-900 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{t.databaseIntegration}</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t.databaseDescription}
                  </p>
                  <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-400">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{t.setupGuide}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
