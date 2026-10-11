"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  X,
  TrendingUp,
  Target,
  UserCheck,
  Users,
  Crown,
  Megaphone,
  Sparkles,
  ArrowUpRight,
  Shield,
  Loader2,
  Activity
} from "lucide-react";

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  onOpenPremiumModal?: () => void;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  onUnreadCountChange,
  onOpenPremiumModal,
}: NotificationPanelProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications whenever panel opens
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/notifications?_t=${Date.now()}`);
      const data: NotificationItem[] = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      const unread = data.filter((n) => !n.isRead).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen) return;
      const target = e.target as HTMLElement;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !target.closest("#notification-bell-btn")
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      const newUnread = notifications.filter((n) => n.id !== id && !n.isRead).length;
      if (onUnreadCountChange) onUnreadCountChange(newUnread);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await api.put(`/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        const unread = next.filter((n) => !n.isRead).length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
        return next;
      });
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      setActionLoading(true);
      await api.delete(`/notifications/clear-all`);
      setNotifications([]);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    onClose();

    if (item.link === "#premium" || item.link === "/subscription" || item.type === "SUBSCRIPTION") {
      if (onOpenPremiumModal) {
        onOpenPremiumModal();
      } else {
        router.push("/profile");
      }
      return;
    }

    if (item.link && item.link.startsWith("/")) {
      router.push(item.link);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ASSESSMENT_SAVED":
        return <Target className="w-4 h-4 text-[#D4AF37]" />;
      case "SCORE_CHANGE":
        return <TrendingUp className="w-4 h-4 text-[#F5BA4E]" />;
      case "PLAYER_UPDATE":
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case "TEAM_UPDATE":
        return <Shield className="w-4 h-4 text-cyan-400" />;
      case "SUBSCRIPTION":
        return <Crown className="w-4 h-4 text-[#D4AF37]" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="w-4 h-4 text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-[#D4AF37]" />;
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "ASSESSMENT_SAVED":
        return "bg-[#D4AF37]/15 text-[#F5BA4E] border-[#D4AF37]/30";
      case "SCORE_CHANGE":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "PLAYER_UPDATE":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "TEAM_UPDATE":
        return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
      case "SUBSCRIPTION":
        return "bg-gradient-to-r from-[#D4AF37]/20 to-amber-500/20 text-[#D4AF37] border-[#D4AF37]/40";
      case "ANNOUNCEMENT":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      default:
        return "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ASSESSMENT_SAVED":
        return "Assessment";
      case "SCORE_CHANGE":
        return "Score Alert";
      case "PLAYER_UPDATE":
        return "Player";
      case "TEAM_UPDATE":
        return "Squad";
      case "SUBSCRIPTION":
        return "Premium";
      case "ANNOUNCEMENT":
        return "Platform";
      default:
        return "Update";
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.isRead : true
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
        onClick={onClose}
      />

      {/* Main Notification Panel Container */}
      <div
        ref={panelRef}
        id="cpi-notification-panel"
        className="fixed inset-x-3 top-16 sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[420px] max-h-[85vh] sm:max-h-[600px] bg-[#12141D] border border-[#D4AF37]/30 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Panel Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/8 bg-[#181B27]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Bell className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide uppercase">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D4AF37] text-[#090A0E] tracking-wider uppercase shadow-xs">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#9CA3AF] font-medium">
                Live CPI performance & squad activity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#D4AF37] hover:bg-white/5 transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Mark all as read"
                id="notif-mark-all-read-btn"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] font-bold">Read All</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={actionLoading}
                className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                title="Clear all notifications"
                id="notif-clear-all-btn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors cursor-pointer ml-1"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar (All / Unread) */}
        <div className="px-3.5 py-2 border-b border-white/5 bg-[#141622]/60 flex items-center justify-between shrink-0">
          <div className="inline-flex p-1 rounded-xl bg-[#090A0E] border border-white/8 gap-1">
            <button
              onClick={() => setFilter("all")}
              id="notif-filter-all"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[#D4AF37] text-[#090A0E] shadow-sm"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              id="notif-filter-unread"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === "unread"
                  ? "bg-[#D4AF37] text-[#090A0E] shadow-sm"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filter === "unread"
                      ? "bg-[#090A0E] text-[#D4AF37]"
                      : "bg-[#D4AF37]/20 text-[#D4AF37]"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] text-[#6B7280] font-semibold">
            {filteredNotifications.length} {filteredNotifications.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Notification List Body */}
        <div className="overflow-y-auto flex-1 divide-y divide-white/5 overscroll-contain">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#9CA3AF]">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
              <span className="text-xs font-bold tracking-wide">Syncing notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Clean Empty State */
            <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-3 select-none">
              <div className="w-14 h-14 rounded-full bg-[#181B27] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-inner shadow-[#D4AF37]/10">
                <BellOff className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  {filter === "unread" ? "No unread notifications" : "All caught up!"}
                </p>
                <p className="text-xs text-[#9CA3AF] max-w-xs leading-relaxed">
                  {filter === "unread"
                    ? "You have reviewed all current alerts. Switch to 'All' to view older activity."
                    : "No notifications right now. Activity from assessments, rating changes, and squad updates will appear here."}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3.5 sm:p-4 transition-all duration-150 cursor-pointer flex items-start gap-3 relative group ${
                  item.isRead
                    ? "bg-transparent hover:bg-white/[0.03]"
                    : "bg-[#D4AF37]/[0.05] hover:bg-[#D4AF37]/[0.08]"
                }`}
              >
                {/* Unread indicator dot */}
                {!item.isRead && (
                  <div className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-xs shadow-[#D4AF37]" />
                )}

                {/* Type Icon Container */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    item.isRead
                      ? "bg-[#181B27] border-white/8 text-[#9CA3AF]"
                      : "bg-[#1B1E2C] border-[#D4AF37]/30 text-[#D4AF37]"
                  }`}
                >
                  {getTypeIcon(item.type)}
                </div>

                {/* Notification Text & Meta */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTypeBadgeStyle(
                        item.type
                      )}`}
                    >
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="text-[10px] text-[#6B7280] font-medium ml-auto">
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>

                  <h4
                    className={`text-xs leading-snug truncate ${
                      item.isRead ? "font-semibold text-slate-200" : "font-extrabold text-white"
                    }`}
                  >
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed mt-1 line-clamp-2">
                    {item.message}
                  </p>

                  {/* Deep link affordance */}
                  {item.link && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-[#D4AF37] hover:underline">
                      <span>View details</span>
                      <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Hover Quick Actions */}
                <div className="flex flex-col items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      className="p-1 rounded-md text-[#9CA3AF] hover:text-[#D4AF37] hover:bg-white/10 transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1 rounded-md text-[#9CA3AF] hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-3 border-t border-white/5 bg-[#141622]/80 flex items-center justify-between text-[11px] text-[#6B7280] font-medium shrink-0">
          <span>CPI Coach Alert System</span>
          <button
            onClick={() => {
              if (onOpenPremiumModal) onOpenPremiumModal();
              else router.push("/profile");
              onClose();
            }}
            className="text-[#D4AF37] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Crown className="w-3 h-3" />
            <span>Manage Plan</span>
          </button>
        </div>
      </div>
    </>
  );
}
