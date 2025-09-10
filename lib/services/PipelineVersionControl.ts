import { RealNode, RealEdge, RealPipeline, SyncStatus } from '@/lib/types/RealNode';

interface PipelineVersion {
  id: string;
  pipelineId: string;
  version: string;
  timestamp: string;
  author: string;
  message: string;
  snapshot: RealPipeline;
  changes?: ChangeSet;
  tags?: string[];
  branch?: string;
}

interface ChangeSet {
  nodesAdded: RealNode[];
  nodesModified: NodeDiff[];
  nodesRemoved: string[];
  edgesAdded: RealEdge[];
  edgesModified: EdgeDiff[];
  edgesRemoved: string[];
  configChanges: ConfigDiff[];
  metadataChanges: MetadataDiff[];
}

interface NodeDiff {
  id: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'modified' | 'removed';
  }[];
  significance: 'major' | 'minor' | 'patch';
}

interface EdgeDiff {
  id: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'modified' | 'removed';
  }[];
}

interface ConfigDiff {
  nodeId: string;
  configPath: string;
  oldValue: any;
  newValue: any;
  impact: 'breaking' | 'compatible' | 'enhancement';
}

interface MetadataDiff {
  field: string;
  oldValue: any;
  newValue: any;
  category: 'schedule' | 'owner' | 'description' | 'tags';
}

interface VersioningStrategy {
  autoCommit: boolean;
  commitTriggers: ('sync' | 'manual' | 'scheduled')[];
  retentionPolicy: {
    maxVersions: number;
    maxAge: string; // ISO duration
    compactionStrategy: 'linear' | 'logarithmic';
  };
  branchingEnabled: boolean;
}

export class PipelineVersionControl {
  private versions: Map<string, PipelineVersion[]> = new Map();
  private strategy: VersioningStrategy;

  constructor(strategy: VersioningStrategy) {
    this.strategy = strategy;
  }

  /**
   * Create a new version from current pipeline state
   */
  async createVersion(
    pipeline: RealPipeline,
    message: string,
    author: string,
    options?: {
      tag?: string;
      branch?: string;
      force?: boolean;
    }
  ): Promise<PipelineVersion> {
    const pipelineVersions = this.versions.get(pipeline.id) || [];
    const previousVersion = pipelineVersions[pipelineVersions.length - 1];

    // Calculate changes from previous version
    const changes = previousVersion 
      ? this.calculateChanges(previousVersion.snapshot, pipeline)
      : undefined;

    // Generate version number
    const version = this.generateVersionNumber(pipelineVersions, changes);

    const newVersion: PipelineVersion = {
      id: `${pipeline.id}-${version}`,
      pipelineId: pipeline.id,
      version,
      timestamp: new Date().toISOString(),
      author,
      message,
      snapshot: this.createSnapshot(pipeline),
      changes,
      tags: options?.tag ? [options.tag] : undefined,
      branch: options?.branch || 'main'
    };

    // Store version
    pipelineVersions.push(newVersion);
    this.versions.set(pipeline.id, pipelineVersions);

    // Apply retention policy
    await this.applyRetentionPolicy(pipeline.id);

    return newVersion;
  }

  /**
   * Get version history for a pipeline
   */
  getVersionHistory(pipelineId: string, options?: {
    branch?: string;
    limit?: number;
    since?: string;
  }): PipelineVersion[] {
    const versions = this.versions.get(pipelineId) || [];
    
    let filtered = versions;

    // Filter by branch
    if (options?.branch) {
      filtered = filtered.filter(v => v.branch === options.branch);
    }

    // Filter by date
    if (options?.since) {
      const sinceDate = new Date(options.since);
      filtered = filtered.filter(v => new Date(v.timestamp) >= sinceDate);
    }

    // Apply limit
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered.reverse(); // Most recent first
  }

  /**
   * Get specific version
   */
  getVersion(pipelineId: string, version: string): PipelineVersion | undefined {
    const versions = this.versions.get(pipelineId) || [];
    return versions.find(v => v.version === version);
  }

