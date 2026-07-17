"use client";

import { ArrowRight, Fingerprint, ShieldCheck, Users } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { NavLink } from "@/components/shared/nav-link";

export default function HomePage() {
  return (
    <PageTransition>
      <main className="hero-shell hero-shell--single">
        <section className="hero-copy">
          <div className="hero-brand">
            <div className="brand-mark">
              <Fingerprint size={20} />
            </div>
            <div>
              <p className="brand-name">DIAS</p>
              <p className="brand-subtitle">Dual ID Attendance System</p>
            </div>
          </div>

          <span className="system-pill">System Operational</span>

          <h1>
            Precision <span>Authentication</span>
            <br />
            for the Modern
            <br />
            Campus.
          </h1>

          <p className="hero-description">
            DIAS combines RFID and biometric fingerprint verification into a
            live attendance intelligence layer for classrooms, labs, and campus
            access.
          </p>

          <div className="hero-actions">
            <NavLink
              href="/admin/login"
              className="feature-card feature-card--active"
              label="Opening admin login..."
            >
              <div className="feature-icon">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3>Admin Console</h3>
                <p>Manage students, live logs, analytics</p>
              </div>
              <ArrowRight size={20} />
            </NavLink>

            <NavLink href="/classroom" className="feature-card" label="Opening classroom view...">
              <div className="feature-icon">
                <Users size={24} />
              </div>
              <div>
                <h3>Classroom View</h3>
                <p>Live student grid and attendance state</p>
              </div>
              <ArrowRight size={20} />
            </NavLink>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
