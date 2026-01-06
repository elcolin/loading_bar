/**
 * Notifications module for handling browser notifications
 */

let notificationPermissionGranted = false;

/**
 * Check if notifications are supported and permission is granted
 * @returns {boolean}
 */
export function isNotificationSupported() {
  return "Notification" in window;
}

/**
 * Check if notification permission is granted
 * @returns {boolean}
 */
export function isNotificationPermissionGranted() {
  return notificationPermissionGranted;
}

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    alert("This browser does not support notifications.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      notificationPermissionGranted = true;
      return true;
    } else {
      alert("Notification permission denied. Notifications will not work.");
      return false;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    alert("An error occurred while requesting permission.");
    return false;
  }
}

/**
 * Send a notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export function sendNotification(title, body) {
  console.log("sendNotification called:", title, body);
  console.log("Permission granted:", notificationPermissionGranted);
  console.log("Notification API available:", isNotificationSupported());
  
  if (notificationPermissionGranted && isNotificationSupported()) {
    const options = {
      body: body,
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>☕</text></svg>",
      requireInteraction: true,
      tag: "checkpoint-notification",
      silent: false
    };
    
    // Add vibrate only if supported (mobile devices)
    if ('vibrate' in navigator) {
      options.vibrate = [200, 100, 200];
    }
    
    try {
      const notification = new Notification(title, options);
      console.log("Notification created successfully");
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  } else {
    console.warn("Notifications not available or permission not granted");
  }
}

/**
 * Send a test notification
 */
export function sendTestNotification() {
  sendNotification("Notifications enabled", {
    body: "You will receive notifications during checkpoint breaks.",
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>⏱️</text></svg>"
  });
}
