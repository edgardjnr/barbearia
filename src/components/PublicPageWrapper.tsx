import { useEffect } from 'react';

interface PublicPageWrapperProps {
  children: React.ReactNode;
}

export const PublicPageWrapper = ({ children }: PublicPageWrapperProps) => {

  useEffect(() => {
    // Aplicar tema light apenas nas páginas públicas via CSS
    document.body.classList.add('force-light-mode');

    // Cleanup: remover a classe quando sair da página
    return () => {
      document.body.classList.remove('force-light-mode');
    };
  }, []);

  return (
    <div className="public-page-wrapper">
      {children}
    </div>
  );
};