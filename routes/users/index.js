// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// index.js
// Handles the /user reqs.
//
// Created 25th Nov 2021
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 25/11/2021, Andy Chadbourne, original release.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import bcrypt from 'bcrypt'
import dot from 'dot-object'

import userModel from './schema.js'

import logger from '../../utils/logger.js'
import check from '../../utils/check.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CREATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function create(req, res) {
    logger.func(`users/index.js -> create()`)

    // Check if all data has been provided
    if (!req.body.email || !req.body.password) {
        throw 'UserCannotCreateUserMissingInformation'
    }

    // Is email valid?
    if (!check.isEmailValid(req.body.email)) {
        throw 'UserEmailIsInavlid'
    }

    // Is password valid?
    if (!check.isPasswordValid(req.body.password)) {
        throw 'UserPasswordIsInavlid'
    }

    // Hash and replace password
    var passwordHash = await bcrypt.hash(req.body.password, 10)
    delete req.body.password
    req.body.passwordHash = passwordHash

    // Enable & create User
    var user = new userModel(req.body)
    user.email = String(user.email).toLowerCase()

    // Save & respond
    try {
        await user.save()
        logger.info(`User created with ID ${user.id}`)
        var newUser = await userModel.findById(user.id).lean()

        res.data = [newUser]
    } catch (error) {
        if (error.name == 'MongoServerError') {
            throw 'UserAlreadyExistsError'
        } else {
            logger.error(error)
            throw error
        }
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// READ
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function read(req, res) {
    logger.func(`users/index.js -> read()`)
    logger.info('Returning full record(s)')

    let users = await userModel.find(req.findObject).collation({ locale: 'en', strength: 2 }).select().lean()

    for (var user in users) {
        // Remove the refresh token
        delete users[user].refreshToken
    }

    res.data = users
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPDATE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function update(req, res) {
    logger.func(`users/index.js -> update()`)

    const userToUpdate = await userModel.findById(req.params.id).lean()
    if (!userToUpdate) {
        throw 'UserNotFoundError'
    }

    let users = await userModel.find({ email: req.body.email }).collation({ locale: 'en', strength: 2 }).select().lean()
    if (users && users.length === 1 && users[0]._id !== req.params.id) {
        throw 'UserAlreadyExistsError'
    }

    // Refresh tokens cannot be altered or removed
    if ('refreshToken' in req.body) {
        delete req.body.refreshToken
    }

    // Users cannot enable or disable themselves - this would deactivate them
    if (req.body.options?.isEnabled !== undefined && req.params.id === req.authData._id) {
        req.body.options.isEnabled = userToUpdate.options.isEnabled
    }

    // Hash and replace password
    if (req?.body?.password) {
        var passwordHash = await bcrypt.hash(req.body.password, 10)
        delete req.body.password
        req.body.passwordHash = passwordHash
    }

    // Do the update
    await userModel.findOneAndUpdate({ _id: req.params.id }, { $set: dot.dot(req.body) }, { runValidators: true })

    let updatedUser = await userModel.findById(req.params.id).lean()
    updatedUser.refreshToken = undefined

    res.data = [updatedUser]
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function remove(req) {
    logger.func(`users/index.js -> remove()`)

    // TODO Check that this user can delete the client
    if (req.authData._id !== req.params.id) {
        throw 'UserCannotDeleteError'
    }

    // Find the client (does it exist?)
    const userToDelete = await userModel.findOne(req.findObject).lean()
    if (!userToDelete) throw 'UserNotFoundError'

    // Delete the client
    await userModel.findByIdAndDelete(req.params.id)
}
