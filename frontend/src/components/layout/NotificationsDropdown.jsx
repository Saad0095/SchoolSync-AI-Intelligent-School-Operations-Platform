import React, { useState, useEffect } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";
import { getSocket } from "@/utils/socket";

const NotificationsDropdown = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      // Use 'triangle' or 'square' for a sharper, louder sound than 'sine'
      oscillator.type = 'triangle'; 
      // Higher frequencies cut through better. Start at 1000Hz (C6 approx)
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.6);
      
      // Increase gain to 1.0 for maximum browser volume without clipping
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.6);
    } catch(e) {
      console.log("Audio play blocked - User interaction required first", e);
    }
  };

  const getBasePath = () => {
    if (user?.role === 'student') return '/student';
    if (user?.role === 'teacher') return '/teacher';
    return '/admin';
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    let pollInterval;

    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications((prev) => {
          if (prev.find(n => n._id === notification._id)) return prev;
          return [notification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        setIsShaking(true);
        playNotificationSound();
        setTimeout(() => setIsShaking(false), 1000);
      };

      socket.on("notification:new", handleNewNotification);

      // Polling Fallback logic
      const setupPolling = () => {
        if (!socket.connected) {
          pollInterval = setInterval(fetchNotifications, 30000); // 30s fallback polling
        } else {
          clearInterval(pollInterval);
        }
      };
      
      setupPolling(); // initial check
      socket.on("connect", setupPolling);
      socket.on("disconnect", setupPolling);

      return () => {
        socket.off("notification:new", handleNewNotification);
        socket.off("connect", setupPolling);
        socket.off("disconnect", setupPolling);
        clearInterval(pollInterval);
      };
    } else {
      // If socket isn't initialized yet, just use polling
      pollInterval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(pollInterval);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
      toast.error("Could not mark the notification as read. Please try again.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Could not mark notifications as read. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className={`w-5 h-5 text-muted-foreground ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-card animate-pulse" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-2 sticky top-0 bg-popover z-10 shadow-sm">
          <DropdownMenuLabel className="font-semibold px-0 py-0 text-base">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto py-1 px-2 text-xs text-primary">
              Mark all read
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" aria-hidden="true" />
            No new notifications
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`mb-1 rounded-md ${!notification.isRead ? 'bg-primary/5' : ''}`}
              >
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification._id);
                    if (notification.link) {
                      navigate(notification.link);
                    } else {
                      navigate(`${getBasePath()}/notifications`);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-semibold text-foreground line-clamp-1">{notification.title}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                </button>
                {notification.link && (
                  <Link
                    to={notification.link}
                    className="mx-3 mb-2 flex items-center text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
                  >
                    View Details <ExternalLink className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="p-2 mt-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button variant="outline" className="w-full text-xs" onClick={() => navigate(`${getBasePath()}/notifications`)}>
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
