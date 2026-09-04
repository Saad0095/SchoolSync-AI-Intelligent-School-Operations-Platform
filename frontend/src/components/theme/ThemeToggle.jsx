import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full w-9 h-9"
    >
      {theme === "light" ? (
        <Sun className="h-5 w-5 text-warning transition-all" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-primary transition-all" aria-hidden="true" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
