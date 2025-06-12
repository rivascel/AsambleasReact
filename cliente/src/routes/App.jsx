import '../App.css';
import { BrowserRouter, Route, Routes, Router } from 'react-router-dom'
import Layout from '../containers/Layout';
import AdminDashBoard from '../pages/AdminDashBoard';
import OwnerDashBoard from '../pages/OwnerDashBoard';
import OwnerRegister from '../containers/OwnerRegister';
import useInitialState from '../hooks/useInitialState';
import AppContext from '../context/AppContext';
import MagicLinkVerification from '../containers/MagicLinkVerification';
import React, { useContext } from "react";
import UserProvider, { UserContext } from "../components/UserContext";
import AdminRegister from '../containers/admin/AdminRegister';
import Home from '../pages/Home';

function App() {
  const initialState = useInitialState();	

  const AuthRedirect  = () => {
    const { isAuthenticated } = useContext(UserContext);

    return isAuthenticated ? <OwnerDashBoard /> : <OwnerRegister />;
  };

  return (
    <AppContext.Provider value={initialState}>
      <UserProvider>
        <BrowserRouter>
              <Routes>
                  <Route path="/" element={<Home/>}/> 
                  <Route path="/admin" element={<AdminRegister/>}/>
                  <Route path="/admin/dashboard" element={<AdminDashBoard/>}/>
                  <Route path="/owner" element={<Layout><OwnerDashBoard/></Layout>}/>
                  <Route path="/magic-link" element={<MagicLinkVerification />} />
                  <Route path="/auth-redirect" element={<AuthRedirect />} />
              </Routes>
        </BrowserRouter>
      </UserProvider>
    </AppContext.Provider>
  )
}

export default App;
