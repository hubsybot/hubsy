#
# Backend
#

terraform { backend "s3" { } }

#
# S3 Bucket
#

resource "aws_s3_bucket" "hubsy" {
    bucket = "www.hubsybot.com"

    cors_rule {
        allowed_methods = ["GET", "HEAD"]
        allowed_origins = ["*"]
    }

    website {
        index_document = "index.html"
        error_document = "index.html"
    }
}

resource "aws_s3_bucket_policy" "hubsy" {
    bucket = "${aws_s3_bucket.hubsy.id}"
    policy = "${data.aws_iam_policy_document.hubsy.json}"
}

data "aws_iam_policy_document" "hubsy" {
    statement {
        actions = ["s3:GetObject"]
        resources = ["arn:aws:s3:::${aws_s3_bucket.hubsy.id}/*"]

        principals {
            type = "AWS"
            identifiers = ["*"]
        }
    }
}

#
# Configuration
#

variable "aws_account_id" { default = "012581555088" }
variable "aws_region" { type = "string" }
variable "cloudwatch_log_retention" { default = 7 }
variable "lambda_runtime" { default = "nodejs6.10" }
variable "lambda_memory" { default = {
    low = "128"
    medium = "256"
    high = "512"
}}
variable "lambda_timeout" { default = {
    low = "60"
    medium = "120"
    high = "240"
}}

#
# CloudWatch Logs
#

resource "aws_cloudwatch_log_group" "create_engagement_for" {
    name = "/aws/lambda/create_engagement_for"
    retention_in_days = "${var.cloudwatch_log_retention}"
}

resource "aws_cloudwatch_log_group" "get_contact_info" {
    name = "/aws/lambda/get_contact_info"
    retention_in_days = "${var.cloudwatch_log_retention}"
}

resource "aws_cloudwatch_log_group" "deals_in_stage" {
    name = "/aws/lambda/deals_in_stage"
    retention_in_days = "${var.cloudwatch_log_retention}"
}

resource "aws_cloudwatch_log_group" "engagements_by_people" {
    name = "/aws/lambda/engagements_by_people"
    retention_in_days = "${var.cloudwatch_log_retention}"
}

resource "aws_cloudwatch_log_group" "compare_sales_people" {
    name = "/aws/lambda/compare_sales_people"
    retention_in_days = "${var.cloudwatch_log_retention}"
}

resource "aws_cloudwatch_log_group" "total_in_deals" {
    name = "/aws/lambda/total_in_deals"
    retention_in_days = "${var.cloudwatch_log_retention}"
}

resource "aws_cloudwatch_log_group" "alexa_router" {
    name = "/aws/lambda/alexa_router"
    retention_in_days = "${var.cloudwatch_log_retention}"
}

#
# Roles
#

resource "aws_iam_role" "hubsy" {
    name = "hubsy"
    assume_role_policy = "${data.aws_iam_policy_document.hubsy_lambda_assume_role_policy.json}"
}

data "aws_iam_policy_document" "hubsy_lambda_assume_role_policy" {
    statement {
        principals {
            type = "Service"
            identifiers = ["lambda.amazonaws.com"]
        }
        actions = ["sts:AssumeRole"]
    }
}

