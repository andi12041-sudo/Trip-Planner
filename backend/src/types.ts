export interface Plan {
  id: string;
  planName: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  createdAt: string; // ISO 문자열
}

export interface Schedule {
  id: string;
  date: string;          // YYYY-MM-DD
  startTime?: string;    // HH:mm
  endTime?: string;      // HH:mm
  title: string;
  location?: string;
  description?: string;
  memo?: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
}
