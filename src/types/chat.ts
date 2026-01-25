export interface SignalR_Session_Data {
    negotiateVersion: number
    connectionId: string
    connectionToken: string // this is important
    availableTransports: any
}

export interface ChatMessage {
  ChatMessageID: number;
  ChatID: number;
  ChatContent: string;
  MessType: number;
  SendUser: string;
  SendTime: string; // ISO string
  UnreadMessage: number;
}

export interface ChatData {
  ChatID: number;
  UserID: string;
  Avatar: string;
  ChatName: string;
  OnlineChat: boolean;
  MeViewedTime: string; // ISO string
  MeDeliveredTime: string; // ISO string
  FriendViewedTime: string; // ISO string
  FriendDeliveredTime: string; // ISO string
  MessID: number;
  Mess: string;
  MessType: number;
  SendUser: string;
  SendTime: string; // ISO string
  isBlock: boolean;
  RowNum: number;
}

export interface UserInfo {
  UserID: string;
  Friendly: number;
  UserName: string;
  FullName: string;
  Department: string;
  OnlineChat: boolean;
}

export interface ChatMessageResponse {
  data: ChatMessage[];
}

export interface ChatGroupListResponse {
  data: ChatData[];
}


export interface FindUserResponse {
  data: UserInfo[];
}
