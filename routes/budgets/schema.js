// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// budgets.js
// Budgets schema.
//
// Created 5th October 2024
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Version history
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 1.0.0, 05/10/24, Andy Chadbourne, original release.

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'
import sharedSchema from '../sharedSchema.js'

export const rawSchema = {
    client: { type: mongoose.Schema.Types.ObjectId, required: [true, '<sgcError>Client must be provided.</sgcError>'], ref: 'client' },

    code: { type: Number, required: true },
    name: { type: String, required: [true, '<sgcError>Budgets must have a name.</sgcError>'] },
    description: { type: String },

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
        approved: {
            by: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
            date: { type: Date, ref: 'user' }
        }
    },

    options: {
        isLocked: { type: Boolean }
    },

    budgetPeriod: {
        from: { type: Date, required: [true, '<sgcError>Budgets must have a from period.</sgcError>'] }
    },

    values: [
        {
            category: { type: String, enum: { values: sharedSchema.budgetCategories } },
            subCategory: [
                {
                    name: { type: String, enum: { values: sharedSchema.budgetCategoriesDetailed } },
                    month: [{ offset: { type: Number }, budget: { amount: { type: Number }, notes: { type: String } }, spend: { amount: { type: Number }, notes: { type: String } } }]
                }
            ]
        }
    ],

    schemaVersion: { type: String, required: true, default: '1.0.0' }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Schema
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const BudgetSchema = new mongoose.Schema(rawSchema, { timestamps: true })

export default mongoose.model('budget', BudgetSchema, 'budgets')
