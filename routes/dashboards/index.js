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
import dashboardModel from './schema.js'
import logger from '../../utils/logger.js'

import dashboardFunction from './functions.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CREATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function create(req, res) {
    logger.func(`dashboards/index.js -> create()`)

    try {
        if (!req?.body?.client) throw 'DashboardMustHaveClientError'
        if (!req?.body?.name) throw 'DashboardMustHaveNameError'

        req.body = dashboardFunction.cleanRequest(req)

        req.body.objectOwnership = {
            created: { by: req.authData._id },
            updated: { by: req.authData._id }
        }

        // When a Dashboard is created, create the initial 2 pages
        if (!req.body?.page)
            req.body.page = [
                {
                    title: 'Replace this with your title',
                    subTitle: 'Replace this with your sub-title',
                    type: 'Title'
                },
                {
                    title: 'Replace this with your title',
                    subTitle: 'Replace this with your sub-title',
                    type: 'Layout'
                }
            ]

        // Create the new document
        const doc = new dashboardModel(req.body)

        // Save the document
        await doc.save()
        logger.info(`Created document with ID ${doc.id}`)

        // Retrieve the document and return as res
        const newDoc = await dashboardModel
            .findById(doc.id)
            .lean()
            .populate([{ path: 'client', select: { _id: 1, name: 1 } }])
        res.data = [newDoc]
    } catch (error) {
        throw error
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// READ
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function read(req, res) {
    logger.func(`dashboards/index.js -> read()`)

    // Fetch the docs
    let docs = await dashboardModel
        .find(req.findObject)
        .collation({ locale: 'en', strength: 1 })
        .lean()
        .select()
        .populate([{ path: 'client', select: { _id: 1, name: 1, brand: 1 } }])

    // Set the response data
    res.data = dashboardFunction.cleanResponse(docs)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPDATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function update(req, res) {
    logger.func(`dashboards/index.js -> update()`)

    // Fetch the doc
    const doc = await dashboardModel.findOne(req.findObject).lean()
    if (!doc) throw 'DashboardNoDashboardError'

    // Merge the existing record with the new (stop things like options being overidden)
    function customMerge(objValue, srcValue) {
        // If both objValue and srcValue are arrays, replace the original array with the new one
        if (lodash.isArray(objValue) && lodash.isArray(srcValue)) {
            return srcValue
        }
    }

    // Use lodash's mergeWith to apply custom logic
    let updatedDoc = lodash.mergeWith(doc, req.body, customMerge)

    // Remove _id as this cannot be modified
    delete updatedDoc._id

    // Find the document and update it
    await dashboardModel.findOneAndUpdate({ _id: req.params.id }, updatedDoc, { runValidators: true })

    // Retrieve the document and return as res
    const newDoc = await dashboardModel
        .findById(req.params.id)
        .lean()
        .select()
        .populate([{ path: 'client', select: { _id: 1, name: 1, brand: 1 } }])

    res.data = dashboardFunction.cleanResponse([newDoc])
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function remove(req) {
    logger.func(`dashboards/index.js -> remove()`)

    // // Find the Dashboard (does it exist?)
    const dashboardToDelete = await dashboardModel.findOne(req.findObject).lean()
    if (!dashboardToDelete) throw 'DashboardNoDashboardError'

    // // Delete the client
    await dashboardModel.findByIdAndDelete(req.params.id)
}
