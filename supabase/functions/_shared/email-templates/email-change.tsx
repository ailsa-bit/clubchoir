/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailButton } from './button.tsx'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for Club Choir</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1"
          alt="Club Choir"
          width="120"
          style={{ marginBottom: '24px' }}
        />
        <Heading style={h1}>Confirm Your Email Change</Heading>
        <Text style={text}>
          You requested to change your Club Choir email from{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Section style={{ marginBottom: '28px' }}>
          <EmailButton href={confirmationUrl} label="Confirm Email Change" />
        </Section>
        <Text style={smallText}>
          If the button above doesn't work, copy and paste this link into your browser:{' '}
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', 'Quicksand', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(240, 10%, 16%)',
  fontFamily: "'Quicksand', Arial, sans-serif",
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(240, 5%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 28px',
}
const smallText = {
  fontSize: '12px',
  color: 'hsl(240, 5%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
  wordBreak: 'break-all' as const,
}
const link = { color: 'hsl(340, 75%, 60%)', textDecoration: 'underline' }
const button = {
  display: 'inline-block' as const,
  backgroundColor: 'hsl(340, 75%, 60%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '16px',
  padding: '14px 28px',
  textDecoration: 'none',
  fontFamily: "'Quicksand', Arial, sans-serif",
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
