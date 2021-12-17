const {default: AbortController} = require("abort-controller");
const {default: fetch, Headers, Request, Response} = require("node-fetch");

import "../styles/globals.css";
const {wrapper} = require("../redux/store");
import type {AppProps} from "next/app";

Object.assign(globalThis, {
    fetch,
    Headers,
    Request,
    Response,
    AbortController,
});

export function MyApp({Component, pageProps}: AppProps) {
    return <Component {...pageProps} />;
}

export default wrapper.withRedux(MyApp);
