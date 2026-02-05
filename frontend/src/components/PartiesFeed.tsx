import { useState, useRef, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { VideoCamera, Heart, ChatCircle, Share, Trash, PencilSimple, Play, MagnifyingGlass, MusicNotes, Upload, Plus, X, UserCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User, PoliticalParty } from '@/App'

export interface MusicTrack {
  id: string
  userId: string
  title: string
  audioUrl: string
  uploadedAt: string
  usedCount: number
}

export interface ReelVideo {
  id: string
  userId: string
  videoUrls: string[]
  caption: string
  timestamp: string
  likes: { userId: string; party: PoliticalParty }[]
  comments: { id: string; userId: string; content: string; timestamp: string }[]
  shares: number
  views: number
  musicTrackId?: string
}

interface PartiesFeedProps {
  user: User
}

export function PartiesFeed({ user }: PartiesFeedProps) {
  const [reels, setReels] = useKV<ReelVideo[]>('reels', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [musicTracks, setMusicTracks] = useKV<MusicTrack[]>('musicTracks', [])
  const [videoUrls, setVideoUrls] = useState<string[]>([''])
  const [caption, setCaption] = useState('')
  const [selectedMusicId, setSelectedMusicId] = useState<string>('')
  const [editingReel, setEditingReel] = useState<ReelVideo | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [commentingReel, setCommentingReel] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isMusicLibraryOpen, setIsMusicLibraryOpen] = useState(false)
  const [isMusicUploadOpen, setIsMusicUploadOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState<{ [reelId: string]: number }>({})
  const [newMusic, setNewMusic] = useState({ title: '', audioUrl: '' })
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showMusicDisclaimer, setShowMusicDisclaimer] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const addVideoUrlField = () => {
    if (videoUrls.length < 10) {
      setVideoUrls([...videoUrls, ''])
    } else {
      toast.error('Maximum 10 videos allowed per upload')
    }
  }

  const removeVideoUrlField = (index: number) => {
    const updated = videoUrls.filter((_, i) => i !== index)
    setVideoUrls(updated.length === 0 ? [''] : updated)
  }

  const updateVideoUrl = (index: number, value: string) => {
    const updated = [...videoUrls]
    updated[index] = value
    setVideoUrls(updated)
  }

  const uploadMusic = async () => {
    if (!newMusic.title.trim() || !newMusic.audioUrl.trim()) {
      toast.error('Please provide both title and audio URL')
      return
    }

    if (!agreedToTerms) {
      setShowMusicDisclaimer(true)
      return
    }

    const track: MusicTrack = {
      id: `music_${Date.now()}`,
      userId: user.id,
      title: newMusic.title,
      audioUrl: newMusic.audioUrl,
      uploadedAt: new Date().toISOString(),
      usedCount: 0
    }

    await setMusicTracks(prev => [...(prev || []), track])
    
    const updatedUser = {
      ...user,
      videoCount: (user.videoCount || 0) + 1
    }
    
    const updatedUsers = (users || []).map(u => 
      u.id === user.id ? updatedUser : u
    )
    await setUsers(updatedUsers)

    toast.success('Music track uploaded!')
    setNewMusic({ title: '', audioUrl: '' })
    setIsMusicUploadOpen(false)
    setAgreedToTerms(false)
  }

  const createReel = async () => {
    const validUrls = videoUrls.filter(url => url.trim() !== '')
    
    if (validUrls.length === 0) {
      toast.error('Please provide at least one video URL')
      return
    }

    const reel: ReelVideo = {
      id: `reel_${Date.now()}`,
      userId: user.id,
      videoUrls: validUrls,
      caption: caption,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
      shares: 0,
      views: Math.floor(Math.random() * 900) + 100,
      musicTrackId: selectedMusicId || undefined
    }

    await setReels(prevReels => [...(prevReels || []), reel])
    
    if (selectedMusicId) {
      await setMusicTracks(prev => 
        (prev || []).map(track => 
          track.id === selectedMusicId 
            ? { ...track, usedCount: track.usedCount + 1 } 
            : track
        )
      )
    }

    const updatedUser = {
      ...user,
      videoCount: (user.videoCount || 0) + validUrls.length
    }
    
    const updatedUsers = (users || []).map(u => 
      u.id === user.id ? updatedUser : u
    )
    await setUsers(updatedUsers)
    
    const autoEngagement = {
      likes: Math.floor(Math.random() * 900) + 100,
      shares: Math.floor(Math.random() * 50) + 10,
      views: Math.floor(Math.random() * 900) + 100
    }

    const allUsers = users || []
    const aiUsers = allUsers.filter(u => u.id !== user.id).slice(0, 3)
    
    setTimeout(async () => {
      await setReels(prevReels => 
        (prevReels || []).map(r => {
          if (r.id === reel.id) {
            const autoLikes = Array.from({ length: autoEngagement.likes }, (_, i) => ({
              userId: aiUsers[i % aiUsers.length]?.id || `ai_${i}`,
              party: user.party
            }))
            
            const aiComments = Array.from({ length: Math.min(5, aiUsers.length) }, (_, i) => ({
              id: `comment_${Date.now()}_${i}`,
              userId: aiUsers[i]?.id || `ai_${i}`,
              content: generatePositiveComment(),
              timestamp: new Date().toISOString()
            }))

            return {
              ...r,
              likes: [...r.likes, ...autoLikes],
              shares: r.shares + autoEngagement.shares,
              views: r.views + autoEngagement.views,
              comments: [...r.comments, ...aiComments]
            }
          }
          return r
        })
      )
    }, 2000)

    toast.success('Video uploaded! Engagement is rolling in!')
    setVideoUrls([''])
    setCaption('')
    setSelectedMusicId('')
    setIsUploadOpen(false)
  }

  const generatePositiveComment = () => {
    const comments = [
      'This is amazing! 🔥',
      'Love this perspective!',
      'Absolutely brilliant! 👏',
      'Finally, someone speaking truth!',
      'This needs to go viral!',
      'So well said! 💯',
      'Thank you for sharing this!',
      'Everyone needs to see this!',
      'Couldn\'t agree more!',
      'This is exactly what we need!'
    ]
    return comments[Math.floor(Math.random() * comments.length)]
  }

  const handleLike = async (reelId: string) => {
    await setReels(prevReels => 
      (prevReels || []).map(reel => {
        if (reel.id === reelId) {
          const hasLiked = reel.likes.some(like => like.userId === user.id)
          if (hasLiked) {
            return {
              ...reel,
              likes: reel.likes.filter(like => like.userId !== user.id)
            }
          } else {
            return {
              ...reel,
              likes: [...reel.likes, { userId: user.id, party: user.party }]
            }
          }
        }
        return reel
      })
    )
  }

  const handleShare = async (reelId: string) => {
    await setReels(prevReels =>
      (prevReels || []).map(reel =>
        reel.id === reelId ? { ...reel, shares: reel.shares + 1 } : reel
      )
    )
    toast.success('Video shared!')
  }

  const handleDelete = async (reelId: string) => {
    await setReels(prevReels => (prevReels || []).filter(r => r.id !== reelId))
    toast.success('Video deleted')
  }

  const handleEditSave = async () => {
    if (!editingReel) return

    await setReels(prevReels =>
      (prevReels || []).map(reel =>
        reel.id === editingReel.id ? { ...reel, caption: editCaption } : reel
      )
    )
    
    toast.success('Caption updated!')
    setEditingReel(null)
    setIsEditOpen(false)
  }

  const handleComment = async (reelId: string) => {
    if (!commentText.trim()) return

    const comment = {
      id: `comment_${Date.now()}`,
      userId: user.id,
      content: commentText,
      timestamp: new Date().toISOString()
    }

    await setReels(prevReels =>
      (prevReels || []).map(reel =>
        reel.id === reelId
          ? { ...reel, comments: [...reel.comments, comment] }
          : reel
      )
    )

    toast.success('Comment added!')
    setCommentText('')
    setCommentingReel(null)
  }

  const getUserById = (userId: string) => {
    return (users || []).find(u => u.id === userId)
  }

  const hasLiked = (reel: ReelVideo) => {
    return reel.likes.some(like => like.userId === user.id)
  }

  const getMusicTrack = (trackId?: string) => {
    if (!trackId) return null
    return (musicTracks || []).find(t => t.id === trackId)
  }

  const filteredReels = (reels || [])
    .filter(reel => {
      if (!searchQuery) return true
      const reelUser = getUserById(reel.userId)
      return reelUser?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
             reelUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollPosition = container.scrollTop
    const itemHeight = container.scrollHeight / filteredReels.length
    const newIndex = Math.round(scrollPosition / itemHeight)
    
    if (newIndex !== currentReelIndex && newIndex >= 0 && newIndex < filteredReels.length) {
      setCurrentReelIndex(newIndex)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <VideoCamera size={24} className="text-primary" />
              Parties - Political Videos
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={isMusicLibraryOpen} onOpenChange={setIsMusicLibraryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <MusicNotes />
                    Music Library
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Music Library</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => {
                        setIsMusicLibraryOpen(false)
                        setIsMusicUploadOpen(true)
                      }}
                      className="w-full gap-2"
                    >
                      <Upload />
                      Upload Your Music
                    </Button>
                    <Separator />
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {(musicTracks || []).length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No music tracks yet</p>
                        ) : (
                          (musicTracks || []).map(track => {
                            const trackUser = getUserById(track.userId)
                            return (
                              <Card key={track.id} className="p-4">
                                <div className="flex items-center gap-3">
                                  <MusicNotes size={32} className="text-primary" />
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{track.title}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span>by @{trackUser?.username || 'Unknown'}</span>
                                      <span>•</span>
                                      <span>{track.usedCount} uses</span>
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={async () => {
                                      const trackUserToFollow = getUserById(track.userId)
                                      if (trackUserToFollow && trackUserToFollow.id !== user.id) {
                                        const isFollowing = (user.following || []).includes(trackUserToFollow.id)
                                        if (!isFollowing) {
                                          const updatedUsers = (users || []).map(u => {
                                            if (u.id === user.id) {
                                              return { ...u, following: [...(u.following || []), trackUserToFollow.id] }
                                            }
                                            if (u.id === trackUserToFollow.id) {
                                              return { 
                                                ...u, 
                                                followers: [...(u.followers || []), user.id],
                                                followerCount: (u.followerCount || 0) + 1
                                              }
                                            }
                                            return u
                                          })
                                          await setUsers(updatedUsers)
                                          toast.success(`Following @${trackUserToFollow.username}`)
                                        } else {
                                          toast.info('Already following')
                                        }
                                      }
                                    }}
                                  >
                                    Follow
                                  </Button>
                                </div>
                              </Card>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <VideoCamera />
                    Upload Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Videos (Up to 10)</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 pr-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Video URLs ({videoUrls.filter(v => v.trim()).length}/10)</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={addVideoUrlField}
                            disabled={videoUrls.length >= 10}
                            className="gap-1"
                          >
                            <Plus size={16} />
                            Add Video
                          </Button>
                        </div>
                        {videoUrls.map((url, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={url}
                              onChange={(e) => updateVideoUrl(index, e.target.value)}
                              placeholder={`Video URL ${index + 1}`}
                            />
                            {videoUrls.length > 1 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeVideoUrlField(index)}
                              >
                                <X size={18} />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="caption">Caption</Label>
                        <Textarea
                          id="caption"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Write a caption..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="music">Background Music (Optional)</Label>
                        <select
                          id="music"
                          value={selectedMusicId}
                          onChange={(e) => setSelectedMusicId(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">No music</option>
                          {(musicTracks || []).map(track => (
                            <option key={track.id} value={track.id}>
                              {track.title} - @{getUserById(track.userId)?.username}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button onClick={createReel} className="w-full">
                        Upload Videos
                      </Button>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos by username..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isMusicUploadOpen} onOpenChange={setIsMusicUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Music Track</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!agreedToTerms && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg space-y-3">
                <h3 className="font-bold text-yellow-900">⚠️ Copyright Disclaimer</h3>
                <p className="text-sm text-yellow-800">
                  By uploading music to this platform, you confirm that:
                </p>
                <ul className="text-sm text-yellow-800 list-disc pl-5 space-y-1">
                  <li>You own all rights to this music track</li>
                  <li>You have permission to share this music publicly</li>
                  <li>You authorize other users to use this music in their videos</li>
                  <li>You hold the website and platform harmless from any copyright claims</li>
                  <li>The platform is not liable for any content posted using your music</li>
                </ul>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="agree-terms" className="text-sm font-semibold text-yellow-900">
                    I agree to these terms and own the rights to this music
                  </label>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="musicTitle">Track Title</Label>
              <Input
                id="musicTitle"
                value={newMusic.title}
                onChange={(e) => setNewMusic(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My Political Anthem"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="musicUrl">Audio URL</Label>
              <Input
                id="musicUrl"
                value={newMusic.audioUrl}
                onChange={(e) => setNewMusic(prev => ({ ...prev, audioUrl: e.target.value }))}
                placeholder="https://example.com/audio.mp3"
              />
            </div>
            <Button 
              onClick={uploadMusic} 
              className="w-full"
              disabled={!agreedToTerms}
            >
              Upload Music Track
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {filteredReels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <VideoCamera size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No videos found' : 'No Videos Yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search' : 'Be the first to share your political perspective!'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
                <VideoCamera />
                Upload Your First Video
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-[calc(100vh-250px)] overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          {filteredReels.map((reel, reelIndex) => {
            const reelUser = getUserById(reel.userId)
            if (!reelUser) return null

            const musicTrack = getMusicTrack(reel.musicTrackId)
            const musicUser = musicTrack ? getUserById(musicTrack.userId) : null
            const vidIndex = currentVideoIndex[reel.id] || 0

            return (
              <div key={reel.id} className="snap-start mb-6">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-[9/16] bg-black max-h-[600px] group">
                      <video
                        src={reel.videoUrls[vidIndex]}
                        className="w-full h-full object-contain"
                        controls
                        preload="metadata"
                        loop
                      />
                      {reel.videoUrls.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-full">
                          {reel.videoUrls.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentVideoIndex(prev => ({ ...prev, [reel.id]: i }))}
                              className={`w-2 h-2 rounded-full transition-all ${
                                i === vidIndex ? 'bg-white w-6' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={32} className="text-white drop-shadow-lg" />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={reelUser.avatar} />
                          <AvatarFallback>
                            {reelUser.displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold">@{reelUser.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(reel.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {reelUser.party}
                        </Badge>
                      </div>

                      {reel.caption && (
                        <p className="text-sm">{reel.caption}</p>
                      )}

                      {musicTrack && musicUser && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <MusicNotes size={20} className="text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{musicTrack.title}</p>
                            <p className="text-xs text-muted-foreground">by @{musicUser.username}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{reel.views.toLocaleString()} views</span>
                        {reel.videoUrls.length > 1 && (
                          <span>{vidIndex + 1}/{reel.videoUrls.length} videos</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant={hasLiked(reel) ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleLike(reel.id)}
                          className="flex-1 gap-2"
                        >
                          <Heart size={18} weight={hasLiked(reel) ? "fill" : "regular"} />
                          {reel.likes.length}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCommentingReel(commentingReel === reel.id ? null : reel.id)}
                          className="flex-1 gap-2"
                        >
                          <ChatCircle size={18} />
                          {reel.comments.length}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(reel.id)}
                          className="flex-1 gap-2"
                        >
                          <Share size={18} />
                          {reel.shares}
                        </Button>

                        {reel.userId === user.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingReel(reel)
                                setEditCaption(reel.caption)
                                setIsEditOpen(true)
                              }}
                            >
                              <PencilSimple size={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reel.id)}
                            >
                              <Trash size={18} className="text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>

                      {commentingReel === reel.id && (
                        <div className="space-y-3 pt-3 border-t">
                          <div className="space-y-2">
                            {reel.comments.slice(-5).map(comment => {
                              const commentUser = getUserById(comment.userId)
                              return (
                                <div key={comment.id} className="flex gap-2 text-sm">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={commentUser?.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {commentUser?.username[0] || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <span className="font-semibold">@{commentUser?.username || 'Unknown'}</span>
                                    <span className="ml-2">{comment.content}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a comment..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleComment(reel.id)
                                }
                              }}
                            />
                            <Button onClick={() => handleComment(reel.id)}>
                              Post
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows={3}
            />
            <Button onClick={handleEditSave} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
