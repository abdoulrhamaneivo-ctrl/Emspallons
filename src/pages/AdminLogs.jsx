import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Button } from '../components/ui'
import logger, { LogLevel } from '../lib/logger'
import { Download, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageTransition from '../components/ui/PageTransition'

export default function AdminLogs() {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!isAdmin) return

    // Rafraîchir les logs toutes les 5 secondes
    const interval = setInterval(() => {
      const allLogs = logger.getLogs()
      setLogs([...allLogs].reverse()) // Plus récents en premier
    }, 5000)

    // Charger immédiatement
    const allLogs = logger.getLogs()
    setLogs([...allLogs].reverse())

    return () => clearInterval(interval)
  }, [isAdmin])

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter)

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Accès réservé aux administrateurs</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageTransition>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
                Logs Système
              </h1>
              <p className="text-gray-600 mt-1">
                Consultez les logs de l'application en temps réel
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => logger.exportLogs()}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download size={18} />
                Exporter les logs
              </Button>
              <Button 
                onClick={() => {
                  logger.clear()
                  setLogs([])
                }} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 size={18} />
                Nettoyer
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 flex-wrap">
            {['all', LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === level 
                    ? 'bg-emsp-yellow text-emsp-green' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {level === 'all' ? 'TOUS' : level.toUpperCase()}
                {level !== 'all' && (
                  <span className="ml-2 text-xs">
                    ({logs.filter(l => l.level === level).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Erreurs</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.level === LogLevel.ERROR).length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Avertissements</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter(l => l.level === LogLevel.WARN).length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Infos</p>
              <p className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.level === LogLevel.INFO).length}
              </p>
            </div>
          </div>

          {/* Liste des logs */}
          <div className="bg-black text-white p-4 rounded-lg font-mono text-sm h-[600px] overflow-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Aucun log à afficher
              </div>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className="mb-2 border-b border-gray-800 pb-2 last:border-0">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                      log.level === LogLevel.ERROR ? 'bg-red-900 text-red-200' :
                      log.level === LogLevel.WARN ? 'bg-yellow-900 text-yellow-200' :
                      log.level === LogLevel.INFO ? 'bg-blue-900 text-blue-200' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                  {log.data && (
                    <div className="ml-4 mt-1 text-gray-400 text-xs">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.stack && log.level === LogLevel.ERROR && (
                    <div className="ml-4 mt-1 text-red-400 text-xs">
                      <pre className="whitespace-pre-wrap break-words max-h-32 overflow-auto">
                        {log.stack}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">ℹ️ Information</p>
            <p>
              Les logs sont stockés en mémoire et limités à 100 entrées. 
              En production, les erreurs sont également envoyées à un service externe (Sentry).
            </p>
          </div>
        </div>
      </PageTransition>
    </Layout>
  )
}

