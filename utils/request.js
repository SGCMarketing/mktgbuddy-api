// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// request.js
// Formats the Express request.
//
// Created 25th Nov 2022
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 25/11/2022, Andy Chadbourne, original release.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import logger from './logger.js'
import check from './check.js'
import response from './response.js'

import errorMessages from './responseErrors.js'

const noAuthRequiredObjects = new Set(['users:POST', 'integrationPartners:GET', 'integrationApproval:PATCH', 'integrationApproval:POST', 'integrationApproval:GET', 'integrationApproval:DELETE'])

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// processRequest
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function processRequest(req, res) {
    logger.func(`request.js -> processRequest()`)

    try {
        logger.request(req, false)

        const { object, id } = req.params

        if (!check.model[object]) throw 'APICallNotSupported'

        // Define the allowed methods and their corresponding model actions
        const actions = {
            POST: check.model[object].create,
            DELETE: check.model[object].remove,
            GET: check.model[object].read,
            PATCH: check.model[object].update
        }

        const action = actions[req.method]

        if (noAuthRequiredObjects.has(`${req.params.object}:${req.method}`)) {
            logger.info(`${req.params.object} access does not require authentication, bypassing.`)
            req.authData = 'NoAuthRequired'
        } else {
            await check.checkAuth(req, res)
            await check.preCheck(req, res)
        }

        await action(req, res)

        await response.sendSuccessResponse(req, res)
    } catch (err) {
        if (err?.stack) {
            logger.error(`${err.stack}`)
            await response.sendErrorResponse(res, { name: 'APIUnknownError', message: errorMessages['APIUnknownError'] })
        } else {
            await response.sendErrorResponse(res, err)
        }
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    processRequest
}
