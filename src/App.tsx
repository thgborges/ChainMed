import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

// Doctor routes
import DoctorPrescriptions from "./pages/doctor/Prescriptions";
import NewPrescription from "./pages/doctor/NewPrescription"; 
import DoctorSharedPrescriptions from "./pages/doctor/SharedPrescriptions";
import DoctorProfile from "./pages/doctor/Profile";

// Patient routes
import PatientPrescriptions from "./pages/patient/Prescriptions";
import PatientSharedPrescriptions from "./pages/patient/SharedPrescriptions";
import SharePrescription from "./pages/patient/SharePrescription";
import PatientProfile from "./pages/patient/Profile";

// Auth Route guard component
const ProtectedRoute = ({ 
  element,
  requiredUserType 
}: { 
  element: React.ReactNode;
  requiredUserType: 'doctor' | 'patient';
}) => {
  const user = localStorage.getItem('chainmed-user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const userData = JSON.parse(user);
    if (userData.userType !== requiredUserType) {
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    localStorage.removeItem('chainmed-user');
    return <Navigate to="/login" replace />;
  }

  return <>{element}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          
          {/* Doctor Routes */}
          <Route 
            path="/doctor/prescriptions" 
            element={<ProtectedRoute element={<DoctorPrescriptions />} requiredUserType="doctor" />} 
          />
          <Route 
            path="/doctor/prescriptions/new" 
            element={<ProtectedRoute element={<NewPrescription />} requiredUserType="doctor" />} 
          />
          <Route 
            path="/doctor/shared" 
            element={<ProtectedRoute element={<DoctorSharedPrescriptions />} requiredUserType="doctor" />} 
          />
          <Route 
            path="/doctor/profile" 
            element={<ProtectedRoute element={<DoctorProfile />} requiredUserType="doctor" />} 
          />
          
          {/* Patient Routes */}
          <Route 
            path="/patient/prescriptions" 
            element={<ProtectedRoute element={<PatientPrescriptions />} requiredUserType="patient" />} 
          />
          <Route 
            path="/patient/shared" 
            element={<ProtectedRoute element={<PatientSharedPrescriptions />} requiredUserType="patient" />} 
          />
          <Route 
            path="/patient/share" 
            element={<ProtectedRoute element={<SharePrescription />} requiredUserType="patient" />} 
          />
          <Route 
            path="/patient/profile" 
            element={<ProtectedRoute element={<PatientProfile />} requiredUserType="patient" />} 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
