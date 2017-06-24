TERRAFORM_VERSION := 0.9.8
REGION := us-east-1

TERRAFORM := docker run --rm -it -e AWS_PROFILE=ken_bot -e AWS_REGION=${REGION} -v ~/.aws:/root/.aws -v ${PWD}:/data -w /data hashicorp/terraform:${TERRAFORM_VERSION}

default: plan

init:
	rm -rf .terraform && \
	${TERRAFORM} init \
		-backend=true \
		-backend-config="bucket=ken-bot" \
		-backend-config="key=ken-bot/terraform.tfstate" \
		-backend-config="region=${REGION}" \
		-backend-config="profile=ken_bot" \
		-force-copy

build-lambda-functions:
	npm install && \
	zip ken_bot.zip -r *.js node_modules config

plan: build-lambda-functions init
	${TERRAFORM} plan -out=.terraform/terraform.tfplan

apply:
	${TERRAFORM} apply .terraform/terraform.tfplan && \
	rm *.zip