  /**
   * Compare two versions
   */
  compareVersions(
    pipelineId: string,
    fromVersion: string,
    toVersion: string
  ): ChangeSet | null {
    const versions = this.versions.get(pipelineId) || [];
    const from = versions.find(v => v.version === fromVersion);
    const to = versions.find(v => v.version === toVersion);

    if (!from || !to) {
      return null;
    }

    return this.calculateChanges(from.snapshot, to.snapshot);
  }

  /**
   * Revert pipeline to specific version
   */
  async revertToVersion(
    pipelineId: string,
    targetVersion: string,
    author: string,
    message?: string
  ): Promise<RealPipeline> {
    const version = this.getVersion(pipelineId, targetVersion);
    if (!version) {
      throw new Error(`Version ${targetVersion} not found for pipeline ${pipelineId}`);
    }

    // Create revert commit
    const revertedPipeline = this.createSnapshot(version.snapshot);
    revertedPipeline.version.current = this.generateVersionNumber(
      this.versions.get(pipelineId) || [],
      undefined // Revert doesn't need change analysis
    );

    await this.createVersion(
      revertedPipeline,
      message || `Revert to version ${targetVersion}`,
      author,
      { tag: 'revert' }
    );

    return revertedPipeline;
  }

  /**
   * Create a branch from specific version
   */
  async createBranch(
    pipelineId: string,
    branchName: string,
    fromVersion?: string,
    author?: string
  ): Promise<PipelineVersion> {
    if (!this.strategy.branchingEnabled) {
      throw new Error('Branching is not enabled for this pipeline');
    }

    const versions = this.versions.get(pipelineId) || [];
    const sourceVersion = fromVersion 
      ? versions.find(v => v.version === fromVersion)
      : versions[versions.length - 1];

    if (!sourceVersion) {
      throw new Error('Source version not found');
    }

    // Create branch version
    const branchVersion: PipelineVersion = {
      ...sourceVersion,
      id: `${pipelineId}-${branchName}-${sourceVersion.version}`,
      version: `${sourceVersion.version}-${branchName}`,
      timestamp: new Date().toISOString(),
      author: author || sourceVersion.author,
      message: `Create branch ${branchName} from ${sourceVersion.version}`,
      branch: branchName,
      tags: ['branch-creation']
    };

    versions.push(branchVersion);
    this.versions.set(pipelineId, versions);

    return branchVersion;
  }

  /**
   * Auto-commit based on sync events
   */
  async handleSyncEvent(
    pipeline: RealPipeline,
    syncStatus: SyncStatus,
    author: string
  ): Promise<PipelineVersion | null> {
    if (!this.strategy.autoCommit || !this.strategy.commitTriggers.includes('sync')) {
      return null;
    }

    // Only commit on successful sync with changes
    if (syncStatus.status !== 'synced') {
      return null;
    }

    const versions = this.versions.get(pipeline.id) || [];
    const lastVersion = versions[versions.length - 1];

    // Check if there are actual changes
    if (lastVersion) {
      const changes = this.calculateChanges(lastVersion.snapshot, pipeline);
      if (!this.hasSignificantChanges(changes)) {
        return null;
      }
    }

    return this.createVersion(
      pipeline,
      `Auto-commit: Sync from ${pipeline.reality.source}`,
      author,
      { tag: 'auto-sync' }
    );
  }

