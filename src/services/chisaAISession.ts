const API_ENDPOINT = import.meta.env.VITE_API_URL;

type Session = { token: string; expiresAt: number; refreshAt: number };
const sessions = new Map<string, Session>();
const pending = new Map<string, Promise<string>>();

export async function getChisaAISession(schoolToken: string): Promise<string> {
    if (!schoolToken.trim()) throw new Error("School session is required");
    const active = pending.get(schoolToken);
    if (active) return active;
    const previous = sessions.get(schoolToken);
    // Session API timestamps are Unix seconds; JWT claims are not decoded or trusted.
    const now = Date.now() / 1000;
    if (previous && now < previous.refreshAt && now < previous.expiresAt) return previous.token;
    const refreshing = previous && now < previous.expiresAt;
    if (!refreshing) sessions.delete(schoolToken);
    const request = (async () => {
        let response: Response;
        try {
            response = await fetch(`${API_ENDPOINT}/chisaAI/v3/session${refreshing ? "/refresh" : ""}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(refreshing ? { token: previous.token } : { accessToken: schoolToken }),
            });
        } catch {
            if (refreshing && Date.now() / 1000 < previous.expiresAt) return previous.token;
            throw new Error("ChisaAI session network request failed");
        }
        if (!response.ok) {
            if (response.status === 401) sessions.delete(schoolToken);
            const transient = response.status === 408 || response.status === 429 || response.status >= 500;
            if (transient && refreshing && Date.now() / 1000 < previous.expiresAt) return previous.token;
            throw new Error(`ChisaAI session request failed (${response.status})`);
        }
        const data: unknown = await response.json();
        if (!data || typeof data !== "object") throw new Error("Invalid ChisaAI session response");
        const { token, expiresAt, refreshAt } = data as Partial<Session>;
        if (typeof token !== "string" || !token.trim()
            || typeof expiresAt !== "number" || !Number.isFinite(expiresAt)
            || typeof refreshAt !== "number" || !Number.isFinite(refreshAt)
            || expiresAt <= Date.now() / 1000 || refreshAt <= 0 || refreshAt >= expiresAt) {
            throw new Error("Invalid ChisaAI session response");
        }
        sessions.set(schoolToken, { token, expiresAt, refreshAt });
        return token;
    })();
    pending.set(schoolToken, request);
    try { return await request; }
    finally { pending.delete(schoolToken); }
}
