import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import UserLogin   from './pages/UserLogin'
import AdminLogin  from './pages/AdminLogin'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import MCQTest     from './pages/MCQTest'
import AdminPanel  from './pages/AdminPanel'

const Loader = () => (
  <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{width:28,height:28,border:'2px solid #1a1a1a',borderTopColor:'#fff',borderRadius:'50%'}} className="animate-spin" />
  </div>
)

const ProtectedRoute = ({children}) => {
  const {user,loading} = useAuth()
  if (loading) return <Loader/>
  return user ? children : <Navigate to="/login" replace />
}
const AdminRoute = ({children}) => {
  const {user,loading} = useAuth()
  if (loading) return <Loader/>
  if (!user) return <Navigate to="/admin/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
const PublicRoute = ({children}) => {
  const {user} = useAuth()
  if (!user) return children
  return <Navigate to={user.role==='admin'?'/admin':'/dashboard'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{
          style:{ background:'#111',color:'#e5e5e5',border:'1px solid #222',borderRadius:'10px',
            fontFamily:'Inter,sans-serif',fontSize:'14px',boxShadow:'0 8px 32px #00000080' },
          success:{ iconTheme:{ primary:'#22c55e', secondary:'#0a0a0a' } },
          error:{ iconTheme:{ primary:'#ef4444', secondary:'#0a0a0a' } },
          duration: 4000
        }} />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"       element={<PublicRoute><UserLogin /></PublicRoute>} />
          <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
          <Route path="/register"    element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/test/mcq"    element={<ProtectedRoute><MCQTest /></ProtectedRoute>} />
          <Route path="/admin"       element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="*"            element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}