"use client"

import { useState, type FormEvent } from "react"
import "../css/App.css"
import { Navigate, Link, useNavigate } from "react-router-dom"
import { UserContext } from "../UserContext"
import React from "react"

/**
 * Logs in the user by sending a POST request to the login API endpoint with the provided username and password.
 *
 * @param {FormEvent} ev - The event triggering the login action.
 * @return {void}
 */
function Login(): JSX.Element {
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [redirect, setRedirect] = useState<boolean>(false)
  const navigate = useNavigate();
  const { setUserInfo } = UserContext() // Appel comme fonction

  /**
   * Asynchronously logs in the user by sending a POST request to the login API endpoint with the provided username and password.
   *
   * @param {FormEvent} ev - The event triggering the login action.
   * @return {void}
   */
  const login = async (ev: FormEvent) => {
    ev.preventDefault()
    try {
      const response = await fetch("https://mern-backend-neon.vercel.app/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (response.ok) {
        const userData = await response.json()
        setUserInfo(userData)
        await checkAuth() // Force la vérification immédiate
        navigate("/", { replace: true })
      }
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  if (redirect) {
    return <Navigate to="/" />
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={login}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
              Username
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-lime-600 sm:text-sm sm:leading-6"
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Password
              </label>
              <div className="text-sm">
                <a href="/forgot_password" className="font-semibold text-lime-600 hover:text-lime-500">
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-lime-600 sm:text-sm sm:leading-6"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-lime-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-lime-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600"
            >
              Sign in
            </button>
          </div>
        </form>
        <p className="mt-10 text-center text-sm text-gray-500">
          Not yet registered?{" "}
          <Link className="font-semibold leading-6 text-lime-600 hover:text-lime-500" to="/register_page">
            Go Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
async function checkAuth(): Promise<void> {
    try {
        const response = await fetch("https://mern-backend-neon.vercel.app/users/profile", {
            credentials: "include",
        });
        if (!response.ok) {
            console.error("Authentication check failed:", response.statusText);
            return;
        }
        // Optionally, you can update user context or perform other actions
        const userData = await response.json();
        // For example, update the user info if needed:
        // setUserInfo(userData);
    } catch (error) {
        console.error("Error during authentication check:", error);
    }
}

