import { useParams } from 'react-router-dom';

const ItemDetails = () => {
  const { id } = useParams();

  return (
    <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center mt-10">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">עמוד פרטים (בבנייה)</h2>
      <p className="text-slate-600">זהו העמוד של הפריט עם ה-ID:</p>
      <code className="bg-slate-100 px-3 py-1 rounded text-indigo-600 mt-2 inline-block">{id}</code>
      <p className="mt-6 text-slate-500 text-sm">כאן נוסיף את אפשרות המחיקה, עריכת הסטטוס, וצ'אט ה-AI על הפריט הזה!</p>
    </div>
  );
};

export default ItemDetails;