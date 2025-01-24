// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// auth.js
// Authorisation functions.
//
// Created 23rd Nov 2022
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 23/11/2022, Andy Chadbourne, original release.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import bcrypt from 'bcrypt'
import env from 'dotenv'
import jwt from 'jsonwebtoken'
import logger from '../../utils/logger.js'

import response from '../../utils/response.js'

import clientModel from '../clients/schema.js'
import integrationModel from '../integrations/schema.js'
import userModel from '../users/schema.js'

import errorMessages from '../../utils/responseErrors.js'

env.config()

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _generateAccessToken(user) {
    logger.func(`auth/index.js -> _generateAccessToken()`)
    logger.info(`Generating access token that expires in ${process.env.AUTH_TOKEN_TIMEOUT}.`)

    const userPayload = { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName }

    try {
        return {
            _id: user._id,
            email: user.email,
            authToken: await jwt.sign(userPayload, process.env.TOKEN_ACCESS_SECRET, { expiresIn: process.env.AUTH_TOKEN_TIMEOUT }),
            refreshToken: await jwt.sign(userPayload, process.env.TOKEN_REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_TIMEOUT })
        }
    } catch (error) {
        throw error
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _getModelQuantities(authData) {
    logger.func(`auth/index.js -> _getModelQuantities()`)

    // Get the Clients this user has access to
    const clients = await clientModel
        .find({ $or: [{ 'objectOwnership.owned.by': authData._id }, { 'objectOwnership.sharedWith.user': authData._id }] })
        .collation({ locale: 'en', strength: 1 })
        .lean()
        .select('_id name objectOwnership')

    // Filter Clients that are owned and shared
    const ownedClients = clients.filter((client) => client?.objectOwnership?.owned?.by?.equals(authData._id))
    const sharedClients = clients.filter((client) => !client?.objectOwnership?.owned?.by?.equals(authData._id))

    // Extract the client IDs from the clients array
    const clientIds = clients.map((client) => client._id)

    // Get Integrations where the client matches any of the client IDs
    const integrations = await integrationModel
        .find({ client: { $in: clientIds } })
        .collation({ locale: 'en', strength: 1 })
        .lean()
        .select('_id authentication.status')

    // Filter integrations based on their authentication status
    const liveIntegrations = integrations.filter((integration) => integration?.authentication?.status === 'Connected')
    const pendingIntegrations = integrations.filter((integration) => integration?.authentication?.status !== 'Connected')

    return {
        clients: { owned: ownedClients.length, shared: sharedClients.length, total: clients.length },
        integrations: {
            live: liveIntegrations.length,
            pending: pendingIntegrations.length,
            total: integrations.length
        }
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// attemptLogin
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function attemptLogin(req, res) {
    logger.func(`auth/index.js -> attemptLogin()`)

    try {
        // Check we have an email
        if (!req.body.email) throw 'AuthNoEmailError'

        // Check we have a password
        if (!req.body.password) throw 'AuthNoPasswordError'

        // Find the User and check it exists
        const user = await userModel.findOne({ email: String(req.body.email).toLowerCase() }).lean()
        if (!user) throw 'AuthNoUserFoundError'

        // Is the User enabled?
        if (!user.options || !user.options.isEnabled || user.options.isEnabled != true) throw 'AuthUserNotEnabled'

        // Check the password
        const passwordOK = await bcrypt.compare(req.body.password, user.passwordHash)
        if (passwordOK == true) {
            // Get the auth and refresh tokens
            const authData = await _generateAccessToken(user)

            // Get the stats on each model the User has
            const modelQuantities = await _getModelQuantities(authData)

            // Save the refresh token
            await userModel.findByIdAndUpdate(user._id, { refreshToken: authData.refreshToken })

            // Respond
            res.data = [{ ...authData, modelQuantities }]
        } else {
            throw 'AuthNoUserFoundError'
        }
    } catch (err) {
        throw err
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// attemptLogout
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function attemptLogout(req, res) {
    logger.func(`auth/index.js -> attemptLogout()`)

    try {
        if ('refreshtoken' in req.headers === false) throw 'UserNoTokenError'

        if (!(await userModel.findOne({ refreshToken: req.headers.refreshtoken }))) throw 'AuthLoggedOutError'

        logger.info(`Token (ending) = ...${req.headers.refreshtoken.slice(-50)}`)

        let authData = await jwt.verify(req.headers.refreshtoken, process.env.TOKEN_REFRESH_SECRET)

        // Remove the refresh token
        await userModel.findByIdAndUpdate(authData._id, { refreshToken: null })

        // Respond
        res.data = []
    } catch (error) {
        logger.error(`${logger.penStart.red}${error}${logger.penEnd}`)
        if (error.name == 'TokenExpiredError') {
            throw 'UserLoginExpiredError'
        } else if (error.name == 'JsonWebTokenError') {
            throw 'UserNoTokenError'
        } else {
            throw error
        }
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// checkToken
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function checkToken(req, res) {
    logger.func(`auth/index.js -> checkToken()`)

    try {
        if ('token' in req.headers === false) throw 'UserNoTokenError'

        const rt = req.headers.token

        logger.info(`Checking token ending ...${rt.slice(-50)}`)

        // Verify the access token
        let authData = await jwt.verify(rt, process.env.TOKEN_ACCESS_SECRET)

        // Check if the refreshToken is still valid (not null) in the database
        const user = await userModel.findById(authData._id)
        if (!user || !user.refreshToken) throw 'AuthLoggedOutError' // Token has been invalidated

        // Token is valid, proceed with returning user data
        const expiresIn = authData.exp - Date.now() / 1000
        const expiresInMins = Math.floor(expiresIn / 60)
        const expiresInSecs = Math.floor(expiresIn - expiresInMins * 60)
        authData.refreshTokenExpiresInMins = expiresInMins
        authData.refreshTokenExpiresInSecs = expiresInSecs

        delete authData.exp
        delete authData.iat

        const modelQuantities = await _getModelQuantities(authData)

        res.data = [{ ...authData, modelQuantities }]
    } catch (error) {
        if (error.name == 'TokenExpiredError') throw 'UserLoginExpiredError'
        else if (error.name == 'JsonWebTokenError') throw 'UserNoTokenError'
        else throw error
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Helper function for auth routes
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const handleAuthRequest = (action) => async (req, res) => {
    logger.func(`auth/index.js -> handleAuthRequest()`)

    try {
        logger.request(req)
        await action(req, res)
        await response.sendSuccessResponse(req, res)
    } catch (err) {
        if (err?.stack) {
            logger.error(`${err.stack}`)
            await response.sendErrorResponse(res, { name: 'APIUnknownError', message: errorMessages['APIUnknownError'] })
        } else {
            logger.error(err)
            await response.sendErrorResponse(res, err)
        }
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// refreshToken
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function refreshToken(req, res) {
    logger.func(`auth/index.js -> refreshToken()`)

    try {
        if ('refreshtoken' in req.headers === false) throw 'UserNoTokenError'

        const rt = req.headers.refreshtoken

        if (!(await userModel.findOne({ refreshToken: rt }))) throw 'UserNoTokenError'

        logger.info(`Refreshing token ending ...${rt.slice(-50)}`)

        let refreshData = await jwt.verify(rt, process.env.TOKEN_REFRESH_SECRET)

        let authData = await _generateAccessToken(refreshData)
        delete authData.refreshToken

        const modelQuantities = await _getModelQuantities(authData)

        res.data = [{ ...authData, modelQuantities }]
    } catch (error) {
        if (error.name == 'TokenExpiredError') throw 'UserLoginExpiredError'
        else if (error.name == 'JsonWebTokenError') throw error
        else throw error
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    attemptLogin,
    attemptLogout,
    checkToken,
    handleAuthRequest,
    refreshToken
}
