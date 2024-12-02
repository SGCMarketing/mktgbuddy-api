// Package imports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import lodash from 'lodash'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const get11MonthsPrecedingDate = (year, month) => {
    let totalMonths = month - 11

    if (totalMonths < 1) {
        year -= 1 // Go back one year
        totalMonths += 12 // Adjust months to the previous year
    }

    return { year: year, month: totalMonths }
}

// Initialize monthData with {year, month, value} for each month
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function getEmpty12MonthArray(filterDate) {
    let monthData = []

    for (let i = 11; i >= 0; i--) {
        // Start from 11 down to 0
        const date = new Date(Date.UTC(filterDate.getUTCFullYear(), filterDate.getUTCMonth() - i, 1))

        monthData.push({
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            newThisMonth: 0,
            total: 0
        })
    }

    return monthData
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const getFirstAndLastDayOfTheMonth = (date) => {
    // Error if not a valid Date object
    if (!(date instanceof Date)) throw new Error('Invalid input: Expected a valid Date object.')

    // Get the year and month from the provided date
    const year = date.getFullYear()
    const month = date.getMonth() // 0-indexed (January = 0)

    // First and last day of the month (force to UTC)
    const firstDay = new Date(Date.UTC(year, month, 1))
    const lastDay = new Date(Date.UTC(year, month + 1, 0))

    // Format using lodash
    const formattedFirstDay = lodash.padStart(firstDay.getUTCDate(), 2, '0') + '/' + lodash.padStart(firstDay.getUTCMonth() + 1, 2, '0') + '/' + firstDay.getUTCFullYear()
    const formattedLastDay = lodash.padStart(lastDay.getUTCDate(), 2, '0') + '/' + lodash.padStart(lastDay.getUTCMonth() + 1, 2, '0') + '/' + lastDay.getUTCFullYear()

    // Unix timestamps in milliseconds
    const firstDayUnixTime = firstDay.getTime()
    const lastDayUnixTime = lastDay.getTime()

    return { firstDay, lastDay, formattedFirstDay, formattedLastDay, firstDayUnixTime, lastDayUnixTime, year, month: month + 1 }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    get11MonthsPrecedingDate,
    getEmpty12MonthArray,
    getFirstAndLastDayOfTheMonth
}
