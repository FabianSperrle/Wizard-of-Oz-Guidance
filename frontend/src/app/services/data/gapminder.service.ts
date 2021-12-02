import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface FertilityLifeExpectancy {
  'year': number;
  'country': string;
  'cluster': number;
  'pop': number;
  'life_expect': number;
  'fertility': number;
}

export class GenericScatterData {
  year: number;
  country: string;
  x: number;
  y: number;

  constructor(year: number, country: string, x: number, y: number) {
    this.year = year;
    this.country = country;
    this.x = x;
    this.y = y;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GapminderService {

  constructor(private http: HttpClient) { }

  getFertilityVsLifeExpectancy(): Observable<GenericScatterData[]> {
    return this.http.get<FertilityLifeExpectancy[]>(`${environment.backend}/data/fertilityLifeExpectancy/`)
      .pipe(map(arr => arr.map(d => new GenericScatterData(d.year, d.country, d.life_expect, d.fertility))));
  }
}
