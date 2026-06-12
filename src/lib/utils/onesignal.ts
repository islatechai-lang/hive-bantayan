// ============================================================
// Hive Bantayan — OneSignal & Median Push Notifications Helper
// ============================================================

const ONESIGNAL_APP_ID = "803f1ef7-bd66-4bfe-8f6c-acfeb44f7da8";
const ONESIGNAL_API_KEY = "os_v2_app_qa7r5555mzf75d3mvt7lit35vdvx5kpvkrguuqehvluvbh54xoesj7u76zaawrzzsgz2ytzdxokiedapcnyndv7zq6y3ugscusjyidq";

/**
 * Register the logged-in user's Firebase UID as their OneSignal external user ID.
 * This links the device/push subscription to this specific user account.
 */
export const registerOneSignalUser = (userId: string) => {
  if (typeof window === "undefined") return;
  try {
    const bridge = (window as any).median || (window as any).gonative;
    if (bridge?.onesignal?.login) {
      bridge.onesignal.login(userId);
      console.log("OneSignal: Associated user ID via Median bridge", userId);
    } else {
      console.log("OneSignal: Median bridge onesignal.login is not available (not running inside native wrapper)");
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
    if (bridge?.onesignal?.logout) {
      bridge.onesignal.logout();
      console.log("OneSignal: Cleared external user association on logout");
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
    console.log(`OneSignal: Attempting to send push to: ${targetUserIds.join(", ")}`);
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        // Target users using both external_id (modern v5+) and legacy include_external_user_ids to guarantee delivery
        include_external_user_ids: targetUserIds,
        include_aliases: {
          external_id: targetUserIds,
        },
        target_channel: "push",
        headings: { en: title },
        contents: { en: message },
        data: data || {},
      }),
    });

    const result = await response.json();
    console.log("OneSignal: Push delivery response:", result);
    return result;
  } catch (error) {
    console.error("OneSignal: Failed to send push notification:", error);
  }
};
