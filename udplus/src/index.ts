import { log } from "console";
import { Server } from "./Server.js";
import { Client } from "./Client.js";
import { sleep } from "./util.js";

async function debug() {
    const server = new Server()
    await server.listen(4000)

    server.on("client", client => {
        console.log("Client Connected:", client.identifier);

        client.on("disconnect", () => {
            console.log(`client ${client.identifier} disconnected`);
        })

        client.on("reconnect", () => {
            console.log(`client ${client.identifier} reconnected`);
        })

        client.on('test', async msg => {
            console.log(msg);
            await client.send('test', 'server => client', true)
            console.log('server => client confirmed');
        })
    })

    console.log('server online!')

    const client = new Client("test_client");

    await client.connect("localhost", 4000)
    console.log('connected');

    client.on('test', msg => console.log(msg))
    await client.send('test', 'client => server', true)
    console.log('client => server confirmed');
}

export {
    Client,
    Server,
}
