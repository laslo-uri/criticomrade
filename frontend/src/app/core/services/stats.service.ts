import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PlatformStats } from '../models/stats.model';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  constructor(private api: ApiService) {}

  getStats(): Observable<PlatformStats> {
    return this.api.get<PlatformStats>('/stats');
  }
}
