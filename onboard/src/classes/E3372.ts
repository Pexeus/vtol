import { TypedEmitter } from "tiny-typed-emitter";
import axios from "axios"
import { XMLParser } from "fast-xml-parser";
import { LTEConnectionStatus } from "../types.js";

interface Events {
    "status": (status: LTEConnectionStatus) => void;
}

export class E3372 extends TypedEmitter<Events> {
    private headers: { [key: string]: string }
    private updateInteval: number
    private parser: XMLParser

    constructor(updateIntervalMs: number) {
        super()

        this.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0",
            "Accept": "*/*",
            "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
            "_ResponseSource": "Broswer",
            "Update-Cookie": "UpdateCookie",
            "X-Requested-With": "XMLHttpRequest"
        }
        this.updateInteval = updateIntervalMs
        this.parser = new XMLParser()

        this.watch()
    }

    watch() {
        setInterval(async () => {
            try {
                const res = await axios.get("http://192.168.8.1/api/monitoring/status", {
                    headers: this.headers
                })

                const obj = this.parser.parse(res.data as string)
                
                const status: LTEConnectionStatus = {
                    signalMax: obj.response.maxsignal,
                    signalStrength: obj.response.SignalIcon
                }
                
                this.emit("status", status)
            }
            catch (err: any) {
                console.log(`Failed to query LTE Connectivity Status: ${err.message}`);
            }
        }, this.updateInteval);
    }
}