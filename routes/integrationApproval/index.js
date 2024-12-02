// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// index.js
// Handles the /integrationData reqs.
//
// Created 5th September 2024
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 05/09/2024, Andy Chadbourne, original release.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import env from 'dotenv'

import integrationModel from '../integrations/schema.js'

import logger from '../../utils/logger.js'

import { hubSpot } from '../integrationPartners/partners/hubSpot/index.js'
import { mailChimp } from '../integrationPartners/partners/mailChimp/index.js'

env.config()

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPDATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function update(req, res) {
    logger.func(`integrationApproval/index.js -> update()`)

    logger.info(`${logger.penStart.green}Integration.update (${req.params.id})${logger.penEnd}`)

    if (!req?.body?.connection?.authentication?.authCode) throw 'IntegrationApprovalsNoAuthCodeProvidedError'

    // Fetch the doc
    const doc = await integrationModel.findOne(req.findObject).lean()
    if (!doc) throw 'IntegrationNoIntegrationError'

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    if (doc?.integrationPartner === 'hubSpot') await hubSpot.authenticateToken(req)
    else if (doc?.integrationPartner === 'mailChimp') await mailChimp.authenticateToken(req)
}