resource "aws_iam_policy_attachment" "hubsy_attachment" {
    name = "hubsy_attachment"
    roles = [
        "${aws_iam_role.hubsy.id}"
    ]
    policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

#
# Lambda
#

resource "aws_lambda_function" "create_engagement_for" {
    filename = "./hubsy.zip"
    function_name = "create_engagement_for"
    role = "${aws_iam_role.hubsy.arn}"
    handler = "create_engagement_for.handler"
    source_code_hash = "${base64sha256(file("./hubsy.zip"))}"
    runtime = "${var.lambda_runtime}"
    memory_size = "${var.lambda_memory["low"]}"
    timeout = "${var.lambda_timeout["low"]}"
}

resource "aws_lambda_function" "get_contact_info" {
    filename = "./hubsy.zip"
    function_name = "get_contact_info"
    role = "${aws_iam_role.hubsy.arn}"
    handler = "get_contact_info.handler"
    source_code_hash = "${base64sha256(file("./hubsy.zip"))}"
    runtime = "${var.lambda_runtime}"
    memory_size = "${var.lambda_memory["low"]}"
    timeout = "${var.lambda_timeout["low"]}"
}

resource "aws_lambda_function" "deals_in_stage" {
    filename = "./hubsy.zip"
    function_name = "deals_in_stage"
    role = "${aws_iam_role.hubsy.arn}"
    handler = "deals_in_stage.handler"
    source_code_hash = "${base64sha256(file("./hubsy.zip"))}"
    runtime = "${var.lambda_runtime}"
    memory_size = "${var.lambda_memory["low"]}"
    timeout = "${var.lambda_timeout["low"]}"
}

resource "aws_lambda_function" "total_in_deals" {
    filename = "./hubsy.zip"
    function_name = "total_in_deals"
    role = "${aws_iam_role.hubsy.arn}"
    handler = "total_in_deals.handler"
    source_code_hash = "${base64sha256(file("./hubsy.zip"))}"
    runtime = "${var.lambda_runtime}"
    memory_size = "${var.lambda_memory["low"]}"
    timeout = "${var.lambda_timeout["low"]}"
}

resource "aws_lambda_function" "engagements_by_people" {
    filename = "./hubsy.zip"
    function_name = "engagements_by_people"
    role = "${aws_iam_role.hubsy.arn}"
    handler = "engagements_by_people.handler"
    source_code_hash = "${base64sha256(file("./hubsy.zip"))}"
    runtime = "${var.lambda_runtime}"
    memory_size = "${var.lambda_memory["low"]}"
    timeout = "${var.lambda_timeout["low"]}"
}

resource "aws_lambda_function" "compare_sales_people" {
    filename = "./hubsy.zip"
    function_name = "compare_sales_people"
    role = "${aws_iam_role.hubsy.arn}"
    handler = "compare_sales_people.handler"
    source_code_hash = "${base64sha256(file("./hubsy.zip"))}"
    runtime = "${var.lambda_runtime}"
    memory_size = "${var.lambda_memory["low"]}"
    timeout = "${var.lambda_timeout["low"]}"
}

resource "aws_lambda_function" "alexa_router" {
    filename = "./hubsy.zip"
    function_name = "alexa_router"
    role = "${aws_iam_role.hubsy.arn}"
    handler = "alexa_router.handler"
    source_code_hash = "${base64sha256(file("./hubsy.zip"))}"
    runtime = "${var.lambda_runtime}"
    memory_size = "${var.lambda_memory["low"]}"
    timeout = "${var.lambda_timeout["low"]}"
}

#
# Permissions
#

# Create Engagement For

resource "aws_lambda_permission" "create_engagement_for_lex" {
    statement_id = "lex-${var.aws_region}-${aws_lambda_function.create_engagement_for.function_name}"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.create_engagement_for.function_name}"
    principal = "lex.amazonaws.com"
    source_arn = "arn:aws:lex:us-east-1:${var.aws_account_id}:intent:${aws_lambda_function.create_engagement_for.function_name}:*"
}

# Contact Info

resource "aws_lambda_permission" "get_contact_info_lex" {
    statement_id = "lex-${var.aws_region}-${aws_lambda_function.get_contact_info.function_name}"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.get_get_contact_info.function_name}"
    principal = "lex.amazonaws.com"
    source_arn = "arn:aws:lex:us-east-1:${var.aws_account_id}:intent:${aws_lambda_function.get_contact_info.function_name}:*"
}

# Engagements By People

resource "aws_lambda_permission" "engagements_by_people_lex" {
    statement_id = "lex-${var.aws_region}-${aws_lambda_function.engagements_by_people.function_name}"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.engagements_by_people.function_name}"
    principal = "lex.amazonaws.com"
    source_arn = "arn:aws:lex:us-east-1:${var.aws_account_id}:intent:${aws_lambda_function.engagements_by_people.function_name}:*"
}

# Compare Sales People

resource "aws_lambda_permission" "compare_sales_people_lex" {
    statement_id = "lex-${var.aws_region}-${aws_lambda_function.compare_sales_people.function_name}"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.compare_sales_people.function_name}"
    principal = "lex.amazonaws.com"
    source_arn = "arn:aws:lex:us-east-1:${var.aws_account_id}:intent:${aws_lambda_function.compare_sales_people.function_name}:*"
}

# Deals In Stage

resource "aws_lambda_permission" "deals_in_stage_lex" {
    statement_id = "lex-${var.aws_region}-${aws_lambda_function.deals_in_stage.function_name}"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.deals_in_stage.function_name}"
    principal = "lex.amazonaws.com"
    source_arn = "arn:aws:lex:us-east-1:${var.aws_account_id}:intent:${aws_lambda_function.deals_in_stage.function_name}:*"
}

# Total In Deals

resource "aws_lambda_permission" "total_in_deals_lex" {
    statement_id = "lex-${var.aws_region}-${aws_lambda_function.total_in_deals.function_name}"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.total_in_deals.function_name}"
    principal = "lex.amazonaws.com"
    source_arn = "arn:aws:lex:us-east-1:${var.aws_account_id}:intent:${aws_lambda_function.total_in_deals.function_name}:*"
}

# Alexa Router

resource "aws_lambda_permission" "alexa_router" {
    statement_id = "alexa_router"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.alexa_router.function_name}"
    principal = "alexa-appkit.amazon.com"
}
