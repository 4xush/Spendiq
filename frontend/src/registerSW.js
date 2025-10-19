// src/registerSW.js
import { registerSW } from 'virtual:pwa-register';

// This is the service worker registration function
const updateSW = registerSW({
    // Called when a new service worker is available
    onNeedRefresh() {
        // Show a notification or UI element to inform the user about the update
        if (confirm('New content available. Reload to update?')) {
            // If user confirms, update the service worker
            updateSW(true);
        }
    },
    // Called when the service worker is updated successfully
    onOfflineReady() {
        console.log('App ready to work offline');
        // You could show a toast notification here
    },
});

export default updateSW;