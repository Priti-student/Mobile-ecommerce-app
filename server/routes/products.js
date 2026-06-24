import { Router } from 'express'
import multer from 'multer'
import { deleteImage, uploadImageBuffer } from '../config/cloudinary.js'
import { requireAuth, requireVendor } from '../middleware/auth.js'
import { Product } from '../models/Product.js'

const router = Router()
const MAX_IMAGES = 5

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: MAX_IMAGES + 1,
  },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed.'))
      return
    }
    cb(null, true)
  },
})

function parseUploadedFiles(req, _res, next) {
  const files = req.files ?? []
  req.productImages = files.filter(
    (file) => file.fieldname === 'images' || file.fieldname === 'image',
  )
  req.giftImageFile = files.find((file) => file.fieldname === 'giftImage') ?? null
  next()
}

async function uploadFiles(files) {
  const uploads = []
  for (const file of files) {
    const result = await uploadImageBuffer(file.buffer)
    uploads.push({ url: result.secure_url, publicId: result.public_id })
  }
  return uploads
}

async function deleteProductImages(product) {
  const images = product.images?.length
    ? product.images
    : product.imageUrl
      ? [{ publicId: product.imagePublicId }]
      : []

  for (const image of images) {
    if (image.publicId) {
      await deleteImage(image.publicId)
    }
  }

  if (product.gift?.imagePublicId) {
    await deleteImage(product.gift.imagePublicId)
  }
}

router.get('/', async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json({ products })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to load products.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    res.json({ product })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to load product.' })
  }
})

router.post(
  '/',
  requireAuth,
  requireVendor,
  upload.any(),
  parseUploadedFiles,
  async (req, res) => {
    try {
      const { name, description, price, printedPrice, sellerMobileNumber, stock, category, hasGift, giftName, giftDescription } =
        req.body ?? {}

      if (!name?.trim()) {
        return res.status(400).json({ message: 'Product name is required.' })
      }

      const imageFiles = req.productImages ?? []
      if (imageFiles.length < 1) {
        return res.status(400).json({ message: 'Upload at least 1 product image (max 5).' })
      }
      if (imageFiles.length > MAX_IMAGES) {
        return res.status(400).json({ message: 'You can upload up to 5 images per product.' })
      }

      const parsedPrice = Number(price)
      const parsedPrintedPrice = Number(printedPrice ?? 0)
      const parsedStock = Number(stock ?? 0)

      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: 'Enter a valid sale price.' })
      }

      if (Number.isNaN(parsedPrintedPrice) || parsedPrintedPrice < 0) {
        return res.status(400).json({ message: 'Enter a valid printed price.' })
      }

      if (!sellerMobileNumber?.trim()) {
        return res.status(400).json({ message: 'Seller mobile number is required.' })
      }

      if (Number.isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ message: 'Enter a valid stock quantity.' })
      }

      const uploadedImages = await uploadFiles(imageFiles)

      let gift = null
      const giftEnabled = hasGift === 'true' || hasGift === true

      if (giftEnabled) {
        if (!giftName?.trim()) {
          return res.status(400).json({ message: 'Gift name is required when offering a free gift.' })
        }

        gift = {
          name: giftName.trim(),
          description: giftDescription?.trim() ?? '',
          imageUrl: '',
          imagePublicId: '',
        }

        if (req.giftImageFile) {
          const giftUpload = await uploadImageBuffer(req.giftImageFile.buffer, 'shopease/gifts')
          gift.imageUrl = giftUpload.secure_url
          gift.imagePublicId = giftUpload.public_id
        }
      }

      const product = await Product.create({
        name: name.trim(),
        description: description?.trim() ?? '',
        price: parsedPrice,
        printedPrice: parsedPrintedPrice,
        sellerMobileNumber: sellerMobileNumber.trim(),
        stock: parsedStock,
        category: category?.trim() || 'General',
        images: uploadedImages,
        imageUrl: uploadedImages[0].url,
        imagePublicId: uploadedImages[0].publicId,
        gift,
      })

      res.status(201).json({ product })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: error.message ?? 'Failed to create product.' })
    }
  },
)

router.patch('/:id/stock', requireAuth, requireVendor, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const { stock } = req.body
    const parsedStock = Number(stock)

    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Enter a valid stock quantity.' })
    }

    product.stock = parsedStock
    await product.save()

    res.json({ product })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update product stock.' })
  }
})

router.delete('/:id', requireAuth, requireVendor, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    await deleteProductImages(product)
    await product.deleteOne()
    res.json({ message: 'Product deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete product.' })
  }
})

export default router