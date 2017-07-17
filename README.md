# Hubsy

Hubsy the HubSpot bot is your own personal assistant to help you manage your HubSpot account! Hubsy was created for an AWS Hackathon but if you would like to install it for your own company let us know! The bot is accessible on Slack, Facebook and Alexa.

## Sample utterances that start conversations

### Create Engagements
* Create a task
* Log a call

### Contact Info
* What is the contact information for `{person}`.
* Create a contact.

### Number of Engagements
* How many `{engagements}` did `{sales}` make `{timeframe}`.
* How many `{engagements}` did `{sales}` make on `{date}`.
* How many `{engagements}` were made on `{date}`.

### Compare Sales People
* Compare `{engagements}` with `{salesOne}` and `{salesTwo}` for `{timeframe}`.
* Compare sales people.

### Deals
* How many deals are in the `{stage}` stage.
* How many deals are in the `{stage}` assigned to `{sales}`.
* What is the total value of deals in the `{stage}​` stage.
* How much money is in `{stage}​`.
* What is the total value of deals.
* Show me recent deals.

### Misc
* Help

## AWS/Third Party Services Used
* Lex - This is the service that allowed us to build the conversational piece to our bot. We gave it potential utterances that a person on a sales team would likely say.
* Lambda - Lambda is where we run our NodeJS code that parses the users request and contacts HubSpot for the information, then decides to give the user the info or request more.
* HubSpot - HubSpot was the CRM of choice to integrate with our bot for its general ease of use and popularity.
* IAM - IAM profiles for our Lambda functions so that they only have access to the services they need.
* CloudWatch Logs - Our Lambda functions all log to CloudWatch so that it was easier for us to debug different pieces of our intents.
* Amazon Alexa Skill Developer - We used Amazon's Alexa skill builder to build our skill and test it on an Echo Dot.
* Route 53 - Domain was purchased.
* S3 - Our Terraform config and this website are stored in S3.
* CloudFront - The CDN that fronts our website S3 bucket.
* Certificate Manager - Hubsy website SSL certificate.
* Terraform Using - Terraform and writing our infrastructure as code allowed for faster development with Lambda and clean infrastructure management.
* ESLint - We used ESLint so ensure our code was always linted before each deploy and we were following proper development standards.

## Makefile

* `make eslint` - Run ESLint against our JS files for coding standards.
* `make build`  - Zips the Lambda functions for terraform to send to Lambda.
* `make sync`   - Sync the landing page website to S3.
* `make plan`   - Creates a Terraform plan to deploy infrastructure changes.
* `make apply`  - Applies the terraform plan (requires `make plan` first).

## Release History

### 1.0.0 on July 17 2017

* Hubsy 1.0 initial release!
