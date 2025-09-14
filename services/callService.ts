export type ClickToCallPayload = {
  from_number: string;
  to_number: string;
};

export type ClickToCallResponse = {
  success: boolean;
  message?: string;
  statusCode?: number;
  [key: string]: unknown;
};

// Default export for the service
const callService = {
  sendClickToCall
};

export default callService;

const CLICK_TO_CALL_URL = 'https://apiv1.cloudshope.com/api/sendClickToCall';

export async function sendClickToCall(
  payload: ClickToCallPayload,
  options?: { timeoutMs?: number; authToken?: string }
): Promise<ClickToCallResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.authToken) {
      headers['Authorization'] = `Bearer ${options.authToken}`;
    }

    const response = await fetch(CLICK_TO_CALL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let data: unknown = null;
    try {
      data = await response.clone().json();
    } catch {
      try {
        const text = await response.text();
        data = { message: text };
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const message = (data && typeof data === 'object' && 'message' in data) ? String((data as any).message) : `HTTP ${response.status}`;
      return { success: false, message, statusCode: response.status, ...(typeof data === 'object' && data ? data : {}) } as ClickToCallResponse;
    }

    const normalized: ClickToCallResponse = {
      success: true,
      statusCode: response.status,
      ...(typeof data === 'object' && data ? (data as Record<string, unknown>) : {}),
    };
    return normalized;
  } finally {
    clearTimeout(timeout);
  }
}
