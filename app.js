//variables
const cartBtn = document.querySelector('.cart-btn')
const closeCartBtn = document.querySelector('.close-cart')
const clearCartBtn = document.querySelector('.clear-cart')
const cartDOM = document.querySelector('.cart')
const cartOverlay = document.querySelector('.cart-overlay')
const cartItems = document.querySelector('.cart-items')
const cartTotal = document.querySelector('.cart-total')
const cartContent = document.querySelector('.cart-content')
const productsDOM = document.querySelector('.products-center')
const foodSection = document.querySelector('.foods')
const signIn = document.querySelector('.sign-in')
const bars = document.querySelector('.fa-bars')
const bannerBtn = document.querySelector('.banner-btn')
const allfoods = document.querySelectorAll('h3')
const productLoader = document.querySelector('.product-loader')

//welcome message
const welcomeContainer = document.querySelector('.welcome-container')
const welcomeText = document.querySelector('.welcome-text')
const welcomeBtn = document.querySelector('.welcome-btn')
let signedInUsername

//authentication
const clientID = '628084701663-cc7u7t9cdnka95t6ai52n5js4rt8r241.apps.googleusercontent.com'
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"]
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly"
const authorizeButton = document.getElementById('authorize-button')
const signoutButton = document.getElementById('signout-button')
const content = document.getElementById('main')
const container = document.querySelector('.container')

//load auth2 library
function handleClientLoad() {
    gapi.load('client:auth2', initClient)
}

//init API client library 
function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: clientID,
        scope: 'profile'
    }).then(() => {
        //listen for sign in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus)
        //handle initial sign in state
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get())
        authorizeButton.onclick = handleAuthClick
        signoutButton.onclick = handleSignoutClick
    }).then(() => {
        gapi.client.load('oauth2', 'v2', function () {
            gapi.client.oauth2.userinfo.get().execute(function (resp) {
              // Shows user email first name
              signedInUsername = resp.given_name
            })
          });
    }).then( () => {
        setTimeout(() => {
            welcomeText.innerText = `
            Dear ${signedInUsername ? signedInUsername : 'Mr/Mrs'} on behalf of all staff we welcome you to Mama Ebo pepper rice online shop! we offer a variety of mouth watering dishes for your consumption, just scroll to the products section add a product to your cart, view your cart by clicking on the cart icon on the top-right corner, close and click order now. It's that easy!`
            
        },3000)
    }).catch(error => console.log(error))
}

function updateSignInStatus(isSignedIn) {
    if (!isSignedIn) {
        content.style.display = 'block'
        signoutButton.style.display = 'block'
        signIn.style.display = 'none'
        cartBtn.style.display = 'block'
    }
    else {
        signIn.style.display = 'flex'
        content.style.display = 'none'
        signoutButton.style.display = 'none'
        authorizeButton.style.display = 'block'
        cartBtn.style.display = 'none'
    }
}

//handle login
function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn()
}

//handle logout
function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut()
}

// cart
let cart = []
//buttons
let buttonsDOM = []
//total
let overallItemsTotal
let finalItemsCost

class Products {
    addListener() {
        let product
        foodSection.addEventListener('click', event => {
            if (event.target.parentElement.getAttribute('data-food') === 'food') {
                const defaultStyle = {color:'gray','text-decoration': 'none'}
                allfoods.forEach(food => Object.assign(food.style, defaultStyle))

                const style = { color:'#e78a32', 'text-decoration': 'underline', 'font-weight': 'bolder'}
                Object.assign(event.target.style, style)
                
                product = event.target.innerText
            }
            let ui = new UI()
            product = this.getProducts(product).then(products => {
                ui.displayProducts(products)
                Storage.saveProducts(products)
            }).then(() => {
                ui.getBagButtons()
                ui.cartLogic()
            })
        })

    }
    async getProducts(product) {
        try {
            let result = await fetch(`./products/${product}.json`)
            let data = await result.json()
            let products = data.items
            products = products.map(item => {
                const { title, price } = item.fields
                const { id } = item.sys
                const image = item.fields.image.fields.file.url
                return { title, price, id, image }
            })
            return products
        }
        catch (error) {
            console.log(error)
        }
    }
}

