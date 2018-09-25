import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
// import { map, retry, catchError } from 'rxjs/operators';
import {Crime} from '../models/crime';

@Injectable()
export class CrimeService {

  constructor(private http: HttpClient) {
  }

  getCrimes(areaCoords, filter): Observable<Crime[]> {
    const params = new HttpParams()
      .set('date', filter.date)
      .set('poly', areaCoords);
    return this.http.get<Crime[]>(`https://data.police.uk/api/crimes-street/${filter.category}`, {params});
  }
}
