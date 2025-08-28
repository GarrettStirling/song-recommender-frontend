import { useState } from 'react'
import './RecommendationPanel.css'

const RecommendationPanel = ({ accessToken, onLogout }) => {
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [numRecommendations, setNumRecommendations] = useState(30)

  const generateRecommendations = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/recommendations/search-based-discovery?token=${accessToken}&n_recommendations=${numRecommendations}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }
      
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error('Error getting recommendations:', error)
      alert('Failed to get recommendations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const openSpotifyTrack = (url) => {
    window.open(url, '_blank')
  }

  return (
    <div className="recommendation-panel">
      <div className="panel-header">
        <h2>🎯 Generate Music Recommendations</h2>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="num-recs">Number of recommendations:</label>
          <select 
            id="num-recs"
            value={numRecommendations} 
            onChange={(e) => setNumRecommendations(Number(e.target.value))}
          >
            <option value={10}>10 songs</option>
            <option value={20}>20 songs</option>
            <option value={30}>30 songs</option>
            <option value={50}>50 songs</option>
          </select>
        </div>

        <button 
          className="generate-btn"
          onClick={generateRecommendations}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Recommendations'}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations-list">
          <h3>🎵 Your Personalized Recommendations</h3>
          <div className="tracks-grid">
            {recommendations.map((track, index) => (
              <div key={track.id} className="track-card">
                <div className="track-number">#{index + 1}</div>
                <div className="track-info">
                  <h4 className="track-name">{track.name}</h4>
                  <p className="track-artist">{track.artist}</p>
                  <p className="track-album">{track.album}</p>
                  <p className="track-source">{track.source}</p>
                </div>
                <div className="track-actions">
                  <span className="popularity">🔥 {track.popularity}</span>
                  <button 
                    className="play-btn"
                    onClick={() => openSpotifyTrack(track.external_url)}
                  >
                    Play on Spotify
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecommendationPanel