// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// index.js
// Handles the /clients requests.
//
// Created 13th Dec 2021
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 13/12/2021, Andy Chadbourne, original release.
// 1.0.1, 25/10/2022, Andy Chadbourne, reading now returns contact if full = true.
// 1.0.2, 20/02/2023, Andy Chadbourne, added various sharedWith user checks.

//TODO: Does update check if the Client can be updated when it is shared with the User - i.e. does it check permission.canUpdate?
//BUG: Limit the size of logo that can be uploaded to prevent data crashes.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import lodash from 'lodash'
import clientModel from './schema.js'
import integrationModel from '../integrations/schema.js'
import logger from '../../utils/logger.js'
// import util from 'util'

import clientFunction from './functions.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CREATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function create(req, res) {
    logger.func(`clients/index.js -> create()`)

    try {
        req.body = clientFunction.cleanRequest(req.body)

        // Has the Client got a name?
        if (!req?.body?.name) throw 'ClientMustHaveNameError'

        // Has the Client got a prefix and is it 4 characters long?
        if (!req?.body?.clientPrefix) throw 'ClientMustHavePrefixError'
        if ('clientPrefix' in req.body && req.body.clientPrefix.length !== 4) throw 'ClientPrefixLengthError'

        req.body.objectOwnership = {
            created: { by: req.authData._id },
            updated: { by: req.authData._id },
            owned: { by: req.authData._id }
        }

        // Create the new document
        const doc = new clientModel(JSON.parse(JSON.stringify(req.body)))

        // Check if a document with this client name and clientPrefix already exists
        if (await clientFunction.checkIfAlreadyExists(req)) throw 'ClientAlreadyExistsError'

        // Save the document
        await doc.save()
        logger.info(`Created document with ID ${doc.id}`)

        // Retrieve the document and return as response
        const newDoc = await clientModel
            .findById(doc.id)
            .lean()
            .populate([
                {
                    path: 'objectOwnership.created.by',
                    select: 'email'
                },
                {
                    path: 'objectOwnership.updated.by',
                    select: 'email'
                }
            ])
        res.data = await clientFunction.getAdditionalData(req, [newDoc])
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
    logger.func(`clients/index.js -> read()`)

    try {
        let docs

        req.findObject = {
            $and: [
                ...(req?.params?.id ? [{ _id: req.params.id }] : []),
                {
                    $or: [{ 'objectOwnership.owned.by': req.authData._id }, { 'objectOwnership.sharedWith.user': req.authData._id }]
                }
            ]
        }

        docs = await clientModel
            .find(req.findObject)
            .collation({ locale: 'en', strength: 1 })
            .lean()
            .select()
            .sort({ name: 1 })
            .populate([
                {
                    path: 'objectOwnership.created.by',
                    select: 'email'
                },
                {
                    path: 'objectOwnership.updated.by',
                    select: 'email'
                }
            ])
        logger.info(`Returning ${docs.length} record(s)`)

        res.data = await clientFunction.cleanResponse(req, docs)
    } catch (error) {
        throw error
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPDATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function update(req, res) {
    logger.func(`clients/index.js -> update()`)

    try {
        req.body = clientFunction.cleanRequest(req.body)

        // If the 'removeShare' option is present then only update the share
        if (req?.method === 'PATCH' && req?.params?.object === 'clients' && req?.params?.option === 'removeShare') {
            await clientModel.findOneAndUpdate(req.findObject, { $pull: { 'objectOwnership.sharedWith': { user: req.authData._id } } }, { runValidators: true })
            res.data = []
            return
        }

        if ('clientPrefix' in req.body && req.body.clientPrefix.length !== 4) throw 'ClientPrefixLengthError'

        // Object ownership (created by and updated by) cannot be set manually
        if ('objectOwnership' in req.body && 'created' in req.body.objectOwnership) delete req.body.objectOwnership.created
        if ('objectOwnership' in req.body && 'updated' in req.body.objectOwnership) delete req.body.objectOwnership.updated

        req.findObject._id = req.params.id

        // Check if a document with this client name and clientPrefix already exists
        if (await clientFunction.checkIfAlreadyExists(req)) throw 'ClientAlreadyExistsError'

        // Fetch the doc
        const doc = await clientModel.findOne(req.findObject)
        if (!doc) throw 'ClientNotFoundError'

        const updatedDoc = lodash.merge(doc, req.body)

        // Remove _id as this cannot be modified
        delete updatedDoc._id

        // Find the document and update it
        await clientModel.findOneAndUpdate({ _id: req.params.id }, updatedDoc, { runValidators: true })

        // Retrieve the document and return as response
        const newDoc = await clientModel.findById(req.params.id).lean()

        res.data = await clientFunction.cleanResponse(req, [newDoc])
    } catch (error) {
        throw error
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function remove(req) {
    logger.func(`clients/index.js -> remove()`)

    try {
        // console.log(req.findObject)
        // console.log(util.inspect(req.findObject, { depth: null, colors: true }))

        // Find the client (does it exist?)
        const clientToDelete = await clientModel.findOne(req.findObject).lean()
        if (!clientToDelete) throw 'ClientNotFoundError'

        // Clients cannot be deleted if they have Integrations
        const integrations = await integrationModel.find({ client: clientToDelete._id }).lean()
        if (integrations.length > 0) throw 'ClientCannotBeDeletedWithDependentsError'

        // Delete the client
        await clientModel.findByIdAndDelete(req.params.id)
    } catch (error) {
        throw error
    }
}
