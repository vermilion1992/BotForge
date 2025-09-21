"use client";
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, TrendingUp, BarChart3, Users, Bot, MessageCircle, Grid3X3 } from "lucide-react";
import Link from "next/link";

interface LoveableLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export function LoveableLayout({ children, currentPath = "/strategy-builder" }: LoveableLayoutProps) {
  const navItems = [
    { href: "/", icon: Grid3X3, label: "Dashboard" },
    { href: "/strategy-builder", icon: Settings, label: "Strategy Builder" },
    { href: "/bot-community", icon: Users, label: "Bot Community" },
    { href: "/my-bots", icon: Bot, label: "My Bots" },
    { href: "/ai-chat", icon: MessageCircle, label: "AI Chat" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-card border-r border-border/50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">&lt;/&gt;</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">BOT FORGE</h1>
              <p className="text-xs text-muted-foreground">TRADING BOTS, BUILT YOUR WAY</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback>BF</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Bot Forge User</p>
              <p className="text-xs text-muted-foreground">Expert Tier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-14 border-b border-border/50 bg-card/30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Strategy Builder</h2>
            <Badge variant="outline">Expert Tier</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              M Invite
            </Button>
            <Button size="sm">
              Publish
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}




