import { sendListingCreatedEmail } from '../src/lib/email.js'

async function debug() {
  console.log('--- Debug Email Test ---')
  console.log('RESEND_API_KEY from process.env:', process.env.RESEND_API_KEY ? 'Present' : 'Missing')

  const dummyData = {
    userEmail: 'test@example.com',
    userName: 'Test User',
    vehicleTitle: '2023 Honda Civic',
    price: 120000,
    listingSlug: 'honda-civic-2023-test'
  }

  console.log('Calling sendListingCreatedEmail with dummy data...')
  try {
    const result = await sendListingCreatedEmail(dummyData)
    console.log('Result:', result)
  } catch (err) {
    console.error('Caught error in debug:', err)
  }
}

debug().then(() => {
    console.log('Debug finished.')
    process.exit(0)
}).catch((err) => {
  console.error('Error in debug execution:', err)
  process.exit(1)
})
