import { ref } from 'vue';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export const useNotification = () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  
  const notify = (message: string, type: Notification['type'] = 'info', duration: number = 5000) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message, duration };
    
    notifications.value.push(notification);
    unreadCount.value += 1;
    
    // Auto remove notification
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };
  
  const success = (message: string, duration?: number) => {
    return notify(message, 'success', duration);
  };
  
  const error = (message: string, duration?: number) => {
    return notify(message, 'error', duration);
  };
  
  const info = (message: string, duration?: number) => {
    return notify(message, 'info', duration);
  };
  
  const warning = (message: string, duration?: number) => {
    return notify(message, 'warning', duration);
  };
  
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
      if (unreadCount.value > 0) {
        unreadCount.value -= 1;
      }
    }
  };
  
  const clearAll = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };
  
  const markAllAsRead = () => {
    unreadCount.value = 0;
  };
  
  return {
    notifications,
    unreadCount,
    notify,
    success,
    error,
    info,
    warning,
    removeNotification,
    clearAll,
    markAllAsRead,
  };
};