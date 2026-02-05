import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Heart, ChatCircle, CurrencyDollar, UserPlus, X } from '@phosphor-icons/react'
import type { User } from '@/App'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'tip' | 'follow' | 'mention'
  fromUserId: string
  fromUsername: string
  fromAvatar?: string
  postId?: string
  content?: string
  amount?: number
  timestamp: string
  read: boolean
}

interface NotificationsPanelProps {
  user: User
}

export function NotificationsPanel({ user }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useKV<Notification[]>('notifications', [])
  const [isOpen, setIsOpen] = useState(false)

  const userNotifications = (notifications || [])
    .filter(notif => notif.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const unreadCount = userNotifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(currentNotifs => 
      (currentNotifs || []).map(notif => 
        notif.userId === user.id ? { ...notif, read: true } : notif
      )
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(currentNotifs => 
      (currentNotifs || []).filter(notif => notif.id !== id)
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} weight="fill" className="text-red-500" />
      case 'comment':
        return <ChatCircle size={20} weight="fill" className="text-blue-500" />
      case 'tip':
        return <CurrencyDollar size={20} weight="fill" className="text-accent" />
      case 'follow':
        return <UserPlus size={20} weight="fill" className="text-green-500" />
      default:
        return <Bell size={20} />
    }
  }

  const getNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case 'like':
        return 'liked your post'
      case 'comment':
        return `commented: "${notif.content}"`
      case 'tip':
        return `tipped you $${notif.amount}`
      case 'follow':
        return 'started following you'
      case 'mention':
        return `mentioned you: "${notif.content}"`
      default:
        return 'interacted with your content'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diff = now.getTime() - then.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return then.toLocaleDateString()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={24} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {userNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={48} className="text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No notifications yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When people interact with your posts, you'll see it here
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {userNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors ${
                        !notif.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={notif.fromAvatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {notif.fromUsername.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-semibold">@{notif.fromUsername}</span>{' '}
                              <span className="text-muted-foreground">
                                {getNotificationText(notif)}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(notif.timestamp)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notif.type)}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteNotification(notif.id)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
