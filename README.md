# NJS_MC_HW2
Homework Assignment #2 in the Node JS Master Class
- API for a pizza-delivery company

## Overview
This is a JSON API, meaning all responses will be in JSON format and all calls that sends data must send that data in JSON format.

Users can only access their own data, so a valid token that matches their email must be sent when reading or changing any data, except for the menu which is available to all logged in users.

Users can fill a shopping cart with items from the menu. Adding an item with the quantity 0 will remove that item from the cart.

When a user places an order, their shopping cart is emptied and payment is made automatically. The user receive a confirmation email when successfully placing an order - i.e. when the payment was successful. If the payment was unsuccessful, a new attempt can be made by making a PUT request to /orders for that specific order.

Example of a payload for a GET request to /users

`{
    "email": "some.address@domain.com"
}`

## Routes
###/users###
**POST:** Creates a new user.
Required fields: firstName [string], lastName [string], email [string], streetAddress [string], password [string], tosAgreement [boolean] (request payload)

**GET:** Retrieve data from a user specified by email (except the password)
Required fields: email [string] (request parameter)
__A valid token that matches email provided must be provided in the request header__

**PUT:** Make changes to a user's information.
Required fields: email [string] (request parameter)
Optional fields: firstName, lastName, streetAddress, password (at least one must be specified) 
__A valid token that matches email provided must be provided in the request header__

**DELETE:** Deletes a user and all related objects (cart and orders).
Required fields: email [string] (request parameter)
__A valid token that matches email provided must be provided in the request header__

###/tokens###
**POST:** Issues and returns a new token for a specified user (valid for 1 hour), i.e. login the user.
Required fields: email [string], password [string] (request payload)

**GET:** Retrieves a token specified by id.
Required fields: id [string] (request parameter)

**PUT:** Extends an existing token by id. The specified token cannot be expired.
Required fields: id [string], extend [boolean] (request payload)

**DELETE:** Deletes a token specified by id.
Required fields: id [string] (request parameter)

###/menu###
**GET:** Fetches the menu. User needs to be logged in, i.e. must have a valid token.
Required fields: none
__A valid token must be provided in the request header__

###/carts###
**POST:** Creates a shopping cart for the specified user 
Required fields: email [string] (request payload)
__A valid token that matches email provided must be provided in the request header__

**GET:** Retrieves the contents of a cart specified by id.
Required fields: id [string] (request parameter)
__A valid token that matches the user who specified cart belongs to must be provided in the request header__

**PUT:** Adds or removes items to/from a cart specified by id.
Required fields: id [string], items [object] (request payload)
The items object's key-value pairs are: "item name" [string] and quantity [number]

Example:
`{
    "Large Pepperoni pizza": 2
}`

__A valid token that matches the user who specified cart belongs to must be provided in the request header__

###/orders###
**POST:** Place an order with the contents of a cart specified by id. When the order is placed, payment will be attempted automatically. If the payment was successful, the user will get a confirmation email.
Required fields: cartId [string] (request payload)
__A valid token that matches the user who specified cart belongs to must be provided in the request header__

**GET:** Retrieve an order specified by id.
Required field: id [string]
__A valid token that matches the user who specified order belongs to must be provided in the request header__

**PUT:** Update the payment status of an order to "Paid" or "Unpaid". Used if the payment was not successful when the order was created. Sends a confirmation email to the user upon successful payment.
Required field: id [string], paymentStatus [string] (request payload)
