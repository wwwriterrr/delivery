import { IconCoin } from "./IconCoin";
import { bukaLabel } from "../utils/format";
import { TOPUP_URL } from "../constants";
import "./BalanceLine.css";

interface Props {
  books: number;
  /** Highlights the balance when it will not cover the order. */
  short?: boolean;
}

/** The reader's бука balance, shown above the book they are about to pay for. */
export function BalanceLine({ books, short = false }: Props) {
  return (
    <div className={`balance-line ${short ? "balance-line--short" : ""}`}>
      <span className="balance-line__label">На вашем счету</span>
      <span className="balance-line__right">
        <span className="balance-line__value">
          {books}
          <IconCoin width={17} height={18} role="img" aria-label={bukaLabel(books)} />
        </span>
        <a className="balance-line__topup" href={TOPUP_URL}>
          Пополнить
        </a>
      </span>
    </div>
  );
}
