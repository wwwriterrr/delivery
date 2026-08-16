import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { City, DeliveryPoint } from "../services/cdekApi";
import { fetchDeliveryPoints } from "../services/cdekApi";
import { CDEK_ENDPOINTS, BACKEND_URL } from "../constants";
import { apiFetch, errorMessage, isAbortError } from "../services/http";
import { useSession } from "../hooks/useSession";
import { useBookInfo } from "../hooks/useBookInfo";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { CitySearch } from "../components/CitySearch";
import { SelectedPoint } from "../components/SelectedPoint";
import { PointList } from "../components/PointList";
import { BookCard } from "../components/BookCard";
import { ErrorState } from "../components/ErrorState";
import { PageLoader } from "../components/PageLoader";
import { IconCoin } from "../components/IconCoin";
import { bukaLabel } from "../utils/format";
import { formatPhone, isCompletePhone, toBackendPhone } from "../utils/phone";
import { scrollIntoView } from "../utils/scroll";
import { ordersUrl } from "../routes/paths";
import "../App.css";

// Leaflet and its cluster plugin are the heaviest part of the bundle and are
// only needed once a city has been picked, so they load in their own chunk.
const DeliveryMap = lazy(() => import("../components/DeliveryMap"));

interface FieldErrors {
  fullName?: string;
  phone?: string;
  email?: string;
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NAME_PATTERN = /^[a-zA-ZА-Яа-яЁёЀ-ӿ\-'\s]{2,}$/;

export function PreorderPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const session = useSession();
  const { book, error: bookError, loading: bookLoading, reload: reloadBook } = useBookInfo(slug);

  useDocumentTitle(book ? `Предзаказ: ${book.title}` : "Оформление предзаказа");

  const [consentGiven, setConsentGiven] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [previewPoint, setPreviewPoint] = useState<DeliveryPoint | null>(null);
  const [confirmedPoint, setConfirmedPoint] = useState<DeliveryPoint | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [pointsAttempt, setPointsAttempt] = useState(0);

  const pointsSectionRef = useRef<HTMLDivElement>(null);
  // Set when the user picks a city, cleared once we have actually scrolled, so
  // a retry or a re-render never yanks the page around again.
  const pendingScrollRef = useRef(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (!selectedCity) return;
    const controller = new AbortController();

    setLoadingPoints(true);
    setPointsError(null);
    setPreviewPoint(null);
    setConfirmedPoint(null);
    setMapVisible(false);

    fetchDeliveryPoints(String(selectedCity.code), controller.signal)
      .then((points) => {
        setDeliveryPoints(points);
        const firstWithCoords = points.find(
          (p) => p.location.latitude && p.location.longitude
        );
        if (firstWithCoords) {
          setMapCenter([firstWithCoords.location.latitude!, firstWithCoords.location.longitude!]);
          setMapVisible(true);
        }
        setLoadingPoints(false);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setPointsError(
          errorMessage(err, {
            server: "Не удалось получить список пунктов выдачи. Попробуйте ещё раз.",
          })
        );
        setDeliveryPoints([]);
        setLoadingPoints(false);
      });

    return () => controller.abort();
  }, [selectedCity, pointsAttempt]);

  // Once the points are on screen, bring the map into view: the pickup-point
  // card renders below the fold, so on a phone the city choice looked like it
  // did nothing at all.
  useEffect(() => {
    if (loadingPoints || !pendingScrollRef.current) return;
    if (!mapVisible && !pointsError && deliveryPoints.length > 0) return;
    pendingScrollRef.current = false;
    scrollIntoView(pointsSectionRef.current);
  }, [loadingPoints, mapVisible, pointsError, deliveryPoints]);

  const handleCitySelect = useCallback((city: City | null) => {
    pendingScrollRef.current = city !== null;
    setSelectedCity(city);
    setPreviewPoint(null);
    setConfirmedPoint(null);
    setMapVisible(false);
    setDeliveryPoints([]);
    setMapCenter(null);
    setPointsError(null);
  }, []);

  const handlePointPreview = useCallback((point: DeliveryPoint) => {
    setPreviewPoint(point);
  }, []);

  const handlePointDeselect = useCallback(() => setPreviewPoint(null), []);

