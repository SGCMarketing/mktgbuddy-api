// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// schema.js
// Integration schema.
//
// Created 9th October 2024
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 09/10/2024, Andy Chadbourne, original release.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'

const { Schema } = mongoose

import { integrationPartnersShortName } from '../integrationPartners/partners.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const rawSchema = {
    client: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'client' },

    integrationPartner: { type: String, required: true, enum: { values: integrationPartnersShortName } },

    authentication: {
        method: { type: String, enum: { values: ['I will authenticate', 'Send via email', 'Send via SMS'] }, required: true },
        status: { type: String, enum: { values: ['Send for approval', 'Sent for approval', 'Approved', 'Rejected', 'Connected', 'Disconnected'], required: true, default: 'Send for approval' } },
        sendTo: {
            sms: {
                type: {
                    number: { type: String },
                    at: { type: Date }
                },
                required: false,
                _id: false
            },
            email: {
                type: {
                    address: { type: String, required: true },
                    at: { type: Date }
                },
                required: false,
                _id: false
            }
        }
    },

    connection: {
        api: { key: { type: String }, secret: { type: String } },
        authentication: {
            authCode: { type: String },
            token: { type: String },
            refreshToken: { type: String },
            serverPrefix: { type: String },
            apiEndPoint: { type: String }
        }
    },

    schemaVersion: { type: String, required: true, default: '1.0.0' }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Schema
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const IntegrationSchema = new mongoose.Schema(rawSchema, { timestamps: true })

export default mongoose.model('integration', IntegrationSchema, 'integration')
