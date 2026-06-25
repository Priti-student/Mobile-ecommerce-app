import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Cart } from '../models/Cart.js'
import { Product } from '../models/Product.js'

const router = Router()

// GET /api/cart — fetch the current user's cart with populated product data
router.get('/', requireAuth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId')

    if (!cart) {
      return res.json({ items: [] })
    }

    const items = cart.items
      .filter((item) => item.productId != null)
      .map((item) => ({
        productId: item.productId._id.toString(),
        quantity: item.quantity,
        product: item.productId.toJSON(),
      }))

    res.json({ items })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to load cart.' })
  }
})

// POST /api/cart/sync — replace the entire cart with the provided items
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { items } = req.body ?? {}

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array.' })
    }

    // Validate each item has productId and quantity
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ message: 'Each item must have a valid productId and quantity >= 1.' })
      }
    }

    // Upsert the cart
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })) },
      { upsert: true, runValidators: true },
    )

    // Return the updated cart with populated products
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId')

    const populatedItems = (cart?.items ?? [])
      .filter((item) => item.productId != null)
      .map((item) => ({
        productId: item.productId._id.toString(),
        quantity: item.quantity,
        product: item.productId.toJSON(),
      }))

    res.json({ items: populatedItems })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to sync cart.' })
  }
})

// POST /api/cart/add — add a single item (or increment quantity)
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body ?? {}

    if (!productId) {
      return res.status(400).json({ message: 'productId is required.' })
    }

    // Verify the product exists and has stock
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const qty = Math.min(Math.max(1, Number(quantity)), product.stock)

    const cart = await Cart.findOne({ userId: req.user.id })

    if (!cart) {
      // Create a new cart with this item
      await Cart.create({
        userId: req.user.id,
        items: [{ productId, quantity: qty }],
      })
    } else {
      const existingIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId,
      )

      if (existingIndex >= 0) {
        const updatedQty = Math.min(cart.items[existingIndex].quantity + qty, product.stock)
        cart.items[existingIndex].quantity = updatedQty
      } else {
        cart.items.push({ productId, quantity: qty })
      }

      await cart.save()
    }

    // Return updated cart
    const updatedCart = await Cart.findOne({ userId: req.user.id }).populate('items.productId')

    const items = (updatedCart?.items ?? [])
      .filter((item) => item.productId != null)
      .map((item) => ({
        productId: item.productId._id.toString(),
        quantity: item.quantity,
        product: item.productId.toJSON(),
      }))

    res.json({ items })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to add item to cart.' })
  }
})

// PATCH /api/cart/item/:productId — update quantity of a specific item
router.patch('/item/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params
    const { quantity } = req.body ?? {}

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: 'Quantity must be a number >= 0.' })
    }

    const cart = await Cart.findOne({ userId: req.user.id })
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' })
    }

    if (quantity === 0) {
      // Remove the item
      cart.items = cart.items.filter((item) => item.productId.toString() !== productId)
    } else {
      const product = await Product.findById(productId)
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' })
      }

      const item = cart.items.find((i) => i.productId.toString() === productId)
      if (!item) {
        return res.status(404).json({ message: 'Item not found in cart.' })
      }

      item.quantity = Math.min(quantity, product.stock)
    }

    await cart.save()

    const updatedCart = await Cart.findOne({ userId: req.user.id }).populate('items.productId')

    const items = (updatedCart?.items ?? [])
      .filter((item) => item.productId != null)
      .map((item) => ({
        productId: item.productId._id.toString(),
        quantity: item.quantity,
        product: item.productId.toJSON(),
      }))

    res.json({ items })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update cart item.' })
  }
})

// DELETE /api/cart/item/:productId — remove a specific item
router.delete('/item/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params

    const cart = await Cart.findOne({ userId: req.user.id })
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' })
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId)
    await cart.save()

    const updatedCart = await Cart.findOne({ userId: req.user.id }).populate('items.productId')

    const items = (updatedCart?.items ?? [])
      .filter((item) => item.productId != null)
      .map((item) => ({
        productId: item.productId._id.toString(),
        quantity: item.quantity,
        product: item.productId.toJSON(),
      }))

    res.json({ items })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to remove item from cart.' })
  }
})

// DELETE /api/cart — clear the entire cart
router.delete('/', requireAuth, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id })
    res.json({ items: [] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to clear cart.' })
  }
})

export default router