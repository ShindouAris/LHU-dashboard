import { ChatGroupListResponse, ChatMessageResponse, FindUserResponse, SignalR_Session_Data } from "@/types/chat";

const tapi = import.meta.env.VITE_LHU_TAPI || "";
const apiBackend = import.meta.env.VITE_API_URL || "";


const build_url = (path: "SelectGroupList" | "SelectMessage") => {
    switch (path) {
        case "SelectGroupList":
            return `${tapi}/me/Chat_GroupList_Select`;
        case "SelectMessage":
            return `${tapi}/me/Chat_Message_Select`;
        default:
            throw new Error("Invalid path");        
    }
}

// Tạo session để kết nối thủ công qua websocket thay vì mở kết nối signalr
export const createSession = async (acccess_token: string): Promise<SignalR_Session_Data | null> => {
    const res = await fetch(`${apiBackend}/chat/create`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessToken: acccess_token
        })
    })

    if (!res.ok) {
        return null;
    }

    return await res.json();

}

// Tìm kiếm người dùng theo uid
export const findUser = async (uid: string): Promise<FindUserResponse | null> => {

    try {
        const formdata = new FormData();
        formdata.append("findstr", uid.toString());
        const res = await fetch(`${tapi}/me/Chat_Friend_Search`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
            body: formdata
            }
        )
        if (!res.ok) {
            throw new Error("Failed to find user");
        }

        return await res.json();

    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message)
        }
        return null;
    }
}

// Chat utils
export const getGroupList = async (userid?: string): Promise<ChatGroupListResponse | null> => {
    try {
        const formdata = new FormData()
        if (userid) {
            formdata.append("userid", userid)
        }
        const res = await fetch(build_url("SelectGroupList"), {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: formdata
        })

        if (!res.ok) {
            throw new Error("Failed to fetch group list - response" + res.statusText);
        }

        return await res.json();

    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            return null
        }
        return null
    }
}

export const getMessageList = async (chatID: string, lastTime: string): Promise<ChatMessageResponse | null> => {
    try {
        const res = await fetch(build_url("SelectMessage"), {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({
                chatID: chatID,
                lastTime: lastTime
            })
        })

        if (!res.ok) {
            throw new Error("Failed to fetch message list - chatID: " + chatID + " lastTime: " + lastTime + " response: " + res.statusText);
        }

        return await res.json();

    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            return null;
        }
        return null;
    }
}