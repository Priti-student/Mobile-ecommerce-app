import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false },
)

const giftSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    printedPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellerMobileNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 60,
      default: 'General',
    },
    images: {
      type: [imageSchema],
      validate: {
        validator(images) {
          return images.length >= 1 && images.length <= 5
        },
        message: 'Each product must have between 1 and 5 images.',
      },
    },
    // Legacy fields kept for older records
    imageUrl: { type: String },
    imagePublicId: { type: String, default: '' },
    gift: {
      type: giftSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

function normalizeProduct(ret) {
  if ((!ret.images || ret.images.length === 0) && ret.imageUrl) {
    ret.images = [{ url: ret.imageUrl, publicId: ret.imagePublicId ?? '' }]
  }

  ret.sellerMobileNumber =
    ret.sellerMobileNumber ||
    ret.sellerContactNumber ||
    ret.sellerMobile ||
    ret.sellerPhone ||
    ret.contactNumber ||
    ret.mobileNumber ||
    ret.phone ||
    ''

  ret.imageUrl = ret.images?.[0]?.url ?? ret.imageUrl ?? ''
  ret.id = ret._id.toString()
  delete ret._id
  delete ret.__v
  return ret
}

productSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    return normalizeProduct(ret)
  },
})

export const Product = mongoose.models.Product ?? mongoose.model('Product', productSchema)
