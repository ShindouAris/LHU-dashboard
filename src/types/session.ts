import { UserResponse } from "./user"

export interface QRSubmitResponse {
    access_token: string,
    user_data: UserResponse
}