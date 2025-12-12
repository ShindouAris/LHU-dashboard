import {ApiRequest, ApiResponse, DiemDanhData, ExamInfo, ExamResponse} from '@/types/schedule';
import {HourForecast, WeatherCurrentAPIResponse, WeatherForeCastAPIResponse} from '@/types/weather';

const API_ENDPOINT = import.meta.env.VITE_API_URL 
const SCHOOL_ENDPOINT = import.meta.env.VITE_SCHOOL_ENDPOINT
const TAPI = import.meta.env.VITE_LHU_TAPI

export class ApiService {
  // Lấy thời khóa biểu (api trường)
  static async getSchedule(request: ApiRequest): Promise<ApiResponse> {
    const response = await fetch(SCHOOL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorBody = await response.json().catch(() => null);
          const apiMessage = errorBody?.Message || errorBody?.message;
          if (apiMessage) {
            throw new Error(apiMessage);
          }
        } else {
          // Try text in case server returns text/plain for errors
          const text = await response.text().catch(() => '');
          if (text) {
            throw new Error(text);
          }
        }
      } catch (inner) {
        // If parsing the body or throwing above didn't happen, fall through to generic
        if (inner instanceof Error) {
          throw inner;
        }
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  };
  // Lấy danh sách thi riêng theo từng người
  static async getPrivateExam(ID: number): Promise<[ExamInfo] | null> {
    try {
      const res = await fetch(`${API_ENDPOINT}/private-exam`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ID: ID
        })
      })
      if (!res.ok) {
        return null
      }
      const data: ExamResponse = await res.json()

      if (data.data.length < 1) {
        return null
      } 

      return data.data
      
    } catch (error) {
      return null
    }
  };
  // Lấy thời tiết hiện tại
  static async get_current_weather(): Promise<WeatherCurrentAPIResponse> {
    const response = await fetch(`${API_ENDPOINT}/weather/current`, {
      method: 'GET',
    });

    if (!response.ok) {
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorBody = await response.json().catch(() => null);
          const apiMessage = errorBody?.Message || errorBody?.message;
          if (apiMessage) {
            throw new Error(apiMessage);
          }
        } else {
          // Try text in case server returns text/plain for errors
          const text = await response.text().catch(() => '');
          if (text) {
            throw new Error(text);
          }
        }
      } catch (inner) {
        // If parsing the body or throwing above didn't happen, fall through to generic
        if (inner instanceof Error) {
          throw inner;
        }
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  };
  // Lấy dự báo thời tiết theo giờ, nếu không có tham số thì lấy theo thời gian hiện tại
  static async get_forecast_weather(scheduletime: string | null = null): Promise<HourForecast> {

    const toUnixSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

    const timestamp = scheduletime
      ? toUnixSeconds(new Date(scheduletime))
      : toUnixSeconds(new Date());

    const response = await fetch(`${API_ENDPOINT}/weather/forecast?timestamp=${timestamp}`, {
      method: 'GET',
    });

    if (!response.ok) {
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorBody = await response.json().catch(() => null);
          const apiMessage = errorBody?.Message || errorBody?.message;
          if (apiMessage) {
            throw new Error(apiMessage);
          }
        } else {
          // Try text in case server returns text/plain for errors
          const text = await response.text().catch(() => '');
          if (text) {
            throw new Error(text);
          }
        }
      } catch (inner) {
        // If parsing the body or throwing above didn't happen, fall through to generic
        if (inner instanceof Error) {
          throw inner;
        }
      }
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  };
  // Lấy dự báo thời tiết theo giờ tự động
  static async get_forecast_weather_auto(): Promise<HourForecast> {
    const response = await fetch(`${API_ENDPOINT}/weather/forecast`, {
      method: 'GET',
    });

    if (!response.ok) {
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorBody = await response.json().catch(() => null);
          const apiMessage = errorBody?.Message || errorBody?.message;
          if (apiMessage) {
            throw new Error(apiMessage);
          }
        } else {
          // Try text in case server returns text/plain for errors
          const text = await response.text().catch(() => '');
          if (text) {
            throw new Error(text);
          }
        }
      } catch (inner) {
        // If parsing the body or throwing above didn't happen, fall through to generic
        if (inner instanceof Error) {
          throw inner;
        }
      }
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  };
  // Lấy dự báo thời tiết 3 ngày
  static async get_3_day_forecast_weather(): Promise<WeatherForeCastAPIResponse> {
    const response = await fetch(`${API_ENDPOINT}/weather/forecast_all`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  };
  // Lấy danh sách điểm danh
  static async get_lms_diem_danh(access_token: string): Promise<DiemDanhData> {
    try {
      const res = await fetch(`${API_ENDPOINT}/lms/diemdanh`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accessToken: access_token
          })
        })
        if (!res.ok) {
          return {data: []}
        }

        return await res.json()

      } catch (error) {
        return {data: []}
    }
  };
  static async send_diem_danh(qr_code: string, access_token: string) {
    if (qr_code === "") return
    try {
      const sysID = qr_code.substring(0, 3)
      if (sysID !== "STB") {
        return {success: false, error: "Mã QR không hợp lệ"}
      }
      const tdata = qr_code.substring(3)
      const payload = {
                QRID: tdata
          }
      const res = await fetch(`${TAPI}/lms/QR_ScanCode`, {
            method: "POST",
            headers:{
                authorization: `Bearer ${access_token}`,
                "Content-type": "application/json"
            },
            body: JSON.stringify(payload)
        })

      if (!res.ok) {
        const data = await res.json()
        return {success: false, error: data?.Message || "Điểm danh thất bại"}
      }

      return {success: true}

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw error;
    }
  }
  static async elib_scanCode(qr_code: string, access_token: string) {
    if (qr_code === "") return
    try {
      const sysID = qr_code.substring(0, 3)
      if (sysID !== "LIB") {
        return {success: false, error: "Mã QR không hợp lệ"}
      }
      const tdata = qr_code.substring(3)
      const payload = {
        DangKyID: tdata
      }
      const res = await fetch(`${TAPI}/elib/DANGKY_JoinRoom`, {
        method: "POST",
        headers:{
            authorization: `Bearer ${access_token}`,
            "Content-type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        return {success: false, error: data?.Message || "Tham gia thất bại"}
      }

      return {success: true}

    } catch (error) {

    }
  }
  static async testnet (): Promise<boolean>  {
      try {
          await fetch(API_ENDPOINT, {
              method: "HEAD",
              signal: AbortSignal.timeout(3000)
          })
          return true
      } catch {
          return false;
      }
    }
}