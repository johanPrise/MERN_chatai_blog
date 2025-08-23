import { FastifySchema } from 'fastify';
import { PostStatus } from '../types/post.types.js';

/**
 * Schéma pour la validation de la récupération de tous les articles
 */
export const getPostsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', minimum: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100 },
      search: { type: 'string' },
      category: { type: 'string' },
      tag: { type: 'string' },
      author: { type: 'string' },
      status: { type: 'string', enum: Object.values(PostStatus) },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        posts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              contentBlocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    data: { type: 'object', additionalProperties: true }
                  }
                },
                nullable: true
              },
              excerpt: { type: 'string', nullable: true },
              summary: { type: 'string', nullable: true },
              slug: { type: 'string' },
              author: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  username: { type: 'string' },
                  profilePicture: { type: 'string', nullable: true },
                },
              },
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                  },
                },
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
              },
              category: {
                type: ['object', 'null'],
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                }
              },
              featuredImage: { type: 'string', nullable: true },
              coverImage: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  alt: { type: 'string' }
                },
                nullable: true
              },
              images: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    alt: { type: 'string' }
                  }
                },
                nullable: true
              },
              status: { type: 'string' },
              viewCount: { type: 'number' },
              likes: { type: 'array', items: { type: 'string' } },
              dislikes: { type: 'array', items: { type: 'string' } },
              likeCount: { type: 'number' },
              dislikeCount: { type: 'number' },
              commentCount: { type: 'number' },
              isLiked: { type: 'boolean', nullable: true },
              isDisliked: { type: 'boolean', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              publishedAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  },
};

/**
 * Schéma pour la validation de la récupération d'un article par ID ou slug
 */
export const getPostSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['idOrSlug'],
    properties: {
      idOrSlug: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        post: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string', nullable: true },
            contentBlocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  data: { type: 'object', additionalProperties: true }
                }
              },
              nullable: true
            },
            excerpt: { type: 'string', nullable: true },
            summary: { type: 'string', nullable: true },
            slug: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                username: { type: 'string' },
                profilePicture: { type: 'string', nullable: true },
              },
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
            },
            category: {
              type: ['object', 'null'],
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
              }
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            featuredImage: { type: 'string', nullable: true },
            coverImage: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                alt: { type: 'string' }
              },
              nullable: true
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  alt: { type: 'string' }
                }
              },
              nullable: true
            },
            status: { type: 'string' },
            viewCount: { type: 'number' },
            likes: { type: 'array', items: { type: 'string' } },
            dislikes: { type: 'array', items: { type: 'string' } },
            likeCount: { type: 'number' },
            dislikeCount: { type: 'number' },
            commentCount: { type: 'number' },
            isLiked: { type: 'boolean', nullable: true },
            isDisliked: { type: 'boolean', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
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
 * Schéma pour la validation de la création d'un article
 */
export const createPostSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string', minLength: 1 },
      contentBlocks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            data: { type: 'object', additionalProperties: true }
          },
          required: ['type', 'data']
        }
      },
      excerpt: { type: 'string', maxLength: 500 },
      summary: { type: 'string', maxLength: 500 },
      categories: {
        type: 'array',
        items: { type: 'string' },
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      featuredImage: { type: 'string' },
      coverImage: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          alt: { type: 'string' }
        }
      },
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            alt: { type: 'string' }
          }
        }
      },
      status: { type: 'string', enum: Object.values(PostStatus) },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        post: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string', nullable: true },
            contentBlocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  data: { type: 'object', additionalProperties: true }
                }
              },
              nullable: true
            },
            excerpt: { type: 'string', nullable: true },
            summary: { type: 'string', nullable: true },
            slug: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                username: { type: 'string' },
                profilePicture: { type: 'string', nullable: true },
              },
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
            },
            category: {
              type: ['object', 'null'],
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
              }
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            featuredImage: { type: 'string', nullable: true },
            coverImage: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                alt: { type: 'string' }
              },
              nullable: true
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  alt: { type: 'string' }
                }
              },
              nullable: true
            },
            status: { type: 'string' },
            viewCount: { type: 'number' },
            likes: { type: 'array', items: { type: 'string' } },
            dislikes: { type: 'array', items: { type: 'string' } },
            likeCount: { type: 'number' },
            dislikeCount: { type: 'number' },
            commentCount: { type: 'number' },
            isLiked: { type: 'boolean', nullable: true },
            isDisliked: { type: 'boolean', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
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
  },
};

/**
 * Schéma pour la validation de la mise à jour d'un article
 */
export const updatePostSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string', minLength: 1 },
      contentBlocks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            data: { type: 'object', additionalProperties: true }
          },
          required: ['type', 'data']
        }
      },
      excerpt: { type: 'string', maxLength: 500 },
      summary: { type: 'string', maxLength: 500 }, // Ajout du champ summary pour compatibilité avec le frontend
      categories: {
        type: 'array',
        items: { type: 'string' },
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      featuredImage: { type: 'string' },
      coverImage: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          alt: { type: 'string' }
        }
      },
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            alt: { type: 'string' }
          }
        }
      },
      status: { type: 'string', enum: Object.values(PostStatus) },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        post: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string', nullable: true },
            contentBlocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  data: { type: 'object' }
                }
              },
              nullable: true
            },
            excerpt: { type: 'string', nullable: true },
            slug: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                username: { type: 'string' },
                profilePicture: { type: 'string', nullable: true },
              },
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
            },
            category: {
              type: ['object', 'null'],
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
              }
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            featuredImage: { type: 'string', nullable: true },
            coverImage: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                alt: { type: 'string' }
              },
              nullable: true
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  alt: { type: 'string' }
                }
              },
              nullable: true
            },
            status: { type: 'string' },
            viewCount: { type: 'number' },
            likes: { type: 'array', items: { type: 'string' } },
            dislikes: { type: 'array', items: { type: 'string' } },
            likeCount: { type: 'number' },
            dislikeCount: { type: 'number' },
            commentCount: { type: 'number' },
            isLiked: { type: 'boolean', nullable: true },
            isDisliked: { type: 'boolean', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
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

export const dislikePostSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'ID de l\'article'
      }
    }
  },
  response: {
    200: {
      description: 'Article disliké avec succès',
      type: 'object',
      properties: {
        message: { type: 'string' },
        likes: { type: 'array', items: { type: 'string' } },
        dislikes: { type: 'array', items: { type: 'string' } },
        likeCount: { type: 'number' },
        dislikeCount: { type: 'number' },
        isLiked: { type: 'boolean' },
        isDisliked: { type: 'boolean' }
      }
    },
    400: {
      description: 'Erreur de validation',
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    401: {
      description: 'Non autorisé',
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    404: {
      description: 'Article non trouvé',
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  }
};

/**
 * Schéma pour la validation de la suppression d'un article
 */
export const deletePostSchema: FastifySchema = {
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
 * Schéma pour la validation du like d'un article
 */
export const likePostSchema: FastifySchema = {
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
        likes: { type: 'array', items: { type: 'string' } },
        dislikes: { type: 'array', items: { type: 'string' } },
        likeCount: { type: 'number' },
        dislikeCount: { type: 'number' },
        isLiked: { type: 'boolean' },
        isDisliked: { type: 'boolean' },
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
 * Schéma pour la validation du unlike d'un article
 */
export const unlikePostSchema: FastifySchema = {
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
        likes: { type: 'array', items: { type: 'string' } },
        dislikes: { type: 'array', items: { type: 'string' } },
        likeCount: { type: 'number' },
        dislikeCount: { type: 'number' },
        isLiked: { type: 'boolean' },
        isDisliked: { type: 'boolean' },
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
