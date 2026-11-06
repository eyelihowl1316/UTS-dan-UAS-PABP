import { useState, type FormEvent } from "react";
import { api } from "./api";
import type { AuthUser } from "./api";
import "./Login.css";
import Lapangan from "./assets/lapangan.png";
import Logo from "./assets/MJBCourt Logo.png";
interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}

// Setiap PasswordInput punya state "visible" sendiri,
// jadi tombol Tampilkan/Sembunyikan di satu kolom tidak memengaruhi kolom lain.
function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    // position: relative dipasang inline agar tombol selalu menempel pada
    // kolom ini, bukan pada kartu login.
    <div className="password-wrap" style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "Sembunyikan" : "Tampilkan"}
      </button>
    </div>
  );
}

function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isRegister = mode === "register";

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirm("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        if (name.trim().length < 2) throw new Error("Nama minimal 2 karakter.");
        if (password.length < 8)
          throw new Error("Kata sandi minimal 8 karakter.");
        if (password !== confirm)
          throw new Error("Konfirmasi kata sandi tidak sama.");

        await api.auth.register(name.trim(), email.trim(), password);

        // Setelah daftar: kembali ke menu login (email tetap terisi),
        // token TIDAK disimpan dan onLogin TIDAK dipanggil.
        switchMode("login");
        setName("");
        setSuccess("Pendaftaran berhasil. Silakan masuk dengan akun Anda.");
        return;
      }

      const result = await api.auth.login(email.trim(), password);

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="login-page"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(8, 44, 28, 0.55), rgba(8, 44, 28, 0.2)), url(${Lapangan})`,
      }}
    >
      <section className="login-card">
        <div className="login-brand">
          <img src={Logo} alt="MJB Court Logo" className="login-logo" />
          <div>
            <h1>
              MJB<span>Court</span>
            </h1>
            <small>SPORTS MANAGEMENT</small>
          </div>
        </div>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegister}
            className={!isRegister ? "login-tab-active" : ""}
            onClick={() => switchMode("login")}
          >
            Masuk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegister}
            className={isRegister ? "login-tab-active" : ""}
            onClick={() => switchMode("register")}
          >
            Daftar
          </button>
        </div>

        <div className="login-heading">
          <h2>{isRegister ? "Buat akun baru" : "Selamat datang kembali"}</h2>
          <p>
            {isRegister
              ? "Daftar dengan email untuk mulai mengelola lapangan."
              : "Masuk dengan email untuk mengelola lapangan, pemesanan, dan pembayaran."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label className="login-field">
              <span>Nama Lengkap</span>
              <input
                autoComplete="name"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}

          <label className="login-field">
            <span>Alamat Email</span>
            <input
              type="email"
              autoComplete="username"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="login-field">
            <span>Kata Sandi</span>
            <PasswordInput
              key={mode}
              value={password}
              onChange={setPassword}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={
                isRegister ? "Minimal 8 karakter" : "Masukkan kata sandi"
              }
            />
          </label>

          {isRegister && (
            <label className="login-field">
              <span>Konfirmasi Kata Sandi</span>
              <PasswordInput
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                placeholder="Ulangi kata sandi"
              />
            </label>
          )}

          {success && (
            <div
              role="status"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                padding: "9px 12px",
                fontSize: 12,
                color: "#12705a",
                background: "#e8f6f1",
                border: "1px solid #c3e6da",
                borderRadius: 8,
              }}
            >
              <span style={{ fontWeight: 800 }}>✓</span>
              {success}
            </div>
          )}

          {error && (
            <div className="login-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          <button className="login-button" type="submit" disabled={loading}>
            {loading
              ? "Memproses..."
              : isRegister
                ? "Daftar sekarang"
                : "Masuk"}
          </button>
        </form>

        <p className="login-switch">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? "login" : "register")}
          >
            {isRegister ? "Masuk di sini" : "Daftar di sini"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default Login;
