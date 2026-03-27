import React from "react";
import ReactDOM from "react-dom/client";
import * as Toast from "@radix-ui/react-toast";
import App from "./App.tsx";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Toast.Provider swipeDirection="right">
            <App />
            <Toast.Viewport className="fixed right-6 top-6 z-60 flex w-360px max-w-[95vw] flex-col gap-3 outline-none" />
        </Toast.Provider>
    </React.StrictMode>,
);
