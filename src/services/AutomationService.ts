import { SurveyAnswerData, SurveyAnswerPayload, SurveyListItem } from "@/types/automation";
import { AuthStorage } from "@/types/user";
import { ClientJS } from "clientjs";

const TAPI = import.meta.env.VITE_LHU_TAPI
const API_ENDPOINT = import.meta.env.VITE_API_URL 
const HEADERS = (access_token: string) => {
    return {
        "Authorization": "Bearer " + access_token,
        "Content-Type": "application/json",
    };
}

// @ts-ignore Currently unsued to test the api
function buildDeviceInfo(): string {
  try {
    const client = new ClientJS();
    let str = '{' + client.getFingerprint() + '}{WebAuth}{';
    if (client.getDevice() !== undefined)
      str += client.getDeviceVendor() + ' ' + client.getDevice() + ' · ';
    if (client.getOS() !== undefined)
      str += client.getOS() + ' ' + client.getOSVersion() + ' · ';
    if (client.getBrowser() !== undefined)
      str += client.getBrowser() + ' ' + client.getBrowserMajorVersion();
    return str + '}';
  } catch {
    return '{unknown}{WebAuth}{Windows 10 · Chrome 136}';
  }
}


export const automationService = {
    async getSurveyList(): Promise<SurveyListItem[]> {
        const access_token = AuthStorage.getUserToken();

        if (!access_token) {
            throw new Error("Cần đăng nhập để sử dụng chức năng này");
        }

        try {
            const response = await fetch(`${API_ENDPOINT}/qa/fetch_pending`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    access_token: access_token,
                }),
                });

            if (!response.ok) {
                let msg = await response.text() || "Lấy danh sách khảo sát thất bại";
                throw new Error(msg);
            }

            const data: SurveyListItem[] = await response.json();

            return data
            } catch (error) {
            throw error;
        }

    },
    async processSurvey(item: SurveyListItem): Promise<SurveyAnswerPayload> {

      const access_token = AuthStorage.getUserToken();
      if (!access_token) {
          throw new Error("Cần đăng nhập để sử dụng chức năng này");
      }

      if (!item || !(item instanceof Object)) {
          throw new Error("Dữ liệu khảo sát không hợp lệ");
      }

      try {
        const res = await fetch(`${API_ENDPOINT}/qa/process_survey`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                },
              body: JSON.stringify({
                access_token: access_token,
                device_info: buildDeviceInfo(),
                itemKhaoSat: item
              })          
        })

        if (!res.ok) {
          throw new Error(await res.text() || "Hệ thống xử lý khảo sát gặp sự cố")
        }

        const data = await res.json()

        if (data === null) {
          throw new Error("Hệ thống xử lý khảo sát gặp sự cố")
        }

        return data
        
      } catch (error) {
        throw error;
      }
        
    },
    // Sử dụng chính client của user để xử lý khảo sát
    submit_survey: async (payload: SurveyAnswerData): Promise<boolean> => {

      const access_token = AuthStorage.getUserToken();
      if (!access_token) {
          throw new Error("Cần đăng nhập để sử dụng chức năng này");
      }

      if (!payload || !(payload instanceof Object)) {
          throw new Error("Dữ liệu khảo sát không hợp lệ");
      }

      try {
        const res = await fetch(`${TAPI}/qa//obj/NEW_User_SubmitData`, {
              method: "POST",
              headers: HEADERS(access_token),
              body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err?.Message || "Gửi câu trả lời khảo sát thất bại")
        }
        return true
      } catch (error) {
        throw error;
      }

    }
}