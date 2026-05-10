import { useEffect, useState } from 'react';
import MainApp from './MainApp';
import AdminApp from './Admin';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check the current URL path
    const path = window.location.pathname;
    setIsAdmin(path === '/admin' || path.startsWith('/admin/'));
    
    // Optional: Update URL without page reload for navigation
    const handleNavigation = () => {
      setIsAdmin(window.location.pathname === '/admin');
    };
    
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Change URL when you want to navigate
  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdmin(true);
  };

  const navigateToMain = () => {
    window.history.pushState({}, '', '/');
    setIsAdmin(false);
  };

  if (isAdmin) {
    return <AdminApp onNavigateToMain={navigateToMain} />;
  }
  return <MainApp onNavigateToAdmin={navigateToAdmin} />;
}

export default App;
