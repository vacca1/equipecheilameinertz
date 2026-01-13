import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Calendar, Users, DollarSign, FileText, Menu, X, LogOut, ChevronLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navigation = [
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Pacientes", href: "/patients", icon: Users },
  { name: "Caixa", href: "/cash-flow", icon: DollarSign },
  { name: "Relatórios", href: "/reports", icon: FileText },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { signOut } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex w-full">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300",
            sidebarCollapsed ? "w-[72px]" : "w-64"
          )}
        >
          {/* Logo Area */}
          <div className={cn(
            "flex items-center h-16 px-4 border-b border-sidebar-border",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            {!sidebarCollapsed && (
              <img src={logo} alt="Logo" className="h-9 object-contain" />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-200",
                sidebarCollapsed && "rotate-180"
              )} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navigation.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.href}
                    end
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground rounded-lg transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                    activeClassName="bg-sidebar-accent text-sidebar-primary"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </NavLink>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {/* User Section */}
          <div className={cn(
            "p-3 border-t border-sidebar-border",
            sidebarCollapsed ? "flex justify-center" : ""
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className={cn(
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    sidebarCollapsed ? "w-10 h-10 p-0" : "w-full justify-start gap-3"
                  )}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Sair</span>}
                </Button>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  Sair
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-full items-center justify-between px-4">
            <img src={logo} alt="Logo" className="h-8 object-contain" />
            <button
              className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 bg-card border-b border-border shadow-elevated animate-fade-in-up">
              <nav className="p-4 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground rounded-xl transition-all hover:bg-muted hover:text-foreground"
                    activeClassName="bg-primary/10 text-primary"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                ))}
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-3 px-4 py-3"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </Button>
              </nav>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 min-h-screen transition-all duration-300",
            "pt-16 md:pt-0",
            sidebarCollapsed ? "md:ml-[72px]" : "md:ml-64"
          )}
        >
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};
