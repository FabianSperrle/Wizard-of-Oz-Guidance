import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { MeasurementDimension } from '../../tasks/weather-analysis/weather-analysis.component';

export interface Measurement {
  date: Date;
  station: string;
  continent: string;

  humidity: number;
  pressure: number;
  temperature: number;
  avg_temp: number;
  min_temp: number;
  max_temp: number;
  wind_direction: number;
  wind_speed: number;
  rainy_days: number;
  foggy_days: number;
  snowy_days: number;
  stormy_days: number;
  cloudy_days: number;
  // rain: number;
  // snow: number;
}

export const MeasurementDimensionUnitMap = new Map<MeasurementDimension, string>([
  ['humidity', '%'],
  ['pressure', 'hpa'],
  ['avg_temp', '°C'],
  ['min_temp', '°C'],
  ['max_temp', '°C'],
  ['wind_speed', 'kts'],
  ['wind_direction', '°'],
  ['rainy_days', '%'],
  ['foggy_days', '%'],
  ['snowy_days', '%'],
  ['stormy_days', '%'],
  ['cloudy_days', '%'],
]);

@Injectable({
  providedIn: 'root'
})
export class WeatherdataService {

  constructor(private http: HttpClient) { }

  getAllMeasurements(): Observable<Measurement[]> {
    return this.http.get<Measurement[]>(`${environment.backend}/measurements/`)
      .pipe(map(arr => arr.map(d => {
        d.date = new Date(d.date);
        d.avg_temp = d.temperature;
        d.rainy_days *= 100;
        d.foggy_days *= 100;
        d.snowy_days *= 100;
        d.stormy_days *= 100;
        d.cloudy_days *= 100;
        return d;
      })));
  }
}
