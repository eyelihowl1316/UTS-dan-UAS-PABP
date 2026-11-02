export type FieldStatus = 'Aktif' | 'Perawatan'
export type BookingStatus = 'Menunggu' | 'Dikonfirmasi' | 'Dibatalkan'
export type PaymentStatus = 'Menunggu' | 'Terverifikasi' | 'Refund'
export type OpenStatus = 'Buka' | 'Tutup'

export interface Field {
  id: number
  name: string
  surface_type: string
  capacity: string
  status: FieldStatus
  hourly_rate: number
}

export interface OperatingSchedule {
  id: number
  day_label: string
  open_time: string
  close_time: string
  status: OpenStatus
}

export interface Booking {
  id: number
  booking_code: string
  customer: string
  phone: string
  field_id: number
  field_name: string
  booking_date: string
  start_time: string
  end_time: string
  total_amount: number
  status: BookingStatus
  payment_status: 'Menunggu' | 'Lunas' | 'Refund'
}

export interface Payment {
  id: number
  transaction_code: string
  booking_id: number
  booking_code: string
  customer: string
  method: string
  amount: number
  status: PaymentStatus
  payment_date: string
}

export interface Price {
  id: number
  field_id: number
  field_name: string
  period: string
  start_time: string
  end_time: string
  price: number
}

export interface Profile {
  name: string
  email: string
}

export interface Summary {
  field_count: number
  bookings_today: number
  pending_bookings: number
  booking_count: number
  confirmed_bookings: number
  cancelled_bookings: number
  verified_revenue: number
  payment_count: number
  pending_payments: number
  refunds: number
}

