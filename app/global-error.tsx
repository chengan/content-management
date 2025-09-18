'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录全局错误
    console.error('Global application error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center border border-red-200">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              系统出现严重错误
            </h1>
            
            <p className="text-gray-600 mb-6">
              应用程序遇到了严重问题，需要重新启动。请联系技术支持如果问题持续存在。
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded text-left">
                <p className="text-sm text-red-900 font-mono break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-700 mt-1">
                    错误ID: {error.digest}
                  </p>
                )}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-700 cursor-pointer">
                      查看错误堆栈
                    </summary>
                    <pre className="text-xs text-red-900 mt-1 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={reset}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                尝试恢复
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                重新加载页面
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}