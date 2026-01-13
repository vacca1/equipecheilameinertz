import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Calendar, Users, DollarSign, FileText, Menu, X, LogOut, ChevronLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

          {/* Logout Button with Theme Toggle */}
          <div className={cn(
            "p-3 border-t border-sidebar-border",
            sidebarCollapsed ? "flex flex-col items-center gap-3" : ""
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center",
                  sidebarCollapsed ? "flex-col gap-3" : "justify-between"
                )}>
                  <Button
                    variant="ghost"
                    onClick={signOut}
                    className={cn(
                      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      sidebarCollapsed ? "w-10 h-10 p-0" : "justify-start gap-3"
                    )}
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>Sair</span>}
                  </Button>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  Sair
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Mobile Header - Compact */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-full items-center justify-between px-4">
            <img src={logo} alt="Logo" className="h-7 object-contain" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-9 w-9"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
          <div className="flex justify-around items-center h-16">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] text-muted-foreground transition-colors"
                activeClassName="text-primary"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 min-h-screen transition-all duration-300",
            "pt-14 pb-20 md:pt-0 md:pb-0", // Mobile: header + bottom nav padding
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
