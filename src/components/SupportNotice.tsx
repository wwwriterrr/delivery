import { SUPPORT_EMAIL } from "../constants";
import "./SupportNotice.css";

/**
 * Sits right under the book so the two cases it covers — shipping outside
 * Russia and payment trouble — are read before the reader starts filling in
 * details they may not be able to use.
 */
export function SupportNotice() {
  return (
    <aside className="support-notice">
      <svg className="support-notice__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 7 12 13l8.5-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <p className="support-notice__text">
        Если вы хотите заказать книгу с доставкой вне России или у вас возникают проблемы с
        оплатой, пожалуйста, напишите нам на{" "}
        <a className="support-notice__mail" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
      </p>
    </aside>
  );
}
