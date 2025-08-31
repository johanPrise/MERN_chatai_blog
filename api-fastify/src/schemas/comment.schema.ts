import { FastifySchema } from 'fastify';

/**
 * Schéma pour la validation de la récupération des commentaires d'un article
 */
export const getCommentsSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      post: { type: 'string' },
    },
    required: ['post'],
  },
  querystring: {
    type: 'object',
    properties: {
      parent: { type: 'string' },
      page: { type: 'number', minimum: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        comments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              content: { type: 'string' },
              post: { type: 'string' },
              author: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  username: { type: 'string' },
                  profilePicture: { type: 'string', nullable: true },
                },
              },
              parent: { type: 'string', nullable: true },
              likes: {
                type: 'array',
                items: { type: 'string' },
              },
              dislikes: {
                type: 'array',
                items: { type: 'string' },
              },
              likeCount: { type: 'number' },
              dislikeCount: { type: 'number' },
              isLiked: { type: 'boolean', nullable: true },
              isDisliked: { type: 'boolean', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              replies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    content: { type: 'string' },
                    post: { type: 'string' },
                    author: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        username: { type: 'string' },
                        profilePicture: { type: 'string', nullable: true },
                      },
                    },
                    parent: { type: 'string' },
                    likes: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    dislikes: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    likeCount: { type: 'number' },
                    dislikeCount: { type: 'number' },
                    isLiked: { type: 'boolean', nullable: true },
                    isDisliked: { type: 'boolean', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation de la récupération d'un commentaire par ID
 */
export const getCommentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            content: { type: 'string' },
            post: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                username: { type: 'string' },
                profilePicture: { type: 'string', nullable: true },
              },
            },
            parent: { type: 'string', nullable: true },
            likes: {
              type: 'array',
              items: { type: 'string' },
            },
            dislikes: {
              type: 'array',
              items: { type: 'string' },
            },
            likeCount: { type: 'number' },
            dislikeCount: { type: 'number' },
            isLiked: { type: 'boolean', nullable: true },
            isDisliked: { type: 'boolean', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation de la création d'un commentaire
 */
export const createCommentSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['content', 'post'],
    properties: {
      content: { type: 'string', minLength: 1, maxLength: 1000 },
      post: { type: 'string' },
      parent: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            content: { type: 'string' },
            post: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                username: { type: 'string' },
                profilePicture: { type: 'string', nullable: true },
              },
            },
            parent: { type: 'string', nullable: true },
            likes: {
              type: 'array',
              items: { type: 'string' },
            },
            dislikes: {
              type: 'array',
              items: { type: 'string' },
            },
            likeCount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation de la mise à jour d'un commentaire
 */
export const updateCommentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['content'],
    properties: {
      content: { type: 'string', minLength: 1, maxLength: 1000 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    403: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation de la suppression d'un commentaire
 */
export const deleteCommentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    403: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation du like d'un commentaire
 */
export const likeCommentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        likes: {
          type: 'array',
          items: { type: 'string' },
        },
        dislikes: {
          type: 'array',
          items: { type: 'string' },
        },
        likeCount: { type: 'number' },
        dislikeCount: { type: 'number' },
        isLiked: { type: 'boolean' },
        isDisliked: { type: 'boolean' },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation du unlike d'un commentaire
 */
export const unlikeCommentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        likes: {
          type: 'array',
          items: { type: 'string' },
        },
        dislikes: {
          type: 'array',
          items: { type: 'string' },
        },
        likeCount: { type: 'number' },
        dislikeCount: { type: 'number' },
        isLiked: { type: 'boolean' },
        isDisliked: { type: 'boolean' },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation du dislike d'un commentaire
 */
export const dislikeCommentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        likes: {
          type: 'array',
          items: { type: 'string' },
        },
        dislikes: {
          type: 'array',
          items: { type: 'string' },
        },
        likeCount: { type: 'number' },
        dislikeCount: { type: 'number' },
        isLiked: { type: 'boolean' },
        isDisliked: { type: 'boolean' },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};
