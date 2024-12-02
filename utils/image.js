import logger from './logger.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Convert a base64 encoded string to an image type and buffer
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function decodeBase64Image(base64Data) {
    logger.func(`utils/image.js -> decodeBase64Image()`)

    // Extract the content type and Base64 string
    const base64Prefix = base64Data.substring(0, base64Data.indexOf('base64,') + 7)
    const imageTypeMatch = base64Prefix.match(/^data:(image\/[a-zA-Z\+]+);base64,/)
    const imageType = imageTypeMatch ? imageTypeMatch[1] : 'image/png'

    // Strip the base64 prefix to get the raw Base64 string and convert the cleaned Base64 string to a Buffer
    const base64String = base64Data.replace(/^data:image\/[a-zA-Z\+]+;base64,/, '')
    const buffer = Buffer.from(base64String, 'base64')

    // Return the result
    return { imageType, buffer }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default {
    decodeBase64Image
}
