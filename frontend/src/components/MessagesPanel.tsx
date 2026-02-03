import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ChatCircle, PaperPlaneTilt, UserPlus } from '@phosphor-icons/react'
import type { User } from '@/App'
import { toast } from 'sonner'

interface Message {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  timestamp: string
}

interface MessagesPanel {
  user: User
}

export function MessagesPanel({ user }: MessagesPanel) {
  const [messages] = useKV<Message[]>('messages', [])
  const [users] = useKV<User[]>('users', [])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  const conversations = (users || [])
    .filter(u => u.id !== user.id && user.friends.includes(u.id))
    .map(friend => {
      const conversationMessages = (messages || []).filter(m => 
        (m.fromUserId === user.id && m.toUserId === friend.id) ||
        (m.fromUserId === friend.id && m.toUserId === user.id)
      )
      const lastMessage = conversationMessages[conversationMessages.length - 1]
      return {
        friend,
        lastMessage,
        messageCount: conversationMessages.length
      }
    })

  const selectedUser = users?.find(u => u.id === selectedConversation)
  const conversationMessages = selectedConversation 
    ? (messages || []).filter(m => 
        (m.fromUserId === user.id && m.toUserId === selectedConversation) ||
        (m.fromUserId === selectedConversation && m.toUserId === user.id)
      )
    : []

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: `message_${Date.now()}`,
      fromUserId: user.id,
      toUserId: selectedConversation,
      content: newMessage,
      timestamp: new Date().toISOString()
    }

    // In a real app, this would update the messages array
    setNewMessage('')
    toast.success('Message sent!')
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