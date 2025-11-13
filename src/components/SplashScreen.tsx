import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Verifica se usuário já viu splash nesta sessão
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash === 'true') {
      onComplete();
      return;
    }

    // Marca como visto nesta sessão
    sessionStorage.setItem('hasSeenSplash', 'true');

    // Timer para iniciar saída automática após 3.5s
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3500);

    // Timer para chamar callback após animação completa
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Função para pular splash
  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 700);
  };

  return (
    <div 
      className={`
        fixed inset-0 
        flex flex-col items-center justify-center
        bg-gradient-to-br from-[#F0F4FF] to-[#E8F0FF]
        z-[9999]
        overflow-hidden
        transition-all duration-700
        ${isExiting ? 'animate-slide-up' : ''}
      `}
    >
      {/* Partículas flutuantes no fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#4F7FFF]/20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col items-center relative z-10">
        {/* Logo com animações de entrada e pulsação */}
        <div className="mb-6 animate-logo-entry animate-logo-pulse">
          <img 
            src="/logo-clinica.png" 
            alt="Equipe Cheila Meinertz" 
            className="w-[120px] h-auto md:w-[140px] drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 0 30px rgba(79, 127, 255, 0.3))' }}
          />
        </div>
        
        {/* Nome da clínica - aparece aos 1.2s */}
        <h2 
          className="
            text-2xl md:text-3xl font-light text-gray-700 tracking-wide text-center
            opacity-0
          "
          style={{ animation: 'fadeIn 0.6s ease-out 1.2s forwards' }}
        >
          Equipe Cheila Meinertz
        </h2>
        
        {/* Tagline - aparece aos 1.5s */}
        <p 
          className="
            mt-2 text-sm md:text-base text-gray-500 text-center px-4
            opacity-0
          "
          style={{ animation: 'fadeIn 0.6s ease-out 1.5s forwards' }}
        >
          Cuidado e Excelência em Fisioterapia
        </p>
        
        {/* Loading dots - aparecem aos 2.5s */}
        <div 
          className="
            mt-10 flex gap-2
            opacity-0
          "
          style={{ animation: 'fadeIn 0.4s ease-out 2.5s forwards' }}
        >
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#4F7FFF] animate-dot-pulse"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>

      {/* Botão "Pular" no canto inferior direito */}
      <button
        onClick={handleSkip}
        className="
          absolute bottom-8 right-8 
          flex items-center gap-2
          text-sm text-gray-400 hover:text-gray-600
          transition-colors duration-200
          opacity-0
          group
        "
        style={{ animation: 'fadeIn 0.4s ease-out 2s forwards' }}
        aria-label="Pular animação"
      >
        <span>Pular</span>
        <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Indicador visual de progresso */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-200 rounded-full overflow-hidden opacity-0"
        style={{ animation: 'fadeIn 0.4s ease-out 2s forwards' }}
      >
        <div 
          className="h-full bg-[#4F7FFF] rounded-full animate-progress-bar"
        />
      </div>
    </div>
  );
}
