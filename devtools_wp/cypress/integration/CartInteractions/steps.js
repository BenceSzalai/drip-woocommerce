import { Given, When, Then } from "cypress-cucumber-preprocessor/steps"
import { mockServerClient } from "mockserver-client"

const Mockclient = mockServerClient("localhost", 1080)

Given('I have a product', () => {
  cy.wpcliCreateProductCategory({
    'porcelain': '',
    'name': 'my fair category'
  })

  cy.wpcliCreateProduct({
    'name': 'My Fair Widget',
    'slug': 'fair-widget',
    'regular_price': 10.99,
    'sku': 'fair-widg-12345',
    'categories': '[{"id":16}]'
  })
})

Given('I have a second product', () => {
  cy.wpcliCreateProduct({
    'name': 'My Fair Gizmo',
    'slug': 'fair-gizmo',
    'regular_price': 11.11,
    'sku': 'fair-gzmo-67890',
    'categories': '[{"id":16}]'
  })
})

Given('I have set up a cart webhook', () => {
  cy.wrap(Mockclient.mockAnyResponse({
    "httpRequest": {
      "method": "POST",
      "path": "/my_fair_endpoint"
    },
    "httpResponse": {
      "statusCode": 202
    }
  }))

  cy.wpcliCreateWebhook({
    'name': 'My Fair Webhook',
    'topic': 'action.wc_drip_woocommerce_cart_event',
    'delivery_url': 'http://mock:8080/my_fair_endpoint'
  })
})

Given('I have a logged in user', () => {
  cy.log('Creating User')
  cy.wpcliCreateUser({
    'inviso-user-login': 'my_fair_user',
    'inviso-user-email': 'myfairuser@example.com',
    'user_pass': '123!@#abc',
    'role': 'subscriber'
  })

  cy.log('Logging in as my_fair_user')
  cy.visit('http://localhost:3007/wp-login.php')
  cy.contains('Lost your password?')
  cy.get('#user_login').clear().type('my_fair_user')
  cy.get('#user_pass').clear().type('123!@#abc')
  cy.get('#wp-submit[value="Log In"]').click()
  cy.contains("Hello world!")
})

Then('I add {string} to a cart', (product) => {
  let slug = '/?product=fair-widget'
  if(product === 'My Fair Gizmo') {
    slug = '/?product=fair-gizmo'
  }
  cy.visit(slug)
  cy.wrap(Mockclient.reset())
  cy.contains('Add to cart').click().wait(300)
  cy.contains('has been added to your cart')
})

Then('I add it to a cart', () => {
  // This is the product slug
  cy.visit('/?product=fair-widget')
  cy.wrap(Mockclient.reset())
  cy.contains('Add to cart').click()
  cy.contains('has been added to your cart')
})

Then('I remove it from the cart', () => {
  cy.visit('http://localhost:3007/?page_id=4') // using the page SLUG won't work here
  cy.wrap(Mockclient.reset())
  cy.contains("Proceed to checkout")
  cy.get('a.remove[data-product_id="6"]').click()
  cy.contains("Your cart is currently empty.")
})

Then ('I remove the widget from the cart', () => {
  cy.visit('http://localhost:3007/?page_id=4') // using the page SLUG won't work here
  cy.wrap(Mockclient.reset())
  cy.contains("Proceed to checkout")
  cy.get('a.remove[data-product_id="6"]').click()
  cy.contains(/.*My Fair Widget.* removed\./)
})

Then('I restore it to the cart', () => {
  cy.contains('Undo?')
  cy.wrap(Mockclient.reset())
  cy.get('a.restore-item').click().wait(300)
  cy.contains('Update cart')
})

Then('I increase the quantity in the cart', () => {
  cy.visit('http://localhost:3007/?page_id=4')
  cy.contains("Update cart")
  cy.get('input[title="Qty"]').first().clear().type('9001')
  cy.wrap(Mockclient.reset())
  cy.get('button[name="update_cart"]').click().wait(300)
  cy.contains("Cart updated.")
})

Then('I decrease the quantity in the cart to zero', () => {
  cy.visit('http://localhost:3007/?page_id=4')
  cy.contains("Update cart")
  cy.get('input[title="Qty"]').first().clear().type('0')
  cy.wrap(Mockclient.reset())
  cy.get('button[name="update_cart"]').click().wait(300)
  cy.contains("Your cart is currently empty.")
})

