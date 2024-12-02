import axios from 'axios'
import logger from '../../../../utils/logger.js'

// Test the connection by gathering all the events
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function doConnectionTest(integrationId, authorisation) {
    logger.info(`${logger.penStart.yellow}Starting Mailchimp connection test${logger.penEnd}`)

    let testLog = 'Starting Mailchimp connection test\n'

    try {
        const res = await axios.get(`${authorisation?.apiEndPoint}/3.0/campaigns`, {
            headers: {
                Authorization: `Bearer ${authorisation.token}` // Use the OAuth2 token
            }
        })

        // Limit the data to 6 records
        const limitedData = res.data.campaigns.slice(0, 6)

        testLog += `Test OK, got ${limitedData.length} campaigns (of max 6 for this test) back from the Mailchimp API. 0 events could mean you don't have any setup yet, but the API is working :)\n`

        limitedData.forEach((campaign) => {
            testLog += `<item>Campaign ID ${campaign?.id} ${campaign?.settings?.title}, from ${campaign?.settings?.reply_to}</item>\n`
        })

        return testLog
    } catch (err) {
        console.log(err.response.data)
        throw 'IntegrationDemioConnectionTestFailedError'
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function authenticateToken(req) {
    logger.info(`${logger.penStart.green}Authenticating Mailchimp (${req.params.id})${logger.penEnd}`)

    const formData = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.MAILCHIMP_CLIENT_ID,
        client_secret: process.env.MAILCHIMP_CLIENT_SECRET,
        redirect_uri: process.env.MAILCHIMP_REDIRECT_URI,
        code: req.body.connection.authentication.authCode
    })

    try {
        const t = await axios.post('https://login.mailchimp.com/oauth2/token', formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

        const md = await axios.post('https://login.mailchimp.com/oauth2/metadata', formData, {
            headers: {
                Authorization: `OAuth ${t.data.access_token}`
            }
        })

        if (t?.data?.access_token && md?.data?.dc && md?.data?.api_endpoint) {
            const newBody = {
                'authentication.status': 'Connected',
                connection: {
                    authentication: { authCode: req.body.connection.authentication.authCode, token: t.data.access_token, serverPrefix: md.data.dc, apiEndPoint: md.data.api_endpoint }
                }
            }
            await integrationModel.findByIdAndUpdate(req.params.id, newBody)
        }

        res.data = []
    } catch (err) {
        console.log(err.response.data)
        if (err?.response?.data?.error === 'expired_token') throw 'IntegrationApprovalsCodeExpiredError'
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const mailChimp = { authenticateToken, doConnectionTest }
