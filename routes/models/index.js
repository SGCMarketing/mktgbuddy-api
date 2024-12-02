// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// index.js
// Handles the /campaigns requests.
//
// Created 14th Dec 2021
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 14/12/2021, Andy Chadbourne, original release.
// 1.0.1, 07/02/2023, Andy Chadbourne, added 'all' option to respond with every model.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import logger from '../../utils/logger.js'
import sortObjectKeys from 'sort-object-keys'

import { rawSchema as budgetModel } from '../budgets/schema.js'
import { rawSchema as clientModel } from '../clients/schema.js'
import { rawSchema as integrationModel } from '../integrations/schema.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _iterate = (obj) => {
    Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'object') {
            _iterate(obj[key])
        }

        if (typeof obj[key] === 'function') {
            obj[key] = obj[key].name
        }
    })
    return obj
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _tidyUp = (object) => {
    var newObj = JSON.parse(JSON.stringify(object))
    delete newObj.id
    delete newObj._id
    delete newObj.__v
    delete newObj.schemaVersion

    return sortObjectKeys(newObj)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// READ
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function read(request, response) {
    logger.func(`models/index.js -> read()`)

    var newObj

    response.data = []

    switch (request.params.id) {
        case 'budget':
            newObj = _tidyUp(_iterate({ ...budgetModel }))
            response.data = [{ _name: 'Budget', model: JSON.parse(JSON.stringify(newObj)) }]
            break

        case 'client':
            newObj = _tidyUp(_iterate({ ...clientModel }))
            response.data = [{ _name: 'Client', model: JSON.parse(JSON.stringify(newObj)) }]
            break

        case 'integration':
            newObj = _tidyUp(_iterate({ ...integrationModel }))
            response.data = [{ _name: 'Integration', model: JSON.parse(JSON.stringify(newObj)) }]
            break

        default:
            break
    }
}
