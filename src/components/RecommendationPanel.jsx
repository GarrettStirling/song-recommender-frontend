import { useState, useEffect } from 'react'
import './RecommendationPanel.css'
import RecommendationControls from './RecommendationControls'

const RecommendationPanel = ({ accessToken, onLogout }) => {
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [numRecommendations, setNumRecommendations] = useState(30)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [audioElements, setAudioElements] = useState({})
  const [collectionInfo, setCollectionInfo] = useState(null)
  const [showCollectionWarning, setShowCollectionWarning] = useState(false)

  // Check collection size when component mounts
  useEffect(() => {
    if (accessToken) {
      checkCollectionSize()
    }
  }, [accessToken])

  const checkCollectionSize = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/recommendations/collection-size?token=${accessToken}`)
      if (response.ok) {
        const data = await response.json()
        setCollectionInfo(data)
        if (data.warning) {
          setShowCollectionWarning(true)
        }
      }
    } catch (error) {
      console.log('Could not check collection size:', error)
    }
  }

  const generateRecommendations = async (userControls = {}) => {
    setIsLoading(true)
    setShowCollectionWarning(false) // Hide warning when starting
    
    try {
      // Show progress message for feature analysis
      console.log(`Starting feature analysis of your musical taste...`)
      console.log(`User preferences:`, userControls)
      if (collectionInfo && collectionInfo.category === 'power_user') {
        console.log(`Large collection detected (${collectionInfo.total_saved_tracks.toLocaleString()} songs) - this may take a moment...`)
      }
      
      const response = await fetch(
        `http://127.0.0.1:8000/recommendations/search-based-discovery?token=${accessToken}&n_recommendations=${numRecommendations}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to get ML recommendations')
      }
      
      const data = await response.json()
      
      // Log ML analysis results to browser console
      if (data.execution_time_seconds) {
        console.log(`🚀 ML ANALYSIS COMPLETE: ${data.execution_time_seconds.toFixed(2)}s`)
      }
      if (data.algorithm) {
        console.log(`🧠 ALGORITHM USED: ${data.algorithm}`)
      }
      if (data.user_profile) {
        console.log(`🎯 YOUR MUSICAL TASTE PROFILE:`, data.user_profile.preferences)
      }
      if (data.total_candidates_analyzed) {
        console.log(`� ANALYZED ${data.total_candidates_analyzed} candidate tracks with ML`)
      }
      
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error('Error getting ML recommendations:', error)
      alert('Failed to get ML recommendations. Please try again.')
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

      {/* Collection Size Warning - Moved above and made minimal */}
      {showCollectionWarning && collectionInfo && collectionInfo.warning && (
        <div className="collection-warning-minimal" style={{
          background: '#2d2d2d',
          color: '#fff',
          padding: '12px 16px',
          margin: '0 0 16px 0',
          borderRadius: '8px',
          border: '2px solid #ff6b35',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Large collection detected ({collectionInfo.total_saved_tracks?.toLocaleString()} songs) - processing may take 15-25 seconds</span>
            <button 
              onClick={() => setShowCollectionWarning(false)}
              style={{
                background: 'transparent',
                border: '1px solid #666',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Recommendation Controls */}
      <RecommendationControls 
        onGenerateRecommendations={generateRecommendations}
        isLoading={isLoading}
        numRecommendations={numRecommendations}
        setNumRecommendations={setNumRecommendations}
        collectionInfo={collectionInfo}
      />

      {isLoading && (
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner-small"></div>
            <span className="loading-text">Processing...</span>
          </div>
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