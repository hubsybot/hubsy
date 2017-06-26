# Configuration variables.
TERRAFORM_VERSION := 0.9.8
AWS_REGION := us-east-1

# Launch Terraform in a isolated docker container.
TERRAFORM := docker run --rm -it -e AWS_PROFILE=ken_bot -e AWS_REGION=${AWS_REGION} -v ~/.aws:/root/.aws -v ${PWD}:/data -w /data hashicorp/terraform:${TERRAFORM_VERSION}

# Default will be just to do a Terraform plan.
default: plan

# Initialize the Terraform backend.
init:
	rm -rf .terraform && \
	${TERRAFORM} init \
		-backend=true \
		-backend-config="bucket=ken-bot-terraform" \
		-backend-config="key=ken-bot/terraform.tfstate" \
		-backend-config="region=${AWS_REGION}" \
		-backend-config="profile=ken_bot" \
		-force-copy

# Build the Lambda functions and zip them up to have Terraform ship to Lambda.
build:
	npm install && \
	zip ken_bot.zip -r *.js node_modules config helpers

# Planning will build the Lambda functions, initialize Terraform backend and then
# do a Terraform plan.
plan: build init
	${TERRAFORM} plan -var="aws_region=${AWS_REGION}" -out=.terraform/terraform.tfplan

# Run a Terraform apply against the plan that was ran. It will also do a little
# cleanup and remove any zip files it created.
apply:
	${TERRAFORM} apply .terraform/terraform.tfplan && \
	rm *.zip
