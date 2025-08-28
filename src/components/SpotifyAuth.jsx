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
    <div className="spotify-auth">
      <div className="auth-card">
        <div className="spotify-logo">
          <img 
            src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_CMYK_Green.png" 
            alt="Spotify" 
            width="120"
          />
        </div>
        
        <h2>Connect Your Spotify Account</h2>
        <p>We need access to your Spotify account to analyze your music taste and generate personalized recommendations.</p>
        
        <ul className="permissions-list">
          <li>✓ Read your top tracks and artists</li>
          <li>✓ Access your playlists</li>
          <li>✓ View your listening history</li>
        </ul>

        <button 
          className="spotify-login-btn"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect with Spotify'}
        </button>
        
        <p className="privacy-note">
          Your data is only used to generate recommendations and is not stored permanently.
        </p>
      </div>
    </div>
  )
}

export default SpotifyAuth