/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Club Choir password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1"
          alt="Club Choir"
          width="120"
          style={{ marginBottom: '24px' }}
        />
        <Heading style={h1}>Reset Your Password</Heading>
        <Text style={text}>
          We received a request to reset your Club Choir password. Click the button below to choose a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email. Your password won't be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const button = {
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