  /**
   * Calculate changes between two pipeline states
   */
  private calculateChanges(from: RealPipeline, to: RealPipeline): ChangeSet {
    const changes: ChangeSet = {
      nodesAdded: [],
      nodesModified: [],
      nodesRemoved: [],
      edgesAdded: [],
      edgesModified: [],
      edgesRemoved: [],
      configChanges: [],
      metadataChanges: []
    };

    // Track node changes
    const fromNodesMap = new Map(from.nodes.map(n => [n.id, n]));
    const toNodesMap = new Map(to.nodes.map(n => [n.id, n]));

    // Find added nodes
    for (const [id, node] of toNodesMap) {
      if (!fromNodesMap.has(id)) {
        changes.nodesAdded.push(node);
      }
    }

    // Find removed nodes
    for (const [id] of fromNodesMap) {
      if (!toNodesMap.has(id)) {
        changes.nodesRemoved.push(id);
      }
    }

    // Find modified nodes
    for (const [id, toNode] of toNodesMap) {
      const fromNode = fromNodesMap.get(id);
      if (fromNode) {
        const nodeDiff = this.calculateNodeDiff(fromNode, toNode);
        if (nodeDiff.changes.length > 0) {
          changes.nodesModified.push(nodeDiff);
        }

        // Track config changes
        const configDiff = this.calculateConfigDiff(fromNode, toNode);
        changes.configChanges.push(...configDiff);
      }
    }

    // Track edge changes (similar pattern)
    const fromEdgesMap = new Map(from.edges.map(e => [e.id, e]));
    const toEdgesMap = new Map(to.edges.map(e => [e.id, e]));

    for (const [id, edge] of toEdgesMap) {
      if (!fromEdgesMap.has(id)) {
        changes.edgesAdded.push(edge);
      }
    }

    for (const [id] of fromEdgesMap) {
      if (!toEdgesMap.has(id)) {
        changes.edgesRemoved.push(id);
      }
    }

    // Track metadata changes
    changes.metadataChanges = this.calculateMetadataDiff(from, to);

    return changes;
  }

  /**
   * Calculate differences between two nodes
   */
  private calculateNodeDiff(from: RealNode, to: RealNode): NodeDiff {
    const changes: NodeDiff['changes'] = [];
    
    // Compare basic properties
    if (from.label !== to.label) {
      changes.push({
        field: 'label',
        oldValue: from.label,
        newValue: to.label,
        type: 'modified'
      });
    }

    if (from.type !== to.type) {
      changes.push({
        field: 'type',
        oldValue: from.type,
        newValue: to.type,
        type: 'modified'
      });
    }

    // Compare position
    if (JSON.stringify(from.position) !== JSON.stringify(to.position)) {
      changes.push({
        field: 'position',
        oldValue: from.position,
        newValue: to.position,
        type: 'modified'
      });
    }

    // Compare reality configuration
    if (JSON.stringify(from.reality) !== JSON.stringify(to.reality)) {
      changes.push({
        field: 'reality',
        oldValue: from.reality,
        newValue: to.reality,
        type: 'modified'
      });
    }

    // Determine significance
    const significance = this.determineChangeSignificance(changes);

    return {
      id: from.id,
      changes,
      significance
    };
  }

  /**
   * Calculate configuration differences
   */
  private calculateConfigDiff(from: RealNode, to: RealNode): ConfigDiff[] {
    const diffs: ConfigDiff[] = [];

    // Compare actual configuration
    const fromConfig = JSON.stringify(from.config?.actual || {});
    const toConfig = JSON.stringify(to.config?.actual || {});

    if (fromConfig !== toConfig) {
      diffs.push({
        nodeId: from.id,
        configPath: 'actual',
        oldValue: from.config?.actual,
        newValue: to.config?.actual,
        impact: this.determineConfigImpact(from.config?.actual, to.config?.actual)
      });
    }

    return diffs;
  }

  /**
   * Calculate metadata differences
   */
  private calculateMetadataDiff(from: RealPipeline, to: RealPipeline): MetadataDiff[] {
    const diffs: MetadataDiff[] = [];

    // Compare schedule
    if (JSON.stringify(from.schedule) !== JSON.stringify(to.schedule)) {
      diffs.push({
        field: 'schedule',
        oldValue: from.schedule,
        newValue: to.schedule,
        category: 'schedule'
      });
    }

    // Compare metadata
    if (JSON.stringify(from.metadata) !== JSON.stringify(to.metadata)) {
      if (from.metadata?.owner !== to.metadata?.owner) {
        diffs.push({
          field: 'owner',
          oldValue: from.metadata?.owner,
          newValue: to.metadata?.owner,
          category: 'owner'
        });
      }

      if (from.description !== to.description) {
        diffs.push({
          field: 'description',
          oldValue: from.description,
          newValue: to.description,
          category: 'description'
        });
      }
    }

    return diffs;
  }

