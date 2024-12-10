// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// logger.js
// Logs messages to the console with formatting applied.
//
// Created 25th Nov 2022
// Andy Chadbourne
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// import axios from 'axios'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Post msg to BetterStack
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// const _postToBetterStack = async (msg) => {
//     const date = new Date()

//     // Format date as dd/mm/yyyy
//     const formattedDate = [
//         String(date.getDate()).padStart(2, '0'), // Day
//         String(date.getMonth() + 1).padStart(2, '0'), // Month (zero-based index, so add 1)
//         date.getFullYear() // Year
//     ].join('/')

//     // Format time as hh:mm:ss:sss
//     const formattedTime =
//         [
//             String(date.getHours()).padStart(2, '0'), // Hours
//             String(date.getMinutes()).padStart(2, '0'), // Minutes
//             String(date.getSeconds()).padStart(2, '0') // Seconds
//         ].join(':') + `:${String(date.getMilliseconds()).padStart(3, '0')}` // Milliseconds

//     // Combine date and time
//     const formattedDateTime = `${formattedDate}, ${formattedTime}`

//     try {
//         const res = await axios.post(
//             'https://in.logs.betterstack.com',
//             { dt: formattedDateTime, message: msg },
//             {
//                 headers: {
//                     Authorization: `Bearer 2MjufpuDnpzehnmeXtq4keTy`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         )
//     } catch (err) {
//         console.error(err.response.data)
//     }

//     await new Promise((resolve) => setTimeout(resolve, 1000))
// }

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Print msg to console
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _printLogToConsole = async (msg) => {
    if (process?.env?.BUILD_LOCATION === 'local') {
        const date = new Date()
        const formattedTime = [date.getHours(), date.getMinutes(), date.getSeconds()].map((unit) => String(unit).padStart(2, '0')).join(':') + `:${String(date.getMilliseconds()).padStart(3, '0')}`
        console.log(`${formattedTime}: ${msg}`)
    } else console.log(msg)

    await new Promise((resolve) => setTimeout(resolve, 100))
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Logger
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const logger = () => {
    const msgStack = [] // Stack to hold messages
    let processing = false // Flag to check if processing is ongoing

    // Function to process messages from the stack
    const processStack = async () => {
        if (processing) return // If already processing, exit
        processing = true

        while (msgStack.length > 0) {
            const { type, msg } = msgStack.shift() // Get the first message
            // await _postToBetterStack(`[${type.toUpperCase()}]: ${msg}`) // Post to BetterStack with message type
        }

        processing = false
    }

    const func = (msg) => {
        msgStack.push({ type: 'func', msg })
        if (!processing) processStack()
        _printLogToConsole(`${loggerInstance.penStart.magenta}FCN: ${msg}${loggerInstance.penEnd}`)
    }

    const request = (req) => {
        msgStack.push({ type: 'request', msg: req?.method })
        if (!processing) processStack()
        if (process?.env?.BUILD_LOCATION === 'local') _printLogToConsole(`\n              ${newLine}${loggerInstance.penStart.brightCyan}\n              REQ: ${req?.method} ${req?.url}${loggerInstance.penEnd}\n              ${newLine}`)
        else _printLogToConsole(`${newLine}${loggerInstance.penStart.brightCyan}\nREQ: ${req?.method} ${req?.url}${loggerInstance.penEnd}\n${newLine}\n`)
    }

    const info = (msg) => {
        msgStack.push({ type: 'info', msg })
        if (!processing) processStack()
        _printLogToConsole(`${loggerInstance.penStart.green}INF: ${msg}${loggerInstance.penEnd}`)
    }

    const error = (msg) => {
        msgStack.push({ type: 'error', msg })
        if (!processing) processStack()
        _printLogToConsole(`${loggerInstance.penStart.red}ERR: ${msg}${loggerInstance.penEnd}`)
    }

    return { func, request, info, error }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Create an instance of logger with external access to its properties
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const loggerInstance = logger()

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ANSI color codes for terminal output
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
loggerInstance.penStart = {
    black: '\u001b[30m',
    cyan: '\u001b[36m',
    brightCyan: '\u001b[36;1m',
    green: '\u001b[32m',
    red: '\u001b[31m',
    brightRed: '\u001b[31;1m',
    blue: '\u001b[34m',
    magenta: '\u001b[35m',
    white: '\u001b[37m',
    yellow: '\u001b[33m'
}
loggerInstance.penEnd = '\u001b[0m' // Reset ANSI colors

const newLine = `----------------------------------------------------------------------------------`

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Export
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default loggerInstance
