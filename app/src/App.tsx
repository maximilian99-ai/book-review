import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Detail from './pages/Detail';
import NotFound from './pages/NotFound';
import { useAuthStore } from './stores/useAuthStore';
import Navigation from './components/Navigation';
// import PrivateRoute from './router/PrivateRoute';

const App: React.FC = () => {
  const restore = useAuthStore(state => state.restore);
  
  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/detail/works/:id" element={<Detail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
