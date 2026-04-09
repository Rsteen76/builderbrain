import toast from 'react-hot-toast';

type NotificationSeverity = 'success' | 'error' | 'info' | 'warning';

/**
 * Shows a notification using react-hot-toast
 * @param message The message to display
 * @param severity The severity level of the notification
 */
export const showNotification = (
  message: string, 
  severity: NotificationSeverity = 'info'
) => {
  switch (severity) {
    case 'success':
      toast.success(message, {
        style: {
          background: '#4caf50',
          color: '#fff',
          fontWeight: 500,
        },
        duration: 3000,
      });
      break;
    case 'error':
      toast.error(message, {
        style: {
          background: '#f44336',
          color: '#fff',
          fontWeight: 500,
        },
        duration: 4000,
      });
      break;
    case 'warning':
      toast(message, {
        icon: '⚠️',
        style: {
          background: '#ff9800',
          color: '#fff',
          fontWeight: 500,
        },
        duration: 3500,
      });
      break;
    case 'info':
    default:
      toast(message, {
        style: {
          background: '#2196f3',
          color: '#fff',
          fontWeight: 500,
        },
        duration: 3000,
      });
      break;
  }
};

const notifications = { showNotification };

export default notifications;
