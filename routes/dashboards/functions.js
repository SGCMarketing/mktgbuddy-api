import logger from '../../utils/logger.js'
import clientFunction from '../clients/functions.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Clean (remove) any keys that cannot be updated by the API call
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function cleanRequest(req) {
    logger.func(`dashboards/functions.js -> cleanRequest()`)

    // Object ownership (created by and updated by) cannot be set manually
    if ('objectOwnership' in req.body && 'created' in req.body.objectOwnership) delete req.body.objectOwnership.created
    if ('objectOwnership' in req.body && 'updated' in req.body.objectOwnership) delete req.body.objectOwnership.updated

    return req.body
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Clean (remove) any keys that cannot be updated by the API call
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function cleanResponse(docs) {
    logger.func(`dashboards/functions.js -> cleanResponse()`)

    docs.forEach((doc) => {
        if (!doc.client?.brand) doc.client.brand = {}
        doc.client.brand.logo = clientFunction.reduceLogo(doc.client._id)
        doc.client.brand.backgroundLogo = clientFunction.reduceLogo(doc.client._id, 'backgroundLogo')
    })

    return docs
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    cleanRequest,
    cleanResponse
}
