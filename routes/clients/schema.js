// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// schema.js
// Client schema.
//
// Created 13th Dec 2022
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 13/12/2021, Andy Chadbourne, original release.
// 1.0.1. 25/07/2022, Andy Chadbourne, changed regularDay start/end from strings to Date objects.
// 1.0.2, 24/10/2022, Andy Chadbourne, removed 'url' from brand.logo.
// 1.0.3, 25/10/2022, Andy Chadbourne, added website and email + made urlPrefix unique + added street1 + linkedInPage.
// 1.0.4, 04/01/2023, Andy Chadbourne, added 'addVAT' to contract->rate.
// 1.0.5, 12/01/2023, Andy Chadbourne, added 'twitterURL', 'facebookURL','youtubeURL', 'options' and 'yourPercentage' to contract->rate.
// 2.0.0, 03/09/2024, Andy Chadbourne, updated for v3 API.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'
import sharedSchema from '../sharedSchema.js'

const permissions = {
    canCreate: { type: Boolean, required: true, default: true },
    canRead: { type: Boolean, required: true, default: true },
    canUpdate: { type: Boolean, required: true, default: false },
    canDelete: { type: Boolean, required: true, default: false }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Schema
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const rawSchema = {
    name: {
        type: String,
        required: [true]
    },

    objectOwnership: {
        created: {
            by: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' }
        },
        owned: {
            by: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' }
        },
        updated: {
            by: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' }
        },
        sharedWith: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
                element: {
                    budgets: { permissions },
                    crm: { permissions },
                    dashboards: { permissions },
                    integrations: { permissions },
                    lists: { permissions }
                },
                _id: false
            }
        ]
    },

    options: {
        isPartner: { type: Boolean, required: true, default: false },
        isDeleted: { type: Boolean, required: true, default: false }
    },

    contact: {
        address: sharedSchema.address,
        phone: { type: String },
        website: { type: String },
        domain: { type: String },
        email: { type: String },
        socials: {
            linkedInURL: { type: String },
            xURL: { type: String },
            facebookURL: { type: String },
            youtubeURL: { type: String },
            instagramURL: { type: String }
        }
    },

    contract: {
        date: {
            from: { type: Date },
            to: { type: Date }
        },
        rate: {
            amount: { type: Number, min: 0 },
            duration: { type: String, enum: { values: ['per hour', 'per day', 'per month', 'per year'] } },
            addVAT: { type: Boolean }
        },
        invoiceViaPartner: {
            client: { type: mongoose.Schema.Types.ObjectId, ref: 'client' },
            yourPercentage: { type: Number, min: 0, max: 100 }
        }
    },

    clientPrefix: {
        type: String,
        required: [true],
        uppercase: true,
        minlength: 4,
        maxlength: 4
    },

    brand: {
        primaryColour: { type: String },
        secondaryColour: { type: String },
        primaryBackgroundColour: { type: String },
        secondaryBackgroundColour: { type: String },
        logo: { type: String },
        backgroundLogo: { type: String }
    },

    nextCode: {
        budget: { type: Number, required: true, default: 0 },
        dashboard: { type: Number, required: true, default: 0 }
    },

    schemaVersion: { type: String, required: true, default: '2.0.0' }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Export
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const ClientSchema = new mongoose.Schema(rawSchema, { timestamps: true })

export default mongoose.model('client', ClientSchema, 'clients')
