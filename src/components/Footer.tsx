import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import LogoSaoMiguel from '@/assets/logo-sao-miguel.webp'; // Ajuste o caminho conforme sua estrutura de pastas

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo and Mission */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-600 p-2 rounded-full flex items-center justify-center">
                <img
                  src={LogoSaoMiguel}
                  alt="Logo São Miguel"
                  className="h-8 w-auto" // Ajuste o tamanho conforme necessário
                  style={{ background: 'transparent' }}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold">Casa Presbiteral</h3>
                <p className="text-sm text-gray-300">Dom Fernando Legal</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Um projeto da Diocese de São Miguel Paulista dedicado a proporcionar 
              cuidados dignos e amorosos para sacerdotes que consagraram suas vidas 
              ao serviço da Igreja e da comunidade católica.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  Diocese de São Miguel Paulista<br />
                  São Miguel Paulista - SP<br />
                  CEP: 08010-090
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300 text-sm">(11) 2031-2100</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300 text-sm">contato@diocesesaomiguel.org.br</span>
              </div>
            </div>
          </div>

          {/* Quick Links and Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Redes Sociais</h4>
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                className="bg-gray-700 p-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="bg-gray-700 p-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
            <div>
              <h5 className="font-medium mb-2">Informações Importantes</h5>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Diocese de São Miguel Paulista</li>
                <li>Fundada em 15 de agosto de 1981</li>
                <li>Certificado de Entidade Beneficente</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>
            © 2024 Casa Presbiteral Dom Fernando Legal - Diocese de São Miguel Paulista. 
            Todos os direitos reservados.
          </p>
          <p className="mt-2">
            Desenvolvido com <span className="inline-block align-middle"><img src={LogoSaoMiguel} alt="Logo São Miguel" className="h-4 w-auto inline" /></span> para uma causa nobre
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
