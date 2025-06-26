import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CreateCampaign from './pages/CreateCampaign';
import ManageCampaign from './pages/ManageCampaign';
import VerifyDonations from './pages/VerifyDonations';
import UserManagement from './pages/UserManagement';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// CSS
import './App.css';

function App() {
  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 py-4">
        <Container>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/campaigns" element={<CampaignList />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            
            {/* Protected Routes (Any authenticated user) */}
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/campaigns/create" element={
              <PrivateRoute>
                <CreateCampaign />
              </PrivateRoute>
            } />
            <Route path="/campaigns/manage/:id" element={
              <PrivateRoute>
                <ManageCampaign />
              </PrivateRoute>
            } />
            
            {/* Admin Only Routes */}
            <Route path="/admin/dashboard" element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            } />
            <Route path="/admin/donations" element={
              <RoleRoute allowedRoles={['admin']}>
                <VerifyDonations />
              </RoleRoute>
            } />
            <Route path="/admin/users" element={
              <RoleRoute allowedRoles={['admin']}>
                <UserManagement />
              </RoleRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default App;
