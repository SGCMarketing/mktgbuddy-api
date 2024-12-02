import axios from 'axios'
import env from 'dotenv'
import logger from '../../../../utils/logger.js'

import { objectFetch } from './api.js'

env.config()

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function doConnectionTest(integrationId, token, refreshToken, testLog = '') {
    logger.func(`integrationPartners/partners/demo/index.js -> doConnectionTest()`)

    testLog += 'Starting Demo connection test\n'
    testLog += `Test OK, got 6 contacts (of max 6 for this test) back from the HubSpot API. 0 contacts could mean you haven't created any yet, but the API is working :)\n`
    testLog += `<item>Contact ID: 1, Donald Duck, donald.duck@disney.com</item>\n`
    testLog += `<item>Contact ID: 2, Marty McFly, 88mph?gmail.com</item>\n`
    testLog += `<item>Contact ID: 3, Buster Keaton, silent@movie.com</item>\n`
    testLog += `<item>Contact ID: 4, Eric Clapton, ec@slowhand.com</item>\n`
    testLog += `<item>Contact ID: 5, Taylor Hawkins, legend@foofighters.com</item>\n`
    testLog += `<item>Contact ID: 6, Luke Littler, luke@darts.com</item>\n`

    return testLog
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function fetchData(token, refreshToken, integrationId, object, tile, year, month, filter) {
    logger.func(`integrationPartners/partners/demo/index.js -> fetchData()`)

    // Set default values for year and month if they are undefined
    const currentDate = new Date()
    year = year === undefined ? currentDate.getFullYear() : year
    month = month === undefined ? currentDate.getMonth() + 1 : month // getMonth() returns 0 for January

    try {
        // Check if the object exists in the apiObjects map
        const objectTiles = objectFetch[object].tile
        if (!objectTiles) throw 'IntegrationNoObjectWithThisNameError'

        // Check if the function for the tile exists
        const fetchTile = objectTiles.find((entry) => entry.shortName === tile)
        if (!fetchTile) throw 'IntegrationNoTileWithThisNameError'

        // Call the function dynamically
        return await fetchTile.func(token, year, month, filter)
    } catch (err) {
        if (err?.response?.data?.errorType === 'RATE_LIMIT') throw 'IntegrationHitRateLimitError'

        if (err?.response?.data?.category === 'EXPIRED_AUTHENTICATION') {
            logger.info('Token expired, refreshing ...')
            const newToken = await refreshAuthToken(integrationId, refreshToken)
            return await fetchData(newToken.accessToken, newToken.refreshToken, integrationId, object, tile, year, month, filter)
        }
        throw err
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const demo = {
    doConnectionTest,
    fetchData
}
