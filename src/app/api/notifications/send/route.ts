import { NextResponse } from "next/server";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "803f1ef7-bd66-4bfe-8f6c-acfeb44f7da8";
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || "os_v2_app_qa7r5555mzf75d3mvt7lit35vdvx5kpvkrguuqehvluvbh54xoesj7u76zaawrzzsgz2ytzdxokiedapcnyndv7zq6y3ugscusjyidq";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetUserIds, title, message, data } = body;

    if (!targetUserIds || targetUserIds.length === 0) {
      return NextResponse.json({ error: "No target user IDs provided" }, { status: 400 });
    }

    console.log(`OneSignal Server: Sending push to users: ${targetUserIds.join(", ")}`);

    const response = await fetch("https://api.onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
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
    console.log("OneSignal Server: Delivery response:", result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OneSignal Server Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
