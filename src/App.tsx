import { useEffect, useState, useCallback, useMemo } from "react";
import type { City, DeliveryPoint } from "./services/cdekApi";
import { fetchDeliveryPoints } from "./services/cdekApi";
import { CDEK_ENDPOINTS, BACKEND_URL } from "./constants";
import { csrfHeaders } from "./services/csrf";
import { CitySearch } from "./components/CitySearch";
import { DeliveryMap } from "./components/DeliveryMap";
import { SelectedPoint } from "./components/SelectedPoint";
import { BookCard } from "./components/BookCard";
import { IconCoin } from "./components/IconCoin";
import { OrdersPage } from "./components/OrdersPage";
import { PaySuccessPage } from "./components/PaySuccessPage";
import "./App.css";

type Route = { type: "order"; slug: string } | { type: "orders" } | { type: "paySuccess"; invoiceId: string; shpToken: string; shpPreorder: string } | { type: "payError"; missing: string[] } | { type: "payFail" };

interface BookInfo {
  title: string;
  description: string;
  author: string;
  price: number;
  thumbnail?: string;
}

function resolveRoute(): Route {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments[0] === "orders") return { type: "orders" };
  if (segments[0] === "preorder" && segments[1]) return { type: "order", slug: segments[1] };
  if (segments[0] === "pay" && segments[1] === "success") {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get("InvId");
    const shpToken = params.get("Shp_token");
    const shpPreorder = params.get("Shp_preorder");
    const missing: string[] = [];
    if (!invoiceId) missing.push("InvId");
    if (!shpToken) missing.push("Shp_token");
    if (!shpPreorder) missing.push("Shp_preorder");
    if (missing.length > 0) return { type: "payError", missing };
    return { type: "paySuccess", invoiceId: invoiceId!, shpToken: shpToken!, shpPreorder: shpPreorder! };
  }
  if (segments[0] === "pay" && segments[1] === "fail") return { type: "payFail" };
  return { type: "orders" } as Route;
}

