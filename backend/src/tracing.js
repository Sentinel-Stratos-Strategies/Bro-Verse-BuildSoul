import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const serviceName = process.env.OTEL_SERVICE_NAME || 'broverse-backend';
const exporterUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

const sdk = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName
    }),
    traceExporter: new OTLPTraceExporter({ url: exporterUrl }),
    instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start().catch((error) => {
    console.error('Tracing initialization error', error);
});

const shutdown = async () => {
    try {
        await sdk.shutdown();
    } catch (error) {
        console.error('Tracing shutdown error', error);
    }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
