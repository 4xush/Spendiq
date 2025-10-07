// Simple notification utilities for P2P reminders
class NotificationManager {
    constructor() {
        this.permission = null;
        this.init();
    }

    async init() {
        if ('Notification' in window) {
            this.permission = await this.requestPermission();
        }
    }

    async requestPermission() {
        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission;
        }

        return Notification.permission;
    }

    showNotification(title, options = {}) {
        if (this.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options
            });

            // Auto close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            return notification;
        }
    }

    scheduleReminder(title, body, delayMinutes = 1) {
        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        const timeoutId = setTimeout(() => {
            this.showNotification(title, {
                body,
                tag: 'p2p-reminder',
                requireInteraction: true,
            });
        }, delayMinutes * 60 * 1000);

        return timeoutId;
    }

    cancelReminder(timeoutId) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Helper functions for P2P reminders
export const createP2PReminder = (personName, amount, type, delayMinutes = 60) => {
    const actionText = type === 'lent' ? 'collect from' : 'pay back';
    const title = `💰 P2P Reminder`;
    const body = `Don't forget to ${actionText} ${personName} - ₹${amount.toLocaleString()}`;

    return notificationManager.scheduleReminder(title, body, delayMinutes);
};

export const showP2PNotification = (personName, amount, type) => {
    const actionText = type === 'lent' ? 'collecting from' : 'paying back';
    const title = `💰 P2P Transaction`;
    const body = `Reminder: ${actionText} ${personName} - ₹${amount.toLocaleString()}`;

    return notificationManager.showNotification(title, { body });
};