import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { User, Post } from '@/App'
import { Question, Warning, ChatCircle, FileText } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Report {
  id: string
  reporterId: string
  reportedUserId?: string
  reportedPostId?: string
  reason: string
  description: string
  timestamp: string
  status: 'pending' | 'resolved'
}

interface SupportTicket {
  id: string
  userId: string
  subject: string
  message: string
  timestamp: string
  status: 'open' | 'closed'
}

interface SupportProps {
  user: User
}

export function Support({ user }: SupportProps) {
  const [reports, setReports] = useKV<Report[]>('reports', [])
  const [tickets, setTickets] = useKV<SupportTicket[]>('supportTickets', [])
  const [users] = useKV<User[]>('users', [])
  const [posts] = useKV<Post[]>('posts', [])
  
  const [reportType, setReportType] = useState<'user' | 'post'>('user')
  const [reportedUsername, setReportedUsername] = useState('')
  const [reportedPostId, setReportedPostId] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')

  const reportReasons = [
    'Harassment or Bullying',
    'Hate Speech',
    'Spam or Scam',
    'False Information',
    'Inappropriate Content',
    'Impersonation',
    'Other'
  ]

  const handleSubmitReport = async () => {
    if (!reportReason || !reportDescription) {
      toast.error('Please fill in all fields')
      return
    }

    let reportedUserId: string | undefined
    let reportedPostIdFinal: string | undefined

    if (reportType === 'user') {
      const reportedUser = users?.find(u => u.username.toLowerCase() === reportedUsername.toLowerCase())
      if (!reportedUser) {
        toast.error('User not found')
        return
      }
      reportedUserId = reportedUser.id
    } else {
      const post = posts?.find(p => p.id === reportedPostId)
      if (!post) {
        toast.error('Post not found')
        return
      }
      reportedPostIdFinal = post.id
    }

    const newReport: Report = {
      id: `report_${Date.now()}`,
      reporterId: user.id,
      reportedUserId,
      reportedPostId: reportedPostIdFinal,
      reason: reportReason,
      description: reportDescription,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }

    await setReports([...(reports || []), newReport])
    toast.success('Report submitted. Thank you for helping keep our community safe.')
    
    setReportedUsername('')
    setReportedPostId('')
    setReportReason('')
    setReportDescription('')
  }

  const handleSubmitTicket = async () => {
    if (!ticketSubject || !ticketMessage) {
      toast.error('Please fill in all fields')
      return
    }

    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      userId: user.id,
      subject: ticketSubject,
      message: ticketMessage,
      timestamp: new Date().toISOString(),
      status: 'open'
    }

    await setTickets([...(tickets || []), newTicket])
    toast.success('Support ticket submitted. We\'ll respond soon!')
    
    setTicketSubject('')
    setTicketMessage('')
  }

  const myReports = reports?.filter(r => r.reporterId === user.id) || []
  const myTickets = tickets?.filter(t => t.userId === user.id) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Question size={24} />
            Support & Reports
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warning size={20} />
              Report a User or Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Help us maintain a safe community by reporting violations of our community guidelines.
            </p>

            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value: 'user' | 'post') => setReportType(value)}>
                <SelectTrigger id="reportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Report a User</SelectItem>
                  <SelectItem value="post">Report a Post</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'user' ? (
              <div className="space-y-2">
                <Label htmlFor="reportedUsername">Username to Report</Label>
                <Input
                  id="reportedUsername"
                  value={reportedUsername}
                  onChange={(e) => setReportedUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reportedPostId">Post ID</Label>
                <Input
                  id="reportedPostId"
                  value={reportedPostId}
                  onChange={(e) => setReportedPostId(e.target.value)}
                  placeholder="Enter post ID"
                />
                <p className="text-xs text-muted-foreground">
                  You can find the post ID in the post menu
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reportReason">Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger id="reportReason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map(reason => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportDescription">Description</Label>
              <textarea
                id="reportDescription"
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide details about the issue..."
              />
            </div>

            <Button onClick={handleSubmitReport} className="w-full gap-2">
              <Warning />
              Submit Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChatCircle size={20} />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Need help? Submit a support ticket and our team will assist you.
            </p>

            <div className="space-y-2">
              <Label htmlFor="ticketSubject">Subject</Label>
              <Input
                id="ticketSubject"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief description of your issue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketMessage">Message</Label>
              <textarea
                id="ticketMessage"
                className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background"
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
              />
            </div>

            <Button onClick={handleSubmitTicket} className="w-full gap-2">
              <ChatCircle />
              Submit Ticket
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              My Reports ({myReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myReports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                You haven't submitted any reports yet.
              </p>
            ) : (
              <div className="space-y-3">
                {myReports.map(report => (
                  <div key={report.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{report.reason}</div>
                      <Badge variant={report.status === 'pending' ? 'secondary' : 'default'}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(report.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChatCircle size={20} />
              My Support Tickets ({myTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                You haven't submitted any support tickets yet.
              </p>
            ) : (
              <div className="space-y-3">
                {myTickets.map(ticket => (
                  <div key={ticket.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{ticket.subject}</div>
                      <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{ticket.message}</p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(ticket.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
