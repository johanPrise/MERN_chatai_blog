import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./css/index.css";
import {BrowserRouter} from "react-router-dom";
import {DevSupport} from "@react-buddy/ide-toolbox";
import {ComponentPreviews, useInitial} from "./dev/index.js";
import { UserContextProvider } from './UserContext';

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
            <UserContextProvider>

        <BrowserRouter>
            <DevSupport ComponentPreviews={ComponentPreviews}
                        useInitialHook={useInitial}
            >
                <App/>
            </DevSupport>
        </BrowserRouter>
        </UserContextProvider>

    </React.StrictMode>
);
