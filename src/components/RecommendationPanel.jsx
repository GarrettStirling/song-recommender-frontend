import { useState, useEffect } from 'react'
import './RecommendationPanel.css'
import RecommendationControls from './RecommendationControls'

const RecommendationPanel = ({ accessToken, onLogout }) => {
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [numRecommendations, setNumRecommendations] = useState(30)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [currentlyLoading, setCurrentlyLoading] = useState(null)
  const [playbackError, setPlaybackError] = useState(null)
  const [youtubePlayer, setYoutubePlayer] = useState(null)
  const [playbackPositions, setPlaybackPositions] = useState({}) // Track where each song was paused
  const [nowPlayingData, setNowPlayingData] = useState(null) // Store data for now-playing popup
  const [collectionInfo, setCollectionInfo] = useState(null)
  const [showCollectionWarning, setShowCollectionWarning] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [generationCount, setGenerationCount] = useState(0) // Track how many times recs were generated
  const [cachedRecommendations, setCachedRecommendations] = useState([]) // Cache extra recommendations
  const [usedTrackIds, setUsedTrackIds] = useState(new Set()) // Track all previously shown tracks

  // Cleanup YouTube player on unmount
  useEffect(() => {
    return () => {
      const existingIframe = document.getElementById('youtube-player')
      if (existingIframe) {
        existingIframe.remove()
      }
    }
  }, [])

  // Check collection size when component mounts
  useEffect(() => {
    if (accessToken) {
      checkCollectionSize()
    }
  }, [accessToken])

  // Clear cache when number of recommendations changes
  useEffect(() => {
    setCachedRecommendations([])
    setUsedTrackIds(new Set())
    setGenerationCount(0)
    console.log('🗑️ Cache cleared due to settings change')
  }, [numRecommendations])

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
      // Check if we have cached recommendations for instant display
      if (generationCount > 0 && cachedRecommendations.length >= numRecommendations) {
        console.log(`🚀 Using cached recommendations (generation #${generationCount + 1})`)
        
        // Get fresh recommendations from cache (excluding already used ones)
        const availableCached = cachedRecommendations.filter(track => !usedTrackIds.has(track.id))
        
        if (availableCached.length >= numRecommendations) {
          const newRecommendations = availableCached.slice(0, numRecommendations)
          const newUsedIds = new Set([...usedTrackIds, ...newRecommendations.map(t => t.id)])
          
          setRecommendations(newRecommendations)
          setUsedTrackIds(newUsedIds)
          setGenerationCount(prev => prev + 1)
          
          // Remove used recommendations from cache
          setCachedRecommendations(prev => prev.filter(track => !newRecommendations.find(nr => nr.id === track.id)))
          
          console.log(`✅ Instant generation complete! ${newRecommendations.length} fresh tracks`)
          setIsLoading(false)
          return
        }
      }
      
      // Show progress message for feature analysis
      console.log(`Starting feature analysis of your musical taste...`)
      console.log(`User preferences:`, userControls)
      console.log(`Generation #${generationCount + 1} ${generationCount > 0 ? '(with variation)' : '(initial)'}`)
      if (collectionInfo && collectionInfo.category === 'power_user') {
        console.log(`Large collection detected (${collectionInfo.total_saved_tracks.toLocaleString()} songs) - this may take a moment...`)
      }
      
      // Request extra recommendations for caching (3x-5x more than needed)
      const cacheMultiplier = numRecommendations <= 10 ? 5 : numRecommendations <= 20 ? 4 : 3
      const requestedCount = Math.min(numRecommendations * cacheMultiplier, 50) // Max 50 due to API limits
      
      console.log(`🎯 Requesting ${requestedCount} tracks (${numRecommendations} to show + ${requestedCount - numRecommendations} to cache)`)
      
      // Prepare excluded track IDs for the API
      const excludedIdsParam = usedTrackIds.size > 0 ? Array.from(usedTrackIds).join(',') : ''
      
      const response = await fetch(
        `http://127.0.0.1:8000/recommendations/search-based-discovery?token=${accessToken}&n_recommendations=${requestedCount}&energy=${userControls.energy || 50}&instrumentalness=${userControls.instrumentalness || 50}&generation_seed=${generationCount}${excludedIdsParam ? `&exclude_track_ids=${excludedIdsParam}` : ''}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to get ML recommendations')
      }
      
      const data = await response.json()
      const allRecommendations = data.recommendations || []
      
      // Debug logging to see what data we're getting
      console.log('🔍 First few recommendations received:', allRecommendations.slice(0, 3).map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artist,
        discovery_method: track.discovery_method
      })))
      
      // Filter out any tracks we've already shown
      const freshRecommendations = allRecommendations.filter(track => !usedTrackIds.has(track.id))
      
      if (freshRecommendations.length < numRecommendations) {
        console.warn(`⚠️ Only ${freshRecommendations.length} fresh tracks found, some may be repeats`)
      }
      
      // Take what we need to display now
      const currentBatch = freshRecommendations.slice(0, numRecommendations)
      
      // Cache the remaining for future generations
      const remainingForCache = freshRecommendations.slice(numRecommendations)
      
      // Update state
      setRecommendations(currentBatch)
      setCachedRecommendations(prev => [...prev, ...remainingForCache])
      
      // Track all shown track IDs
      const newUsedIds = new Set([...usedTrackIds, ...currentBatch.map(t => t.id)])
      setUsedTrackIds(newUsedIds)
      setGenerationCount(prev => prev + 1)
      
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
        console.log(`📊 ANALYZED ${data.total_candidates_analyzed} candidate tracks with ML`)
      }
      
      console.log(`✅ Generated ${currentBatch.length} recommendations (${remainingForCache.length} cached for next time)`)
      console.log(`💾 Total cached: ${cachedRecommendations.length + remainingForCache.length} | Used so far: ${newUsedIds.size}`)
      
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

  const handlePlayTrack = async (trackId) => {
    const track = recommendations.find(t => t.id === trackId)
    if (!track) {
      return
    }
    
    // Clear any previous error
    setPlaybackError(null)
    
    // If clicking the same track that's playing, pause it
    if (currentlyPlaying === trackId) {
      if (youtubePlayer) {
        youtubePlayer.pauseVideo()
      }
      setCurrentlyPlaying(null)
      setNowPlayingData(null)
      return
    }
    
    // If we already have YouTube data for this track, resume playback
    if (playbackPositions[trackId] && playbackPositions[trackId].videoId) {
      console.log(`▶️ Resuming "${track.name}" from where it was paused`)
      const position = playbackPositions[trackId]
      
      if (!youtubePlayer) {
        createYouTubePlayer(position.videoId, trackId, position.currentTime)
      } else {
        youtubePlayer.loadVideoById(position.videoId, position.currentTime)
        setCurrentlyPlaying(trackId)
      }
      setNowPlayingData(track)
      return
    }
    
    // Show loading state immediately
    setCurrentlyLoading(trackId)
    
    try {
      // Stop any currently playing track
      if (youtubePlayer && currentlyPlaying) {
        youtubePlayer.pauseVideo()
      }
      
      console.log(`🎵 Searching YouTube for: "${track.name}" by "${track.artist}"`)
      
      // Get YouTube URL for this track
      const response = await fetch(`http://localhost:8000/get-youtube-url?track_name=${encodeURIComponent(track.name)}&artist_name=${encodeURIComponent(track.artist)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 404) {
        // No reliable YouTube match found - show error instead of opening Spotify
        console.log('❌ No reliable YouTube match found')
        setCurrentlyLoading(null)
        setPlaybackError(trackId)
        setTimeout(() => setPlaybackError(null), 3000) // Clear error after 3 seconds
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to get YouTube URL')
      }
      
      const data = await response.json()
      
      if (data.success && data.youtube_data) {
        console.log(`✅ YouTube match found: "${data.youtube_data.title}" (confidence: ${data.youtube_data.confidence})`)
        
        // Store video ID for future resume
        setPlaybackPositions(prev => ({
          ...prev,
          [trackId]: {
            videoId: data.youtube_data.video_id,
            currentTime: 30 // Default start time
          }
        }))
        
        // Create or update YouTube player
        const videoId = data.youtube_data.video_id
        
        if (!youtubePlayer) {
          // Initialize YouTube player
          createYouTubePlayer(videoId, trackId, 30)
        } else {
          // Load new video in existing player
          youtubePlayer.loadVideoById(videoId, 30)
          setCurrentlyPlaying(trackId)
        }
        
        // Set now playing data for popup
        setNowPlayingData(track)
        
        // Clear loading state after a short delay
        setTimeout(() => {
          setCurrentlyLoading(null)
        }, 1500)
        
      } else {
        // Show error if YouTube data is invalid
        console.log('❌ Invalid YouTube data')
        setCurrentlyLoading(null)
        setPlaybackError(trackId)
        setTimeout(() => setPlaybackError(null), 3000)
      }
      
    } catch (error) {
      console.error('Error playing track:', error)
      // Show error on any failure
      console.log('❌ Error occurred during playback')
      setCurrentlyLoading(null)
      setPlaybackError(trackId)
      setTimeout(() => setPlaybackError(null), 3000)
    }
  }
  
  const createYouTubePlayer = (videoId, trackId, startTime = 30) => {
    // Remove existing player if any
    const existingIframe = document.getElementById('youtube-player')
    if (existingIframe) {
      existingIframe.remove()
    }
    
    // Create hidden YouTube iframe for audio playback with optimizations
    const iframe = document.createElement('iframe')
    iframe.id = 'youtube-player'
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&enablejsapi=1&start=${startTime}&iv_load_policy=3&playsinline=1&widget_referrer=${window.location.origin}`
    iframe.style.display = 'none'
    iframe.allow = 'autoplay'
    iframe.width = '0'
    iframe.height = '0'
    iframe.loading = 'eager' // Prioritize loading
    
    // Add preconnect for faster YouTube loading
    if (!document.querySelector('link[href*="youtube.com"]')) {
      const preconnect1 = document.createElement('link')
      preconnect1.rel = 'preconnect'
      preconnect1.href = 'https://www.youtube.com'
      document.head.appendChild(preconnect1)
      
      const preconnect2 = document.createElement('link')
      preconnect2.rel = 'preconnect'
      preconnect2.href = 'https://i.ytimg.com'
      document.head.appendChild(preconnect2)
    }
    
    document.body.appendChild(iframe)
    
    setCurrentlyPlaying(trackId)
    
    // Store reference for later control
    setYoutubePlayer({
      pauseVideo: () => {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
        // Note: We can't get current time from iframe due to security restrictions
        // This is a limitation of the iframe approach
      },
      stopVideo: () => {
        iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*')
      },
      loadVideoById: (newVideoId, newStartTime = 30) => {
        iframe.src = `https://www.youtube.com/embed/${newVideoId}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&enablejsapi=1&start=${newStartTime}&iv_load_policy=3&playsinline=1&widget_referrer=${window.location.origin}`
        setCurrentlyPlaying(trackId)
      },
      destroy: () => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
        setYoutubePlayer(null)
        setCurrentlyPlaying(null)
      }
    })
    
    // Add loading feedback
    console.log(`🎵 Starting playback from ${startTime}s into the track...`)
  }
  
  const handleControlsChange = (newControls) => {
    // Reset cache when controls change so next generation starts fresh
    console.log('🔄 Controls changed, resetting cache for fresh generation')
    setCachedRecommendations([])
    setUsedTrackIds(new Set())
    setGenerationCount(0)
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
        generationCount={generationCount}
        cachedCount={cachedRecommendations.length}
        onControlsChange={handleControlsChange}
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
          {/* View Toggle Button - Top Right */}
          <div className="recommendations-header">
            <button 
              className="view-toggle-btn"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? '☰' : '⊞'}
            </button>
          </div>
          
          <div className={viewMode === 'grid' ? 'tracks-grid' : 'tracks-list'}>
            {recommendations.map((track) => {
              // Debug logging for display issues
              if (track.name === 'Indie' || !track.name || track.name.length < 3) {
                console.warn('🐛 Suspicious track data:', track)
              }
              return (
                <div key={track.id} className={`track-card ${viewMode === 'list' ? 'track-card-list' : 'track-card-grid'}`}>
                  <div className="track-album-cover">
                    {track.album_cover ? (
                      <img src={track.album_cover} alt={track.album} />
                    ) : (
                      <div className="album-placeholder" />
                    )}
                    {/* Play button overlaying the album cover */}
                    <button 
                      className={`play-button-overlay ${currentlyPlaying === track.id ? 'playing' : ''} ${currentlyLoading === track.id ? 'loading' : ''} ${playbackError === track.id ? 'error' : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handlePlayTrack(track.id)
                      }}
                      type="button"
                      title={
                        playbackError === track.id
                          ? 'Track not available on YouTube'
                          : currentlyLoading === track.id 
                            ? 'Loading...' 
                            : currentlyPlaying === track.id 
                              ? 'Pause' 
                              : 'Play'
                      }
                    >
                      {playbackError === track.id ? '❌' : currentlyLoading === track.id ? '⏳' : currentlyPlaying === track.id ? '⏸' : '▷'}
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
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Now Playing Popup */}
      {nowPlayingData && (
        <div className="now-playing-popup">
          <div className="now-playing-content">
            <div className="now-playing-info">
              <img 
                src={nowPlayingData.album_cover} 
                alt={`${nowPlayingData.album} cover`}
                className="now-playing-cover"
              />
              <div className="now-playing-text">
                <div className="now-playing-track">{nowPlayingData.name}</div>
                <div className="now-playing-artist">{nowPlayingData.artist}</div>
              </div>
            </div>
            <div className="now-playing-controls">
              <button 
                className="now-playing-play-btn"
                onClick={() => handlePlayTrack(nowPlayingData.id)}
                title={currentlyPlaying ? 'Pause' : 'Play'}
              >
                {currentlyPlaying ? '⏸' : '▷'}
              </button>
              <button 
                className="now-playing-close-btn"
                onClick={() => {
                  if (youtubePlayer) {
                    youtubePlayer.pauseVideo()
                  }
                  setCurrentlyPlaying(null)
                  setNowPlayingData(null)
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecommendationPanel