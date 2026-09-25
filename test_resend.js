async function sendEmail() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('Missing RESEND_API_KEY env var')
    process.exit(1)
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: 'noreply@carbi.com.br',
      to: 'antoniorbxeventos@gmail.com',
      subject: 'Test Email',
      html: '<p>Test email content</p>'
    })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

sendEmail();
