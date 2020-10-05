import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IResponseUsers } from '../../../interfaces';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private _httpClient: HttpClient) {}

  fetchUsersList(url: string): Observable<IResponseUsers> {
    return this._httpClient
      .get<any>(url)
      .pipe(map((results) => ({ users: results.results, next: results.next, previous: results.previous, count: results.count })));
  }
}