// display products
class UI {
    displayProducts(products) {
        let result = ''
        products.forEach(product => {
            result += `
            <article class="product">
            <div class="img-container">
                <img src=${product.image} alt="product" class="product-img">
                <button class="bag-btn" data-id=${product.id}>
                    <i class="fas fa-shopping-cart">add to cart</i>
                </button>
            </div>
            <h3>${product.title}</h3>
            <h4>₦${this.numberWithCommas(product.price)}</h4>
        </article>
           `
        })

        productLoader.style.display = 'grid'
        productsDOM.innerHTML = ''

          setTimeout(() => {
            productLoader.style.display = 'none'
            productsDOM.innerHTML = result
            this.getBagButtons()
        }, 3000)
    }
    getBagButtons() {        
        const buttons = [...document.querySelectorAll('.bag-btn')]
        
        buttonsDOM = buttons
        buttons.forEach(button => {
            let id = button.dataset.id
            let inCart = cart.find(item => item.id === id)
            if (inCart) {
                button.innerText = 'In Cart'
                button.disabled = true
            }
            button.addEventListener('click', event => {                
                event.target.innerText = 'In Cart'
                if (event.target.disabled === undefined || event.target.disabled === false) {
                    event.target.disabled = true
                    //get product from products
                    let cartItem = { ...Storage.getProduct(id), amount: 1 }
                    //add product to the cart
                    cart = [...cart, cartItem]
                    //save cart in local storage
                    Storage.saveCart(cart)
                    //set cart values
                    this.setCartValues(cart)
                    //display cart items
                    this.addCartItem(cartItem)
                    //show the cart
                    // this.showCart()
                }
            })
        })
    }
    setCartValues(cart) {
        let tempTotal = 0
        let itemsTotal = 0
        cart.map(item => {
            tempTotal += item.price * item.amount
            itemsTotal += item.amount
        })
        tempTotal =  this.numberWithCommas(parseFloat(tempTotal.toFixed(2)))
        cartTotal.innerText = tempTotal
        cartItems.innerText = itemsTotal
        overallItemsTotal = itemsTotal
        finalItemsCost = tempTotal
    }
    addCartItem(item) {
        const div = document.createElement('div')
        div.classList.add('cart-item')
        div.innerHTML = `
        <img src=${item.image} alt="product">
        <div>
            <h4>${item.title}</h4>
            <h5>₦${this.numberWithCommas(item.price)}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>
        `
        cartContent.appendChild(div)
    }
    showCart() {
        cartOverlay.classList.add('transparentBcg')
        cartDOM.classList.add('showCart')
    }
    setupApp() {
        cart = Storage.getCart()
        this.setCartValues(cart)
        this.populateCart(cart)
        this.makeFinalOrder()
        cartBtn.addEventListener('click', this.showCart)
        closeCartBtn.addEventListener('click', this.hideCart)
    }
    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item))
    }
    hideCart() {
        cartOverlay.classList.remove('transparentBcg')
        cartDOM.classList.remove('showCart')
    }
    cartLogic() {
        //clear cart button
        clearCartBtn.addEventListener('click', () => this.clearCart())
        //cart functionality
        cartContent.addEventListener('click', event => {
            if (event.target.classList.contains('remove-item')) {
                let removeItem = event.target
                let id = removeItem.dataset.id
                cartContent.removeChild(removeItem.parentElement.parentElement)
                this.removeItem(id)
            }
            else if (event.target.classList.contains('fa-chevron-up')) {
                let addAmount = event.target
                let id = addAmount.dataset.id
                let tempItem = cart.find(item => item.id === id)
                tempItem.amount = tempItem.amount + 1
                Storage.saveCart(cart)
                this.setCartValues(cart)
                addAmount.nextElementSibling.innerText = tempItem.amount
            }
            else if (event.target.classList.contains('fa-chevron-down')) {
                let lowerAmount = event.target
                let id = lowerAmount.dataset.id
                let tempItem = cart.find(item => item.id === id)
                tempItem.amount = tempItem.amount - 1
                if (tempItem.amount > 0) {
                    Storage.saveCart(cart)
                    this.setCartValues(cart)
                    lowerAmount.previousElementSibling.innerText = tempItem.amount
                }
                else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement)
                    this.removeItem(id)
                }
            }
        })
    }
    clearCart() {
        let cartItems = cart.map(item => item.id)
        cartItems.forEach(id => this.removeItem(id))
        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0])
        }
        this.hideCart()
    }
    removeItem(id) {
        cart = cart.filter(item => item.id !== id)
        this.setCartValues(cart)
        Storage.saveCart(cart)
        let button = this.getSingleButton(id)
        button.disabled = false
        button.innerHTML = `
        <i class='fas fa-shopping-cart'></i>add to cart
        `
    }
    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id)
    }
    openBars(){
        bars.addEventListener('click',() => {
            content.style.display = 'none'
        })
    }
    makeFinalOrder(){
        bannerBtn.addEventListener('click',() => {
            if(!overallItemsTotal) alert('You haven\'t selected any items!' )
            else {
                alert(`Your order has been placed successfully! You ordered ${overallItemsTotal} item(s) with a cost of ₦${finalItemsCost}. Place more orders!`)
            this.clearCart()
            }
        })
    }
    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

// local storage
class Storage {
    static saveProducts(products) {
        localStorage.setItem('products', JSON.stringify(products))
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem('products'))
        return products.find(product => product.id === id)
    }
    static saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart))
    }
    static getCart() {
        return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : []
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI()
    const products = new Products()

    // setup app
    ui.setupApp()
    products.addListener()

    welcomeBtn.addEventListener('click',() => welcomeContainer.style.display = 'none')
    welcomeContainer.style.display = 'block'

    // get default product to display
    products.getProducts('snacks').then(products => {
        ui.displayProducts(products)
        Storage.saveProducts(products)
    }).then(() => {
        ui.getBagButtons()
        ui.cartLogic()
    })

})