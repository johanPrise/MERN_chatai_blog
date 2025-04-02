"use client"

// src/pages/EditPost.tsx
import  React from "react"
import { useState, useEffect, type FormEvent } from "react"
import Editor from "../components/Editor.tsx"
import { useParams, Navigate } from "react-router-dom"
import "../css/App.css"
import "react-quill/dist/quill.snow.css"

const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  const [content, setContent] = useState<string>("")
  const [redirect, setRedirect] = useState<boolean>(false)

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`https://mern-backend-neon.vercel.app/posts/${id}`)
        const postInfo = await response.json()
        setTitle(postInfo.title)
        setSummary(postInfo.summary)
        setContent(postInfo.content)
      } catch (error) {
        console.error("Error fetching post data:", error)
      }
    }

    fetchPostData()
  }, [id])

  const updatePost = async (ev: FormEvent) => {
    ev.preventDefault()
    try {
      const response = await fetch(`https://mern-backend-neon.vercel.app/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://mern-backend-neon.vercel.app/",
          "Access-Control-Request-Method": "PUT",
        },
        body: JSON.stringify({ title, summary, content }),
        credentials: "include",
      })
      if (response.ok) {
        setRedirect(true)
      }
    } catch (error) {
      console.error(error)
    }
  }

  if (redirect) {
    return <Navigate to={`/Post/${id}`} />
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Update your post</h1>
        <form onSubmit={updatePost} className="mb-0 mt-6 bg-white space-y-4 rounded-lg p-4 shadow-lg sm:p-6 lg:p-8">
          <input
            type="title"
            placeholder="Enter your Title"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
          />
          <input
            type="summary"
            placeholder="Enter your Summary"
            value={summary}
            onChange={(ev) => setSummary(ev.target.value)}
            className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
          />
          <Editor onChange={setContent} value={content} />
          <button
            type="submit"
            className="block w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white"
            style={{ marginTop: "8em" }}
          >
            Update your post
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditPost

