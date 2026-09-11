import { IconCoin } from "./IconCoin";
import { bukaLabel } from "../utils/format";
import "./Price.css";

interface Props {
  value: number;
  /** Signed-in readers pay in буки, guests in roubles. */
  coins: boolean;
  className?: string;
  /** The coin glyph is sized against the digits it sits next to. */
  iconWidth?: number;
  iconHeight?: number;
}

/**
 * An amount together with the currency it is in.
 *
 * The бука glyph carries no text of its own, so every amount rendered in буки
 * has to drag the plural label along for assistive tech — which is the reason
 * this is a component and not a template string.
 */
export function Price({ value, coins, className = "", iconWidth = 18, iconHeight = 20 }: Props) {
  return (
    <span className={`price ${className}`}>
      {value}
      {coins ? (
        <IconCoin
          className="price__coin"
          width={iconWidth}
          height={iconHeight}
          role="img"
          aria-label={bukaLabel(value)}
        />
      ) : (
        // An element, not a bare "₽": two adjacent text nodes collapse into one
        // anonymous flex item, and the gap that spaces the amount from its
        // currency would never apply.
        <span className="price__currency">₽</span>
      )}
    </span>
  );
}
