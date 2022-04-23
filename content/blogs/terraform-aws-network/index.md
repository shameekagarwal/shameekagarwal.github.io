---
title: Terraform AWS Network
tags: ["terraform", "aws"]
---

In this blog, I would cover a basic example of configuring networking related components inside AWS using Terraform. The components include a vpc, private subnets, public subnets, an internet gateway, nat gateways and configured route tables.  

using `element(list.*.id, index)` and `list[index].id` has no difference, except that the element function has wrap around behavior, i.e. `list[length_of_list].id` will fail while `element(list.*.id, length_of_list)` will refer to the id of the first element of the list

main.tf

```hcl
terraform {
  required_version = "1.2.1"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.16.0"
    }
  }
}

provider "aws" {
  region = var.region
}

data "aws_region" "main" {}

data "aws_availability_zones" "main" {}
```

variables.tf

```hcl
variable "region" {
  default = "us-east-1"
}

variable "cidr" {
  default = "10.0.0.0/16"
}

variable "availablity_count" {
  default = 2
}
```

vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block = var.cidr
}
```

subnets.tf

```hcl
resource "aws_subnet" "private" {
  count             = var.availablity_count
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 1)
  availability_zone = data.aws_availability_zones.main.names[count.index]
  vpc_id            = aws_vpc.main.id
}

resource "aws_subnet" "public" {
  count                   = var.availablity_count
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 101)
  availability_zone       = data.aws_availability_zones.main.names[count.index]
  vpc_id                  = aws_vpc.main.id
  map_public_ip_on_launch = true
}
```

igw.tf

```hcl
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}
```

ngw.tf

```hcl
resource "aws_eip" "ngw" {
  count = var.availablity_count
  vpc   = true
}

resource "aws_nat_gateway" "main" {
  count         = var.availablity_count
  allocation_id = element(aws_eip.ngw.*.id, count.index)
  subnet_id     = element(aws_subnet.public.*.id, count.index)
}
```

public_rt.tf

```hcl
resource "aws_route_table" "public" {
  count  = var.availablity_count
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table_association" "public" {
  count          = var.availablity_count
  route_table_id = element(aws_route_table.public.*.id, count.index)
  subnet_id      = element(aws_subnet.public.*.id, count.index)
}

resource "aws_route" "public_to_igw" {
  count                  = var.availablity_count
  destination_cidr_block = "0.0.0.0/0"
  route_table_id         = element(aws_route_table.public.*.id, count.index)
  gateway_id             = aws_internet_gateway.main.id
}
```

private_rt.tf

```hcl
resource "aws_route_table" "private" {
  count  = var.availablity_count
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table_association" "private" {
  count          = var.availablity_count
  route_table_id = element(aws_route_table.private.*.id, count.index)
  subnet_id      = element(aws_subnet.private.*.id, count.index)
}

resource "aws_route" "private_to_ngws" {
  count                  = var.availablity_count
  destination_cidr_block = "0.0.0.0/0"
  route_table_id         = element(aws_route_table.private.*.id, count.index)
  nat_gateway_id         = element(aws_nat_gateway.main.*.id, count.index)
}
```