function App() {
  const route = useMemo(() => resolveRoute(), []);
  const [authenticated, setAuthenticated] = useState(true);
  const [book, setBook] = useState<BookInfo | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  // Point currently viewed on the map (not yet confirmed)
  const [previewPoint, setPreviewPoint] = useState<DeliveryPoint | null>(null);
  // Point that the user has confirmed
  const [confirmedPoint, setConfirmedPoint] = useState<DeliveryPoint | null>(null);
  // Map visibility
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Check session on mount
  useEffect(() => {
    const controller = new AbortController();

    fetch(CDEK_ENDPOINTS.verifySession, { credentials: "same-origin", headers: csrfHeaders(), signal: controller.signal })
      .then((res) => {
        setAuthenticated(res.ok);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setAuthenticated(false);
        }
      });

    return () => controller.abort();
  }, []);

  // Fetch book info on mount (for order route)
  useEffect(() => {
    if (route.type !== "order") return;
    const controller = new AbortController();

    fetch(CDEK_ENDPOINTS.bookInfo(route.slug), { signal: controller.signal, headers: csrfHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`Book info request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setBook(data))
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setBookError(err.message ?? "Не удалось загрузить информацию о книге");
        }
      });

    return () => controller.abort();
  }, [route]);

  // Fetch delivery points when city is selected
  useEffect(() => {
    if (!selectedCity) return;

    const loadPoints = async () => {
      setLoadingPoints(true);
      setError(null);
      setPreviewPoint(null);
      setConfirmedPoint(null);
      setMapVisible(false);
      try {
        const points = await fetchDeliveryPoints(selectedCity.city_uuid);
        setDeliveryPoints(points);
        if (points.length > 0) {
          const firstWithCoords = points.find(
            (p) => p.location.latitude && p.location.longitude
          );
          if (firstWithCoords) {
            setMapCenter([firstWithCoords.location.latitude!, firstWithCoords.location.longitude!]);
            setMapVisible(true);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить пункты выдачи");
        setDeliveryPoints([]);
      } finally {
        setLoadingPoints(false);
      }
    };

    loadPoints();
  }, [selectedCity]);

  const handleCitySelect = useCallback((city: City | null) => {
    setSelectedCity(city);
    setPreviewPoint(null);
    setConfirmedPoint(null);
    setMapVisible(false);
    setDeliveryPoints([]);
    setMapCenter(null);
    setError(null);
  }, []);

  const handlePointPreview = useCallback((point: DeliveryPoint) => {
    setPreviewPoint(point);
  }, []);

  const handlePointDeselect = useCallback(() => {
    setPreviewPoint(null);
  }, []);

  const handleConfirmPoint = useCallback((point: DeliveryPoint) => {
    setConfirmedPoint(point);
    setPreviewPoint(null);
    setMapVisible(false);

    // Validate and highlight empty fields, scroll to first
    const newErrors: typeof errors = {};

    if (!fullName.trim()) newErrors.fullName = "Введите ФИО";
    const phoneDigits = phone.replace(/\D/g, "");
    if (!phoneDigits) newErrors.phone = "Введите номер телефона";
    else if (phoneDigits.length !== 11) newErrors.phone = "Введите полный номер телефона";
    if (!email.trim()) newErrors.email = "Введите email";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) newErrors.email = "Введите корректный email";

    setErrors(newErrors);

    if (Object.keys(newErrors).length) {
      setTimeout(() => {
        const firstErrorField = document.getElementById(
          newErrors.fullName ? "fullName" : newErrors.phone ? "phone" : "email"
        );
        firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [fullName, phone, email]);

  const handleChangePoint = useCallback(() => {
    setConfirmedPoint(null);
    setPreviewPoint(null);
    setMapVisible(true);
  }, []);

  // Validate all fields on submit
  const validateAll = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) newErrors.fullName = "Введите ФИО";
    else if (!/^[a-zA-ZА-Яа-яЁёЀ-ӿ\-'\s]{2,}$/.test(fullName.trim()))
      newErrors.fullName = "Введите корректное ФИО";

    const phoneDigits = phone.replace(/\D/g, "");
    if (!phoneDigits) newErrors.phone = "Введите номер телефона";
    else if (phoneDigits.length !== 11)
      newErrors.phone = "Введите полный номер телефона";

    if (!email.trim()) newErrors.email = "Введите email";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      newErrors.email = "Введите корректный email";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, phone, email]);

  const consentRequired = !authenticated;
  const isFormValid =
    fullName.trim().length > 0 &&
    phone.replace(/\D/g, "").length === 11 &&
    email.trim().length > 0 &&
    confirmedPoint !== null &&
    (!consentRequired || consentGiven);

  const handleSubmit = useCallback(async () => {
    if (route.type !== "order" || !validateAll() || !confirmedPoint) return;
    setSubmitting(true);
    setSubmitError(null);

    const orderBody = {
      name: fullName.trim(),
      phone: "+7" + phone.replace(/\D/g, "").slice(1),
      email: email.trim(),
      delivery_point: confirmedPoint.code,
      delivery_address: confirmedPoint.location.address_full ?? confirmedPoint.location.address,
      slug: route.slug,
    };

    try {
      if (authenticated) {
        const res = await fetch(CDEK_ENDPOINTS.submitOrder, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...csrfHeaders() },
          body: JSON.stringify(orderBody),
        });
        if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
        setOrderSuccess(true);
      } else {
        const orderRes = await fetch(CDEK_ENDPOINTS.submitGuestOrder, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...csrfHeaders() },
          body: JSON.stringify(orderBody),
        });
        if (!orderRes.ok) throw new Error(`Ошибка создания заказа: ${orderRes.status}`);
        const orderData = await orderRes.json();

        const payRes = await fetch(CDEK_ENDPOINTS.guestPay, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...csrfHeaders() },
          body: JSON.stringify({
            preorder_id: orderData.order_id,
            name: fullName.trim(),
            email: email.trim(),
            phone: "+7" + phone.replace(/\D/g, "").slice(1),
            description: `Предзаказ книги ${book?.author}: ${book?.title}`,
            amount: book?.price ?? 0,
            action: "preorder",
          }),
        });
        if (!payRes.ok) throw new Error(`Ошибка создания оплаты: ${payRes.status}`);
        const payData = await payRes.json();
        window.location.href = payData.url;
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Не удалось отправить заказ");
    } finally {
      setSubmitting(false);
    }
  }, [fullName, phone, email, route, confirmedPoint, validateAll, authenticated, book]);

  if (route.type === "orders") {
    return <OrdersPage />;
  }

  if (route.type === "payError") {
    return (
      <div className="app">
        <h1 className="app__title">Ошибка</h1>
        <div className="error-message">
          Отсутствуют параметры оплаты: {route.missing.join(", ")}
        </div>
      </div>
    );
  }

  if (route.type === "paySuccess") {
    return (
      <PaySuccessPage
        invoiceId={route.invoiceId}
        shpToken={route.shpToken}
        shpPreorder={route.shpPreorder}
      />
    );
  }

  if (route.type === "payFail") {
    return (
      <div className="app">
        <h1 className="app__title">Ошибка оплаты</h1>
        <div className="error-message">
          В процессе оплаты произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз.
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="app app--center">
        <div className="order-success">
          <div className="order-success__check">
            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="25" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
              <path
                d="M15 27 L23 35 L37 19"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="order-success__path"
              />
            </svg>
          </div>
          <h1 className="app__title order-success__title">Оплата прошла успешно!</h1>
          <p className="order-success__text">
            Предзаказ оформлен. Заказ в СДЭК будет создан чуть позже — вы получите уведомление.
          </p>
          <a className="order-success__link" href="/orders/">Перейти к заказам</a>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="app__title">Оформление предзаказа</h1>

      <BookCard book={book} authenticated={authenticated} error={bookError} />

      <div className="bento-grid">
        {/* Customer Info Card */}
        <div className="bento-card">
          <div className="bento-card__title">
            Контактные данные <span className="required-mark">*</span>
          </div>
          <div className="form-fields">
            <div className="form-field">
              <label className="form-field__label" htmlFor="fullName">
                ФИО <span className="required-mark">*</span>
              </label>
              <input
                id="fullName"
                className={`form-field__input ${errors.fullName ? "form-field__input--error" : ""}`}
                type="text"
                placeholder="Иванов Иван Иванович"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
              />
              {errors.fullName && (
                <span className="form-field__error">{errors.fullName}</span>
              )}
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="phone">
                Телефон <span className="required-mark">*</span>
              </label>
              <input
                id="phone"
                className={`form-field__input ${errors.phone ? "form-field__input--error" : ""}`}
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => {
                  let raw = e.target.value.replace(/\D/g, "");

                  // If user starts with 8, replace with 7
                  if (raw.startsWith("8")) raw = "7" + raw.slice(1);

                  // Limit to 11 digits (7 + 10 digits)
                  if (raw.length > 11) raw = raw.slice(0, 11);

                  // Format: +7 (XXX) XXX-XX-XX
                  let formatted = "";
                  if (raw.length === 0) formatted = "";
                  else if (raw.length === 1) formatted = `+${raw}`;
                  else if (raw.length <= 4) formatted = `+${raw.slice(0, 1)} (${raw.slice(1)}`;
                  else if (raw.length <= 7) formatted = `+${raw.slice(0, 1)} (${raw.slice(1, 4)}) ${raw.slice(4)}`;
                  else if (raw.length <= 9) formatted = `+${raw.slice(0, 1)} (${raw.slice(1, 4)}) ${raw.slice(4, 7)}-${raw.slice(7)}`;
                  else formatted = `+${raw.slice(0, 1)} (${raw.slice(1, 4)}) ${raw.slice(4, 7)}-${raw.slice(7, 9)}-${raw.slice(9)}`;

                  setPhone(formatted);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
              />
              {errors.phone && (
                <span className="form-field__error">{errors.phone}</span>
              )}
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="email">
                Email <span className="required-mark">*</span>
              </label>
              <input
                id="email"
                className={`form-field__input ${errors.email ? "form-field__input--error" : ""}`}
                type="email"
                placeholder="example@mail.ru"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
              />
              {errors.email && (
                <span className="form-field__error">{errors.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* City Selection Card */}
        <div className="bento-card">
          <div className="bento-card__title">
            Населённый пункт <span className="required-mark">*</span>
          </div>
          <div className="delivery-note">Доставка осуществляется сервисом СДЭК. Выберите пункт, из которого вам удобно получить посылку.</div>
          <CitySearch onCitySelect={handleCitySelect} selectedCity={selectedCity} />
        </div>

        {/* Map + Delivery Point Card */}
        {selectedCity && (
          <div className="bento-card">
            <div className="bento-card__title">
              Пункт выдачи <span className="required-mark">*</span>
            </div>

            {loadingPoints && (
              <div className="loading-overlay" style={{ minHeight: "200px" }}>
                <div className="spinner" />
                <div className="loading-overlay__text">Загрузка пунктов выдачи...</div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {!loadingPoints && !error && deliveryPoints.length === 0 && (
              <div className="error-message">
                В городе {selectedCity.full_name} не найдено пунктов выдачи
              </div>
            )}

            {/* Map — visible while browsing */}
            {mapVisible && !loadingPoints && !error && (
              <DeliveryMap
                points={deliveryPoints}
                center={mapCenter}
                selectedUuid={previewPoint?.uuid ?? null}
                onSelect={handlePointPreview}
                onConfirm={handleConfirmPoint}
                onDeselect={handlePointDeselect}
              />
            )}

            {/* Confirmed point — map collapsed */}
            {confirmedPoint && (
              <div className="point-confirmed">
                <SelectedPoint point={confirmedPoint} />
                <button
                  className="change-point-btn"
                  onClick={handleChangePoint}
                  type="button"
                >
                  Сменить пункт
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {submitError && <div className="error-message">{submitError}</div>}
        {confirmedPoint && (
          <>
            {consentRequired && (
              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                />
                <span>
                  Я выражаю <a href={`${BACKEND_URL}/alterlit-rules/?doc=privacy3#privacy-personal`}>согласие на передачу и обработку персональных данных</a> в соответствии с <a href={`${BACKEND_URL}/alterlit-rules/?doc=privacy3`} target="_blank" rel="noopener noreferrer">Политикой конфиденциальности</a>
                </span>
              </label>
            )}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              type="button"
              disabled={!isFormValid || submitting}
            >
              {submitting ? "Отправка..." : !isFormValid
                ? "Заполните все поля и выберите пункт выдачи"
                : consentRequired
                  ? <>Оплатить {book?.price ?? "—"} ₽</>
                  : <>Оплатить {book?.price ?? "—"} <IconCoin width={18} height={20} /></>
              }
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
