import env from 'dotenv'
env.config()

import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const msg = {
    to: 'mistavia@mac.com', // Change to your recipient
    from: 'integration@mktgbuddy.com', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>'
}

export async function sendGridSendMail() {
    try {
        await sgMail.send(msg)
    } catch (error) {
        throw error
    }
}
