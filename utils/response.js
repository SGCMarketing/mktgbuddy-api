// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// response.js
// Formats the Express response and sends.
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
import sortObjectKeys from 'sort-object-keys'

import logger from './logger.js'
import { SETTINGS_VERSION_NUMBER } from '../settings.js'
import errorMessages from './responseErrors.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// sendSuccessResponse
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function sendSuccessResponse(_, res) {
    logger.func('response.js -> sendSuccessResponse()')

    let data = res.data || [] // Default to an empty object if no data is present

    data.forEach((d) => {
        delete d.schemaVersion
        delete d.passwordHash
        delete d.__v
    })

    // Loop through all elements of the data
    for (let i = 0; i < data.length; i++) {
        // Add a seperator line to each element in the array
        data[i]._ = '------------------------------------------------------------------------------------------------'

        // Update object onwnership
        if ('objectOwnership' in data[i]) {
            data[i].objectOwnership.created.at = data[i].createdAt
            data[i].objectOwnership.updated.at = data[i].updatedAt
            // delete data[i].createdAt
            delete data[i].updatedAt
        }

        // Sort alphabetically buy keys
        data[i] = sortObjectKeys(data[i])
    }

    const now = new Date()

    await res.json({
        error: { name: 'NoError' },
        data,
        info: {
            serverDate: now.toLocaleDateString('en-GB'),
            serverTime: now.toLocaleTimeString('en-GB'),
            apiVersion: SETTINGS_VERSION_NUMBER,
            numberOfRecords: Array.isArray(data) ? data.length : 0
        }
    })
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// sendErrorResponse
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function sendErrorResponse(res, error) {
    logger.func('response.js -> sendErrorResponse()')
    logger.error(error)

    let errorResp = {}

    if (typeof error === 'object') {
        console.log(1)
        errorResp = { name: error.message, message: error.name }
    } else errorResp = { name: error, message: errorMessages[error] }

    const now = new Date()

    await res.status(400).json({
        error: errorResp,
        data: [],
        info: {
            serverDate: now.toLocaleDateString('en-GB'),
            serverTime: now.toLocaleTimeString('en-GB'),
            apiVersion: SETTINGS_VERSION_NUMBER,
            numberOfRecords: 0
        }
    })
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    sendErrorResponse,
    sendSuccessResponse
}