  /**
   * Generate semantic version number
   */
  private generateVersionNumber(
    versions: PipelineVersion[],
    changes?: ChangeSet
  ): string {
    if (versions.length === 0) {
      return '1.0.0';
    }

    const lastVersion = versions[versions.length - 1];
    const [major, minor, patch] = lastVersion.version.split('.').map(Number);

    if (!changes) {
      return `${major}.${minor}.${patch + 1}`;
    }

    // Determine version bump based on changes
    const hasMajorChanges = changes.nodesRemoved.length > 0 ||
      changes.configChanges.some(c => c.impact === 'breaking') ||
      changes.nodesModified.some(n => n.significance === 'major');

    const hasMinorChanges = changes.nodesAdded.length > 0 ||
      changes.edgesAdded.length > 0 ||
      changes.nodesModified.some(n => n.significance === 'minor');

    if (hasMajorChanges) {
      return `${major + 1}.0.0`;
    } else if (hasMinorChanges) {
      return `${major}.${minor + 1}.0`;
    } else {
      return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * Determine change significance
   */
  private determineChangeSignificance(changes: NodeDiff['changes']): 'major' | 'minor' | 'patch' {
    if (changes.some(c => c.field === 'type' || c.field === 'reality')) {
      return 'major';
    }
    if (changes.some(c => c.field === 'label')) {
      return 'minor';
    }
    return 'patch';
  }

  /**
   * Determine configuration impact
   */
  private determineConfigImpact(oldConfig: any, newConfig: any): 'breaking' | 'compatible' | 'enhancement' {
    if (!oldConfig && newConfig) return 'enhancement';
    if (oldConfig && !newConfig) return 'breaking';
    
    // Simple heuristic - could be more sophisticated
    const oldKeys = Object.keys(oldConfig || {});
    const newKeys = Object.keys(newConfig || {});
    
    if (oldKeys.some(key => !newKeys.includes(key))) {
      return 'breaking';
    }
    
    if (newKeys.some(key => !oldKeys.includes(key))) {
      return 'enhancement';
    }
    
    return 'compatible';
  }

  /**
   * Check if changes are significant enough to warrant a commit
   */
  private hasSignificantChanges(changes: ChangeSet): boolean {
    return changes.nodesAdded.length > 0 ||
           changes.nodesRemoved.length > 0 ||
           changes.nodesModified.length > 0 ||
           changes.edgesAdded.length > 0 ||
           changes.edgesRemoved.length > 0 ||
           changes.configChanges.length > 0 ||
           changes.metadataChanges.length > 0;
  }

  /**
   * Create a deep copy snapshot of the pipeline
   */
  private createSnapshot(pipeline: RealPipeline): RealPipeline {
    return JSON.parse(JSON.stringify(pipeline));
  }

  /**
   * Apply retention policy to clean up old versions
   */
  private async applyRetentionPolicy(pipelineId: string): Promise<void> {
    const versions = this.versions.get(pipelineId) || [];
    const policy = this.strategy.retentionPolicy;

    // Apply max versions limit
    if (versions.length > policy.maxVersions) {
      const toRemove = versions.length - policy.maxVersions;
      versions.splice(0, toRemove);
    }

    // Apply age-based cleanup
    const maxAge = new Date();
    maxAge.setTime(maxAge.getTime() - this.parseDuration(policy.maxAge));
    
    const filtered = versions.filter(v => new Date(v.timestamp) >= maxAge);
    
    this.versions.set(pipelineId, filtered);
  }

  /**
   * Parse ISO duration string to milliseconds
   */
  private parseDuration(duration: string): number {
    // Simple parser for common formats like "P30D", "P1Y", etc.
    const match = duration.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?/);
    if (!match) return 0;

    const [, years = 0, months = 0, days = 0] = match.map(Number);
    return (years * 365 + months * 30 + days) * 24 * 60 * 60 * 1000;
  }

  /**
   * Export version history for backup/migration
   */
  exportVersionHistory(pipelineId: string): PipelineVersion[] {
    return this.versions.get(pipelineId) || [];
  }

  /**
   * Import version history from backup/migration
   */
  importVersionHistory(pipelineId: string, versions: PipelineVersion[]): void {
    this.versions.set(pipelineId, versions);
  }
}