import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Film,
  Tv,
  Gamepad2,
  Library,
  FolderHeart,
  Plus,
  Trash2,
  X,
  LayoutGrid,
  List as ListIcon,
  GripVertical,
  MapPin,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  getUserList,
  removeListItem,
  updateUserListOrder,
} from "../api/listService";
import {
  getCollections,
  createCollection,
  deleteCollection,
  removeMediaFromCollection,
  updateCollectionOrder,
} from "../api/collectionService";
import useAuthStore from "../store/useAuthStore";

const MyList = () => {
  const { user } = useAuthStore();
  const [list, setList] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // טאב דיפולטיבי - סרטים
  const [activeFilter, setActiveFilter] = useState("movie");

  // טעינה ושמירה של מצבי תצוגה ב-localStorage
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("viewMode") || "grid",
  );
  const [isManualSort, setIsManualSort] = useState(
    () => localStorage.getItem("isManualSort") === "true",
  );

  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionType, setNewCollectionType] = useState("movie");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (user) {
        const listData = await getUserList();
        setList(listData);
        const collectionData = await getCollections();
        setCollections(collectionData);
      }
    } catch (error) {
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);
  };

  const handleToggleManualSort = () => {
    const nextState = !isManualSort;
    setIsManualSort(nextState);
    localStorage.setItem("isManualSort", String(nextState));
  };

  // מניעת כפל פריטים שנמצאים באוספים
  const itemsInCollections = new Set(
    collections.flatMap((col) =>
      col.items.map((item) => item?._id?.toString() || item?.toString()),
    ),
  );

  // סינון רשימה לפי הטאב הפעיל
  const filteredList = list.filter((item) => {
    const isTypeMatch = item.mediaItem.type === activeFilter;
    const isAlreadyInCollection = itemsInCollections.has(
      item.mediaItem._id?.toString(),
    );
    return isTypeMatch && !isAlreadyInCollection;
  });

  // מיון לפי בחירת המשתמש (ידני או תאריך יצירה)
  const sortedFilteredList = [...filteredList].sort((a, b) => {
    if (isManualSort) {
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // יצירת מפה של סטטוסים לכל פריט מדיה כדי להציג אותם גם באוספים
  const statusMap = new Map(
    list.map((item) => [item.mediaItem._id.toString(), item.status]),
  );

  // מנגנון גרירה חכם עם droppableId דינמי למניעת באגים במעברי טאבים
  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    if (type === "MAIN_LIST") {
      const items = Array.from(sortedFilteredList);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const updatedItems = items.map((item, idx) => ({
        ...item,
        orderIndex: idx,
      }));

      setList((prev) => {
        const newList = [...prev];
        updatedItems.forEach((uItem) => {
          const idx = newList.findIndex((i) => i._id === uItem._id);
          if (idx > -1) newList[idx].orderIndex = uItem.orderIndex;
        });
        return newList;
      });

      try {
        const payload = updatedItems.map((i) => ({
          _id: i._id,
          orderIndex: i.orderIndex,
        }));
        await updateUserListOrder(payload);
        toast.success("סדר הרשימה עודכן בהצלחה!");
      } catch (err) {
        toast.error("שגיאה בשמירת סדר הרשימה");
      }
    } else if (type === "COLLECTION") {
      const collectionId = source.droppableId;
      const colIndex = collections.findIndex((c) => c._id === collectionId);
      const newCollections = [...collections];
      const items = Array.from(newCollections[colIndex].items);

      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      newCollections[colIndex].items = items;
      setCollections(newCollections);

      try {
        const orderedMediaIds = items.map((item) => item._id);
        await updateCollectionOrder(collectionId, orderedMediaIds);
        toast.success("סדר האוסף עודכן בהצלחה!");
      } catch (err) {
        toast.error("שגיאה בשמירת סדר האוסף בשרת");
      }
    }
  };

  const handleDeleteFromLibrary = async (e, listId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("האם למחוק פריט זה מהספרייה?")) return;
    try {
      await removeListItem(listId);
      setList((prev) => prev.filter((item) => item._id !== listId));
      const updatedCollections = await getCollections();
      setCollections(updatedCollections);
      toast.success("הפריט נמחק בהצלחה");
    } catch (error) {
      toast.error("שגיאה במחיקת הפריט");
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm("האם למחוק את האוסף הזה?")) return;
    try {
      await deleteCollection(collectionId);
      setCollections((prev) => prev.filter((c) => c._id !== collectionId));
      toast.success("האוסף נמחק בהצלחה");
    } catch (error) {
      toast.error("שגיאה במחיקת האוסף");
    }
  };

  const handleRemoveFromCollection = async (e, collectionId, mediaId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("האם להסיר פריט זה מהאוסף?")) return;
    try {
      await removeMediaFromCollection(collectionId, mediaId);
      setCollections((prev) =>
        prev.map((c) => {
          if (c._id === collectionId) {
            return {
              ...c,
              items: c.items.filter((item) => item._id !== mediaId),
            };
          }
          return c;
        }),
      );
      toast.success("הפריט הוסר מהאוסף");
    } catch (error) {
      toast.error("שגיאה בהסרת הפריט");
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      await createCollection({
        name: newCollectionName,
        description: newCollectionDesc,
        type: newCollectionType,
      });
      toast.success("אוסף חדש נוצר בהצלחה!");
      setNewCollectionName("");
      setNewCollectionDesc("");
      setShowModal(false);
      const updatedCollections = await getCollections();
      setCollections(updatedCollections);
    } catch (error) {
      toast.error("שגיאה ביצירת האוסף");
    }
  };

  const getStatusHebrew = (status) => {
    const mapping = {
      plan_to_play: "מתכנן לשחק",
      playing: "משחק כרגע",
      plan_to_watch: "מתכנן לצפות",
      watching: "צופה כרגע",
      completed: "סיימתי",
      dropped: "ננטש",
    };
    return mapping[status] || status;
  };

  const getStatusColor = (status) => {
    if (status === "completed")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "playing" || status === "watching")
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "dropped") return "bg-red-100 text-red-700 border-red-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center mt-20 text-xl text-slate-500 animate-pulse">
        טוען את הספרייה...
      </div>
    );

  // מאלץ רשימה אנכית בזמן סידור ידני כדי למנוע קפיצות ובאגים ויזואליים
  const currentEffectiveViewMode = isManualSort ? "list" : viewMode;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div>
        <div className="flex flex-col xl:flex-row justify-between items-center mb-8 border-b border-slate-200 pb-6 gap-4">
          <h1 className="text-3xl font-bold text-slate-800">הספרייה שלי</h1>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* כפתורי סדר ותצוגה */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                onClick={handleToggleManualSort}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${isManualSort ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-200"}`}
              >
                {isManualSort ? "סיום סידור" : "סדר ידנית"}
              </button>
              <div className="h-6 w-px bg-slate-300 mx-1"></div>
              <button
                disabled={isManualSort}
                onClick={() => handleToggleViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${isManualSort ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${viewMode === "grid" && !isManualSort ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-700"}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                disabled={isManualSort}
                onClick={() => handleToggleViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${isManualSort ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${viewMode === "list" || isManualSort ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-700"}`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>

            {/* ניווט הטאבים עם cursor-pointer קבוע */}
            <div className="flex flex-wrap justify-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveFilter("movie")}
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === "movie" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Film className="w-4 h-4" /> סרטים
              </button>
              <button
                onClick={() => setActiveFilter("tv")}
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === "tv" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Tv className="w-4 h-4" /> סדרות
              </button>
              <button
                onClick={() => setActiveFilter("game")}
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === "game" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Gamepad2 className="w-4 h-4" /> משחקים
              </button>
              <button
                onClick={() => setActiveFilter("destination")}
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === "destination" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
              >
                <MapPin className="w-4 h-4" /> יעדים (בקרוב)
              </button>
              <button
                onClick={() => setActiveFilter("collections")}
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === "collections" ? "bg-white shadow text-indigo-600" : "text-slate-600 hover:text-slate-900"}`}
              >
                <FolderHeart className="w-4 h-4" /> אוספים ({collections.length}
                )
              </button>
            </div>
          </div>
        </div>

        {/* טאב אוספים */}
        {activeFilter === "collections" ? (
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> צור אוסף חדש
              </button>
            </div>

            {showModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl text-right">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">
                    יצירת אוסף חדש
                  </h3>
                  <form
                    onSubmit={handleCreateCollection}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        שם האוסף
                      </label>
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        סוג האוסף (וולידציה לטאב)
                      </label>
                      <select
                        value={newCollectionType}
                        onChange={(e) => setNewCollectionType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                      >
                        <option value="movie">סרטים בלבד</option>
                        <option value="tv">סדרות בלבד</option>
                        <option value="game">משחקים בלבד</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        תיאור קצר (אופציונלי)
                      </label>
                      <textarea
                        value={newCollectionDesc}
                        onChange={(e) => setNewCollectionDesc(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none h-20 resize-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2 justify-start mt-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg text-sm cursor-pointer"
                      >
                        צור אוסף
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-lg text-sm cursor-pointer"
                      >
                        ביטול
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {collections.length === 0 ? (
              <div className="text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-sm mt-4">
                <FolderHeart className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-slate-700 mb-1">
                  אין אוספים עדיין
                </h3>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {collections.map((col) => (
                  <div
                    key={col._id}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group text-right"
                  >
                    <button
                      onClick={() => handleDeleteCollection(col._id)}
                      className="absolute top-4 left-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="text-right mb-4 border-b border-slate-100 pb-3 pr-12">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border border-indigo-100">
                          {col.type}
                        </span>
                        <h2 className="text-xl font-bold text-indigo-700">
                          {col.name}
                        </h2>
                      </div>
                      {col.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {col.description}
                        </p>
                      )}
                    </div>

                    {col.items.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">
                        האוסף ריק.
                      </p>
                    ) : (
                      <Droppable
                        droppableId={String(col._id)}
                        type="COLLECTION"
                        direction="vertical"
                      >
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={
                              currentEffectiveViewMode === "grid"
                                ? "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4"
                                : "flex flex-col gap-3"
                            }
                          >
                            {col.items.map((item, index) => {
                              // הוספת סטטוס ולינק תמידי
                              if (!item) return null; // הגנה מפני פריטים ריקים
                              const ItemWrapper = Link; // תמיד נאפשר לחיצה, גם במצב סידור
                              const itemStatus = statusMap.get(
                                item._id.toString(),
                              );
                              return (
                                <Draggable
                                  key={String(item._id)}
                                  draggableId={String(item._id)}
                                  index={index}
                                  isDragDisabled={!isManualSort}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`group/item relative bg-slate-50 rounded-xl overflow-hidden border transition-all ${
                                        snapshot.isDragging
                                          ? "shadow-xl ring-2 ring-indigo-500 border-transparent组织 z-50 scale-105 bg-white"
                                          : "border-slate-200 hover:border-indigo-300"
                                      } ${currentEffectiveViewMode === "list" ? "flex h-24 items-center" : "block"}`}
                                    >
                                      {isManualSort && (
                                        <div
                                          {...provided.dragHandleProps}
                                          className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-md z-20 cursor-grab active:cursor-grabbing"
                                        >
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                      )}

                                      <button
                                        onClick={(e) =>
                                          handleRemoveFromCollection(
                                            e,
                                            col._id,
                                            item._id,
                                          )
                                        }
                                        className="absolute top-1 left-1 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 p-1.5 rounded-lg z-20 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer shadow-sm border border-slate-200"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>

                                      <ItemWrapper
                                        to={`/item/${item.type}/${item.externalId}`}
                                        className={`flex w-full h-full ${isManualSort ? "cursor-default" : "cursor-pointer"} ${currentEffectiveViewMode === "list" ? "flex-row-reverse" : "flex-col"}`}
                                      >
                                        <div
                                          className={`bg-slate-200 flex-shrink-0 ${currentEffectiveViewMode === "list" ? "w-16 h-full" : "w-full aspect-[2/3]"}`}
                                        >
                                          {item.posterPath ? (
                                            <img
                                              src={item.posterPath}
                                              draggable="false"
                                              alt={item.title}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                              אין
                                            </div>
                                          )}
                                        </div>
                                        <div
                                          className={`flex flex-col flex-grow ${currentEffectiveViewMode === "list" ? "p-3 text-right justify-between" : "p-3"}`}
                                        >
                                          <h4
                                            className={`font-bold text-slate-700 truncate group-hover/item:text-indigo-600 ${currentEffectiveViewMode === "list" ? "text-base mr-6" : "text-sm text-center"}`}
                                          >
                                            {item.title}
                                          </h4>
                                          {itemStatus && (
                                            <div
                                              className={`flex items-center text-xs mt-auto ${currentEffectiveViewMode === "list" ? "justify-end" : "justify-center"}`}
                                            >
                                              <span
                                                className={`px-2 py-0.5 border rounded-md font-bold ${getStatusColor(itemStatus)}`}
                                              >
                                                {getStatusHebrew(itemStatus)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </ItemWrapper>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* טאבים רגילים: סרטים, סדרות, משחקים */
          <div>
            {activeFilter === "destination" ? (
              <div className="text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-sm mt-4 text-slate-500">
                טאב היעדים בבנייה... יתחבר בקרוב.
              </div>
            ) : (
              <div>
                {sortedFilteredList.length === 0 ? (
                  <div className="text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-sm mt-4">
                    <Library className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-slate-700 mb-1">
                      אין פריטים להצגה
                    </h3>
                    <Link
                      to="/search"
                      className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-5 rounded-lg text-sm cursor-pointer inline-block mt-3"
                    >
                      עבור לחיפוש
                    </Link>
                  </div>
                ) : (
                  // ה-droppableId משתנה דינמית לפי הפילטר הפעיל כדי למנוע קפיאות ושיבושים במעברים
                  <Droppable
                    droppableId={activeFilter}
                    type="MAIN_LIST"
                    direction="vertical"
                  >
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={
                          currentEffectiveViewMode === "grid"
                            ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
                            : "flex flex-col gap-4"
                        }
                      >
                        {sortedFilteredList.map((item, index) => {
                          const media = item.mediaItem;
                          const MainItemWrapper = Link; // תמיד נאפשר לחיצה, גם במצב סידור
                          return (
                            <Draggable
                              key={String(item._id)}
                              draggableId={String(item._id)}
                              index={index}
                              isDragDisabled={!isManualSort}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all relative group ${
                                    snapshot.isDragging
                                      ? "shadow-2xl ring-2 ring-indigo-500 border-transparent z-50 scale-102 bg-white"
                                      : "border-slate-200 hover:shadow-md"
                                  }`}
                                >
                                  {isManualSort && (
                                    <div
                                      {...provided.dragHandleProps}
                                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-md z-20 cursor-grab active:cursor-grabbing transition-colors"
                                    >
                                      <GripVertical className="w-5 h-5" />
                                    </div>
                                  )}

                                  <button
                                    onClick={(e) =>
                                      handleDeleteFromLibrary(e, item._id)
                                    }
                                    className={`absolute top-2 left-2 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 p-1.5 rounded-lg z-20 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm border border-slate-200 ${isManualSort ? "hidden" : ""}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>

                                  <MainItemWrapper
                                    to={`/item/${media.type}/${media.externalId}`}
                                    className={`flex h-full w-full ${isManualSort ? "cursor-default" : "cursor-pointer"} ${currentEffectiveViewMode === "list" ? "flex-row-reverse h-28" : "flex-col"}`}
                                  >
                                    {/* אילוץ יחס גובה-רוחב קבוע (aspect-[2/3]) שפותר את הגדלים השונים בין משחק לסרט */}
                                    <div
                                      className={`relative bg-slate-100 flex-shrink-0 ${currentEffectiveViewMode === "list" ? "w-20 md:w-24 h-full" : "w-full aspect-[2/3]"}`}
                                    >
                                      {media.posterPath ? (
                                        <img
                                          src={media.posterPath}
                                          draggable="false"
                                          alt={media.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                          אין תמונה
                                        </div>
                                      )}
                                    </div>

                                    <div
                                      className={`p-4 flex flex-col flex-grow ${currentEffectiveViewMode === "list" ? "text-right justify-between py-3" : ""}`}
                                    >
                                      <h3
                                        className={`font-bold text-slate-800 line-clamp-1 ${currentEffectiveViewMode === "list" ? "text-lg mb-1 mr-8" : "text-base mb-2"}`}
                                        title={media.title}
                                      >
                                        {media.title}
                                      </h3>

                                      <div
                                        className={`flex items-center text-xs mt-auto gap-2 ${currentEffectiveViewMode === "list" ? "justify-end" : "justify-between"}`}
                                      >
                                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">
                                          {media.type}
                                        </span>
                                        <span
                                          className={`px-2.5 py-1 border rounded-md font-bold ${getStatusColor(item.status)}`}
                                        >
                                          {getStatusHebrew(item.status)}
                                        </span>
                                      </div>
                                    </div>
                                  </MainItemWrapper>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default MyList;
