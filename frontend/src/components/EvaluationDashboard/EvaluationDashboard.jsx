import { useState, useEffect } from 'react'
import { runFullEvaluation } from '../../evaluation'
import './EvaluationDashboard.css'

/**
 * EvaluationDashboard Component
 * Displays workspace evaluation results in a visual dashboard
 */
export const EvaluationDashboard = () => {
  const [evaluationResults, setEvaluationResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    runEvaluation()
  }, [])

  const runEvaluation = () => {
    setLoading(true)
    setError(null)
    
    try {
      const results = runFullEvaluation()
      setEvaluationResults(results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return '#4caf50'
      case 'warning': return '#ff9800'
      case 'fail': return '#f44336'
      default: return '#9e9e9e'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return '✓'
      case 'warning': return '⚠'
      case 'fail': return '✗'
      default: return '?'
    }
  }

  if (loading) {
    return (
      <div className="evaluation-dashboard">
        <div className="loading">Running evaluation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="evaluation-dashboard">
        <div className="error">
          <h3>Evaluation Error</h3>
          <p>{error}</p>
          <button onClick={runEvaluation}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="evaluation-dashboard">
      <div className="evaluation-header">
        <h2>Workspace Evaluation</h2>
        <button className="refresh-btn" onClick={runEvaluation}>
          🔄 Refresh
        </button>
      </div>

      <div className="evaluation-summary" style={{ borderColor: getStatusColor(evaluationResults.overallStatus) }}>
        <div className="summary-main">
          <div className="status-indicator" style={{ backgroundColor: getStatusColor(evaluationResults.overallStatus) }}>
            {getStatusIcon(evaluationResults.overallStatus)}
          </div>
          <div className="summary-text">
            <h3>Overall Status: {evaluationResults.overallStatus.toUpperCase()}</h3>
            <p>Score: {evaluationResults.summary.score}%</p>
          </div>
        </div>
        
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{evaluationResults.summary.total}</span>
            <span className="stat-label">Total Checks</span>
          </div>
          <div className="stat pass">
            <span className="stat-value">{evaluationResults.summary.passed}</span>
            <span className="stat-label">Passed</span>
          </div>
          {evaluationResults.summary.warnings > 0 && (
            <div className="stat warning">
              <span className="stat-value">{evaluationResults.summary.warnings}</span>
              <span className="stat-label">Warnings</span>
            </div>
          )}
          {evaluationResults.summary.failed > 0 && (
            <div className="stat fail">
              <span className="stat-value">{evaluationResults.summary.failed}</span>
              <span className="stat-label">Failed</span>
            </div>
          )}
        </div>

        <div className="summary-meta">
          <p>Timestamp: {new Date(evaluationResults.timestamp).toLocaleString()}</p>
          <p>Duration: {evaluationResults.duration}ms</p>
        </div>
      </div>

      <div className="evaluation-categories">
        {evaluationResults.categories.map((category, catIndex) => (
          <div 
            key={catIndex} 
            className="category-card"
            style={{ borderLeftColor: getStatusColor(category.status) }}
          >
            <div className="category-header">
              <span className="category-icon" style={{ color: getStatusColor(category.status) }}>
                {getStatusIcon(category.status)}
              </span>
              <h3>{category.name}</h3>
              <span className="category-badge" style={{ backgroundColor: getStatusColor(category.status) }}>
                {category.status}
              </span>
            </div>
            
            <div className="category-checks">
              {category.checks.map((check, checkIndex) => (
                <div key={checkIndex} className="check-item">
                  <div className="check-header">
                    <span 
                      className="check-icon" 
                      style={{ color: getStatusColor(check.status) }}
                    >
                      {getStatusIcon(check.status)}
                    </span>
                    <span className="check-name">{check.name}</span>
                    {check.value && (
                      <span className="check-value">{check.value}</span>
                    )}
                  </div>
                  <p className="check-message">{check.message}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
