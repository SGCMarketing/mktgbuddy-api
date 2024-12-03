import logger from './logger.js'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

import userModel from '../routes/users/schema.js'

import * as Client from '../routes/clients/index.js'
import * as Dashboard from '../routes/dashboards/index.js'
import * as User from '../routes/users/index.js'
import * as Integration from '../routes/integrations/index.js'
import * as IntegrationAppoval from '../routes/integrationApproval/index.js'
import * as IntegrationPartner from '../routes/integrationPartners/index.js'
import * as Models from '../routes/models/index.js'

import clientModel from '../routes/clients/schema.js'

const model = {
    clients: Client,
    dashboards: Dashboard,
    integrations: Integration,
    integrationApproval: IntegrationAppoval,
    integrationPartners: IntegrationPartner,
    users: User,
    models: Models
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// checkPassword
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function isPasswordValid(password) {
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/.test(String(password))
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// isEmailValid
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function isEmailValid(email) {
    if (typeof email !== 'string') return false // Check for valid string input
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return emailRegex.test(email.toLowerCase())
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// isUserAdmin
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function isUserAdmin(req) {
    const user = await userModel.findById(req.authData._id)
    return user && user.options && user.options.isAdmin === true
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// isUserSuperAdmin
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function isUserSuperAdmin(req) {
    const user = await userModel.findById(req.authData._id)
    return user && user.options && user.options.isSuperAdmin === true
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// checkAuth
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function checkAuth(req) {
    logger.func(`check.js -> checkAuth()`)

    try {
        // Verify JWT token
        const authData = await jwt.verify(req.headers.token, process.env.TOKEN_ACCESS_SECRET)
        delete authData.iat
        delete authData.exp

        // Check if the User exists
        const user = await userModel.findById(authData._id)
        if (!user) throw 'UserNoTokenError'
        if (!user.refreshToken) throw 'UserLoginExpiredError'
        if (user.options.isEnabled != true) throw 'UserDisabledError'

        req.authData = authData
        return
    } catch (error) {
        // Handle specific JWT and auth errors
        if (error.name === 'TokenExpiredError') throw 'UserLoginExpiredError'
        else if (error.name === 'JsonWebTokenError') throw 'UserNoTokenError'
        else throw error // Re-throw any other errors
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// preCheck
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function preCheck(req) {
    logger.func(`check.js -> preCheck()`)

    req.findObject = {}

    // Validate JSON body for PATCH and POST requests
    if ((req.method === 'PATCH' || req.method === 'POST') && Object.keys(req.body).length === 0) throw 'InvalidJSONBodyError'

    // Validate ID if provided in params
    if (req.params.id) {
        if (!mongoose.isValidObjectId(req.params.id)) throw 'InvalidIDError'
        req.findObject._id = req.params.id
    }

    // Ensure token user exists
    if (
        (req.params.object !== 'users' || req.method !== 'POST') &&
        (req.params.object !== 'integrationPartners' || req.method !== 'GET') &&
        (req.params.object !== 'integrationApproval' || req.method !== 'PATCH') &&
        (req.params.object !== 'auth/login' || req.method !== 'POST')
    ) {
        if (!(await userModel.findById(req.authData._id))) throw new Error('TokenError')
    }

    if (req.method) {
        // If the object is a User then return only the User logged in, otherwise return any objects owned or shared by this User
        if (req.params.object === 'users' || req.params.object === 'integrationApproval') {
            req.findObject = { _id: req?.authData?._id }
        } else if (req.params.object === 'clients') {
            req.findObject = {
                $and: [...(req?.params?.id ? [{ _id: req.params.id }] : [])]
            }
        } else {
            // Limit the request to objects owned by the Clients which the User has access to - either ownedBy or sharedWith
            const clients = await clientModel
                .find({ $or: [{ 'objectOwnership.owned.by': req.authData._id }, { 'objectOwnership.sharedWith.user': req.authData._id }] })
                .collation({ locale: 'en', strength: 1 })
                .lean()
                .select('_id name')

            const clientIds = clients.map((client) => client._id.toString())

            req.findObject = {
                $and: [{ client: { $in: clientIds } }, ...(req?.params?.id ? [{ _id: req.params.id }] : [])]
            }
        }

        // If patching a client with the 'removeShare' option then don't check the permissions
        if (req?.method === 'PATCH' && req?.params?.object === 'clients' && req?.params?.option === 'removeShare') {
            req.findObject.$or = [{ 'objectOwnership.owned.by': req.authData._id }, { 'objectOwnership.sharedWith.user': req.authData._id }]
        } else {
            // If being deleted or updated then update the objectOwnership
            // if (req.method === 'DELETE' || req.method === 'PATCH')
            //     req.findObject.$or = [{ 'objectOwnership.owned.by': req.authData._id }, { $and: [{ 'objectOwnership.sharedWith.user': req.authData._id, [`objectOwnership.sharedWith.${req.params.object}.canDelete`]: true }] }]
        }
    } else throw 'APICallNotSupported'

    // Trim request data
    delete req.body.schemaVersion
    if (req.body.options) {
        // Remove isSuperAdmin from options if it exists
        delete req.body.options.isSuperAdmin

        // Remove options if it's now an empty object
        if (Object.keys(req.body.options).length === 0) delete req.body.options
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    model,
    isPasswordValid,
    isEmailValid,
    isUserAdmin,
    isUserSuperAdmin,
    checkAuth,
    preCheck
}
