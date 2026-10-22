import { Fragment } from 'react';
import { Link } from 'react-router';

/** items: [{ label, to? }] — the last item is the current page. */
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {last || !item.to ? (
              <span className={last ? 'is-current' : undefined} aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to}>{item.label}</Link>
            )}
            {!last && <span className="breadcrumb-sep">/</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
