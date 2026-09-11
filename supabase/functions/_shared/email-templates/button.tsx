/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

// Table-based button: Outlook ignores padding/background on inline <a>,
// which turns styled anchors into plain long links. Padding on a <td>
// with bgcolor works everywhere.
export const EmailButton = ({
  href,
  label,
  color = '#e5548a',
}: {
  href: string
  label: string
  color?: string
}) => (
  <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 28px' }}>
    <tbody>
      <tr>
        <td align="center" bgcolor={color} style={{ backgroundColor: color, borderRadius: '16px', padding: '14px 28px' }}>
          <a
            href={href}
            target="_blank"
            style={{
              color: '#ffffff',
              fontFamily: "Quicksand, Arial, sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              lineHeight: '1.2',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {label}
          </a>
        </td>
      </tr>
    </tbody>
  </table>
)

export default EmailButton
