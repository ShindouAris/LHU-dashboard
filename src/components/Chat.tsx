import React, {useState, useEffect, useCallback} from "react";
import { createSession, findUser, getGroupList, getMessageList } from "@/services/chatService";
import useWebSocket, { ReadyState } from 'react-use-websocket';
const wss_url = import.meta.env.VITE_CHAT_API || "";


export const Chat: React.FC = () => {

    const [message, setMessage] = useState<MessageEvent<any> [] >([])

    const [sessionID, setSessionID] = useState<string>("");

    const [socketUrl, setSocketUrl] = useState<string>("");

    const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

    useEffect(() => {

        const load = async () => {

            if (sessionID !== "") {setSocketUrl(wss_url + sessionID); return;}

            const access_token = localStorage.getItem("access_token") // lấy token
            
            if (!access_token) return
            
            const session = await createSession(access_token) // tạo session
            
            if (!session) return

            const token = session.connectionToken
            
            setSessionID(token) // lưu vào để tái sử dụng

            setSocketUrl(wss_url + token) // khởi tạo biến
        }
        load()

    }, [])

    useEffect(()=> {
        if (readyState !== ReadyState.OPEN) return

        console.log("Starting to establish connection")

        const token = localStorage.getItem("access_token")

        const first_payload = {"protocol":"json","version":1}

        sendMessage(JSON.stringify(first_payload) + "\x1e")

        const establish_connection = {"arguments":[token],"invocationId":"0","target":"connect","type":1}
        
        // Gửi từ từ, từ tốn thôi
        setTimeout(() => {
            sendMessage(JSON.stringify(establish_connection) + "\x1e")
            console.log("Establish connection success")
        }, 1500)

    }, [readyState])

    useEffect(() => {
        if (lastMessage !== null) {
            // setMessage((prev) => prev.concat(lastMessage))
            handleIncoming(lastMessage)

        }
    }, [lastMessage])

    useEffect(() => {
        setInterval(() => {
            if (readyState !== ReadyState.OPEN) return;
            const ping = {type: 6}
            sendMessage(JSON.stringify(ping) + "\x1e")
        }, 60000)
        
    }, [readyState, sendMessage])

    // @ts-ignore Unused rn
    const finduser = useCallback(async (uid: string) => {
        const user = await findUser(uid)

        if (user === null || user.data.length === 0) return null

        return user.data

    }, [])

    // @ts-ignore Unused rn
    const getListGrouptChat = useCallback(async (uid: string) => {
        const gc = await getGroupList(uid)
        if (!gc) return null

        if (gc.data.length === 0) return null
        return gc.data

    }, [])

    // @ts-ignore Unused rn
    const getMsgList = useCallback(async (chatID: string,  lasttime: string) => {
        const msgs = await getMessageList(chatID, lasttime)

        if (!msgs) return null;

        if (msgs.data.length === 0) return null

        return msgs.data
    }, [])

    const handleIncoming = (msg: MessageEvent) => {
        const messages = msg.data.split("\x1E").filter((m: string) => m.trim() !== "");

        try {
            const data = JSON.parse(messages);
    
            if (data.type === 1) { // server invocation
                const event = data.target;
                const args = data.arguments;
                // event cơ bản nhất
                setMessage((prev) => prev.concat(msg))

                switch(event) {

                    // message releated
                    case "message_received":
                        console.log("Message received:", args[0]);
                        break;
                    case "message_delivered":
                        const {senduser, chatid, viewed, serverTime} = args
                        console.log(`Message sended to ${{senduser}} - ID chat ${chatid} - Is viewed: ${viewed} - Current server time ${serverTime}`)
                        break

                    // Connection handing
                    case "onConnected":
                        const [sid, uid, username, fullname] = args;
                        console.log("Connected:", { sid, uid, username, fullname });
                        break;
                    case "onNewUserConnected":
                        
                        console.log("New user connected:", args[0]);
                        break;
                    case "onUserDisconnected":
                        console.log("User disconnected:", args[0]);
                        break;

                    // error && default
                    case "error":
                        console.log("There is an exception:", args[0])
                        break
                    default:
                        console.log("Unknown event:", event, args);
                }   
            } 
            else if (data.type === 3) {
                // Completion message
                console.log("Completion message:", data);
            }
            else if (data.type === 6) {
                // Pong to keepalive
                setTimeout(() => {
                    const ping = {type: 6}
                    sendMessage(JSON.stringify(ping) + "\x1e")
                }, 2000)
            }
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message)
                console.log(messages)
            } else {
                console.log(`There is an exception: ${error}`)
            }
        }
    };

    const send = (message: any) => {

        return sendMessage(JSON.stringify(message) + "\x1e")

    }
    // @ts-ignore Unused rn
    const send_chat_message = useCallback((userID: string, msg: string, recivever_id: string, chatID: number) => {
        const payload = {"arguments":
            [{"messId": "952936978290",
                "sendUser": userID,
                "chatID": chatID,
                "messType": 0,
                "mess": msg,
                "time": "9999-01-01"
            }],
            "invocationId": "1",
            "target":   "messageSend",
            "type": 1
        }

        send(payload)
        
    }, [])

    return (
        <div> 
            Chat component is running. Current session ID: {sessionID}
            {message.map((msg, index) => (
                <div key={index}>
                    <strong>Message {index + 1}:</strong> {msg.data}
                </div>
            ))}
        </div>
    )   
}