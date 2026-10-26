import { Link } from 'react-router';
import { ArrowRight, Building2, FileText, Layers } from 'lucide-react';
import { companyCategories, companySheetId, loadSheet } from '../../lib/content.js';
import { useContent } from '../../hooks/useContent.js';

export default function CompanyCard({ company }) {
  // The "All" list holds every problem, so its count is the company's total.
  const { data: all } = useContent(loadSheet, companySheetId(company.id, 'all'));

  return (
    <article className="sheet-card">
      <header className="sheet-card-head">
        <span className="sheet-card-icon">
          <Building2 size={20} strokeWidth={2.2} />
        </span>
        <h3>{company.title}</h3>
      </header>

      <ul className="sheet-card-stats">
        <li>
          <Layers size={13} strokeWidth={1.8} />
          {companyCategories.length} Lists
        </li>
        <li>
          <FileText size={13} strokeWidth={1.8} />
          {all?.problemCount ?? '–'} Problems
        </li>
      </ul>

      <footer className="sheet-card-foot">
        <Link to={`/prep/company/${company.id}`} className="btn">
          Explore <ArrowRight size={15} />
        </Link>
      </footer>
    </article>
  );
}
