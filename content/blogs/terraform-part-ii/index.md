---
title: Terraform - Part II
tags: ["terraform", "aws"]
---

In this blog, I would cover my understanding of Terraform. It's a follow-up to [this blog](/terraform-part-i).

# State

- state helps connect the terraform configuration we write to the infrastructure
- terraform can create, update, or destroy resources when we ask terraform to execute a change
- it makes these decisions based on the old state, executes the changes and then updates the state
- we should not modify the state directly ourselves
- `terraform show` - shows the state i.e. all resources
- `terraform state list` - displays a list of resources being managed by terraform
- `terraform state show aws_instance.web_server` - shows the state of a particular resource
- `terraform refresh` - update the local state by fetching the changes that may have happened to the infrastructure being tracked by terraform
- `terraform refresh` is automatically run as a part of `terraform plan`
- `terraform plan` is automatically run as a part of `terraform apply`
- where the terraform state is located and operated upon is determined by "backend"
- by default, terraform uses local backend, wherein the state is stored in the terraform.tfstate file
- a backup is also maintained by terraform at terraform.tfstate.backup
- specifying the default strategy explicitly -
  ```hcl
  backend "local" {
    path = "terraform.tfstate"
  }
  ```

# State Locking

- suppose we run `terraform apply` in one terminal
- instead of answering the prompt, we again run `terraform apply` in a different terminal
- we get `Error: Error acquiring the state lock`
- at a time, only one client can modify the state
- we can also see the momentarily created file called .terraform.tfstate.lock.info
- we can specify a lock timeout e.g. `terraform apply -auto-approve -lock-timeout=60s`, which means the current terminal will wait for 60s for the lock to be freed, else it would time out
- not all remote state backends allow state locking

# Backend

