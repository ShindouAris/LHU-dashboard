import { HourForecast, WeatherCurrentAPIResponse } from "@/types/weather";
import { computeAQIFromPM } from "./aqiService";

const airQualityMessage = (aqi: number): string | null => {
    if (aqi <= 100) return null;
    if (aqi <= 150) return "😐 Chất lượng không khí khá tệ, người nhạy cảm nên đeo khẩu trang";
    if (aqi <= 200) return "😷 Chất lượng không khí kém, nên đeo khẩu trang khi đến trường";
    return "💀 Chất lượng không khí rất xấu, hãy đeo khẩu trang";
};

// ---- Nhóm nắng / UV ----
const uvMessage = (uv: number): string | null => {
    if (uv < 3) return null;
    const options = [
        "🕶️ UV cao, đeo kính râm khi ra ngoài",
        "☀️ Nắng gắt, nhớ thoa kem chống nắng hoặc mang áo khoác",
        "🌞 Nắng mạnh, mang theo mũ/nón để bảo vệ"
    ];
    return options[Math.floor(Math.random() * options.length)];
};

// ---- Nhóm mưa ----
const rainMessage = (
    rain: boolean,
    precip: number,
    chance_of_rain: number | null,
    has_thunder: boolean
  ): string | null => {
    if (!rain || chance_of_rain === null) return null;
  
    const HEAVY_RAIN_THRESHOLD = 7.5; // mm
  
    // helper để append cảnh báo thunder
    const addThunder = (msg: string) =>
      has_thunder ? `${msg} ⚡ Có sấm sét, tránh chỗ trống trải!` : msg;
  
    if (chance_of_rain > 80) {
      if (precip > HEAVY_RAIN_THRESHOLD) {
        const options = [
          "⛈️ Trời chắc chắn mưa to, cẩn thận ngập đường!",
          "⚠️ Xác suất mưa cực cao + mưa nặng, đi đâu nhớ chuẩn bị kỹ",
          "🌊 Khả năng mưa to, đường trơn trượt/ngập"
        ];
        return addThunder(options[Math.floor(Math.random() * options.length)]);
      }
      return addThunder("🌧️ Khả năng mưa cao, nhưng có vẻ mưa nhỏ thôi.");
    }
  
    if (chance_of_rain > 50) {
      return addThunder(
        precip > HEAVY_RAIN_THRESHOLD
          ? "🌧️ Dễ có mưa vừa đến to, mang áo mưa cho chắc."
          : "☔ Có thể có mưa nhỏ, mang dù cho yên tâm."
      );
    }
  
    if (chance_of_rain > 20) {
      return addThunder("☁️ Khả năng mưa thấp, nếu có thì cũng chỉ lất phất.");
    }
  
    return null; // dưới 20% = coi như trời nắng 🐧
  };
  

// ---- Nhóm nhiệt độ ----
const tempMessage = (feelslike: number, windchill: number): string | null => {
    if (feelslike >= 35) {
        return "🥵 Trời oi bức, nhớ mang theo chai nước";
    }
    if (windchill <= 15) {
        return "🧥 Trời lạnh, mặc thêm áo khoác cho ấm";
    }
    return null;
};

// ---- Nhóm độ ẩm ----
const humidityMessage = (humidity: number): string | null => {
    if (humidity >= 85) {
        const options = [
            "💦 Độ ẩm cao, dễ cảm thấy ngột ngạt",
            "🥵 Trời ẩm ướt, ra ngoài sẽ hơi khó chịu",
            "🌫️ Ẩm nhiều, có thể có sương mù nhẹ"
        ];
        return options[Math.floor(Math.random() * options.length)];
    }
    return null;
};

export const get_warning = (weather_data: HourForecast | null, current_forecast: WeatherCurrentAPIResponse): string => {

    let aqi

    if (weather_data === null) {
      return ""
    }

    if ("air_quality" in weather_data) {
      aqi = computeAQIFromPM(weather_data.air_quality.pm2_5, weather_data.air_quality.pm10).aqi
    } else {
      aqi = computeAQIFromPM(current_forecast.current.air_quality.pm2_5, current_forecast.current.air_quality.pm10).aqi
    }

    const uv = weather_data.uv
    const text = weather_data.condition?.text?.toLowerCase() || '';
    const has_thunder = ["sét", "giông"].some(keyword => text.includes(keyword));
    const rain = text.includes("mưa")
    const humidity = weather_data.humidity
    const windchill = weather_data.windchill_c
    const feelslike = weather_data.feelslike_c
    let chance_of_rain = null;
    if ("chance_of_rain" in weather_data) {
        chance_of_rain = weather_data.chance_of_rain
    }
    const precip = weather_data.precip_mm;


    const sections: { title: string; messages: (string | null)[] }[] = [
        { title: "🌍 Không khí", messages: [airQualityMessage(aqi)] },
        { title: "☀️ Nắng & UV", messages: [uvMessage(uv)] },
        { title: "🌧️ Mưa", messages: [rainMessage(rain, precip, chance_of_rain, has_thunder)] },
        { title: "🌡️ Nhiệt độ", messages: [tempMessage(feelslike, windchill)] },
        { title: "💦 Độ ẩm", messages: [humidityMessage(humidity)] },
    ];

    const output = sections
        .map(section => {
            const msgs = section.messages.filter(Boolean) as string[];
            if (msgs.length === 0) return null;
            return `${msgs.join("\n")}`;
        })
        .filter(Boolean)
        .join("\n");

    return output || "✅ Thời tiết ổn định, lên trường thoải mái 😎";
}