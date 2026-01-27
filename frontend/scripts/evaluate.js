#!/usr/bin/env node
/**
 * Workspace Evaluation CLI
 * Run workspace evaluation checks from command line
 */

import { runFullEvaluation, formatEvaluationReport } from '../src/evaluation/nodeEvaluator.js'

console.log('\n🔍 Starting BroVerse Workspace Evaluation...\n')

try {
  const results = runFullEvaluation()
  const report = formatEvaluationReport(results)
  
  console.log(report)

  // Exit with appropriate code
  if (results.overallStatus === 'fail') {
    console.error('❌ Evaluation FAILED - Critical issues found\n')
    process.exit(1)
  } else if (results.overallStatus === 'warning') {
    console.warn('⚠️  Evaluation completed with WARNINGS\n')
    process.exit(0) // Don't fail on warnings
  } else {
    console.log('✅ Evaluation PASSED - All checks successful!\n')
    process.exit(0)
  }
} catch (error) {
  console.error('\n❌ Evaluation failed with error:')
  console.error(error.message)
  console.error('\n')
  process.exit(1)
}
