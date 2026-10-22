import { useSearchParams } from 'react-router-dom';
import SheetCard from '../components/prep/SheetCard.jsx';
import { collections, loadHub } from '../lib/content.js';
import { useContent } from '../hooks/useContent.js';

export default function PrepHubPage() {
  const [params, setParams] = useSearchParams();
  const requested = collections.find((c) => c.id === params.get('collection') && c.enabled);
  const activeId = (requested ?? collections.find((c) => c.enabled))?.id;
  const hub = useContent(loadHub, activeId);

  return (
    <div className="page">
      {/* Disabled tabs flip on by setting "enabled": true in content/collections.json
          and adding content/collections/<id>.json. */}
      <div className="collection-tabs" role="tablist" aria-label="Collections">
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === activeId}
            disabled={!c.enabled}
            title={c.enabled ? undefined : 'Coming soon'}
            className={`tab${c.id === activeId ? ' is-active' : ''}`}
            onClick={() => setParams({ collection: c.id })}
          >
            {c.title}
          </button>
        ))}
      </div>

      {hub.data?.sections.map((section) => (
        <section key={section.id} className="hub-section" aria-labelledby={`hub-${section.id}`}>
          <h2 id={`hub-${section.id}`} className="hub-section-title">
            {section.title}
          </h2>
          <div className="sheet-grid">
            {section.sheets.map((card) => (
              <SheetCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