Then('I get sent a webhook', () => {
  cy.log('Validating that we got the webhook')
  cy.wrap(Mockclient.retrieveRecordedRequests({
    'path': '/my_fair_endpoint',
    'headers': {
      'X-WC-Webhook-Topic': ["action.wc_drip_woocommerce_cart_event"]
    }
  })).then(function (recordedRequests) {

    cy.wrap(validateRequests(recordedRequests)).then(function (body) {
      const event = validateRequestBody(body)
      expect(event.grand_total).to.eq('10.99')
      expect(Object.keys(event.cart_data)).to.have.lengthOf(1)
      validateMyFairWidget(event)
    })
  })
})

Then('I get sent a webhook with an empty cart', () => {
  cy.log('Validating that we got the webhook')
  cy.wrap(Mockclient.retrieveRecordedRequests(
    {
      'path': '/my_fair_endpoint',
      'headers': {
        'X-WC-Webhook-Topic': ["action.wc_drip_woocommerce_cart_event"]
      }
    }
  )).then(function (recordedRequests) {
    cy.wrap(validateRequests(recordedRequests)).then(function (body) {
      const event = validateRequestBody(body)
      expect(Object.keys(event.cart_data)).to.have.lengthOf(0)
      expect(event.grand_total).to.eq(0)
      expect(event.cart_data).to.be.empty
    })
  })
})

Then('I get sent an updated webhook', () => {
  cy.log('Validating that we got the webhook')
  cy.wrap(Mockclient.retrieveRecordedRequests(
    {
      'path': '/my_fair_endpoint',
      'headers': {
        'X-WC-Webhook-Topic': ["action.wc_drip_woocommerce_cart_event"]
      }
    }
  )).then(function (recordedRequests) {
    cy.wrap(validateRequests(recordedRequests)).then(function (body) {
      const event = validateRequestBody(body)
      expect(Object.keys(event.cart_data)).to.have.lengthOf(1)
      validateMyFairWidget(event, 9001)
      expect(event.grand_total.toString()).to.eq(`${10.99 * 9001}`)
    })
  })
})

Then('I get sent a webhook with two products', () => {
  cy.log('Validating that we got the webhook')
  cy.wrap(Mockclient.retrieveRecordedRequests(
    {
      'path': '/my_fair_endpoint',
      'headers': {
        'X-WC-Webhook-Topic': ["action.wc_drip_woocommerce_cart_event"]
      }
    }
  )).then(function (recordedRequests) {
    cy.wrap(validateRequests(recordedRequests)).then(function (body) {
      console.log(body)
      const event = validateRequestBody(body)
      expect(Object.keys(event.cart_data)).to.have.lengthOf(2)
      expect(event.grand_total).to.eq('22.10')
      validateMyFairWidget(event)
      validateMyFairGizmo(event)
    })
  })
})

Then('I get sent a webhook with a cart session ID', () => {
  cy.log('Validating the webhook has a valid cart session id')
  cy.wrap(Mockclient.retrieveRecordedRequests(
    {
      'path': '/my_fair_endpoint',
      'headers': {
        'X-WC-Webhook-Topic': ["action.wc_drip_woocommerce_cart_event"]
      }
    }
  )).then(function (recordedRequests) {
    const body = validateRequests(recordedRequests)
    const event = JSON.parse(decodeBase64(body.arg))
    expect(event.session).to.have.lengthOf(64)
    cy.wrap(event.session).as('lastCartSession')
  })
})

Then('I get sent a webhook with a different cart session ID', () => {
  cy.log('Validating the webhook has a new cart session ID')
  cy.wrap(Mockclient.retrieveRecordedRequests(
    {
      'path': '/my_fair_endpoint',
      'headers': {
        'X-WC-Webhook-Topic': ["action.wc_drip_woocommerce_cart_event"]
      }
    }
  )).then(function (recordedRequests) {
    const body = validateRequests(recordedRequests)
    cy.wrap(this.lastCartSession).then(function(lastCartSession) {
      const event = JSON.parse(decodeBase64(body.arg))
      expect(lastCartSession).to.have.lengthOf(64)
      expect(event.session).to.have.lengthOf(64)
      expect(event.session).to.not.eq(lastCartSession)
      cy.wrap(event.session).as('lastCartSession')
    })
  })
})

Then('I get sent a webhook with the same cart session ID', () => {
  cy.log('Validating the webhook receives a persisted cart session id')
  cy.wrap(Mockclient.retrieveRecordedRequests(
    {
      'path': '/my_fair_endpoint',
      'headers': {
        'X-WC-Webhook-Topic': ["action.wc_drip_woocommerce_cart_event"]
      }
    }
  )).then(function (recordedRequests) {
    const body = validateRequests(recordedRequests)
    const event = JSON.parse(decodeBase64(body.arg))
    cy.wrap(this.lastCartSession).then(function(lastCartSession) {
      expect(lastCartSession).to.have.lengthOf(64)
      expect(event.session).to.have.lengthOf(64)
      expect(event.session).to.eq(lastCartSession)
      cy.wrap(event.session).as('lastCartSession')
    })
  })
})

