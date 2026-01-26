import { UIMessagePart } from "ai";

export interface IchatHistory {
    chatId: string;
    chatUUID: string;
    messages: IMessage[];
    next_token: string | null;
}

interface IMessage {
    id: string;
    role: 'user' | 'assistant'
    parts: UIMessagePart<Record<string, any>, Record<string, any>>[] // Same with message parts
    createdAt: string; // ISO string
}

export interface IchisaAIChatList {
    chats: ChatListInterface[];
    next_token: string | null;
}

interface ChatListInterface {
    chatId: string;
    chatUUID: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    messageCount: number;
}

export interface IModel {
    safeName: string;
    modelId: string;
    isDefault?: boolean;
}

export interface IModelsResponse {
    models: IModel[];
}