# BroVerse Evaluation Framework

A comprehensive workspace evaluation system for assessing the health, quality, and status of the BroVerse application.

## Overview

The evaluation framework provides automated checks across multiple categories:

- **Build Environment**: Validates Node.js version, Vite configuration, and environment variables
- **Dependencies**: Checks core dependencies and their versions
- **Code Quality**: Evaluates ESLint configuration, component organization, and routing setup
- **Telemetry & Monitoring**: Verifies Application Insights setup and tracking configuration
- **Deployment**: Validates Azure Static Web Apps configuration and CI/CD pipeline

## Usage

### Command Line

Run the evaluation from the terminal:

```bash
npm run evaluate
```

This will:
1. Execute all evaluation checks
2. Generate a detailed console report
3. Exit with appropriate status code (0 for success, 1 for failures)

### Web Dashboard

Access the evaluation dashboard in the application:

1. Start the development server: `npm run dev`
2. Navigate to `/evaluation` in your browser
3. View real-time evaluation results with visual indicators
4. Click "Refresh" to re-run evaluation checks

### Programmatic Usage

Import and use evaluation functions in your code:

```javascript
import { runFullEvaluation, formatEvaluationReport } from './evaluation'

// Run all checks
const results = runFullEvaluation()

// Format for console output
const report = formatEvaluationReport(results)
console.log(report)

// Access specific categories
import { 
  evaluateBuildEnvironment,
  evaluateDependencies,
  evaluateCodeQuality,
  evaluateTelemetry,
  evaluateDeployment
} from './evaluation'

const buildChecks = evaluateBuildEnvironment()
```

## Evaluation Results

Each evaluation produces:

- **Overall Status**: pass, warning, or fail
- **Score**: Percentage of checks passed (0-100%)
- **Summary**: Total, passed, warning, and failed check counts
- **Timestamp**: When the evaluation was run
- **Duration**: How long the evaluation took (in milliseconds)
- **Category Details**: Detailed results for each evaluation category

### Status Levels

- **✓ Pass**: Check completed successfully, no issues
- **⚠ Warning**: Check completed but found non-critical issues
- **✗ Fail**: Check failed, critical issue detected

## Extending the Framework

To add new evaluation checks:

1. Open `src/evaluation/workspaceEvaluator.js`
2. Create a new evaluation function following the pattern:

```javascript
export const evaluateYourCategory = () => {
  const checks = {
    name: 'Your Category',
    status: 'pass',
    checks: []
  }

  // Add individual checks
  checks.checks.push({
    name: 'Check Name',
    status: 'pass', // or 'warning' or 'fail'
    message: 'Description of the check result',
    value: 'Optional value',
    required: true // Optional flag
  })

  // Update overall status based on checks
  const hasFailures = checks.checks.some(c => c.status === 'fail')
  const hasWarnings = checks.checks.some(c => c.status === 'warning')
  checks.status = hasFailures ? 'fail' : (hasWarnings ? 'warning' : 'pass')

  return checks
}
```

3. Add your function to the `runFullEvaluation` categories array
4. Export your function from `src/evaluation/index.js`

## CI/CD Integration

The evaluation framework can be integrated into CI/CD pipelines:

```yaml
- name: Run Workspace Evaluation
  working-directory: frontend
  run: npm run evaluate
```

The command will exit with code 1 if any critical failures are detected, causing the pipeline to fail.

## Architecture

```
frontend/
├── src/
│   └── evaluation/
│       ├── index.js                      # Main exports
│       └── workspaceEvaluator.js        # Core evaluation logic
├── scripts/
│   └── evaluate.js                      # CLI script
└── components/
    └── EvaluationDashboard/            # React UI component
        ├── EvaluationDashboard.jsx
        ├── EvaluationDashboard.css
        └── index.js
```

## Benefits

- **Early Detection**: Identify issues before they reach production
- **Visibility**: Clear insight into workspace health
- **Automation**: Integrate with CI/CD for continuous validation
- **Documentation**: Self-documenting system requirements
- **Onboarding**: Help new team members understand the setup

## Future Enhancements

Potential additions to the evaluation framework:

- Performance metrics evaluation
- Security vulnerability scanning
- Accessibility checks
- Bundle size analysis
- Test coverage reporting
- API endpoint health checks
- Database connection validation
