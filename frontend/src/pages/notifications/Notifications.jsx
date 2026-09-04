import React, { useState, useEffect, useMemo } from "react";
import { Bell, Check, ExternalLink, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/utils/api";
import { getSocket } from "@/utils/socket";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = notifications;
    if (readFilter === "unread") list = list.filter((n) => !n.isRead);
    else if (readFilter === "read") list = list.filter((n) => n.isRead);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notifications, readFilter, search]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || res || []);
    } catch (error) {
      console.error("Failed to fetch notifications");
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications((prev) => {
          if (prev.find((n) => n._id === notification._id)) return prev;
          return [notification, ...prev];
        });
      };

      socket.on("notification:new", handleNewNotification);

      return () => {
        socket.off("notification:new", handleNewNotification);
      };
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with the latest announcements and alerts."
      />

      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/30 px-6 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>View all your recent notifications</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
                disabled={loading || notifications.every((n) => n.isRead)}
              >
                <Check size={16} aria-hidden="true" />
                Mark all read
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search notifications..."
                  aria-label="Search notifications"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              {(readFilter !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => { setReadFilter("all"); setSearch(""); }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Bell}
                title={notifications.length === 0 ? "No notifications" : "No matching notifications"}
                description={
                  notifications.length === 0
                    ? "You're all caught up — new announcements and alerts will appear here."
                    : "No notifications match your current search or filters."
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((notification) => (
                <div
                  key={notification._id}
                  role={!notification.isRead ? "button" : undefined}
                  tabIndex={!notification.isRead ? 0 : undefined}
                  aria-label={!notification.isRead ? `Mark "${notification.title}" as read` : undefined}
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                  onKeyDown={(e) => {
                    if (!notification.isRead && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      markAsRead(notification._id);
                    }
                  }}
                  className={`p-6 transition-colors ${
                    !notification.isRead
                      ? "cursor-pointer bg-primary/5 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-base font-medium ${!notification.isRead ? "text-primary" : "text-foreground"}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                    {notification.message}
                  </p>

                  {notification.link && (
                    <div className="flex justify-end">
                      <Button asChild variant="secondary" size="sm" className="gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link to={notification.link}>
                          View Details <ExternalLink size={14} aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
