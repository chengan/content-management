'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          应用运行出错
        </h1>
        
        <p className="text-gray-600 mb-6">
          应用在运行过程中遇到了问题，请尝试重新加载页面。
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-left">
            <p className="text-sm text-red-800 font-mono">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-1">
                错误ID: {error.digest}
              </p>
            )}
          </div>
        )}
        
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          重新加载
        </button>
      </div>
    </div>
  )
}