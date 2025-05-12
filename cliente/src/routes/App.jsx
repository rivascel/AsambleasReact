import '../App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '../containers/Layout';
import AdminDashBoard from '../pages/AdminDashBoard';
import OwnerDashBoard from '../pages/OwnerDashBoard';
import useInitialState from '../hooks/useInitialState';
import appContext from '../context/appContext';
import MagicLinkVerification from '../containers/MagicLinkVerification';
import ProtectedRoute from '../components/ProtectedRoute';
import Home from '../pages/Home';

function App() {
  const initialState = useInitialState();	
  return (
    <appContext.Provider value={initialState}>
      <BrowserRouter>
        <Layout>
            <Routes>
                <Route exact path="/" element={<Home/>}/> 
                <Route exact path="/admin" element={<AdminDashBoard/>}/>
                <Route exact path="/owner" element={<OwnerDashBoard/>}/>
                <Route exact path="/magic-link" element={<MagicLinkVerification />} />
            </Routes>
        </Layout>
      </BrowserRouter>
    </appContext.Provider>
  )
}

export default App;
