import axios from 'axios'
import logger from '../../../../utils/logger.js'
import lodash from 'lodash'
import dateUtils from '../../../../utils/dateUtils.js'

let processingCall = false

// Make the call to the HubSpot API.
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _doAPICall(uri, body, token, returnData = false) {
    logger.func('integrationPartners/partners/hubSpot/api.js -> _doAPICall()')

    body.limit = returnData ? 200 : 0

    let waitLoop = 0
    while (processingCall && waitLoop < 4) {
        waitLoop++
    }

    processingCall = true
    try {
        const resp = await axios.post(uri, body, {
            headers: { Authorization: `Bearer ${token}` }
        })

        await new Promise((resolve) => setTimeout(resolve, 1))
        return resp
    } catch (err) {
        console.dir(err?.response?.data || err)
        throw err
    } finally {
        processingCall = false
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _fetchTotalObjectsByMonth(object, token, year, month, body = {}, dateObject = 'createdate') {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalObjectsByMonth(${object})`)

    let filterDate = new Date()
    let firstDayOfMonth = new Date(Date.UTC(filterDate.getUTCFullYear(), filterDate.getUTCMonth() - 11, 1))
    let lastDayOfMonth = new Date(Date.UTC(filterDate.getUTCFullYear(), filterDate.getUTCMonth() + 1, 0))

    if (typeof year === 'number' && typeof month === 'number') {
        filterDate = new Date(Date.UTC(year, month - 1, 1))
        firstDayOfMonth = new Date(Date.UTC(filterDate.getUTCFullYear() - 1, filterDate.getUTCMonth() + 1, 1))
        lastDayOfMonth = new Date(Date.UTC(filterDate.getUTCFullYear(), filterDate.getUTCMonth() + 1, 0))
    }
    logger.info(`Getting data for the period ${firstDayOfMonth.toISOString().split('T')[0]} to ${lastDayOfMonth.toISOString().split('T')[0]}.`)

    let monthData = dateUtils.getEmpty12MonthArray(filterDate)

    // Get all objects
    const response = await _fetchObjects(object, token, body, true)

    if (body?.properties) {
        body?.properties.forEach((property) => {
            monthData.forEach((month) => {
                month[property] = {}
            })
        })
    }

    // Process each object retrieved from the API
    let cumulativeMonthTotal = 0
    response.data.forEach((obj) => {
        const createdDate = new Date(obj.properties[dateObject])
        const createdYear = createdDate.getUTCFullYear()
        const createdMonth = createdDate.getUTCMonth() + 1

        // Find the corresponding monthData entry and increment if found
        const monthEntry = monthData.find((entry) => entry.year === createdYear && entry.month === createdMonth)
        if (monthEntry) {
            cumulativeMonthTotal++
            monthEntry.newThisMonth++

            if (body?.properties) {
                body?.properties.forEach((property) => {
                    if (obj?.properties[property]) {
                        if (monthEntry[property][obj.properties[property]]) {
                            monthEntry[property][obj.properties[property]]++
                        } else {
                            monthEntry[property][obj.properties[property]] = 1
                        }
                    }
                })
            }
        }
    })

    // Sort monthData by year first, then by month
    monthData.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        else return a.month - b.month // If years are equal, sort by month
    })

    let previousTotal = response.data.length - cumulativeMonthTotal
    monthData.forEach((entry) => {
        entry.total = previousTotal + entry.newThisMonth
        previousTotal = entry.total
    })

    return {
        total: response.total,
        data: monthData
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _fetchObjects(object, token, body = {}, returnData = false) {
    logger.func('integrationPartners/partners/hubSpot/api.js -> _fetchObjects()')

    const filter = { ...body }

    const results = []
    let total = 0
    let hasMore = true
    let callCount = 0

    while (hasMore && callCount < 25) {
        logger.info(`Fetching records ${body.after || 1} onwards ...`)
        const response = await _doAPICall(`https://api.hubapi.com/crm/v3/objects/${object}/search`, body, token, returnData)

        total = response.data.total
        if (response?.data?.results) results.push(...response.data.results)

        body.after = response?.data?.paging?.next?.after
        hasMore = !!body.after
        if (!returnData) hasMore = false

        callCount++
    }

    if (callCount === 25) logger.info('Warning, call count limit hit. Data may be incomplete!')

    return { total, data: results.length > 0 ? results : undefined, filter: Object.keys(filter).length > 0 ? filter : undefined }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _fetchTotalQualifiedObjectByMonth(object, token, year, month, qualifiedProperty) {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalQualifiedObjectByMonth()`)

    const body = {
        properties: ['name', qualifiedProperty],
        filterGroups: [
            {
                filters: [
                    {
                        propertyName: qualifiedProperty,
                        operator: 'HAS_PROPERTY'
                    }
                ]
            }
        ]
    }

    return _fetchTotalObjectsByMonth(object, token, year, month, body, qualifiedProperty)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _fetchTotalObjects(object, token, year, month, filter = { and: [], or: [] }) {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalObjects()`)

    // Create the filter
    let body = {}

    let dateFilter = {}

    // If year and month exists then create a date filter
    if (year !== undefined && year !== 'undefined' && year !== '' && month !== undefined && month !== 'undefined' && month !== '') {
        let filterDate = new Date(Date.UTC(year, month - 1, 1))
        const date = dateUtils.getFirstAndLastDayOfTheMonth(filterDate)
        dateFilter = { propertyName: 'createdate', operator: 'LT', value: date.lastDayUnixTime }
    }

    // Check if AND filter contains data and merge it
    if (filter?.and && filter.and.length > 0) {
        if (body?.filterGroups && body.filterGroups.length === 0) body.filterGroups.push({ filters: [] })
        filter.and.forEach((f) => {
            if (Object.keys(dateFilter).length > 0) body.filterGroups[0].filters.push({ ...dateFilter })
            if (!body?.filterGroups) body.filterGroups = []
            body.filterGroups[0].filters.push(f)
        })
    }

    // Check if OR filter contains data and merge it
    if (filter?.or && filter.or.length > 0) {
        filter.or.forEach((f) => {
            let newF = []
            if (Object.keys(dateFilter).length > 0) newF.push({ ...dateFilter })
            newF.push(f)
            if (!body?.filterGroups) body.filterGroups = []
            body.filterGroups.push({ filters: newF })
        })
    }

    if (Object.keys(dateFilter).length > 0 && !body?.filterGroups) {
        body.filterGroups = [{ filters: [dateFilter] }]
    }

    return await _fetchObjects(object, token, body)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _fetchTotalMQLAndSQLCompanies(token, year, month, filters) {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalMQLAndSQLCompanies()`)

    const response = await _fetchTotalObjects('companies', token, year, month, {
        and: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'marketingqualifiedlead' }],
        or: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'salesqualifiedlead' }]
    })

    return response
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _fetchTotalCustomerAndEvangelistCompanies(token, year, month, filters) {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalCustomerAndEvangelistCompanies()`)

    const responseCustomer = await _fetchTotalLifeCycleCompanies('customer', token, year, month, filters)
    const responseEvangelist = await _fetchTotalLifeCycleCompanies('evangelist', token, year, month, filters)

    return {
        total: responseCustomer.total + responseEvangelist.total,
        customerTotal: responseCustomer.total,
        evangelistTotal: responseEvangelist.total
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function _fetchTotalMQLAndSQLCompaniesPerMonth(token, year, month, filters) {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalMQLAndSQLCompaniesPerMonth()`)

    const responseMQL = await _fetchTotalQualifiedObjectByMonth('companies', token, year, month, 'hs_date_entered_marketingqualifiedlead')
    const responseSQL = await _fetchTotalQualifiedObjectByMonth('companies', token, year, month, 'hs_date_entered_salesqualifiedlead')

    const combined = lodash.mergeWith(
        lodash.keyBy(responseMQL.data, (item) => `${item.year}-${item.month}`),
        lodash.keyBy(responseSQL.data, (item) => `${item.year}-${item.month}`),
        (objValue, srcValue) => {
            if (lodash.isObject(objValue) && lodash.isObject(srcValue)) {
                return {
                    year: objValue.year,
                    month: objValue.month,
                    newThisMonth: (objValue.newThisMonth || 0) + (srcValue.newThisMonth || 0),
                    total: (objValue.total || 0) + (srcValue.total || 0)
                }
            }
            return objValue || srcValue
        }
    )

    const result = lodash.values(combined)

    return {
        total: responseMQL.total + responseSQL.total,
        data: result
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _fetchTotalCompaniesByMonthBySource = async (token, year, month, filters) => {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalCompaniesByMonthBySource()`)

    const body = { properties: ['hs_analytics_source'] }
    return await _fetchTotalObjectsByMonth('companies', token, year, month, body)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _fetchTotalEmails = async (key, token, year, month, filters) => {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalEmailsSent()`)

    const date = _getFirstAndLastDayOfMonth(year, month)

    try {
        const resp = await axios.get(`https://api.hubapi.com/marketing/v3/emails/statistics/histogram?interval=MONTH&startTimestamp=${date.firstDayOfMonth}&endTimestamp=${date.lastDayOfMonth}`, { headers: { Authorization: `Bearer ${token}` } })

        if (resp?.data?.results.length === 1) {
            let ratio = `${Math.ceil(parseFloat(resp?.data.results[0]?.aggregations?.ratios[`${key}ratio`] || 0) * 100) / 100}%`
            return { total: resp?.data.results[0]?.aggregations?.counters[key], ratio: resp?.data.results[0]?.aggregations?.ratios[`${key}ratio`] ? ratio : undefined }
        }

        return { total: 0 }
    } catch (err) {
        throw err
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _fetchTotalEmailsByMonth = async (key, token, year, month, filters) => {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _fetchTotalEmailsSent()`)

    const yearMonthStart = _get11MonthsPreceding(year, month)
    const dateStart = _getFirstAndLastDayOfMonth(yearMonthStart.year, yearMonthStart.month)
    const dateEnd = _getFirstAndLastDayOfMonth(year, month)

    try {
        const resp = await axios.get(`https://api.hubapi.com/marketing/v3/emails/statistics/histogram?interval=MONTH&startTimestamp=${dateStart.firstDayOfMonth}&endTimestamp=${dateEnd.lastDayOfMonth}`, { headers: { Authorization: `Bearer ${token}` } })

        let data = []

        if (resp?.data?.results.length > 0) {
            let total = 0
            resp.data.results.forEach((result) => {
                const dataYear = new Date(result?.interval?.end).getUTCFullYear()
                const dataMonth = new Date(result?.interval?.end).getUTCMonth() + 1
                const newInMonth = result?.aggregations?.counters[key] || 0
                total += newInMonth
                data.push({ year: dataYear, month: dataMonth, newInMonth, total })
            })
        }

        return { total: 0, data }
    } catch (err) {
        throw err
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _combineFilters = (filter1, filter2) => {
    logger.func(`integrationPartners/partners/hubSpot/api.js -> _combineFilters()`)

    let newFilter = filter1

    // Merge AND
    if (filter2?.and && filter2.and.length > 0) {
        if (newFilter?.and) {
            filter2.and.forEach((f2) => {
                newFilter.and.push(f2)
            })
        } else newFilter.and = filter2.and
    }

    // Merge OR
    if (filter2?.or && filter2.or.length > 0) {
        if (newFilter?.or) {
            filter2.or.forEach((f2) => {
                newFilter.or.push(f2)
            })
        } else newFilter.or = filter2.or
    }

    return newFilter
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const objectFetch = {
    // COMPANY
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    company: {
        tile: [
            {
                shortName: 'totalCompanies',
                name: 'Total companies',
                description: 'Returns a single number showing the total number of companies as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('companies', token, year, month, filters)
            },
            {
                shortName: 'totalSubscriberCompanies',
                name: 'Total Subscriber companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to Subscriber, as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('companies', token, year, month, _combineFilters({ and: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'subscriber' }] }, filters))
            },
            {
                shortName: 'totalLeadCompanies',
                name: 'Total Lead companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to Lead, as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('companies', token, year, month, _combineFilters({ and: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'lead' }] }, filters))
            },
            {
                shortName: 'totalMQLCompanies',
                name: 'Total MQL companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to Marketing Qualified Lead (MQL), as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('companies', token, year, month, _combineFilters({ and: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'marketingqualifiedlead' }] }, filters))
            },
            {
                shortName: 'totalSQLCompanies',
                name: 'Total SQL companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to Sales Qualified Lead (SQL), as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('companies', token, year, month, _combineFilters({ and: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'salesqualifiedlead' }] }, filters))
            },
            {
                shortName: 'totalOpportunityCompanies',
                name: 'Total Opportunity companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to Opportunity, as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('companies', token, year, month, _combineFilters({ and: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'opportunity' }] }, filters))
            },
            {
                shortName: 'totalCustomerCompanies',
                name: 'Total Customer companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to Customer, as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('companies', token, year, month, _combineFilters({ and: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'customer' }] }, filters))
            },
            {
                shortName: 'totalEvangelistCompanies',
                name: 'Total Evangelist companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to Evangelist, as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('companies', token, year, month, _combineFilters({ and: [{ propertyName: 'lifecyclestage', operator: 'EQ', value: 'evangelist' }] }, filters))
            },
            {
                shortName: 'totalMQLAndSQLCompanies',
                name: 'Total MQL & SQL companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to either Marketing Qualified Lead (MQL) or Sales Qualified Lead (SQL), as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalMQLAndSQLCompanies(token, year, month, filters)
            },
            {
                shortName: 'totalCustomerAndEvangelistCompanies',
                name: 'Total Customer & Evangelist companies',
                description: 'Returns a single number showing the total number of companies where lifecycle is set to Customer or Evangelist, as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalCustomerAndEvangelistCompanies(token, year, month, filters)
            },
            {
                shortName: 'totalCompaniesByMonth',
                name: 'Total companies by month',
                description: 'Returns a table or graph showing the total number of companies created by month in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjectsByMonth('companies', token, year, month, filters)
            },
            {
                shortName: 'totalCompaniesByMonthBySource',
                name: 'Total companies by month, by source',
                description: 'Returns a table or graph showing the total number of companies created, broken down by original traffic source, by month in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalCompaniesByMonthBySource(token, year, month, filters)
            },
            {
                shortName: 'totalLeadCompaniesByMonth',
                name: 'Total Lead companies by month',
                description: 'Returns a table or graph showing the total number of companies created by month where lifecycle is set to Lead in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalQualifiedObjectByMonth('companies', token, year, month, 'hs_date_entered_lead')
            },
            {
                shortName: 'totalMQLCompaniesByMonth',
                name: 'Total MQL companies by month',
                description: 'Returns a table or graph showing the total number of companies created by month where lifecycle is set to Marketing Qualified Lead (MQL) in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalQualifiedObjectByMonth('companies', token, year, month, 'hs_date_entered_marketingqualifiedlead')
            },
            {
                shortName: 'totalSQLCompaniesByMonth',
                name: 'Total SQL companies by month',
                description: 'Returns a table or graph showing the total number of companies created by month where lifecycle is set to Sales Qualified Lead (SQL) in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalQualifiedObjectByMonth('companies', token, year, month, 'hs_date_entered_salesqualifiedlead')
            },
            {
                shortName: 'totalOpportunityCompaniesByMonth',
                name: 'Total Opportunity companies by month',
                description: 'Returns a table or graph showing the total number of companies created by month where lifecycle is set to Opportunity in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalQualifiedObjectByMonth('companies', token, year, month, 'hs_date_entered_opportunity')
            },
            {
                shortName: 'totalCustomerCompaniesByMonth',
                name: 'Total Customer companies by month',
                description: 'Returns a table or graph showing the total number of companies created by month where lifecycle is set to Customer in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalQualifiedObjectByMonth('companies', token, year, month, 'hs_date_entered_customer')
            },
            {
                shortName: 'totalEvangelistCompaniesByMonth',
                name: 'Total Evangelist companies by month',
                description: 'Returns a table or graph showing the total number of companies created by month where lifecycle is set to Evangelist in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalQualifiedObjectByMonth('companies', token, year, month, 'hs_date_entered_evangelist')
            },
            {
                shortName: 'totalMQLAndSQLCompaniesByMonth',
                name: 'Total MQL & SQL companies by month',
                description:
                    'Returns a table or graph showing the total number of companies created by month where lifecycle is set to either Marketing Qualified Lead (MQL) or Sales Qualified Lead (SQL) in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Testing',
                func: (token, year, mont, filters) => _fetchTotalMQLAndSQLCompaniesPerMonth(token, year, month)
            }
        ]
    },

    // CONTACT
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    contact: {
        tile: [
            {
                shortName: 'totalContacts',
                name: 'Total contacts',
                description: 'Returns a single number showing the total number of contacts as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Testing',
                func: (token, year, month, filters) => _fetchTotalObjects('contacts', token, year, month, filters)
            },

            {
                shortName: 'totalContactsByMonth',
                name: 'Total contact by month',
                description: 'Returns a table or graph showing the total number of contacts created by month in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalObjectsByMonth('contacts', token, year, month, filters)
            }
        ]
    },

    // DEAL
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    deal: {
        tile: [
            {
                shortName: 'totalDeals',
                name: 'Total deals',
                description: 'Returns a single number showing the total number of deals as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalObjects('deals', token, year, month, filters)
            },
            {
                shortName: 'totalDealsByMonth',
                name: 'Total deals by month',
                description: 'Returns a table or graph showing the total number of deals created by month in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalObjectsByMonth('deals', token, year, month, filters)
            }
        ]
    },

    // EMAIL
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    marketingEmail: {
        tile: [
            {
                shortName: 'totalEmailsSent',
                name: 'Total emails sent',
                description: 'Returns a single number showing the total number of emails sent as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalEmails('sent', token, year, month, filters)
            },
            {
                shortName: 'totalEmailsDelivered',
                name: 'Total emails delivered',
                description: 'Returns a single number showing the total number of emails delivered as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalEmails('delivered', token, year, month, filters)
            },
            {
                shortName: 'totalEmailsOpened',
                name: 'Total emails opened',
                description: 'Returns a single number showing the total number of emails opened as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalEmails('open', token, year, month, filters)
            },
            {
                shortName: 'totalEmailsBounced',
                name: 'Total emails bounced',
                description: 'Returns a single number showing the total number of emails bounced as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalEmails('bounce', token, year, month, filters)
            },
            {
                shortName: 'totalEmailClicks',
                name: 'Total email clicks',
                description: 'Returns a single number showing the total number of clicks in all emails as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalEmails('click', token, year, month, filters)
            },
            {
                shortName: 'totalEmailsSentByMonth',
                name: 'Total emails sent by month',
                description: 'Returns a table or graph showing the total number of emails sent by month in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Draft',
                func: (token, year, month, filters) => _fetchTotalEmailsByMonth('sent', token, year, month, filters)
            }
        ]
    }
}
