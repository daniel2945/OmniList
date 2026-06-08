import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import { getUserList } from '../api/listService';

const MyList = () => {
  const { user } = useAuthStore();
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserList();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserList = async () => {
    try {
      setIsLoading(true);
      const data = await getUserList();
      setList(data);
    } catch (error) {
      toast.error(error.message || 'שגיאה בטעינת הרשימה');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center mt-20 text-xl font-medium text-slate-500 animate-pulse">טוען את הספרייה שלך...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-800">הספרייה שלי</h1>
        <Link to="/" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer">
          + חפש פריט חדש
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-sm mt-10">
          <h2 className="text-2xl font-semibold text-slate-700 mb-3">הרשימה שלך ריקה כרגע</h2>
          <p className="text-slate-500">זה הזמן להתחיל להוסיף את המשחקים, הסרטים והסדרות שאתה אוהב.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {list.map((item) => {
            const media = item.mediaItem;
            return (
              // הפכנו את ה-div הראשי ל-Link שלוקח אותנו לעמוד הפריט!
              <Link 
                to={`/item/${item._id}`} 
                key={item._id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col group cursor-pointer"
              >
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  {media.posterPath ? (
                    <img 
                      src={media.posterPath} 
                      alt={media.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">אין תמונה</div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-800 line-clamp-1 mb-1" title={media.title}>
                    {media.title}
                  </h3>
                  
                  <div className="flex justify-between items-center text-xs mt-auto pt-3">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase font-semibold tracking-wider">
                      {media.type}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md font-medium ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.status === 'playing' || item.status === 'watching' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyList;