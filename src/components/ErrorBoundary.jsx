import React from 'react'
import { AlertTriangle, Home, Mail, RefreshCw } from 'lucide-react'
import { Button } from './ui'
import { useNavigate } from 'react-router-dom'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })

    // Optionnel : envoyer l'erreur à un service de logging
    if (import.meta.env.PROD) {
      // Exemple : envoyer à Sentry, LogRocket, etc.
      // logErrorToService(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReportError = () => {
    const { error, errorInfo } = this.state
    const errorReport = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }

    // Créer un mailto avec les détails de l'erreur
    const subject = encodeURIComponent(`Erreur EMSP Transport - ${error?.message || 'Erreur inconnue'}`)
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `J'ai rencontré une erreur dans l'application EMSP Transport Scolaire.\n\n` +
      `Détails de l'erreur :\n` +
      `${JSON.stringify(errorReport, null, 2)}\n\n` +
      `Merci de votre aide.\n\n` +
      `Cordialement`
    )
    window.location.href = `mailto:support@emsp.ci?subject=${subject}&body=${body}`
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emsp-green/5 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-600" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Oups ! Une erreur est survenue
              </h1>
              <p className="text-gray-600">
                Désolé, quelque chose s'est mal passé. Notre équipe a été notifiée.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                <details className="cursor-pointer">
                  <summary className="font-semibold text-gray-700 mb-2">
                    Détails de l'erreur (mode développement)
                  </summary>
                  <pre className="text-xs text-red-600 overflow-auto max-h-64 mt-2">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => {
                  this.handleReset()
                  window.location.href = '/dashboard'
                }}
                className="flex items-center justify-center gap-2"
              >
                <Home size={20} />
                Retour à l'accueil
              </Button>
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Réessayer
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleReportError}
                className="flex items-center justify-center gap-2"
              >
                <Mail size={20} />
                Signaler l'erreur
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Si le problème persiste, contactez le support technique.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

