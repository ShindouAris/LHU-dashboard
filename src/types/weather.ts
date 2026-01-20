export interface WeatherForeCastAPIResponse {
  location: Location;
  current: CurrentWeather;
  forecast: Forecast;
}

export interface WeatherCurrentAPIResponse {
  location: Location;
  current: CurrentWeather;
}

export interface Location {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tz_id: string;
  localtime_epoch: number;
  localtime: string;
}

export interface CurrentWeather {
  last_updated_epoch: number;
  last_updated: string;
  temp_c: number;
  is_day: number;
  condition?: Condition;
  wind_kph: number;
  wind_degree: number;
  wind_dir: string;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  windchill_c: number;
  dewpoint_c: number;
  precip_mm: number
  uv: number;
  air_quality: AirQuality;
}

export interface AirQuality {
  pm2_5: number;
  pm10: number;
  "us-epa-index": number;
}

export interface Condition {
  text: string;
  icon: string;
}

export interface Forecast {
  forecastday: ForecastDay[];
}

export interface ForecastDay {
  date: string;
  date_epoch: number;
  day: DayForecast;
  hour: HourForecast[];
}

export interface DayForecast {
  maxtemp_c: number;
  mintemp_c: number;
  avgtemp_c: number;
  maxwind_kph: number;
  totalprecip_mm: number;
  avghumidity: number;
  daily_will_it_rain: number;
  daily_chance_of_rain: number;
  condition?: Condition;
  uv: number;
  air_quality: AirQuality;
}

export interface HourForecast {
  time_epoch: number;
  time: string;
  temp_c: number;
  is_day: number;
  condition?: Condition;
  wind_kph: number;
  wind_degree: number;
  wind_dir: string;
  humidity: number;
  cloud: number;
  precip_mm: number;
  feelslike_c: number;
  windchill_c: number;
  heatindex_c: number;
  dewpoint_c: number;
  will_it_rain: number;
  chance_of_rain: number;
  vis_km: number;
  gust_kph: number;
  uv: number;
  air_quality: AirQuality;
  error?: string;
}
