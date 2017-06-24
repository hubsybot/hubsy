#
# Backend
#

terraform { backend "s3" { } }

#
# Configuration
#

variable "cloudwatch-log-retention" { default = 7 }
variable "lambda-runtime" { default = "nodejs6.10" }
variable "lambda-memory" { default = {
    low = "128"
    medium = "256"
    high = "512"
}}
variable "lambda-timeout" { default = {
    low = "30"
    medium = "60"
    high = "120"
}}

#
# CloudWatch Logs
#

resource "aws_cloudwatch_log_group" "deals_in_stage" {
    name = "/aws/lambda/deals_in_stage"
    retention_in_days = "${var.cloudwatch-log-retention}"
}

#
# Roles
#

resource "aws_iam_role" "ken_bot" {
    name = "ken_bot"
    assume_role_policy = "${data.aws_iam_policy_document.ken_bot_lambda_assume_role_policy.json}"
}

data "aws_iam_policy_document" "ken_bot_lambda_assume_role_policy" {
    statement {
        principals {
            type = "Service"
            identifiers = ["lambda.amazonaws.com"]
        }
        actions = ["sts:AssumeRole"]
    }
}

resource "aws_iam_policy_attachment" "ken_bot_attachment" {
    name = "ken_bot_attachment"
    roles = [
        "${aws_iam_role.ken_bot.id}"
    ]
    policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

#
# Lambda
#

resource "aws_lambda_function" "deals_in_stage" {
    filename = "./ken_bot.zip"
    function_name = "deals_in_stage"
    role = "${aws_iam_role.ken_bot.arn}"
    handler = "deals_in_stage.handler"
    source_code_hash = "${base64sha256(file("./ken_bot.zip"))}"
    runtime = "${var.lambda-runtime}"
    memory_size = "${var.lambda-memory["low"]}"
    timeout = "${var.lambda-timeout["low"]}"
}
