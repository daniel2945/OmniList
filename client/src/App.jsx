import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import MyList from './pages/MyList'; // ייבוא הספרייה
import ItemDetails from './pages/ItemDetails'; // ייבוא עמוד הפרטים

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="my-list" element={<MyList />} />
          <Route path="item/:id" element={<ItemDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;