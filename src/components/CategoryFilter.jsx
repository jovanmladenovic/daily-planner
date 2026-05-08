import { CATEGORIES, getCat } from '../utils/categories';

export default function CategoryFilter({ active, onChange }) {
  const all = [{ id: 'all', label: 'All', bg: '#F0F0EF', text: '#333' }, ...CATEGORIES];

  return (
    <div className="cat-filter">
      {all.map(cat => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            className={`cat-pill${isActive ? ' cat-pill--active' : ''}`}
            style={isActive ? { background: cat.bg, color: cat.text, borderColor: cat.text + '44' } : {}}
            onClick={() => onChange(cat.id)}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
