# Deploying with Docker

This directory contains instructions and scripts for deploying the Node.js
application to an AWS EC2 instance using Docker containers. This method
simplifies the deployment process by encapsulating the application and its
dependencies within Docker containers, making it easier to manage and scale.

The deployment process uses a `Makefile` to automate common tasks such as building
Docker images, pushing them to Docker Hub, and deploying them to the EC2 instance.

The `Makefile` includes the following targets:

    Makefile commands:
      env      - Check if .env file exists
      init     - Initialize production setup by generating docker-compose.yml and ec2-ssh.sh
      validate - Validate Docker Hub and EC2 credentials in .env file
      up       - Start the Docker Compose services in production mode
      down     - Stop the Docker Compose services
      build    - Build Docker images without using cache
      deploy   - Deploy the application to the EC2 instance
      logs     - View real-time logs from the EC2 instance
      clean    - Clean up Docker resources and data volumes
      help     - Show this help message

## Prerequisites

Before you begin, ensure complete the following steps:

- [Install Docker](https://docs.docker.com/get-docker/)
- Create a free account on [Docker Hub](https://hub.docker.com/)
- Create a [Personal Access Token](https://docs.docker.com/docker-hub/access-tokens/)

## Step 1: Create an AWS EC2 Instance

Follow these guides to set up your AWS EC2 instance for deploying the Dockerized
application:

- [Launch an EC2 Instance](EC2launch/README.md)
- [SSH into your EC2 Instance](EC2ssh/README.md)

## Step 2: Configure your .env File

Before you configure your project make sure you have following:

- Your Docker Hub username
- Your Docker Hub Personal Access Token
- Your AWS EC2 **Public DNS** which you can find in the AWS EC2 Management Console
![EC2 Public DNS](EC2_public_dns.png)
- Your AWS EC2 SSH Key File (.pem) which you downloaded when creating your EC2 instance

Copy the `.env.sample` file to a new file named `.env` in the same directory:

```bash
cp .env.sample .env
```

Copy your AWS EC2 SSH Key File (.pem) to the project root directory where the
`.env` file is located.  **IMPORTANT:** NEVER commit your `.pem` file to version
control. It should be ignored by your `.gitignore` file. If you accidentally
commit it, immediately delete the file from your repository, terminate your
EC2 instance and email your instructor to let them know your credentials may
have been compromised so they can make check to ensure your instance is secure.


Open the `.env` file in a text editor and fill in the required values:

- DOCKER_PAT - Your Docker Hub Personal Access Token
- DOCKER_USERNAME - Your Docker Hub username
- EC2_KEY_NAME - The name of your AWS EC2 SSH Key File (.pem)
- EC2_DEPLOY_HOST - Your AWS EC2 Public DNS
- EC2_DEPLOY_DIR - `/home/ubuntu/full-stack-web-app`
- APP_VERSION - `latest`
- APP_NAME - `full-stack-web-app`

## Step 3: Validate your Configuration

Run the following command to validate your Docker Hub credentials and EC2
connection:
```bash
make validate
```

If the validation is successful, you should see something like this:

```
✔ .env file found.
Authenticating Docker Hub credentials...
✔ Docker Hub authentication successful.
Validating EC2 connection...
✔ EC2 connection successful.
Checking other environment variables...
APP_NAME: full-stack-web-app
APP_VERSION: latest
EC2_DEPLOY_DIR: /home/ubuntu/full-stack-web-app
✔ All required environment variables are set.
```
If there are any issues with your configuration, the output will indicate what
needs to be fixed.

## Step 4: Initialize the Production Setup

Run the following command to initialize the production setup. This will generate
the `docker-compose.yml` file and the `ec2-ssh.sh` script based on your
`.env` configuration:

```bash
make init
```
You should see two files created: `docker-compose.yml` and `ec2-ssh.sh`. The
`ec2-ssh.sh` script is used to connect to your EC2 instance via SSH. And the
`docker-compose.yml` file defines the Docker services for your application.

## Step 5: Run the Application

Make sure your project builds and runs locally before deploying to production.
Run the following command to start the Docker Compose services in production mode:

```bash
make up
```

You should see output indicating that the services are starting up. Test the
application locally by navigating to the URL that was output in your terminal,
and ensure everything is working as expected. Make sure to test any database
functionality as well.

## Step 6: Build Docker Images and Push to Docker Hub

Once you have confirmed that the application is working correctly locally, run the
following command to build and push the Docker images to Docker Hub:

```bash
make build
```

# Step 7: Deploy to AWS EC2

Finally, run the following command to deploy the application to your AWS EC2
instance:

```bash
make deploy
```
You should see output indicating that the deployment is in progress. Once the
deployment is complete, you can access your application using the Public DNS of
your EC2 instance in your web browser.

## Viewing Logs

To view real-time logs from your EC2 instance, run the following command:

```bash
make logs
```

You should see the logs from your Docker containers streaming in your terminal.
This is useful for monitoring the application and debugging any issues that may
arise.

## Troubleshooting

## ERROR: failed to build
```
shane|(main=):fullstack-starter$ make build
cd app && make build
docker buildx build --platform linux/amd64,linux/arm64 -t shanepanter/full-stack-web-app:latest --push .
[+] Building 0.0s (0/0)                                                              docker:desktop-linux
ERROR: failed to build: Multi-platform build is not supported for the docker driver.
Switch to a different driver, or turn on the containerd image store, and try again.
Learn more at https://docs.docker.com/go/build-multi-platform/
make[1]: *** [build] Error 1
make: *** [build] Error 2
```
**Fix**: remove the builder and recreate it with the containerd image store enabled.

```bash
docker buildx rm multiarch
make init
```