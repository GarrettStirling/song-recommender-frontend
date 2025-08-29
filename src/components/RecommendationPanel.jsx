import { useState } from 'react'
import './RecommendationPanel.css'
import RecommendationControls from './RecommendationControls'

const RecommendationPanel = ({ accessToken, onLogout }) => {
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [numRecommendations, setNumRecommendations] = useState(30)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [audioElements, setAudioElements] = useState({})

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

  const generateMLRecommendations = async (userControls) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/recommendations/ml-recommendations?token=${accessToken}&n_recommendations=${numRecommendations}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userControls)
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to get ML recommendations')
      }
      
      const data = await response.json()
      setRecommendations(data.recommendations || [])
      console.log('ML Recommendations generated:', data.recommendations?.length)
      console.log('User profile:', data.user_profile)
    } catch (error) {
      console.error('Error getting ML recommendations:', error)
      alert('Failed to get recommendations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const openSpotifyTrack = (url) => {
    window.open(url, '_blank')
  }

  const handlePlayPreview = (trackId) => {
    console.log('=== PLAY BUTTON CLICKED ===')
    console.log('Track ID:', trackId)
    
    const track = recommendations.find(t => t.id === trackId)
    if (!track) {
      console.log('Track not found')
      return
    }
    
    // Stop any currently playing audio
    if (currentlyPlaying && audioElements[currentlyPlaying]) {
      audioElements[currentlyPlaying].pause()
      audioElements[currentlyPlaying].currentTime = 0
    }
    
    // If clicking the same track that's playing, just stop it
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null)
      return
    }
    
    // If track has preview URL, play it
    if (track.preview_url) {
      let audio = audioElements[trackId]
      if (!audio) {
        audio = new Audio(track.preview_url)
        audio.volume = 0.7
        audio.addEventListener('ended', () => {
          setCurrentlyPlaying(null)
        })
        setAudioElements(prev => ({ ...prev, [trackId]: audio }))
      }
      audio.play().then(() => {
        setCurrentlyPlaying(trackId)
      }).catch(error => {
        console.error('Error playing audio:', error)
      })
    } else {
      // No preview available, just show embed (do not open Spotify)
      setCurrentlyPlaying(trackId)
    }
  }

  return (
    <div className="recommendation-panel">
      <div className="logout-container">
        <button className="logout-btn minimal" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* ML Recommendation Controls */}
      <RecommendationControls 
        onGenerateRecommendations={generateMLRecommendations}
        isLoading={isLoading}
        numRecommendations={numRecommendations}
        setNumRecommendations={setNumRecommendations}
      />

      {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
      {!isLoading && recommendations.length > 0 && (
        <div className="recommendations-list-outer">
          {/* Removed header as requested */}
          <div className="tracks-grid">
            {recommendations.map((track) => {
              console.log('=== TRACK DEBUG ===')
              console.log('Track:', track.name, 'by', track.artist)
              console.log('Preview URL:', track.preview_url)
              console.log('Preview URL type:', typeof track.preview_url)
              console.log('Preview URL truthy:', !!track.preview_url)
              console.log('Track object:', track)
              console.log('==================')
              return (
                <div key={track.id} className="track-card">
                  <div className="track-album-cover">
                    {track.album_cover ? (
                      <img src={track.album_cover} alt={track.album} />
                    ) : (
                      <div className="album-placeholder" />
                    )}
                    {/* Play button overlaying the album cover in top left */}
                    <button 
                      className={`play-button-overlay ${currentlyPlaying === track.id ? 'playing' : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handlePlayPreview(track.id)
                      }}
                      type="button"
                      title={track.preview_url ? (currentlyPlaying === track.id ? 'Stop preview' : 'Play preview') : 'Play in Spotify'}
                    >
                      {currentlyPlaying === track.id ? '⏸' : '▷'}
                    </button>
                  </div>
                  <div className="track-info">
                    <h4 
                      className="track-name clickable"
                      onClick={() => openSpotifyTrack(track.external_url)}
                    >
                      {track.name}
                    </h4>
                    <p 
                      className="track-artist clickable"
                      onClick={() => openSpotifyTrack(`https://open.spotify.com/search/${encodeURIComponent(track.artist)}`)}
                      title="View artist on Spotify"
                    >
                      {track.artist}
                    </p>
                  </div>
                  {/* Show Spotify embed if no preview_url and currentlyPlaying === track.id */}
                  {currentlyPlaying === track.id && !track.preview_url && (
                    <iframe
                      title={`Spotify Embed: ${track.name}`}
                      src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0&autoplay=1`}
                      width="100%"
                      height="80"
                      style={{ minHeight: '80px', borderRadius: '8px', marginTop: '8px' }}
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecommendationPanel