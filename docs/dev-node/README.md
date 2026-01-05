# Development with npm and Node.js

This document provides instructions for working with the full-stack web
application. Docker is not required for local development and testing, although
it can be used if desired. This project has been fully tested and is supported
on GitHub [CodeSpaces](https://github.com/features/codespaces). Fork the
repository and create a new CodeSpace to get started developing immediately.

## Local Machine Setup

**Important:** Your professor or TA can not provide help or troubleshooting for
your personal machine setups due to the wide variety of operating systems and
configuration. These instructions are provided as a guide, but your mileage may
vary. If you are unable to get this working on your local machine, you will need
to use CodeSpaces or come in to a lab with pre-configured machines.

Install the following:

- Install [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Install [VS Code](https://code.visualstudio.com/download)
- Install [Node.js](https://nodejs.org/en/download) version 24 or higher
- Install [Docker](https://docs.docker.com/get-docker/) on your local machine.
- Restart your machine after installing everything to ensure all environment variables
  are set correctly.

**IMPORTANT:** Make sure you select "Automatically install the necessary tools"
when installing Node.js on Windows to ensure that all required components are set up
correctly. This option is shown in the screenshot below:

![Node.js installer screenshot](./automatic-install.png)

## Development

The application is located in the `app` directory. All commands should be run
from within this directory. Navigate to the `app` by running `cd app` from the
root of the repository after cloning it. You can confirm you are in the correct
directory by checking for the presence of the `package.json` file in the terminal
or by using the `pwd` command.

Install the necessary packages for the application:

```bash
npm install
```

To start the development server, run:

```bash
npm start
```

Your will use `npm` to manage dependencies and scripts for building, testing, and
running the application. The project provides the following npm scripts:

- `npm start`: Starts the application server.
- `npm test`: Runs the test suite using playwright for end-to-end testing.
- `npm run start:prod`: Starts the application in production mode. This is useful
  for testing the production build locally before deploying. Some features may behave
  differently in production mode.
- `npm run clean`: Cleans up generated files and directories such as `node_modules`
  and test reports.
- `npm run debug`: Starts the application with the Node.js inspector enabled for
  debugging. This uses VS Code's built-in debugging tools.
- `npm run test:setup`: Installs Playwright browsers and dependencies required for
  running the end-to-end tests.
- `npm run test:ui`: Launches the Playwright Test UI for interactive test execution
  and debugging. **NOTE:** This requires a graphical environment and may not work in
  headless setups like CodeSpaces.
- `npm run test:debug`: Runs the Playwright tests in debug mode, allowing you to step through
  tests and inspect the application state during test execution. This also requires a
  graphical environment and may not work in headless setups like CodeSpaces.

## Testing

The application uses [Playwright](https://playwright.dev/) for end-to-end testing.
to run the test suite, use the following command:

```bash
npm run test:setup
npm test
```

## Docker Support

- Install [Docker](https://docs.docker.com/get-docker/) on your local machine.
- Ensure Docker is running before starting the application.

**IMPORTANT:** When installing Docker on Windows machines, make sure to select
"Use the WSL 2 based engine" during installation.


A `dev.sh` script is provided at the root of the repository to simplify common
tasks such as building the application, running tests, and cleaning up files.
You can run the script with different commands as arguments. For example, to
build the application, run:

```bash
./dev.sh build
```

To see all available commands, run:
```bash
./dev.sh help
```