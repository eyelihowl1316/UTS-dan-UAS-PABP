import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Login from "./Login";
import type { AuthUser } from "./api";
import { api } from "./api";
import type {
  Booking,
  Field,
  OperatingSchedule,
  Payment,
  Price,
  Profile,
  Summary,
} from "./types";
import "./App.css";

type PageKey =
  | "dashboard"
  | "fields"
  | "schedule"
  | "bookings"
  | "payments"
  | "prices"
  | "reports"
  | "profile";
type DialogKind = "field" | "booking" | "schedule" | "price";
type EditableRecord = Field | OperatingSchedule | Booking | Price;
type FormBody = Record<string, string>;

const navItems: { id: PageKey; label: string; icon: string; group: string }[] =
  [
    { id: "dashboard", label: "Dashboard", icon: "⌂", group: "Menu utama" },
    { id: "fields", label: "Data Lapangan", icon: "▦", group: "Pengelolaan" },
    {
      id: "schedule",
      label: "Jadwal Operasional",
      icon: "◷",
      group: "Pengelolaan",
    },
    { id: "bookings", label: "Pemesanan", icon: "▤", group: "Pengelolaan" },
    { id: "payments", label: "Pembayaran", icon: "◈", group: "Pengelolaan" },
    { id: "prices", label: "Harga Sewa", icon: "Rp", group: "Pengelolaan" },
    { id: "reports", label: "Laporan", icon: "▥", group: "Lainnya" },
    { id: "profile", label: "Profil Pengelola", icon: "◉", group: "Lainnya" },
  ];

const emptySummary: Summary = {
  field_count: 0,
  bookings_today: 0,
  pending_bookings: 0,
  booking_count: 0,
  confirmed_bookings: 0,
  cancelled_bookings: 0,
  verified_revenue: 0,
  payment_count: 0,
  pending_payments: 0,
  refunds: 0,
};

function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function money(value: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function hoursBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return endH + endM / 60 - (startH + startM / 60);
}

