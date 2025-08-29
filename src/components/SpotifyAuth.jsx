import { useState } from 'react'
import './SpotifyAuth.css'

const SpotifyAuth = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    
    try {
      // Redirect to your FastAPI backend's Spotify login endpoint
      window.location.href = 'http://127.0.0.1:8000/auth/login'
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="spotify-auth" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#181818', paddingTop: '0', marginTop: '-5rem'}}>
      <button 
        className="spotify-login-btn"
        onClick={handleLogin}
        disabled={isLoading}
      >
        <span style={{fontFamily: 'monospace', fontSize: '1rem'}}>
          {isLoading ? 'Connecting...' : 'Connect with Spotify'}
        </span>
      </button>
    </div>
  )
}

export default SpotifyAuth