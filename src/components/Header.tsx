import React from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleNavigation = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <header className="bg-white shadow-lg relative z-50 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link 
            to="/" 
            className="flex items-center space-x-3"
            onClick={() => handleNavigation('/')}
          >
            <div className="bg-blue-600 p-2 rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-800">Casa Presbiteral</h1>
              <p className="text-xs sm:text-sm text-gray-600">Dom Fernando Legal</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              onClick={() => handleNavigation('/')}
            >
              Início
            </Link>
            <Link 
              to="/projeto" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              onClick={() => handleNavigation('/projeto')}
            >
              Conheça o Projeto
            </Link>
            <Link 
              to="/doacao" 
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-medium"
              onClick={() => handleNavigation('/doacao')}
            >
              Doar Agora
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t z-40">
          <nav className="px-4 py-6 space-y-4">
            <button
              onClick={() => handleNavigation('/')}
              className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blue-50"
            >
              Início
            </button>
            <button
              onClick={() => handleNavigation('/projeto')}
              className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blue-50"
            >
              Conheça o Projeto
            </button>
            <button
              onClick={() => handleNavigation('/doacao')}
              className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
            >
              Doar Agora
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;