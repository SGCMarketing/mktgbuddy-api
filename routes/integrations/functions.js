import logger from '../../utils/logger.js'
import { sendGridSendMail } from '../../utils/sendGrid.js'

import { demo } from '../integrationPartners/partners/demo/index.js'
import { demio } from '../integrationPartners/partners/demio/index.js'
import { hubSpot } from '../integrationPartners/partners/hubSpot/index.js'
import { mailChimp } from '../integrationPartners/partners/mailChimp/index.js'

import image from '../../utils/image.js'
import clientFunction from '../clients/functions.js'

import integrationModel from './schema.js'

const integrationPartners = {
    demio: { fetchFunction: demio.fetchData, testFunction: demio.doConnectionTest },
    demo: { fetchFunction: demo.fetchData, testFunction: demo.doConnectionTest },
    hubSpot: { fetchFunction: hubSpot.fetchData, doConnectionTest: hubSpot.doConnectionTest },
    mailChimp: { fetchFunction: mailChimp.fetchData, doConnectionTest: mailChimp.doConnectionTest }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function checkIfApprovalRequired(body) {
    logger.func(`integrations/functions.js -> checkIfApprovalRequired()`)

    // Create a deep copy of body to avoid mutating the original object
    const updatedBody = JSON.parse(JSON.stringify(body))

    if (updatedBody?.authentication?.method === 'Email' && updatedBody?.authentication?.status === 'Send for approval') {
        logger.info('Sending email ...')
        try {
            const res = await sendGridSendMail()
            updatedBody.authentication.status = 'Sent for approval'
            updatedBody.authentication.sendTo.email.at = new Date()
        } catch (error) {
            logger.error(`Email send error = ${error}`)
        }
    }

    if (updatedBody?.authentication?.method === 'SMS' && updatedBody?.authentication?.status === 'Send for approval') {
        logger.info('Sending SMS ...')
        try {
            const res = await sendGridSendMail()
            updatedBody.authentication.status = 'Sent for approval'
            updatedBody.authentication.sendTo.email.at = new Date()
        } catch (error) {
            logger.error(`SMS send error = ${error}`)
        }
    }

    return updatedBody
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function checkData(body) {
    logger.func(`integrations/functions.js -> checkData()`)

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    if (body?.authentication?.method === 'Email' && !body?.authentication?.sendTo?.email?.address) throw 'IntegrationAuthenticationEmailRequiredError'
    if (body?.authentication?.method === 'SMS' && !body?.authentication?.sendTo?.sms?.number) throw 'IntegrationAuthenticationSMSRequiredError'

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    if (body?.integrationPartner === 'demio' && body?.authentication?.method === 'I will authenticate') {
        if (!body?.connection?.api?.key || !body?.connection?.api?.secret) {
            throw 'IntegrationDemioRequireAPIKeyTokenError'
        } else {
            body.authentication.status = 'Approved'
        }
    }

    return body
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function testConnection(body) {
    logger.func(`integrations/functions.js -> testConnection()`)

    // Demo
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    if (body?.integrationPartner === 'demo') {
        body.testLog = await demo.doConnectionTest(body._id, body?.connection?.api?.key, body?.connection?.api?.secret)
        body.authentication.status = 'Connected'
    }
    // Demio
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    if (body?.integrationPartner === 'demio') {
        body.testLog = await demio.doConnectionTest(body._id, body?.connection?.api?.key, body?.connection?.api?.secret)
        body.authentication.status = 'Connected'
    }
    // HubSpot
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    else if (body?.integrationPartner === 'hubSpot') {
        body.testLog = await hubSpot.doConnectionTest(body._id, body?.connection?.authentication?.token, body?.connection?.authentication?.refreshToken)
        body.authentication.status = 'Connected'
    }
    // Mailchimp
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    else if (body?.integrationPartner === 'mailChimp') {
        body.testLog = await mailChimp.doConnectionTest(body._id, body?.connection?.authentication)
        body.authentication.status = 'Connected'
    }

    return body
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function fetchData(req, body) {
    logger.func(`integrations/functions.js -> fetchData()`)

    let parsedFilter = {}

    try {
        if (req?.query?.filter) {
            parsedFilter = JSON.parse(req.query.filter)
            if ((parsedFilter && typeof parsedFilter !== 'object') || parsedFilter === null) throw 'IntegrationFilterInvalidJSONBodyError'
        }
    } catch (err) {
        throw 'IntegrationFilterInvalidJSONBodyError'
    }

    const fetchFunction = integrationPartners[body.integrationPartner].fetchFunction
    return await fetchFunction(body?.connection?.authentication?.token, body?.connection?.authentication?.refreshToken, body._id, req.query.object, req.query.tile, req.query.year, req.query.month, parsedFilter)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Attempt to get the client logo and return
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function getLogo(req, _) {
    logger.func(`integrations/functions.js -> getLogo()`)

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const doc = await integrationModel.findById(req.params.id).collation({ locale: 'en', strength: 1 }).lean().select('brand').sort({ name: 1 })

        if (doc?.brand?.logo) return image.decodeBase64Image(doc.brand.logo)
        else return image.decodeBase64Image(noLogoImage)
    } else {
        return image.decodeBase64Image(noLogoImage)
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Clean (remove) any keys that cannot be updated by the API call
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function cleanResponse(req, docs) {
    logger.func(`integrations/functions.js -> cleanResponse()`)

    docs.forEach((doc) => {
        if (doc?.client?.brand?.logo) doc.client.brand.logo = clientFunction.reduceLogo(doc.client._id)
        if (doc?.client?.brand?.backgroundLogo) doc.client.brand.backgroundLogo = clientFunction.reduceLogo(doc.client._id, 'backgroundLogo')
    })

    return docs
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Clean (remove) any keys that cannot be updated by the API call
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function reduceLogo(id, type = 'logo') {
    logger.func(`integrations/functions.js -> reduceLogo()`)

    return `${process.env.API_URL}/integration/${id}/${type}/`
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    checkIfApprovalRequired,
    checkData,
    testConnection,
    fetchData,
    getLogo,
    reduceLogo,
    cleanResponse
}
