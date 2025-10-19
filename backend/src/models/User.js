import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: function () {
            // Password only required if not using OAuth
            return !this.googleId;
        },
        minlength: [6, 'Password must be at least 6 characters long']
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    picture: {
        type: String
    },
    authType: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    preferences: {
        currency: {
            type: String,
            default: 'INR'
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    }
}, {
    timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash password if it's modified and not using OAuth
    if (!this.isModified('password') || this.googleId) return next()

    try {
        const salt = await bcrypt.genSalt(12)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (error) {
        next(error)
    }
})

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password)
    } catch (error) {
        throw new Error(error)
    }
}

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject()
    delete userObject.password
    return userObject
}

const User = mongoose.model('User', userSchema)

export default User