# Contributing to SecureShare

First off, thank you for considering contributing to SecureShare! It's people like you that make SecureShare such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed and what behavior you expected**
* **Include screenshots if possible**
* **Include your Chrome version and OS**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Provide specific examples to demonstrate the enhancement**
* **Describe the current behavior and explain the expected behavior**
* **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing code style
5. Issue that pull request!

## Development Setup

1. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/secure-share.git
   cd secure-share
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Load the extension in Chrome**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project directory

4. **Make your changes**
   - Edit files in `popup/` for UI changes
   - Edit `manifest.json` for permission changes
   - Test thoroughly in Chrome

5. **Build for production**
   ```bash
   npm run build:prod
   ```

## Style Guidelines

### JavaScript Style

* Use 2 spaces for indentation
* Use semicolons
* Use single quotes for strings
* Add JSDoc comments for functions
* Keep functions small and focused

### CSS Style

* Use CSS variables for colors and common values
* Follow BEM naming convention for classes
* Keep specificity low
* Mobile-first approach

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

## Testing

Currently, manual testing is required:

1. Test all sharing scenarios
2. Test with different websites
3. Test error cases
4. Test on different Chrome versions

## Questions?

Feel free to open an issue with your question or contact the maintainer directly.

Thank you for contributing! 🎉
