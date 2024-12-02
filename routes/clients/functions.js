import clientModel from './schema.js'
import mongoose from 'mongoose'
import env from 'dotenv'

import dashboardModel from '../dashboards/schema.js'
import integrationModel from '../integrations/schema.js'

import logger from '../../utils/logger.js'
import image from '../../utils/image.js'

env.config()

const noLogoImage =
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPg0KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAxMjAgMTIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNFRkYxRjMiLz4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzMuMjUwMyAzOC40ODE2QzMzLjI2MDMgMzcuMDQ3MiAzNC40MTk5IDM1Ljg4NjQgMzUuODU0MyAzNS44NzVIODMuMTQ2M0M4NC41ODQ4IDM1Ljg3NSA4NS43NTAzIDM3LjA0MzEgODUuNzUwMyAzOC40ODE2VjgwLjUxODRDODUuNzQwMyA4MS45NTI4IDg0LjU4MDcgODMuMTEzNiA4My4xNDYzIDgzLjEyNUgzNS44NTQzQzM0LjQxNTggODMuMTIzNiAzMy4yNTAzIDgxLjk1NyAzMy4yNTAzIDgwLjUxODRWMzguNDgxNlpNODAuNTAwNiA0MS4xMjUxSDM4LjUwMDZWNzcuODc1MUw2Mi44OTIxIDUzLjQ3ODNDNjMuOTE3MiA1Mi40NTM2IDY1LjU3ODggNTIuNDUzNiA2Ni42MDM5IDUzLjQ3ODNMODAuNTAwNiA2Ny40MDEzVjQxLjEyNTFaTTQzLjc1IDUxLjYyNDlDNDMuNzUgNTQuNTI0NCA0Ni4xMDA1IDU2Ljg3NDkgNDkgNTYuODc0OUM1MS44OTk1IDU2Ljg3NDkgNTQuMjUgNTQuNTI0NCA1NC4yNSA1MS42MjQ5QzU0LjI1IDQ4LjcyNTQgNTEuODk5NSA0Ni4zNzQ5IDQ5IDQ2LjM3NDlDNDYuMTAwNSA0Ni4zNzQ5IDQzLjc1IDQ4LjcyNTQgNDMuNzUgNTEuNjI0OVoiIGZpbGw9IiM2ODc3ODciLz4NCjwvc3ZnPg=='

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Adds a status key indicating if the Client is owned by or shared with the current User
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function _addSharedOrOwned(req, doc) {
    logger.func(`clients/functions.js -> _addSharedOrOwned()`)

    if (String(doc?.objectOwnership?.owned?.by?._id) === req.authData._id && doc?.objectOwnership?.sharedWith?.length > 0) {
        doc.status = 'ownedAndShared'
    } else if (String(doc?.objectOwnership?.owned?.by?._id) === req.authData._id) {
        doc.status = 'owned'
    } else {
        doc.status = 'shared'
    }

    return doc
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Add the 'element' key, which provides a summary of how many elements the Client has associated with it
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _getClientElements(doc) {
    logger.func(`clients/functions.js -> _getClientElements()`)

    const dashboards = await dashboardModel.find({ client: doc._id })

    const integrations = await integrationModel.find({ client: doc._id })

    const connectedIntegrationsCount = integrations.filter((integration) => integration.authentication.status === 'Connected').length
    const pendingIntegrationsCount = integrations.filter((integration) => ['Sent for approval', 'Send for approval', 'Approved'].includes(integration.authentication.status)).length

    doc.element = {
        budgets: { draft: 0, approved: 0, total: 0 },
        crm: { contacts: 0, total: 0 },
        dashboards: { total: dashboards.length },
        integrations: { connected: connectedIntegrationsCount, pending: pendingIntegrationsCount, total: integrations.length },
        lists: { actions: 0, pr: 0, total: 0 }
    }
    return doc
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Loops through each document and adds additional data to each
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function getAdditionalData(req, docs) {
    logger.func(`clients/functions.js -> getAdditionalData()`)

    for (let i = 0; i < docs.length; i++) {
        docs[i] = _addSharedOrOwned(req, docs[i])
        docs[i] = await _getClientElements(docs[i])
    }

    return docs
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Check if the Client already exists
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function checkIfAlreadyExists(req) {
    logger.func(`clients/functions.js -> checkIfAlreadyExists()`)

    const docs = await clientModel
        .find({ $and: [{ _id: { $ne: req.params.id } }, { $or: [{ name: req.body.name }, { clientPrefix: req.body.clientPrefix }] }] })
        .collation({ locale: 'en', strength: 1 })
        .lean()
        .select()

    if (docs.length > 0) return true

    return false
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Clean (remove) any keys that cannot be updated by the API call
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function cleanRequest(body) {
    logger.func(`clients/functions.js -> cleanRequest()`)

    delete body.nextCode

    return body
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Clean (remove) any keys that cannot be updated by the API call
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function cleanResponse(req, docs) {
    logger.func(`clients/functions.js -> cleanResponse()`)

    docs.forEach((doc) => {
        if (!doc?.brand) doc.brand = {}
        doc.brand.logo = reduceLogo(doc._id)
        doc.brand.backgroundLogo = reduceLogo(doc._id, 'backgroundLogo')
    })

    return getAdditionalData(req, docs)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Clean (remove) any keys that cannot be updated by the API call
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function reduceLogo(id, type = 'logo') {
    // logger.func(`clients/functions.js -> reduceLogo()`)

    return `${process.env.API_URL}/client/${id}/${type}/`
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Attempt to get the client logo and return
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function getLogo(req, _) {
    logger.func(`clients/functions.js -> getLogo()`)

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const doc = await clientModel.findById(req.params.id).collation({ locale: 'en', strength: 1 }).lean().select('brand').sort({ name: 1 })

        if (doc?.brand?.logo) return image.decodeBase64Image(doc.brand.logo)
        else return image.decodeBase64Image(noLogoImage)
    } else {
        return image.decodeBase64Image(noLogoImage)
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Attempt to get the client logo and return
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function getBackgroundLogo(req, _) {
    logger.func(`clients/functions.js -> getBackgroundLogo()`)

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const doc = await clientModel.findById(req.params.id).collation({ locale: 'en', strength: 1 }).lean().select('brand').sort({ name: 1 })

        if (doc?.brand?.backgroundLogo) return image.decodeBase64Image(doc.brand.backgroundLogo)
        else return image.decodeBase64Image(noLogoImage)
    } else {
        return image.decodeBase64Image(noLogoImage)
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    getLogo,
    getBackgroundLogo,
    getAdditionalData,
    cleanRequest,
    cleanResponse,
    checkIfAlreadyExists,
    reduceLogo
}
