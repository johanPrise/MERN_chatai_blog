import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/App.css";

function Register() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [email, setEmail] = useState<string>("");
  const navigate = useNavigate();

  async function register(ev: React.FormEvent<HTMLFormElement>) {
      ev.preventDefault();
      const response = await fetch("api/register/", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, email }),
      });

      if (!response.ok) {
          alert("Registration failed");
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();
      console.log(jsonResponse);
      alert("Registration successful");
      navigate("/login");
  }

  return (
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
              <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                  <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                      Sign up to your account
                  </h2>
              </div>
              <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
              <form onSubmit={register} className="space-y-6" action="#" method="POST">
                            <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-lime-600 sm:text-sm sm:leading-6"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
          </div>
                      <div>
                          <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                              Username
                          </label>
                          <div className="mt-2">
                              <input
                                  id="username"
                                  name="username"
                                  type="text"
                                  autoComplete="username"
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
                          </div>
                          <div className="mt-2">
                              <input
                                  id="password"
                                  name="password"
                                  type="password"
                                  autoComplete="current-password"
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
                              Sign up
                          </button>
                      </div>
                  </form>
                  <p className="mt-10 text-center text-sm text-gray-500">
                      Already registered?{" "}
                      <Link className="font-semibold leading-6 text-lime-600 hover:text-lime-500" to="/login_page">
                          Go to login
                      </Link>
                  </p>
              </div>
          </div>
  );
}

export default Register;
