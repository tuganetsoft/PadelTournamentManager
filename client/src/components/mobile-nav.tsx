import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Calendar, 
  MoreHorizontal 
} from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="lg:hidden bg-white border-t border-neutral-light fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a className="flex flex-col items-center py-2 px-1">
            <LayoutDashboard className={`h-5 w-5 ${isActive("/") ? "text-primary" : "text-neutral-dark"}`} />
            <span className={`text-xs font-medium ${isActive("/") ? "text-primary" : "text-neutral-dark"}`}>
              Dashboard
            </span>
          </a>
        </Link>
        
        <Link href="/tournaments">
          <a className="flex flex-col items-center py-2 px-1">
            <Trophy className={`h-5 w-5 ${isActive("/tournaments") ? "text-primary" : "text-neutral-dark"}`} />
            <span className={`text-xs font-medium ${isActive("/tournaments") ? "text-primary" : "text-neutral-dark"}`}>
              Tournaments
            </span>
          </a>
        </Link>
        
        <Link href="/participants">
          <a className="flex flex-col items-center py-2 px-1">
            <Users className={`h-5 w-5 ${isActive("/participants") ? "text-primary" : "text-neutral-dark"}`} />
            <span className={`text-xs font-medium ${isActive("/participants") ? "text-primary" : "text-neutral-dark"}`}>
              Participants
            </span>
          </a>
        </Link>
        
        <Link href="/calendar">
          <a className="flex flex-col items-center py-2 px-1">
            <Calendar className={`h-5 w-5 ${isActive("/calendar") ? "text-primary" : "text-neutral-dark"}`} />
            <span className={`text-xs font-medium ${isActive("/calendar") ? "text-primary" : "text-neutral-dark"}`}>
              Calendar
            </span>
          </a>
        </Link>
        
        <Link href="#more">
          <a className="flex flex-col items-center py-2 px-1">
            <MoreHorizontal className="h-5 w-5 text-neutral-dark" />
            <span className="text-xs font-medium text-neutral-dark">More</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
