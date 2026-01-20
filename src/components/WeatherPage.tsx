import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, CloudRain, Thermometer, Wind, Droplets, ArrowLeft, Sun, Leaf } from 'lucide-react';
import { FaHouseFloodWater } from "react-icons/fa6";
import { ApiService } from '@/services/apiService';
import type { HourForecast, WeatherForeCastAPIResponse, WeatherCurrentAPIResponse } from '@/types/weather';
import { computeAQIFromPM } from '@/services/aqiService';
import { get_warning } from '@/services/warning';
import ResponsiveIframe from './ui/iframe';

interface WeatherPageProps {
  onBackToSchedule?: () => void;
}

export const WeatherPage: React.FC<WeatherPageProps> = ({ onBackToSchedule }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastDays, setForecastDays] = useState<WeatherForeCastAPIResponse | null>(null);
  const [autoforecastResp, setAutoforecastResp] = useState<HourForecast | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherCurrentAPIResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [forecastResp, currentResp, autoforecastResp] = await Promise.all([
          ApiService.get_3_day_forecast_weather(),
          ApiService.get_current_weather(),
          ApiService.get_forecast_weather_auto(),
        ]);
        setForecastDays(forecastResp);
        setCurrentWeather(currentResp);
        setAutoforecastResp(autoforecastResp)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu thời tiết');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatHour = (t: string) => {
    try {
      const d = new Date(t);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return t;
    }
  };

  const pickRepresentativeHour = (hours: HourForecast[]): HourForecast | null => {
    if (!hours || hours.length === 0) return null;
    const midday = hours.find(h => new Date(h.time).getHours() === 12);
    return midday || hours[Math.min(12, hours.length - 1)];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sun className="h-6 w-6" /> Thời tiết
          </h2>
        </div>  
        {onBackToSchedule && (
          <Button variant="outline" onClick={onBackToSchedule} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại lịch học
          </Button>
        )}
      </div>

      {currentWeather && (
        <Card key={currentWeather.current.last_updated} className="overflow-hidden border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Hôm nay
            </span>
            {currentWeather?.current.condition?.icon && (
              <img src={(currentWeather?.current.condition.icon || '').startsWith('http') ? currentWeather?.current.condition.icon : `https:${currentWeather?.current.condition.icon}`} alt="icon" className="w-8 h-8" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-semibold">{Math.round(currentWeather.current.temp_c)}°C</div>
          <div className="text-gray-600 dark:text-gray-300">{currentWeather.current.condition?.text || 'N/A'}</div>
          <div className="grid grid-cols-2 gap-3 text-sm w-full max-w-xs mx-auto">
            <div className="flex items-center gap-2 justify-center"><Thermometer className="h-4 w-4" />Cao: {Math.round(currentWeather.current.temp_c)}°C</div>
            <div className="flex items-center gap-2 justify-center"><Leaf className="h-4 w-4" />AQI: {computeAQIFromPM(currentWeather.current.air_quality.pm2_5, currentWeather.current.air_quality.pm10).aqi}</div>
            <div className="flex items-center gap-2 justify-center"><Wind className="h-4 w-4" />Gió: {Math.round(currentWeather.current.wind_kph)} km/h</div>
            <div className="flex items-center gap-2 justify-center"><Droplets className="h-4 w-4" />Ẩm: {Math.round(currentWeather.current.humidity)}%</div>
          </div>
        </CardContent>
        <CardFooter>
            <div className="w-full rounded-xl border text-center border-yellow-300 dark:border-yellow-700 bg-gradient-to-r from-yellow-50 to-yellow-100/70 dark:from-yellow-900/40 dark:to-yellow-800/30 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-100 shadow-md whitespace-pre-line leading-relaxed">
                ⚠️ Lưu ý thời tiết
                <hr className="my-2 border-yellow-300 dark:border-yellow-700" />
                {get_warning(autoforecastResp, currentWeather)}
            </div>
        </CardFooter>

      </Card>
      )}

      {loading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-8 text-center">Đang tải dữ liệu thời tiết…</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-8 text-center text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {forecastDays?.forecast.forecastday.map((d) => {
            const rep = pickRepresentativeHour(d.hour);
            return (
              <Card key={d.date} className="overflow-hidden border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" /> {new Date(d.date).toLocaleDateString()}
                    </span>
                    {rep?.condition?.icon && (
                      <img src={(rep.condition.icon || '').startsWith('http') ? rep.condition.icon : `https:${rep.condition.icon}`} alt="icon" className="w-8 h-8" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-semibold">{Math.round(d.day.avgtemp_c)}°C</div>
                  <div className="text-gray-600 dark:text-gray-300">{d.day.condition?.text || 'N/A'}</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><Thermometer className="h-4 w-4" />Cao: {Math.round(d.day.maxtemp_c)}°C</div>
                    <div className="flex items-center gap-2"><Thermometer className="h-4 w-4" />Thấp: {Math.round(d.day.mintemp_c)}°C</div>
                    <div className="flex items-center gap-2"><Wind className="h-4 w-4" />Gió: {Math.round(d.day.maxwind_kph)} km/h</div>
                    <div className="flex items-center gap-2"><Droplets className="h-4 w-4" />Ẩm: {Math.round(d.day.avghumidity)}%</div>
                    <div className="flex items-center gap-2"><CloudRain className="h-4 w-4" />Mưa: {d.day.daily_chance_of_rain}%</div>
                    <div className="flex items-center gap-2"><FaHouseFloodWater className="h-4 w-4" />Tổng {Math.round(d.day.totalprecip_mm)} mm</div>
                  </div>

                  {/* Mini hours strip */}
                  <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Một số mốc giờ</div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {d.hour.filter((_, __) => [6, 9, 12, 15].includes(new Date(_.time).getHours())).map((h) => (
                        <div key={h.time} className="p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                          <div className="font-medium">{formatHour(h.time)}</div>
                          <div className="flex items-center gap-1">
                            {h.condition?.icon && (
                              <img src={(h.condition.icon || '').startsWith('http') ? h.condition.icon : `https:${h.condition.icon}`} className="w-4 h-4" />
                            )}
                            <span>{Math.round(h.temp_c)}°C</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <ResponsiveIframe
          className='lg:hidden'
          src="https://embed.windy.com/embed.html?type=forecast&location=coordinates&detail=true&detailLat=10.954859&detailLon=106.7961&metricTemp=default&metricRain=default&metricWind=default"
          aspectRatio={16/9}
          allowFullScreen={false}
          autoResize={true}
          />
        </div>
      )}
    </div>
  );
};

export default WeatherPage;


