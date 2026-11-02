import type {
  Booking,
  Field,
  OperatingSchedule,
  Payment,
  Price,
  Profile,
  Summary,
} from './types'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const result = (await response.json()) as ApiResponse<T>
  if (!response.ok || !result.success) {
    throw new Error(result.error || result.message || 'Permintaan gagal diproses')
  }
  return result.data
}

function send<T>(path: string, method: string, body?: unknown) {
  return request<T>(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

export const api = {
  fields: {
    list: () => request<Field[]>('/api/fields'),
    create: (body: Omit<Field, 'id'>) => send<Field>('/api/fields', 'POST', body),
    update: (id: number, body: Partial<Field>) => send<Field>(`/api/fields/${id}`, 'PUT', body),
    remove: (id: number) => send<null>(`/api/fields/${id}`, 'DELETE'),
  },
  schedules: {
    list: () => request<OperatingSchedule[]>('/api/schedules'),
    create: (body: Omit<OperatingSchedule, 'id'>) => send<OperatingSchedule>('/api/schedules', 'POST', body),
    update: (id: number, body: Partial<OperatingSchedule>) => send<OperatingSchedule>(`/api/schedules/${id}`, 'PUT', body),
    remove: (id: number) => send<null>(`/api/schedules/${id}`, 'DELETE'),
  },
  bookings: {
    list: () => request<Booking[]>('/api/bookings'),
    create: (body: Omit<Booking, 'id' | 'booking_code' | 'field_name' | 'status' | 'payment_status'>) => send<Booking>('/api/bookings', 'POST', body),
    update: (id: number, body: Partial<Booking>) => send<Booking>(`/api/bookings/${id}`, 'PUT', body),
    setStatus: (id: number, status: Booking['status']) => send<Booking>(`/api/bookings/${id}/status`, 'PATCH', { status }),
    remove: (id: number) => send<null>(`/api/bookings/${id}`, 'DELETE'),
  },
  payments: {
    list: () => request<Payment[]>('/api/payments'),
    setStatus: (id: number, status: Payment['status']) => send<Payment>(`/api/payments/${id}/status`, 'PATCH', { status }),
  },
  prices: {
    list: () => request<Price[]>('/api/prices'),
    create: (body: Omit<Price, 'id' | 'field_name'>) => send<Price>('/api/prices', 'POST', body),
    update: (id: number, body: Partial<Price>) => send<Price>(`/api/prices/${id}`, 'PUT', body),
    remove: (id: number) => send<null>(`/api/prices/${id}`, 'DELETE'),
  },
  profile: {
    get: () => request<Profile>('/api/profile'),
    update: (body: Profile) => send<Profile>('/api/profile', 'PUT', body),
  },
  summary: (today: string) => request<Summary>(`/api/reports/summary?today=${today}`),
}

