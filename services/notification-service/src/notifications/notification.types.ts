export type NotificationSeverity = 'info' | 'warning' | 'critical';

export type NotificationEvent = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  targetUserId?: string;
  missionId?: string;
  orderId?: string;
  meta?: Record<string, any>;
  createdAt: string; // ISO
};

