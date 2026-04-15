import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__bg" aria-hidden>
        <div className="auth-shell__gradient" />
        <div className="auth-shell__orb auth-shell__orb--1" />
        <div className="auth-shell__orb auth-shell__orb--2" />
        <div className="auth-shell__orb auth-shell__orb--3" />
        <div className="auth-shell__shine" />
        <div className="auth-shell__grain" />
      </div>

      <Link to="/" className="auth-shell__back">
        <ArrowLeft size={18} strokeWidth={2.25} />
        <span>Trang Chủ</span>
      </Link>

      <motion.div
        className="auth-shell__wrap"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-shell__hero">
          <div className="auth-shell__badge">
            <Sparkles size={14} className="auth-shell__badge-icon" />
            OfficeMeal
          </div>
          <h1 className="auth-shell__title">{title}</h1>
          <p className="auth-shell__subtitle">{subtitle}</p>
        </div>

        <div className="auth-shell__card">
          {children}
          {footer}
        </div>

        <p className="auth-shell__fineprint">Cơm Văn Phòng · Giao Nhanh · Chuẩn Vị</p>
      </motion.div>
    </div>
  );
}
