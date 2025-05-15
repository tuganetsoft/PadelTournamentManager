import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Calendar, 
  MapPin,
  Settings
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="hidden lg:block lg:w-64 bg-white border-r border-neutral-light">
      <nav className="mt-5 px-2">
        <Link href="/">
          <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md 
            ${isActive("/") 
              ? "bg-primary bg-opacity-10 text-primary" 
              : "text-neutral-dark hover:bg-primary hover:bg-opacity-10 hover:text-primary"
            }`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </a>
        </Link>
        
        <Link href="/tournaments">
          <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mt-1
            ${isActive("/tournaments") 
              ? "bg-primary bg-opacity-10 text-primary" 
              : "text-neutral-dark hover:bg-primary hover:bg-opacity-10 hover:text-primary"
            }`}
          >
            <Trophy className="mr-3 h-5 w-5" />
            My Tournaments
          </a>
        </Link>
        
        <Link href="/participants">
          <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mt-1
            ${isActive("/participants") 
              ? "bg-primary bg-opacity-10 text-primary" 
              : "text-neutral-dark hover:bg-primary hover:bg-opacity-10 hover:text-primary"
            }`}
          >
            <Users className="mr-3 h-5 w-5" />
            Participants
          </a>
        </Link>
        
        <Link href="/calendar">
          <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mt-1
            ${isActive("/calendar") 
              ? "bg-primary bg-opacity-10 text-primary" 
              : "text-neutral-dark hover:bg-primary hover:bg-opacity-10 hover:text-primary"
            }`}
          >
            <Calendar className="mr-3 h-5 w-5" />
            Calendar
          </a>
        </Link>
        
        <Link href="/venues">
          <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mt-1
            ${isActive("/venues") 
              ? "bg-primary bg-opacity-10 text-primary" 
              : "text-neutral-dark hover:bg-primary hover:bg-opacity-10 hover:text-primary"
            }`}
          >
            <MapPin className="mr-3 h-5 w-5" />
            Venues
          </a>
        </Link>
        
        <Link href="/settings">
          <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mt-1
            ${isActive("/settings") 
              ? "bg-primary bg-opacity-10 text-primary" 
              : "text-neutral-dark hover:bg-primary hover:bg-opacity-10 hover:text-primary"
            }`}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </a>
        </Link>
      </nav>
    </div>
  );
}