  const handleConfirmPoint = useCallback(
    (point: DeliveryPoint) => {
      setConfirmedPoint(point);
      setPreviewPoint(null);
      setMapVisible(false);

      const newErrors: FieldErrors = {};
      if (!fullName.trim()) newErrors.fullName = "Введите ФИО";
      if (!phone.replace(/\D/g, "")) newErrors.phone = "Введите номер телефона";
      else if (!isCompletePhone(phone)) newErrors.phone = "Введите полный номер телефона";
      if (!email.trim()) newErrors.email = "Введите email";
      else if (!EMAIL_PATTERN.test(email.trim())) newErrors.email = "Введите корректный email";

      setErrors(newErrors);

      if (Object.keys(newErrors).length) {
        setTimeout(() => {
          scrollIntoView(
            document.getElementById(
              newErrors.fullName ? "fullName" : newErrors.phone ? "phone" : "email"
            ),
            "center"
          );
        }, 100);
      }
    },
    [fullName, phone, email]
  );

  const handleChangePoint = useCallback(() => {
    setConfirmedPoint(null);
    setPreviewPoint(null);
    setMapVisible(true);
  }, []);

  const validateAll = useCallback((): boolean => {
    const newErrors: FieldErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Введите ФИО";
    else if (!NAME_PATTERN.test(fullName.trim())) newErrors.fullName = "Введите корректное ФИО";

    if (!phone.replace(/\D/g, "")) newErrors.phone = "Введите номер телефона";
    else if (!isCompletePhone(phone)) newErrors.phone = "Введите полный номер телефона";

    if (!email.trim()) newErrors.email = "Введите email";
    else if (!EMAIL_PATTERN.test(email.trim())) newErrors.email = "Введите корректный email";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, phone, email]);

  const authenticated = session === "authenticated";
  const consentRequired = !authenticated;
  const isFormValid =
    fullName.trim().length > 0 &&
    isCompletePhone(phone) &&
    EMAIL_PATTERN.test(email.trim()) &&
    confirmedPoint !== null &&
    (!consentRequired || consentGiven);

  const handleSubmit = useCallback(async () => {
    // Without book data there is no price: submitting here would create a
    // guest invoice for 0 ₽ with an "undefined" description.
    if (!book || !confirmedPoint || !validateAll()) return;

    setSubmitting(true);
    setSubmitError(null);

    const orderBody = {
      name: fullName.trim(),
      phone: toBackendPhone(phone),
      email: email.trim(),
      delivery_point: confirmedPoint.code,
      delivery_address: confirmedPoint.location.address_full ?? confirmedPoint.location.address,
      slug,
    };

    try {
      if (authenticated) {
        await apiFetch(CDEK_ENDPOINTS.submitOrder, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderBody),
        });
        setOrderSuccess(true);
      } else {
        const order = await apiFetch<{ order_id: string | number }>(
          CDEK_ENDPOINTS.submitGuestOrder,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderBody),
          }
        );

