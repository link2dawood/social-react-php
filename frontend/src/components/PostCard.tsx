import { useState, useRef } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import type { Notification } from '@/components/NotificationsPanel'
import { 
  Heart, 
  Building, 
  Scales, 
  ChatCircle, 
  Share, 
  DotsThree,
  CurrencyDollar,
  Hash,
  Trash,
  Copy,
  UserPlus,
  UserMinus,
  Warning,
  VideoCamera,
  X
} from '@phosphor-icons/react'
import type { User, Post } from '@/App'
import { toast } from 'sonner'

interface PostCardProps {
  post: Post
  currentUser: User
  onHashtagClick?: (hashtag: string) => void
}

export function PostCard({ post, currentUser, onHashtagClick }: PostCardProps) {
  const [posts, setPosts] = useKV<Post[]>('posts', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [notifications, setNotifications] = useKV<Notification[]>('notifications', [])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportProofVideo, setReportProofVideo] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const postUser = users?.find(u => u.id === post.userId)
  const hasLiked = post.likes.some(like => like.userId === currentUser.id)
  const isFollowing = currentUser.following.includes(post.userId)
  const isOwnPost = post.userId === currentUser.id
  
  const PartyIcon = {
    democrat: Heart,
    republican: Building,
    independent: Scales
  }[post.party]

  const partyColor = {
    democrat: 'text-democrat',
    republican: 'text-republican',
    independent: 'text-independent'
  }[post.party]

  const handleLike = async () => {
    const updatedPosts = posts?.map(p => {
      if (p.id === post.id) {
        if (hasLiked) {
          return {
            ...p,
            likes: p.likes.filter(like => like.userId !== currentUser.id)
          }
        } else {
          const followerBoost = Math.floor((currentUser.followerCount || 0) / 1000) + 1
          const likesToAdd = Math.min(followerBoost, 10)
          
          const newLikes = [{ userId: currentUser.id, party: currentUser.party }]
          
          for (let i = 1; i < likesToAdd; i++) {
            newLikes.push({ 
              userId: `boost_${currentUser.id}_${i}`, 
              party: currentUser.party 
            })
          }
          
          return {
            ...p,
            likes: [...p.likes, ...newLikes]
          }
        }
      }
      return p
    })
    
    if (updatedPosts) {
      setPosts(updatedPosts)
      
      if (!hasLiked && !isOwnPost) {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: post.userId,
          type: 'like',
          fromUserId: currentUser.id,
          fromUsername: currentUser.username,
          fromAvatar: currentUser.avatar,
          postId: post.id,
          timestamp: new Date().toISOString(),
          read: false
        }
        setNotifications(current => [...(current || []), notification])
      }
      
      const followerBoost = Math.floor((currentUser.followerCount || 0) / 1000) + 1
      const actualLikes = Math.min(followerBoost, 10)
      
      if (!hasLiked && actualLikes > 1) {
        toast.success(`Post liked! Your ${(currentUser.followerCount || 0).toLocaleString()} followers gave this post ${actualLikes} likes!`)
      } else {
        toast.success(hasLiked ? 'Like removed' : 'Post liked!')
      }
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return

    const updatedPosts = posts?.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          comments: [...p.comments, {
            id: `comment_${Date.now()}`,
            userId: currentUser.id,
            content: commentText,
            timestamp: new Date().toISOString()
          }]
        }
      }
      return p
    })
    
    if (updatedPosts) {
      setPosts(updatedPosts)
      
      if (!isOwnPost) {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: post.userId,
          type: 'comment',
          fromUserId: currentUser.id,
          fromUsername: currentUser.username,
          fromAvatar: currentUser.avatar,
          postId: post.id,
          content: commentText.slice(0, 50),
          timestamp: new Date().toISOString(),
          read: false
        }
        setNotifications(current => [...(current || []), notification])
      }
      
      setCommentText('')
      toast.success('Comment added!')
    }
  }

  const handleTip = async () => {
    const amount = parseFloat(tipAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid tip amount')
      return
    }

    if (amount > (currentUser.earnings || 0)) {
      toast.error('Insufficient funds')
      return
    }

    const updatedPosts = posts?.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          tips: [...p.tips, {
            userId: currentUser.id,
            amount: amount * 0.9,
            timestamp: new Date().toISOString()
          }]
        }
      }
      return p
    })
    
    if (updatedPosts) {
      setPosts(updatedPosts)
      
      if (!isOwnPost) {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: post.userId,
          type: 'tip',
          fromUserId: currentUser.id,
          fromUsername: currentUser.username,
          fromAvatar: currentUser.avatar,
          postId: post.id,
          amount: amount * 0.9,
          timestamp: new Date().toISOString(),
          read: false
        }
        setNotifications(current => [...(current || []), notification])
      }
      
      setTipAmount('')
      toast.success(`Tipped $${amount.toFixed(2)}!`)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    const updatedPosts = posts?.filter(p => p.id !== post.id)
    if (updatedPosts) {
      await setPosts(updatedPosts)
      toast.success('Post deleted')
    }
  }

  const handleFollow = async () => {
    if (!postUser) return
    
    const updatedUsers = users?.map(u => {
      if (u.id === currentUser.id) {
        const following = isFollowing
          ? u.following.filter(id => id !== post.userId)
          : [...u.following, post.userId]
        return { ...u, following }
      }
      if (u.id === post.userId) {
        const followers = isFollowing
          ? u.followers.filter(id => id !== currentUser.id)
          : [...u.followers, currentUser.id]
        const followerCount = isFollowing 
          ? Math.max(0, (u.followerCount || 0) - 1)
          : (u.followerCount || 0) + 1
        return { ...u, followers, followerCount }
      }
      return u
    })

    if (updatedUsers) {
      await setUsers(updatedUsers)
      
      if (!isFollowing) {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: post.userId,
          type: 'follow',
          fromUserId: currentUser.id,
          fromUsername: currentUser.username,
          fromAvatar: currentUser.avatar,
          timestamp: new Date().toISOString(),
          read: false
        }
        setNotifications(current => [...(current || []), notification])
      }
      
      toast.success(isFollowing ? `Unfollowed @${postUser.username}` : `Following @${postUser.username}`)
    }
  }

  const handleShare = () => {
    const publicUrl = `${window.location.origin}/post/${post.id}`
    navigator.clipboard.writeText(publicUrl)
    toast.success('Post URL copied to clipboard!')
    setShowShareDialog(true)
  }

  const handleShareToPage = async () => {
    const newPost: Post = {
      ...post,
      id: `post_${Date.now()}`,
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      shares: 0,
      likes: [],
      comments: [],
      tips: []
    }

    await setPosts([...(posts || []), newPost])
    toast.success('Shared to your page!')
    setShowShareDialog(false)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file')
      return
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Video file must be smaller than 50MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setReportProofVideo(reader.result as string)
      toast.success('Video proof attached')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveVideo = () => {
    setReportProofVideo(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting')
      return
    }

    const updatedPosts = posts?.map(p => {
      if (p.id === post.id) {
        const reports = p.reports || []
        return {
          ...p,
          reports: [...reports, {
            userId: currentUser.id,
            reason: reportReason,
            timestamp: new Date().toISOString(),
            proofVideo: reportProofVideo || undefined
          }]
        }
      }
      return p
    })

    if (updatedPosts) {
      await setPosts(updatedPosts)
      setReportReason('')
      setReportProofVideo(null)
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
      setShowReportDialog(false)
      toast.success('Post reported. Our team will review it shortly.')
    }
  }

  if (!postUser) {
    return null
  }

  const totalTips = post.tips.reduce((sum, tip) => sum + tip.amount, 0)
  const timeAgo = new Date(post.timestamp).toLocaleString()

  const renderContentWithHashtags = (content: string) => {
    const parts = content.split(/(#[a-zA-Z0-9_]+)/g)
    
    return parts.map((part, index) => {
      if (part.match(/^#[a-zA-Z0-9_]+$/)) {
        return (
          <span
            key={index}
            className="text-primary cursor-pointer hover:underline font-medium"
            onClick={() => onHashtagClick?.(part)}
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={postUser.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {postUser.displayName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{postUser.displayName}</span>
                {postUser.isVerified && <VerifiedBadge size="sm" />}
                <Badge variant="secondary" className={`${partyColor} text-xs`}>
                  <PartyIcon size={12} className="mr-1" />
                  {post.party}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                @{postUser.username} • {timeAgo}
                {(postUser.followerCount || 0) > 0 && (
                  <span className="ml-2 font-medium text-foreground">• {(postUser.followerCount || 0).toLocaleString()} followers</span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <DotsThree size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isOwnPost && (
                <DropdownMenuItem onClick={handleFollow}>
                  {isFollowing ? <UserMinus className="mr-2" size={16} /> : <UserPlus className="mr-2" size={16} />}
                  {isFollowing ? 'Unfollow' : 'Follow'} @{postUser?.username}
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  <Warning className="mr-2" size={16} />
                  Report Post
                </DropdownMenuItem>
              )}
              {isOwnPost && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash className="mr-2" size={16} />
                  Delete Post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleShare}>
                <Copy className="mr-2" size={16} />
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="leading-relaxed">{renderContentWithHashtags(post.content)}</div>

        {post.video && (
          <video src={post.video} controls className="w-full rounded-lg max-h-96" />
        )}
        
        {post.image && (
          <div className="rounded-lg overflow-hidden border">
            <img src={post.image} alt="Post content" className="w-full" />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${hasLiked ? partyColor : 'text-muted-foreground'}`}
              onClick={handleLike}
            >
              <PartyIcon size={16} />
              <span className="font-semibold">{post.likes.length}</span>
            </Button>
            
            <Dialog open={showComments} onOpenChange={setShowComments}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <ChatCircle size={16} />
                  {post.comments.length}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Comments</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {post.comments.map((comment) => {
                    const commentUser = users?.find(u => u.id === comment.userId)
                    return (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={commentUser?.avatar} />
                          <AvatarFallback className="text-xs">
                            {commentUser?.displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{commentUser?.displayName}</div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleComment} disabled={!commentText.trim()}>
                    Comment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={handleShare}>
              <Share size={16} />
              {post.shares}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {totalTips > 0 && (
              <span className="text-sm text-accent font-medium">
                ${totalTips.toFixed(2)}
              </span>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CurrencyDollar size={16} />
                  Tip
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Tip</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Send a tip to support {postUser?.displayName}'s content. 
                    Platform keeps 10% fee.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                      min="0"
                      step="0.01"
                    />
                    <Button onClick={handleTip} disabled={!tipAmount}>
                      Send Tip
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-mono break-all">
                {window.location.origin}/post/{post.id}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
                toast.success('Copied!')
              }} variant="outline" className="flex-1">
                Copy URL
              </Button>
              <Button onClick={handleShareToPage} className="flex-1">
                Share to My Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Help us maintain a respectful political discourse. Please provide a reason for reporting this post.
            </p>
            <Textarea
              placeholder="Describe why you're reporting this post..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
            />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Attach Video Proof (Optional)</label>
                {reportProofVideo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveVideo}
                    className="h-8 gap-1 text-destructive hover:text-destructive"
                  >
                    <X size={14} />
                    Remove
                  </Button>
                )}
              </div>
              
              {reportProofVideo ? (
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                  <video
                    src={reportProofVideo}
                    controls
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              ) : (
                <>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="report-video-upload"
                  />
                  <label htmlFor="report-video-upload">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                    >
                      <span>
                        <VideoCamera size={18} />
                        Upload Video Evidence
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 50MB. Supported formats: MP4, MOV, WebM
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowReportDialog(false)
                  setReportReason('')
                  setReportProofVideo(null)
                  if (videoInputRef.current) {
                    videoInputRef.current.value = ''
                  }
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReport} 
                disabled={!reportReason.trim()}
                className="flex-1"
                variant="destructive"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}