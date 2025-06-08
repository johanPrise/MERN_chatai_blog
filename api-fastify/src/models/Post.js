const postSchema = new mongoose.Schema(
  {
    // ... autres champs existants
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: []
    }],
    likeCount: {
      type: Number,
      default: 0
    },
    dislikedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: []
    }],
    dislikeCount: {
      type: Number,
      default: 0
    },
    // ... autres champs existants
