import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function Header() {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div
        className={`mx-auto transition-all duration-300 ease-in-out ${
          isScrolled ? "max-w-2xl px-4 pt-3 pb-3" : "max-w-7xl px-4 sm:px-6 lg:px-8 pt-3 pb-3"
        }`}
      >
        <nav className={`flex items-center justify-between h-14 md:h-16 rounded-2xl glass-iphone border border-white/10 dark:border-white/5 shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out text-white ${isScrolled ? 'px-3 md:px-4' : 'px-4 md:px-6'}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group will-change-transform flex-shrink-0">
            <img
              src="/logo.png"
              alt="vye"
              className="h-8 w-8 rounded-lg object-cover transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/50"
              draggable={false}
            />
            <span className={`text-white font-semibold text-lg tracking-tight transition-all duration-300 ease-in-out ${isScrolled ? 'hidden' : ''}`}>
              vye<span className="text-muted-foreground">.bio</span>
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link 
              to="/features" 
              className="text-white/80 hover:text-white text-sm px-3 py-2 rounded-lg will-change-transform transition-[color,background-color,transform] duration-200 ease-in-out hover:bg-white/10 hover:scale-105"
            >
              Recursos
            </Link>
            <Link 
              to="/discover" 
              className="text-white/80 hover:text-white text-sm px-3 py-2 rounded-lg will-change-transform transition-[color,background-color,transform] duration-200 ease-in-out hover:bg-white/10 hover:scale-105"
            >
              Descobrir
            </Link>
            <Link 
              to="/premium" 
              className="text-white/80 hover:text-white text-sm px-3 py-2 rounded-lg will-change-transform transition-[color,background-color,transform] duration-200 ease-in-out hover:bg-white/10 hover:scale-105"
            >
              Premium
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!loading && (
              <>
                {user ? (
                  <Link to="/dashboard" className="flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      className="transform-gpu will-change-transform transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:opacity-95 hover:shadow-[0_14px_40px_-18px_hsl(var(--glow)/0.75)] active:translate-y-0 active:scale-[0.99]"
                    >
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className={`will-change-transform transition-transform duration-200 ease-in-out hover:scale-105 flex-shrink-0 ${isScrolled ? 'hidden' : ''}`}>
                      <Button variant="ghost" size="sm" className="text-white/80 hover:text-white transition-[color,background-color] duration-200 ease-in-out hover:bg-white/10">
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/register" className="will-change-transform transition-transform duration-200 ease-in-out hover:scale-105 flex-shrink-0">
                      <Button variant="default" size="sm" className="transition-[box-shadow] duration-200 ease-in-out hover:shadow-lg hover:shadow-primary/50">
                        Começar
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