function routeFromHash(): PageKey {
  const value = window.location.hash.replace(/^#\/?/, "") as PageKey;
  return navItems.some((item) => item.id === value) ? value : "dashboard";
}

function statusClass(status: string) {
  if (
    ["Aktif", "Lunas", "Terverifikasi", "Dikonfirmasi", "Buka"].includes(status)
  )
    return "success";
  if (["Menunggu", "Perawatan"].includes(status)) return "warning";
  if (["Dibatalkan", "Refund", "Tutup"].includes(status)) return "danger";
  return "neutral";
}

function Status({ children }: { children: string }) {
  return (
    <span className={`status status-${statusClass(children)}`}>
      <i />
      {children}
    </span>
  );
}

function App() {

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
  const token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (!token || !savedUser) return null;

  try {
    return JSON.parse(savedUser) as AuthUser;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
});

  const [page, setPage] = useState<PageKey>(routeFromHash);
  const [fields, setFields] = useState<Field[]>([]);
  const [schedules, setSchedules] = useState<OperatingSchedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const profile: Profile = {
  name: currentUser?.name ?? "Pengelola",
  email: currentUser?.email ?? "",
};
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{
    kind: DialogKind;
    item: EditableRecord | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [confirmState, setConfirmState] =useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        fieldRows,
        scheduleRows,
        bookingRows,
        paymentRows,
        priceRows,
        summaryRow,
      ] = await Promise.all([
        api.fields.list(),
        api.schedules.list(),
        api.bookings.list(),
        api.payments.list(),
        api.prices.list(),
        api.summary(todayLocal()),
      ]);
      setFields(fieldRows);
      setSchedules(scheduleRows);
      setBookings(bookingRows);
      setPayments(paymentRows);
      setPrices(priceRows);
      setSummary(summaryRow);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const updatePage = () => setPage(routeFromHash());
    window.addEventListener("hashchange", updatePage);
    if (!window.location.hash) window.location.hash = "/dashboard";
    return () => window.removeEventListener("hashchange", updatePage);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
  setDialogError("");
}, [dialog]);

  const currentItem = navItems.find((item) => item.id === page) ?? navItems[0];
  const query = search.trim().toLocaleLowerCase("id-ID");
  const visibleFields = useMemo(
    () =>
      fields.filter((item) =>
        `${item.name} ${item.surface_type} ${item.capacity} ${item.status}`
          .toLocaleLowerCase("id-ID")
          .includes(query),
      ),
    [fields, query],
  );
  const visibleSchedules = useMemo(
    () =>
      schedules.filter((item) =>
        `${item.day_label} ${item.status}`
          .toLocaleLowerCase("id-ID")
          .includes(query),
      ),
    [schedules, query],
  );
  const visibleBookings = useMemo(
    () =>
      bookings.filter((item) =>
        `${item.booking_code} ${item.customer} ${item.phone} ${item.field_name} ${item.status}`
          .toLocaleLowerCase("id-ID")
          .includes(query),
      ),
    [bookings, query],
  );
  const visiblePayments = useMemo(
    () =>
      payments.filter((item) =>
        `${item.transaction_code} ${item.booking_code} ${item.customer} ${item.method} ${item.status}`
          .toLocaleLowerCase("id-ID")
          .includes(query),
      ),
    [payments, query],
  );
  const visiblePrices = useMemo(
    () =>
      prices.filter((item) =>
        `${item.field_name} ${item.period}`
          .toLocaleLowerCase("id-ID")
          .includes(query),
      ),
    [prices, query],
  );

  async function mutate(
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    try {
      await action();
      setNotice(successMessage);
      await loadData();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Perubahan gagal disimpan.",
      );
    }
  }

 function removeRecord(
    kind: "field" | "schedule" | "booking" | "price",
    id: number,
  ) {
    const actions = {
      field: () => api.fields.remove(id),
      schedule: () => api.schedules.remove(id),
      booking: () => api.bookings.remove(id),
      price: () => api.prices.remove(id),
    };
    setConfirmState({
        tittle: "Hapus data ini?",
        message: "Data yang dihapus tidak dapat dikembalikan.",
        confirmLabel: "Ya, hapus",
        danger: true,
        onConfirm: () => void mutate(actions[kind], "Data berhasil dihapus."),
      });
  }

  async function saveRecord(kind: DialogKind, values: FormBody, id?: number) {
    setSaving(true);
    setDialogError("");
    try {
      if (kind === "field") {
        const body = {
          ...values,
          hourly_rate: Number(values.hourly_rate),
        } as unknown as Omit<Field, "id">;
        if (id) await api.fields.update(id, body);
        else await api.fields.create(body);
      } else if (kind === "schedule") {
        const body = values as unknown as Omit<OperatingSchedule, "id">;
        if (id) await api.schedules.update(id, body);
        else await api.schedules.create(body);
      } else if (kind === "booking") {
        const body = {
          ...values,
          field_id: Number(values.field_id),
          total_amount: Number(values.total_amount),
        } as unknown as Omit<
          Booking,
          "id" | "booking_code" | "field_name" | "status" | "payment_status"
        >;
        if (id) await api.bookings.update(id, body);
        else await api.bookings.create(body);
      } else {
        const body = {
          ...values,
          field_id: Number(values.field_id),
          price: Number(values.price),
        } as unknown as Omit<Price, "id" | "field_name">;
        if (id) await api.prices.update(id, body);
        else await api.prices.create(body);
      }
      setDialog(null);
      setNotice(
        id ? "Perubahan berhasil disimpan." : "Data baru berhasil ditambahkan.",
      );
      await loadData();
    } catch (error) {
      setDialogError(
        error instanceof Error ? error.message : "Data gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const values = Object.fromEntries(
    new FormData(event.currentTarget).entries(),
  );
  const name = String(values.name);
  const email = String(values.email);
  try {
    await api.profile.update({ name, email });
    if (currentUser) {
      const updated = { ...currentUser, name, email };
      localStorage.setItem("user", JSON.stringify(updated));
      setCurrentUser(updated);
    }
    setNotice("Profil berhasil diperbarui.");
  } catch (error) {
    setNotice(
      error instanceof Error ? error.message : "Profil gagal disimpan.",
    );
  }
}

function logout() {
  setConfirmState({
    tittle: "Keluar dari akun?",
    message: "Kamu harus logi lagi untuk mengakses panel pengelola",
    confirmLabel: "Ya, keluar",
    danger: true,
    onConfirm: dologout,
  });
}

function dologout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setCurrentUser(null);
  setMobileOpen(false);
  setDialog(null);
  setSearch("");
  window.location.hash = "/dashboard";
}
  
  function actionButton(label: string, action: () => void, kind = "") {
    return (
      <button
        className={`button button-small ${kind}`}
        onClick={action}
        type="button"
      >
        {label}
      </button>
    );
  }

  function renderFields() {
    return (
      <div className="field-grid">
        {visibleFields.map((field) => (
          <article className="field-card" key={field.id}>
            <div className="field-art">
              <span className="field-art-mark">F</span>
              <span className="field-art-label">MJBCourt</span>
            </div>
            <div className="field-card-body">
              <div className="field-card-title">
                <div>
                  <p className="eyebrow">LAPANGAN</p>
                  <h3>{field.name}</h3>
                </div>
                <Status>{field.status}</Status>
              </div>
              <div className="field-meta">
                <span>{field.surface_type}</span>
                <span>{field.capacity}</span>
              </div>
              <p className="field-rate">
                {money(field.hourly_rate)} <span>/ jam</span>
              </p>
              <div className="row-actions">
                {actionButton("Edit", () =>
                  setDialog({ kind: "field", item: field }),
                )}
                {actionButton(
                  "Hapus",
                  () => void removeRecord("field", field.id),
                  "button-danger-ghost",
                )}
              </div>
            </div>
          </article>
        ))}
        {!visibleFields.length && (
          <EmptyState
            title="Belum ada lapangan"
            text="Tambahkan data lapangan untuk mulai mengelola jadwal dan pemesanan."
          />
        )}
      </div>
    );
  }

  function renderBookings(rows: Booking[]) {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID Booking</th>
              <th>Pelanggan</th>
              <th>Lapangan</th>
              <th>Tanggal & Jam</th>
              <th>Total</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <strong className="code-text">{booking.booking_code}</strong>
                </td>
                <td>
                  {booking.customer}
                  <small>{booking.phone}</small>
                </td>
                <td>{booking.field_name}</td>
                <td>
                  {formatDate(booking.booking_date)}
                  <small>
                    {booking.start_time}–{booking.end_time}
                  </small>
                </td>
                <td>{money(booking.total_amount)}</td>
                <td>
                  <Status>{booking.payment_status}</Status>
                </td>
                <td>
                  <Status>{booking.status}</Status>
                </td>
                <td>
                  <div className="row-actions compact">
                    {booking.status === "Menunggu" &&
                      actionButton(
                        "Konfirmasi",
                        () =>
                          void mutate(
                            () =>
                              api.bookings.setStatus(
                                booking.id,
                                "Dikonfirmasi",
                              ),
                            "Booking dikonfirmasi.",
                          ),
                        "button-primary",
                      )}
                    {booking.status !== "Dibatalkan" &&
                      actionButton(
                        "Batal",
                        () =>
                          void mutate(
                            () =>
                              api.bookings.setStatus(booking.id, "Dibatalkan"),
                            "Booking dibatalkan.",
                          ),
                        "button-danger-ghost",
                      )}
                    {actionButton("Edit", () =>
                      setDialog({ kind: "booking", item: booking }),
                    )}
                    {actionButton(
                      "Hapus",
                      () => void removeRecord("booking", booking.id),
                      "button-danger-ghost",
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <EmptyRow columns={8} text="Belum ada data pemesanan." />
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function renderPage() {
    switch (page) {
      case "dashboard":
        return (
          <>
            <section className="welcome-card">
              <div>
                <p className="eyebrow">PANEL PENGELOLA</p>
                <h2>Selamat datang, {profile.name.split(" ")[0]}.</h2>
                <p>Pantau aktivitas lapangan dan pemesanan hari ini.</p>
              </div>
              <div className="welcome-ball" aria-hidden="true">
                ⚽
              </div>
            </section>
            <section className="stat-grid">
              <StatCard
                label="Total Lapangan"
                value={summary.field_count}
                icon="▦"
                tone="green"
                foot="Terdaftar"
              />
              <StatCard
                label="Booking Hari Ini"
                value={summary.bookings_today}
                icon="▤"
                tone="blue"
                foot="Jadwal Masuk"
              />
              <StatCard
                label="Menunggu Konfirmasi"
                value={summary.pending_bookings}
                icon="◷"
                tone="amber"
                foot="Perlu Ditinjau"
              />
              <StatCard
                label="Pendapatan Tercatat"
                value={money(summary.verified_revenue)}
                icon="Rp"
                tone="purple"
                foot="Pembayaran Terverifikasi"
              />
            </section>
            <div className="content-grid dashboard-grid">
              <section className="panel">
                <PanelHeading
                  title="Booking terbaru"
                  subtitle="Pemesanan yang masuk ke sistem"
                  action={
                    <a href="#/bookings" className="text-link">
                      Lihat semua <span>→</span>
                    </a>
                  }
                />
                {renderBookings(bookings.slice(0, 4))}
              </section>
              <section className="panel">
                <PanelHeading
                  title="Status lapangan"
                  subtitle="Kondisi lapangan saat ini"
                />
                <div className="status-list">
                  {fields.map((field) => (
                    <div className="status-list-item" key={field.id}>
                      <div className="mini-court">F</div>
                      <div className="grow">
                        <strong>{field.name}</strong>
                        <small>{field.surface_type}</small>
                      </div>
                      <Status>{field.status}</Status>
                    </div>
                  ))}
                  {!fields.length && (
                    <EmptyState
                      title="Belum ada lapangan"
                      text="Data lapangan akan tampil di sini."
                    />
                  )}
                </div>
                <a href="#/fields" className="panel-bottom-link">
                  Kelola lapangan <span>→</span>
                </a>
              </section>
            </div>
            <div className="content-grid lower-grid">
              <section className="panel">
                <PanelHeading
                  title="Aktivitas pembayaran"
                  subtitle="Ringkasan verifikasi transaksi"
                />
                <div className="payment-summary">
                  <div>
                    <span className="summary-dot amber-dot" />
                    <span>Menunggu verifikasi</span>
                    <strong>{summary.pending_payments}</strong>
                  </div>
                  <div>
                    <span className="summary-dot green-dot" />
                    <span>Terverifikasi</span>
                    <strong>
                      {
                        payments.filter(
                          (payment) => payment.status === "Terverifikasi",
                        ).length
                      }
                    </strong>
                  </div>
                  <div>
                    <span className="summary-dot red-dot" />
                    <span>Refund</span>
                    <strong>{summary.refunds}</strong>
                  </div>
                </div>
                <a href="#/payments" className="panel-bottom-link">
                  Buka pembayaran <span>→</span>
                </a>
              </section>
              <section className="panel schedule-peek">
                <PanelHeading
                  title="Jam operasional"
                  subtitle="Waktu layanan lapangan"
                />
                {schedules.map((schedule) => (
                  <div className="schedule-peek-row" key={schedule.id}>
                    <div>
                      <strong>{schedule.day_label}</strong>
                      <small>
                        {schedule.open_time} — {schedule.close_time}
                      </small>
                    </div>
                    <Status>{schedule.status}</Status>
                  </div>
                ))}
                {!schedules.length && (
                  <EmptyState
                    title="Jadwal belum diatur"
                    text="Atur waktu layanan untuk pelanggan."
                  />
                )}
                <a href="#/schedule" className="panel-bottom-link">
                  Atur jadwal <span>→</span>
                </a>
              </section>
            </div>
          </>
        );
      case "fields":
        return <section className="page-section">{renderFields()}</section>;
      case "schedule":
        return (
          <section className="panel">
            <PanelHeading
              title="Jam operasional"
              subtitle="Atur hari dan waktu layanan lapangan"
            />
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Hari Operasional</th>
                    <th>Jam Buka</th>
                    <th>Jam Tutup</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSchedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>
                        <strong>{schedule.day_label}</strong>
                      </td>
                      <td>{schedule.open_time}</td>
                      <td>{schedule.close_time}</td>
                      <td>
                        <Status>{schedule.status}</Status>
                      </td>
                      <td>
                        <div className="row-actions">
                          {actionButton("Edit", () =>
                            setDialog({ kind: "schedule", item: schedule }),
                          )}
                          {actionButton(
                            "Hapus",
                            () => void removeRecord("schedule", schedule.id),
                            "button-danger-ghost",
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!visibleSchedules.length && (
                    <EmptyRow
                      columns={5}
                      text="Belum ada jadwal operasional."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      case "bookings":
        return (
          <section className="panel">
            <PanelHeading
              title="Daftar pemesanan"
              subtitle={`${bookings.length} pemesanan tercatat`}
            />
            {renderBookings(visibleBookings)}
          </section>
        );
      case "payments":
        return (
          <>
            <section className="stat-grid payment-stats">
              <StatCard
                label="Total Transaksi"
                value={summary.payment_count}
                icon="◈"
                tone="blue"
                foot="semua transaksi"
              />
              <StatCard
                label="Menunggu Verifikasi"
                value={summary.pending_payments}
                icon="◷"
                tone="amber"
                foot="perlu ditinjau"
              />
              <StatCard
                label="Dana Terverifikasi"
                value={money(summary.verified_revenue)}
                icon="✓"
                tone="green"
                foot="tercatat di sistem"
              />
              <StatCard
                label="Refund"
                value={summary.refunds}
                icon="↶"
                tone="purple"
                foot="transaksi dikembalikan"
              />
            </section>
            <section className="panel">
              <PanelHeading
                title="Riwayat pembayaran"
                subtitle="Periksa dan perbarui status transaksi"
              />
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>ID Booking</th>
                      <th>Pelanggan</th>
                      <th>Tanggal</th>
                      <th>Metode</th>
                      <th>Jumlah</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <strong className="code-text">
                            {payment.transaction_code}
                          </strong>
                        </td>
                        <td>{payment.booking_code}</td>
                        <td>{payment.customer}</td>
                        <td>{formatDate(payment.payment_date)}</td>
                        <td>{payment.method}</td>
                        <td>{money(payment.amount)}</td>
                        <td>
                          <Status>{payment.status}</Status>
                        </td>
                        <td>
                          <div className="row-actions compact">
                            {payment.status !== "Terverifikasi" &&
                              actionButton(
                                "Verifikasi",
                                () =>
                                  void mutate(
                                    () =>
                                      api.payments.setStatus(
                                        payment.id,
                                        "Terverifikasi",
                                      ),
                                    "Pembayaran terverifikasi.",
                                  ),
                                "button-primary",
                              )}
                            {payment.status !== "Refund" &&
                              actionButton(
                                "Tandai refund",
                                () =>
                                  void mutate(
                                    () =>
                                      api.payments.setStatus(
                                        payment.id,
                                        "Refund",
                                      ),
                                    "Pembayaran ditandai sebagai refund.",
                                  ),
                                "button-danger-ghost",
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!visiblePayments.length && (
                      <EmptyRow columns={8} text="Belum ada pembayaran." />
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        );
      case "prices":
        return (
          <section className="panel">
            <PanelHeading
              title="Daftar harga sewa"
              subtitle="Tarif lapangan berdasarkan periode dan jam"
            />
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Lapangan</th>
                    <th>Periode</th>
                    <th>Jam Mulai</th>
                    <th>Jam Selesai</th>
                    <th>Harga / Jam</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePrices.map((price) => (
                    <tr key={price.id}>
                      <td>
                        <strong>{price.field_name}</strong>
                      </td>
                      <td>
                        <span className="period-label">{price.period}</span>
                      </td>
                      <td>{price.start_time}</td>
                      <td>{price.end_time}</td>
                      <td>
                        <strong>{money(price.price)}</strong>
                      </td>
                      <td>
                        <div className="row-actions">
                          {actionButton("Edit", () =>
                            setDialog({ kind: "price", item: price }),
                          )}
                          {actionButton(
                            "Hapus",
                            () => void removeRecord("price", price.id),
                            "button-danger-ghost",
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!visiblePrices.length && (
                    <EmptyRow columns={6} text="Belum ada tarif sewa." />
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      case "reports":
        return (
          <>
            <section className="stat-grid report-stats">
              <StatCard
                label="Total Booking"
                value={summary.booking_count}
                icon="▤"
                tone="blue"
                foot="semua pemesanan"
              />
              <StatCard
                label="Dikonfirmasi"
                value={summary.confirmed_bookings}
                icon="✓"
                tone="green"
                foot="booking terkonfirmasi"
              />
              <StatCard
                label="Pendapatan"
                value={money(summary.verified_revenue)}
                icon="Rp"
                tone="purple"
                foot="pembayaran terverifikasi"
              />
              <StatCard
                label="Pembatalan"
                value={summary.cancelled_bookings}
                icon="×"
                tone="amber"
                foot="booking dibatalkan"
              />
            </section>
            <section className="panel">
              <PanelHeading
                title="Rekap pemesanan"
                subtitle={`Data per ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}`}
                action={
                  <button
                    className="button button-secondary"
                    onClick={() => window.print()}
                    type="button"
                  >
                    <span>▣</span> Cetak laporan
                  </button>
                }
              />
              {renderBookings(visibleBookings)}
            </section>
          </>
        );
      case "profile":
        return (
          <section className="panel profile-panel">
            <PanelHeading
              title="Informasi akun"
              subtitle="Perbarui informasi pengelola MJBCourt"
            />
            <form
              className="profile-form"
              key={`${profile.name}-${profile.email}`}
              onSubmit={(event) => void saveProfile(event)}
            >
              <div className="profile-avatar">
                {profile.name.trim().charAt(0).toLocaleUpperCase("id-ID") ||
                  "A"}
              </div>
              <div className="form-grid">
                <label className="form-field">
                  <span>Nama Pengelola</span>
                  <input defaultValue={profile.name} name="name" required />
                </label>
                <label className="form-field">
                  <span>Alamat Email</span>
                  <input
                    defaultValue={profile.email}
                    name="email"
                    type="email"
                    required
                  />
                </label>
                <div className="form-actions">
                  <button className="button button-primary" type="submit">
                    Simpan perubahan <span>→</span>
                  </button>
                </div>
              </div>
            </form>
          </section>
        );
    }
  }

  const allowSearch = [
    "fields",
    "schedule",
    "bookings",
    "payments",
    "prices",
  ].includes(page);
  const canAdd = ["fields", "schedule", "bookings", "prices"].includes(page);
  const addKind: DialogKind =
    page === "fields"
      ? "field"
      : page === "schedule"
        ? "schedule"
        : page === "bookings"
          ? "booking"
          : "price";
  const addLabel =
    page === "fields"
      ? "Tambah lapangan"
      : page === "schedule"
        ? "Tambah jadwal"
        : page === "bookings"
          ? "Tambah booking"
          : "Tambah tarif";
  if (!currentUser) {
  return (
    <Login
      onLogin={(user) => {
        setCurrentUser(user);
      }}
    />
  );
}
  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          aria-label="Tutup menu"
          className="sidebar-scrim"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#/dashboard">
          <span className="brand-mark">⚽</span>
          <span>
            MJB<span>Court</span>
            <small>SPORTS MANAGEMENT</small>
          </span>
        </a>
        <div className="sidebar-profile">
          <div className="avatar">
            {profile.name.trim().charAt(0).toLocaleUpperCase("id-ID") || "A"}
          </div>
          <div>
            <strong>{profile.name}</strong>
            <small>Administrator</small>
          </div>
          <span className="online-dot" />
        </div>
        {["Menu utama", "Pengelolaan", "Lainnya"].map((group) => (
          <nav className="nav-group" key={group} aria-label={group}>
            <p className="nav-group-title">{group}</p>
            {navItems
              .filter((item) => item.group === group)
              .map((item) => (
                <a
                  key={item.id}
                  className={`nav-link ${page === item.id ? "nav-active" : ""}`}
                  href={`#/${item.id}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {page === item.id && <span className="nav-active-mark" />}
                </a>
              ))}
          </nav>
        ))}
        
        <div className="sidebar-footer">
          <span className="sidebar-foot-icon">⚽</span>
          <div className="grow">
            <strong>{currentUser?.name}</strong>
            <small>{currentUser?.email}</small>
          </div>
          <button className="logout-mini" onClick={logout} type="button">
            <span aria-hidden="true">⏻</span> Keluar
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            aria-label="Buka menu"
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            type="button"
          >
            ☰
          </button>
          <div className="breadcrumb">
            <span>MJBCourt</span>
            <i>/</i>
            <strong>{currentItem.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="today-label">
              {new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </span>
            <span className="topbar-divider" />
            <a className="topbar-user" href="#/profile">
              <span className="avatar avatar-small">
                {profile.name.trim().charAt(0).toLocaleUpperCase("id-ID") ||
                  "A"}
              </span>
              <strong>{profile.name}</strong>
              <span className="chevron">⌄</span>
            </a>
            <button className="button-logout" onClick={logout} type="button">
              <span aria-hidden="true">⏻</span> Keluar
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                MJBCourt / {currentItem.group.toUpperCase()}
              </p>
              <h1>{currentItem.label}</h1>
              <p className="page-subtitle">{pageSubtitle(page)}</p>
            </div>
            <div className="heading-actions">
              {canAdd && (
                <button
                  className="button button-primary"
                  onClick={() => setDialog({ kind: addKind, item: null })}
                  type="button"
                >
                  <span className="plus">+</span>
                  {addLabel}
                </button>
              )}
            </div>
          </div>
          {allowSearch && (
            <div className="toolbar">
              <label className="search-box">
                <span>⌕</span>
                <input
                  aria-label="Cari data"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari data..."
                  value={search}
                />
                {search && (
                  <button
                    aria-label="Hapus pencarian"
                    onClick={() => setSearch("")}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </label>
              <span className="toolbar-count">
                {countForPage(
                  page,
                  fields,
                  schedules,
                  bookings,
                  payments,
                  prices,
                )}{" "}
                data
              </span>
            </div>
          )}
          {notice && (
            <div
              className={`notice ${notice.toLowerCase().includes("gagal") || notice.toLowerCase().includes("tidak dapat") || notice.toLowerCase().includes("tidak ditemukan") ? "notice-error" : ""}`}
              role="status"
            >
              <span>
                {notice.toLowerCase().includes("gagal") ||
                notice.toLowerCase().includes("tidak dapat")
                  ? "!"
                  : "✓"}
              </span>
              {notice}
              <button
                aria-label="Tutup pesan"
                onClick={() => setNotice("")}
                type="button"
              >
                ×
              </button>
            </div>
          )}
          {loading && (
            <div className="loading-line">
              <span />
              Memuat data...
            </div>
          )}
          {renderPage()}
          <footer className="page-footer">
            <span>© 2026 MJBCourt</span>
            <span>
              Dikelola oleh <b>anak baik-baik</b> untuk permainan yang lebih
              baik
            </span>
          </footer>
          {confirmState && (
            <ConfirmDialog
              title={confirmState.tittle}
              message={confirmState.message}
              confirmLabel={confirmState.confirmLabel}
              danger={confirmState.danger}
              onCancel={() => setConfirmState(null)}
              onConfirm={() => {
                confirmState.onConfirm();
                setConfirmState(null);
              }}
            />
          )}
        </div>
      </main>
      {dialog && (
        <FormDialog
          kind={dialog.kind}
          item={dialog.item}
          fields={fields}
          prices={prices}
          saving={saving}
          error={dialogError}
          onClose={() => setDialog(null)}
          onSave={(values) => saveRecord(dialog.kind, values, dialog.item?.id)}
        />
      )}
    </div>
  );
}

function pageSubtitle(page: PageKey) {
  const subtitles: Record<PageKey, string> = {
    dashboard: "Ringkasan aktivitas dan kondisi fasilitas.",
    fields: "Kelola informasi, kapasitas, dan tarif lapangan.",
    schedule: "Tentukan jam layanan untuk setiap hari operasional.",
    bookings: "Pantau dan kelola pemesanan pelanggan.",
    payments: "Periksa transaksi dan status pembayaran pelanggan.",
    prices: "Atur tarif sewa berdasarkan hari dan jam bermain.",
    reports: "Lihat rekap pemesanan dan pendapatan tercatat.",
    profile: "Kelola informasi akun administrator.",
  };
  return subtitles[page];
}

function countForPage(
  page: PageKey,
  fields: Field[],
  schedules: OperatingSchedule[],
  bookings: Booking[],
  payments: Payment[],
  prices: Price[],
) {
  const values: Partial<Record<PageKey, number>> = {
    fields: fields.length,
    schedule: schedules.length,
    bookings: bookings.length,
    payments: payments.length,
    prices: prices.length,
  };
  return values[page] ?? 0;
}

function StatCard({
  label,
  value,
  icon,
  tone,
  foot,
}: {
  label: string;
  value: string | number;
  icon: string;
  tone: string;
  foot: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span>{label}</span>
        <span className={`stat-icon tone-${tone}`}>{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-foot">
        <span className={`stat-foot-dot tone-${tone}`} />
        {foot}
      </div>
    </article>
  );
}

function PanelHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">▦</div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function EmptyRow({ columns, text }: { columns: number; text: string }) {
  return (
    <tr>
      <td colSpan={columns}>
        <div className="empty-row">{text}</div>
      </td>
    </tr>
  );
}

function FormDialog({
  kind,
  item,
  fields,
  prices,
  saving,
  error,
  onClose,
  onSave,
}: {
  kind: DialogKind;
  item: EditableRecord | null;
  fields: Field[];
  prices: Price[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (values: FormBody) => void;
}) {
  const record = (item ?? {}) as unknown as Record<
    string,
    string | number | undefined
  >;
  const value = (key: string, fallback = "") => String(record[key] ?? fallback);

  const [bookingDate, setBookingDate] = useState(
    value("booking_date", todayLocal()),
  );
  const [bookingFieldId, setBookingFieldId] = useState(
    value("field_id", fields[0]?.id ? String(fields[0].id) : ""),
  );
  const [startTime, setStartTime] = useState(value("start_time", "18:00"));
  const [endTime, setEndTime] = useState(value("end_time", "19:00"));

  const selectedField = fields.find((f) => String(f.id) === bookingFieldId);
  const duration = hoursBetween(startTime, endTime);
  function calculatePreviewTotal(
    fieldId: string,
    date: string,
    startTime: string,
    endTime: string,
    prices: Price[],
  ) {
    if (!fieldId || !date || !startTime || !endTime) {
      return 0;
    }

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (end <= start) return 0;

    const [year, month, day] = date.split("-").map(Number);

    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    const period = dayOfWeek === 0 || dayOfWeek === 6 ? "Weekend" : "Weekday";

    const applicablePrices = prices.filter(
      (price) =>
        String(price.field_id) === fieldId &&
        (price.period === period || price.period === "Semua Hari"),
    );

    let total = 0;

    for (let minute = start; minute < end; minute += 60) {
      const price = applicablePrices.find((item) => {
        const priceStart = toMinutes(item.start_time);
        const priceEnd = toMinutes(item.end_time);

        return minute >= priceStart && minute < priceEnd;
      });

      if (!price) return 0;

      total += Number(price.price);
    }

    return total;
  }

  function toMinutes(time: string) {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
  }

  const computedTotal = calculatePreviewTotal(
    bookingFieldId,
    bookingDate,
    startTime,
    endTime,
    prices,
  );

  const title = item
    ? "Edit data"
    : kind === "field"
      ? "Tambah lapangan"
      : kind === "booking"
        ? "Tambah pemesanan"
        : kind === "schedule"
          ? "Tambah jadwal"
          : "Tambah tarif";
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    onSave(
      Object.fromEntries(
        Object.entries(data).map(([key, fieldValue]) => [
          key,
          String(fieldValue),
        ]),
      ),
    );
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="dialog"
        role="dialog"
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">PENGELOLAAN DATA</p>
            <h2 id="dialog-title">{title}</h2>
          </div>
          <button
            aria-label="Tutup"
            className="dialog-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {kind === "field" && (
            <div className="form-grid">
              <FormField label="Nama Lapangan">
                <input
                  autoFocus
                  defaultValue={value("name")}
                  name="name"
                  placeholder="Contoh: Lapangan A"
                  required
                />
              </FormField>
              <FormField label="Jenis Permukaan">
                <select
                  defaultValue={value("surface_type", "Vinyl")}
                  name="surface_type"
                >
                  <option>Vinyl</option>
                  <option>Rumput Sintetis</option>
                  <option>Interlock</option>
                  <option>Parquet</option>
                </select>
              </FormField>
              <FormField label="Kapasitas">
                <input
                  defaultValue={value("capacity", "5 vs 5")}
                  name="capacity"
                  required
                />
              </FormField>
              <FormField label="Tarif per jam">
                <input
                  defaultValue={value("hourly_rate", "120000")}
                  min="0"
                  name="hourly_rate"
                  required
                  type="number"
                />
              </FormField>
              <FormField label="Status">
                <select defaultValue={value("status", "Aktif")} name="status">
                  <option>Aktif</option>
                  <option>Perawatan</option>
                </select>
              </FormField>
            </div>
          )}
          {kind === "schedule" && (
            <div className="form-grid">
              <FormField label="Hari Operasional">
                <input
                  autoFocus
                  defaultValue={value("day_label")}
                  name="day_label"
                  placeholder="Contoh: Senin - Jumat"
                  required
                />
              </FormField>
              <FormField label="Status">
                <select defaultValue={value("status", "Buka")} name="status">
                  <option>Buka</option>
                  <option>Tutup</option>
                </select>
              </FormField>
              <FormField label="Jam Buka">
                <input
                  defaultValue={value("open_time", "08:00")}
                  name="open_time"
                  required
                  type="time"
                />
              </FormField>
              <FormField label="Jam Tutup">
                <input
                  defaultValue={value("close_time", "23:00")}
                  name="close_time"
                  required
                  type="time"
                />
              </FormField>
            </div>
          )}
          {kind === "booking" && (
            <div className="form-grid">
              <FormField label="Nama Pelanggan">
                <input
                  autoFocus
                  defaultValue={value("customer")}
                  name="customer"
                  required
                />
              </FormField>
              <FormField label="Nomor Telepon">
                <input
                  defaultValue={value("phone")}
                  name="phone"
                  required
                  type="tel"
                />
              </FormField>
              <FormField label="Lapangan">
                <select
                  name="field_id"
                  required
                  value={bookingFieldId}
                  onChange={(e) => setBookingFieldId(e.target.value)}
                >
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tanggal">
                <input
                  name="booking_date"
                  required
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </FormField>
              <FormField label="Jam Mulai">
                <input
                  name="start_time"
                  required
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </FormField>
              <FormField label="Jam Selesai">
                <input
                  name="end_time"
                  required
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </FormField>
              <FormField
                label={`Total (Rp) · ${duration > 0 ? duration + " jam" : "jam tidak valid"}`}
              >
                <input
                  name="total_amount"
                  readOnly
                  type="number"
                  value={computedTotal}
                />
              </FormField>
            </div>
          )}
          {kind === "price" && (
            <div className="form-grid">
              <FormField label="Lapangan">
                <select
                  defaultValue={value(
                    "field_id",
                    fields[0]?.id ? String(fields[0].id) : "",
                  )}
                  name="field_id"
                  required
                >
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Periode">
                <select defaultValue={value("period", "Weekday")} name="period">
                  <option>Weekday</option>
                  <option>Weekend</option>
                  <option>Semua Hari</option>
                </select>
              </FormField>
              <FormField label="Jam Mulai">
                <input
                  defaultValue={value("start_time", "08:00")}
                  name="start_time"
                  required
                  type="time"
                />
              </FormField>
              <FormField label="Jam Selesai">
                <input
                  defaultValue={value("end_time", "17:00")}
                  name="end_time"
                  required
                  type="time"
                />
              </FormField>
              <FormField label="Harga per jam">
                <input
                  defaultValue={value("price", "120000")}
                  min="0"
                  name="price"
                  required
                  type="number"
                />
              </FormField>
            </div>
          )}
          {error && (
            <div className="dialog-error" role="alert">
              {error.replace(/\.$/, "")}!
            </div>
          )}
          <div className="dialog-actions">
            <button
              className="button button-secondary"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="button button-primary"
              disabled={saving}
              type="submit"
            >
              {saving ? "Menyimpan..." : "Simpan data"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop confirm-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <section
        aria-modal="true"
        className="dialog confirm-dialog"
        role="alertdialog"
      >
        <div className={`confirm-icon ${danger ? "confirm-icon-danger" : ""}`}>
          {danger ? "!" : "?"}
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button
            className="button button-secondary"
            onClick={onCancel}
            type="button"
          >
            Batal
          </button>
          <button
            autoFocus
            className={`button ${danger ? "button-danger" : "button-primary"}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;