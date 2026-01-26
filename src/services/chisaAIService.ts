
import { IchatHistory, IchisaAIChatList, IModelsResponse } from "@/types/chisaAI"
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
    },
    getModels: async (): Promise<IModelsResponse> => {
        const res = await fetch(`${API_ENDPOINT}/chisaAI/v2/models`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        })
        if (!res.ok) {
            return {
                models: [
                    {
                        "safeName": "ChisaAI Mini",
                        "modelId": "openai/gpt-4o-mini",
                        "isDefault": true
                    },
                ]
            }
        }
        return await res.json();
    },
    checkUserV3: async (access_token: string): Promise<boolean> => {
        const res = await fetch(`${API_ENDPOINT}/chisaAI/v3/user/check`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken: access_token
            })
        })
        if (!res.ok) {
            return false;
        }
        const data = await res.json();
        return data.exists;
    },
    createUserV3: async (access_token: string): Promise<boolean> => {
        const res = await fetch(`${API_ENDPOINT}/chisaAI/v3/user/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken: access_token
            })
        })
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Lỗi khi tạo người dùng ChisaAI V3');
        }
        return true;
    }
}