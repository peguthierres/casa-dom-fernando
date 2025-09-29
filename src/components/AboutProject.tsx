import React, { useState } from 'react';
import { Heart, Home, Users, Star, MapPin, Calendar, Phone, Mail, Camera, Upload, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, ProjectImage } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';

const AboutProject: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  
  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProjectImages();
  }, []);
  
  const loadProjectImages = async () => {
    try {
      const { data } = await supabase
        .from('project_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (data) {
        setProjectImages(data);
      }
    } catch (error) {
      console.error('Error loading project images:', error);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Heart className="h-16 w-16 mx-auto mb-6 text-blue-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Casa Presbiteral Dom Fernando Legal
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Um projeto da Diocese de São Miguel Paulista para acolher com dignidade 
              os sacerdotes que dedicaram suas vidas ao serviço da Igreja
            </p>
          </div>
        </div>
      </section>

      {/* Diocese Information */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Diocese de São Miguel Paulista
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                A Diocese de São Miguel Paulista foi criada em 15 de agosto de 1981, 
                pelo Papa João Paulo II, através da Bula "Cum Ecclesiae". Abrange uma 
                área de 240 km² na zona leste da cidade de São Paulo, atendendo mais 
                de 1,2 milhão de habitantes.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Nossa diocese é composta por 44 paróquias distribuídas pelos bairros 
                de São Miguel Paulista, Itaim Paulista, Cidade Tiradentes, Guaianases, 
                Lajeado, Itaquera, Cidade Líder, José Bonifácio e adjacências.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Fundada em 15 de agosto de 1981</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">44 paróquias na zona leste de São Paulo</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Mais de 1,2 milhão de fiéis</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-8">
              <div className="text-center">
                <Home className="h-20 w-20 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-blue-800 mb-4">
                  Dom Fernando Legal
                </h3>
                <p className="text-blue-700 leading-relaxed">
                  O projeto leva o nome de Dom Fernando Legal, em homenagem ao 
                  primeiro bispo da Diocese de São Miguel Paulista, que dedicou 
                  sua vida pastoral ao cuidado dos mais necessitados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Details */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Detalhes do Projeto
            </h2>
            <p className="text-lg text-gray-600">
              Conheça as características e facilidades da Casa Presbiteral
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Infraestrutura */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Infraestrutura</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 20 quartos individuais com banheiro adaptado</li>
                <li>• Salas de convivência e recreação</li>
                <li>• Biblioteca e sala de leitura</li>
                <li>• Jardins e áreas verdes</li>
                <li>• Estacionamento para visitantes</li>
              </ul>
            </div>

            {/* Cuidados Médicos */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Cuidados Médicos</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Enfermagem 24 horas especializada</li>
                <li>• Consultório médico no local</li>
                <li>• Fisioterapia e terapia ocupacional</li>
                <li>• Farmácia interna</li>
                <li>• Ambulância para emergências</li>
              </ul>
            </div>

            {/* Vida Espiritual */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Vida Espiritual</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Capela para celebrações diárias</li>
                <li>• Sala para retiros e reflexões</li>
                <li>• Confessionários adaptados</li>
                <li>• Espaço para direção espiritual</li>
                <li>• Biblioteca teológica</li>
              </ul>
            </div>

            {/* Alimentação */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-orange-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Alimentação</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Refeitório com capacidade para 30 pessoas</li>
                <li>• Cozinha industrial equipada</li>
                <li>• Nutricionista especializada</li>
                <li>• Dietas especiais para cada necessidade</li>
                <li>• Horta orgânica no local</li>
              </ul>
            </div>

            {/* Lazer e Cultura */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-teal-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Lazer e Cultura</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Sala de TV e cinema</li>
                <li>• Ateliê para atividades manuais</li>
                <li>• Sala de jogos e recreação</li>
                <li>• Auditório para palestras</li>
                <li>• Espaço para apresentações musicais</li>
              </ul>
            </div>

            {/* Serviços Gerais */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Serviços Gerais</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Lavanderia industrial</li>
                <li>• Serviço de limpeza especializado</li>
                <li>• Manutenção técnica 24h</li>
                <li>• Segurança e portaria</li>
                <li>• Wi-Fi em todas as áreas</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Galeria do Projeto
            </h2>
            <p className="text-lg text-gray-600">
              Acompanhe o progresso da construção através de nossas imagens
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectImages.map((image) => (
              <div 
                key={image.id} 
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative">
                  <img 
                    src={image.image_url} 
                    alt={image.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{image.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{image.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(image.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {projectImages.length === 0 && (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Em breve, novas imagens do projeto</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Entre em Contato
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Tem dúvidas sobre o projeto? Entre em contato conosco
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="flex items-center justify-center gap-3">
              <Phone className="h-6 w-6" />
              <span className="text-lg">(11) 2031-2100</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Mail className="h-6 w-6" />
              <span className="text-lg">contato@diocesesaomiguel.org.br</span>
            </div>
          </div>
          
          <Link 
            to="/doacao"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Heart className="h-5 w-5" />
            Contribuir com o Projeto
          </Link>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="relative">
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.title}
                className="w-full h-auto max-h-96 object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedImage.title}</h3>
              <p className="text-gray-600 mb-2">{selectedImage.description}</p>
              <p className="text-sm text-gray-400">
                Publicado em {new Date(selectedImage.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AboutProject;