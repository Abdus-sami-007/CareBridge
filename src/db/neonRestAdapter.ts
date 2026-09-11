import { CheckinDbRecord, RiskLevel, VictimDbRecord } from '../types';
import type { IDatabaseAdapter } from './databasePlaceholder';

const DEFAULT_NEON_DATABASE_URL =
  'https://ep-morning-breeze-a5m3lsnf.apirest.us-east-2.aws.neon.tech/neondb/rest/v1';

type PostgrestRecord = Record<string, unknown>;

/** Database adapter for Neon SQL Editor's PostgREST-compatible Data API. */
export class NeonRestAdapter implements IDatabaseAdapter {
  public readonly name = 'Neon REST Database Adapter';
  private connected = true;

  constructor(
    private readonly baseUrl: string = process.env.NEON_API_URL || process.env.NEON_DATABASE_URL || DEFAULT_NEON_DATABASE_URL,
    private readonly apiKey = process.env.NEON_API_KEY || ''
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    await this.request('victims?select=id&limit=1');
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getVictim(id: string): Promise<VictimDbRecord | null> {
    const rows = await this.request<VictimDbRecord[]>(
      `victims?id=eq.${encodeURIComponent(id)}&select=id,name,case_id,risk_level,latest_score,password_hash&limit=1`
    );
    return rows[0] || null;
  }

  async upsertVictim(victim: VictimDbRecord): Promise<VictimDbRecord> {
    const rows = await this.request<VictimDbRecord[]>('victims?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(victim)
    });
    return rows[0] || victim;
  }

  async listVictims(): Promise<VictimDbRecord[]> {
    return this.request<VictimDbRecord[]>(
      'victims?select=id,name,case_id,risk_level,latest_score&order=latest_score.desc'
    );
  }

  async updateVictimScore(
    id: string,
    risk_level: RiskLevel | string,
    latest_score: number
  ): Promise<void> {
    await this.request(`victims?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ risk_level, latest_score })
    });
  }

  async insertCheckin(checkin: CheckinDbRecord): Promise<CheckinDbRecord> {
    const rows = await this.request<CheckinDbRecord[]>('checkins', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(checkin)
    });
    return rows[0] || checkin;
  }

  async getCheckinsForVictim(victim_id: string, limit = 50): Promise<CheckinDbRecord[]> {
    return this.request<CheckinDbRecord[]>(
      `checkins?victim_id=eq.${encodeURIComponent(victim_id)}&select=id,victim_id,message,score,risk_category,trigger_factors,created_at&order=created_at.desc&limit=${Math.max(1, limit)}`
    );
  }

  async listCheckins(limit = 100): Promise<CheckinDbRecord[]> {
    return this.request<CheckinDbRecord[]>(
      `checkins?select=id,victim_id,message,score,risk_category,trigger_factors,created_at&order=created_at.desc&limit=${Math.max(1, limit)}`
    );
  }

  private async request<T = PostgrestRecord[]>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
      headers.set('apikey', this.apiKey);
    }

    const response = await fetch(`${this.baseUrl}/${path}`, { ...init, headers });
    if (!response.ok) {
      this.connected = false;
      const detail = await response.text();
      throw new Error(`Neon REST request failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    this.connected = true;
    if (response.status === 204) return [] as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : []) as T;
  }
}

export function isNeonRestConfigured(): boolean {
  const apiUrl = process.env.NEON_API_URL || process.env.NEON_DATABASE_URL;
  const apiKey = process.env.NEON_API_KEY;
  return Boolean(
    apiUrl &&
    apiKey &&
    apiKey !== 'your_neon_api_key_or_jwt_token_here' &&
    apiKey !== 'MY_NEON_API_KEY'
  );
}

export { DEFAULT_NEON_DATABASE_URL };