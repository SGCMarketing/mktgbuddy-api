import axios from 'axios'
import logger from '../../../../utils/logger.js'

const connectionTest = 'https://my.demio.com/api/v1/events'

// Test the connection by gathering all the events
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function doConnectionTest(integrationId, token, secret) {
    logger.info(`${logger.penStart.yellow}Starting Demio connection test${logger.penEnd}`)

    let testLog = 'Starting Demio connection test\n'

    try {
        const res = await axios.get(connectionTest, {
            headers: {
                'Api-key': token,
                'Api-secret': secret
            }
        })

        // Limit the data to 6 records
        const limitedData = res.data.slice(0, 6)

        testLog += `Test OK, got ${limitedData.length} events (of max 6 for this test) back from the Demio API. 
        0 events could mean you don't have any setup yet, but the API is working :)\n`

        limitedData.forEach((event) => {
            testLog += `<item>Event ID:${event.id}, ${event.name}</item>\n`
        })

        return testLog
    } catch (err) {
        console.log(err.response.data)
        throw 'IntegrationDemioConnectionTestFailedError'
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const demio = {
    doConnectionTest
}
