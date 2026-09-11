// Bulletproof email button.
// Outlook (Word rendering engine) ignores padding/background on inline <a>,
// which makes styled anchors collapse into a plain underlined long link.
// This table + VML version renders as a real button in Outlook, Gmail,
// Apple Mail, Yahoo and mobile clients.
export function emailButton(
  href: string,
  label: string,
  color = "#e5548a",
  align: "left" | "center" = "left",
): string {
  const safeHref = String(href).replace(/"/g, "&quot;");
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${align === "center" ? "22px auto" : "0 0 28px"};">
    <tr>
      <td align="center" bgcolor="${color}" style="border-radius:16px;">
        <a href="${safeHref}" target="_blank" style="display:inline-block;padding:14px 28px;background-color:${color};border-radius:16px;color:#ffffff;font-family:Quicksand,Arial,sans-serif;font-size:15px;font-weight:700;line-height:1.2;text-decoration:none;mso-padding-alt:0;">
          <!--[if mso]><i style="letter-spacing:28px;mso-font-width:-100%;mso-text-raise:26px;">&nbsp;</i><![endif]--><span style="mso-text-raise:13px;">${label}</span><!--[if mso]><i style="letter-spacing:28px;mso-font-width:-100%;">&nbsp;</i><![endif]-->
        </a>
      </td>
    </tr>
  </table>`;
}
