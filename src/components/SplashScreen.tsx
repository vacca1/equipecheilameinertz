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

    // Efeito sonoro sutil usando Web Audio API
    const playWelcomeSound = async () => {
      try {
        console.log('🔊 Iniciando áudio...');
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume AudioContext (necessário em alguns browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('✅ AudioContext resumed');
        }
        
        console.log('🎵 AudioContext state:', audioContext.state);
        
        // Criar som agradável com osciladores
        const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
          
          console.log(`🎼 Tocando: ${frequency}Hz, volume: ${volume}`);
        };
        
        // Acorde agradável (C maior) com volumes audíveis
        const now = audioContext.currentTime;
        playTone(523.25, now, 0.8, 0.15); // C5 - aumentado de 0.05 para 0.15
        playTone(659.25, now + 0.1, 0.8, 0.12); // E5 - aumentado de 0.04 para 0.12
        playTone(783.99, now + 0.2, 1.0, 0.10); // G5 - aumentado de 0.03 para 0.10
        
        console.log('✅ Sons agendados para tocar');
        
      } catch (error) {
        console.error('❌ Erro ao reproduzir áudio:', error);
      }
    };

    // Toca som após pequeno delay para sincronizar com animação
    setTimeout(playWelcomeSound, 200);

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
        <div className="mb-8 animate-logo-entry animate-logo-pulse">
          <img 
            src="/logo-clinica.png" 
            alt="Equipe Cheila Meinertz" 
            className="w-[280px] h-auto md:w-[380px] drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 50px rgba(79, 127, 255, 0.3))' }}
          />
        </div>
        
        {/* Tagline - aparece aos 1.2s (texto agora redundante com logo) */}
        <p 
          className="
            text-lg md:text-xl font-light text-gray-600 tracking-wide text-center
            opacity-0
          "
          style={{ animation: 'fadeIn 0.6s ease-out 1.2s forwards' }}
        >
          Fisioterapia e Reabilitação
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
