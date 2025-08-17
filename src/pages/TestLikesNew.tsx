import React, { useEffect, useState } from 'react'
import { API_ENDPOINTS } from '../config/api.config'
import LikesTest from '../components/LikesTest'
import { UserContext } from '../UserContext'

interface Post {
  _id: string
  title: string
  likes: string[]
  dislikes: string[]
}

export default function TestLikesNew() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { userInfo } = UserContext()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.posts.getAll(), {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Test du système de likes</h1>
      
      {!userInfo && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Vous devez être connecté pour tester les likes. 
            <a href="/login" className="underline ml-1">Se connecter</a>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p>Aucun post trouvé</p>
        ) : (
          posts.slice(0, 5).map(post => (
            <div key={post._id} className="space-y-2">
              <h3 className="font-medium">{post.title}</h3>
              <LikesTest
                postId={post._id}
                initialLikes={post.likes || []}
                initialDislikes={post.dislikes || []}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}