import mongoose from 'mongoose'

const securityQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['vendor', 'customer'],
      required: true,
    },
    securityQuestions: {
      type: [securityQuestionSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  },
)

userSchema.index({ email: 1, role: 1 }, { unique: true })

function normalizeUser(ret) {
  ret.id = ret._id.toString()
  delete ret._id
  delete ret.__v
  delete ret.password_hash
  return ret
}

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    return normalizeUser(ret)
  },
})

export const User = mongoose.models.User ?? mongoose.model('User', userSchema)