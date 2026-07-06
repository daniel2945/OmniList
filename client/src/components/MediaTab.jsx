import { Link } from 'react-router-dom';
import { Trash2, GripVertical, Library } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const MediaTab = ({ items, viewMode, isManualSort, onDragEnd, onDelete }) => {
  
  const getStatusHebrew = (status) => {
    const mapping = {
      'plan_to_play': 'מתכנן לשחק', 'playing': 'משחק כרגע',
      'plan_to_watch': 'מתכנן לצפות', 'watching': 'צופה כרגע',
      'completed': 'סיימתי', 'dropped': 'ננטש'
    };
    return mapping[status] || status;
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'playing' || status === 'watching') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status === 'dropped') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  if (items.length === 0) {
    return (
      <div className="text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-sm mt-4">
        <Library className="w-12 h-12 text-slate-200 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-slate-700 mb-1">אין פריטים להצגה בקטגוריה זו</h3>
        <Link to="/search" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-5 rounded-lg text-sm inline-block mt-4">עבור לחיפוש</Link>
      </div>
    );
  }

  // מכריח תצוגת רשימה אנכית בזמן סידור כדי שהאנימציה תהיה יציבה
  const effectiveViewMode = isManualSort ? 'list' : viewMode;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="media-list" type="MEDIA" direction="vertical">
        {(provided) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={effectiveViewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6" : "flex flex-col gap-4"}
          >
            {items.map((item, index) => {
              const media = item.mediaItem;
              // מניעת באג גרירה: אם אנחנו במצב סידור, הופכים לינק לדיב רגיל
              const WrapperTag = isManualSort ? 'div' : Link;

              return (
                <Draggable key={String(item._id)} draggableId={String(item._id)} index={index} isDragDisabled={!isManualSort}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all relative group ${
                        snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 border-transparent z-50 scale-102 bg-white' : 'border-slate-200 hover:shadow-md'
                      }`}
                    >
                      {isManualSort && (
                        <div 
                          {...provided.dragHandleProps}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-md z-20 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-5 h-5" />
                        </div>
                      )}

                      <button 
                        onClick={(e) => onDelete(e, item._id)}
                        className={`absolute top-2 left-2 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 p-1.5 rounded-lg z-20 transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-slate-200 ${isManualSort ? 'hidden' : ''}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <WrapperTag to={`/item/${media.type}/${media.externalId}`} className={`flex h-full w-full ${effectiveViewMode === 'list' ? 'flex-row-reverse h-28' : 'flex-col'}`}>
                        <div className={`relative bg-slate-100 flex-shrink-0 ${effectiveViewMode === 'list' ? 'w-20 md:w-24 h-full' : 'w-full aspect-[2/3]'}`}>
                          {media.posterPath ? (
                            <img src={media.posterPath} draggable="false" alt={media.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">אין פוסטר</div>
                          )}
                        </div>
                        
                        <div className={`p-4 flex flex-col flex-grow ${effectiveViewMode === 'list' ? 'text-right justify-between py-3' : ''}`}>
                          <h3 className={`font-bold text-slate-800 line-clamp-1 ${effectiveViewMode === 'list' ? 'text-lg mb-1 mr-8' : 'text-base mb-2'}`}>{media.title}</h3>
                          
                          <div className={`flex items-center text-xs mt-auto gap-2 ${effectiveViewMode === 'list' ? 'justify-end' : 'justify-between'}`}>
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">{media.type}</span>
                            <span className={`px-2.5 py-1 border rounded-md font-bold ${getStatusColor(item.status)}`}>
                              {getStatusHebrew(item.status)}
                            </span>
                          </div>
                        </div>
                      </WrapperTag>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default MediaTab;