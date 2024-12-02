const errorMessages = {
    APICallNotSupported: 'This call is not supported in the API. Please see https://docs.mktgbuddy.com for more information on the mktgBuddy API.',
    APIUnknownError: `An unknown error occurred. This has been logged and reported to the development team.`,

    AuthLoggedOutError: `Invalid token, or you've already been logged out.`,
    AuthNoEmailError: 'You must provide an email address to login.',
    AuthNoPasswordError: 'You must provide a password to login.',
    AuthNoUserFoundError: `Can't login, there is no user with that email or the password is incorrect.`,
    AuthUserNotEnabled: 'User not enabled.',

    ClientAlreadyExistsError: `A Client with this name and/or prefix already exists.`,
    ClientNotFoundError: 'Client not found.',
    ClientMustHaveNameError: 'Clients must have a name.',
    ClientMustHavePrefixError: 'Clients must have a unique prefix.',
    ClientPrefixLengthError: 'Client prefix must be exactly 4 characters in length.',
    ClientCannotBeDeletedWithDependentsError: `Clients cannot be deleted while they have Integrations or Budgets associated to them.`,

    DashboardNoDashboardError: `Dashboard not found`,
    DashboardMustHaveClientError: `Dashboards must have Client.`,
    DashboardMustHaveNameError: `Dashboards must have name.`,

    InvalidIDError: 'The ID provided is invalid.',
    InvalidJSONBodyError: `Body appears to contain invalid or no JSON.`,

    IntegrationApprovalsNoAuthCodeProvidedError: `No auth code was found in the body or the auth code has expired.`,
    IntegrationApprovalsCodeExpiredError: `The token provided has expired.`,

    IntegrationNoIntegrationError: `Can't find an Integration with this ID.`,
    IntegrationClientRequiredError: `Integrations must be associated with a Client.`,
    IntegrationAlreadyExistsError: `An Integration already exist for this Client`,
    IntegrationPartnerRequiredError: `Integrations must have an Integration Partner.`,
    IntegrationMethodRequiredError: `Integrations must have an authentication method.`,
    IntegrationAuthenticationEmailRequiredError: `You must provide an email address if using email.`,
    IntegrationAuthenticationSMSRequiredError: `You must provide a mobile number if using SMS.`,
    IntegrationNoTileWithThisNameError: `You have provided an invalid tile name in the query.`,
    IntegrationHitRateLimitError: `The API call to the Inetgration hit a rate limit imposed by the API and couldn't continue.`,
    IntegrationFilterInvalidJSONBodyError: `The filter appears to contain invalid or no JSON.`,

    IntegrationDemioRequireAPIKeyTokenError: `Demio integration requires both the API key and token to be provided.`,
    IntegrationDemioConnectionTestFailedError: `Demio connection test failed. Your API key and token may be incorrect or the API could be offline.`,

    IntegrationHubSpotConnectionTestFailedError: `HubSpot connection test failed. Your API token may have expired or the API could be offline.`,
    IntegrationHubSpotCouldNotRefreshTokenError: `Failed to refresh the HubSpot authentication token. You may have to re-connect.`,

    IntegrationDataAlreadyExistsError: `A record already exists for this name and integration.`,
    IntegrationDataNoIntegrationDataError: `Can't find integrationData with this ID.`,

    IntegrationPartnerCannotBeCreatedUpdatedDeletedError: 'Integration Partners cannot be created, updated or deleted.',

    RequestInvalidFilterError: `Both filterFields and filter must be provided as a parameter, and the same amount of values in each.`,

    TokenError: 'Problem with token or token User no longer exists, please login and renew your token.',

    UserAlreadyExistsError: 'A User with this email address already exists. Please login or request a password reset to continue.',
    UserCannotCreateUserMissingInformation: 'Account, email, and password must be passed in the body in order to create a new User.',
    UserDisabledError: 'This User has been disabled',
    UserLoginExpiredError: 'You have been logged out. Please login again.',
    UserNoTokenError: 'No token provided in the header or token is invalid.',
    UserNotFoundError: 'User not found.',
    UserCannotDeleteError: 'You do not have permission to delete this User.'
}

export default errorMessages