        const payment = await apiFetch<{ url: string }>(CDEK_ENDPOINTS.guestPay, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preorder_id: order.order_id,
            name: fullName.trim(),
            email: email.trim(),
            phone: toBackendPhone(phone),
            description: `Предзаказ книги ${book.author}: ${book.title}`,
            amount: book.price,
            action: "preorder",
          }),
        });

        window.location.href = payment.url;
      }
    } catch (err: unknown) {
      setSubmitError(
        errorMessage(err, {
          auth: "Сессия истекла. Обновите страницу и попробуйте снова.",
          server: "Не удалось оформить предзаказ. Попробуйте ещё раз через минуту.",
        })
      );
      setSubmitting(false);
    }
  }, [book, confirmedPoint, validateAll, fullName, phone, email, slug, authenticated]);

  // Nothing renders until both the book and the session are known: guessing
  // either makes the price and the consent checkbox flip after first paint.
  if (bookLoading || session === "unknown") {
    return (
      <div className="app">
        <PageLoader text="Загрузка информации о книге..." />
      </div>
    );
  }

  // No book means no price and no valid order — the form must not be reachable.
  if (bookError || !book) {
    return (
      <div className="app">
        <h1 className="app__title">Оформление предзаказа</h1>
        <ErrorState
          title="Не удалось открыть предзаказ"
          message={bookError ?? "Информация о книге недоступна."}
          onRetry={reloadBook}
          action={
            <a className="error-state__link" href={ordersUrl()}>
              Мои заказы
            </a>
          }
        />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="app app--center">
        <div className="order-success">
          <div className="order-success__check">
            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
            Предзаказ оформлен. Отправка заказа осуществляется в течение 45-60 дней после оплаты.
            При отправке заказа вы получите уведомление на почту, указанную в форме. После этого
            статус заказа можно будет отслеживать в личном кабинете СДЭК.
          </p>
          <a className="order-success__link" href={ordersUrl()}>Перейти к заказам</a>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="app__title">Оформление предзаказа</h1>

      <BookCard book={book} authenticated={authenticated} />

      <form
        className="bento-grid"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
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
                name="name"
                autoComplete="name"
                className={`form-field__input ${errors.fullName ? "form-field__input--error" : ""}`}
                type="text"
                placeholder="Иванов Иван Иванович"
                value={fullName}
                aria-invalid={errors.fullName ? true : undefined}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
              />
              {errors.fullName && (
                <span className="form-field__error" id="fullName-error">
                  {errors.fullName}
                </span>
              )}
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="phone">
                Телефон <span className="required-mark">*</span>
              </label>
              <input
                id="phone"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                className={`form-field__input ${errors.phone ? "form-field__input--error" : ""}`}
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                onChange={(e) => {
                  setPhone(formatPhone(e.target.value));
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
              />
              {errors.phone && (
                <span className="form-field__error" id="phone-error">
                  {errors.phone}
                </span>
              )}
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="email">
                Email <span className="required-mark">*</span>
              </label>
              <input
                id="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                className={`form-field__input ${errors.email ? "form-field__input--error" : ""}`}
                type="email"
                placeholder="example@mail.ru"
                value={email}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
              />
              {errors.email && (
                <span className="form-field__error" id="email-error">
                  {errors.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card__title">
            Населённый пункт <span className="required-mark">*</span>
          </div>
          <div className="delivery-note">
            Доставка осуществляется сервисом СДЭК. Выберите пункт, в котором вам удобно получить
            посылку.
          </div>
          <CitySearch onCitySelect={handleCitySelect} selectedCity={selectedCity} />
        </div>

        {selectedCity && (
          <div className="bento-card" ref={pointsSectionRef}>
            <div className="bento-card__title">
              Пункт выдачи <span className="required-mark">*</span>
            </div>

            {loadingPoints && <PageLoader text="Загрузка пунктов выдачи..." compact />}

            {pointsError && (
              <ErrorState
                message={pointsError}
                onRetry={() => setPointsAttempt((n) => n + 1)}
              />
            )}

            {!loadingPoints && !pointsError && deliveryPoints.length === 0 && (
              <div className="error-message" role="status">
                В городе {selectedCity.full_name} не найдено пунктов выдачи
              </div>
            )}

            {mapVisible && !loadingPoints && !pointsError && (
              <div className="points-layout">
                <Suspense fallback={<PageLoader text="Загрузка карты..." compact />}>
                  <DeliveryMap
                    points={deliveryPoints}
                    center={mapCenter}
                    selectedUuid={previewPoint?.uuid ?? null}
                    onSelect={handlePointPreview}
                    onConfirm={handleConfirmPoint}
                    onDeselect={handlePointDeselect}
                  />
                </Suspense>
                <PointList
                  points={deliveryPoints}
                  selectedUuid={previewPoint?.uuid ?? null}
                  onSelect={handlePointPreview}
                  onConfirm={handleConfirmPoint}
                />
              </div>
            )}

            {confirmedPoint && (
              <div className="point-confirmed">
                <SelectedPoint point={confirmedPoint} />
                <button className="change-point-btn" onClick={handleChangePoint} type="button">
                  Сменить пункт
                </button>
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="error-message" role="alert">
            {submitError}
          </div>
        )}

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
                  Я выражаю{" "}
                  <a href={`${BACKEND_URL}/alterlit-rules/?doc=privacy3#privacy-personal`} target="_blank" rel="noopener noreferrer">
                    согласие на передачу и обработку персональных данных
                  </a>{" "}
                  в соответствии с{" "}
                  <a href={`${BACKEND_URL}/alterlit-rules/?doc=privacy3`} target="_blank" rel="noopener noreferrer">
                    Политикой конфиденциальности
                  </a>
                </span>
              </label>
            )}
            <button className="submit-btn" type="submit" disabled={!isFormValid || submitting}>
              {submitting ? (
                "Отправка..."
              ) : !isFormValid ? (
                "Заполните все поля и выберите пункт выдачи"
              ) : consentRequired ? (
                <>Оплатить {book.price} ₽</>
              ) : (
                <>
                  Оплатить {book.price}{" "}
                  <IconCoin width={18} height={20} role="img" aria-label={bukaLabel(book.price)} />
                </>
              )}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default PreorderPage;
