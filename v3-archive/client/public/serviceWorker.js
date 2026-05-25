self.addEventListener('push', function (event) {
    let eventData = event.data.json();
    if (eventData)
        self.registration.showNotification(eventData.title, {
            body: eventData.text,
            icon: 'https://app.remoterep.com/logo.svg',
            badge: 'https://app.remoterep.com/white-logo.svg',
            vibrate: true,
        });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    clients.openWindow('https://app.remoterep.com/');
});
