// App imports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import logger from '../../../../utils/logger.js'
import dateUtils from '../../../../utils/dateUtils.js'

// Dummy data
const COMPANIES_BY_MONTH = [300, 275, 400, 310, 290, 360, 250, 340, 300, 280, 373, 300]
const CONTACTS_BY_MONTH = [215, 230, 240, 220, 200, 210, 225, 235, 245, 250, 185, 179]

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _fetchTotal = async (object, year, month) => {
    logger.func(`integrationPartners/partners/demo/api.js -> _fetchTotal()`)

    // Create the date, if year and month exists then use those
    let filterDate = new Date()
    if (year && month && year !== '' && month !== '') filterDate = new Date(Date.UTC(year, month - 1, 1))

    // Get the first and last days
    const date = dateUtils.getFirstAndLastDayOfTheMonth(filterDate)

    // Return the total of all entries in the dummy data arrays
    if (object === 'companies') return { period: date, total: COMPANIES_BY_MONTH.slice(0, date.month).reduce((acc, num) => acc + num, 0) }
    if (object === 'contacts') return { period: date, total: CONTACTS_BY_MONTH.slice(0, date.month).reduce((acc, num) => acc + num, 0) }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _fetchTotalByMonth = async (object, year, month) => {
    logger.func(`integrationPartners/partners/demo/api.js -> _fetchTotalByMonth()`)

    // Create the date, if year and month exists then use those
    let startFilterDate = new Date()
    let endFilterDate = new Date()
    if (year && month && year !== '' && month !== '') {
        startFilterDate = new Date(Date.UTC(year, month - 1, 1))
        endFilterDate = new Date(Date.UTC(year, month - 1, 1))
    }

    // Subtract 12 months from the start date
    startFilterDate.setUTCMonth(startFilterDate.getUTCMonth() - 11)

    // Get the first and last days
    const startDate = dateUtils.getFirstAndLastDayOfTheMonth(startFilterDate)
    const endDate = dateUtils.getFirstAndLastDayOfTheMonth(endFilterDate)

    logger.info(`Getting data for the period ${startDate.formattedFirstDay} to ${endDate.formattedLastDay}.`)

    // Create an empty array
    let monthData = dateUtils.getEmpty12MonthArray(endFilterDate)

    // Companies
    let total = 0
    if (object === 'companies') {
        monthData.forEach((md, mdIndex) => {
            md.newThisMonth = COMPANIES_BY_MONTH[mdIndex]
            total += COMPANIES_BY_MONTH[mdIndex]
            md.total = total
        })
    }

    // Contacts
    if (object === 'contacts') {
        monthData.forEach((md, mdIndex) => {
            md.newThisMonth = CONTACTS_BY_MONTH[mdIndex]
            total += CONTACTS_BY_MONTH[mdIndex]
            md.total = total
        })
    }

    return { data: monthData }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const objectFetch = {
    // CRM
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    company: {
        tile: [
            {
                shortName: 'totalCompanies',
                name: 'Total companies',
                description: 'Returns a single number showing the total number of companies as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Live',
                func: (_, year, month, filters) => _fetchTotal('companies', year, month)
            },
            {
                shortName: 'totalContacts',
                name: 'Total contacts',
                description: 'Returns a single number showing the total number of contacts as of the end of the dashboard month.',
                type: 'Simple number',
                status: 'Live',
                func: (_, year, month, filters) => _fetchTotal('contacts', year, month)
            },
            {
                shortName: 'totalCompaniesByMonth',
                name: 'Total companies by month',
                description: 'Returns a table or graph showing the total number of companies created by month in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Live',
                func: (_, year, month, filters) => _fetchTotalByMonth('companies', year, month)
            },
            {
                shortName: 'totalContactsByMonth',
                name: 'Total contacts by month',
                description: 'Returns a table or graph showing the total number of contacts created by month in the 12 months leading up to the current dashboard month.',
                type: 'Table',
                status: 'Live',
                func: (_, year, month, filters) => _fetchTotalByMonth('contacts', year, month)
            }
        ],
        status: 'Live'
    }
}
