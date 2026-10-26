import { Link, useParams } from 'react-router';
import { Building2 } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SheetCard from '../components/prep/SheetCard.jsx';
import { companies, companyCategories, companySheetId } from '../lib/content.js';

/** One company → a card per time window (Last 30 Days … All), each opening its own sheet. */
export default function CompanyPage() {
  const { companyId } = useParams();
  const company = companies.find((c) => c.id === companyId);

  if (!company) {
    return (
      <div className="page">
        <EmptyState
          icon={Building2}
          title="Company not found"
          body="Add it to src/content/companies.json to list it here."
          action={<Link to="/prep" className="btn">Back to Prep Hub</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Prep Hub', to: '/prep' }, { label: company.title }]} />
      <h1 className="page-title">{company.title}</h1>
      <div className="sheet-grid">
        {companyCategories.map((category) => (
          <SheetCard
            key={category.id}
            card={{ id: companySheetId(company.id, category.id), title: category.title, icon: 'company' }}
          />
        ))}
      </div>
    </div>
  );
}
