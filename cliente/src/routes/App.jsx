import '../App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '../containers/Layout';
import AdminDashBoard from '../pages/AdminDashBoard';
import OwnerDashBoard from '../pages/OwnerDashBoard';
import useInitialState from '../hooks/useInitialState';
import MagicLinkVerification from '../containers/MagicLinkVerification';
import AdminRegister from '../containers/admin/AdminRegister';
import Home from '../pages/Home';
import ProtectedRoute from '../containers/ProtectedRoute';
import AppContext from '../context/AppContext';
import UserProvider from "../components/UserContext";

function App() {
  const initialState = useInitialState();	

  return (
    <AppContext.Provider value={initialState}>
      <UserProvider>
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home/>}/> 
              <Route path="/admin" element={<AdminRegister/>}/>
              <Route path="/admin/dashboard" element={<ProtectedRoute><Layout><AdminDashBoard/></Layout></ProtectedRoute>}/>
              <Route path="/owner" element={<ProtectedRoute><Layout><OwnerDashBoard/></Layout></ProtectedRoute>}/>
              <Route path="/magic-link" element={<MagicLinkVerification />} />
            </Routes>
        </BrowserRouter>
      </UserProvider>
    </AppContext.Provider>
  )
}

export default App;
