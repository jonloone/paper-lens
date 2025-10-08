/**
 * Generative UI Components for TiSQL Agent
 *
 * These components can be rendered by the AI agent in chat responses
 * to provide rich, interactive experiences beyond plain text.
 *
 * Usage with CopilotKit:
 * - Use `useCopilotAction` with `render` parameter
 * - Return component JSX from action handlers
 * - Components automatically appear in chat
 */

export { SQLResultPreview } from './SQLResultPreview';
export type { SQLResultPreviewProps } from './SQLResultPreview';

export { TableSchemaExplorer } from './TableSchemaExplorer';
export type { TableSchemaExplorerProps } from './TableSchemaExplorer';

export { QueryOptimizationCard } from './QueryOptimizationCard';
export type { QueryOptimizationCardProps } from './QueryOptimizationCard';

export { CostEstimationCard } from './CostEstimationCard';
export type { CostEstimationCardProps } from './CostEstimationCard';
