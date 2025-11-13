import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Calendar, Users, DollarSign, FileText, Menu, X, Bot } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Agenda", href: "/", icon: Calendar },
  { name: "Pacientes", href: "/patients", icon: Users },
  { name: "Caixa", href: "/cash-flow", icon: DollarSign },
  { name: "Relatórios", href: "/reports", icon: FileText },
  { name: "Agente IA", href: "/ai-agent", icon: Bot },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Equipe Cheila Meinertz" className="h-10 object-contain" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground rounded-xl transition-all hover:bg-muted hover:text-foreground"
                activeClassName="bg-primary text-primary-foreground shadow-soft hover:bg-primary hover:text-primary-foreground"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="container py-4 px-4 flex flex-col gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground rounded-xl transition-all hover:bg-muted hover:text-foreground"
                  activeClassName="bg-primary text-primary-foreground shadow-soft"
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6 px-4">
        {children}
      </main>
    </div>
  );
};
