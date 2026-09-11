import { Price } from "./Price";
import "./OrderTotal.css";

interface Props {
  quantity: number;
  unitPrice: number;
  /** Signed-in readers pay in буки, guests in roubles. */
  coins: boolean;
}

/**
 * The amount, repeated directly above the pay button.
 *
 * The same sum already sits next to the quantity picker, but by the time the
 * reader has filled in the contacts and picked a pickup point that card is
 * several screens up — and this is the last moment to notice it is wrong.
 */
export function OrderTotal({ quantity, unitPrice, coins }: Props) {
  return (
    <div className="order-total">
      <span className="order-total__label">
        К оплате
        {quantity > 1 && (
          <span className="order-total__breakdown">
            {quantity} × {unitPrice}
          </span>
        )}
      </span>
      <Price value={unitPrice * quantity} coins={coins} className="order-total__value" />
    </div>
  );
}
