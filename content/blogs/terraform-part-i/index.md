---
title: Terraform - Part I
tags: ["terraform", "aws"]
---

In this blog, I would cover my understanding of Terraform.

# Benefits of Terraform

- since its code, we get benefits like version control
- composition - we can break down infrastructure into reusable components, so that developers would only have to provision these components
- cloud agnostic - available for all popular cloud providers like aws, google cloud, azure
- terraform uses graphs internally to understand how resources depend on each other, which helps deploy dependent resources in order and independent resources in parallel

# Primary Commands

### `terraform init`

- downloads providers, modules, etc. to be able to run
- it's the first command we run in the terraform source directory
- it creates a .terraform folder which is managed by terraform
- a lock file, .terraform.lock.hcl is generated which helps in locking the exact versions being used
- we can use the flag `-upgrade` so that the versions mentioned in the lock file are ignored and latest possible versions are overwritten to the lock file and installed
- we need to rerun this command when we add a provider, module, update versions, etc.

### `terraform validate`

- validates the syntax we write
- it cannot validate everything e.g. incorrect ec2 ami id
- we can use the flag `-json` to get json output, it can help in configuring pipelines

### `terraform plan`

- it updates the local state according to the infrastructure
- it works like a dry run
- it displays an execution plan which shows the changes terraform will make to update the infrastructure according to the configuration files provided by us
- to output the plan to a local file, use `terraform plan -out xyz` which can then be applied
- different symbols and their meanings -
  - `+` - created
  - `-` - destroyed
  - `-+` - destroyed and then recreated
  - `~` - updated in place

### `terraform apply`

- applies the execution plan
- we can provide a plan we created using `terraform apply xyz`
- we are prompted to approve the plan
- to prevent this prompt, use `-auto-approve` flag

### `terraform destroy`

- deletes all resources created by terraform
- again, to prevent the prompt, use `-auto-approve` flag

### `terraform fmt`

- formats the code
- add `-recursive` flag to format recursively e.g. format modules as well
- add `-check` flag to check the formatting

# Hashicorp Configuration Language

- abbreviated as hcl, this is the language we use to write terraform configuration files
- meant to be both machine and human-readable
- it uses **blocks** like settings, provider, resource, data, input variables, local variables, output values, modules

# Components of a Block

- each line is an argument, which is a key value pair
- the key is called an identifier and the value is an expression which gets evaluated

```
# Template
<BLOCK TYPE> "<BLOCK LABEL>" "<BLOCK LABEL>" {
  # Block body
  <IDENTIFIER> = <EXPRESSION> # Argument
}
```

# Architecture

- terraform is written in go programming language
- terraform is divided into two parts - terraform core and terraform plugins
- terraform core implements basic functionality like state management, constructing a resource graph, executing plans, using rpc to communicate with terraform plugins, etc.
- terraform plugins extend the functionality by providing implementation e.g. provider for AWS

# Providers

