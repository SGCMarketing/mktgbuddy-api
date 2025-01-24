import env from 'dotenv'
env.config()

import { objectFetch as demoObjectFetch } from '../integrationPartners/partners/demo/api.js'
import { objectFetch as hubSpotObjectFetch } from '../integrationPartners/partners/hubSpot/api.js'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const integrationPartners = [
    { shortName: 'demio', name: 'Demio', status: 'Testing', connectionType: 'apiKeySecret', logo: `${process.env.API_URL}/logo/demioLogo.png` },

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // DEMO
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    {
        shortName: 'demo',
        name: 'Demo',
        status: 'Testing',
        connectionType: 'apiKeySecret',
        logo: `${process.env.API_URL}/logo/hubspotLogo.png`,
        object: demoObjectFetch
    },

    // { shortName: 'facebookAds', name: 'Facebook Ads', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/facebookLogo.png` },

    // { shortName: 'facebookInsights', name: 'Facebook Insights', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/facebookLogo.png` },

    // { shortName: 'googleAds', name: 'Google Ads', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/googleAdsLogo.png` },

    // { shortName: 'googleAnalytics', name: 'Google Analytics', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/googleAnalyticsLogo.png` },

    // { shortName: 'googleMyBusiness', name: 'Google My Business', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/googleMyBusinessLogo.png` },

    // { shortName: 'googleSearchConsole', name: 'Google Search Console', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/googleAdsLogo.png` },

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // HUBSPOT
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    {
        shortName: 'hubSpot',
        name: 'HubSpot',
        status: 'Testing',
        connectionType: 'tokenAuthentication',
        logo: `${process.env.API_URL}/logo/hubspotLogo.png`,
        object: hubSpotObjectFetch
    },

    // { shortName: 'instagramAds', name: 'Instagram Ads', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/instagramLogo.png` },

    // { shortName: 'instagramInsights', name: 'Instagram Insights', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/instagramLogo.png` },

    // { shortName: 'linkedInAds', name: 'LinkedIn Ads', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/linkedInLogo.png` },

    // { shortName: 'linkedInPages', name: 'LinkedIn Pages', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/linkedInLogo.png` },

    { shortName: 'mailChimp', name: 'MailChimp', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/mailChimpLogo.png` }

    // { shortName: 'microsoftBingAds', name: 'Microsoft Bing Ads', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/bingLogo.png` },

    // { shortName: 'tikTokAds', name: 'TikTok Ads', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/tikTokLogo.png` },

    // { shortName: 'youTube', name: 'YouTube', status: 'Draft', connectionType: 'unknown', logo: `${process.env.API_URL}/logo/youTubeLogo.png` }
]

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const integrationPartnersShortName = integrationPartners.map((item) => item.shortName)
