import { EventEmitter } from 'events';

export interface NotificationCount {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

export interface SectionNotifications {
  operations: NotificationCount;
  monitor: NotificationCount;
}

class NotificationAggregator extends EventEmitter {
  private notifications: SectionNotifications = {
    operations: { total: 0, critical: 0, warning: 0, info: 0 },
    monitor: { total: 0, critical: 0, warning: 0, info: 0 }
  };

  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startPolling();
  }

  private startPolling() {
    // Poll every 30 seconds for updates
    this.updateInterval = setInterval(() => {
      this.fetchNotifications();
    }, 30000);
    
    // Initial fetch
    this.fetchNotifications();
  }

  private async fetchNotifications() {
    try {
      // Mock data for now - will be replaced with actual API calls
      const operationsNotifications = await this.fetchOperationsNotifications();
      const monitorNotifications = await this.fetchMonitorNotifications();

      this.notifications = {
        operations: operationsNotifications,
        monitor: monitorNotifications
      };

      this.emit('update', this.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  private async fetchOperationsNotifications(): Promise<NotificationCount> {
    // Mock implementation - will integrate with actual services
    return {
      total: 8,
      critical: 2,  // Failed pipelines
      warning: 3,   // Performance issues
      info: 3       // Quality issues
    };
  }

  private async fetchMonitorNotifications(): Promise<NotificationCount> {
    // Mock implementation
    return {
      total: 5,
      critical: 1,  // System down
      warning: 2,   // High resource usage
      info: 2       // Scheduled maintenance
    };
  }

  public getNotifications(): SectionNotifications {
    return this.notifications;
  }

  public forceRefresh() {
    this.fetchNotifications();
  }

  public destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.removeAllListeners();
  }
}

// Singleton instance
let aggregatorInstance: NotificationAggregator | null = null;

export function getNotificationAggregator(): NotificationAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new NotificationAggregator();
  }
  return aggregatorInstance;
}

export function destroyNotificationAggregator() {
  if (aggregatorInstance) {
    aggregatorInstance.destroy();
    aggregatorInstance = null;
  }
}