- providers for popular cloud alternatives like aws, azure, gcp, alibaba are already present
- we can look at them at [terraform registry](https://registry.terraform.io)
- `terraform version` - version of terraform core and all installed plugins
- `terraform providers` - get why a provider was required e.g. which modules depend on which providers
- when we add a new provider, we have to rerun `terraform init` so that terraform can fetch the required files
- terraform stores the provider in .terraform/providers/provider_name

# Version Constraints

- used for specifying version of providers, terraform core, modules, etc. to use. [docs](https://www.terraform.io/language/expressions/version-constraints)
- `=`, `!=`, `>`, `>=`, `<`, `<` are self explanatory
- `~=` - only the rightmost portion (patch) can be incremented

# Terraform Block and Required Providers

- terraform block e.g.
  ```hcl
  terraform {
    # terraform core version
    required_version = ">= 1.0.0"
  
    # which providers to use and from where
    required_providers {
      aws = {
        source  = "hashicorp/aws"
        version = "3.74.0"
      }
    }
  }
  ```
- in the terraform block, `required_providers` block is actually optional and a best practice
- if we just provision a resource like an ec2 instance, terraform itself will understand and automatically download the aws provider related code, without us ever writing `required_providers`
- e.g. just use the below code in main.tf and run `terraform init`. there is no failure
  ```hcl
  resource "aws_instance" "web_server" {
    ami           = "ami-0a8b4cd432b1c3063"
    instance_type = "t2.micro"
  }
  ```

# Providing AWS Credentials

- there are multiple ways of providing aws credentials [docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#authentication)
- specify which profile to use, (created using `aws configure`)
- it cannot be reused easily when we switch to for e.g. terraform cloud
  ```hcl
  provider "aws" {
    profile = "terraform"
    region  = "us-east-1"
  }
  ```
- so, providing environment variables like `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` might be an easier option

# Resource

- each resource block represents one or multiple infrastructure objects
- using arguments, we can specify configuration for these infrastructure objects, e.g.
  ```hcl
  resource "aws_instance" "server" {
    ami           = "ami-0a8b4cd432b1c3063"
    instance_type = "t2.micro"
  }
  ```
- `aws_instance` is the resource type, `server` is a name given to it
- now, we can reference this resource anywhere in the code using `aws_instance.server`
- [docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/instance)
  have argument references and attribute references,
- **argument references** - what we specify inside the resource to configure it
- **attribute references** - properties of a resource. they can be used to, configure other resources
- e.g. of argument references and attribute references -
  ```hcl
  resource "random_id" "random_gen" {
    byte_length = 16
  }
  
  resource "aws_s3_bucket" "s3_storage" {
    bucket = "terraform-storage-${random_id.random_gen.id}"
    acl    = "private"
  
    tags = {
      Name = "s3_storage"
    }
  }
  ```

# Input Variables

### Usage

- also called variables sometimes
- it can have the following identifiers - `type`, `description`, `default`, `sensitive`, `validation`
- by convention, we put all input variable declarations in variables.tf
- variables.tf -
  ```hcl
  variable "subnet_az" {
    description = "availability zone for subnet"
    type        = string
    default     = "us-east-1a"
  }
  
  variable "subnet_cidr" {
    description = "cidr for subnet"
    type        = string
    default     = "172.31.96.0/20"
  }
  ```
- using the variables in main.tf -
  ```hcl
  resource "aws_subnet" "custom_subnet" {
    availability_zone = var.subnet_az
    cidr_block        = var.subnet_cidr
  
    tags = {
      Name = "custom_subnet"
    }
  }
  ```

### Validation  

we use attributes `condition` and `error_message`

```hcl
variable "cloud" {
  type = string

  validation {
    condition     = contains(["aws", "gcp", "azure"], lower(var.cloud))
    error_message = "You must use an approved cloud."
  }

  validation {
    condition     = var.cloud == lower(var.cloud)
    error_message = "Cloud name should be in all lower case."
  }
}
```

### Assigning Values

- there are multiple ways to provide values to these variables, some have been described here
- so, these multiple ways have a [precedence order](https://www.terraform.io/language/values/variables#variable-definition-precedence)
- we can make input variables act like environment variables by prefixing with `TF_VAR_`
  ```
  export TF_VAR_name=web_server
  export TF_VAR_environment=dev
  ```
- we can also set them in the file terraform.tfvars, just using key value pairs
  ```
  name = web_server
  environment = dev
  ```
- terraform automatically picks up such files -
  - with name terraform.tfvars
  - file name ending with .auto.tfvars
- we can also pass it via cli `terraform apply -var name=web_server -var environment=dev`

### Sensitive

- input variables have an attribute called sensitive
- marking as `sensitive = true` only hides them from console outputs, the value can still be seen in state files
- this way, only people having access to state can see the values (e.g. if state is stored in s3), not others from sources like build pipeline outputs
- one way to handle secrets is to use environment variables, by prefixing with `TF_VAR_`
- we can use `export` to set it locally and not check it into the version control system
- another way for more control is to use hashicorp vault

# Local Variables

- local variables are like input variables but have lesser features
- a use case is to store results of expressions to avoid repeating expressions everywhere
- we can have multiple `locals` block declarations
- use via object `local` e.g. `local.environment`
- used for storing intermediate results to avoid repetition, e.g. sharing common tags across all resources
  ```hcl
  locals {
    common_tags = {
      Name        = "terraform_demo"
      Environment = "dev"
    }
  }
  
  resource "aws_instance" "server" {
    # other arguments...
    tags = local.common_tags
  }
  ```

# Data

- we can query infrastructure not managed by terraform e.g. the default vpc in aws. [docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/vpc)
- once terraform grabs information about this, we can use its attribute references in our configuration. e.g. -
  ```hcl
  data "aws_vpc" "default_vpc" {
    id = "vpc-07e636jj690eb6a77"
  }
  
  resource "aws_subnet" "web_server_subnet" {
    # other arguments...
    vpc_id = data.aws_vpc.default_vpc.id
  }
  ```

# Output

- allows us output structured data
- it can be used as an input for automation tools or other modules
- by convention, placed inside outputs.tf
- we can run `terraform output` to get the output
- we can use `terraform output -json` and use jq library to parse the json to use the output elsewhere
- another way to use the output - `ping $(terraform output -raw web_server_public_ip)`
- just like input variables, marking as `sensitive = true` only hides them from console outputs, but their values can still be seen in the state files. e.g. -
  ```hcl
  output "web_server_public_ip" {
    value = aws_instance.web_server.public_ip
  }
  ```

# Provisioners

- model actions on the remote or local machine
- local machine - what terraform is running on
- remote machine - e.g. ec2 instances created by terraform
- `local-exec` - execute commands on the local machine
- `remote-exec` - execute commands on the remote machine. requires connection block as well
- `file-exec` - copy files from the local machine to the remote machine

```hcl
resource "aws_instance" "web_server" {
  # other arguments...

  provisioner "local-exec" {
    command = "chmod 600 ${local_file.web_server_private_key.filename}"
  }

  connection {
    user        = "ubuntu"
    private_key = tls_private_key.web_server_key_pair_gen.private_key_pem
    host        = self.public_ip
  }

  provisioner "remote-exec" {
    inline = [
      "sudo apt update -y",
      "sudo apt upgrade -y",
      "sudo apt install apache2 -y",
      "sudo systemctl status apache2 --no-pager"
    ]
  }
}
```

full example [here](https://gist.github.com/shameekagarwal/ac6da45db53cab28aec80723cbfc4a86). issues addressed by the example -

- using ami lookup to get the ubuntu image
- security group with rules for ports 80 and 22 and then attaching it to ec2
- creating a key pair, where the public key is attached to ec2 and private key is downloaded locally
- `remote-exec` to install the apache server on ec2
- `local-exec` to set permissions of the private key pair

# Replace

- when we change the scripts inside local-exec and remote-exec, the infrastructure won't be recreated
- to enforce recreating, we can use `terraform apply -replace=aws_instance.web_server`
- its deprecated alternative is `terraform taint`

# Taint

- taint helps in marking a resource manually so that it can be recreated
- in the following example, remote-exec provisioner will fail because of the exit
- when the instance is created, this will fail, though other resources will be created
- when we run `terraform state show aws_instance.web_server`, we see the instance is marked as tainted
- this means the next time we run apply, terraform will try to create it again

```hcl
resource "aws_instance" "web_server" {
  # other arguments...

  provisioner "remote-exec" {
    inline = [
      "exit 2",
    ]
  }
}
```

# Import

- data blocks are used to reference infrastructure not managed by terraform
- import can be used to start managing infrastructure which was not initially managed by terraform
- e.g. of where to look in [docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/instance#import)

steps -

1. launch an instance manually
2. create a main.tf with resource as below -
   ```hcl
   resource "aws_instance" "server" {
   }
   ```
3. run `terraform import aws_instance.server i-050a8498ca4ff9de1`
4. our state is now successfully tracking the resource, but our configuration is incomplete
5. commands like `terraform plan` give an error, asking to state the "required arguments"
6. we can run `terraform state show aws_instance.server` to get the different attributes
7. now we can accordingly update the main.tf file, e.g.
   ```hcl
   resource "aws_instance" "server" {
     ami           = "ami-0a8b4cd432b1c3063"
     instance_type = "t2.micro"
   }
   ```

# Workspaces

- this is about managing terraform workspace locally
- helps in managing different environments like development, production using terraform
- by default, we are in the workspace default
- `terraform workspace show` shows the current workspace
- `terraform workspace new development` - create and switch to workspace development
- `terraform workspace list` - shows all the workspaces with the current workspace marked
- `terraform workspace select default` - switch to the workspace default
- note: `terraform workspace select ...` is not like `git switch` i.e. the code files always remain the same, its just that there are "different states" maintained for the different workspaces i.e. using `terraform apply` will affect the state of the workspace that we are in
- e.g. -
  ```hcl
  resource "aws_instance" "server" {
    ami           = "ami-0a8b4cd432b1c3063"
    instance_type = "t2.micro"
  
    tags = {
      "Name" = "${terraform.workspace}Server"
    }
  }
  ```
- we create a new workspace development, production resources are in the default workspace
- we can now create two instances, one each for development and default workspace
- we can assign different names to the ec2 instances based on the variable `terraform.workspace`

# Module

- using modules, we can group different infrastructure components into a reusable container
- we can either use terraform registry for remote public modules or develop modules locally
- by convention, local modules are saved under the folder modules/local_module_name/
- when we add a new remote module, we have to rerun `terraform init`, and the module gets downloaded under .terraform/modules/module_name/
- we work in the root module by default
- when we run terraform apply, it only looks for .tf files in the current directory, and it is not recursive in nature i.e. it does not look inside nested directories
- this feature of terraform is used while creating modules i.e. local modules are inside nested directories
- modules can come from different sources like local, remote, github, etc. [docs](https://www.terraform.io/language/modules/sources)
- we use public module registry to utilize modules by others. [docs](https://registry.terraform.io/browse/modules)
- terraform modules can have input and outputs
- for organizing code, we break modules into main.tf, variables.tf, outputs.tf
- we use [input variables](#input-variables) for inputs to a module and [outputs](#output) for outputs from a module
- only outputs of child modules can be used inside root modules i.e. we cannot reference resources of child modules to utilize argument references directly
- terraform uses .terraform/modules/remote_module_name for storing remote module
- .terraform/modules/module.json has meta information which helps terraform in mapping module blocks
- using modules examples -
  - [Remote Module Example](https://gist.github.com/shameekagarwal/ab5fdbecdfacea951afd1c0c7d98efab) - note keys `source` and `version` inside the module
  - [Local Module Example](https://gist.github.com/shameekagarwal/1b2b336fb6a4443569e3265d78a604bd) - note the passing and usage of inputs and outputs
