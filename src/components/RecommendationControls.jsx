import React, { useState } from 'react';
import './RecommendationControls.css';

const RecommendationControls = ({ onGenerateRecommendations, isLoading, numRecommendations, setNumRecommendations, collectionInfo, generationCount, cachedCount = 0, onControlsChange }) => {
  // Simplified controls - only keep one meaningful slider for discovery focus
  const [controls, setControls] = useState({
    discovery_focus: 50  // 0=mainstream, 100=underground/indie
  });

  const handleSliderChange = (controlType, value) => {
    const newControls = {
      ...controls,
      [controlType]: parseInt(value)
    };
    setControls(newControls);
    
    // Notify parent that controls have changed so it can reset cache
    if (onControlsChange) {
      onControlsChange(newControls);
    }
  };

  const handleGenerate = () => {
    // Convert discovery_focus to energy for backend compatibility
    const backendPreferences = {
      energy: controls.discovery_focus  // Map discovery focus to energy parameter
    };
    onGenerateRecommendations(backendPreferences);
  };

  return (
    <div className="recommendation-controls">
      <h3>Personalized Recommendations</h3>
      <p className="controls-description">
        Discover new music based on your listening history and preferences
      </p>
      
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Discovery Focus
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={controls.discovery_focus}
            onChange={(e) => handleSliderChange('discovery_focus', e.target.value)}
            className="control-slider discovery-slider"
          />
          <div className="slider-labels">
            <span>Mainstream</span>
            <span>Underground</span>
          </div>
        </div>
      </div>

      <div className="generate-section">
        <button 
          className="generate-ml-btn"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              {collectionInfo ? 
                `Analyzing ${collectionInfo.total_saved_tracks.toLocaleString()} saved tracks...` : 
                'Analyzing your music...'
              }
            </>
          ) : (
            <>
              {generationCount === 0 ? 'Generate Recommendations' : 
               cachedCount >= numRecommendations ? 'Get Next Batch (Instant)' : 
               'Generate New Variations'}
            </>
          )}
        </button>
        
        <div className="song-count-dropdown">
          <select 
            id="num-recs"
            value={numRecommendations} 
            onChange={(e) => setNumRecommendations(Number(e.target.value))}
            className="dropdown-select"
          >
            <option value={10}>10 songs</option>
            <option value={20}>20 songs</option>
            <option value={30}>30 songs</option>
            <option value={50}>50 songs</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default RecommendationControls;
