// OpenTelemetry tracing disabled to prevent startup timeouts.
// Enable later only when OTEL_EXPORTER_OTLP_ENDPOINT is configured.
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log('[INFO] Tracing is disabled in code. Remove stub to enable tracing.');
} else {
    console.log('[INFO] Tracing disabled (OTEL_EXPORTER_OTLP_ENDPOINT not set)');
}

