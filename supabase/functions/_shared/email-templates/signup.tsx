/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Club Choir – please confirm your email 🎶</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1"
          alt="Club Choir"
          width="120"
          style={{ marginBottom: '24px' }}
        />
        <Heading style={h1}>Welcome to Club Choir! 🎶</Heading>
        <Text style={text}>
          We're so happy you've joined our community of singers. Whether you're here
          to sing your heart out, meet new friends, or simply enjoy the joy of music
          together — you're in the right place.
        </Text>
        <Text style={text}>
          To get started, please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Section style={{ marginBottom: '28px' }}>
          <Link href={confirmationUrl} style={button}>
            Confirm My Email
          </Link>
        </Section>

        <Section style={noticeBox}>
          <Text style={noticeHeading}>⏳ One more step after confirmation</Text>
          <Text style={noticeText}>
            Once your email is confirmed, your account will remain{' '}
            <strong>pending</strong> until an administrator reviews and approves
            your profile. We do this to keep our member community safe and welcoming.
          </Text>
          <Text style={noticeText}>
            You'll receive another email as soon as your account is activated —
            usually within a day or two. After that, you'll have full access to
            song resources, your location's chat, and the member community.
          </Text>
        </Section>

        <Text style={text}>
          Can't wait to sing with you soon!
          <br />
          — The Club Choir Team
        </Text>

        <Text style={smallText}>
          If the button above doesn't work, copy and paste this link into your browser:{' '}
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', 'Quicksand', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: 'hsl(240, 10%, 16%)',
  fontFamily: "'Quicksand', Arial, sans-serif",
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(240, 5%, 30%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const smallText = {
  fontSize: '12px',
  color: 'hsl(240, 5%, 46%)',
  lineHeight: '1.6',
  margin: '24px 0 16px',
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
const noticeBox = {
  backgroundColor: 'hsl(340, 75%, 97%)',
  border: '1px solid hsl(340, 75%, 90%)',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '8px 0 28px',
}
const noticeHeading = {
  fontSize: '15px',
  fontWeight: '700' as const,
  color: 'hsl(340, 60%, 35%)',
  fontFamily: "'Quicksand', Arial, sans-serif",
  margin: '0 0 10px',
}
const noticeText = {
  fontSize: '14px',
  color: 'hsl(240, 5%, 30%)',
  lineHeight: '1.6',
  margin: '0 0 10px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
