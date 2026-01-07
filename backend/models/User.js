import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['super_admin', 'store_manager', 'field_coach'],
    required: [true, 'Role is required']
  },
  // Store Manager specific fields
  storeCode: {
    type: String,
    required: function() {
      return this.role === 'store_manager';
    }
  },
  storeName: {
    type: String,
    required: function() {
      return this.role === 'store_manager';
    }
  },
  // Field Coach specific fields
  assignedStores: [{
    type: String // Store codes
  }],
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving - using async/await syntax
userSchema.pre('save', async function() {
  const user = this;
  
  // Only hash if password is modified
  if (!user.isModified('password')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    storeCode: this.storeCode,
    storeName: this.storeName,
    assignedStores: this.assignedStores,
    phone: this.phone,
    isActive: this.isActive,
    lastLogin: this.lastLogin
  };
};

const User = mongoose.model('User', userSchema);

export default User;
