import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PublicPageWrapper } from "@/components/PublicPageWrapper";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { user, organization, loading, isClient } = useAuth();

  // Check for password recovery first
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    
    console.log('Index page - URL analysis:', {
      pathname: window.location.pathname,
      hash,
      search,
      fullUrl: window.location.href
    });
    
    // Check if this is a password recovery link (more comprehensive check)
    const hasRecoveryInHash = hash.includes('type=recovery') && hash.includes('access_token=');
    const hasRecoveryInSearch = search.includes('type=recovery') && search.includes('access_token=');
    
    console.log('Recovery detection:', {
      hasRecoveryInHash,
      hasRecoveryInSearch,
      shouldRedirect: hasRecoveryInHash || hasRecoveryInSearch
    });
    
    if ((hasRecoveryInHash || hasRecoveryInSearch) && window.location.pathname !== '/reset-password') {
      console.log('Recovery detected, redirecting to reset-password with full URL params');
      // Use window.location.href instead of navigate to preserve hash and search params
      window.location.href = '/reset-password' + window.location.hash + window.location.search;
      return;
    }
  }, [navigate]);

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    if (!loading && user) {
      if (isClient) {
        // Cliente logado - verificar se veio de link de reserva
        const currentPath = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);
        const bookingLink = searchParams.get('booking') || localStorage.getItem('pendingBookingLink');
        
        if (bookingLink) {
          // Limpar o link pendente do localStorage
          localStorage.removeItem('pendingBookingLink');
          // Redirecionar para a página de agendamento
          navigate(bookingLink);
        } else if (currentPath === '/') {
          // Cliente sem link de reserva - solicitar link
          navigate("/cliente-reserva");
        }
      } else {
        // Usuário profissional - lógica original
        if (organization) {
          // User has organization, go to dashboard
          navigate("/dashboard");
        } else {
          // User doesn't have organization, go to setup
          navigate("/setup");
        }
      }
    }
  }, [user, organization, loading, isClient, navigate]);

  return (
    <PublicPageWrapper>
      <div className="min-h-screen bg-background">
        <Header />
        <Hero />
        <Features />
        <Pricing />
        <Footer />
      </div>
    </PublicPageWrapper>
  );
};

export default Index;
