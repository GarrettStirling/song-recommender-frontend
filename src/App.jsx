import { useState, useEffect } from 'react'
import SpotifyAuth from './components/SpotifyAuth'
import RecommendationPanel from './components/RecommendationPanel'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState(null)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Check URL parameters for OAuth callback
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('access_token')
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success && token) {
      setAccessToken(token)
      setIsAuthenticated(true)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      setAuthError('Authentication failed. Please try again.')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleAuthSuccess = (token) => {
    setAccessToken(token)
    setIsAuthenticated(true)
    setAuthError(null)
  }

  const handleLogout = () => {
    setAccessToken(null)
    setIsAuthenticated(false)
    setAuthError(null)
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Music Recommender</h1>
      </header>

      <main className="app-main">
        {authError && (
          <div className="error-message">
            {authError}
            <button onClick={() => setAuthError(null)}>Dismiss</button>
          </div>
        )}
        
        {!isAuthenticated ? (
          <SpotifyAuth onAuthSuccess={handleAuthSuccess} />
        ) : (
          <RecommendationPanel 
            accessToken={accessToken} 
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  )
}

export default App