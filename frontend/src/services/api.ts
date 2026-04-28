import { Plan, Schedule } from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? '서버 오류가 발생했습니다.');
  }

  return data as T;
}

// ─── 플랜 API ──────────────────────────────────────────────
export async function createPlan(payload: {
  planName: string;
  destination: string;
  startDate: string;
  endDate: string;
}): Promise<Plan> {
  return request<Plan>('/api/plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPlan(planId: string): Promise<Plan> {
  return request<Plan>(`/api/plans/${planId}`);
}

export async function updatePlan(
  planId: string,
  payload: Partial<Omit<Plan, 'id' | 'createdAt'>>,
): Promise<Plan> {
  return request<Plan>(`/api/plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePlan(planId: string): Promise<void> {
  await request<{ message: string }>(`/api/plans/${planId}`, { method: 'DELETE' });
}

// ─── 스케줄 API ────────────────────────────────────────────
export async function getSchedules(planId: string): Promise<Schedule[]> {
  return request<Schedule[]>(`/api/plans/${planId}/schedules`);
}

export async function createSchedule(
  planId: string,
  payload: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Schedule> {
  return request<Schedule>(`/api/plans/${planId}/schedules`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSchedule(
  planId: string,
  scheduleId: string,
  payload: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Schedule> {
  return request<Schedule>(`/api/plans/${planId}/schedules/${scheduleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteSchedule(planId: string, scheduleId: string): Promise<void> {
  await request<{ message: string }>(`/api/plans/${planId}/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
}
