import { EvaluationDashboard } from '../components/EvaluationDashboard'

/**
 * EvaluationPage
 * Dedicated page for workspace evaluation
 */
export const EvaluationPage = () => {
  return (
    <div className="evaluation-page">
      <div className="page-header">
        <h1>Workspace Evaluation</h1>
        <p className="page-description">
          Comprehensive health check and quality assessment of the BroVerse workspace
        </p>
      </div>
      <EvaluationDashboard />
    </div>
  )
}
