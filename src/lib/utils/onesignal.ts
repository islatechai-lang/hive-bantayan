// ============================================================
// Hive Bantayan — OneSignal & Median Push Notifications Helper
// ============================================================

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "803f1ef7-bd66-4bfe-8f6c-acfeb44f7da8";

/**
 * Register the logged-in user's Firebase UID as their OneSignal external user ID.
 * This links the device/push subscription to this specific user account.
 */
export const registerOneSignalUser = (userId: string) => {
  if (typeof window === "undefined") return;
  try {
    const bridge = (window as any).median || (window as any).gonative;
    if (!bridge) {
      console.log("OneSignal: Median/GoNative bridge not found");
      return;
    }

    // Register user ID - try modern login() first
    if (bridge.onesignal?.login) {
      bridge.onesignal.login(userId);
      console.log("OneSignal: Associated user ID via modern login()", userId);
    } else if (bridge.onesignal?.externalUserId?.set) {
      // Try legacy SDK v4
      bridge.onesignal.externalUserId.set({ externalId: userId });
      console.log("OneSignal: Associated user ID via legacy externalUserId.set()", userId);
    } else {
      console.log("OneSignal: Neither modern login() nor legacy externalUserId.set() is available on the bridge");
    }

    // Automatically prompt / register for push notifications permission if available
    if (bridge.onesignal?.register) {
      bridge.onesignal.register();
      console.log("OneSignal: Triggered register() prompt via bridge");
    }
  } catch (error) {
    console.error("OneSignal: Error in registerOneSignalUser:", error);
  }
};

/**
 * Clear the associated external user ID when a user logs out.
 */
export const logoutOneSignalUser = () => {
  if (typeof window === "undefined") return;
  try {
    const bridge = (window as any).median || (window as any).gonative;
    if (!bridge) return;

    // Try modern SDK v5+
    if (bridge.onesignal?.logout) {
      bridge.onesignal.logout();
      console.log("OneSignal: Logged out via modern logout()");
    } else if (bridge.onesignal?.externalUserId?.remove) {
      // Try legacy SDK v4
      bridge.onesignal.externalUserId.remove();
      console.log("OneSignal: Logged out via legacy externalUserId.remove()");
    }
  } catch (error) {
    console.error("OneSignal: Error in logoutOneSignalUser:", error);
  }
};

/**
 * Sends a push notification to specific users by their Firebase UIDs (OneSignal External IDs).
 */
export const sendPushNotification = async (
  targetUserIds: string[],
  title: string,
  message: string,
  data?: any
) => {
  if (!targetUserIds || targetUserIds.length === 0) {
    console.log("OneSignal: No target user IDs provided for notification");
    return;
  }

  try {
    console.log(`OneSignal: Requesting push delivery via server proxy for users: ${targetUserIds.join(", ")}`);
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUserIds,
        title,
        message,
        data,
      }),
    });

    const result = await response.json();
    console.log("OneSignal: Server proxy response:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("OneSignal: Failed to send push notification:", error);
  }
};
