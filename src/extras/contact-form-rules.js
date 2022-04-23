const name = [
  { required: true, message: "name must be at least 3 characters long" },
  { min: 3, message: "name must be at least 3 characters long" },
]

const email = [
  { required: true, message: "email must have a valid format" },
  { type: "email", message: "email must have a valid format" },
]

const message = [
  { required: true, message: "message must be at least 5 characters long" },
  { min: 5, message: "message must be at least 5 characters long" },
]

export const contactFormRules = {
  name,
  email,
  message,
}
