import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="vye"
              className="h-7 w-7 rounded-lg object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
              draggable={false}
            />
            <span className="text-foreground font-medium">
              vye<span className="text-muted-foreground">.bio</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </Link>
            <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
              Descobrir
            </Link>
            <Link to="/premium" className="text-muted-foreground hover:text-foreground transition-colors">
              Premium
            </Link>
            <a 
              href="https://discord.gg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Discord
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
