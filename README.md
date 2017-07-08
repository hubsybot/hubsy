# Ken Bot
Proprosed name (Hubbot | HubBot | hubspotbot | hubspotBot)

TODO (Write a description)

## Commands (Variations of commands are available.)

### Contact Info
* What is the contact information for `{person}` (Starts conversation.)

### Engagements (Notes, Meetings, Calls, Emails, Tasks)
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

## AWS/Amazon Services Used
* Lex - Powers our bot.
* Lambda - Runs our code in the cloud for Lex.
* IAM - Profiles for our Lambda functions.
* CloudWatch Logs - Where our logs go for our Lambda functions.
* Amazon Alexa Skill Developer - Area where we develop our Alexa skill.
* Route 53 - Where we registered our bot domain. // @TODO
* S3 - Where we store our Terraform state as well as our static homepage. // @TODO
* CloudFront - Caches our website. // @TODO
* Certificate Manager - Gives us the SSL certificate. // @TODO

## Contributing

* `make eslint` - Run ESLint against our js files.
* `make build`  - Zips the Lambda functions for terraform to send to Lambda.
* `make plan`   - Creates a Terraform plan to deploy infrastructure changes.
* `make apply`  - Applies the terraform plan (requires `make plan` first).

## Release History

### 1.0.0 on ???

* Initial release.
