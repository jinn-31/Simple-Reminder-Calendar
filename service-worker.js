self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Service Worker Activated");
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow("./index.html")
  );
});