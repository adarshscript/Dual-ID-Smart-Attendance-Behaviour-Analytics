"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { PageTransition } from "@/components/shared/page-transition";
import {
  ADMIN_DEFAULT_PASSWORD,
  ADMIN_DEFAULT_USERNAME,
  ADMIN_RESET_SECRET,
  getAdminPassword,
  setAdminPassword,
  setAdminSession
} from "@/lib/auth";
import { NavLink } from "@/components/shared/nav-link";
import { showRouteLoading, showToast } from "@/lib/feedback";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(ADMIN_DEFAULT_USERNAME);
  const [password, setPassword] = useState(ADMIN_DEFAULT_PASSWORD);
  const [showReset, setShowReset] = useState(false);
  const [secret, setSecret] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setPassword("");
  }, []);

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      username.trim().toLowerCase() === ADMIN_DEFAULT_USERNAME &&
      password === getAdminPassword()
    ) {
      setAdminSession(true);
      showToast({
        title: "Authorized",
        message: "Admin access granted successfully.",
        tone: "success"
      });
      showRouteLoading("Opening admin dashboard...");
      router.push("/admin/dashboard");
      return;
    }

    showToast({
      title: "Login failed",
      message: "The username or password is incorrect.",
      tone: "error"
    });
  }

  function handleReset() {
    if (secret !== ADMIN_RESET_SECRET) {
      showToast({
        title: "Reset failed",
        message: "The secret key does not match.",
        tone: "error"
      });
      return;
    }

    if (newPassword.length < 6) {
      showToast({
        title: "Weak password",
        message: "The new password must be at least 6 characters long.",
        tone: "error"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        title: "Password mismatch",
        message: "The new password and confirm password do not match.",
        tone: "error"
      });
      return;
    }

    setAdminPassword(newPassword);
    setSecret("");
    setNewPassword("");
    setConfirmPassword("");
    setShowReset(false);
    showToast({
      title: "Password updated",
      message: "The admin password has been updated successfully.",
      tone: "success"
    });
  }

  return (
    <PageTransition>
      <main className="auth-shell">
        <div className="auth-topbar">
          <NavLink href="/" className="back-link back-link--boxed" label="Returning to home...">
            <ArrowLeft size={18} />
            Back to Home
          </NavLink>
        </div>

        <div className="auth-hero">
          <div className="auth-badge">
            <ShieldCheck size={30} />
          </div>
          <h1>System Access</h1>
          <p>ADMIN CONSOLE</p>
        </div>

        <div className="auth-card">
          <h2>Sign In</h2>
          <p>Enter your credentials to access the DIAS dashboard.</p>

          <form onSubmit={handleLogin} className="stack-form">
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
              />
            </label>

            <label>
              <span className="label-row">
                Password
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowReset(true)}
                >
                  Forgot Password?
                </button>
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </label>

            <button type="submit" className="primary-button">
              Authorize
            </button>
          </form>

          <div className="auth-footer">@Admin Panel</div>
        </div>

        {showReset ? (
          <div className="modal-backdrop">
            <div className="modal-card">
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowReset(false)}
              >
                x
              </button>
              <div className="panel-header">
                <div className="modal-title">
                  <KeyRound size={22} />
                  <h3>Reset Admin Password</h3>
                </div>
              </div>
              <p>
                Enter your admin secret key to reset your password. Keep this
                key private.
              </p>

              <div className="stack-form">
                <label>
                  Admin Secret Key
                  <input
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    placeholder="Enter secret key"
                  />
                </label>
                <label>
                  New Password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Min. 6 characters"
                  />
                </label>
                <label>
                  Confirm New Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter new password"
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowReset(false)}
                  >
                    Cancel
                  </button>
                  <button type="button" className="primary-button" onClick={handleReset}>
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </PageTransition>
  );
}
