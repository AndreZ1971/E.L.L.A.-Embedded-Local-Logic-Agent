export interface WeatherDay {
  date: string;
  label: string;
  tempMin: number;
  tempMax: number;
  precipMm: number;
  description: string;
}

export interface WeatherResult {
  location: string;
  days: WeatherDay[];
}

export const WMO_CODES: Record<number, string> = {
  0: "Klarer Himmel",
  1: "Überwiegend klar",
  2: "Teilweise bewölkt",
  3: "Bedeckt",
  45: "Nebel",
  48: "Gefrierender Nebel",
  51: "Leichter Nieselregen",
  53: "Mäßiger Nieselregen",
  55: "Starker Nieselregen",
  61: "Leichter Regen",
  63: "Mäßiger Regen",
  65: "Starker Regen",
  71: "Leichter Schneefall",
  73: "Mäßiger Schneefall",
  75: "Starker Schneefall",
  80: "Leichte Regenschauer",
  81: "Mäßige Regenschauer",
  82: "Starke Regenschauer",
  85: "Schneeschauer",
  95: "Gewitter",
  96: "Gewitter mit Hagel",
  99: "Starkes Gewitter mit Hagel",
};

export function wmoLabel(code: number): string {
  return WMO_CODES[code] ?? "Unbekannte Wetterlage";
}

async function geocode(
  city: string,
): Promise<{ lat: number; lon: number; name: string }> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`Geocoding fehlgeschlagen: HTTP ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{ latitude: number; longitude: number; name: string }>;
  };
  const first = data.results?.[0];
  if (!first) throw new Error(`Ort nicht gefunden: "${city}"`);
  return { lat: first.latitude, lon: first.longitude, name: first.name };
}

export async function getWeather(
  city: string,
  days = 3,
): Promise<WeatherResult> {
  const { lat, lon, name } = await geocode(city);
  const forecastDays = Math.min(7, Math.max(1, days));
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
    `&timezone=Europe%2FBerlin` +
    `&forecast_days=${forecastDays}` +
    `&language=de`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok)
    throw new Error(`Wetterdaten fehlgeschlagen: HTTP ${res.status}`);

  const data = (await res.json()) as {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      weathercode: number[];
    };
  };

  const DAY_LABELS = ["Heute", "Morgen", "Übermorgen"];

  return {
    location: name,
    days: data.daily.time.map((date, i) => ({
      date,
      label: DAY_LABELS[i] ?? date,
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      precipMm: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
      description: wmoLabel(data.daily.weathercode[i]),
    })),
  };
}
