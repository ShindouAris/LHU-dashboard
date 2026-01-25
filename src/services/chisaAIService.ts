
import { IchatHistory, IchisaAIChatList } from "@/types/chisaAI"
const API_ENDPOINT = import.meta.env.VITE_API_URL

export const chisaAIService = {
    getChatList: async (access_token: string, next_token: string | null): Promise<IchisaAIChatList> => {
        const res = await fetch(`${API_ENDPOINT}/chisaAI/v2/list`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }, 
            body: JSON.stringify({
                accessToken: access_token,
                next_token: next_token
            })
        })
        if (!res.ok) {
            throw new Error(`Lỗi khi lấy danh sách chat: ${res.status} ${res.statusText}`)
        }
        return await res.json();
    },
    getChatHistory: async (access_token: string, chatId: string, next_token: string | null): Promise<IchatHistory> => {
        const res = await fetch(`${API_ENDPOINT}/chisaAI/v2/${chatId}/history`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }, 
            body: JSON.stringify({
                accessToken: access_token,
                next_token: next_token
            })
        })

        if (!res.ok) {
            throw new Error(`Lỗi khi lấy lịch sử chat: ${res.status} ${res.statusText}`)
        }
        
        return await res.json();
    }
}