import axios from "axios";

import type {
  Booking,
  Field,
  OperatingSchedule,
  Payment,
  Price,
  Profile,
  Summary,
} from "./types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {"Content-Type": "application/json"},
  timeout : 15000,
});

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url ?? "";
    const isAuthCall = url.includes("/api/auth/");

    if (error?.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    return Promise.reject(error);
  },
);


async function request<T>(
  path: string,
  config?: { method?: string; data?: unknown },
): Promise<T> {
  try {
    const response = await http.request<ApiResponse<T>>({
      url: path,
      method: config?.method ?? "GET",
      data: config?.data,
    });
    const result = response.data;
    if (!result?.success) {
      throw new Error(
        result?.error || result?.message || "Permintaan gagal diproses",
      );
    }
    return result.data;
      } catch (error) {
    if (axios.isAxiosError<Partial<ApiResponse<unknown>>>(error)) {
      if (error.response) {
        // server membalas dengan status 4xx/5xx
        const { data, status } = error.response;
        throw new Error(
          data?.error ||
            data?.message ||
            `Permintaan gagal diproses (${status})`,
          { cause: error },
        );
      }
      if (error.code === "ECONNABORTED") {
        throw new Error("Tidak dapat terhubung ke server (waktu habis).", {
          cause: error,
        });
      }
      // server mati / jaringan putus
      throw new Error("Tidak dapat terhubung ke server.", { cause: error });
    }
    throw error;
  }
} 

function send<T>(path: string, method: string, body?: unknown) {
  return request<T>(path, { method, data: body });
}

export const api = {

    auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>("/api/auth/login", {
        method: "POST",
        data: { email, password },
      }),

      register: (name: string, email: string, password: string) =>
        request<LoginResponse>("/api/auth/register", {
          method: "POST",
          data: { name, email, password },
        }),
  },

  fields: {
    list: () => request<Field[]>("/api/fields"),
    create: (body: Omit<Field, "id">) =>
      send<Field>("/api/fields", "POST", body),
    update: (id: number, body: Partial<Field>) =>
      send<Field>(`/api/fields/${id}`, "PUT", body),
    remove: (id: number) => send<null>(`/api/fields/${id}`, "DELETE"),
  },
  schedules: {
    list: () => request<OperatingSchedule[]>("/api/schedules"),
    create: (body: Omit<OperatingSchedule, "id">) =>
      send<OperatingSchedule>("/api/schedules", "POST", body),
    update: (id: number, body: Partial<OperatingSchedule>) =>
      send<OperatingSchedule>(`/api/schedules/${id}`, "PUT", body),
    remove: (id: number) => send<null>(`/api/schedules/${id}`, "DELETE"),
  },
  bookings: {
    list: () => request<Booking[]>("/api/bookings"),
    create: (
      body: Omit<
        Booking,
        "id" | "booking_code" | "field_name" | "status" | "payment_status"
      >,
    ) => send<Booking>("/api/bookings", "POST", body),
    update: (id: number, body: Partial<Booking>) =>
      send<Booking>(`/api/bookings/${id}`, "PUT", body),
    setStatus: (id: number, status: Booking["status"]) =>
      send<Booking>(`/api/bookings/${id}/status`, "PATCH", { status }),
    remove: (id: number) => send<null>(`/api/bookings/${id}`, "DELETE"),
  },
  payments: {
    list: () => request<Payment[]>("/api/payments"),
    setStatus: (id: number, status: Payment["status"]) =>
      send<Payment>(`/api/payments/${id}/status`, "PATCH", { status }),
  },
  prices: {
    list: () => request<Price[]>("/api/prices"),
    create: (body: Omit<Price, "id" | "field_name">) =>
      send<Price>("/api/prices", "POST", body),
    update: (id: number, body: Partial<Price>) =>
      send<Price>(`/api/prices/${id}`, "PUT", body),
    remove: (id: number) => send<null>(`/api/prices/${id}`, "DELETE"),
  },
  profile: {
    get: () => request<Profile>("/api/profile"),
    update: (body: Profile) => send<Profile>("/api/profile", "PUT", body),
  },
  summary: (today: string) =>
    request<Summary>(`/api/reports/summary?today=${today}`),
} 
