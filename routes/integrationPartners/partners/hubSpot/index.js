import axios from 'axios'
import env from 'dotenv'
import logger from '../../../../utils/logger.js'
import qs from 'qs'

import integrationModel from '../../../integrations/schema.js'

import { objectFetch } from './api.js'

env.config()

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function refreshAuthToken(integrationId, refreshToken) {
    logger.func(`integrationPartners/partners/hubSpot/index.js -> refreshAuthToken()`)

    const data = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        refresh_token: refreshToken
    })

    try {
        const response = await axios.post('https://api.hubapi.com/oauth/v1/token', data.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
        const { access_token, refresh_token } = response.data
        await integrationModel.findByIdAndUpdate(integrationId, { 'connection.authentication.token': access_token, 'connection.authentication.refreshToken': refresh_token })
        return { accessToken: access_token, refreshToken: refresh_token }
    } catch (error) {
        throw 'IntegrationHubSpotCouldNotRefreshTokenError'
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function doConnectionTest(integrationId, token, refreshToken, testLog = '') {
    logger.func(`integrationPartners/partners/hubSpot/index.js -> doConnectionTest()`)

    testLog += 'Starting HubSpot connection test\n'

    try {
        const res = await axios.get('https://api.hubapi.com/crm/v3/objects/contact', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        // Limit the data to 6 records
        const limitedData = res.data.results.slice(0, 6)

        testLog += `Test OK, got ${limitedData.length} contacts (of max 6 for this test) back from the HubSpot API. 0 contacts could mean you haven't created any yet, but the API is working :)\n`

        limitedData.forEach((contact) => {
            testLog += `<item>Contact ID :${contact.id}, ${contact.properties.firstname} ${contact.properties.lastname}, ${contact.properties.email}</item>\n`
        })

        return testLog
    } catch (err) {
        logger.error(err)
        if (err?.response?.data?.category === 'EXPIRED_AUTHENTICATION') {
            const newToken = await refreshAuthToken(integrationId, refreshToken)
            return await doConnectionTest(integrationId, newToken.accessToken, newToken.refreshToken, 'Token expired so refreshing it.\n')
        }

        throw 'IntegrationHubSpotConnectionTestFailedError'
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function authenticateToken(req) {
    logger.func(`integrationPartners/partners/hubSpot/index.js -> authenticateToken()`)

    const formData = {
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
        code: req.body.connection.authentication.authCode
    }

    try {
        const r = await axios.post('https://api.hubapi.com/oauth/v1/token', qs.stringify(formData), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

        if (r?.data?.access_token && r?.data?.refresh_token) {
            const newBody = { 'authentication.status': 'Connected', connection: { authentication: { authCode: req.body.connection.authentication.authCode, token: r.data.access_token, refreshToken: r.data.refresh_token } } }
            await integrationModel.findByIdAndUpdate(req.params.id, newBody)
        }

        res.data = []
    } catch (err) {
        if (err?.response?.data?.status === 'BAD_AUTH_CODE') throw 'IntegrationApprovalsNoAuthCodeProvidedError'
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function fetchData(token, refreshToken, integrationId, object, tile, year, month, filter) {
    logger.func(`integrationPartners/partners/hubSpot/index.js -> fetchData()`)

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
export const hubSpot = {
    authenticateToken,
    doConnectionTest,
    refreshAuthToken,
    fetchData
}
