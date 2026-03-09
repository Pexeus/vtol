import { Client } from "../Client.js";

const client = new Client("testclient")
await client.connect("localhost", 4000)