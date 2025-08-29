import React, { useState } from 'react';
import './RecommendationControls.css';

const RecommendationControls = ({ onGenerateRecommendations, isLoading, numRecommendations, setNumRecommendations }) => {
  const [controls, setControls] = useState({
    popularity: 50,     // 0=underground, 100=mainstream
    energy: 50,         // 0=chill, 100=energetic
    instrumentalness: 50 // 0=vocal, 100=instrumental
  });

  const handleSliderChange = (controlType, value) => {
    setControls(prev => ({
      ...prev,
      [controlType]: parseInt(value)
    }));
  };

  const handleGenerate = () => {
    onGenerateRecommendations(controls);
  };

  return (
    <div className="recommendation-controls">
      <h3>Personalized Recommendations</h3>
      <p className="controls-description">
        Fine-tune your music taste preferences using analysis of your listening history
      </p>
      
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Popularity
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={controls.popularity}
            onChange={(e) => handleSliderChange('popularity', e.target.value)}
            className="control-slider popularity-slider"
          />
          <div className="slider-labels">
            <span>Underground</span>
            <span>Mainstream</span>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Energy
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={controls.energy}
            onChange={(e) => handleSliderChange('energy', e.target.value)}
            className="control-slider energy-slider"
          />
          <div className="slider-labels">
            <span>Chill</span>
            <span>High Energy</span>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Instrumentalness
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={controls.instrumentalness}
            onChange={(e) => handleSliderChange('instrumentalness', e.target.value)}
            className="control-slider instrumental-slider"
          />
          <div className="slider-labels">
            <span>Vocal Heavy</span>
            <span>Instrumental</span>
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
              Analyzing Your Taste...
            </>
          ) : (
            <>
              Generate Recommendations
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
