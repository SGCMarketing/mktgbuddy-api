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
import lodash from 'lodash'
import integrationModel from './schema.js'
import { integrationPartners } from '../integrationPartners/partners.js'

import logger from '../../utils/logger.js'

import integrationFunction from './functions.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CREATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function create(req, res) {
    logger.func(`integrations/index.js -> create()`)

    try {
        if (!req?.body?.client) throw 'IntegrationClientRequiredError'
        if (!req?.body?.integrationPartner) throw 'IntegrationPartnerRequiredError'
        if (!req?.body?.authentication?.method) throw 'IntegrationMethodRequiredError'

        req.body = integrationFunction.checkData(req.body)

        // Check if a document with this client and date already exists
        const docs = await integrationModel.find({ client: req.body.client, integrationPartner: req.body.integrationPartner }).collation({ locale: 'en', strength: 1 }).lean().select()
        if (docs.length > 0) throw 'IntegrationAlreadyExistsError'

        // Manually set default for authentication.status if it's missing
        if (!req?.body?.authentication?.status) {
            req.body.authentication.status = 'Send for approval'
        }

        // Check if approval needs sending
        req.body = await integrationFunction.checkIfApprovalRequired(req.body)

        // Create the new document
        const doc = new integrationModel(req.body)

        // Save the document
        await doc.save()
        logger.info(`Created document with ID ${doc.id}`)

        // Retrieve the document and return as res
        const newDoc = await integrationModel
            .findById(doc.id)
            .lean()
            .populate([{ path: 'client', select: { _id: 1, name: 1 } }])
        res.data = [newDoc]
    } catch (error) {
        if (error.name == 'MongoServerError') {
            throw 'ClientAlreadyExistsError'
        } else {
            throw error
        }
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// READ
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function read(req, res) {
    logger.func(`integrations/index.js -> read()`)

    // Fetch the docs
    let docs = await integrationModel
        .find(req.findObject)
        .collation({ locale: 'en', strength: 1 })
        .lean()
        .select()
        .populate([{ path: 'client', select: { _id: 1, name: 1, brand: 1 } }])

    if (docs.length === 0) throw 'IntegrationNoIntegrationError'

    for (let i = 0; i < docs.length; i++) {
        let doc = docs[i] // Access doc from the docs array

        // If test query is present, perform the connection test
        if (req?.params?.option === 'test') {
            logger.info('Test requested')
            try {
                doc = await integrationFunction.testConnection(doc)
                await integrationModel.findOneAndUpdate({ _id: doc._id }, { 'authentication.status': 'Connected' }, { new: true, runValidators: true })
                delete doc.client
            } catch (err) {
                // Set the integration status to Disconnected
                await integrationModel.findOneAndUpdate({ _id: doc._id }, { 'authentication.status': 'Disconnected' }, { new: true, runValidators: true })
                throw err
            }
        } else if (req?.params?.option === 'fetch') {
            logger.info('Data fetch requested')
            doc = await integrationFunction.fetchData(req, doc)
            delete doc.client
        }

        if (doc?.integrationPartner) {
            // Find the corresponding integration partner by shortName
            const partner = integrationPartners.find((p) => p.shortName === doc.integrationPartner)
            if (partner) {
                doc.integrationPartner = partner
            }
        }

        delete doc.connection

        // Replace the updated doc in the docs array
        docs[i] = doc
    }

    // Set the response data
    res.data = integrationFunction.cleanResponse(req, docs)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPDATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function update(req, res) {
    logger.func(`integrations/index.js -> update()`)

    integrationFunction.checkData(req.body)

    // Fetch the doc
    console.log(JSON.stringify(req.findObject))
    const doc = await integrationModel.findOne(req.findObject).lean()
    if (!doc) throw 'IntegrationNoIntegrationError'

    // Merge the existing record with the new (stop things like options being overidden)
    let updatedDoc = lodash.merge(doc, req.body)

    // Check if approval needs sending
    updatedDoc = await integrationFunction.checkIfApprovalRequired(updatedDoc)

    // Remove _id as this cannot be modified
    delete updatedDoc._id

    // Find the document and update it
    await integrationModel.findOneAndUpdate({ _id: req.params.id }, updatedDoc, { runValidators: true })

    // Retrieve the document and return as res
    const newDoc = await integrationModel.findById(req.params.id).lean()
    res.data = [newDoc]
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function remove(req) {
    logger.func(`integrations/index.js -> remove()`)

    // Find the client (does it exist?)
    const integrationDataToDelete = await integrationModel.findOne(req.findObject).lean()
    if (!integrationDataToDelete) throw 'IntegrationDataNoIntegrationDataError'

    // Delete the client
    await integrationModel.findByIdAndDelete(req.params.id)
}
