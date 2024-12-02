import mongoose from 'mongoose'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const country = [
    `Afghanistan`,
    `Albania`,
    `Algeria`,
    `Andorra`,
    `Angola`,
    `Antigua and Barbuda`,
    `Argentina`,
    `Armenia`,
    `Australia`,
    `Austria`,
    `Azerbaijan`,
    `Bahamas`,
    `Bahrain`,
    `Bangladesh`,
    `Barbados`,
    `Belarus`,
    `Belgium`,
    `Belize`,
    `Benin`,
    `Bhutan`,
    `Bolivia`,
    `Bosnia and Herzegovina`,
    `Botswana`,
    `Brazil`,
    `Brunei`,
    `Bulgaria`,
    `Burkina Faso`,
    `Burundi`,
    `Côte d'Ivoire`,
    `Cabo Verde`,
    `Cambodia`,
    `Cameroon`,
    `Canada`,
    `Central African Republic`,
    `Chad`,
    `Chile`,
    `China`,
    `Colombia`,
    `Comoros`,
    `Congo - Congo-Brazzaville`,
    `Costa Rica`,
    `Croatia`,
    `Cuba`,
    `Cyprus`,
    `Czechia - Czech Republic`,
    `Democratic Republic of the Congo`,
    `Denmark`,
    `Djibouti`,
    `Dominica`,
    `Dominican Republic`,
    `Ecuador`,
    `Egypt`,
    `El Salvador`,
    `Equatorial Guinea`,
    `Eritrea`,
    `Estonia`,
    `Eswatini - fmr. "Swaziland"`,
    `Ethiopia`,
    `Fiji`,
    `Finland`,
    `France`,
    `Gabon`,
    `Gambia`,
    `Georgia`,
    `Germany`,
    `Ghana`,
    `Greece`,
    `Grenada`,
    `Guatemala`,
    `Guinea`,
    `Guinea-Bissau`,
    `Guyana`,
    `Haiti`,
    `Holy See`,
    `Honduras`,
    `Hungary`,
    `Iceland`,
    `India`,
    `Indonesia`,
    `Iran`,
    `Iraq`,
    `Ireland`,
    `Israel`,
    `Italy`,
    `Jamaica`,
    `Japan`,
    `Jordan`,
    `Kazakhstan`,
    `Kenya`,
    `Kiribati`,
    `Kuwait`,
    `Kyrgyzstan`,
    `Laos`,
    `Latvia`,
    `Lebanon`,
    `Lesotho`,
    `Liberia`,
    `Libya`,
    `Liechtenstein`,
    `Lithuania`,
    `Luxembourg`,
    `Madagascar`,
    `Malawi`,
    `Malaysia`,
    `Maldives`,
    `Mali`,
    `Malta`,
    `Marshall Islands`,
    `Mauritania`,
    `Mauritius`,
    `Mexico`,
    `Micronesia`,
    `Moldova`,
    `Monaco`,
    `Mongolia`,
    `Montenegro`,
    `Morocco`,
    `Mozambique`,
    `Myanmar - formerly Burma`,
    `Namibia`,
    `Nauru`,
    `Nepal`,
    `Netherlands`,
    `New Zealand`,
    `Nicaragua`,
    `Niger`,
    `Nigeria`,
    `North Korea`,
    `North Macedonia`,
    `Norway`,
    `Oman`,
    `Pakistan`,
    `Palau`,
    `Palestine State`,
    `Panama`,
    `Papua New Guinea`,
    `Paraguay`,
    `Peru`,
    `Philippines`,
    `Poland`,
    `Portugal`,
    `Qatar`,
    `Romania`,
    `Russia`,
    `Rwanda`,
    `Saint Kitts and Nevis`,
    `Saint Lucia`,
    `Saint Vincent and the Grenadines`,
    `Samoa`,
    `San Marino`,
    `Sao Tome and Principe`,
    `Saudi Arabia`,
    `Senegal`,
    `Serbia`,
    `Seychelles`,
    `Sierra Leone`,
    `Singapore`,
    `Slovakia`,
    `Slovenia`,
    `Solomon Islands`,
    `Somalia`,
    `South Africa`,
    `South Korea`,
    `South Sudan`,
    `Spain`,
    `Sri Lanka`,
    `Sudan`,
    `Suriname`,
    `Sweden`,
    `Switzerland`,
    `Syria`,
    `Tajikistan`,
    `Tanzania`,
    `Thailand`,
    `Timor-Leste`,
    `Togo`,
    `Tonga`,
    `Trinidad and Tobago`,
    `Tunisia`,
    `Turkey`,
    `Turkmenistan`,
    `Tuvalu`,
    `Uganda`,
    `Ukraine`,
    `United Arab Emirates`,
    `United Kingdom`,
    `United States of America`,
    `Uruguay`,
    `Uzbekistan`,
    `Vanuatu`,
    `Venezuela`,
    `Vietnam`,
    `Yemen`,
    `Zambia`,
    `Zimbabwe`
]

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Note: Don't add any form of brackets here as it breaks the filters on the front-end app
const industry = [
    'Accounting / finance',
    'Administrative & support services',
    'Agriculture, forestry & fishing',
    'Arts, entertainment and recreation',
    'Chemical & Pharmaceutical',
    'Computer',
    'Construction',
    'Education',
    'Energy - consumer',
    'Energy - industrial',
    'Entertainment',
    'Food & beverage',
    'Healthcare',
    'Hospitality',
    'Housing Associations / Social Housing',
    'Human health and social work activities',
    'Information and communication',
    'Insurance',
    'Manufacturing',
    'Law / legal',
    'Libraries',
    'Military & defence',
    'Mining and Quarrying',
    'other',
    'Professional, scientific and technical activities',
    'Public authority',
    'Real estate',
    'Telecommunications',
    'Transportation and storage',
    'Vehicles / motor industry',
    'Water supply, sewerage, waste management and remediation activities'
].sort()

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const seniority = ['Unpaid', 'Training', 'Entry', 'Senior', 'Manager', 'Director', 'VP', 'CXO', 'Owner', 'Partner']

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const budgetCategories = [
    { category: 'Advertising', items: ['Digital / PPC', 'Newspaper / magazine', 'Outdoor', 'Radio', 'Sponsorship', 'TV'] },
    { category: 'Consultancy', items: ['CRM implementation'] },
    { category: 'Contractor', items: ['Marketing Director', 'Marketing Manager', 'Marketing Assistant', 'PR', 'SEO', 'PPC'] },
    { category: 'Campaigns', items: ['Internal', 'External'] },
    {
        category: 'Creative',
        items: [
            'Animation',
            'Advert design',
            'Artwork',
            'Infographics',
            'Copywriter (publications/brochures)',
            'Copywriter (whitepapers)',
            'Copywriter (blog)',
            'Copywriter (general)',
            'Content generation',
            'Music',
            'Photography (general)',
            'Photography (headshots / people)',
            'PR',
            'UI',
            'UX',
            'Video (editing)',
            'Video filming (general)',
            'Video filming (drone)',
            'Website design',
            'Brochure/print design'
        ]
    },
    { category: 'Consumables', items: ['Food/drink', 'Paper', 'Sweets / chocolates'] },
    { category: 'Data', items: ['Analytics', 'B2C', 'B2B'] },
    { category: 'Digital', items: ['SEO', 'Social media', 'Website (hosting)', 'Website (design/production)', 'Website (plugins / extras)'] },
    { category: 'Hardware', items: ['Cameras', 'Computers', 'Peripherals', 'Phones'] },
    { category: 'Events/Exhibitions', items: ['Space', 'Stand design', 'Packing & Transportation', 'Hotel', 'Food & drink', 'Entertaining', 'Internet & utilities', 'On-stand tech', 'Equipment', 'Installation', 'Other'] },
    { category: 'Printing', items: ['Business stationary', 'Brochures', 'Catalogs', 'Clothing', 'General', 'Large format', 'Packaging', 'Promotional items / merch', 'Signage'] },
    { category: 'Services', items: ['Marketing automation', 'Brand development', 'Direct mail', 'Influencer', 'Market research', 'Recruitment', 'Strategy', 'Team building', 'Telemarketing', 'Tone of voice', 'Translation', 'Training', 'Postage / shipping'] },
    { category: 'Software', items: ['Analytics', 'Creative', 'Spelling / grammar', 'CRM', 'Email', 'Social media', 'SEO', 'Website hosting', 'Plugins'] },
    { category: 'Travel', items: ['Mileage', 'Hotel', 'Flight', 'Rail'] },
    { category: 'Other', items: ['Other'] }
]

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const currencies = [
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'COP', name: 'Colombian Peso', symbol: '$' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'Sh' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: '$' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: '$' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'USD', name: 'United States Dollar', symbol: '$' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' }
]

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _getDetailedBudgetCategories = () => {
    let bc = []
    budgetCategories.forEach((budgetCategory) => {
        budgetCategory.items.forEach((item) => {
            bc.push(`${budgetCategory.category} - ${item}`)
        })
    })
    return bc.sort(Intl.Collator().compare)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const _getBudgetCategories = () => {
    let bc = []
    budgetCategories.forEach((budgetCategory) => {
        bc.push(budgetCategory.category)
    })
    return bc.sort(Intl.Collator().compare)
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const note = {
    text: { type: String },
    created: { type: Date, default: Date.now() },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const address = {
    street: { type: String },
    street1: { type: String },
    town: { type: String },
    city: { type: String },
    county: { type: String },
    postcode: { type: String },
    country: { type: String, enum: { values: country }, default: 'United Kingdom' },
    geo: { lat: { type: Number }, long: { type: Number }, zoom: { type: Number } }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const contactAssociationType = ['Primary', 'Support', 'Finance', ''].sort()

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const contact = {
    firstName: { type: String },
    lastName: { type: String },
    jobTitle: { type: String },
    mobile: { type: String },
    phone: { type: String },
    email: { type: String },
    associationType: { type: String, enum: { values: contactAssociationType } }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const sharedSchema = {
    industry,

    address,

    currencies,

    contact,
    contactAssociationType,

    seniority,

    budgetCategories: _getBudgetCategories(),
    budgetCategoriesDetailed: _getDetailedBudgetCategories(),

    note: note
}

export default sharedSchema
