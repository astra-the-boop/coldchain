import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import axios from "axios";
import { AnyNode } from "domhandler";

function getFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else {
            results.push(fullPath);
        }
    });

    return results
}

function findImg(html: string) {
    const $ = cheerio.load(html);
    const imgs: any[] = [];

    $("img").each((_: any, el: any) => {
        const src = $(el).attr("src");
        if (src && src.startsWith("http")) {
            imgs.push(src)
        }
    });

    return imgs;
}


async function download(url: any, output: fs.PathLike) {
    const response = await axios({
        url, method: "GET", responseType: "stream",
    });

    return new Promise((res, rej) => {
        const writer = fs.createWriteStream(output);
        response.data.pipe(writer);

        writer.on("finish", res);
        writer.on("error", rej);
    })
}

function replaceImgs(html: string | Buffer | AnyNode | AnyNode[], repl:Record<string,string>){
    const $ = cheerio.load(html);

    $("img").each((_, el) => {
        const src:string = $(el).attr("src") as string;
        if(repl[src]){
            $(el).attr("src", repl[src]);
        }
    });

    return $.html();
}


async function main(){
    const files = getFiles("/Users/astra.celestine/Desktop/site-copy");

    for(const file of files){
        if(!file.endsWith(".html")) continue;
        const html = fs.readFileSync(file, "utf8");
        const imgs = findImg(html);

        const repl:Record<string,string> = {};

        for(const url of imgs) {
            try{
                const filename = path.basename(url);
                const localPath = `./imgs/${filename}`;

                await download(url, path.join("site-copy", "imgs", filename));
                repl[url] = localPath;
            } catch(err){
                console.log(`${url} error: ${err}`)
            }
        }

        const newHTML = replaceImgs(html, repl);
        fs.writeFileSync(file, newHTML);
    }
}

main().catch(console.error);