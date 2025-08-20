"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Mail, ExternalLink, Code, Settings } from "lucide-react"

export function EmailSetupGuide() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Service Setup Guide
        </CardTitle>
        <CardDescription>Configure email delivery for invitation system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Currently, invitation emails are logged to the console for testing. To enable actual email delivery,
            configure one of the email services below.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Resend
                <Badge variant="secondary">Recommended</Badge>
              </CardTitle>
              <CardDescription>Modern email API with great developer experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-mono">npm install resend</p>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>1.</strong> Sign up at{" "}
                  <a
                    href="https://resend.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    resend.com <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p>
                  <strong>2.</strong> Add your API key to environment variables:
                </p>
                <div className="bg-muted p-2 rounded text-xs font-mono">RESEND_API_KEY=re_your_api_key_here</div>
                <p>
                  <strong>3.</strong> Uncomment the Resend code in <code>/api/send-invitation/route.ts</code>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SendGrid</CardTitle>
              <CardDescription>Reliable email delivery service by Twilio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-mono">npm install @sendgrid/mail</p>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>1.</strong> Sign up at{" "}
                  <a
                    href="https://sendgrid.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    sendgrid.com <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p>
                  <strong>2.</strong> Add your API key to environment variables:
                </p>
                <div className="bg-muted p-2 rounded text-xs font-mono">SENDGRID_API_KEY=SG.your_api_key_here</div>
                <p>
                  <strong>3.</strong> Replace the email sending code in the API route
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nodemailer</CardTitle>
              <CardDescription>Use your own SMTP server or Gmail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-mono">npm install nodemailer</p>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>1.</strong> Configure SMTP settings:
                </p>
                <div className="bg-muted p-2 rounded text-xs font-mono">
                  SMTP_HOST=smtp.gmail.com
                  <br />
                  SMTP_PORT=587
                  <br />
                  SMTP_USER=your-email@gmail.com
                  <br />
                  SMTP_PASS=your-app-password
                </div>
                <p>
                  <strong>2.</strong> Update the API route with Nodemailer configuration
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AWS SES</CardTitle>
              <CardDescription>Amazon's email service for high volume</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-mono">npm install @aws-sdk/client-ses</p>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>1.</strong> Configure AWS credentials:
                </p>
                <div className="bg-muted p-2 rounded text-xs font-mono">
                  AWS_ACCESS_KEY_ID=your_access_key
                  <br />
                  AWS_SECRET_ACCESS_KEY=your_secret_key
                  <br />
                  AWS_REGION=us-east-1
                </div>
                <p>
                  <strong>2.</strong> Verify your domain in AWS SES console
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Code className="h-4 w-4" />
          <AlertDescription>
            <strong>For testing:</strong> Check your browser console and server logs to see the invitation URLs. You can
            copy these links to test the invitation flow without email delivery.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
