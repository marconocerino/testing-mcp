/**
 * Turns off CopilotKit's anonymous telemetry before the runtime loads (E5-S4: no traffic to
 * CopilotKit or other external services). Import this first. The Dockerfile sets the same
 * variables, so the setting holds however the service starts.
 */
process.env['COPILOTKIT_TELEMETRY_DISABLED'] = 'true';
process.env['DO_NOT_TRACK'] = 'true';
