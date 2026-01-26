// SignalR Session Data
export interface SignalR_Session_Data {
    connectionToken: string;
    connectionId: string;
    negotiateVersion: number;
    availableTransports: Array<{
        transport: string;
        transferFormats: string[];
    }>;
}

// User Data
export interface UserData {
    UserID: string;
    UserName: string;
    FullName: string;
    FirstName?: string;
    Department?: string;
    OnlineChat?: boolean;
}

export interface FindUserResponse {
    success: boolean;
    data: UserData[];
    message?: string;
}

// Chat Group
export interface ChatGroupData {
    ChatID: string;
    UserID: string;
    ChatName: string;
    Avatar: string;
    OnlineChat: boolean;
    MeDeliveredTime: string;
    MeViewedTime: string;
    FriendViewedTime: string;
    FriendDeliveredTime: string;
    MessID: number;
    SendUser: string;
    Mess: string;
    MessType: number;
    SendTime: string;
}

export interface ChatGroupListResponse {
    success: boolean;
    data: ChatGroupData[];
    message?: string;
}

// Chat Message
export interface ChatMessageData {
    MessID: number;
    SendUser: string;
    ChatID: string;
    ChatContent: string;
    MessType: number;
    SendTime: string;
}

export interface ChatMessageResponse {
    success: boolean;
    data: ChatMessageData[];
    message?: string;
}

// Internal Message Format
export interface ChatMessage {
    messId: string;
    sendUser: string;
    chatID: string;
    messType: number;
    mess: string;
    time: string;
}

// Chat Group Object (for UI)
export interface ChatGroup {
    chatID: string;
    userID: string;
    chatName: string;
    avatar: string;
    online: boolean;
    MeDeliveredTime: string;
    MeViewedTime: string;
    FriendViewedTime: string;
    FriendDeliveredTime: string;
    messData: ChatMessage[];
    lastReadTime?: string;
}

// WebSocket Message Types
export type WSMessageType = 
    | "message_received"
    | "message_delivered"
    | "onConnected"
    | "onNewUserConnected"
    | "onUserDisconnected"
    | "onError";

export interface WSMessage {
    type: number;
    target?: WSMessageType;
    arguments?: any[];
    invocationId?: string;
    error?: string;
}

// File Upload
export interface FileUpload {
    id: string;
    uploaded: boolean;
    filename: string;
    fileExt: string;
    size: string;
    percent: number;
}

// Chat Status
export interface ChatStatus {
    online: boolean;
    onsearch: boolean;
    onGetSearchData: boolean;
    onGetData: boolean;
}

// Message Status Type
export type MessageStatus = "" | "messSended" | "messDelivered" | "lds-dual-ring";