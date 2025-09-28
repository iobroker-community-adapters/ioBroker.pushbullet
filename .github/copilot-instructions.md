# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

### Pushbullet Adapter Specifics

This adapter provides push notification functionality for ioBroker using the Pushbullet service. Key characteristics:

- **Primary Function**: Send push notifications (notes, links, files) to Pushbullet-connected devices
- **Service Integration**: Uses Pushbullet API v2 for messaging and device management
- **Message Types**: Supports note messages, link sharing, and file transfers
- **Bi-directional**: Can both send notifications and receive incoming push messages
- **Key Dependencies**: `pushbullet` npm package (~3.0.0), `@iobroker/adapter-core`
- **Configuration**: Requires API key and optional receiver email configuration
- **Security**: Uses encrypted storage for sensitive data (API key, password)

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Test files should be in `test/` directory with `.test.js` extension
- Use `@iobroker/testing` package for ioBroker-specific testing utilities
- Follow the existing test structure found in other community adapters

### Test Structure
```javascript
const { tests } = require('@iobroker/testing');

// Basic adapter tests
tests.integration(path.join(__dirname, '..'), {
    // Test configuration
});
```

### Pushbullet-Specific Testing
- Mock Pushbullet API calls in tests to avoid making real API requests
- Test message formatting and validation
- Verify proper error handling for network failures
- Test encryption/decryption of sensitive configuration data

## Code Style and Conventions

### General Guidelines
- Follow the existing ESLint configuration (`.eslintrc.json`)
- Use Prettier for code formatting (`.prettierrc.js`)
- Maintain TypeScript definitions where applicable
- Use proper JSDoc comments for functions and classes

### ioBroker Adapter Patterns
- Always extend from `@iobroker/adapter-core`
- Implement proper `ready()`, `unload()`, and `onStateChange()` methods
- Use appropriate logging levels: `this.log.error()`, `this.log.warn()`, `this.log.info()`, `this.log.debug()`
- Handle adapter shutdown gracefully in `unload()` method

### Pushbullet Integration Patterns
- Use the official pushbullet npm package for API interactions
- Implement proper error handling for API failures
- Support all Pushbullet message types (note, link, file)
- Maintain device list synchronization when needed
- Follow Pushbullet API rate limits and best practices

## Configuration Management

### Native Configuration
- API key storage with encryption
- Optional receiver email configuration
- Support for device-specific targeting
- Password field for additional security

### State Management
- Create appropriate channel structure for incoming messages
- Use proper state roles and types as defined in ioBroker standards
- Implement read-only states for received message data
- Maintain connection state indicators

## Error Handling and Logging

### Best Practices
- Use try-catch blocks for all async operations
- Log errors with appropriate context and actionable information
- Implement retry mechanisms for transient failures
- Provide clear error messages for configuration issues

### Pushbullet-Specific Error Scenarios
- Invalid API key handling
- Network connectivity issues
- Pushbullet service outages
- Message size and format validation
- File upload failures and size limits

## Security Considerations

### Data Protection
- Use ioBroker's encryption for sensitive configuration
- Never log API keys or other credentials
- Validate all incoming data from Pushbullet webhooks
- Implement proper input sanitization

### API Security
- Use HTTPS for all API communications
- Implement proper authentication token handling
- Follow Pushbullet's security best practices
- Handle API key rotation gracefully

## Dependencies and Package Management

### Core Dependencies
- `@iobroker/adapter-core`: Core adapter functionality
- `pushbullet`: Official Pushbullet API client

### Development Dependencies
- ESLint and Prettier for code quality
- Jest and @iobroker/testing for testing
- TypeScript for type checking
- Mocha for integration tests

### Version Management
- Follow semantic versioning
- Update dependencies regularly but cautiously
- Test thoroughly after dependency updates
- Use `npm audit` to check for security vulnerabilities

## Build and Development Workflow

### Available Scripts
- `npm run build`: Build the project using Gulp
- `npm test`: Run all tests (unit and package tests)
- `npm run lint`: Run ESLint code analysis
- `npm run check`: TypeScript type checking without compilation

### Development Process
1. Make changes to source files
2. Run linting and type checking
3. Execute tests to ensure functionality
4. Build the project
5. Test the adapter in a development ioBroker instance

## Documentation and Comments

### Code Documentation
- Use JSDoc for all public methods and classes
- Document complex algorithms and business logic
- Explain Pushbullet-specific integrations and API usage
- Keep README.md updated with usage examples

### Configuration Documentation
- Document all configuration options in `io-package.json`
- Provide clear descriptions for user-facing settings
- Include examples of common use cases
- Maintain multi-language support for descriptions

## Release and Deployment

### Release Process
- Use `@alcalzone/release-script` for automated releases
- Follow the established changelog format
- Update version numbers in both `package.json` and `io-package.json`
- Test releases in development environment before publishing

### Quality Gates
- All tests must pass
- Code coverage should be maintained
- ESLint checks must pass without errors
- TypeScript compilation must complete successfully

## Integration Patterns

### Message Handling
```javascript
// Example message sending pattern
sendTo("pushbullet", {
    message: "Message body",
    title: "Title",
    type: "note"
});
```

### Device-Specific Targeting
```javascript
// Send to specific device
sendTo("pushbullet", {
    message: "Device-specific message",
    title: "Title",
    type: "note",
    receiver: "device_id"
});
```

### File Sharing
```javascript
// Send file
sendTo("pushbullet", {
    file: "/path/to/file",
    title: "File Title",
    type: "file"
});
```

## Common Issues and Solutions

### API Connection Issues
- Check API key validity and format
- Verify network connectivity
- Implement exponential backoff for retries
- Handle rate limiting appropriately

### Message Delivery Problems
- Validate message format and content
- Check recipient configuration
- Ensure proper device targeting
- Monitor Pushbullet service status

### Performance Considerations
- Implement message queuing for high-volume scenarios
- Use appropriate timeouts for API calls
- Cache device lists when appropriate
- Monitor memory usage for file transfers

## Maintenance and Updates

### Regular Maintenance Tasks
- Monitor for new Pushbullet API versions
- Update dependencies periodically
- Review and update error handling
- Maintain compatibility with new ioBroker versions

### Community Collaboration
- Follow iobroker-community-adapters guidelines
- Participate in code reviews
- Report issues to the community
- Contribute improvements back to the template

---

*These instructions help GitHub Copilot understand the context and best practices for this specific ioBroker adapter. The guidelines ensure consistent, maintainable, and high-quality code that follows ioBroker community standards while properly integrating with the Pushbullet service.*