Then('No webhook is sent', () => {
  cy.log('Validating the no webhook was sent')
  cy.wrap(Mockclient.retrieveRecordedRequests(
    {
      'path': '/my_fair_endpoint',
      'headers': {
        'X-WC-Webhook-Topic': ["action.wc_drip_woocommerce_cart_event"]
      }
    }
  )).then(function (recordedRequests) {
    expect(recordedRequests).to.have.lengthOf(0)
  })
})

const validateRequests = function (requests) {
  expect(requests).to.have.lengthOf(1)
  const request = requests[0]
  expect(Object.keys(request.headers)).contains('User-Agent')
  expect(request.headers['User-Agent'][0]).match(/.*WooCommerce\/\d+\.\d+\.\d+.*Hookshot.*\(WordPress\/\d+\.\d+\.\d+\)/)
  return JSON.parse(request.body.string)
}

const validateRequestBody = function (body) {
  expect(body.action).to.eq('wc_drip_woocommerce_cart_event')
  console.log(decodeBase64(body.arg))
  const event = JSON.parse(decodeBase64(body.arg))
  cy.wrap([
    'event_action',
    'session',
    'customer_email',
    'cart_data',
    'grand_total',
    'total_discounts',
    'total_taxes',
    'total_fees',
    'total_shipping',
    'currency'
  ]).each(function(item) {
    expect(Object.keys(event)).contains(item)
    expect(event[item], `body.arg[${item}]`).to.not.be.null;
  })
  expect(event.event_action).to.eq('updated')
  expect(event.customer_email).to.eq('myfairuser@example.com')
  expect(Number(event.total_discounts)).to.eq(0)
  expect(Number(event.total_taxes)).to.eq(0)
  expect(Number(event.total_fees)).to.eq(0)
  expect(Number(event.total_shipping)).to.eq(0)
  expect(event.currency).to.eq('GBP')
  return event;
}

const validateMyFairWidget = function (event, quantity = 1) {
  const product = findWidget(event.cart_data)
  expect(product.product_id.toString()).to.eq('6') // only works because we reset the entire db with each scenerio
  expect(product.product_variant_id.toString()).to.eq('6')
  expect(product.sku).to.eq('fair-widg-12345')
  expect(product.name).to.eq('My Fair Widget')
  expect(product.quantity).to.eq(quantity)
  expect(product.price.toString()).to.eq('10.99')
  expect(product.taxes.toString()).to.eq('0')
  expect(product.total.toString()).to.eq(`${10.99 * quantity}`)
  expect(product.product_url).to.eq('http://localhost:3007/?product=fair-widget')
  expect(product.image_url).contains('<img')
  expect(product.image_url).contains('http://localhost:3007/wp-content/plugins/woocommerce/assets/images/placeholder.png')
  expect(product.categories).to.have.lengthOf(1)
  expect(product.categories[0]).to.eq('my fair category')
  return product
}

const validateMyFairGizmo = function (event, quantity = 1) {
  const product = findGizmo(event.cart_data)
  expect(product.product_id.toString()).to.eq('7') // only works because we reset the entire db with each scenerio
  expect(product.product_variant_id.toString()).to.eq('7')
  expect(product.sku).to.eq('fair-gzmo-67890')
  expect(product.name).to.eq('My Fair Gizmo')
  expect(product.quantity).to.eq(quantity)
  expect(product.price.toString()).to.eq('11.11')
  expect(product.taxes.toString()).to.eq('0')
  expect(product.total.toString()).to.eq(`${11.11 * quantity}`)
  expect(product.product_url).to.eq('http://localhost:3007/?product=fair-gizmo')
  expect(product.image_url).contains('<img')
  expect(product.image_url).contains('http://localhost:3007/wp-content/plugins/woocommerce/assets/images/placeholder.png')
  expect(product.categories).to.have.lengthOf(1)
  expect(product.categories[0]).to.eq('my fair category')
  return product
}

const findWidget = function(cart_data) {
  return findProduct(6, cart_data)
}

const findGizmo = function(cart_data) {
  return findProduct(7, cart_data)
}

const findProduct = function(product_id, cart_data) {
  if(cart_data[Object.keys(cart_data)[0]].product_id === product_id) {
    return cart_data[Object.keys(cart_data)[0]]
  }
  return cart_data[Object.keys(cart_data)[1]]
}

// attribution: https://stackoverflow.com/a/15016605
const decodeBase64 = function(s) {
  console.log(s)
  var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
  var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for(i=0;i<64;i++){e[A.charAt(i)]=i;}
  for(x=0;x<L;x++){
      c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
      while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
  }
  return r;
};
