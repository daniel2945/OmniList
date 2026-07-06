import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Search from './pages/Search';
import MyList from './pages/MyList';
import ItemDetails from './pages/ItemDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="search/:activeTab" element={<Search />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="my-list" element={<MyList />} />
          <Route path="my-list/:activeFilter" element={<MyList />} />
          <Route path="item/:type/:id" element={<ItemDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;