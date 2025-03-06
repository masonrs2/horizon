import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore, applyTheme } from "@/store/themeStore";
import { useEffect } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  
  // Apply theme when component mounts and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full w-9 h-9 hover:bg-accent/10 transition-colors duration-200"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-orange-500" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-sky-400" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 