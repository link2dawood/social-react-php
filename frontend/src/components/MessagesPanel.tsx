import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatCircle, PaperPlaneTilt, UserPlus, Users, Star, StarFour } from '@phosphor-icons/react'
import type { User } from '@/App'
import { toast } from 'sonner'

interface Message {
  id: string
  fromUserId: string
  toUserId?: string
  groupId?: string
  content: string
  timestamp: string
}

interface GroupChat {
  id: string
  name: string
  createdBy: string
  members: string[]
  createdAt: string
}

interface MessagesPanel {
  user: User
}

export function MessagesPanel({ user }: MessagesPanel) {
  const [messages, setMessages] = useKV<Message[]>('messages', [])
  const [users] = useKV<User[]>('users', [])
  const [groups, setGroups] = useKV<GroupChat[]>('groupChats', [])
  const [favoriteContacts, setFavoriteContacts] = useKV<string[]>(`favoriteContacts_${user.id}`, [])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'groups'>('all')

  const friends = (users || []).filter(u => u.id !== user.id && user.friends.includes(u.id))
  
  const conversations = friends.map(friend => {
    const conversationMessages = (messages || []).filter(m => 
      (m.fromUserId === user.id && m.toUserId === friend.id) ||
      (m.fromUserId === friend.id && m.toUserId === user.id)
    )
    const lastMessage = conversationMessages[conversationMessages.length - 1]
    return {
      friend,
      lastMessage,
      messageCount: conversationMessages.length,
      isFavorite: (favoriteContacts || []).includes(friend.id)
    }
  })

  const favoriteConversations = conversations.filter(c => c.isFavorite)
  const userGroups = (groups || []).filter(g => g.members.includes(user.id))

  const selectedUser = users?.find(u => u.id === selectedConversation)
  const selectedGroupData = groups?.find(g => g.id === selectedGroup)
  
  const conversationMessages = selectedConversation 
    ? (messages || []).filter(m => 
        (m.fromUserId === user.id && m.toUserId === selectedConversation) ||
        (m.fromUserId === selectedConversation && m.toUserId === user.id)
      )
    : selectedGroup
    ? (messages || []).filter(m => m.groupId === selectedGroup)
    : []

  const toggleFavorite = (userId: string) => {
    setFavoriteContacts(current => {
      const currentContacts = current || []
      if (currentContacts.includes(userId)) {
        return currentContacts.filter(id => id !== userId)
      }
      return [...currentContacts, userId]
    })
    toast.success((favoriteContacts || []).includes(userId) ? 'Removed from favorites' : 'Added to favorites')
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || (!selectedConversation && !selectedGroup)) return

    const message: Message = {
      id: `message_${Date.now()}`,
      fromUserId: user.id,
      toUserId: selectedConversation || undefined,
      groupId: selectedGroup || undefined,
      content: newMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(current => [...(current || []), message])
    setNewMessage('')
    toast.success('Message sent!')
  }

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      toast.error('Please enter a group name and select members')
      return
    }

    const newGroup: GroupChat = {
      id: `group_${Date.now()}`,
      name: newGroupName,
      createdBy: user.id,
      members: [user.id, ...selectedMembers],
      createdAt: new Date().toISOString()
    }

    setGroups(current => [...(current || []), newGroup])
    setShowNewGroupDialog(false)
    setNewGroupName('')
    setSelectedMembers([])
    toast.success(`Group "${newGroupName}" created!`)
  }

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(current => 
      current.includes(userId) 
        ? current.filter(id => id !== userId)
        : [...current, userId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChatCircle size={24} />
            Messages
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Private conversations with your political network
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Button size="sm" variant="outline">
                  <UserPlus size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <ChatCircle size={32} className="mx-auto mb-2 opacity-50" />
                  No conversations yet
                  <div className="text-xs mt-1">
                    Add friends to start messaging
                  </div>
                </div>
              ) : (
                conversations.map(({ friend, lastMessage }) => {
                  const partyColor = {
                    democrat: 'bg-democrat text-democrat-foreground',
                    republican: 'bg-republican text-republican-foreground',
                    independent: 'bg-independent text-independent-foreground'
                  }[friend.party]

                  const isSelected = selectedConversation === friend.id

                  return (
                    <div
                      key={friend.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedConversation(friend.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="text-sm">
                            {friend.displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{friend.displayName}</span>
                            <Badge className={`${partyColor} text-xs`}>
                              {friend.party}
                            </Badge>
                          </div>
                          {lastMessage && (
                            <div className="text-xs text-muted-foreground truncate">
                              {lastMessage.content}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message View */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            {selectedUser ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback className="text-sm">
                        {selectedUser.displayName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedUser.displayName}</div>
                      <div className="text-sm text-muted-foreground">@{selectedUser.username}</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {conversationMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <ChatCircle size={32} className="mx-auto mb-2 opacity-50" />
                        Start a conversation with {selectedUser.displayName}
                      </div>
                    ) : (
                      conversationMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.fromUserId === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.fromUserId === user.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className="text-xs opacity-70 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <PaperPlaneTilt size={16} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ChatCircle size={48} className="mx-auto mb-4 opacity-50" />
                  Select a conversation to start messaging
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}