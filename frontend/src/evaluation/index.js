/**
 * Evaluation Framework
 * Exports evaluation functions for workspace health and quality checks
 */

export {
  evaluateBuildEnvironment,
  evaluateDependencies,
  evaluateCodeQuality,
  evaluateTelemetry,
  evaluateDeployment,
  runFullEvaluation,
  formatEvaluationReport
} from './workspaceEvaluator.js'
