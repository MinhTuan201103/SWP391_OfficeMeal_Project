import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ formTitle, formSubtitle, welcomeTagline, children, footer }) {
  return (
    <div className="auth-split">
      <Link to="/" className="auth-split__back">
        <ArrowLeft size={18} strokeWidth={2.25} />
        <span>Trang Chủ</span>
      </Link>

      <motion.div
        className="auth-split__card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-split__form-col">
          <h1 className="auth-split__form-title">{formTitle}</h1>
          <p className="auth-split__form-lead">{formSubtitle}</p>
          {children}
          {footer}
        </div>

        <aside className="auth-split__welcome" aria-label="Chào Mừng">
          <div className="auth-split__welcome-bg" aria-hidden />
          <div className="auth-split__sphere auth-split__sphere--1" aria-hidden />
          <div className="auth-split__sphere auth-split__sphere--2" aria-hidden />
          <div className="auth-split__sphere auth-split__sphere--3" aria-hidden />
          <div className="auth-split__sphere auth-split__sphere--4" aria-hidden />
          <div className="auth-split__welcome-content">
            <img src="/brand-logo.png" alt="OfficeMeal" className="auth-split__logo" width={120} height={120} />
            <p className="auth-split__brand">OfficeMeal</p>
            <h2 className="auth-split__welcome-title">Chào Mừng Đến Với OfficeMeal</h2>
            <p className="auth-split__welcome-text">{welcomeTagline}</p>
          </div>
        </aside>
      </motion.div>
    </div>
  );
}