- we can also store state remotely e.g. we can store state in s3, terraform cloud
- we can also use http backends i.e. a server which allows crud. refer [docs](https://www.terraform.io/language/settings/backends/http)
- [earlier](https://www.terraform.io/language/settings/backends), terraform used to divide backends into standard backend and enhanced backend
- **standard backend** - store state remotely, perform operations locally e.g. s3
- **enhanced backend** - store state remotely, perform operations remotely e.g. terraform cloud
- we can use `terraform init -migrate-state` when we change the backend e.g. local to remote backend
- we can use `terraform init -reconfigure` when we want to ignore the current stored state and reinitialize it

# S3 Backend

- manually create a bucket beforehand i.e. the s3 bucket used to stored state won't be managed by terraform
- while using s3, we should enable "versioning" and "encryption" in buckets
- for implementing state locking in s3 while using terraform, we need to connect with dynamodb
- we can view the lock in the dynamo db table, if we leave the prompt after terraform apply hanging
- note: I had to specify the `profile` identifier twice i.e. under the `backend` and for the `provider`
- else we could have used environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- encryption of state is maintained by tls in transit and aes-256 mechanism on server

```hcl
terraform {
  required_version = "~> 1.1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.74.0"
    }
  }

  backend "s3" {
    profile        = "terraform"
    bucket         = "standard-backend-sf26vkx51wokpza4be9p"
    key            = "prod"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "standard-backend-lock"
  }
}

provider "aws" {
  profile = "terraform"
  region  = "us-east-1"
}

# code for resources...
```

# Remote Backend

- create an account in terraform cloud
- run `terraform login`, create an api token in the web browser and enter it into the prompt
- create an organization and a workspace inside the organization
- even though we run commands from terminal, they are actually executed in the cloud
- the output is streamed to our terminal
- for authentication, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` optionally `AWS_DEFAULT_REGION` in the workspace itself
- it has inbuilt state locking, no extra step like s3 backend is needed

### Method 1

[new and preferred](https://www.terraform.io/language/settings/backends/remote), but couldn't support partial backend configuration when I tried

```hcl
terraform {
  required_version = "~> 1.1.0"

  # required_providers...

  cloud {
    organization = "shameek"
    workspaces {
      name = "learning-terraform"
    }
  }
}

# code for resources...
```

### Method 2

older, supports partial backend configuration when I tried

```hcl
terraform {
  required_version = "~> 1.1.0"

  # required_providers...

  backend "remote" {
    hostname     = "app.terraform.io"
    organization = "shameek"

    workspaces {
      name = "learning-terraform"
    }
  }
}

# code for resources...
```

# Collection Types

- primitive types - string, number, bool
- complex or collection or structure types - list, tuple, map
- list vs tuple - in a list all elements are of same type, not necessarily in tuple

example using list -

```hcl
variable "us_east_1_azs" {
  type = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

resource "aws_subnet" "subnet" {
  vpc_id            = "vpc-04e232cc690eb2a44"
  cidr_block        = "10.0.200.0/24"
  availability_zone = var.us_east_1_azs[0]
}
```

example using `for_each` on map, it iterates over all key-value pairs, so that we can use `each.key` and `each.value` -

```hcl
variable "subnet_cidr_block" {
  type = map(string)

  default = {
    server = "10.0.150.0/24"
    worker = "10.0.250.0/24"
  }
}

resource "aws_subnet" "subnet" {
  for_each          = var.subnet_cidr_block
  vpc_id            = "vpc-04e232cc690eb2a44"
  cidr_block        = each.value
  availability_zone = "us-east-1a"
  tags {
    Name = "${each.key}_subnet"
  }
}
```

# Built-In Functions

there are different categories of functions like numeric functions, string functions, etc. [docs](https://www.terraform.io/language/functions)

```hcl
variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

locals {
  subnet_arr = range(3)
}

output "public_subnet_1" {
  value = cidrsubnet(var.vpc_cidr, 8, local.subnet_arr[0])
}

output "public_subnet_2" {
  value = cidrsubnet(var.vpc_cidr, 8, local.subnet_arr[1])
}

output "public_subnet_3" {
  value = cidrsubnet(var.vpc_cidr, 8, local.subnet_arr[2])
}

# public_subnet_1 = "10.0.0.0/24"
# public_subnet_2 = "10.0.1.0/24"
# public_subnet_3 = "10.0.2.0/24"
```

# Dynamic Block

- **generates nested blocks** for each element of the array
- it helps in refactoring, code reuse
- the name of the dynamic block is used to reference each element of the array

initial -

```hcl
resource "aws_security_group" "server_security_group" {
  name   = "server_security_group"
  vpc_id = "vpc-04e232cc690eb2a44"

  ingress {
    description = "Port 443"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Port 80"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

final -

```hcl
locals {
  server_security_group_ingress = [
    { port = 443, description = "https traffic", protocol = "tcp" },
    { port = 80, description = "http traffic", protocol = "tcp" }
  ]
}

resource "aws_security_group" "server_security_group" {
  name   = "server_security_group"
  vpc_id = "vpc-04e232cc690eb2a44"

  dynamic "ingress" {
    for_each = locals.server_security_group_ingress
    content {
      description = ingress.value.description
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

# Lifecycle

- terraform resources have a lifecycle
- we can alter this behavior by setting it to `create_before_destroy`
- e.g. we have a security group attached to an ec2
- if we make a modification e.g. change the name of security group in the configuration
- `terraform apply` will fail because the ec2 depends on the security group, thus causing a dependency violation
- we can therefore use the `create_before_destroy` flag and the operation would succeed

```hcl
resource "aws_security_group" "web_server_security_group" {
  name   = "web_server_security_group_upd"
  vpc_id = data.aws_vpc.default_vpc.id

  ingress {
    description = "http"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "web_server" {
  ami                    = "ami-0a8b4cd432b1c3063"
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.web_server_security_group.id]
}
```

- we can also add `prevent_destroy = true` inside the lifecycle block
- this way the resource never gets deleted even if the plan requires it to be destroyed

# Terraform Cloud

- when we create a new workspace within terraform cloud, we get to select the type of workflow we want
- workflow can be version control, cli driven or api driven
- in terraform cloud, each workspace can represent an environment like development, production, etc
- variable sets, found under settings for the organization, help create variables that can be shared between workspaces in an organization e.g. aws credentials can be common for dev and prod environments
- each workspace is made to track a particular remote branch of the vcs
- we can set the branch to track in the vcs workflow, so that once a push is made to that branch, terraform cloud will automatically trigger a `terraform apply`
- remember in this flow, the terraform version to use, the aws credentials to use, even the workspace to use, etc all is done through terraform cloud and not via our configuration files

# Partial Backend Configuration

- note: this would apply if we specify the workspace to use through our local configuration
- we cannot use variables for terraform backend e.g. use string interpolation etc
- partial backends helps us use the same code for different backends
- so, we can create a file dev.hcl, with contents `workspaces { name = "terraform-cloud-dev" }`
- we can start with `terraform init -backend-config=dev.hcl -reconfigure`
- note: `-reconfigure` helps in ignoring earlier saved state
- similarly, for production, first run the init command with prod.hcl and then use commands like `apply`
