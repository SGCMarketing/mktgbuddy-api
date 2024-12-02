// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// schema.js
// Dashboard schema.
//
// Created 24th Oct 2024
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 24/10/2024, Andy Chadbourne, original release.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Schema
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const rawSchema = {
    name: { type: String },

    client: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'client' },

    objectOwnership: {
        created: {
            by: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' }
        },
        updated: {
            by: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' }
        }
    },

    options: {
        backgroundColour: { type: String },
        foregroundColour: { type: String },
        useBackgroundLogo: { type: Boolean, default: false }
    },

    page: [
        {
            name: { type: String },
            title: { type: String },
            subTitle: { type: String },
            type: { type: String, enum: { values: ['Title', 'Layout', 'End'] }, default: 'Layout' },
            options: {
                titleIsHidden: { type: Boolean, default: false },
                isHidden: { type: Boolean, default: false }
            },
            tile: [
                {
                    title: { type: String },
                    position: {
                        x: { type: Number },
                        y: { type: Number },
                        width: { type: Number },
                        height: { type: Number },
                        minHeight: { type: Number },
                        maxHeight: { type: Number },
                        minWidth: { type: Number },
                        maxWidth: { type: Number }
                    },
                    integration: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'integration' },
                    integratioObject: { type: String },
                    integrationTile: { type: String },
                    showAsChart: { type: Boolean },
                    showComparison: { type: Boolean },
                    filterOr: [
                        {
                            property: { type: String },
                            comparison: { type: String, enum: { values: ['Less than', 'Equal to', 'Greater than'] } },
                            value: { type: Number }
                        }
                    ],
                    filterAnd: [
                        {
                            property: { type: String },
                            comparison: { type: String, enum: { values: ['Less than', 'Equal to', 'Greater than'] } },
                            value: { type: Number }
                        }
                    ],
                    data: [
                        {
                            monthCommencing: { type: Date },
                            value: { type: Number },
                            values: []
                        }
                    ],
                    compareData: [
                        {
                            monthCommencing: { type: Date },
                            value: { type: Number },
                            values: []
                        }
                    ],
                    dataLastAcquiredAt: { type: Date }
                }
            ]
        }
    ],

    schemaVersion: { type: String, required: true, default: '1.0.0' }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Export
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const DashboardSchema = new mongoose.Schema(rawSchema, { timestamps: true })

export default mongoose.model('dashboard', DashboardSchema, 'dashboards')
