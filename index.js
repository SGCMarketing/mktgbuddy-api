import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import env from 'dotenv'
import http from 'http'
import https from 'https' // Add https
import fs from 'fs' // Add fs to read certificate files

import auth from './routes/auth/index.js'
import request from './utils/request.js'
import response from './utils/response.js'
import logger from './utils/logger.js'
import { SETTINGS_VERSION_NUMBER } from './settings.js'

import clientFunction from './routes/clients/functions.js'

env.config()

const app = express()
app.use(bodyParser.json())
app.use(cors())
app.use(express.json()) // Parses incoming JSON

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Auth routes
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
app.post('/auth/login', auth.handleAuthRequest(auth.attemptLogin))
app.post('/auth/logout', auth.handleAuthRequest(auth.attemptLogout))
app.post('/auth/checkToken', auth.handleAuthRequest(auth.checkToken))
app.post('/auth/refreshToken', auth.handleAuthRequest(auth.refreshToken))

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Client logo
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
app['get']('/client/:id/logo', async (req, res) => {
    logger.info(`Client logo requested for client ${req?.params?.id}`)
    const logo = await clientFunction.getLogo(req, res)
    res.setHeader('Content-Type', logo.imageType)
    res.end(logo.buffer)
})
app['get']('/client/:id/backgroundLogo', async (req, res) => {
    logger.info(`Client backgroundLogo requested for client ${req?.params?.id}`)
    const logo = await clientFunction.getBackgroundLogo(req, res)
    res.setHeader('Content-Type', logo.imageType)
    res.end(logo.buffer)
})

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CRUD routes
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const crudMethods = ['post', 'get', 'patch', 'delete']
crudMethods.forEach((method) => {
    // Route with :object and :id and :option
    app[method]('/:object/:id/:option?', async (req, res) => {
        await request.processRequest(req, res)
    })

    // Route with only :object
    app[method]('/:object', async (req, res) => {
        await request.processRequest(req, res)
    })
})

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Catch-all route for unsupported API calls
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const unsupportedMethods = ['put', 'copy', 'link', 'unlink', 'purge', 'lock', 'unlock', 'propfind']
unsupportedMethods.forEach((method) => {
    app[method]('/*', async (req, res) => {
        await response.sendErrorResponse(res, 'APICallNotSupported')
    })
})

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Error-handling middleware for invalid JSON
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
app.use(async (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        await response.sendErrorResponse(res, 'InvalidJSONBodyError')
    } else {
        next(err) // Pass the error to the next middleware if it's not handled
    }
})

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Main entry point
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function main() {
    console.clear()
    logger.func(`index.js -> main()`)
    logger.info(`Starting mktgBuddy API version ${SETTINGS_VERSION_NUMBER}.`)

    if (!process.env.MONGODB_URI) {
        logger.error('Could not find environment variable MONGODB_URI. Service will now terminate.')
        return
    }

    try {
        // const connection = await mongoose.connect(process.env.MONGODB_URI)
        // logger.info(`Connected to ${connection.connections[0].name} database hosted at ${connection.connections[0].host}:${connection.connections[0].port}.`)

        let server

        // SSL options
        let httpsOptions = {}
        if (process?.env?.BUILD_LOCATION === 'local') {
            logger.info('API is running locally so loading SSL certificates.')
            httpsOptions = { key: fs.readFileSync('server.key'), cert: fs.readFileSync('server.cert') }
            server = await https.createServer(httpsOptions, app).listen(process.env.LOCAL_PORT, '0.0.0.0')
        } else {
            logger.info('API is running remotely.')
            server = await http.createServer(app).listen(process.env.LOCAL_PORT, '0.0.0.0')
        }

        logger.info(`API ready on port ${process.env.LOCAL_PORT}.`)

        // Add an error handler to capture server errors like EADDRINUSE
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port is already in use. Please use a different port.`)
            } else {
                logger.error(`${error}`)
            }
        })
    } catch (err) {
        if (err?.stack) logger.error(`${err.stack}`)
        else logger.error(`${err}`)
    }
}

main()
